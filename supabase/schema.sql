-- ===========
==========================================================
-- Амжилт Кибер Сургууль · Өдөрлөгийн судалгаа
-- Supabase SQL Editor дээр бүтнээр нь ажиллуулна.
-- =====================================================================

-- ---------- Админууд ----------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()));
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "admins read self" on public.admins;
create policy "admins read self" on public.admins
  for select to authenticated
  using (user_id = (select auth.uid()));

-- ---------- Хичээлийн жагсаалт (админ засна) ----------
create table if not exists public.subjects (
  id bigint generated always as identity primary key,
  name text not null unique check (char_length(name) between 1 and 60),
  sort int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.subjects enable row level security;

drop policy if exists "subjects public read" on public.subjects;
create policy "subjects public read" on public.subjects
  for select to anon, authenticated using (true);

drop policy if exists "subjects admin insert" on public.subjects;
create policy "subjects admin insert" on public.subjects
  for insert to authenticated with check ((select public.is_admin()));
drop policy if exists "subjects admin update" on public.subjects;
create policy "subjects admin update" on public.subjects
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "subjects admin delete" on public.subjects;
create policy "subjects admin delete" on public.subjects
  for delete to authenticated using ((select public.is_admin()));

insert into public.subjects (name, sort) values
  ('Математик', 1), ('Монгол хэл', 2), ('Англи хэл', 3), ('Байгалийн ухаан', 4),
  ('Программ хангамж', 5), ('Гоо зүй', 6), ('Нийгмийн ухаан', 7), ('Биеийн тамир', 8)
on conflict (name) do nothing;

-- ---------- Хариултууд ----------
create table if not exists public.form_responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  student_name text not null check (char_length(student_name) between 1 and 120),
  class_group text not null,
  guardian text not null check (guardian in ('Аав', 'Ээж', 'Эмээ', 'Өвөө', 'Бусад')),
  guardian_other text check (char_length(guardian_other) <= 80),
  info_sources text[] not null default '{}',
  info_source_other text check (char_length(info_source_other) <= 120),
  org_rating smallint check (org_rating between 1 and 5),
  -- {"lessons":"yes|partial|no","clubs":…,"cambridge":…,"goals":…}
  info_adequacy jsonb not null default '{}'::jsonb,
  clear_subjects text[] not null default '{}',
  subject_other text check (char_length(subject_other) <= 120),
  join_council text check (join_council in ('yes', 'no', 'maybe')),
  feedback text check (char_length(feedback) <= 1000),
  email text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  device_id text check (char_length(device_id) <= 64)
);

-- Сургуулийн бүлгүүд (src/lib/constants.js-ийн CLASS_GROUPS-тай ижил байх ёстой)
alter table public.form_responses drop constraint if exists form_responses_class_group_check;
alter table public.form_responses add constraint form_responses_class_group_check
  check (class_group in (
    '1-1','1-2','1-3','2-1','2-2','2-3','3-1','3-2','4-1','4-2','5-1','5-2','6-1','6-2','6-3',
    '7-1','7-2','8-1','8-2','9-1','9-2','10-1','11-1','11-2','12-1','12-2','12-3'
  ));

create index if not exists form_responses_class_idx on public.form_responses (class_group);
create index if not exists form_responses_device_idx on public.form_responses (device_id, created_at desc);

alter table public.form_responses enable row level security;

-- Нийтэд зөвхөн INSERT
drop policy if exists "responses public insert" on public.form_responses;
create policy "responses public insert" on public.form_responses
  for insert to anon, authenticated with check (true);

-- Унших, устгах эрх зөвхөн админд
drop policy if exists "responses admin read" on public.form_responses;
create policy "responses admin read" on public.form_responses
  for select to authenticated using ((select public.is_admin()));
drop policy if exists "responses admin delete" on public.form_responses;
create policy "responses admin delete" on public.form_responses
  for delete to authenticated using ((select public.is_admin()));

-- ---------- Хөнгөн rate limit: нэг төхөөрөмжөөс 10 минутад 2-оос илүүгүй ----------
create or replace function public.limit_response_rate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.device_id is not null and (
    select count(*) from public.form_responses r
    where r.device_id = new.device_id
      and r.created_at > now() - interval '10 minutes'
  ) >= 2 then
    raise exception 'RATE_LIMIT' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists form_responses_rate_limit on public.form_responses;
create trigger form_responses_rate_limit
  before insert on public.form_responses
  for each row execute function public.limit_response_rate();

-- ---------- Data API эрх (шинэ төслүүдэд хүснэгт автоматаар нээгддэггүй) ----------
-- Мөр түвшний хязгаарлалтыг дээрх RLS policy-нууд хийнэ.
grant select on table public.admins to authenticated;
grant select on table public.subjects to anon, authenticated;
grant insert, update, delete on table public.subjects to authenticated;
grant insert on table public.form_responses to anon, authenticated;
grant select, delete on table public.form_responses to authenticated;

-- =====================================================================
-- Админ нэмэх: Authentication -> Users хэсэгт хэрэглэгч үүсгээд
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'admin@amjilt.com';
-- =====================================================================
