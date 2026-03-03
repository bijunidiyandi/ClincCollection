/*
  # Separate User Roles from Clinic Assignment

  1. Changes
    - Create `users` table to store global user roles (USER, ADMIN, SUPER_ADMIN)
    - Remove `role` column from `user_clinics` table
    - Migrate existing data: preserve highest role from user_clinics to users table
    - Update RLS policies to use global user roles instead of clinic-specific roles

  2. New Tables
    - `users`
      - `id` (uuid, primary key, references auth.users)
      - `role` (text, global role - USER, ADMIN, SUPER_ADMIN)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  3. Modified Tables
    - `user_clinics` - remove `role` column

  4. Security
    - Enable RLS on `users` table
    - Update all policies to check global roles
    - Users can only view their own role
    - Only SUPER_ADMIN can modify user roles

  5. Important Notes
    - Role is now global per user, not per clinic
    - Clinic assignment is separate from role assignment
    - SUPER_ADMIN has full system access
    - ADMIN has management capabilities
    - USER has standard access
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN', 'SUPER_ADMIN')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Migrate existing user roles from user_clinics to users table
DO $$
DECLARE
  user_record RECORD;
  highest_role text;
BEGIN
  FOR user_record IN
    SELECT DISTINCT user_id FROM user_clinics
  LOOP
    SELECT CASE
      WHEN EXISTS (SELECT 1 FROM user_clinics WHERE user_id = user_record.user_id AND role = 'SUPER_ADMIN') THEN 'SUPER_ADMIN'
      WHEN EXISTS (SELECT 1 FROM user_clinics WHERE user_id = user_record.user_id AND role = 'ADMIN') THEN 'ADMIN'
      WHEN EXISTS (SELECT 1 FROM user_clinics WHERE user_id = user_record.user_id AND role = 'CLINIC_ADMIN') THEN 'ADMIN'
      ELSE 'USER'
    END INTO highest_role;

    INSERT INTO users (id, role)
    VALUES (user_record.user_id, highest_role)
    ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
  END LOOP;
END $$;

-- Drop all policies that depend on user_clinics.role column
DROP POLICY IF EXISTS "Admin users can update their clinics" ON clinics;
DROP POLICY IF EXISTS "Admin users can delete their clinics" ON clinics;
DROP POLICY IF EXISTS "Admin users can insert clinics" ON clinics;
DROP POLICY IF EXISTS "Admin users can update clinic memberships" ON user_clinics;
DROP POLICY IF EXISTS "Admin users can delete clinic memberships" ON user_clinics;
DROP POLICY IF EXISTS "Admin users can insert doctors" ON doctors;
DROP POLICY IF EXISTS "Admin users can update doctors" ON doctors;
DROP POLICY IF EXISTS "Admin users can delete doctors" ON doctors;
DROP POLICY IF EXISTS "Admin users can insert expense heads" ON expense_heads;
DROP POLICY IF EXISTS "Admin users can update expense heads" ON expense_heads;
DROP POLICY IF EXISTS "Admin users can delete expense heads" ON expense_heads;
DROP POLICY IF EXISTS "Users can insert doctor lines for their clinics" ON daily_doctor_lines;
DROP POLICY IF EXISTS "Users can update doctor lines for their clinics" ON daily_doctor_lines;
DROP POLICY IF EXISTS "Users can delete doctor lines for their clinics" ON daily_doctor_lines;
DROP POLICY IF EXISTS "Users can insert expense lines for their clinics" ON daily_expense_lines;
DROP POLICY IF EXISTS "Users can update expense lines for their clinics" ON daily_expense_lines;
DROP POLICY IF EXISTS "Users can insert OP income for their clinics" ON daily_op_income;
DROP POLICY IF EXISTS "Users can update OP income for their clinics" ON daily_op_income;
DROP POLICY IF EXISTS "Users can delete OP income for their clinics" ON daily_op_income;
DROP POLICY IF EXISTS "Users can insert lab income for their clinics" ON daily_lab_income;
DROP POLICY IF EXISTS "Users can update lab income for their clinics" ON daily_lab_income;
DROP POLICY IF EXISTS "Users can delete lab income for their clinics" ON daily_lab_income;
DROP POLICY IF EXISTS "Users can insert pharmacy income for their clinics" ON daily_pharmacy_income;
DROP POLICY IF EXISTS "Users can update pharmacy income for their clinics" ON daily_pharmacy_income;
DROP POLICY IF EXISTS "Users can delete pharmacy income for their clinics" ON daily_pharmacy_income;
DROP POLICY IF EXISTS "Users can insert OBS income for their clinics" ON daily_obs_income;
DROP POLICY IF EXISTS "Users can update OBS income for their clinics" ON daily_obs_income;
DROP POLICY IF EXISTS "Users can delete OBS income for their clinics" ON daily_obs_income;
DROP POLICY IF EXISTS "Users can insert home care income for their clinics" ON daily_home_care_income;
DROP POLICY IF EXISTS "Users can update home care income for their clinics" ON daily_home_care_income;
DROP POLICY IF EXISTS "Users can delete home care income for their clinics" ON daily_home_care_income;

-- Remove role column from user_clinics
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_clinics' AND column_name = 'role'
  ) THEN
    ALTER TABLE user_clinics DROP COLUMN role;
  END IF;
END $$;

-- RLS Policies for users table
CREATE POLICY "Users can view their own role"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "SUPER_ADMIN can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "SUPER_ADMIN can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "SUPER_ADMIN can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'SUPER_ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "SUPER_ADMIN can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'SUPER_ADMIN'
    )
  );

-- Create new policies for user_clinics
CREATE POLICY "SUPER_ADMIN can manage all clinic memberships"
  ON user_clinics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'SUPER_ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'SUPER_ADMIN'
    )
  );

-- Create new policies for clinics
CREATE POLICY "SUPER_ADMIN can insert clinics"
  ON clinics FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "SUPER_ADMIN can update clinics"
  ON clinics FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'SUPER_ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "SUPER_ADMIN can delete clinics"
  ON clinics FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'SUPER_ADMIN'
    )
  );

-- Create new policies for doctors
CREATE POLICY "SUPER_ADMIN can insert doctors"
  ON doctors FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "SUPER_ADMIN can update doctors"
  ON doctors FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'SUPER_ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "SUPER_ADMIN can delete doctors"
  ON doctors FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'SUPER_ADMIN'
    )
  );

-- Create new policies for expense_heads
CREATE POLICY "SUPER_ADMIN can insert expense heads"
  ON expense_heads FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "SUPER_ADMIN can update expense heads"
  ON expense_heads FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'SUPER_ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "SUPER_ADMIN can delete expense heads"
  ON expense_heads FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'SUPER_ADMIN'
    )
  );

-- Recreate policies for daily_doctor_lines (linked via daily_entry)
CREATE POLICY "Users can insert doctor lines for their clinics"
  ON daily_doctor_lines FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_doctor_lines.daily_entry_id
      AND uc.user_id = auth.uid()
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
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_doctor_lines.daily_entry_id
      AND uc.user_id = auth.uid()
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
    )
  );

-- Recreate policies for daily_expense_lines (linked via daily_entry)
CREATE POLICY "Users can insert expense lines for their clinics"
  ON daily_expense_lines FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_expense_lines.daily_entry_id
      AND uc.user_id = auth.uid()
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
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_expense_lines.daily_entry_id
      AND uc.user_id = auth.uid()
    )
  );

-- Policies for daily_op_income
CREATE POLICY "Users can insert OP income for their clinics"
  ON daily_op_income FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_op_income.daily_entry_id
      AND uc.user_id = auth.uid()
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
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_op_income.daily_entry_id
      AND uc.user_id = auth.uid()
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
    )
  );

-- Policies for daily_lab_income
CREATE POLICY "Users can insert lab income for their clinics"
  ON daily_lab_income FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_lab_income.daily_entry_id
      AND uc.user_id = auth.uid()
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
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_lab_income.daily_entry_id
      AND uc.user_id = auth.uid()
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
    )
  );

-- Policies for daily_pharmacy_income
CREATE POLICY "Users can insert pharmacy income for their clinics"
  ON daily_pharmacy_income FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_pharmacy_income.daily_entry_id
      AND uc.user_id = auth.uid()
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
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_pharmacy_income.daily_entry_id
      AND uc.user_id = auth.uid()
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
    )
  );

-- Policies for daily_obs_income
CREATE POLICY "Users can insert OBS income for their clinics"
  ON daily_obs_income FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_obs_income.daily_entry_id
      AND uc.user_id = auth.uid()
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
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_obs_income.daily_entry_id
      AND uc.user_id = auth.uid()
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
    )
  );

-- Policies for daily_home_care_income
CREATE POLICY "Users can insert home care income for their clinics"
  ON daily_home_care_income FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_home_care_income.daily_entry_id
      AND uc.user_id = auth.uid()
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
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_entries de
      JOIN user_clinics uc ON uc.clinic_id = de.clinic_id
      WHERE de.id = daily_home_care_income.daily_entry_id
      AND uc.user_id = auth.uid()
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
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
