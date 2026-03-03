'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/db/client';
import { EntryForm } from '@/components/daily-entry/entry-form';
import type { DailyEntryWithDetails } from '@/lib/db/types';

export default function EditDailyEntryPage() {
  const params = useParams();
  const router = useRouter();
  const [entry, setEntry] = useState<DailyEntryWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntry();
  }, []);

  async function loadEntry() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/daily-entry/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        
        const result = await response.json();
        console.log('result.data',result.data)
        setEntry(result.data);
      } else {
        router.push('/app/daily-entry');
      }
    } catch (error) {
      console.error('Error loading entry:', error);
      router.push('/app/daily-entry');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!entry) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          {entry.status === 'FINAL' ? 'View' : 'Edit'} Daily Entry
        </h1>
        <p className="text-gray-600 mt-1">
          Entry date: {new Date(entry.entry_date).toLocaleDateString()}
        </p>
      </div>
      <EntryForm
        entryId={params.id as string}
        initialData={{
          entry_date: entry.entry_date,
          opening_balance_cash: entry.opening_balance_cash,
          opening_balance_bank: entry.opening_balance_bank,
          notes: entry.notes,
          status: entry.status,
          op_income: entry.op_income.map(line => ({
            id: line.id,
            doctor_id: line.doctor_id,
            cash_amount: line.cash_amount,
            gpay_amount: line.gpay_amount,
            discount: line.discount,
            rate:line.rate,
            cash_quantity:line.cash_quantity,
            gp_quantity:line.gp_quantity,
          })),
          lab_income: entry.lab_income.map(line => ({
            id: line.id,
            doctor_id: line.doctor_id,
            cash_amount: line.cash_amount,
            gpay_amount: line.gpay_amount,
            discount: line.discount,
          })),
          pharmacy_income: entry.pharmacy_income.map(line => ({
            id: line.id,
            doctor_id: line.doctor_id,
            cash_amount: line.cash_amount,
            gpay_amount: line.gpay_amount,
            discount: line.discount,
          })),
          obs_income: entry.obs_income.map(line => ({
            id: line.id,
            doctor_id: line.doctor_id,
            cash_amount: line.cash_amount,
            gpay_amount: line.gpay_amount,
            discount: line.discount,
          })),
          home_care_income: entry.home_care_income.map(line => ({
            id: line.id,
            doctor_id: line.doctor_id,
            cash_amount: line.cash_amount,
            gpay_amount: line.gpay_amount,
            discount: line.discount,
          })),
          expense_lines: entry.expense_lines,
        }}
      />
    </div>
  );
}
