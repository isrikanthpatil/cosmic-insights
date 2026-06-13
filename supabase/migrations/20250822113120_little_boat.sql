/*
  # Remove Srikanth Patil Profile

  1. Data Cleanup
    - Remove user_profiles entry for Srikanth Patil
    - Remove corresponding auth.users entry
    - Clean up any related data

  2. Security
    - Safe deletion with proper constraints
    - Cascade deletion will handle related records
*/

-- Remove the user profile and auth user for Srikanth Patil
DO $$
DECLARE
  user_uuid uuid;
BEGIN
  -- Get the user ID for Srikanth Patil
  SELECT id INTO user_uuid 
  FROM user_profiles 
  WHERE first_name = 'Srikanth' AND last_name = 'Patil'
  LIMIT 1;

  -- If user exists, delete the profile (cascade will handle auth.users)
  IF user_uuid IS NOT NULL THEN
    DELETE FROM user_profiles WHERE id = user_uuid;
    
    -- Also delete from auth.users if it exists
    DELETE FROM auth.users WHERE id = user_uuid;
    
    RAISE NOTICE 'Removed Srikanth Patil profile with ID: %', user_uuid;
  ELSE
    RAISE NOTICE 'Srikanth Patil profile not found';
  END IF;
END $$;

-- Verify the deletion
SELECT COUNT(*) as remaining_srikanth_profiles
FROM user_profiles 
WHERE first_name = 'Srikanth' AND last_name = 'Patil';