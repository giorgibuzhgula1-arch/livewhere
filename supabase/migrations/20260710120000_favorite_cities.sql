-- Per-user favorite cities (name + country, matching CityResult identity).

create table if not exists public.favorite_cities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  city_name text not null check (char_length(trim(city_name)) > 0),
  city_country text not null check (char_length(trim(city_country)) > 0),
  created_at timestamptz not null default now(),
  unique (user_id, city_name, city_country)
);

create index if not exists favorite_cities_user_id_idx
  on public.favorite_cities (user_id);

create index if not exists favorite_cities_user_created_idx
  on public.favorite_cities (user_id, created_at desc);

alter table public.favorite_cities enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'favorite_cities'
      and policyname = 'favorite_cities_select_own'
  ) then
    create policy favorite_cities_select_own
      on public.favorite_cities
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'favorite_cities'
      and policyname = 'favorite_cities_insert_own'
  ) then
    create policy favorite_cities_insert_own
      on public.favorite_cities
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'favorite_cities'
      and policyname = 'favorite_cities_delete_own'
  ) then
    create policy favorite_cities_delete_own
      on public.favorite_cities
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;
