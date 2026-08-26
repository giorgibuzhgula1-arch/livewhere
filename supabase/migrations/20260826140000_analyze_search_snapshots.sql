-- Paywall v2 write-only analyze snapshots (anon + logged-in).
-- user_id is nullable so OAuth can attach the row later (UPDATE ... SET user_id).
-- No authenticated/anon policies: only the service role (API) writes/reads.

create table if not exists public.analyze_search_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  quiz_input jsonb not null,
  cities jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists analyze_search_snapshots_user_id_idx
  on public.analyze_search_snapshots (user_id);

create index if not exists analyze_search_snapshots_created_at_idx
  on public.analyze_search_snapshots (created_at desc);

alter table public.analyze_search_snapshots enable row level security;
