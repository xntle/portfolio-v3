-- Leaderboard for the dart game in the room.
-- Visitors do not sign in: each browser keeps a random id and gets one row,
-- holding its best round. Rows are only ever written by the site's server
-- route (with the service role key), which checks the name and the score.

create table if not exists public.darts_scores (
  visitor uuid primary key,
  name text not null check (name ~ '^[A-Za-z0-9 _-]{2,12}$'),
  message text check (message is null or char_length(message) <= 60),
  score integer not null check (score between 0 and 1800),
  darts integer not null check (darts between 3 and 30),
  hidden boolean not null default false, -- set true to take a row off the board by hand
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists darts_scores_top on public.darts_scores (score desc, updated_at asc) where not hidden;

-- Nobody reads or writes this table with the public (anon) key.
alter table public.darts_scores enable row level security;
