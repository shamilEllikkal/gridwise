-- ─── GRIDWISE Database Schema ────────────────────────────────
-- Run this entire file in Supabase SQL Editor

-- 1. Households
create table if not exists households (
  id text primary key,
  name text not null,
  location text not null,
  area_sqft integer not null default 1000,
  occupants integer not null default 1,
  tariff_rate numeric(6,2) not null default 6.5,
  connected_load_kw numeric(6,2) not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Appliances
create table if not exists appliances (
  id text primary key,
  household_id text not null references households(id) on delete cascade,
  name text not null,
  category text not null default 'other',
  rated_power_w numeric(8,2) not null default 100,
  quantity integer not null default 1,
  status text not null default 'off',
  daily_hours numeric(5,2) not null default 1,
  schedule_start text,
  schedule_end text,
  schedule_type text not null default 'flexible',
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Appliance Events (ON/OFF from sensor or manual)
create table if not exists appliance_events (
  id uuid primary key default gen_random_uuid(),
  appliance_id text not null references appliances(id) on delete cascade,
  household_id text not null,
  event_type text not null check (event_type in ('on', 'off')),
  timestamp timestamptz not null default now(),
  source text not null default 'manual' check (source in ('manual', 'sensor', 'scheduled'))
);

-- 4. Appliance Sessions (one ON→OFF pair = one session)
create table if not exists appliance_sessions (
  id uuid primary key default gen_random_uuid(),
  appliance_id text not null references appliances(id) on delete cascade,
  household_id text not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_minutes numeric(10,2),
  energy_kwh numeric(10,4)
);

-- ─── Indexes ──────────────────────────────────────────────────
create index if not exists idx_events_appliance on appliance_events(appliance_id);
create index if not exists idx_events_timestamp on appliance_events(timestamp desc);
create index if not exists idx_sessions_appliance on appliance_sessions(appliance_id);
create index if not exists idx_sessions_started on appliance_sessions(started_at desc);
create index if not exists idx_appliances_household on appliances(household_id);

-- ─── Seed Demo Household ──────────────────────────────────────
insert into households (id, name, location, area_sqft, occupants, tariff_rate, connected_load_kw)
values ('demo-household-001', 'Shamil Residence', 'Thrissur, Kerala', 1800, 4, 6.5, 8)
on conflict (id) do update set
  name = excluded.name,
  updated_at = now();

-- ─── Seed Demo Appliances ─────────────────────────────────────
insert into appliances (id, household_id, name, category, rated_power_w, quantity, status, daily_hours, schedule_start, schedule_end, schedule_type, is_active) values
('app-001', 'demo-household-001', 'LED Bulbs (Living Room)', 'lighting', 9, 6, 'on', 6, '18:00', '23:00', 'scheduled', true),
('app-002', 'demo-household-001', 'LED Bulbs (Bedrooms)', 'lighting', 9, 4, 'on', 5, '19:00', '23:00', 'scheduled', true),
('app-003', 'demo-household-001', 'Ceiling Fans', 'cooling', 75, 4, 'on', 10, null, null, 'flexible', true),
('app-004', 'demo-household-001', 'Split AC (Bedroom)', 'cooling', 1200, 1, 'on', 8, '21:00', '07:00', 'flexible', true),
('app-005', 'demo-household-001', 'Refrigerator', 'kitchen', 150, 1, 'on', 24, null, null, 'essential', true),
('app-006', 'demo-household-001', 'Induction Cooktop', 'kitchen', 2000, 1, 'off', 1.5, '07:00', '08:30', 'scheduled', true),
('app-007', 'demo-household-001', 'Microwave Oven', 'kitchen', 1200, 1, 'off', 0.5, null, null, 'flexible', true),
('app-008', 'demo-household-001', 'Television (55")', 'entertainment', 150, 1, 'on', 5, '18:00', '23:00', 'flexible', true),
('app-009', 'demo-household-001', 'Washing Machine', 'laundry', 500, 1, 'off', 1, '19:00', '20:00', 'flexible', true),
('app-010', 'demo-household-001', 'Water Pump', 'water', 746, 1, 'off', 1.5, '06:00', '07:30', 'flexible', true),
('app-011', 'demo-household-001', 'Water Heater', 'water', 2000, 1, 'off', 1, '06:30', '07:30', 'flexible', true),
('app-012', 'demo-household-001', 'Laptop', 'computing', 65, 2, 'on', 8, null, null, 'flexible', true),
('app-013', 'demo-household-001', 'Wi-Fi Router', 'computing', 15, 1, 'on', 24, null, null, 'essential', true)
on conflict (id) do nothing;
