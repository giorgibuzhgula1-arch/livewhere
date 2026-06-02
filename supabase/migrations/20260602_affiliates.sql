-- Affiliate tracking tables for LiveWhere.io

create table if not exists public.affiliates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  referral_code text not null unique,
  commission_rate decimal(5, 4) not null default 0.40,
  total_earnings decimal(12, 2) not null default 0,
  total_clicks integer not null default 0,
  total_conversions integer not null default 0,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.referral_clicks (
  id uuid primary key default gen_random_uuid(),
  referral_code text not null,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.referral_conversions (
  id uuid primary key default gen_random_uuid(),
  referral_code text not null,
  stripe_payment_intent_id text not null unique,
  amount decimal(12, 2) not null,
  commission_amount decimal(12, 2) not null,
  plan_type text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists idx_affiliates_referral_code on public.affiliates (referral_code);
create index if not exists idx_affiliates_email on public.affiliates (email);
create index if not exists idx_referral_clicks_code on public.referral_clicks (referral_code);
create index if not exists idx_referral_clicks_created_at on public.referral_clicks (created_at desc);
create index if not exists idx_referral_conversions_code on public.referral_conversions (referral_code);
create index if not exists idx_referral_conversions_pi on public.referral_conversions (stripe_payment_intent_id);

alter table public.affiliates enable row level security;
alter table public.referral_clicks enable row level security;
alter table public.referral_conversions enable row level security;
