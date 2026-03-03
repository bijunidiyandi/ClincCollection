'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ChevronRight, Loader2 } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/components/providers/auth-provider';
import { getUserClinics, setSelectedClinic } from '@/lib/clinic';
import type { Clinic } from '@/lib/db/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SelectClinicPage() {
  const router = useRouter();
  const { user, refreshActiveClinic } = useAuth();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    const loadClinics = async () => {
      if (!user) return;

      try {
        const userClinics = await getUserClinics(user.id);
        setClinics(userClinics);

        if (userClinics.length === 0) {
          setError('No clinics assigned to your account. Please contact your administrator.');
        }
      } catch (err) {
        setError('Failed to load clinics. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadClinics();
  }, [user]);

  const handleSelectClinic = async (clinicId: string) => {
    setSelecting(true);
    const clinic = clinics.find(c => c.id === clinicId);
    if (clinic) {
      setSelectedClinic(clinic);
      await refreshActiveClinic();
    }
    router.push('/app');
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold">Select a Clinic</CardTitle>
            <CardDescription>
              Choose the clinic you want to access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading || selecting ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              clinics.map((clinic) => (
                <button
                  key={clinic.id}
                  onClick={() => handleSelectClinic(clinic.id)}
                  disabled={selecting}
                  className="flex w-full items-center justify-between rounded-lg border bg-card p-4 text-left transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{clinic.name}</p>
                      {clinic.code && (
                        <p className="text-sm text-muted-foreground">
                          Code: {clinic.code}
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
