
-- App Config table (key-value store for settings)
CREATE TABLE public.app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to app_config" ON public.app_config FOR ALL USING (true) WITH CHECK (true);

-- Finance Categories
CREATE TABLE public.finance_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE'))
);
ALTER TABLE public.finance_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to finance_categories" ON public.finance_categories FOR ALL USING (true) WITH CHECK (true);

-- Finance Transactions
CREATE TABLE public.finance_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.finance_categories(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  description TEXT
);
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to finance_transactions" ON public.finance_transactions FOR ALL USING (true) WITH CHECK (true);

-- Finance Reserves
CREATE TABLE public.finance_reserves (
  year INTEGER PRIMARY KEY,
  initial_amount NUMERIC NOT NULL DEFAULT 0
);
ALTER TABLE public.finance_reserves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to finance_reserves" ON public.finance_reserves FOR ALL USING (true) WITH CHECK (true);

-- Vacation Trips
CREATE TABLE public.vacation_trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  destination TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT,
  year INTEGER NOT NULL DEFAULT 2025,
  cover_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vacation_trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to vacation_trips" ON public.vacation_trips FOR ALL USING (true) WITH CHECK (true);

-- Vacation Flights
CREATE TABLE public.vacation_flights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES public.vacation_trips(id) ON DELETE SET NULL,
  departure TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_time TEXT NOT NULL,
  arrival_time TEXT NOT NULL,
  duration TEXT NOT NULL,
  airline TEXT NOT NULL,
  pnr TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  year INTEGER NOT NULL DEFAULT 2025,
  trip_type TEXT DEFAULT 'ROUND_TRIP',
  return_departure_time TEXT,
  return_arrival_time TEXT,
  return_duration TEXT
);
ALTER TABLE public.vacation_flights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to vacation_flights" ON public.vacation_flights FOR ALL USING (true) WITH CHECK (true);

-- Vacation Hotels
CREATE TABLE public.vacation_hotels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES public.vacation_trips(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  check_in TEXT NOT NULL,
  check_out TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  year INTEGER NOT NULL DEFAULT 2025
);
ALTER TABLE public.vacation_hotels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to vacation_hotels" ON public.vacation_hotels FOR ALL USING (true) WITH CHECK (true);

-- Vacation Tours
CREATE TABLE public.vacation_tours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES public.vacation_trips(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('FULL_DAY', 'HALF_DAY')),
  price NUMERIC NOT NULL DEFAULT 0,
  year INTEGER NOT NULL DEFAULT 2025
);
ALTER TABLE public.vacation_tours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to vacation_tours" ON public.vacation_tours FOR ALL USING (true) WITH CHECK (true);

-- Entertainment: Series
CREATE TABLE public.ent_series (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  rating NUMERIC DEFAULT 0,
  poster_url TEXT,
  synopsis TEXT,
  genres TEXT[],
  external_id TEXT,
  finished_at TEXT,
  total_seasons INTEGER DEFAULT 0,
  watched_seasons INTEGER DEFAULT 0,
  current_season INTEGER DEFAULT 0,
  current_season_episodes INTEGER DEFAULT 0,
  current_season_watched INTEGER DEFAULT 0,
  platform TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ent_series ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to ent_series" ON public.ent_series FOR ALL USING (true) WITH CHECK (true);

-- Entertainment: Movies
CREATE TABLE public.ent_movies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  rating NUMERIC DEFAULT 0,
  poster_url TEXT,
  synopsis TEXT,
  genres TEXT[],
  external_id TEXT,
  finished_at TEXT,
  release_date TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ent_movies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to ent_movies" ON public.ent_movies FOR ALL USING (true) WITH CHECK (true);

-- Entertainment: Animes
CREATE TABLE public.ent_animes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  rating NUMERIC DEFAULT 0,
  poster_url TEXT,
  synopsis TEXT,
  genres TEXT[],
  external_id TEXT,
  finished_at TEXT,
  total_episodes INTEGER DEFAULT 0,
  watched_episodes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ent_animes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to ent_animes" ON public.ent_animes FOR ALL USING (true) WITH CHECK (true);

-- Entertainment: Books
CREATE TABLE public.ent_books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  rating NUMERIC DEFAULT 0,
  poster_url TEXT,
  synopsis TEXT,
  genres TEXT[],
  external_id TEXT,
  finished_at TEXT,
  author TEXT,
  isbn TEXT,
  release_date TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ent_books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to ent_books" ON public.ent_books FOR ALL USING (true) WITH CHECK (true);

-- Entertainment: Games
CREATE TABLE public.ent_games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  platform TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  rating NUMERIC DEFAULT 0,
  poster_url TEXT,
  synopsis TEXT,
  genres TEXT[],
  external_id TEXT,
  finished_at TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ent_games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to ent_games" ON public.ent_games FOR ALL USING (true) WITH CHECK (true);

-- Insert default admin password (hash of "admin")
INSERT INTO public.app_config (key, value) VALUES
  ('admin_password_hash', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'),
  ('is_default_password', 'true');
