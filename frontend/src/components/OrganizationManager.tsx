import { useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  role: 'owner' | 'member';
}

interface OrganizationManagerProps {
  user: User;
  onOrganizationChange: (org: Organization | null) => void;
}

export default function OrganizationManager({ user, onOrganizationChange }: OrganizationManagerProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | null>(null);

  const activeOrganization = useMemo(() => organizations[0] ?? null, [organizations]);

  useEffect(() => {
    void loadOrganizations();
  }, []);

  useEffect(() => {
    onOrganizationChange(activeOrganization);
  }, [activeOrganization, onOrganizationChange]);

  const loadOrganizations = async () => {
    setIsLoading(true);
    const { data, error: selectError } = await supabase
      .from('organization_members_view')
      .select('*')
      .eq('user_id', user.id)
      .order('is_owner', { ascending: false })
      .order('organization_name');

    if (selectError) {
      setError(selectError.message);
    } else {
      const mapped: Organization[] =
        data?.map((row) => ({
          id: row.organization_id,
          name: row.organization_name,
          slug: row.organization_slug,
          role: row.is_owner ? 'owner' : 'member',
        })) ?? [];
      setOrganizations(mapped);
    }
    setIsLoading(false);
  };

  const handleCreateOrganization = async (evt: React.FormEvent) => {
    evt.preventDefault();
    setCreating(true);
    setError(null);

    const { error: insertError } = await supabase.rpc('create_organization', {
      org_name: name,
      org_slug: slug,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setName('');
      setSlug('');
      await loadOrganizations();
    }

    setCreating(false);
  };

  const handleSwitch = (organizationId: string) => {
    const sorted = organizations
      .slice()
      .sort((a, b) => (a.id === organizationId ? -1 : b.id === organizationId ? 1 : 0));
    setOrganizations(sorted);
  };

  if (isLoading && organizations.length === 0) {
    return <p className="text-sm text-slate-600">Loading organizations…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">Organizations</h2>
        <p className="text-sm text-slate-500">
          You belong to {organizations.length} organization{organizations.length === 1 ? '' : 's'}.
        </p>
        <div className="mt-3 space-y-2">
          {organizations.map((org) => (
            <button
              key={org.id}
              className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm shadow-sm transition hover:bg-indigo-50 ${
                activeOrganization?.id === org.id
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-white text-slate-700'
              }`}
              onClick={() => handleSwitch(org.id)}
            >
              <span>
                <span className="font-medium">{org.name}</span>
                <span className="ml-2 text-xs uppercase tracking-wide text-slate-400">{org.role}</span>
              </span>
              <span className="text-xs text-slate-400">{org.slug}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-700">Create new organization</h3>
        <form className="mt-3 space-y-3" onSubmit={handleCreateOrganization}>
          <div>
            <label className="text-xs font-medium text-slate-500" htmlFor="org-name">
              Organization name
            </label>
            <input
              id="org-name"
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="Acme Inc."
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500" htmlFor="org-slug">
              URL slug
            </label>
            <input
              id="org-slug"
              type="text"
              required
              value={slug}
              onChange={(event) => setSlug(event.target.value.toLowerCase())}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="acme"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            disabled={creating}
          >
            {creating ? 'Creating…' : 'Create organization'}
          </button>
        </form>
        {error ? <p className="mt-3 text-xs text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
