/*
  # Add Sample Clinic Data

  1. Sample Data
    - Insert 3 sample clinics
    - These can be used for testing the clinic selection flow
  
  2. Notes
    - Uses INSERT with ON CONFLICT to avoid duplicates
    - All clinics are active by default
*/

-- Insert sample clinics
INSERT INTO clinics (code, name, active)
VALUES 
  ('CLINIC001', 'Downtown Medical Clinic', true),
  ('CLINIC002', 'Northside Health Center', true),
  ('CLINIC003', 'Westside Family Practice', true)
ON CONFLICT (code) DO NOTHING;

-- Note: To assign clinics to a user, you'll need to insert into user_clinics table
-- Example (replace 'your-user-id' with actual user ID from auth.users):
-- INSERT INTO user_clinics (user_id, clinic_id, role)
-- SELECT 'your-user-id', id, 'admin' FROM clinics WHERE code IN ('CLINIC001', 'CLINIC002');
