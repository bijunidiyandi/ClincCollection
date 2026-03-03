/*
  # Add Separate Income Tables

  1. Changes
    - Create separate tables for each income type:
      - `daily_op_income` - Doctor/Outpatient income
      - `daily_lab_income` - Laboratory income
      - `daily_pharmacy_income` - Pharmacy income
      - `daily_obs_income` - OBS income
      - `daily_home_care_income` - Home care income
    
    Each table has:
      - `id` (uuid, primary key)
      - `daily_entry_id` (uuid, references daily_entries)
      - `doctor_id` (uuid, references doctors)
      - `cash_amount` (numeric)
      - `gpay_amount` (numeric)
      - `discount` (numeric)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - UNIQUE constraint on (daily_entry_id, doctor_id)

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to access their clinic data
    - Users can only access data for clinics they belong to
    - Only users with appropriate roles can insert/update/delete

  3. Important Notes
    - This replaces the combined daily_doctor_lines table with separate tables
    - Each income type can now be managed independently
    - Maintains the same RLS security model as other tables
*/

-- Create daily_op_income table
CREATE TABLE IF NOT EXISTS daily_op_income (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_entry_id uuid NOT NULL REFERENCES daily_entries(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
  cash_amount numeric(12, 2) DEFAULT 0,
  gpay_amount numeric(12, 2) DEFAULT 0,
  discount numeric(12, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(daily_entry_id, doctor_id)
);

ALTER TABLE daily_op_income ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_daily_op_income_daily_entry_id ON daily_op_income(daily_entry_id);
CREATE INDEX IF NOT EXISTS idx_daily_op_income_doctor_id ON daily_op_income(doctor_id);

-- Create daily_lab_income table
CREATE TABLE IF NOT EXISTS daily_lab_income (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_entry_id uuid NOT NULL REFERENCES daily_entries(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
  cash_amount numeric(12, 2) DEFAULT 0,
  gpay_amount numeric(12, 2) DEFAULT 0,
  discount numeric(12, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(daily_entry_id, doctor_id)
);

ALTER TABLE daily_lab_income ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_daily_lab_income_daily_entry_id ON daily_lab_income(daily_entry_id);
CREATE INDEX IF NOT EXISTS idx_daily_lab_income_doctor_id ON daily_lab_income(doctor_id);

-- Create daily_pharmacy_income table
CREATE TABLE IF NOT EXISTS daily_pharmacy_income (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_entry_id uuid NOT NULL REFERENCES daily_entries(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
  cash_amount numeric(12, 2) DEFAULT 0,
  gpay_amount numeric(12, 2) DEFAULT 0,
  discount numeric(12, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(daily_entry_id, doctor_id)
);

ALTER TABLE daily_pharmacy_income ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_daily_pharmacy_income_daily_entry_id ON daily_pharmacy_income(daily_entry_id);
CREATE INDEX IF NOT EXISTS idx_daily_pharmacy_income_doctor_id ON daily_pharmacy_income(doctor_id);

-- Create daily_obs_income table
CREATE TABLE IF NOT EXISTS daily_obs_income (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_entry_id uuid NOT NULL REFERENCES daily_entries(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
  cash_amount numeric(12, 2) DEFAULT 0,
  gpay_amount numeric(12, 2) DEFAULT 0,
  discount numeric(12, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(daily_entry_id, doctor_id)
);

ALTER TABLE daily_obs_income ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_daily_obs_income_daily_entry_id ON daily_obs_income(daily_entry_id);
CREATE INDEX IF NOT EXISTS idx_daily_obs_income_doctor_id ON daily_obs_income(doctor_id);

-- Create daily_home_care_income table
CREATE TABLE IF NOT EXISTS daily_home_care_income (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_entry_id uuid NOT NULL REFERENCES daily_entries(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
  cash_amount numeric(12, 2) DEFAULT 0,
  gpay_amount numeric(12, 2) DEFAULT 0,
  discount numeric(12, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(daily_entry_id, doctor_id)
);

ALTER TABLE daily_home_care_income ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_daily_home_care_income_daily_entry_id ON daily_home_care_income(daily_entry_id);
CREATE INDEX IF NOT EXISTS idx_daily_home_care_income_doctor_id ON daily_home_care_income(doctor_id);

-- RLS Policies for daily_op_income
CREATE POLICY "Users can view OP income for their clinics"
  ON daily_op_income FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_op_income.daily_entry_id
      AND uc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert OP income for their clinics"
  ON daily_op_income FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_op_income.daily_entry_id
      AND uc.user_id = auth.uid()
      AND uc.role IN ('SUPER_ADMIN', 'CLINIC_ADMIN', 'DATA_ENTRY')
    )
  );

CREATE POLICY "Users can update OP income for their clinics"
  ON daily_op_income FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_op_income.daily_entry_id
      AND uc.user_id = auth.uid()
      AND uc.role IN ('SUPER_ADMIN', 'CLINIC_ADMIN', 'DATA_ENTRY')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_op_income.daily_entry_id
      AND uc.user_id = auth.uid()
      AND uc.role IN ('SUPER_ADMIN', 'CLINIC_ADMIN', 'DATA_ENTRY')
    )
  );

CREATE POLICY "Users can delete OP income for their clinics"
  ON daily_op_income FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_op_income.daily_entry_id
      AND uc.user_id = auth.uid()
      AND uc.role IN ('SUPER_ADMIN', 'CLINIC_ADMIN', 'DATA_ENTRY')
    )
  );

-- RLS Policies for daily_lab_income
CREATE POLICY "Users can view lab income for their clinics"
  ON daily_lab_income FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_lab_income.daily_entry_id
      AND uc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert lab income for their clinics"
  ON daily_lab_income FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_lab_income.daily_entry_id
      AND uc.user_id = auth.uid()
      AND uc.role IN ('SUPER_ADMIN', 'CLINIC_ADMIN', 'DATA_ENTRY')
    )
  );

CREATE POLICY "Users can update lab income for their clinics"
  ON daily_lab_income FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_lab_income.daily_entry_id
      AND uc.user_id = auth.uid()
      AND uc.role IN ('SUPER_ADMIN', 'CLINIC_ADMIN', 'DATA_ENTRY')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_lab_income.daily_entry_id
      AND uc.user_id = auth.uid()
      AND uc.role IN ('SUPER_ADMIN', 'CLINIC_ADMIN', 'DATA_ENTRY')
    )
  );

