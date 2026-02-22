
-- Helper function to check community access
CREATE OR REPLACE FUNCTION public.has_community_access(target_user_id uuid, module text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = target_user_id
    AND CASE module
      WHEN 'series' THEN community_series
      WHEN 'movies' THEN community_movies
      WHEN 'animes' THEN community_animes
      WHEN 'books' THEN community_books
      WHEN 'games' THEN community_games
      WHEN 'finance' THEN community_finance
      WHEN 'vacation' THEN community_vacation
      ELSE false
    END = true
  )
$$;

-- ==========================================
-- PROFILES: allow viewing community profiles
-- ==========================================
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view profiles" ON profiles FOR SELECT TO authenticated
USING (
  auth.uid() = user_id 
  OR community_finance = true 
  OR community_vacation = true 
  OR community_games = true 
  OR community_series = true 
  OR community_movies = true 
  OR community_animes = true 
  OR community_books = true
);

-- ==========================================
-- DATA TABLES: drop restrictive ALL, recreate as permissive per-command
-- ==========================================

-- ENT_SERIES
DROP POLICY IF EXISTS "Users own data" ON ent_series;
CREATE POLICY "Select own or community" ON ent_series FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_community_access(user_id, 'series'));
CREATE POLICY "Insert own" ON ent_series FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own" ON ent_series FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Delete own" ON ent_series FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ENT_MOVIES
DROP POLICY IF EXISTS "Users own data" ON ent_movies;
CREATE POLICY "Select own or community" ON ent_movies FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_community_access(user_id, 'movies'));
CREATE POLICY "Insert own" ON ent_movies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own" ON ent_movies FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Delete own" ON ent_movies FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ENT_ANIMES
DROP POLICY IF EXISTS "Users own data" ON ent_animes;
CREATE POLICY "Select own or community" ON ent_animes FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_community_access(user_id, 'animes'));
CREATE POLICY "Insert own" ON ent_animes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own" ON ent_animes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Delete own" ON ent_animes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ENT_BOOKS
DROP POLICY IF EXISTS "Users own data" ON ent_books;
CREATE POLICY "Select own or community" ON ent_books FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_community_access(user_id, 'books'));
CREATE POLICY "Insert own" ON ent_books FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own" ON ent_books FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Delete own" ON ent_books FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ENT_GAMES
DROP POLICY IF EXISTS "Users own data" ON ent_games;
CREATE POLICY "Select own or community" ON ent_games FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_community_access(user_id, 'games'));
CREATE POLICY "Insert own" ON ent_games FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own" ON ent_games FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Delete own" ON ent_games FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- FINANCE_CATEGORIES
DROP POLICY IF EXISTS "Users own data" ON finance_categories;
CREATE POLICY "Select own or community" ON finance_categories FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_community_access(user_id, 'finance'));
CREATE POLICY "Insert own" ON finance_categories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own" ON finance_categories FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Delete own" ON finance_categories FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- FINANCE_TRANSACTIONS
DROP POLICY IF EXISTS "Users own data" ON finance_transactions;
CREATE POLICY "Select own or community" ON finance_transactions FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_community_access(user_id, 'finance'));
CREATE POLICY "Insert own" ON finance_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own" ON finance_transactions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Delete own" ON finance_transactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- FINANCE_RESERVES
DROP POLICY IF EXISTS "Users own data" ON finance_reserves;
CREATE POLICY "Select own or community" ON finance_reserves FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_community_access(user_id, 'finance'));
CREATE POLICY "Insert own" ON finance_reserves FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own" ON finance_reserves FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Delete own" ON finance_reserves FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- VACATION_TRIPS
DROP POLICY IF EXISTS "Users own data" ON vacation_trips;
CREATE POLICY "Select own or community" ON vacation_trips FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_community_access(user_id, 'vacation'));
CREATE POLICY "Insert own" ON vacation_trips FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own" ON vacation_trips FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Delete own" ON vacation_trips FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- VACATION_FLIGHTS
DROP POLICY IF EXISTS "Users own data" ON vacation_flights;
CREATE POLICY "Select own or community" ON vacation_flights FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_community_access(user_id, 'vacation'));
CREATE POLICY "Insert own" ON vacation_flights FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own" ON vacation_flights FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Delete own" ON vacation_flights FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- VACATION_HOTELS
DROP POLICY IF EXISTS "Users own data" ON vacation_hotels;
CREATE POLICY "Select own or community" ON vacation_hotels FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_community_access(user_id, 'vacation'));
CREATE POLICY "Insert own" ON vacation_hotels FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own" ON vacation_hotels FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Delete own" ON vacation_hotels FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- VACATION_TOURS
DROP POLICY IF EXISTS "Users own data" ON vacation_tours;
CREATE POLICY "Select own or community" ON vacation_tours FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_community_access(user_id, 'vacation'));
CREATE POLICY "Insert own" ON vacation_tours FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own" ON vacation_tours FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Delete own" ON vacation_tours FOR DELETE TO authenticated USING (auth.uid() = user_id);
