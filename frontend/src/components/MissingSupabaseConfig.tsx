export default function MissingSupabaseConfig() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="max-w-lg space-y-3 rounded-lg border border-amber-200 bg-white p-6 text-center">
        <h1 className="text-lg font-semibold text-slate-800">Supabase configuration required</h1>
        <p className="text-sm text-slate-600">
          Environment variables <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> are missing.
        </p>
        <p className="text-sm text-slate-600">
          Update your <code>.env</code> file with the values from your Supabase project and restart the development server.
        </p>
      </div>
    </div>
  );
}
