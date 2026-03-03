import { supabase } from './db/client';
import type { Clinic, UserClinic } from './db/types';

const ACTIVE_CLINIC_KEY = 'active_clinic_id';

export async function getUserClinics(userId: string): Promise<Clinic[]> {
  const { data: userClinicsData, error: ucError } = await supabase
    .from('user_clinics')
    .select('clinic_id')
    .eq('user_id', userId);

  console.log('userId', userId);
  console.log('userClinicsData', userClinicsData);
  console.log('ucError', ucError);

  if (ucError) {
    console.error('Error fetching user clinics:', ucError);
    return [];
  }

  if (!userClinicsData || userClinicsData.length === 0) return [];

  const clinicIds = userClinicsData.map((uc: any) => uc.clinic_id);

  const { data: clinicsData, error: clinicsError } = await supabase
    .from('clinics')
    .select('*')
    .in('id', clinicIds)
    .eq('active', true);

  console.log('clinicsData', clinicsData);
  console.log('clinicsError', clinicsError);

  if (clinicsError) {
    console.error('Error fetching clinics:', clinicsError);
    return [];
  }

  return (clinicsData || []) as Clinic[];
}

export async function getUserRole(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return (data as any).role;
}

export function getActiveClinicId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_CLINIC_KEY);
}

export function setActiveClinicId(clinicId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_CLINIC_KEY, clinicId);
}

export function clearActiveClinicId(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACTIVE_CLINIC_KEY);
}

export async function getActiveClinic(): Promise<Clinic | null> {
  const clinicId = getActiveClinicId();
  if (!clinicId) return null;

  const { data, error } = await supabase
    .from('clinics')
    .select('*')
    .eq('id', clinicId)
    .eq('active', true)
    .maybeSingle();

  if (error || !data) {
    clearActiveClinicId();
    return null;
  }

  return data as Clinic;
}

export async function validateClinicAccess(userId: string, clinicId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_clinics')
    .select('clinic_id')
    .eq('user_id', userId)
    .eq('clinic_id', clinicId)
    .maybeSingle();

  return !error && !!data;
}

export function getSelectedClinic(): Clinic | null {
  if (typeof window === 'undefined') return null;

  const clinicData = localStorage.getItem('selected_clinic');
  if (!clinicData) return null;

  try {
    return JSON.parse(clinicData) as Clinic;
  } catch {
    return null;
  }
}

export function setSelectedClinic(clinic: Clinic): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('selected_clinic', JSON.stringify(clinic));
  setActiveClinicId(clinic.id);
}

export function clearSelectedClinic(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('selected_clinic');
  clearActiveClinicId();
}
