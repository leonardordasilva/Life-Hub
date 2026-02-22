
-- =============================================
-- 1. Create profiles table
-- =============================================
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  date_of_birth DATE,
  avatar_url TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  -- Module preferences
  module_finance BOOLEAN NOT NULL DEFAULT false,
  module_vacation BOOLEAN NOT NULL DEFAULT false,
  module_entertainment BOOLEAN NOT NULL DEFAULT false,
  module_games BOOLEAN NOT NULL DEFAULT false,
  -- Entertainment sub-types
  ent_series BOOLEAN NOT NULL DEFAULT false,
  ent_movies BOOLEAN NOT NULL DEFAULT false,
  ent_animes BOOLEAN NOT NULL DEFAULT false,
  ent_books BOOLEAN NOT NULL DEFAULT false,
  -- Community visibility
  community_finance BOOLEAN NOT NULL DEFAULT false,
  community_vacation BOOLEAN NOT NULL DEFAULT false,
  community_games BOOLEAN NOT NULL DEFAULT false,
  community_series BOOLEAN NOT NULL DEFAULT false,
  community_movies BOOLEAN NOT NULL DEFAULT false,
  community_animes BOOLEAN NOT NULL DEFAULT false,
  community_books BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- 2. Create storage bucket for avatars
-- =============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =============================================
-- 3. Add user_id to ALL data tables
-- =============================================

-- Finance tables
ALTER TABLE public.finance_categories ADD COLUMN user_id UUID;
ALTER TABLE public.finance_transactions ADD COLUMN user_id UUID;
ALTER TABLE public.finance_reserves ADD COLUMN user_id UUID;

-- Vacation tables
ALTER TABLE public.vacation_trips ADD COLUMN user_id UUID;
ALTER TABLE public.vacation_flights ADD COLUMN user_id UUID;
ALTER TABLE public.vacation_hotels ADD COLUMN user_id UUID;
ALTER TABLE public.vacation_tours ADD COLUMN user_id UUID;

-- Entertainment tables
ALTER TABLE public.ent_series ADD COLUMN user_id UUID;
ALTER TABLE public.ent_movies ADD COLUMN user_id UUID;
ALTER TABLE public.ent_animes ADD COLUMN user_id UUID;
ALTER TABLE public.ent_books ADD COLUMN user_id UUID;
ALTER TABLE public.ent_games ADD COLUMN user_id UUID;

-- =============================================
-- 4. Assign existing data to admin user
-- =============================================
UPDATE public.finance_categories SET user_id = '66e869ab-7531-4f7a-a58a-41dee643bb54' WHERE user_id IS NULL;
UPDATE public.finance_transactions SET user_id = '66e869ab-7531-4f7a-a58a-41dee643bb54' WHERE user_id IS NULL;
UPDATE public.finance_reserves SET user_id = '66e869ab-7531-4f7a-a58a-41dee643bb54' WHERE user_id IS NULL;
UPDATE public.vacation_trips SET user_id = '66e869ab-7531-4f7a-a58a-41dee643bb54' WHERE user_id IS NULL;
UPDATE public.vacation_flights SET user_id = '66e869ab-7531-4f7a-a58a-41dee643bb54' WHERE user_id IS NULL;
UPDATE public.vacation_hotels SET user_id = '66e869ab-7531-4f7a-a58a-41dee643bb54' WHERE user_id IS NULL;
UPDATE public.vacation_tours SET user_id = '66e869ab-7531-4f7a-a58a-41dee643bb54' WHERE user_id IS NULL;
UPDATE public.ent_series SET user_id = '66e869ab-7531-4f7a-a58a-41dee643bb54' WHERE user_id IS NULL;
UPDATE public.ent_movies SET user_id = '66e869ab-7531-4f7a-a58a-41dee643bb54' WHERE user_id IS NULL;
UPDATE public.ent_animes SET user_id = '66e869ab-7531-4f7a-a58a-41dee643bb54' WHERE user_id IS NULL;
UPDATE public.ent_books SET user_id = '66e869ab-7531-4f7a-a58a-41dee643bb54' WHERE user_id IS NULL;
UPDATE public.ent_games SET user_id = '66e869ab-7531-4f7a-a58a-41dee643bb54' WHERE user_id IS NULL;

-- =============================================
-- 5. Make user_id NOT NULL after backfill
-- =============================================
ALTER TABLE public.finance_categories ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.finance_transactions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.finance_reserves ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.vacation_trips ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.vacation_flights ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.vacation_hotels ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.vacation_tours ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.ent_series ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.ent_movies ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.ent_animes ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.ent_books ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.ent_games ALTER COLUMN user_id SET NOT NULL;

