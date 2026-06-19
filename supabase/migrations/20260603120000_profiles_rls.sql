-- Row Level Security for public.profiles
--
-- Assumes public.profiles already exists (id uuid PK aligned with auth.users,
-- plus plan, searches_this_month, stripe_customer_id, stripe_subscription_id, etc.).
-- Does not alter columns or drop existing policies.

alter table public.profiles enable row level security;

-- Users may read their own profile row only.
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_rls_select_own'
  ) then
    create policy profiles_rls_select_own
      on public.profiles
      for select
      to authenticated
      using (id = auth.uid());
  end if;
end
$$;

-- Users may update their own profile row only (e.g. searches_this_month).
-- Sensitive billing/plan columns are blocked separately via column privileges below.
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_rls_update_own'
  ) then
    create policy profiles_rls_update_own
      on public.profiles
      for update
      to authenticated
      using (id = auth.uid())
      with check (id = auth.uid());
  end if;
end
$$;

-- Only service role (and other superuser paths) may write plan / Stripe fields.
-- authenticated and anon cannot UPDATE these columns even on their own row.
revoke update (plan, stripe_customer_id, stripe_subscription_id)
  on public.profiles
  from authenticated, anon;
