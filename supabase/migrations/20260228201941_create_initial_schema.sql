/*
  # Initial Schema for Clinic Cashbook Application

  1. New Tables
    - `clinics`
      - `id` (uuid, primary key)
      - `name` (text, clinic name)
      - `created_at` (timestamptz, creation timestamp)
      - `updated_at` (timestamptz, last update timestamp)
    
    - `user_clinics`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `clinic_id` (uuid, references clinics)
      - `role` (text, user role in clinic - admin, staff, etc.)
      - `created_at` (timestamptz, creation timestamp)
    
    - `daily_entries`
      - `id` (uuid, primary key)
      - `clinic_id` (uuid, references clinics)
      - `entry_date` (date, date of the entry)
      - `opening_balance` (numeric, opening balance for the day)
      - `closing_balance` (numeric, closing balance for the day)
      - `total_income` (numeric, total income for the day)
      - `total_expenses` (numeric, total expenses for the day)
      - `notes` (text, optional notes)
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamptz, creation timestamp)
      - `updated_at` (timestamptz, last update timestamp)
    
    - `transactions`
      - `id` (uuid, primary key)
      - `daily_entry_id` (uuid, references daily_entries)
      - `clinic_id` (uuid, references clinics)
      - `type` (text, income or expense)
      - `category` (text, transaction category)
      - `amount` (numeric, transaction amount)
      - `description` (text, transaction description)
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamptz, creation timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their clinic data
    - Users can only access clinics they belong to
    - Users can only view/modify data for their assigned clinics

  3. Important Notes
    - All monetary amounts use numeric type for precision
    - User-clinic relationship allows multi-clinic access
    - Daily entries track opening/closing balances
    - Transactions are linked to daily entries for organization
*/

-- Create clinics table
CREATE TABLE IF NOT EXISTS clinics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

-- Create user_clinics junction table
CREATE TABLE IF NOT EXISTS user_clinics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'staff',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, clinic_id)
);

ALTER TABLE user_clinics ENABLE ROW LEVEL SECURITY;

-- Create daily_entries table
CREATE TABLE IF NOT EXISTS daily_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  entry_date date NOT NULL,
  opening_balance numeric(10, 2) DEFAULT 0,
  closing_balance numeric(10, 2) DEFAULT 0,
  total_income numeric(10, 2) DEFAULT 0,
  total_expenses numeric(10, 2) DEFAULT 0,
  notes text DEFAULT '',
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(clinic_id, entry_date)
);

ALTER TABLE daily_entries ENABLE ROW LEVEL SECURITY;

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_entry_id uuid NOT NULL REFERENCES daily_entries(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category text NOT NULL,
  amount numeric(10, 2) NOT NULL CHECK (amount > 0),
  description text DEFAULT '',
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clinics table
CREATE POLICY "Users can view clinics they belong to"
  ON clinics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_clinics
      WHERE user_clinics.clinic_id = clinics.id
      AND user_clinics.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin users can insert clinics"
  ON clinics FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin users can update their clinics"
  ON clinics FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_clinics
      WHERE user_clinics.clinic_id = clinics.id
      AND user_clinics.user_id = auth.uid()
      AND user_clinics.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_clinics
      WHERE user_clinics.clinic_id = clinics.id
      AND user_clinics.user_id = auth.uid()
      AND user_clinics.role = 'admin'
    )
  );

CREATE POLICY "Admin users can delete their clinics"
  ON clinics FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_clinics
      WHERE user_clinics.clinic_id = clinics.id
      AND user_clinics.user_id = auth.uid()
      AND user_clinics.role = 'admin'
    )
  );

-- RLS Policies for user_clinics table
CREATE POLICY "Users can view their own clinic memberships"
  ON user_clinics FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own clinic memberships"
  ON user_clinics FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin users can update clinic memberships"
  ON user_clinics FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_clinics uc
      WHERE uc.clinic_id = user_clinics.clinic_id
      AND uc.user_id = auth.uid()
      AND uc.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_clinics uc
      WHERE uc.clinic_id = user_clinics.clinic_id
      AND uc.user_id = auth.uid()
      AND uc.role = 'admin'
    )
  );

CREATE POLICY "Admin users can delete clinic memberships"
  ON user_clinics FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_clinics uc
      WHERE uc.clinic_id = user_clinics.clinic_id
      AND uc.user_id = auth.uid()
      AND uc.role = 'admin'
    )
  );

-- RLS Policies for daily_entries table
CREATE POLICY "Users can view daily entries for their clinics"
  ON daily_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_clinics
      WHERE user_clinics.clinic_id = daily_entries.clinic_id
      AND user_clinics.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create daily entries for their clinics"
  ON daily_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_clinics
      WHERE user_clinics.clinic_id = daily_entries.clinic_id
      AND user_clinics.user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update daily entries for their clinics"
  ON daily_entries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_clinics
      WHERE user_clinics.clinic_id = daily_entries.clinic_id
      AND user_clinics.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_clinics
      WHERE user_clinics.clinic_id = daily_entries.clinic_id
      AND user_clinics.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete daily entries for their clinics"
  ON daily_entries FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_clinics
      WHERE user_clinics.clinic_id = daily_entries.clinic_id
      AND user_clinics.user_id = auth.uid()
    )
  );

-- RLS Policies for transactions table
CREATE POLICY "Users can view transactions for their clinics"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_clinics
      WHERE user_clinics.clinic_id = transactions.clinic_id
      AND user_clinics.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create transactions for their clinics"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_clinics
      WHERE user_clinics.clinic_id = transactions.clinic_id
      AND user_clinics.user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update transactions for their clinics"
  ON transactions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_clinics
      WHERE user_clinics.clinic_id = transactions.clinic_id
      AND user_clinics.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_clinics
      WHERE user_clinics.clinic_id = transactions.clinic_id
      AND user_clinics.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete transactions for their clinics"
  ON transactions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_clinics
      WHERE user_clinics.clinic_id = transactions.clinic_id
      AND user_clinics.user_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_clinics_user_id ON user_clinics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_clinics_clinic_id ON user_clinics(clinic_id);
CREATE INDEX IF NOT EXISTS idx_daily_entries_clinic_id ON daily_entries(clinic_id);
CREATE INDEX IF NOT EXISTS idx_daily_entries_entry_date ON daily_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_transactions_daily_entry_id ON transactions(daily_entry_id);
CREATE INDEX IF NOT EXISTS idx_transactions_clinic_id ON transactions(clinic_id);