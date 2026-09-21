create schema if not exists private;

create sequence public.student_code_seq start 100001;

create table public.student_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  student_code text not null unique default ('6CAT-' || nextval('public.student_code_seq')::text),
  email text not null unique check (email = lower(trim(email)) and char_length(email) between 5 and 254),
  full_name text not null check (char_length(trim(full_name)) between 2 and 120),
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(trim(title)) between 1 and 160),
  description text not null default '' check (char_length(description) <= 8000),
  cover_image_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 180),
  description text not null default '' check (char_length(description) <= 4000),
  position integer not null default 1 check (position between 1 and 10000),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index course_modules_course_position_idx on public.course_modules (course_id, position, created_at);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.course_modules(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 180),
  summary text not null default '' check (char_length(summary) <= 4000),
  lesson_content text not null default '' check (char_length(lesson_content) <= 50000),
  youtube_video_id text check (youtube_video_id is null or youtube_video_id ~ '^[A-Za-z0-9_-]{6,20}$'),
  duration_minutes integer check (duration_minutes is null or duration_minutes between 1 and 1440),
  position integer not null default 1 check (position between 1 and 10000),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index lessons_module_position_idx on public.lessons (module_id, position, created_at);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'suspended', 'expired', 'revoked')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, course_id),
  check (expires_at is null or expires_at > starts_at)
);

create index enrollments_student_status_idx on public.enrollments (student_id, status);
create index enrollments_course_status_idx on public.enrollments (course_id, status);
create unique index enrollments_booking_idx on public.enrollments (booking_id) where booking_id is not null;

create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed boolean not null default false,
  last_position_seconds integer not null default 0 check (last_position_seconds between 0 and 86400),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, lesson_id),
  check ((completed and completed_at is not null) or (not completed and completed_at is null))
);

create index lesson_progress_student_idx on public.lesson_progress (student_id, updated_at desc);
create index lesson_progress_lesson_idx on public.lesson_progress (lesson_id);

create or replace function private.is_learning_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'admin@6cat.com'
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin';
$$;

create or replace function private.has_active_enrollment(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.enrollments e
    join public.student_profiles s on s.id = e.student_id
    where e.student_id = auth.uid()
      and e.course_id = p_course_id
      and e.status = 'active'
      and s.status = 'active'
      and e.starts_at <= now()
      and (e.expires_at is null or e.expires_at > now())
  );
$$;

create or replace function private.can_view_lesson(p_lesson_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.lessons l
    join public.course_modules m on m.id = l.module_id
    join public.courses c on c.id = m.course_id
    join public.enrollments e on e.course_id = c.id
    join public.student_profiles s on s.id = e.student_id
    where l.id = p_lesson_id
      and l.is_published
      and m.is_published
      and c.status = 'published'
      and e.student_id = auth.uid()
      and e.status = 'active'
      and s.status = 'active'
      and e.starts_at <= now()
      and (e.expires_at is null or e.expires_at > now())
  );
$$;

create or replace function private.can_view_module(p_module_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.course_modules m
    join public.courses c on c.id = m.course_id
    join public.enrollments e on e.course_id = c.id
    join public.student_profiles s on s.id = e.student_id
    where m.id = p_module_id
      and m.is_published
      and c.status = 'published'
      and e.student_id = auth.uid()
      and e.status = 'active'
      and s.status = 'active'
      and e.starts_at <= now()
      and (e.expires_at is null or e.expires_at > now())
  );
$$;

create or replace function private.touch_learning_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.provision_student_enrollment(
  p_student_id uuid,
  p_email text,
  p_full_name text,
  p_course_id uuid,
  p_expires_at timestamptz default null
)
returns public.student_profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.student_profiles;
begin
  if not exists (select 1 from public.courses where id = p_course_id) then
    raise exception 'ไม่พบคอร์สเรียน';
  end if;

  insert into public.student_profiles (id, email, full_name, status)
  values (p_student_id, lower(trim(p_email)), trim(p_full_name), 'active')
  on conflict (id) do update
    set full_name = excluded.full_name,
        status = 'active'
  returning * into v_profile;

  insert into public.enrollments (student_id, course_id, status, starts_at, expires_at)
  values (p_student_id, p_course_id, 'active', now(), p_expires_at)
  on conflict (student_id, course_id) do update
    set status = 'active',
        starts_at = now(),
        expires_at = excluded.expires_at;

  return v_profile;
