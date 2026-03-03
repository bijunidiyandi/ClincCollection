/*
  # Add Rate and Quantity Fields to OP Income

  1. Changes
    - Add `rate` column to `daily_op_income` table
    - Add `cash_quantity` column to `daily_op_income` table
    - Add `gp_quantity` column to `daily_op_income` table
  
  2. Details
    - `rate` (numeric) - The rate per patient visit
    - `cash_quantity` (integer) - Number of cash patients
    - `gp_quantity` (integer) - Number of GPay patients
    - These fields enable automatic calculation of cash_amount and gpay_amount
  
  3. Important Notes
    - Fields are optional (nullable) to maintain backward compatibility
    - Existing records will have NULL values for these fields
    - New records should populate these fields for proper tracking
*/

-- Add new columns to daily_op_income table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_op_income' AND column_name = 'rate'
  ) THEN
    ALTER TABLE daily_op_income ADD COLUMN rate numeric(12, 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_op_income' AND column_name = 'cash_quantity'
  ) THEN
    ALTER TABLE daily_op_income ADD COLUMN cash_quantity integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_op_income' AND column_name = 'gp_quantity'
  ) THEN
    ALTER TABLE daily_op_income ADD COLUMN gp_quantity integer;
  END IF;
END $$;
