'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/db/client';
import { getSelectedClinic } from '@/lib/clinic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Users, FileText } from 'lucide-react';

// Define the exact shape of each entry returned from Supabase
interface DashboardEntry {
  id: string;
  entry_date: string;
  opening_balance_cash: number | null;
  opening_balance_bank: number | null;
  op_income: Array<{
    cash_amount: number | null;
    gpay_amount: number | null;
    cash_quantity: number | null;
    gp_quantity: number | null;
  }> | null;
  lab_income: Array<{
    cash_amount: number | null;
    gpay_amount: number | null;
  }> | null;
  pharmacy_income: Array<{
    cash_amount: number | null;
    gpay_amount: number | null;
  }> | null;
  obs_income: Array<{
    cash_amount: number | null;
    gpay_amount: number | null;
  }> | null;
  home_care_income: Array<{
    cash_amount: number | null;
    gpay_amount: number | null;
  }> | null;
  expense_lines: Array<{
    cash_amount: number | null;
    bank_amount: number | null;
  }> | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState([
    { title: 'Total Revenue', value: '0.00', icon: DollarSign, description: 'Total income this month' },
    { title: 'Total Expenses', value: '0.00', icon: TrendingUp, description: 'Total expenses this month' },
    { title: 'Patients', value: '0', icon: Users, description: 'Patients seen this month (OP)' },
    { title: 'Entries', value: '0', icon: FileText, description: 'Total entries this month' },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  async function loadDashboardStats() {
    try {
      setLoading(true);

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

      // Get first and last day of current month
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      // Fetch entries with relations – include cash_quantity & gp_quantity
      const { data: entries, error } = await supabase
        .from('daily_entries')
        .select(`
          id,
          entry_date,
          opening_balance_cash,
          opening_balance_bank,
          op_income:daily_op_income(cash_amount, gpay_amount, cash_quantity, gp_quantity),
          lab_income:daily_lab_income(cash_amount, gpay_amount),
          pharmacy_income:daily_pharmacy_income(cash_amount, gpay_amount),
          obs_income:daily_obs_income(cash_amount, gpay_amount),
          home_care_income:daily_home_care_income(cash_amount, gpay_amount),
          expense_lines:daily_expense_lines(cash_amount, bank_amount)
        `)
        .eq('clinic_id', clinic.id)
        .gte('entry_date', firstDay)
        .lte('entry_date', lastDay)
        .order('entry_date', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Calculate totals
      let totalRevenue = 0;
      let totalExpenses = 0;
      let totalEntries = entries?.length || 0;
      let totalPatients = 0;

      entries?.forEach((entry: DashboardEntry) => {
        // Income
        const op = entry.op_income?.reduce((sum, l) => sum + (l.cash_amount || 0) + (l.gpay_amount || 0), 0) ?? 0;
        const lab = entry.lab_income?.reduce((sum, l) => sum + (l.cash_amount || 0) + (l.gpay_amount || 0), 0) ?? 0;
        const pharm = entry.pharmacy_income?.reduce((sum, l) => sum + (l.cash_amount || 0) + (l.gpay_amount || 0), 0) ?? 0;
        const obs = entry.obs_income?.reduce((sum, l) => sum + (l.cash_amount || 0) + (l.gpay_amount || 0), 0) ?? 0;
        const home = entry.home_care_income?.reduce((sum, l) => sum + (l.cash_amount || 0) + (l.gpay_amount || 0), 0) ?? 0;

        totalRevenue += op + lab + pharm + obs + home;

        // Patients = sum of cash_quantity + gp_quantity from OP income
        const patientsFromThisEntry = entry.op_income?.reduce((sum, l) => {
          return sum + (l.cash_quantity || 0) + (l.gp_quantity || 0);
        }, 0) ?? 0;

        totalPatients += patientsFromThisEntry;

        // Expenses
        const exp = entry.expense_lines?.reduce((sum, l) => sum + (l.cash_amount || 0) + (l.bank_amount || 0), 0) ?? 0;
        totalExpenses += exp;
      });

      // Update stats with formatted values
      setStats([
        {
          title: 'Total Revenue',
          value: formatAmount(totalRevenue),
          icon: DollarSign,
          description: 'Total income this month',
        },
        {
          title: 'Total Expenses',
          value: formatAmount(totalExpenses),
          icon: TrendingUp,
          description: 'Total expenses this month',
        },
        {
          title: 'Patients',
          value: totalPatients.toLocaleString('en-US'), // adds thousands separator if large
          icon: Users,
          description: 'Patients seen this month (OP)',
        },
        {
          title: 'Entries',
          value: totalEntries.toString(),
          icon: FileText,
          description: 'Total entries this month',
        },
      ]);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  }

  // Format number with 2 decimal places, no currency symbol
  function formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your clinics financial data
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">—</div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            No recent activity
          </div>
        </CardContent>
      </Card>
    </div>
  );
}