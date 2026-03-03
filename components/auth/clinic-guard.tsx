'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Loader2 } from 'lucide-react';

export function ClinicGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, activeClinic, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && !activeClinic) {
      router.push('/select-clinic');
    }
  }, [user, activeClinic, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || !activeClinic) {
    return null;
  }

  return <>{children}</>;
}
