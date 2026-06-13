/*
  # Initial schema for the Astrology app (self-hosted Supabase)

  This migration defines the six core tables the app expects, enables
  Row Level Security on all of them, adds owner-only RLS policies, and
  wires up triggers for profile bootstrapping and updated_at maintenance.

  Design notes
  ------------
  - user_profiles.id == auth.users.id (the standard Supabase pattern). One
    profile row per auth user; deleting the auth user cascades the profile.
  - Reading payloads (astrology/numerology/palm/horoscope) are large, nested
    objects in the app (see utils/astrology.ts AstrologyReading and
    utils/numerology.ts NumerologyReading). Storing them as a single jsonb
    `data` column is pragmatic and avoids brittle column-per-field schemas.
  - date_of_birth / time_of_birth are stored as text because the app stores
    DD/MM/YYYY strings and free-form time strings (e.g. "12:15 AM").
  - The whole file is idempotent: tables use IF NOT EXISTS, policies are
    dropped-then-created, and functions use CREATE OR REPLACE.

  Run with:  psql "$DATABASE_URL" -f 20250105120000_initial_schema.sql
*/

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
-- pgcrypto provides gen_random_uuid() used as the default for reading PKs.
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Shared helper: updated_at touch trigger function
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ===========================================================================
-- Table: user_profiles
--   One row per auth user. id is both PK and FK to auth.users.
-- ===========================================================================
create table if not exists public.user_profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  first_name     text,
  last_name      text,
  date_of_birth  text,                                      -- DD/MM/YYYY (app format)
  time_of_birth  text,                                      -- nullable, e.g. "12:15 AM"
  place_of_birth text,
  gender         text check (gender in ('male', 'female')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- updated_at touch trigger
drop trigger if exists trg_user_profiles_updated_at on public.user_profiles;
create trigger trg_user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- Table: astrology_readings
-- ===========================================================================
create table if not exists public.astrology_readings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,            -- AstrologyReading payload
  created_at timestamptz not null default now()
);
create index if not exists idx_astrology_readings_user_id
  on public.astrology_readings(user_id);

-- ===========================================================================
-- Table: numerology_readings
-- ===========================================================================
create table if not exists public.numerology_readings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,            -- NumerologyReading payload
  created_at timestamptz not null default now()
);
create index if not exists idx_numerology_readings_user_id
  on public.numerology_readings(user_id);

-- ===========================================================================
-- Table: palm_readings
-- ===========================================================================
create table if not exists public.palm_readings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,            -- palm analysis payload
  created_at timestamptz not null default now()
);
create index if not exists idx_palm_readings_user_id
  on public.palm_readings(user_id);

-- ===========================================================================
-- Table: daily_horoscopes
--   horoscope_date lets the app fetch "today's" horoscope per user.
-- ===========================================================================
create table if not exists public.daily_horoscopes (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  horoscope_date date not null default current_date,
  data           jsonb not null default '{}'::jsonb,        -- DailyHoroscope payload
  created_at     timestamptz not null default now()
);
create index if not exists idx_daily_horoscopes_user_date
  on public.daily_horoscopes(user_id, horoscope_date);

