-- Property Agent Mini-CRM schema
-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query)

create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  address text not null,
  price numeric not null,
  bedrooms integer not null,
  status text not null default 'active' check (status in ('active', 'under_offer', 'sold', 'withdrawn')),
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  budget numeric,
  preferred_area text,
  created_at timestamptz not null default now()
);

create table if not exists viewings (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  scheduled_date date not null,
  scheduled_time time not null,
  outcome text not null default 'pending' check (outcome in ('pending', 'interested', 'not_interested', 'offer_made', 'no_show')),
  feedback text,
  next_action text,
  next_action_due date,
  created_at timestamptz not null default now()
);

create index if not exists idx_viewings_listing_id on viewings(listing_id);
create index if not exists idx_viewings_lead_id on viewings(lead_id);
create index if not exists idx_viewings_scheduled_date on viewings(scheduled_date);
create index if not exists idx_listings_last_activity on listings(last_activity_at);

-- Row Level Security: open for now (single-user tool, no auth yet).
-- Revisit if you add login/auth later.
alter table listings enable row level security;
alter table leads enable row level security;
alter table viewings enable row level security;

create policy "Allow all on listings" on listings for all using (true) with check (true);
create policy "Allow all on leads" on leads for all using (true) with check (true);
create policy "Allow all on viewings" on viewings for all using (true) with check (true);
