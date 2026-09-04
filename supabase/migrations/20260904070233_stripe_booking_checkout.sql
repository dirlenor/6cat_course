create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  package_code text not null check (package_code in ('online-course', 'live-online', 'solo', 'buddy')),
  amount_thb integer not null check (
    (package_code = 'online-course' and amount_thb = 990) or
    (package_code = 'live-online' and amount_thb = 2999) or
    (package_code = 'solo' and amount_thb = 3999) or
    (package_code = 'buddy' and amount_thb = 5999)
  ),
  customer_name text not null check (char_length(customer_name) between 2 and 120),
  customer_phone text not null check (char_length(customer_phone) between 6 and 40),
  customer_email text not null check (char_length(customer_email) between 5 and 254),
  line_id text,
  buddy_name text,
  requested_slot text,
  requested_location text,
  customer_note text,
  status text not null default 'pending_payment' check (status in ('pending_payment', 'paid', 'payment_failed', 'expired', 'checkout_failed')),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookings_status_created_at_idx on public.bookings (status, created_at desc);

create table public.stripe_webhook_events (
  stripe_event_id text primary key,
  event_type text not null,
  received_at timestamptz not null default now()
);

alter table public.bookings enable row level security;
alter table public.stripe_webhook_events enable row level security;
