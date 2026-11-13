-- Safe to run more than once.
create table if not exists public.users (
  email text primary key,
  name text,
  image text,
  status text not null default 'pending' check (status in ('pending','approved','denied')),
  created_at timestamptz not null default now(),
  last_login timestamptz,
  decided_at timestamptz
);

create table if not exists public.gmail_tokens (
  email text primary key,
  gmail_address text,
  refresh_token_enc text not null,
  connected_at timestamptz not null default now()
);

create table if not exists public.sends (
  id bigint generated always as identity primary key,
  sender text not null,
  to_email text not null,
  domain text,
  subject text,
  sent_at timestamptz not null default now()
);
create index if not exists sends_sender_idx on public.sends (sender, sent_at);

-- Lock everything: only the server (service key) can read or write.
alter table public.users enable row level security;
alter table public.gmail_tokens enable row level security;
alter table public.sends enable row level security;
