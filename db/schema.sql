-- Mandi Weighment & Cost Calculator Database Schema for Neon Postgres
-- Run once in Neon SQL console or migration runner

create table if not exists slips (
  id              text primary key,                 -- client-generated ULID (idempotency key)
  slip_code       text not null,                    -- human-readable, e.g. 1010-7K3F
  created_at      timestamptz not null,             -- device time
  received_at     timestamptz not null default now(),
  device_id       text,
  seller          text,
  buyer           text,
  note            text,
  bag_count       int    not null check (bag_count > 0),
  gross_g         bigint not null check (gross_g > 0),
  tare_per_bag_g  int    not null default 0 check (tare_per_bag_g >= 0),
  net_g           bigint not null check (net_g > 0),
  rate_paisa      bigint not null check (rate_paisa >= 0),
  amount_paisa    bigint not null,
  commission_type text check (commission_type in ('percent','fixed')),
  commission_value bigint,                          -- hundredths of pct, or paisa
  commission_paisa bigint not null default 0,
  labour_type     text check (labour_type in ('fixed','perBag')),
  labour_value    bigint,                           -- paisa
  labour_paisa    bigint not null default 0,
  charge_mode     text not null default 'add' check (charge_mode in ('add','deduct')),
  round_to_rupee  boolean not null default true,
  total_paisa     bigint not null,
  total_rupees    bigint not null,
  voided_at       timestamptz,
  void_reason     text
);

create table if not exists bag_weights (
  slip_id text not null references slips(id) on delete cascade,
  seq     int  not null,
  grams   int  not null check (grams > 0),
  primary key (slip_id, seq)
);

create index if not exists slips_created_idx on slips (created_at desc);
create index if not exists slips_seller_idx  on slips (lower(seller));
create index if not exists slips_buyer_idx   on slips (lower(buyer));

create table if not exists login_attempts (
  id bigserial primary key,
  ip text not null,
  at timestamptz not null default now(),
  ok boolean not null
);

create index if not exists login_attempts_ip_at on login_attempts (ip, at desc);
