alter table public.bookings
  drop constraint bookings_amount_thb_check,
  add constraint bookings_amount_thb_check
    check (
      (package_code = 'payment-test' and amount_thb = 10) or
      (package_code = 'online-course' and amount_thb = 990) or
      (package_code = 'live-online' and amount_thb = 2999) or
      (package_code = 'solo' and amount_thb = 3999) or
      (package_code = 'buddy' and amount_thb = 5999)
    ) not valid;
