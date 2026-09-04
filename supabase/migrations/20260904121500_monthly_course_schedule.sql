alter table public.course_slots
  drop constraint course_slots_package_code_check,
  add constraint course_slots_package_code_check
    check (package_code in ('live-online', 'solo', 'buddy', 'workshop'));

alter table public.course_slots
  drop constraint course_slots_start_time_check,
  add constraint course_slots_start_time_check
    check (start_time in ('09:00', '10:00', '13:00', '15:00', '16:00'));

-- Keep historical Solo/Buddy slots, but close them and replace each open day
-- with one shared Workshop slot. This makes the new availability rule apply
-- without altering an existing booking's slot reference.
insert into public.course_slots (package_code, course_date, start_time, location, capacity, reserved_count, is_open)
select 'workshop', legacy.course_date, '10:00', 'เลือกสถานที่ตอนจอง', 1, 0, true
from public.course_slots as legacy
where legacy.package_code in ('solo', 'buddy')
  and legacy.course_date >= current_date
  and legacy.is_open = true
  and legacy.reserved_count = 0
group by legacy.course_date
on conflict (package_code, course_date, start_time) do nothing;

update public.course_slots
set is_open = false,
    updated_at = now()
where package_code in ('solo', 'buddy')
  and course_date >= current_date
  and is_open = true
  and reserved_count = 0;

create or replace function public.reserve_course_slot(p_slot_id uuid, p_package_code text)
returns public.course_slots
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_slot public.course_slots;
  slot_group text := case when p_package_code in ('solo', 'buddy') then 'workshop' else p_package_code end;
begin
  update public.course_slots
  set reserved_count = reserved_count + 1,
      updated_at = now()
  where id = p_slot_id
    and package_code = slot_group
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
