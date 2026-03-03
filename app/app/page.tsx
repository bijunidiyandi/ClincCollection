import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Users, FileText } from 'lucide-react';

const stats = [
  {
    title: 'Total Revenue',
    value: '$0.00',
    icon: DollarSign,
    description: 'Total income this month',
  },
  {
    title: 'Total Expenses',
    value: '$0.00',
    icon: TrendingUp,
    description: 'Total expenses this month',
  },
  {
    title: 'Patients',
    value: '0',
    icon: Users,
    description: 'Patients seen this month',
  },
  {
    title: 'Entries',
    value: '0',
    icon: FileText,
    description: 'Total entries this month',
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your clinic's financial data
        </p>
      </div>

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
