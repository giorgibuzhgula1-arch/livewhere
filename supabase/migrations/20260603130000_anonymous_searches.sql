-- IP-based monthly search limits for anonymous (unauthenticated) users.

create table if not exists public.anonymous_searches (
  ip text not null,
  month text not null,
  count int not null default 0,
  primary key (ip, month)
);

alter table public.anonymous_searches enable row level security;
