create table public.course_slots (
  id uuid primary key default gen_random_uuid(),
  package_code text not null check (package_code in ('live-online', 'solo', 'buddy')),
  course_date date not null,
  start_time time without time zone not null check (start_time in ('10:00', '13:00', '16:00')),
  location text not null check (char_length(trim(location)) between 1 and 160),
  capacity smallint not null default 1 check (capacity between 1 and 20),
  reserved_count smallint not null default 0 check (reserved_count between 0 and capacity),
  is_open boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (package_code, course_date, start_time)
);

create index course_slots_upcoming_idx
  on public.course_slots (package_code, course_date, start_time);

alter table public.course_slots enable row level security;

create policy "Admin can manage course slots"
on public.course_slots
for all
to authenticated
using ((auth.jwt() ->> 'email') = 'admin@6cat.com')
with check ((auth.jwt() ->> 'email') = 'admin@6cat.com');

alter table public.bookings
  add column course_slot_id uuid references public.course_slots(id) on delete set null;

create index bookings_course_slot_id_idx on public.bookings (course_slot_id);

alter table public.bookings
  add constraint bookings_scheduled_packages_have_course_slot
  check (package_code = 'online-course' or course_slot_id is not null) not valid;

create or replace function public.reserve_course_slot(p_slot_id uuid, p_package_code text)
returns public.course_slots
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_slot public.course_slots;
begin
  update public.course_slots
  set reserved_count = reserved_count + 1,
      updated_at = now()
  where id = p_slot_id
    and package_code = p_package_code
    and is_open = true
    and course_date >= current_date
    and reserved_count < capacity
  returning * into selected_slot;

  if selected_slot.id is null then
    raise exception 'รอบเรียนนี้เต็มหรือปิดรับจองแล้ว';
  end if;

  return selected_slot;
end;
$$;

create or replace function public.release_course_slot(p_slot_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.course_slots
  set reserved_count = greatest(reserved_count - 1, 0),
      updated_at = now()
  where id = p_slot_id;
end;
$$;

revoke all on function public.reserve_course_slot(uuid, text) from public, anon, authenticated;
revoke all on function public.release_course_slot(uuid) from public, anon, authenticated;
grant execute on function public.reserve_course_slot(uuid, text) to service_role;
grant execute on function public.release_course_slot(uuid) to service_role;
