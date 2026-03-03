export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clinics: {
        Row: {
          id: string
          code: string | null
          name: string
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code?: string | null
          name: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string | null
          name?: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_clinics: {
        Row: {
          id: string
          user_id: string
          clinic_id: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          clinic_id: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          clinic_id?: string
          role?: string
          created_at?: string
        }
      }
      doctors: {
        Row: {
          id: string
          clinic_id: string
          name: string
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          name: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          name?: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      expense_heads: {
        Row: {
          id: string
          clinic_id: string
          name: string
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          name: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          name?: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      daily_entries: {
        Row: {
          id: string
          clinic_id: string
          entry_date: string
          opening_balance: number
          closing_balance: number
          total_income: number
          total_expenses: number
          opening_balance_cash: number
          opening_balance_bank: number
          notes: string
          status: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          entry_date: string
          opening_balance?: number
          closing_balance?: number
          total_income?: number
          total_expenses?: number
          opening_balance_cash?: number
          opening_balance_bank?: number
          notes?: string
          status?: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          entry_date?: string
          opening_balance?: number
          closing_balance?: number
          total_income?: number
          total_expenses?: number
          opening_balance_cash?: number
          opening_balance_bank?: number
          notes?: string
          status?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      daily_doctor_lines: {
        Row: {
          id: string
          daily_entry_id: string
          doctor_id: string
          op_cash: number
          op_gpay: number
          lab_cash: number
          lab_gpay: number
          pharmacy_cash: number
          pharmacy_gpay: number
          obs_cash: number
          obs_gpay: number
          home_care_cash: number
          home_care_gpay: number
          discount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          daily_entry_id: string
          doctor_id: string
          op_cash?: number
          op_gpay?: number
          lab_cash?: number
          lab_gpay?: number
          pharmacy_cash?: number
          pharmacy_gpay?: number
          obs_cash?: number
          obs_gpay?: number
          home_care_cash?: number
          home_care_gpay?: number
          discount?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          daily_entry_id?: string
          doctor_id?: string
          op_cash?: number
          op_gpay?: number
          lab_cash?: number
          lab_gpay?: number
          pharmacy_cash?: number
          pharmacy_gpay?: number
          obs_cash?: number
          obs_gpay?: number
          home_care_cash?: number
          home_care_gpay?: number
          discount?: number
          created_at?: string
          updated_at?: string
        }
      }
      daily_expense_lines: {
        Row: {
          id: string
          daily_entry_id: string
          seq_no: number
          expense_head_id: string | null
          description: string
          cash_amount: number
          bank_amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          daily_entry_id: string
          seq_no: number
          expense_head_id?: string | null
          description?: string
          cash_amount?: number
          bank_amount?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          daily_entry_id?: string
          seq_no?: number
          expense_head_id?: string | null
          description?: string
          cash_amount?: number
          bank_amount?: number
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          daily_entry_id: string
          clinic_id: string
          type: string
          category: string
          amount: number
          description: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          daily_entry_id: string
          clinic_id: string
          type: string
          category: string
          amount: number
          description?: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          daily_entry_id?: string
          clinic_id?: string
          type?: string
          category?: string
          amount?: number
          description?: string
          created_by?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