end;
$$;

create trigger touch_student_profiles_updated_at before update on public.student_profiles for each row execute function private.touch_learning_updated_at();
create trigger touch_courses_updated_at before update on public.courses for each row execute function private.touch_learning_updated_at();
create trigger touch_course_modules_updated_at before update on public.course_modules for each row execute function private.touch_learning_updated_at();
create trigger touch_lessons_updated_at before update on public.lessons for each row execute function private.touch_learning_updated_at();
create trigger touch_enrollments_updated_at before update on public.enrollments for each row execute function private.touch_learning_updated_at();
create trigger touch_lesson_progress_updated_at before update on public.lesson_progress for each row execute function private.touch_learning_updated_at();

revoke all on function private.has_active_enrollment(uuid) from public;
revoke all on function private.can_view_lesson(uuid) from public;
revoke all on function private.can_view_module(uuid) from public;
revoke all on function public.provision_student_enrollment(uuid, text, text, uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.provision_student_enrollment(uuid, text, text, uuid, timestamptz) to service_role;
grant usage on schema private to authenticated;
grant execute on function private.is_learning_admin() to authenticated;
grant execute on function private.has_active_enrollment(uuid) to authenticated;
grant execute on function private.can_view_lesson(uuid) to authenticated;
grant execute on function private.can_view_module(uuid) to authenticated;

alter table public.student_profiles enable row level security;
alter table public.courses enable row level security;
alter table public.course_modules enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;

create policy "Admins manage student profiles" on public.student_profiles for all to authenticated using (private.is_learning_admin()) with check (private.is_learning_admin());
create policy "Students read own profile" on public.student_profiles for select to authenticated using (id = auth.uid());

create policy "Admins manage courses" on public.courses for all to authenticated using (private.is_learning_admin()) with check (private.is_learning_admin());
create policy "Students read enrolled courses" on public.courses for select to authenticated using (status = 'published' and private.has_active_enrollment(id));

create policy "Admins manage course modules" on public.course_modules for all to authenticated using (private.is_learning_admin()) with check (private.is_learning_admin());
create policy "Students read enrolled modules" on public.course_modules for select to authenticated using (private.can_view_module(id));

create policy "Admins manage lessons" on public.lessons for all to authenticated using (private.is_learning_admin()) with check (private.is_learning_admin());
create policy "Students read enrolled lessons" on public.lessons for select to authenticated using (is_published and private.can_view_lesson(id));

create policy "Admins manage enrollments" on public.enrollments for all to authenticated using (private.is_learning_admin()) with check (private.is_learning_admin());
create policy "Students read own enrollments" on public.enrollments for select to authenticated using (student_id = auth.uid());

create policy "Admins read lesson progress" on public.lesson_progress for select to authenticated using (private.is_learning_admin());
create policy "Students read own progress" on public.lesson_progress for select to authenticated using (student_id = auth.uid() and private.can_view_lesson(lesson_id));
create policy "Students create own progress" on public.lesson_progress for insert to authenticated with check (student_id = auth.uid() and private.can_view_lesson(lesson_id));
create policy "Students update own progress" on public.lesson_progress for update to authenticated using (student_id = auth.uid() and private.can_view_lesson(lesson_id)) with check (student_id = auth.uid() and private.can_view_lesson(lesson_id));

insert into public.courses (slug, title, description)
values ('online-course', 'ONLINE COURSE', 'คอร์สเรียนออนไลน์สำหรับเรียนด้วยตัวเองผ่านระบบนักเรียน')
on conflict (slug) do nothing;
