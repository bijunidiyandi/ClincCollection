/*
  # Add Sample Doctors

  1. Purpose
    - Add sample doctors to each clinic so users can create daily entries
    - Provides realistic test data for the cashbook system

  2. Changes
    - Insert sample doctors for each of the three clinics
    - Each clinic gets 2-3 doctors with realistic names
    - All doctors are set to active status

  3. Sample Data
    - SAFE CURE HEALTH CARE CENTER: Dr. Ahmed, Dr. Sarah
    - MANIYUR MEDICAL CENTER: Dr. Raj, Dr. Priya
    - MARAKKAR HEALTH CENTER: Dr. Ibrahim, Dr. Fatima, Dr. Yusuf
*/

-- Get clinic IDs and insert doctors
DO $$
DECLARE
  safe_cure_id uuid;
  maniyur_id uuid;
  marakkar_id uuid;
BEGIN
  -- Get clinic IDs
  SELECT id INTO safe_cure_id FROM clinics WHERE code = 'CLINIC001';
  SELECT id INTO maniyur_id FROM clinics WHERE code = 'CLINIC002';
  SELECT id INTO marakkar_id FROM clinics WHERE code = 'CLINIC003';

  -- Add doctors for SAFE CURE HEALTH CARE CENTER
  IF safe_cure_id IS NOT NULL THEN
    INSERT INTO doctors (clinic_id, name, active)
    VALUES 
      (safe_cure_id, 'Dr. Ahmed Hassan', true),
      (safe_cure_id, 'Dr. Sarah Khan', true);
  END IF;

  -- Add doctors for MANIYUR MEDICAL CENTER
  IF maniyur_id IS NOT NULL THEN
    INSERT INTO doctors (clinic_id, name, active)
    VALUES 
      (maniyur_id, 'Dr. Raj Kumar', true),
      (maniyur_id, 'Dr. Priya Sharma', true);
  END IF;

  -- Add doctors for MARAKKAR HEALTH CENTER
  IF marakkar_id IS NOT NULL THEN
    INSERT INTO doctors (clinic_id, name, active)
    VALUES 
      (marakkar_id, 'Dr. Ibrahim Ali', true),
      (marakkar_id, 'Dr. Fatima Noor', true),
      (marakkar_id, 'Dr. Yusuf Mohammed', true);
  END IF;
END $$;
