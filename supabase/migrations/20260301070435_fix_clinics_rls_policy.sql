/*
  # Fix Clinics RLS Policy

  1. Changes
    - Drop existing "Users can view clinics they belong to" policy
    - Create new policy that allows:
      - SUPER_ADMIN users to view all clinics
      - Regular users to view clinics they belong to (via user_clinics)
    
  2. Security
    - Maintains data isolation for regular users
    - Allows SUPER_ADMIN full visibility
    - Prevents circular RLS dependency issues
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view clinics they belong to" ON clinics;

-- Create new policy that handles both SUPER_ADMIN and regular users
CREATE POLICY "Users can view their assigned clinics"
  ON clinics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'SUPER_ADMIN'
    )
    OR
    EXISTS (
      SELECT 1 FROM user_clinics 
      WHERE user_clinics.clinic_id = clinics.id 
      AND user_clinics.user_id = auth.uid()
    )
  );
