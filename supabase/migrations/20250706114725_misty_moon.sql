/*
  # Create Srikanth Patil Profile

  1. New User Entry
    - Creates a user in the auth.users table
    - Creates corresponding user_profiles entry
    
  2. Profile Details
    - Name: Srikanth Patil
    - Gender: Male
    - Date of Birth: 10/05/1986
    - Time of Birth: 12:15 AM
    - Place of Birth: Bhalki, Karnataka
*/

-- First, insert into auth.users table to satisfy foreign key constraint
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'srikanth.patil@example.com',
  crypt('temppassword123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Get the user ID we just created
DO $$
DECLARE
  user_uuid uuid;
BEGIN
  -- Get the ID of the user we just created
  SELECT id INTO user_uuid 
  FROM auth.users 
  WHERE email = 'srikanth.patil@example.com'
  ORDER BY created_at DESC 
  LIMIT 1;

  -- Insert the user profile using the auth user's ID
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
    user_uuid,
    'Srikanth',
    'Patil',
    '10/05/1996',
    '12:15 AM',
    'Bhalki, Karnataka',
    'male',
    now(),
    now()
  );
END $$;

-- Verify the insertion
SELECT 
  up.id,
  up.first_name,
  up.last_name,
  up.date_of_birth,
  up.time_of_birth,
  up.place_of_birth,
  up.gender,
  up.created_at,
  au.email
FROM user_profiles up
JOIN auth.users au ON up.id = au.id
WHERE up.first_name = 'Srikanth' AND up.last_name = 'Patil'
ORDER BY up.created_at DESC
LIMIT 1;