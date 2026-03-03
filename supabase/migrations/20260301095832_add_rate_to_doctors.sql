/*
  # Add Rate Field to Doctors Table

  1. Purpose
    - Add consultation rate/fee field to doctors table
    - Allows tracking of doctor consultation charges

  2. Changes
    - Add `rate` column to doctors table (numeric type)
    - Set default value to 0
    - Allow updates to rate field

  3. Notes
    - Existing doctors will have rate set to 0
    - Rate can be set per doctor in the Admin > Doctors section
*/

-- Add rate column to doctors table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'doctors' AND column_name = 'rate'
  ) THEN
    ALTER TABLE doctors ADD COLUMN rate numeric(10, 2) DEFAULT 0 NOT NULL;
  END IF;
END $$;
