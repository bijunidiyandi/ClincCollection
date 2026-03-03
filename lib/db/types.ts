export type UserRole = 'SUPER_ADMIN' | 'CLINIC_ADMIN' | 'DATA_ENTRY' | 'VIEWER';

export type DailyEntryStatus = 'DRAFT' | 'FINAL';

export interface Clinic {
  id: string;
  code: string | null;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserClinic {
  id: string;
  user_id: string;
  clinic_id: string;
  role: UserRole;
  created_at: string;
}

export interface Doctor {
  id: string;
  clinic_id: string;
  code: string | null;
  name: string;
  rate: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExpenseHead {
  id: string;
  clinic_id: string;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DailyEntry {
  id: string;
  clinic_id: string;
  entry_date: string;
  opening_balance_cash: number;
  opening_balance_bank: number;
  notes: string;
  status: DailyEntryStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DailyOPIncome {
  id: string;
  daily_entry_id: string;
  doctor_id: string;
  rate:number;
  cash_quantity:number;
  gp_quantity:number;
  cash_amount: number;
  gpay_amount: number;
  discount: number;
  created_at: string;
  updated_at: string;
}

export interface DailyLabIncome {
  id: string;
  daily_entry_id: string;
  doctor_id: string;
  cash_amount: number;
  gpay_amount: number;
  discount: number;
  created_at: string;
  updated_at: string;
}

export interface DailyPharmacyIncome {
  id: string;
  daily_entry_id: string;
  doctor_id: string;
  cash_amount: number;
  gpay_amount: number;
  discount: number;
  created_at: string;
  updated_at: string;
}

export interface DailyOBSIncome {
  id: string;
  daily_entry_id: string;
  doctor_id: string;
  cash_amount: number;
  gpay_amount: number;
  discount: number;
  created_at: string;
  updated_at: string;
}

export interface DailyHomeCareIncome {
  id: string;
  daily_entry_id: string;
  doctor_id: string;
  cash_amount: number;
  gpay_amount: number;
  discount: number;
  created_at: string;
  updated_at: string;
}

export interface DailyExpenseLine {
  id: string;
  daily_entry_id: string;
  seq_no: number;
  expense_head_id: string | null;
  description: string;
  cash_amount: number;
  bank_amount: number;
  created_at: string;
  updated_at: string;
}

export interface DailyOPIncomeWithDoctor extends DailyOPIncome {
  doctor: Doctor;
}

export interface DailyLabIncomeWithDoctor extends DailyLabIncome {
  doctor: Doctor;
}

export interface DailyPharmacyIncomeWithDoctor extends DailyPharmacyIncome {
  doctor: Doctor;
}

export interface DailyOBSIncomeWithDoctor extends DailyOBSIncome {
  doctor: Doctor;
}

export interface DailyHomeCareIncomeWithDoctor extends DailyHomeCareIncome {
  doctor: Doctor;
}

export interface DailyExpenseLineWithHead extends DailyExpenseLine {
  expense_head: ExpenseHead | null;
}

export interface DailyEntryWithDetails extends DailyEntry {
  op_income: DailyOPIncomeWithDoctor[];
  lab_income: DailyLabIncomeWithDoctor[];
  pharmacy_income: DailyPharmacyIncomeWithDoctor[];
  obs_income: DailyOBSIncomeWithDoctor[];
  home_care_income: DailyHomeCareIncomeWithDoctor[];
  expense_lines: DailyExpenseLineWithHead[];
}

export interface DailyDoctorLine {
  id: string;
  daily_entry_id: string;
  doctor_id: string;
  op_cash: number;
  op_gpay: number;
  lab_cash: number;
  lab_gpay: number;
  pharmacy_cash: number;
  pharmacy_gpay: number;
  obs_cash: number;
  obs_gpay: number;
  home_care_cash: number;
  home_care_gpay: number;
  discount: number;
  created_at: string;
  updated_at: string;
}

export interface DailyDoctorLineWithDoctor extends DailyDoctorLine {
  doctor: Doctor;
}
