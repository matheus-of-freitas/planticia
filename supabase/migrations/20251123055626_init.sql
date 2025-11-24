-- Enable required Postgres extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

------------------------------------------------------------
--  USERS TABLE (optional)
--  Supabase manages auth.users, so no need to create it.
------------------------------------------------------------


------------------------------------------------------------
--  PLANTS TABLE
------------------------------------------------------------
create table public.plants (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,

  name text,
  scientific_name text,
  image_url text,

  watering_interval_days integer default 3,
  last_watered_at timestamp with time zone,
  light_preference text,
  description text,

  created_at timestamp with time zone default now()
);

-- Enable Row-Level Security
alter table public.plants enable row level security;

-- Policies
create policy "Allow select own plants"
  on public.plants for select
  using (user_id = auth.uid());

create policy "Allow insert own plants"
  on public.plants for insert
  with check (user_id = auth.uid());

create policy "Allow update own plants"
  on public.plants for update
  using (user_id = auth.uid());

create policy "Allow delete own plants"
  on public.plants for delete
  using (user_id = auth.uid());


------------------------------------------------------------
--  PLANT IDENTIFICATION CACHE
------------------------------------------------------------
create table public.plant_id_cache (
  hash text primary key,
  result_json jsonb not null,
  created_at timestamp with time zone default now()
);

-- RLS enabled (optional)
alter table public.plant_id_cache enable row level security;

-- Everyone can read cache (optional)
create policy "Allow public read"
  on public.plant_id_cache for select
  using (true);

-- Nobody can write except service role
create policy "Service role insert"
  on public.plant_id_cache for insert
  with check (auth.role() = 'service_role');


------------------------------------------------------------
--  PLANT CARE SCHEDULES
------------------------------------------------------------
create type care_type as enum ('water', 'fertilize', 'prune');

create table public.plant_care_schedules (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plant_id uuid not null references public.plants(id) on delete cascade,

  type care_type not null,
  interval_days integer not null,
  next_trigger_at timestamp with time zone not null,

  created_at timestamp with time zone default now()
);

alter table public.plant_care_schedules enable row level security;

create policy "Allow select own schedules"
  on public.plant_care_schedules for select
  using (user_id = auth.uid());

create policy "Allow insert own schedules"
  on public.plant_care_schedules for insert
  with check (user_id = auth.uid());

create policy "Allow update own schedules"
  on public.plant_care_schedules for update
  using (user_id = auth.uid());

create policy "Allow delete own schedules"
  on public.plant_care_schedules for delete
  using (user_id = auth.uid());


------------------------------------------------------------
--  ARTICLES (Educational content)
------------------------------------------------------------
create table public.articles (
  id uuid primary key default uuid_generate_v4(),

  title text not null,
  body_markdown text not null,
  tags text[],

  created_at timestamp with time zone default now()
);

alter table public.articles enable row level security;

-- Readable by everyone
create policy "Public read articles"
  on public.articles for select
  using (true);

-- Only service role can write
create policy "Service role insert articles"
  on public.articles for insert
  with check (auth.role() = 'service_role');

create policy "Service role update articles"
  on public.articles for update
  using (auth.role() = 'service_role');

create policy "Service role delete articles"
  on public.articles for delete
  using (auth.role() = 'service_role');


------------------------------------------------------------
-- DONE
------------------------------------------------------------
