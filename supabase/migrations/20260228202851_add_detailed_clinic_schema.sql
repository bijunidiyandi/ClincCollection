/*
  # Enhanced Clinic Cashbook Schema

  1. Schema Updates
    - Update `clinics` table
      - Add `code` (text, unique) - clinic code
      - Add `active` (boolean) - clinic active status
    
    - Update `user_clinics` table
      - Add role enum constraint (SUPER_ADMIN, CLINIC_ADMIN, DATA_ENTRY, VIEWER)
    
  2. New Tables
    - `doctors`
      - `id` (uuid, primary key)
      - `clinic_id` (uuid, references clinics)
      - `name` (text)
      - `active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `expense_heads`
      - `id` (uuid, primary key)
      - `clinic_id` (uuid, references clinics)
      - `name` (text)
      - `active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `daily_doctor_lines`
      - `id` (uuid, primary key)
      - `daily_entry_id` (uuid, references daily_entries)
      - `doctor_id` (uuid, references doctors)
      - Cash and GPay amounts for: OP, Lab, Pharmacy, OBS, Home Care
      - `discount` (numeric)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `daily_expense_lines`
      - `id` (uuid, primary key)
      - `daily_entry_id` (uuid, references daily_entries)
      - `seq_no` (integer)
      - `expense_head_id` (uuid, references expense_heads, nullable)
      - `description` (text)
      - `cash_amount` (numeric)
      - `bank_amount` (numeric)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  3. Daily Entries Updates
    - Add `opening_balance_cash` and `opening_balance_bank`
    - Add `status` enum (DRAFT, FINAL)
    - Remove old balance fields

  4. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to access their clinic data
    - Users can only access data for clinics they belong to

  5. Important Notes
    - All monetary amounts use numeric(12, 2) for precision
    - Doctors and expense heads are clinic-specific
    - Daily entries track separate cash and bank balances
    - Status field allows draft entries before finalization
*/

-- Add columns to clinics table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clinics' AND column_name = 'code'
  ) THEN
    ALTER TABLE clinics ADD COLUMN code text UNIQUE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clinics' AND column_name = 'active'
  ) THEN
    ALTER TABLE clinics ADD COLUMN active boolean DEFAULT true;
  END IF;
END $$;

-- Update user_clinics role column with enum constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_clinics_role_check'
  ) THEN
    ALTER TABLE user_clinics DROP CONSTRAINT IF EXISTS user_clinics_role_check;
    ALTER TABLE user_clinics ADD CONSTRAINT user_clinics_role_check 
      CHECK (role IN ('SUPER_ADMIN', 'CLINIC_ADMIN', 'DATA_ENTRY', 'VIEWER'));
    
    UPDATE user_clinics SET role = 'CLINIC_ADMIN' WHERE role = 'admin';
    UPDATE user_clinics SET role = 'DATA_ENTRY' WHERE role = 'staff';
  END IF;
END $$;

-- Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_doctors_clinic_id ON doctors(clinic_id);

-- Create expense_heads table
CREATE TABLE IF NOT EXISTS expense_heads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE expense_heads ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_expense_heads_clinic_id ON expense_heads(clinic_id);

-- Update daily_entries table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_entries' AND column_name = 'opening_balance_cash'
  ) THEN
    ALTER TABLE daily_entries ADD COLUMN opening_balance_cash numeric(12, 2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_entries' AND column_name = 'opening_balance_bank'
  ) THEN
    ALTER TABLE daily_entries ADD COLUMN opening_balance_bank numeric(12, 2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_entries' AND column_name = 'status'
  ) THEN
    ALTER TABLE daily_entries ADD COLUMN status text DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'FINAL'));
  END IF;
END $$;

-- Create daily_doctor_lines table
CREATE TABLE IF NOT EXISTS daily_doctor_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_entry_id uuid NOT NULL REFERENCES daily_entries(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
  op_cash numeric(12, 2) DEFAULT 0,
  op_gpay numeric(12, 2) DEFAULT 0,
  lab_cash numeric(12, 2) DEFAULT 0,
  lab_gpay numeric(12, 2) DEFAULT 0,
  pharmacy_cash numeric(12, 2) DEFAULT 0,
  pharmacy_gpay numeric(12, 2) DEFAULT 0,
  obs_cash numeric(12, 2) DEFAULT 0,
  obs_gpay numeric(12, 2) DEFAULT 0,
  home_care_cash numeric(12, 2) DEFAULT 0,
  home_care_gpay numeric(12, 2) DEFAULT 0,
  discount numeric(12, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(daily_entry_id, doctor_id)
);

ALTER TABLE daily_doctor_lines ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_daily_doctor_lines_daily_entry_id ON daily_doctor_lines(daily_entry_id);
CREATE INDEX IF NOT EXISTS idx_daily_doctor_lines_doctor_id ON daily_doctor_lines(doctor_id);

-- Create daily_expense_lines table
CREATE TABLE IF NOT EXISTS daily_expense_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_entry_id uuid NOT NULL REFERENCES daily_entries(id) ON DELETE CASCADE,
  seq_no integer NOT NULL,
  expense_head_id uuid REFERENCES expense_heads(id) ON DELETE RESTRICT,
  description text DEFAULT '',
  cash_amount numeric(12, 2) DEFAULT 0,
  bank_amount numeric(12, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE daily_expense_lines ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_daily_expense_lines_daily_entry_id ON daily_expense_lines(daily_entry_id);
CREATE INDEX IF NOT EXISTS idx_daily_expense_lines_expense_head_id ON daily_expense_lines(expense_head_id);

-- RLS Policies for doctors table
CREATE POLICY "Users can view doctors for their clinics"
  ON doctors FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_clinics
      WHERE user_clinics.clinic_id = doctors.clinic_id
      AND user_clinics.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin users can insert doctors"
  ON doctors FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_clinics
      WHERE user_clinics.clinic_id = doctors.clinic_id
      AND user_clinics.user_id = auth.uid()
      AND user_clinics.role IN ('SUPER_ADMIN', 'CLINIC_ADMIN')
    )
  );

