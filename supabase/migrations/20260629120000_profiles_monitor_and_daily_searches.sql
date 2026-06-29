-- Monitor subscription + daily search tracking for free tier.

alter table public.profiles
  add column if not exists monitor_until timestamptz,
  add column if not exists monitor_active boolean not null default false,
  add column if not exists stripe_monitor_subscription_id text,
  add column if not exists searches_today int not null default 0,
  add column if not exists search_day date;

create index if not exists profiles_stripe_monitor_subscription_id_idx
  on public.profiles (stripe_monitor_subscription_id)
  where stripe_monitor_subscription_id is not null;
