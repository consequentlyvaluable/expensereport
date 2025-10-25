-- Enable UUID generation helpers
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Profiles table mirrors auth.users for convenient joins
create table if not exists public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    email text unique,
    full_name text,
    updated_at timestamptz default timezone('utc'::text, now())
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email, updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

create or replace function public.handle_updated_user()
returns trigger as $$
begin
  update public.profiles
  set email = new.email,
      updated_at = timezone('utc'::text, now())
  where id = new.id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create trigger on_auth_user_updated
  after update on auth.users
  for each row execute procedure public.handle_updated_user();

-- Core multi-tenant data structures
create table if not exists public.organizations (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text not null unique,
    created_by uuid not null references auth.users (id),
    created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.organization_members (
    organization_id uuid not null references public.organizations (id) on delete cascade,
    user_id uuid not null references auth.users (id) on delete cascade,
    role text not null default 'owner' check (role in ('owner', 'member')),
    joined_at timestamptz not null default timezone('utc'::text, now()),
    primary key (organization_id, user_id)
);

create index if not exists organization_members_user_idx on public.organization_members (user_id);

create table if not exists public.expense_reports (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations (id) on delete cascade,
    created_by uuid not null references auth.users (id),
    title text not null,
    submitted_on date not null,
    total_amount numeric(12,2) not null check (total_amount >= 0),
    notes text,
    created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists expense_reports_org_idx on public.expense_reports (organization_id);
create index if not exists expense_reports_created_idx on public.expense_reports (created_at desc);

-- Convenience views used by the UI
create or replace view public.organization_members_view as
select
  om.organization_id,
  o.name as organization_name,
  o.slug as organization_slug,
  om.user_id,
  om.role,
  (om.role = 'owner') as is_owner
from public.organization_members om
join public.organizations o on o.id = om.organization_id;

create or replace view public.expense_reports_view as
select
  er.id,
  er.organization_id,
  er.title,
  er.submitted_on,
  er.total_amount,
  er.notes,
  er.created_at,
  p.email as created_by_email
from public.expense_reports er
left join public.profiles p on p.id = er.created_by;

-- Function to create an organization and membership in a single transaction
create or replace function public.create_organization(org_name text, org_slug text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
begin
  if org_name is null or length(trim(org_name)) = 0 then
    raise exception 'Organization name is required';
  end if;

  if org_slug is null or length(trim(org_slug)) = 0 then
    raise exception 'Organization slug is required';
  end if;

  org_slug := lower(trim(org_slug));

  insert into public.organizations (name, slug, created_by)
  values (trim(org_name), org_slug, auth.uid())
  returning id into new_org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_org_id, auth.uid(), 'owner')
  on conflict do nothing;

  return new_org_id;
end;
$$;

-- Row Level Security configuration
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.expense_reports enable row level security;
alter table public.profiles enable row level security;

create policy "Users can view their profile" on public.profiles
  for select using (id = auth.uid());

create policy "Users can update own profile" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "Members view organizations" on public.organizations
  for select using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = organizations.id
        and om.user_id = auth.uid()
    )
  );

create policy "Owners manage organizations" on public.organizations
  for update using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = organizations.id
        and om.user_id = auth.uid()
        and om.role = 'owner'
    )
  )
  with check (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = organizations.id
        and om.user_id = auth.uid()
        and om.role = 'owner'
    )
  );

create policy "Members manage memberships" on public.organization_members
  for select using (user_id = auth.uid());

create policy "Users can join organizations they own" on public.organization_members
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.organizations o
      where o.id = organization_id
        and o.created_by = auth.uid()
    )
  );

create policy "Owners manage organization members" on public.organization_members
  for delete using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = organization_members.organization_id
        and om.user_id = auth.uid()
        and om.role = 'owner'
    )
  );

create policy "Members read expense reports" on public.expense_reports
  for select using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = expense_reports.organization_id
        and om.user_id = auth.uid()
    )
  );

create policy "Members write expense reports" on public.expense_reports
  for insert with check (
    created_by = auth.uid() and
    exists (
      select 1 from public.organization_members om
      where om.organization_id = expense_reports.organization_id
        and om.user_id = auth.uid()
    )
  );

create policy "Members update own expense reports" on public.expense_reports
  for update using (
    created_by = auth.uid()
  ) with check (
    created_by = auth.uid()
  );

create policy "Owners delete expense reports" on public.expense_reports
  for delete using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = expense_reports.organization_id
        and om.user_id = auth.uid()
        and om.role = 'owner'
    )
  );

