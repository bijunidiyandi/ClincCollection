'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/db/client';
import { getActiveClinic, clearActiveClinicId } from '@/lib/clinic';
import type { Clinic } from '@/lib/db/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  activeClinic: Clinic | null;
  setActiveClinic: (clinic: Clinic | null) => void;
  refreshActiveClinic: () => Promise<void>;
  userRole: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  activeClinic: null,
  setActiveClinic: () => {},
  refreshActiveClinic: async () => {},
  userRole: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeClinic, setActiveClinicState] = useState<Clinic | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const refreshActiveClinic = async () => {
    const clinic = await getActiveClinic();
    setActiveClinicState(clinic);

    if (user) {
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      setUserRole((data as any)?.role || null);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await refreshActiveClinic();
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await refreshActiveClinic();
        } else {
          clearActiveClinicId();
          setActiveClinicState(null);
        }
        setLoading(false);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const setActiveClinic = (clinic: Clinic | null) => {
    setActiveClinicState(clinic);
  };

  return (
    <AuthContext.Provider value={{ user, loading, activeClinic, setActiveClinic, refreshActiveClinic, userRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
