import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabaseClient } from '../supabaseClient';

interface AuthGateProps {
  onSession: (session: Session) => void;
}

export default function AuthGate({ onSession }: AuthGateProps) {
  const supabase = getSupabaseClient();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        onSession(session);
      }
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        onSession(data.session);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [onSession]);

  const handleMagicLink = async (evt: React.FormEvent) => {
    evt.preventDefault();
    setIsLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Check your email for the login link.');
    }
    setIsLoading(false);
  };

  return (
    <div className="mx-auto mt-20 max-w-md rounded-lg bg-white p-8 shadow">
      <h1 className="text-2xl font-semibold text-slate-800">Sign in</h1>
      <p className="mt-2 text-sm text-slate-500">
        Use the magic link to access your organization.
      </p>
      <form className="mt-6 space-y-4" onSubmit={handleMagicLink}>
        <label className="block text-sm font-medium text-slate-700" htmlFor="email">
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <button
          type="submit"
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          disabled={isLoading}
        >
          {isLoading ? 'Sending…' : 'Send magic link'}
        </button>
      </form>
      {message ? <p className="mt-4 text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}
