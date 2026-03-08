'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/db/client';
import { EntryForm } from '@/components/daily-entry/entry-form';
import type { DailyEntryWithDetails } from '@/lib/db/types';
import { PrintLayout } from '@/components/daily-entry/print-layout';
import { Button } from '@/components/ui/button';
import { Printer, FileDown, Share2 } from 'lucide-react';
import { getSelectedClinic } from '@/lib/clinic';
export default function EditDailyEntryPage() {
  const params = useParams();
  const router = useRouter();
  const [entry, setEntry] = useState<DailyEntryWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPrint, setShowPrint] = useState(false);
    const [clinic, setClinic] = useState<any>(null);
    const [userId, setUserId] = useState('');
  useEffect(() => {
    loadEntry();
    setClinic(getSelectedClinic());

    console.log('clinic ',clinic);
  }, []);

  async function loadEntry() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUserId(session.user.email?session.user.email:"");
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
  const handlePrint = () => {
    setShowPrint(true);
    setTimeout(() => {
      window.print();
      setShowPrint(false);
    }, 100);
  };

  const handleExportPDF = () => {
    setShowPrint(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => setShowPrint(false), 500);
    }, 100);
  };

  const handleWhatsAppShare = () => {
    if (!entry) return;

    const totals = calculateTotals(entry);
    const date = new Date(entry.entry_date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const message = `*${clinic?.name || 'Clinic'} - Daily Cashbook*\n` +
      `Date: ${date}\n\n` +
      `*Summary:*\n` +
      `Total Income: ₹${totals.totalIncome.toFixed(2)}\n` +
      `Total Expenses: ₹${totals.totalExpense.toFixed(2)}\n` +
      `Closing Balance (Cash): ₹${totals.closingBalanceCash.toFixed(2)}\n` +
      `Closing Balance (Bank): ₹${totals.closingBalanceBank.toFixed(2)}\n` +
      `Net Closing Balance: ₹${totals.netClosingBalance.toFixed(2)}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  function calculateTotals(entry: any) {
    const totalIncomeCash =
      (entry.op_income?.reduce((sum: number, line: any) => sum + (line.cash_amount || 0), 0) || 0) +
      (entry.lab_income?.reduce((sum: number, line: any) => sum + (line.cash_amount || 0), 0) || 0) +
      (entry.pharmacy_income?.reduce((sum: number, line: any) => sum + (line.cash_amount || 0), 0) || 0) +
      (entry.obs_income?.reduce((sum: number, line: any) => sum + (line.cash_amount || 0), 0) || 0) +
      (entry.home_care_income?.reduce((sum: number, line: any) => sum + (line.cash_amount || 0), 0) || 0);

    const totalIncomeGPay =
      (entry.op_income?.reduce((sum: number, line: any) => sum + (line.gpay_amount || 0), 0) || 0) +
      (entry.lab_income?.reduce((sum: number, line: any) => sum + (line.gpay_amount || 0), 0) || 0) +
      (entry.pharmacy_income?.reduce((sum: number, line: any) => sum + (line.gpay_amount || 0), 0) || 0) +
      (entry.obs_income?.reduce((sum: number, line: any) => sum + (line.gpay_amount || 0), 0) || 0) +
      (entry.home_care_income?.reduce((sum: number, line: any) => sum + (line.gpay_amount || 0), 0) || 0);

    const totalDiscounts =
      (entry.op_income?.reduce((sum: number, line: any) => sum + (line.discount || 0), 0) || 0) +
      (entry.lab_income?.reduce((sum: number, line: any) => sum + (line.discount || 0), 0) || 0) +
      (entry.pharmacy_income?.reduce((sum: number, line: any) => sum + (line.discount || 0), 0) || 0) +
      (entry.obs_income?.reduce((sum: number, line: any) => sum + (line.discount || 0), 0) || 0) +
      (entry.home_care_income?.reduce((sum: number, line: any) => sum + (line.discount || 0), 0) || 0);

    const totalIncome = totalIncomeCash + totalIncomeGPay - totalDiscounts;

    const totalExpenseCash = entry.expense_lines?.reduce((sum: number, line: any) => sum + (line.cash_amount || 0), 0) || 0;
    const totalExpenseBank = entry.expense_lines?.reduce((sum: number, line: any) => sum + (line.bank_amount || 0), 0) || 0;
    const totalExpense = totalExpenseCash + totalExpenseBank;

    const closingBalanceCash = (entry.opening_balance_cash || 0) + totalIncomeCash - totalExpenseCash;
    const closingBalanceBank = (entry.opening_balance_bank || 0) + totalIncomeGPay - totalExpenseBank;
    const netClosingBalance = closingBalanceCash + closingBalanceBank;

    return {
      totalIncomeCash,
      totalIncomeGPay,
      totalIncome,
      totalExpenseCash,
      totalExpenseBank,
      totalExpense,
      closingBalanceCash,
      closingBalanceBank,
      netClosingBalance,
    };
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
       {showPrint ? (
        <PrintLayout entry={entry} clinic={clinic} userId={userId} />
      ) : (
        <>
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">
                {entry.status === 'FINAL' ? 'View' : 'Edit'} Daily Entry
              </h1>
              <p className="text-gray-600 mt-1">
                Entry date: {new Date(entry.entry_date).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handlePrint} variant="outline" size="sm">
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button onClick={handleExportPDF} variant="outline" size="sm">
                <FileDown className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button onClick={handleWhatsAppShare} variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
            </div>
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
     </>
      )}
    </div>
    
  );
}
