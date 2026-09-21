do $$
declare
  constraint_name name;
begin
  select conname into constraint_name
  from pg_constraint
  where conrelid = 'public.bookings'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%package_code = ANY%';
  if constraint_name is not null then
    execute format('alter table public.bookings drop constraint %I', constraint_name);
  end if;

  select conname into constraint_name
  from pg_constraint
  where conrelid = 'public.bookings'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%amount_thb%';
  if constraint_name is not null then
    execute format('alter table public.bookings drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.bookings
  add constraint bookings_package_code_check
    check (package_code in ('payment-test', 'online-course', 'live-online', 'solo', 'buddy')),
  add constraint bookings_amount_thb_check
    check (
      (package_code = 'payment-test' and amount_thb = 1) or
      (package_code = 'online-course' and amount_thb = 990) or
      (package_code = 'live-online' and amount_thb = 2999) or
      (package_code = 'solo' and amount_thb = 3999) or
      (package_code = 'buddy' and amount_thb = 5999)
    ),
  drop constraint if exists bookings_scheduled_packages_have_date,
  add constraint bookings_scheduled_packages_have_date
    check (
      package_code in ('payment-test', 'online-course')
      or (requested_date is not null and requested_time is not null)
    ) not valid,
  drop constraint if exists bookings_scheduled_packages_have_course_slot,
  add constraint bookings_scheduled_packages_have_course_slot
    check (package_code in ('payment-test', 'online-course') or course_slot_id is not null) not valid;
