import { useCallback, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import AuthGate from './components/AuthGate';
import OrganizationManager, { type Organization } from './components/OrganizationManager';
import ExpenseReportForm from './components/ExpenseReportForm';
import ExpenseReportList from './components/ExpenseReportList';
import MissingSupabaseConfig from './components/MissingSupabaseConfig';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

export default function App() {
  if (!isSupabaseConfigured) {
    return <MissingSupabaseConfig />;
  }

  const supabase = getSupabaseClient();

  const [session, setSession] = useState<Session | null>(null);
  const [activeOrganization, setActiveOrganization] = useState<Organization | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const handleSession = useCallback((newSession: Session) => {
    setSession(newSession);
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setActiveOrganization(null);
  };

  const userEmail = useMemo(() => session?.user.email ?? 'Unknown user', [session]);

  if (!session) {
    return <AuthGate onSession={handleSession} />;
  }

  return (
    <div className="min-h-full bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Expense Report HQ</h1>
            <p className="text-xs text-slate-500">Signed in as {userEmail}</p>
          </div>
          <button
            onClick={signOut}
            className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:bg-slate-100"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 lg:flex-row">
        <aside className="w-full lg:max-w-sm">
          <OrganizationManager user={session.user} onOrganizationChange={setActiveOrganization} />
        </aside>

        <section className="flex-1 space-y-6">
          {activeOrganization ? (
            <>
              <ExpenseReportForm
                organization={activeOrganization}
                onCreated={() => setRefreshToken((value) => value + 1)}
              />
              <ExpenseReportList organization={activeOrganization} refreshToken={refreshToken} />
            </>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              Create or select an organization to start tracking expense reports.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
