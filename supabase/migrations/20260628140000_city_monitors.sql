-- Retirement Monitor: track city metric changes for saved-plan cities.

create table if not exists public.city_monitors (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users (id) on delete cascade,
  city_id text not null,
  city_name text not null,
  snapshot jsonb not null,
  changes jsonb,
  checked_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists city_monitors_user_id_idx
  on public.city_monitors (user_id);

create index if not exists city_monitors_user_city_checked_idx
  on public.city_monitors (user_id, city_id, checked_at desc);

create index if not exists city_monitors_user_changes_idx
  on public.city_monitors (user_id, checked_at desc)
  where changes is not null;

alter table public.city_monitors enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'city_monitors'
      and policyname = 'Users see own monitors'
  ) then
    create policy "Users see own monitors"
      on public.city_monitors
      for all
      using (auth.uid() = user_id);
  end if;
end $$;
