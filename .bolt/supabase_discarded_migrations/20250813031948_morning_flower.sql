/*
  # Initial Database Schema for Cosmic Insights

  1. New Tables
    - `user_profiles` - User information and birth details
    - `astrology_readings` - Astrological analysis and predictions  
    - `numerology_readings` - Numerology calculations and meanings
    - `palm_readings` - Palm analysis results
    - `daily_horoscopes` - Daily horoscope predictions
    - `app_settings` - User preferences and settings

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access only their own data
    - Secure foreign key relationships
    - Input validation and constraints

  3. Changes
    - Complete database schema with proper relationships
    - Row Level Security implementation
    - User data protection and privacy
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL CHECK (length(first_name) >= 1 AND length(first_name) <= 50),
  last_name text NOT NULL CHECK (length(last_name) >= 1 AND length(last_name) <= 50),
  date_of_birth text NOT NULL CHECK (date_of_birth ~ '^\d{2}/\d{2}/\d{4}$'),
  time_of_birth text DEFAULT '' CHECK (length(time_of_birth) <= 20),
  place_of_birth text NOT NULL CHECK (length(place_of_birth) >= 1 AND length(place_of_birth) <= 200),
  gender text NOT NULL CHECK (gender IN ('male', 'female')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Astrology readings table
CREATE TABLE IF NOT EXISTS astrology_readings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  sun_sign text NOT NULL CHECK (length(sun_sign) <= 20),
  moon_sign text NOT NULL CHECK (length(moon_sign) <= 20),
  ascendant text NOT NULL CHECK (length(ascendant) <= 20),
  reading_data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Numerology readings table
CREATE TABLE IF NOT EXISTS numerology_readings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  birth_number integer NOT NULL CHECK (birth_number >= 1 AND birth_number <= 9),
  destiny_number integer NOT NULL CHECK (destiny_number >= 1 AND destiny_number <= 9),
  kua_number integer NOT NULL CHECK (kua_number >= 1 AND kua_number <= 9),
  loshu_grid jsonb NOT NULL DEFAULT '[]',
  reading_data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Palm readings table
CREATE TABLE IF NOT EXISTS palm_readings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  image_url text CHECK (image_url IS NULL OR image_url ~ '^https?://'),
  analysis_data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Daily horoscopes table
CREATE TABLE IF NOT EXISTS daily_horoscopes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  horoscope_date date NOT NULL DEFAULT CURRENT_DATE,
  content text NOT NULL CHECK (length(content) >= 10 AND length(content) <= 2000),
  lucky_numbers integer[] DEFAULT '{}',
  lucky_color text DEFAULT '' CHECK (length(lucky_color) <= 50),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, horoscope_date)
);

-- App settings table
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  settings_data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Enable Row Level Security on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE astrology_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE numerology_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE palm_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_horoscopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for astrology_readings
CREATE POLICY "Users can read own astrology readings"
  ON astrology_readings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own astrology readings"
  ON astrology_readings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own astrology readings"
  ON astrology_readings
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own astrology readings"
  ON astrology_readings
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for numerology_readings
CREATE POLICY "Users can read own numerology readings"
  ON numerology_readings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own numerology readings"
  ON numerology_readings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own numerology readings"
  ON numerology_readings
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own numerology readings"
  ON numerology_readings
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for palm_readings
CREATE POLICY "Users can read own palm readings"
  ON palm_readings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own palm readings"
  ON palm_readings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own palm readings"
  ON palm_readings
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own palm readings"
  ON palm_readings
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for daily_horoscopes
CREATE POLICY "Users can read own daily horoscopes"
  ON daily_horoscopes
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own daily horoscopes"
  ON daily_horoscopes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own daily horoscopes"
  ON daily_horoscopes
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own daily horoscopes"
  ON daily_horoscopes
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for app_settings
CREATE POLICY "Users can read own app settings"
  ON app_settings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own app settings"
  ON app_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own app settings"
  ON app_settings
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own app settings"
  ON app_settings
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_astrology_readings_user_id ON astrology_readings(user_id);
CREATE INDEX IF NOT EXISTS idx_numerology_readings_user_id ON numerology_readings(user_id);
CREATE INDEX IF NOT EXISTS idx_palm_readings_user_id ON palm_readings(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_horoscopes_user_id ON daily_horoscopes(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_horoscopes_date ON daily_horoscopes(horoscope_date);
CREATE INDEX IF NOT EXISTS idx_app_settings_user_id ON app_settings(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_astrology_readings_updated_at
  BEFORE UPDATE ON astrology_readings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_numerology_readings_updated_at
  BEFORE UPDATE ON numerology_readings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();