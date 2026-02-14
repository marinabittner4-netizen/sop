-- Pflegebox Shop Schema (Supabase / Postgres)

-- Enable UUID generator
create extension if not exists "pgcrypto";

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  dob date not null,
  street text not null,
  zip text not null,
  city text not null,
  phone text,
  email text,
  insurance_type text not null,
  insurance_name text not null,
  care_grade text,
  beihilfe_percent int,
  legal_rep_present boolean not null default false,
  legal_rep_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete restrict,
  month_key text not null,
  total numeric(10,2) not null,
  budget_max numeric(10,2) not null,
  status text not null default 'offen',
  order_number text unique,
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id text not null,
  name text not null,
  category text not null,
  size text,
  unit_price numeric(10,2) not null,
  quantity int not null,
  line_total numeric(10,2) not null
);

-- Order number generator (PB-YYYYMM-XXXXX)
create sequence if not exists order_number_seq;

create or replace function set_order_number()
returns trigger language plpgsql as $$
declare
  seq bigint;
  yyyymm text;
begin
  if NEW.order_number is null then
    select nextval('order_number_seq') into seq;
    yyyymm := to_char(now(), 'YYYYMM');
    NEW.order_number := 'PB-' || yyyymm || '-' || lpad(seq::text, 5, '0');
  end if;
  return NEW;
end $$;

drop trigger if exists trg_set_order_number on orders;
create trigger trg_set_order_number
before insert on orders
for each row execute function set_order_number();

-- Update updated_at on customers
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  NEW.updated_at = now();
  return NEW;
end $$;

drop trigger if exists trg_touch_customers on customers;
create trigger trg_touch_customers
before update on customers
for each row execute function touch_updated_at();

-- Recommended: turn on Row Level Security & policies (optional if only using service role key server-side)
-- alter table customers enable row level security;
-- alter table orders enable row level security;
-- alter table order_items enable row level security;
