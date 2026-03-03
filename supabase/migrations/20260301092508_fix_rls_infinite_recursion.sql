/*
  # Fix RLS Infinite Recursion

  1. Problem
    - RLS policies were causing infinite recursion when checking if a user is SUPER_ADMIN
    - The policies on `users` table query the `users` table itself, creating a loop
    - This prevents any queries from working when RLS is enabled

  2. Solution
    - Make the base `users` table policy allow users to read their own row without recursion
    - Use a PostgreSQL function to check SUPER_ADMIN status that bypasses RLS
    - Update all policies that check for SUPER_ADMIN to use the function instead
    
  3. Changes
    - Create a security definer function to check if current user is SUPER_ADMIN
    - Drop and recreate all RLS policies on users, user_clinics, and clinics tables
    - Ensure no circular dependencies in policy checks
*/

-- Drop all existing policies that cause recursion
DROP POLICY IF EXISTS "SUPER_ADMIN can view all users" ON users;
DROP POLICY IF EXISTS "SUPER_ADMIN can insert users" ON users;
DROP POLICY IF EXISTS "SUPER_ADMIN can update users" ON users;
DROP POLICY IF EXISTS "SUPER_ADMIN can delete users" ON users;
DROP POLICY IF EXISTS "Users can view their own role" ON users;

DROP POLICY IF EXISTS "SUPER_ADMIN can manage all clinic memberships" ON user_clinics;
DROP POLICY IF EXISTS "Users can view their own clinic memberships" ON user_clinics;
DROP POLICY IF EXISTS "Users can create their own clinic memberships" ON user_clinics;

DROP POLICY IF EXISTS "Users can view their assigned clinics" ON clinics;
DROP POLICY IF EXISTS "SUPER_ADMIN can insert clinics" ON clinics;
DROP POLICY IF EXISTS "SUPER_ADMIN can update clinics" ON clinics;
DROP POLICY IF EXISTS "SUPER_ADMIN can delete clinics" ON clinics;

-- Create a function to check if the current user is a SUPER_ADMIN
-- This function uses SECURITY DEFINER to bypass RLS when checking the users table
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users table policies (no recursion - direct checks only)
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "SUPER_ADMIN can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (is_super_admin());

CREATE POLICY "SUPER_ADMIN can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin());

CREATE POLICY "SUPER_ADMIN can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "SUPER_ADMIN can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (is_super_admin());

-- User clinics policies
CREATE POLICY "Users can view their own clinic memberships"
  ON user_clinics FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "SUPER_ADMIN can view all clinic memberships"
  ON user_clinics FOR SELECT
  TO authenticated
  USING (is_super_admin());

CREATE POLICY "SUPER_ADMIN can insert clinic memberships"
  ON user_clinics FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin());

CREATE POLICY "SUPER_ADMIN can update clinic memberships"
  ON user_clinics FOR UPDATE
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "SUPER_ADMIN can delete clinic memberships"
  ON user_clinics FOR DELETE
  TO authenticated
  USING (is_super_admin());

-- Clinics policies
CREATE POLICY "Users can view their assigned clinics"
  ON clinics FOR SELECT
  TO authenticated
  USING (
    is_super_admin() OR
    EXISTS (
      SELECT 1 FROM user_clinics
      WHERE user_clinics.clinic_id = clinics.id
      AND user_clinics.user_id = auth.uid()
    )
  );

CREATE POLICY "SUPER_ADMIN can insert clinics"
  ON clinics FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin());

CREATE POLICY "SUPER_ADMIN can update clinics"
  ON clinics FOR UPDATE
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "SUPER_ADMIN can delete clinics"
  ON clinics FOR DELETE
  TO authenticated
  USING (is_super_admin());
