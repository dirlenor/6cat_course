create policy "Admin can read bookings"
on public.bookings
for select
to authenticated
using ((auth.jwt() ->> 'email') = 'admin@6cat.com');
