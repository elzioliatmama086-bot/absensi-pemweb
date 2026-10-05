# Absensi Pemrograman Web

Sistem absensi mahasiswa — Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase.
16 pertemuan, jadwal awal Senin & Kamis 13.00–15.00 WIB. Tanggal, jam, materi, dan status
tiap pertemuan bisa diubah dosen dari dashboard.

## 1. Siapkan Supabase

1. Buat project di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, tempel isi `supabase/schema.sql`, lalu **Run**.
   Ini membuat tabel `students`, `meetings`, `attendance`, constraint unik
   `(meeting_id, student_id)`, 7 mahasiswa, dan 16 pertemuan awal.
3. Ambil kunci di **Project Settings → API**: Project URL, `anon` key, dan `service_role` key.

## 2. Jalankan lokal

```bash
npm install
cp .env.example .env.local   # lalu isi nilainya
npm run dev
```

Buka http://localhost:3000. Dashboard dosen: http://localhost:3000/admin
(login memakai `ADMIN_PASSWORD`).

| Variabel | Keterangan |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **rahasia**, hanya dipakai di server |
| `ADMIN_PASSWORD` | password login dosen |
| `NEXT_PUBLIC_SITE_URL` | opsional, URL Vercel untuk QR Code |

`.env.local` sudah masuk `.gitignore` — jangan di-commit.

## 3. Deploy ke Vercel

1. Push project ke GitHub, lalu import di Vercel.
2. Isi semua environment variable di atas pada **Settings → Environment Variables**.
3. Deploy. Buka dashboard dari URL Vercel (bukan localhost) agar QR Code mengarah ke
   alamat publik: `https://website-kamu.vercel.app/attendance?meeting=5&t=<token>`.

## Cara kerja singkat

- **QR Code**: tiap pertemuan punya `qr_token`. **Regenerate QR** membuat token baru,
  sehingga QR lama tidak berlaku lagi.
- **Buka/Tutup Absensi**: hanya satu pertemuan berstatus *Dibuka* pada satu waktu
  (dijaga di API dan indeks unik database). Menutup sesi mengubah status menjadi *Selesai*.
- **Aturan absensi**: satu absensi per mahasiswa per pertemuan (constraint DB), tidak bisa
  dikirim saat sesi ditutup, tidak bisa diubah mahasiswa setelah terkirim (hanya admin),
  waktu dicatat database.
- **Keamanan**: RLS aktif tanpa policy untuk anon; semua akses data lewat API route server
  dengan service role key. Login admin memakai cookie httpOnly.
- **Pengaturan → Susun Jadwal**: isi tanggal pertemuan 1 (Senin/Kamis) untuk mengisi 16
  tanggal Senin/Kamis otomatis; tiap tanggal tetap bisa diubah manual.
