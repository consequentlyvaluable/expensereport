import { useState } from 'react';
import { supabase } from '../supabaseClient';
import type { Organization } from './OrganizationManager';

interface ExpenseReportFormProps {
  organization: Organization;
  onCreated: () => void;
}

export default function ExpenseReportForm({ organization, onCreated }: ExpenseReportFormProps) {
  const [title, setTitle] = useState('');
  const [submittedAt, setSubmittedAt] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle('');
    setSubmittedAt(new Date().toISOString().slice(0, 10));
    setAmount(0);
    setNotes('');
  };

  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from('expense_reports').insert({
      organization_id: organization.id,
      title,
      submitted_on: submittedAt,
      total_amount: amount,
      notes,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      resetForm();
      onCreated();
    }

    setIsSubmitting(false);
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-slate-800">Submit new expense report</h3>
      <form className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-slate-500" htmlFor="report-title">
            Report title
          </label>
          <input
            id="report-title"
            type="text"
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500" htmlFor="submitted-on">
            Submitted on
          </label>
          <input
            id="submitted-on"
            type="date"
            required
            value={submittedAt}
            onChange={(event) => setSubmittedAt(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500" htmlFor="total-amount">
            Total amount (USD)
          </label>
          <input
            id="total-amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(parseFloat(event.target.value))}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-slate-500" htmlFor="notes">
            Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            rows={3}
          />
        </div>
        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting…' : 'Submit report'}
          </button>
        </div>
      </form>
      {error ? <p className="mt-3 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
