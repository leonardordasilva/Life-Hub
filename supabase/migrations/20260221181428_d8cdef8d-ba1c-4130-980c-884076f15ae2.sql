
-- 1. Create role enum and user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'visitor');

CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 3. RLS on user_roles: users can read their own roles, admins can manage all
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Auto-assign 'visitor' role on signup via trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'visitor');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Drop all old permissive policies on data tables
DROP POLICY IF EXISTS "Allow all access to finance_categories" ON public.finance_categories;
DROP POLICY IF EXISTS "Allow all access to finance_transactions" ON public.finance_transactions;
DROP POLICY IF EXISTS "Allow all access to finance_reserves" ON public.finance_reserves;
DROP POLICY IF EXISTS "Allow all access to vacation_trips" ON public.vacation_trips;
DROP POLICY IF EXISTS "Allow all access to vacation_flights" ON public.vacation_flights;
DROP POLICY IF EXISTS "Allow all access to vacation_hotels" ON public.vacation_hotels;
DROP POLICY IF EXISTS "Allow all access to vacation_tours" ON public.vacation_tours;
DROP POLICY IF EXISTS "Allow all access to ent_series" ON public.ent_series;
DROP POLICY IF EXISTS "Allow all access to ent_movies" ON public.ent_movies;
DROP POLICY IF EXISTS "Allow all access to ent_animes" ON public.ent_animes;
DROP POLICY IF EXISTS "Allow all access to ent_books" ON public.ent_books;
DROP POLICY IF EXISTS "Allow all access to ent_games" ON public.ent_games;

-- 6. New RLS policies: Admin-only tables (finance, vacation)
-- Finance Categories
CREATE POLICY "Admins full access" ON public.finance_categories
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Finance Transactions
CREATE POLICY "Admins full access" ON public.finance_transactions
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Finance Reserves
CREATE POLICY "Admins full access" ON public.finance_reserves
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Vacation Trips
CREATE POLICY "Admins full access" ON public.vacation_trips
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Vacation Flights
CREATE POLICY "Admins full access" ON public.vacation_flights
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Vacation Hotels
CREATE POLICY "Admins full access" ON public.vacation_hotels
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Vacation Tours
CREATE POLICY "Admins full access" ON public.vacation_tours
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7. Entertainment tables: read for all authenticated, write for admins only
-- ent_series
CREATE POLICY "Authenticated read" ON public.ent_series
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins write" ON public.ent_series
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update" ON public.ent_series
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete" ON public.ent_series
FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ent_movies
CREATE POLICY "Authenticated read" ON public.ent_movies
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins write" ON public.ent_movies
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update" ON public.ent_movies
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete" ON public.ent_movies
FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ent_animes
CREATE POLICY "Authenticated read" ON public.ent_animes
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins write" ON public.ent_animes
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update" ON public.ent_animes
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete" ON public.ent_animes
FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ent_books
CREATE POLICY "Authenticated read" ON public.ent_books
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins write" ON public.ent_books
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update" ON public.ent_books
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete" ON public.ent_books
FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ent_games
CREATE POLICY "Authenticated read" ON public.ent_games
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins write" ON public.ent_games
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update" ON public.ent_games
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete" ON public.ent_games
FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