-- ===========================================================================
-- Table: app_settings
--   One settings row per user (user_id is the PK).
-- ===========================================================================
create table if not exists public.app_settings (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  settings   jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_app_settings_updated_at on public.app_settings;
create trigger trg_app_settings_updated_at
  before update on public.app_settings
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- Row Level Security
--   Enable RLS everywhere and add owner-only policies. The owning column is
--   `user_id` for reading tables, and `id` for user_profiles / `user_id` for
--   app_settings. Each user can only touch their own rows.
-- ===========================================================================

alter table public.user_profiles       enable row level security;
alter table public.astrology_readings  enable row level security;
alter table public.numerology_readings enable row level security;
alter table public.palm_readings       enable row level security;
alter table public.daily_horoscopes    enable row level security;
alter table public.app_settings        enable row level security;

-- --- user_profiles (owner = id) -------------------------------------------
drop policy if exists "user_profiles_select_own" on public.user_profiles;
create policy "user_profiles_select_own" on public.user_profiles
  for select using (auth.uid() = id);

drop policy if exists "user_profiles_insert_own" on public.user_profiles;
create policy "user_profiles_insert_own" on public.user_profiles
  for insert with check (auth.uid() = id);

drop policy if exists "user_profiles_update_own" on public.user_profiles;
create policy "user_profiles_update_own" on public.user_profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "user_profiles_delete_own" on public.user_profiles;
create policy "user_profiles_delete_own" on public.user_profiles
  for delete using (auth.uid() = id);

-- --- app_settings (owner = user_id) ---------------------------------------
drop policy if exists "app_settings_select_own" on public.app_settings;
create policy "app_settings_select_own" on public.app_settings
  for select using (auth.uid() = user_id);

drop policy if exists "app_settings_insert_own" on public.app_settings;
create policy "app_settings_insert_own" on public.app_settings
  for insert with check (auth.uid() = user_id);

drop policy if exists "app_settings_update_own" on public.app_settings;
create policy "app_settings_update_own" on public.app_settings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "app_settings_delete_own" on public.app_settings;
create policy "app_settings_delete_own" on public.app_settings
  for delete using (auth.uid() = user_id);

-- --- Reading tables (owner = user_id) -------------------------------------
-- astrology_readings
drop policy if exists "astrology_readings_select_own" on public.astrology_readings;
create policy "astrology_readings_select_own" on public.astrology_readings
  for select using (auth.uid() = user_id);
drop policy if exists "astrology_readings_insert_own" on public.astrology_readings;
create policy "astrology_readings_insert_own" on public.astrology_readings
  for insert with check (auth.uid() = user_id);
drop policy if exists "astrology_readings_update_own" on public.astrology_readings;
create policy "astrology_readings_update_own" on public.astrology_readings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "astrology_readings_delete_own" on public.astrology_readings;
create policy "astrology_readings_delete_own" on public.astrology_readings
  for delete using (auth.uid() = user_id);

-- numerology_readings
drop policy if exists "numerology_readings_select_own" on public.numerology_readings;
create policy "numerology_readings_select_own" on public.numerology_readings
  for select using (auth.uid() = user_id);
drop policy if exists "numerology_readings_insert_own" on public.numerology_readings;
create policy "numerology_readings_insert_own" on public.numerology_readings
  for insert with check (auth.uid() = user_id);
drop policy if exists "numerology_readings_update_own" on public.numerology_readings;
create policy "numerology_readings_update_own" on public.numerology_readings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "numerology_readings_delete_own" on public.numerology_readings;
create policy "numerology_readings_delete_own" on public.numerology_readings
  for delete using (auth.uid() = user_id);

-- palm_readings
drop policy if exists "palm_readings_select_own" on public.palm_readings;
create policy "palm_readings_select_own" on public.palm_readings
  for select using (auth.uid() = user_id);
drop policy if exists "palm_readings_insert_own" on public.palm_readings;
create policy "palm_readings_insert_own" on public.palm_readings
  for insert with check (auth.uid() = user_id);
drop policy if exists "palm_readings_update_own" on public.palm_readings;
create policy "palm_readings_update_own" on public.palm_readings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "palm_readings_delete_own" on public.palm_readings;
create policy "palm_readings_delete_own" on public.palm_readings
  for delete using (auth.uid() = user_id);

-- daily_horoscopes
drop policy if exists "daily_horoscopes_select_own" on public.daily_horoscopes;
create policy "daily_horoscopes_select_own" on public.daily_horoscopes
  for select using (auth.uid() = user_id);
drop policy if exists "daily_horoscopes_insert_own" on public.daily_horoscopes;
create policy "daily_horoscopes_insert_own" on public.daily_horoscopes
  for insert with check (auth.uid() = user_id);
drop policy if exists "daily_horoscopes_update_own" on public.daily_horoscopes;
create policy "daily_horoscopes_update_own" on public.daily_horoscopes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "daily_horoscopes_delete_own" on public.daily_horoscopes;
create policy "daily_horoscopes_delete_own" on public.daily_horoscopes
  for delete using (auth.uid() = user_id);

-- ===========================================================================
-- Auto-provision a profile row when a new auth user is created.
--   This runs as the auth schema owner via SECURITY DEFINER so it can insert
--   into public.user_profiles regardless of RLS. The trigger lives on
--   auth.users, which GoTrue populates on signup.
-- ===========================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
