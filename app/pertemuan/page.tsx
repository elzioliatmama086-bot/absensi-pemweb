import Link from "next/link";
import { ArrowLeft, ScanLine } from "lucide-react";
import { getAdminClient } from "@/lib/supabase";
import { formatDateShort, formatTimeRange } from "@/lib/format";
import type { PublicMeeting } from "@/lib/types";
import { MeetingBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function PertemuanPage() {
  let meetings: PublicMeeting[] = [];
  let failed = false;
  try {
    const { data, error } = await getAdminClient()
      .from("meetings")
      .select("id, meeting_number, date, day, start_time, end_time, description, status")
      .order("meeting_number");
    if (error) throw error;
    meetings = (data ?? []) as PublicMeeting[];
  } catch {
    failed = true;
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-5 py-8 sm:py-12">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-navy"
      >
        <ArrowLeft size={16} /> Beranda
      </Link>
      <h1 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
        Jadwal Pertemuan
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Pemrograman Web · Senin &amp; Kamis · 13.00–15.00 WIB
      </p>

      {failed && (
        <div className="card mt-6 p-4 text-sm text-rose-600">
          Gagal memuat data. Periksa koneksi Supabase.
        </div>
      )}

      <ol className="relative mt-8 space-y-3 border-l-2 border-slate-200 pl-6">
        {meetings.map((m) => {
          const open = m.status === "dibuka";
          return (
            <li key={m.id} className="relative">
              <span
                className={`absolute -left-[33px] top-5 flex h-4 w-4 items-center justify-center rounded-full border-2 bg-canvas ${
                  open
                    ? "border-cyan-500"
                    : m.status === "selesai"
                      ? "border-navy bg-navy"
                      : "border-slate-300"
                }`}
              >
                {open && <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />}
              </span>
              <div className={`card p-4 ${open ? "ring-2 ring-cyan-500/40" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-semibold text-cyan-700">
                      PERTEMUAN {String(m.meeting_number).padStart(2, "0")}
                    </p>
                    <p className="mt-0.5 font-bold text-navy">
                      {m.description || "—"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {m.day}, {formatDateShort(m.date)} ·{" "}
                      {formatTimeRange(m.start_time, m.end_time)}
                    </p>
                  </div>
                  <MeetingBadge status={m.status} />
                </div>
                {open && (
                  <Link
                    href={`/attendance?meeting=${m.meeting_number}`}
                    className="btn-primary mt-4 w-full"
                  >
                    <ScanLine size={16} /> Absen Sekarang
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
