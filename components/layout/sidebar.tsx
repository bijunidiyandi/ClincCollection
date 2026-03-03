'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, BarChart3, ChevronLeft, ChevronRight, Settings, Users, Building2, Stethoscope, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Separator } from '@/components/ui/separator';

const menuItems = [
  {
    title: 'Dashboard',
    href: '/app',
    icon: LayoutDashboard,
  },
  {
    title: 'Daily Entries',
    href: '/app/daily-entry',
    icon: FileText,
  },
  {
    title: 'Reports',
    href: '/app/reports',
    icon: BarChart3,
  },
];

const adminMenuItems = [
  {
    title: 'Clinics',
    href: '/app/admin/clinics',
    icon: Building2,
  },
  {
    title: 'Users',
    href: '/app/admin/users',
    icon: Users,
  },
  {
    title: 'Doctors',
    href: '/app/admin/doctors',
    icon: Stethoscope,
  },
  {
    title: 'Expense Heads',
    href: '/app/admin/expense-heads',
    icon: Receipt,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, userRole } = useAuth();

  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  return (
    <div
      className={cn(
        'relative border-r bg-background transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold">Menu</h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn('h-8 w-8', isCollapsed && 'mx-auto')}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  isCollapsed && 'justify-center'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.title}</span>}
              </Link>
            );
          })}

          {isSuperAdmin && (
            <>
              <Separator className="my-2" />
              {!isCollapsed && (
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>Administration</span>
                  </div>
                </div>
              )}
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                      isCollapsed && 'justify-center'
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </Link>
                );
              })}
            </>
          )}
        </nav>
      </div>
    </div>
  );
}
