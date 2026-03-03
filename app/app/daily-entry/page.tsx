'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/db/client';
import { getSelectedClinic } from '@/lib/clinic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Eye } from 'lucide-react';
import type { DailyEntryWithDetails } from '@/lib/db/types';

export default function DailyEntryPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<DailyEntryWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, []);

  async function loadEntries() {
    try {
      const clinic = getSelectedClinic();
      if (!clinic) {
        router.push('/select-clinic');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const response = await fetch(
        `/api/daily-entry?clinic_id=${clinic.id}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setEntries(result.data || []);
      }
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function formatCurrency(amount: number) {
return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  }

  function calculateTotals(entry: DailyEntryWithDetails) {
    const opIncome = entry.op_income?.reduce((sum, line) => {
      return sum + (line.cash_amount || 0) + (line.gpay_amount || 0);
    }, 0) || 0;

    const labIncome = entry.lab_income?.reduce((sum, line) => {
      return sum + (line.cash_amount || 0) + (line.gpay_amount || 0);
    }, 0) || 0;

    const pharmacyIncome = entry.pharmacy_income?.reduce((sum, line) => {
      return sum + (line.cash_amount || 0) + (line.gpay_amount || 0);
    }, 0) || 0;

    const obsIncome = entry.obs_income?.reduce((sum, line) => {
      return sum + (line.cash_amount || 0) + (line.gpay_amount || 0);
    }, 0) || 0;

    const homeCareIncome = entry.home_care_income?.reduce((sum, line) => {
      return sum + (line.cash_amount || 0) + (line.gpay_amount || 0);
    }, 0) || 0;

    const totalIncome = opIncome + labIncome + pharmacyIncome + obsIncome + homeCareIncome;

    const totalExpense = entry.expense_lines.reduce((sum, line) => {
      return sum + (line.cash_amount || 0) + (line.bank_amount || 0);
    }, 0);

    return {
      totalIncome,
      totalExpense,
      net: (entry.opening_balance_cash || 0) + (entry.opening_balance_bank || 0) + totalIncome - totalExpense,
    };
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Daily Entries</h1>
          <p className="text-gray-600 mt-1">Manage your daily cashbook entries</p>
        </div>
        <Button onClick={() => router.push('/app/daily-entry/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Entry
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No entries found. Create your first entry to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Opening Balance</TableHead>
                  <TableHead>Income</TableHead>
                  <TableHead>Expense</TableHead>
                  <TableHead>Net Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => {
                  const totals = calculateTotals(entry);
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {formatDate(entry.entry_date)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency((entry.opening_balance_cash || 0) + (entry.opening_balance_bank || 0))}
                      </TableCell>
                      <TableCell className="text-green-600">
                        {formatCurrency(totals.totalIncome)}
                      </TableCell>
                      <TableCell className="text-red-600">
                        {formatCurrency(totals.totalExpense)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(totals.net)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.status === 'FINAL' ? 'default' : 'secondary'}>
                          {entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/app/daily-entry/${entry.id}`)}
                          >
                            {entry.status === 'FINAL' ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <Edit className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
