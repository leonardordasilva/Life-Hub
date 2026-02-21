import React, { useState } from 'react';
import { Database, Copy, CheckCircle, ExternalLink, RefreshCw, AlertTriangle, FileJson, ChevronLeft, Zap } from 'lucide-react';

interface SetupScreenProps {
  error?: string | null;
  onRetry: () => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ error, onRetry }) => {
  const [copied, setCopied] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const sqlCode = `-- Script de Criação das Tabelas

-- 1. FINANCEIRO
create table if not exists finance_categories (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default now(),
  name text not null,
  type text not null check (type in ('INCOME', 'EXPENSE'))
);

create table if not exists finance_transactions (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default now(),
  category_id uuid references finance_categories(id) on delete cascade,
  amount numeric not null,
  month integer not null,
  year integer not null,
  description text
);

create table if not exists finance_reserves (
  year integer primary key,
  initial_amount numeric default 0
);

-- 3. ENTRETENIMENTO (TABELAS SEPARADAS)

-- Séries
create table if not exists ent_series (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default now(),
  title text not null,
  status text not null,
  rating numeric default 0,
  poster_url text,
  synopsis text,
  genres text[],
  external_id text,
  finished_at timestamp with time zone,
  -- Campos Específicos
  total_seasons integer default 0,
  watched_seasons integer default 0,
  current_season integer default 1,
  current_season_episodes integer default 0,
  current_season_watched integer default 0,
  platform text
);

-- Filmes
create table if not exists ent_movies (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default now(),
  title text not null,
  status text not null,
  rating numeric default 0,
  poster_url text,
  synopsis text,
  genres text[],
  external_id text,
  finished_at timestamp with time zone,
  -- Campos Específicos
  release_date date
);

-- Animes
create table if not exists ent_animes (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default now(),
  title text not null,
  status text not null,
  rating numeric default 0,
  poster_url text,
  synopsis text,
  genres text[],
  external_id text,
  finished_at timestamp with time zone,
  -- Campos Específicos
  total_episodes integer default 0,
  watched_episodes integer default 0
);

-- Livros
create table if not exists ent_books (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default now(),
  title text not null,
  status text not null,
  rating numeric default 0,
  poster_url text,
  synopsis text,
  genres text[],
  external_id text,
  finished_at timestamp with time zone,
  -- Campos Específicos
  author text,
  isbn text,
  release_date date
);

-- Jogos
create table if not exists ent_games (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default now(),
  title text not null,
  status text not null,
  rating numeric default 0,
  poster_url text,
  synopsis text,
  genres text[],
  external_id text,
  finished_at timestamp with time zone,
  -- Campos Específicos
  platform text
);

-- 4. FÉRIAS
create table if not exists vacation_trips (
  id uuid default uuid_generate_v4() primary key,
  destination text not null,
  start_date date,
  end_date date,
  year integer not null,
  cover_url text
);

create table if not exists vacation_flights (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references vacation_trips(id) on delete cascade,
  departure text not null,
  destination text not null,
  departure_time timestamp with time zone not null,
  arrival_time timestamp with time zone not null,
  airline text,
  pnr text,
  price numeric default 0,
  year integer not null,
  duration text,
  trip_type text default 'ROUND_TRIP',
  return_departure_time timestamp with time zone,
  return_arrival_time timestamp with time zone,
  return_duration text
);

create table if not exists vacation_hotels (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references vacation_trips(id) on delete cascade,
  name text not null,
  check_in date not null,
  check_out date not null,
  price numeric default 0,
  year integer not null
);

create table if not exists vacation_tours (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references vacation_trips(id) on delete cascade,
  name text not null,
  company text,
  date date not null,
  time text not null,
  type text not null check (type in ('FULL_DAY', 'HALF_DAY')),
  price numeric default 0,
  year integer not null
);

-- POLÍTICAS DE SEGURANÇA (Row Level Security)
alter table finance_categories enable row level security;
create policy "Public Access FinCat" on finance_categories for all using (true);

alter table finance_transactions enable row level security;
create policy "Public Access FinTrans" on finance_transactions for all using (true);

alter table finance_reserves enable row level security;
create policy "Public Access Reserves" on finance_reserves for all using (true);

alter table ent_series enable row level security;
create policy "Public Access Series" on ent_series for all using (true);

alter table ent_movies enable row level security;
create policy "Public Access Movies" on ent_movies for all using (true);

alter table ent_animes enable row level security;
create policy "Public Access Animes" on ent_animes for all using (true);

alter table ent_books enable row level security;
create policy "Public Access Books" on ent_books for all using (true);

alter table ent_games enable row level security;
create policy "Public Access Games" on ent_games for all using (true);

alter table vacation_trips enable row level security;
create policy "Public Access Trips" on vacation_trips for all using (true);

alter table vacation_flights enable row level security;
create policy "Public Access Flights" on vacation_flights for all using (true);

alter table vacation_hotels enable row level security;
create policy "Public Access Hotels" on vacation_hotels for all using (true);

alter table vacation_tours enable row level security;
create policy "Public Access Tours" on vacation_tours for all using (true);
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-8">
          <Database className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold">Configuração do Banco de Dados</h1>
          <p className="text-slate-400 mt-2">Execute o script SQL abaixo no Supabase. O sistema agora utiliza tabelas separadas para cada tipo de entretenimento.</p>
        </div>

        <div className="bg-slate-900 border border-white/5 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-white">Script de Criação (Tabelas Separadas)</h3>
                <button onClick={copyToClipboard} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg text-xs hover:bg-slate-700 transition-all">
                    {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />} {copied ? 'Copiado!' : 'Copiar SQL'}
                </button>
            </div>
            <pre className="bg-black/50 p-4 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto h-64 custom-scrollbar"><code>{sqlCode}</code></pre>
        </div>

        <button onClick={() => onRetry()} disabled={isChecking} className="w-full mt-8 bg-emerald-600 hover:bg-emerald-500 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
            {isChecking ? <RefreshCw className="animate-spin w-5 h-5" /> : <CheckCircle className="w-5 h-5" />} Verificar Conexão
        </button>
      </div>
    </div>
  );
};