CREATE POLICY "Admin users can update doctors"
  ON doctors FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_clinics
      WHERE user_clinics.clinic_id = doctors.clinic_id
      AND user_clinics.user_id = auth.uid()
      AND user_clinics.role IN ('SUPER_ADMIN', 'CLINIC_ADMIN')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_clinics
      WHERE user_clinics.clinic_id = doctors.clinic_id
      AND user_clinics.user_id = auth.uid()
      AND user_clinics.role IN ('SUPER_ADMIN', 'CLINIC_ADMIN')
    )
  );

CREATE POLICY "Admin users can delete doctors"
  ON doctors FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_clinics
      WHERE user_clinics.clinic_id = doctors.clinic_id
      AND user_clinics.user_id = auth.uid()
      AND user_clinics.role IN ('SUPER_ADMIN', 'CLINIC_ADMIN')
    )
  );

-- RLS Policies for expense_heads table
CREATE POLICY "Users can view expense heads for their clinics"
  ON expense_heads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_clinics
      WHERE user_clinics.clinic_id = expense_heads.clinic_id
      AND user_clinics.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin users can insert expense heads"
  ON expense_heads FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_clinics
      WHERE user_clinics.clinic_id = expense_heads.clinic_id
      AND user_clinics.user_id = auth.uid()
      AND user_clinics.role IN ('SUPER_ADMIN', 'CLINIC_ADMIN')
    )
  );

CREATE POLICY "Admin users can update expense heads"
  ON expense_heads FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_clinics
      WHERE user_clinics.clinic_id = expense_heads.clinic_id
      AND user_clinics.user_id = auth.uid()
      AND user_clinics.role IN ('SUPER_ADMIN', 'CLINIC_ADMIN')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_clinics
      WHERE user_clinics.clinic_id = expense_heads.clinic_id
      AND user_clinics.user_id = auth.uid()
      AND user_clinics.role IN ('SUPER_ADMIN', 'CLINIC_ADMIN')
    )
  );

CREATE POLICY "Admin users can delete expense heads"
  ON expense_heads FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_clinics
      WHERE user_clinics.clinic_id = expense_heads.clinic_id
      AND user_clinics.user_id = auth.uid()
      AND user_clinics.role IN ('SUPER_ADMIN', 'CLINIC_ADMIN')
    )
  );

-- RLS Policies for daily_doctor_lines table
CREATE POLICY "Users can view doctor lines for their clinics"
  ON daily_doctor_lines FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_doctor_lines.daily_entry_id
      AND uc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert doctor lines for their clinics"
  ON daily_doctor_lines FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_doctor_lines.daily_entry_id
      AND uc.user_id = auth.uid()
      AND uc.role IN ('SUPER_ADMIN', 'CLINIC_ADMIN', 'DATA_ENTRY')
    )
  );

CREATE POLICY "Users can update doctor lines for their clinics"
  ON daily_doctor_lines FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_doctor_lines.daily_entry_id
      AND uc.user_id = auth.uid()
      AND uc.role IN ('SUPER_ADMIN', 'CLINIC_ADMIN', 'DATA_ENTRY')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_doctor_lines.daily_entry_id
      AND uc.user_id = auth.uid()
      AND uc.role IN ('SUPER_ADMIN', 'CLINIC_ADMIN', 'DATA_ENTRY')
    )
  );

CREATE POLICY "Users can delete doctor lines for their clinics"
  ON daily_doctor_lines FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_doctor_lines.daily_entry_id
      AND uc.user_id = auth.uid()
      AND uc.role IN ('SUPER_ADMIN', 'CLINIC_ADMIN', 'DATA_ENTRY')
    )
  );

-- RLS Policies for daily_expense_lines table
CREATE POLICY "Users can view expense lines for their clinics"
  ON daily_expense_lines FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_expense_lines.daily_entry_id
      AND uc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert expense lines for their clinics"
  ON daily_expense_lines FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_expense_lines.daily_entry_id
      AND uc.user_id = auth.uid()
      AND uc.role IN ('SUPER_ADMIN', 'CLINIC_ADMIN', 'DATA_ENTRY')
    )
  );

CREATE POLICY "Users can update expense lines for their clinics"
  ON daily_expense_lines FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_expense_lines.daily_entry_id
      AND uc.user_id = auth.uid()
      AND uc.role IN ('SUPER_ADMIN', 'CLINIC_ADMIN', 'DATA_ENTRY')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_expense_lines.daily_entry_id
      AND uc.user_id = auth.uid()
      AND uc.role IN ('SUPER_ADMIN', 'CLINIC_ADMIN', 'DATA_ENTRY')
    )
  );