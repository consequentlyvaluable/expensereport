import { useEffect, useState } from 'react';
import type { PostgrestResponse } from '@supabase/supabase-js';
import { getSupabaseClient } from '../supabaseClient';
import type { Organization } from './OrganizationManager';

export interface ExpenseReportRow {
  id: string;
  title: string;
  submitted_on: string;
  total_amount: number;
  notes: string | null;
  created_at: string;
  created_by_email: string | null;
}

interface ExpenseReportListProps {
  organization: Organization;
  refreshToken: number;
}

export default function ExpenseReportList({ organization, refreshToken }: ExpenseReportListProps) {
  const supabase = getSupabaseClient();

  const [reports, setReports] = useState<ExpenseReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    supabase
      .from('expense_reports_view')
      .select('*')
      .eq('organization_id', organization.id)
      .order('submitted_on', { ascending: false })
      .then(({ data, error: selectError }: PostgrestResponse<ExpenseReportRow>) => {
        if (!isMounted) return;
        if (selectError) {
          setError(selectError.message);
        } else {
          setReports(data ?? []);
        }
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [organization.id, refreshToken]);

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading reports…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (reports.length === 0) {
    return <p className="text-sm text-slate-500">No expense reports yet.</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Title</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Submitted
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Owner</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {reports.map((report) => (
            <tr key={report.id}>
              <td className="px-4 py-3 text-sm font-medium text-slate-700">
                <div>{report.title}</div>
                {report.notes ? <p className="mt-1 text-xs text-slate-500">{report.notes}</p> : null}
              </td>
              <td className="px-4 py-3 text-sm text-slate-600">
                {new Date(report.submitted_on).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-right text-sm text-slate-700">
                ${report.total_amount.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-sm text-slate-600">{report.created_by_email ?? 'Unknown'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