CREATE POLICY "Users can delete lab income for their clinics"
  ON daily_lab_income FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_lab_income.daily_entry_id
      AND uc.user_id = auth.uid()
      AND uc.role IN ('SUPER_ADMIN', 'CLINIC_ADMIN', 'DATA_ENTRY')
    )
  );

-- RLS Policies for daily_pharmacy_income
CREATE POLICY "Users can view pharmacy income for their clinics"
  ON daily_pharmacy_income FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_pharmacy_income.daily_entry_id
      AND uc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert pharmacy income for their clinics"
  ON daily_pharmacy_income FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_pharmacy_income.daily_entry_id
      AND uc.user_id = auth.uid()
      AND uc.role IN ('SUPER_ADMIN', 'CLINIC_ADMIN', 'DATA_ENTRY')
    )
  );

CREATE POLICY "Users can update pharmacy income for their clinics"
  ON daily_pharmacy_income FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_pharmacy_income.daily_entry_id
      AND uc.user_id = auth.uid()
      AND uc.role IN ('SUPER_ADMIN', 'CLINIC_ADMIN', 'DATA_ENTRY')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_pharmacy_income.daily_entry_id
      AND uc.user_id = auth.uid()
      AND uc.role IN ('SUPER_ADMIN', 'CLINIC_ADMIN', 'DATA_ENTRY')
    )
  );

CREATE POLICY "Users can delete pharmacy income for their clinics"
  ON daily_pharmacy_income FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_pharmacy_income.daily_entry_id
      AND uc.user_id = auth.uid()
      AND uc.role IN ('SUPER_ADMIN', 'CLINIC_ADMIN', 'DATA_ENTRY')
    )
  );

-- RLS Policies for daily_obs_income
CREATE POLICY "Users can view OBS income for their clinics"
  ON daily_obs_income FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_obs_income.daily_entry_id
      AND uc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert OBS income for their clinics"
  ON daily_obs_income FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_obs_income.daily_entry_id
      AND uc.user_id = auth.uid()
      AND uc.role IN ('SUPER_ADMIN', 'CLINIC_ADMIN', 'DATA_ENTRY')
    )
  );

CREATE POLICY "Users can update OBS income for their clinics"
  ON daily_obs_income FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_obs_income.daily_entry_id
      AND uc.user_id = auth.uid()
      AND uc.role IN ('SUPER_ADMIN', 'CLINIC_ADMIN', 'DATA_ENTRY')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_obs_income.daily_entry_id
      AND uc.user_id = auth.uid()
      AND uc.role IN ('SUPER_ADMIN', 'CLINIC_ADMIN', 'DATA_ENTRY')
    )
  );

CREATE POLICY "Users can delete OBS income for their clinics"
  ON daily_obs_income FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_obs_income.daily_entry_id
      AND uc.user_id = auth.uid()
      AND uc.role IN ('SUPER_ADMIN', 'CLINIC_ADMIN', 'DATA_ENTRY')
    )
  );

-- RLS Policies for daily_home_care_income
CREATE POLICY "Users can view home care income for their clinics"
  ON daily_home_care_income FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_home_care_income.daily_entry_id
      AND uc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert home care income for their clinics"
  ON daily_home_care_income FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_home_care_income.daily_entry_id
      AND uc.user_id = auth.uid()
      AND uc.role IN ('SUPER_ADMIN', 'CLINIC_ADMIN', 'DATA_ENTRY')
    )
  );

CREATE POLICY "Users can update home care income for their clinics"
  ON daily_home_care_income FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_home_care_income.daily_entry_id
      AND uc.user_id = auth.uid()
      AND uc.role IN ('SUPER_ADMIN', 'CLINIC_ADMIN', 'DATA_ENTRY')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_home_care_income.daily_entry_id
      AND uc.user_id = auth.uid()
      AND uc.role IN ('SUPER_ADMIN', 'CLINIC_ADMIN', 'DATA_ENTRY')
    )
  );

CREATE POLICY "Users can delete home care income for their clinics"
  ON daily_home_care_income FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_home_care_income.daily_entry_id
      AND uc.user_id = auth.uid()
      AND uc.role IN ('SUPER_ADMIN', 'CLINIC_ADMIN', 'DATA_ENTRY')
    )
  );