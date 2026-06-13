/*
  # Create Profile for Srikanth Patil

  This script creates a user profile entry in the user_profiles table with the specified details.
  
  1. Profile Details
    - Name: Srikanth Patil
    - Gender: Male
    - Date of Birth: 10/05/1986
    - Time of Birth: 12:15 AM
    - Place of Birth: Bhalki
    
  2. Database Structure
    - Creates entry in user_profiles table
    - Uses UUID for unique identification
    - Sets proper timestamps
*/

-- Insert user profile for Srikanth Patil
INSERT INTO user_profiles (
  id,
  first_name,
  last_name,
  date_of_birth,
  time_of_birth,
  place_of_birth,
  gender,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Srikanth',
  'Patil',
  '10/05/1986',
  '12:15 AM',
  'Bhalki, Karnataka',
  'male',
  now(),
  now()
);

-- Verify the insertion
SELECT 
  id,
  first_name,
  last_name,
  date_of_birth,
  time_of_birth,
  place_of_birth,
  gender,
  created_at
FROM user_profiles 
WHERE first_name = 'Srikanth' AND last_name = 'Patil'
ORDER BY created_at DESC
LIMIT 1;