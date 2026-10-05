-- =====================================================================
-- Skema Sistem Absensi Pemrograman Web
-- Jalankan seluruh file ini di Supabase > SQL Editor.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Tabel
-- ---------------------------------------------------------------------
create table if not exists public.students (
  id          uuid primary key default gen_random_uuid(),
  npm         text not null unique,
  name        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.meetings (
  id              uuid primary key default gen_random_uuid(),
  meeting_number  int  not null unique check (meeting_number between 1 and 16),
  date            date not null,
  day             text not null,
  start_time      time not null default '13:00',
  end_time        time not null default '15:00',
  description     text not null default '',
  status          text not null default 'belum_dibuka'
                  check (status in ('belum_dibuka', 'dibuka', 'selesai')),
  qr_token        text not null default encode(gen_random_bytes(12), 'hex'),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.attendance (
  id               uuid primary key default gen_random_uuid(),
  meeting_id       uuid not null references public.meetings(id) on delete cascade,
  student_id       uuid not null references public.students(id) on delete cascade,
  status           text not null check (status in ('hadir', 'izin', 'sakit', 'alpa')),
  attendance_time  timestamptz not null default now(),   -- waktu server/database
  created_at       timestamptz not null default now(),
  -- satu mahasiswa hanya boleh punya satu absensi per pertemuan
  constraint attendance_meeting_student_unique unique (meeting_id, student_id)
);

create index if not exists attendance_meeting_idx on public.attendance (meeting_id);
create index if not exists attendance_student_idx on public.attendance (student_id);

-- Hanya satu pertemuan yang boleh berstatus 'dibuka' pada satu waktu
create unique index if not exists meetings_single_open_idx
  on public.meetings ((status)) where status = 'dibuka';

-- ---------------------------------------------------------------------
-- updated_at otomatis
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists meetings_set_updated_at on public.meetings;
create trigger meetings_set_updated_at
  before update on public.meetings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Keamanan: RLS aktif tanpa policy untuk anon.
-- Seluruh akses data lewat API route Next.js (server) dengan service role key.
-- ---------------------------------------------------------------------
alter table public.students   enable row level security;
alter table public.meetings   enable row level security;
alter table public.attendance enable row level security;

-- ---------------------------------------------------------------------
-- Data awal: 7 mahasiswa (persis sesuai daftar)
-- ---------------------------------------------------------------------
insert into public.students (npm, name) values
  ('24311134', 'Ririn Haryanti'),
  ('24311069', 'Bunga Citra Lestari'),
  ('24311096', 'Dhara Piolita'),
  ('24311063', 'Ahmad Sultan Wira Negara'),
  ('24311067', 'Aris Triantoro'),
  ('24311062', 'Ahad Fahmi Faizi'),
  ('24311121', 'Muhammad Arya Putra')
on conflict (npm) do nothing;

-- ---------------------------------------------------------------------
-- Data awal: 16 pertemuan, Senin & Kamis 13.00-15.00 WIB
-- Tanggal hanyalah nilai awal; admin bebas mengubahnya dari dashboard.
-- ---------------------------------------------------------------------
insert into public.meetings (meeting_number, date, day, start_time, end_time, description, status) values
  (1,  '2026-10-05', 'Senin',  '13:00', '15:00', 'Pengenalan Pemrograman Web',            'dibuka'),
  (2,  '2026-10-08', 'Kamis',  '13:00', '15:00', 'HTML dan Struktur Halaman Web',         'belum_dibuka'),
  (3,  '2026-10-12', 'Senin',  '13:00', '15:00', 'CSS dan Styling',                       'belum_dibuka'),
  (4,  '2026-10-15', 'Kamis',  '13:00', '15:00', 'JavaScript Dasar',                      'belum_dibuka'),
  (5,  '2026-10-19', 'Senin',  '13:00', '15:00', 'DOM dan Event Handling',                'belum_dibuka'),
  (6,  '2026-10-22', 'Kamis',  '13:00', '15:00', 'Responsive Design',                     'belum_dibuka'),
  (7,  '2026-10-26', 'Senin',  '13:00', '15:00', 'Pengenalan Framework Frontend',         'belum_dibuka'),
  (8,  '2026-10-29', 'Kamis',  '13:00', '15:00', 'Review dan Praktikum Frontend',         'belum_dibuka'),
  (9,  '2026-11-02', 'Senin',  '13:00', '15:00', 'React dan Komponen',              'belum_dibuka'),
  (10, '2026-11-05', 'Kamis',  '13:00', '15:00', 'Routing dan State Management',          'belum_dibuka'),
  (11, '2026-11-09', 'Senin',  '13:00', '15:00', 'Next.js Dasar',                         'belum_dibuka'),
  (12, '2026-11-12', 'Kamis',  '13:00', '15:00', 'API dan Fetching Data',                 'belum_dibuka'),
  (13, '2026-11-16', 'Senin',  '13:00', '15:00', 'Database dan Supabase',                 'belum_dibuka'),
  (14, '2026-11-19', 'Kamis',  '13:00', '15:00', 'Autentikasi dan Keamanan Web',          'belum_dibuka'),
  (15, '2026-11-23', 'Senin',  '13:00', '15:00', 'Deployment ke Vercel',                  'belum_dibuka'),
  (16, '2026-11-26', 'Kamis',  '13:00', '15:00', 'Presentasi Proyek Akhir',               'belum_dibuka')
on conflict (meeting_number) do nothing;
