-- Saved retirement plans: quiz inputs + city results per user.

create table if not exists public.saved_retirement_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  quiz_input jsonb not null,
  city_results jsonb not null,
  max_cities int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists saved_retirement_plans_user_id_idx
  on public.saved_retirement_plans (user_id);

create index if not exists saved_retirement_plans_user_created_idx
  on public.saved_retirement_plans (user_id, created_at desc);

alter table public.saved_retirement_plans enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'saved_retirement_plans'
      and policyname = 'saved_plans_select_own'
  ) then
    create policy saved_plans_select_own
      on public.saved_retirement_plans
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'saved_retirement_plans'
      and policyname = 'saved_plans_insert_own'
  ) then
    create policy saved_plans_insert_own
      on public.saved_retirement_plans
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'saved_retirement_plans'
      and policyname = 'saved_plans_update_own'
  ) then
    create policy saved_plans_update_own
      on public.saved_retirement_plans
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'saved_retirement_plans'
      and policyname = 'saved_plans_delete_own'
  ) then
    create policy saved_plans_delete_own
      on public.saved_retirement_plans
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;
