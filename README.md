# Expense Report HQ

A multi-tenant SaaS starter template for tracking expense reports. The application uses Supabase for authentication, row-level-security backed multitenancy, and persistence. The UI is a Vite + React front-end that interacts directly with Supabase.

## Getting started

### 1. Supabase configuration

1. Create a new Supabase project.
2. Copy the contents of [`supabase/setup.sql`](supabase/setup.sql) into the Supabase SQL editor and run it. The script will:
   - Create profile, organization, membership, and expense report tables.
   - Configure row level security policies for multi-tenant isolation.
   - Add helper views and a `create_organization` RPC used by the UI.
3. Grab the **Project URL** and **anon public** API key from Supabase settings.

### 2. Front-end setup

```bash
cd frontend
npm install
cp .env.example .env.local
```

Edit `.env.local` and set the two variables with the values from Supabase:

```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Finally, start the development server:

```bash
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173). Use the email magic link flow to sign in. After signing in you can create an organization, submit expense reports, and the data will be isolated per organization through Supabase row level security.

## Project structure

```
frontend/      # Vite + React application
supabase/      # SQL setup script for Supabase
```

## Available scripts

Inside the `frontend` directory:

- `npm run dev` – start the development server
- `npm run build` – type-check and build for production
- `npm run preview` – preview the production build locally