-- =============================================
-- 6. Set default for user_id on inserts (uses auth.uid())
-- =============================================
ALTER TABLE public.finance_categories ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.finance_transactions ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.finance_reserves ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.vacation_trips ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.vacation_flights ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.vacation_hotels ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.vacation_tours ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.ent_series ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.ent_movies ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.ent_animes ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.ent_books ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.ent_games ALTER COLUMN user_id SET DEFAULT auth.uid();

-- =============================================
-- 7. Drop ALL existing RLS policies and create user-isolated ones
-- =============================================

-- Finance Categories
DROP POLICY IF EXISTS "Admins full access" ON public.finance_categories;
CREATE POLICY "Users own data" ON public.finance_categories FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Finance Transactions
DROP POLICY IF EXISTS "Admins full access" ON public.finance_transactions;
CREATE POLICY "Users own data" ON public.finance_transactions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Finance Reserves
DROP POLICY IF EXISTS "Admins full access" ON public.finance_reserves;
CREATE POLICY "Users own data" ON public.finance_reserves FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Vacation Trips
DROP POLICY IF EXISTS "Admins full access" ON public.vacation_trips;
CREATE POLICY "Users own data" ON public.vacation_trips FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Vacation Flights
DROP POLICY IF EXISTS "Admins full access" ON public.vacation_flights;
CREATE POLICY "Users own data" ON public.vacation_flights FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Vacation Hotels
DROP POLICY IF EXISTS "Admins full access" ON public.vacation_hotels;
CREATE POLICY "Users own data" ON public.vacation_hotels FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Vacation Tours
DROP POLICY IF EXISTS "Admins full access" ON public.vacation_tours;
CREATE POLICY "Users own data" ON public.vacation_tours FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Entertainment Series
DROP POLICY IF EXISTS "Authenticated read" ON public.ent_series;
DROP POLICY IF EXISTS "Admins write" ON public.ent_series;
DROP POLICY IF EXISTS "Admins update" ON public.ent_series;
DROP POLICY IF EXISTS "Admins delete" ON public.ent_series;
CREATE POLICY "Users own data" ON public.ent_series FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Entertainment Movies
DROP POLICY IF EXISTS "Authenticated read" ON public.ent_movies;
DROP POLICY IF EXISTS "Admins write" ON public.ent_movies;
DROP POLICY IF EXISTS "Admins update" ON public.ent_movies;
DROP POLICY IF EXISTS "Admins delete" ON public.ent_movies;
CREATE POLICY "Users own data" ON public.ent_movies FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Entertainment Animes
DROP POLICY IF EXISTS "Authenticated read" ON public.ent_animes;
DROP POLICY IF EXISTS "Admins write" ON public.ent_animes;
DROP POLICY IF EXISTS "Admins update" ON public.ent_animes;
DROP POLICY IF EXISTS "Admins delete" ON public.ent_animes;
CREATE POLICY "Users own data" ON public.ent_animes FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Entertainment Books
DROP POLICY IF EXISTS "Authenticated read" ON public.ent_books;
DROP POLICY IF EXISTS "Admins write" ON public.ent_books;
DROP POLICY IF EXISTS "Admins update" ON public.ent_books;
DROP POLICY IF EXISTS "Admins delete" ON public.ent_books;
CREATE POLICY "Users own data" ON public.ent_books FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Entertainment Games
DROP POLICY IF EXISTS "Authenticated read" ON public.ent_games;
DROP POLICY IF EXISTS "Admins write" ON public.ent_games;
DROP POLICY IF EXISTS "Admins update" ON public.ent_games;
DROP POLICY IF EXISTS "Admins delete" ON public.ent_games;
CREATE POLICY "Users own data" ON public.ent_games FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 8. Create admin profile with onboarding completed
-- =============================================
INSERT INTO public.profiles (user_id, display_name, onboarding_completed, module_finance, module_vacation, module_entertainment, module_games, ent_series, ent_movies, ent_animes, ent_books)
VALUES ('66e869ab-7531-4f7a-a58a-41dee643bb54', 'Admin', true, true, true, true, true, true, true, true, true);

-- =============================================
-- 9. Update handle_new_user trigger to also create profile stub
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'visitor');
  INSERT INTO public.profiles (user_id, email) VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$function$;
