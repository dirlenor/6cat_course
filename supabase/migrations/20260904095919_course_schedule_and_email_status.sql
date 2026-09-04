alter table public.bookings
  add column requested_date date,
  add column requested_time time without time zone,
  add column stripe_fee_thb numeric(12, 2),
  add column net_amount_thb numeric(12, 2),
  add column customer_email_status text not null default 'pending'
    check (customer_email_status in ('pending', 'sending', 'sent', 'failed', 'not_configured')),
  add column customer_email_sent_at timestamptz,
  add column customer_email_error text;

alter table public.bookings
  add constraint bookings_scheduled_packages_have_date
  check (
    package_code = 'online-course'
    or (requested_date is not null and requested_time is not null)
  ) not valid;

alter table public.bookings
  add constraint bookings_in_person_packages_have_location
  check (
    package_code not in ('solo', 'buddy')
    or requested_location is not null
  ) not valid;

create index bookings_paid_requested_date_idx
  on public.bookings (requested_date, requested_time)
  where status = 'paid' and requested_date is not null;
