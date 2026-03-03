/*
  # Add Code Column to Doctors Table

  1. Purpose
    - Add optional code field to doctors table for doctor identification codes

  2. Changes
    - Add `code` column to doctors table (text type, nullable)

  3. Notes
    - Existing doctors will have NULL code initially
    - Code can be set optionally per doctor
*/

-- Add code column to doctors table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'doctors' AND column_name = 'code'
  ) THEN
    ALTER TABLE doctors ADD COLUMN code text;
  END IF;
END $$;
