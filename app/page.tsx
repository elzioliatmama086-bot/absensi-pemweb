import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  ListChecks,
  QrCode,
  ScanLine,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { getAdminClient } from "@/lib/supabase";
import {
  formatDateLong,
  formatTimeRange,
} from "@/lib/format";
import type { PublicMeeting } from "@/lib/types";
import { MeetingBadge } from "@/components/StatusBadge";
import QrVisual from "@/components/QrVisual";

export const dynamic = "force-dynamic";

const COLUMNS =
  "id, meeting_number, date, day, start_time, end_time, description, status";

async function getFeaturedMeeting(): Promise<PublicMeeting | null> {
  try {
    const db = getAdminClient();
    const { data: active } = await db
      .from("meetings")
      .select(COLUMNS)
      .eq("status", "dibuka")
      .maybeSingle();
    if (active) return active as PublicMeeting;

    // Tidak ada sesi dibuka: tampilkan pertemuan terdekat berikutnya.
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
    const { data: next } = await db
      .from("meetings")
      .select(COLUMNS)
      .gte("date", today)
      .order("date")
      .limit(1)
      .maybeSingle();
    return (next as PublicMeeting | null) ?? null;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const meeting = await getFeaturedMeeting();
  const isOpen = meeting?.status === "dibuka";
  const startHref = meeting
    ? `/attendance?meeting=${meeting.meeting_number}`
    : "/attendance";

  return (
    <main className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Kiri: informasi */}
      <section className="relative flex flex-col justify-between px-6 py-8 sm:px-10 lg:px-16 lg:py-12">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy text-cyan-400">
              <Terminal size={18} />
            </span>
            <span className="text-sm font-bold tracking-tight text-navy">
              WebProg<span className="text-cyan-600">.absen</span>
            </span>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-navy"
          >
            <ShieldCheck size={14} /> Dosen
          </Link>
        </header>

        <div className="animate-rise py-12 lg:py-0">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
            Mata Kuliah Pemrograman Web
          </p>
          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-navy sm:text-5xl">
            Absensi
            <br />
            <span className="text-cyan-600">Pemrograman Web</span>
          </h1>

          {meeting ? (
            <div className="card mt-8 max-w-lg divide-y divide-slate-100">
              <div className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {isOpen ? "Pertemuan aktif" : "Pertemuan berikutnya"}
                  </p>
                  <p className="mt-0.5 text-lg font-bold text-navy">
                    Pertemuan {meeting.meeting_number}
                  </p>
                </div>
                <MeetingBadge status={meeting.status} />
              </div>
              <div className="space-y-3 p-4 text-sm">
                <p className="flex items-center gap-3 text-slate-600">
                  <CalendarDays size={16} className="shrink-0 text-cyan-600" />
                  {meeting.day}, {formatDateLong(meeting.date)}
                </p>
                <p className="flex items-center gap-3 text-slate-600">
                  <Clock size={16} className="shrink-0 text-cyan-600" />
                  {formatTimeRange(meeting.start_time, meeting.end_time)}
                </p>
                <p className="flex items-start gap-3 text-slate-600">
                  <ListChecks size={16} className="mt-0.5 shrink-0 text-cyan-600" />
                  <span>{meeting.description || "Belum ada keterangan materi"}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 p-4 text-sm font-semibold">
                <span
                  className={`h-2 w-2 rounded-full ${isOpen ? "bg-emerald-500" : "bg-slate-300"}`}
                />
                <span className={isOpen ? "text-emerald-700" : "text-slate-500"}>
                  {isOpen ? "Absensi Dibuka" : "Absensi Ditutup"}
                </span>
              </div>
            </div>
          ) : (
            <div className="card mt-8 max-w-lg p-4 text-sm text-slate-600">
              Belum ada data pertemuan. Pastikan skema Supabase sudah dijalankan.
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={startHref} className="btn-primary px-6 py-3">
              <ScanLine size={18} /> Mulai Absensi <ArrowRight size={16} />
            </Link>
            <Link href="/pertemuan" className="btn-ghost px-6 py-3">
              <ListChecks size={18} /> Lihat Pertemuan
            </Link>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Senin &amp; Kamis · 13.00–15.00 WIB · 16 pertemuan
        </p>
      </section>

      {/* Kanan: visual */}
      <section className="grid-bg relative flex items-center justify-center overflow-hidden bg-navy px-6 py-14 lg:min-h-screen">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative w-full max-w-sm">
          <QrVisual />
          <div className="mt-8 space-y-3">
            {[
              { icon: QrCode, text: "Scan QR Code pertemuan" },
              { icon: ListChecks, text: "Cari nama atau NPM" },
              { icon: ShieldCheck, text: "Pilih status & konfirmasi" },
            ].map(({ icon: Icon, text }, i) => (
              <div
                key={text}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 backdrop-blur"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-cyan-500/15 font-mono text-xs font-bold text-cyan-300">
                  {i + 1}
                </span>
                <Icon size={16} className="text-cyan-400" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
