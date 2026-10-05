"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  HeartPulse,
  Loader2,
  ThermometerSun,
  UserCheck,
  UserX,
  Users,
  type LucideIcon,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { apiFetch } from "@/lib/client";
import { formatDateLong } from "@/lib/format";

interface Summary {
  total_students: number;
  total_meetings: number;
  totals: { hadir: number; izin: number; sakit: number; alpa: number };
  active_meeting: {
    id: string;
    meeting_number: number;
    date: string;
    description: string;
  } | null;
}

export default function OverviewPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Summary>("/api/admin/summary")
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  const cards: { label: string; value?: number; icon: LucideIcon; tone: string }[] = [
    { label: "Total Mahasiswa", value: data?.total_students, icon: Users, tone: "text-cyan-600 bg-cyan-50" },
    { label: "Total Pertemuan", value: data?.total_meetings, icon: CalendarDays, tone: "text-cyan-600 bg-cyan-50" },
    { label: "Hadir", value: data?.totals.hadir, icon: UserCheck, tone: "text-emerald-600 bg-emerald-50" },
    { label: "Izin", value: data?.totals.izin, icon: HeartPulse, tone: "text-sky-600 bg-sky-50" },
    { label: "Sakit", value: data?.totals.sakit, icon: ThermometerSun, tone: "text-amber-600 bg-amber-50" },
    { label: "Alpa", value: data?.totals.alpa, icon: UserX, tone: "text-rose-600 bg-rose-50" },
  ];

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle="Ringkasan absensi Pemrograman Web semester ini."
      />

      {error && (
        <div className="card mb-4 flex items-start gap-3 p-4 text-sm text-rose-600">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="card p-4 sm:p-5">
            <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>
              <Icon size={18} />
            </span>
            <p className="mt-4 text-3xl font-extrabold tracking-tight text-navy">
              {value ?? (error ? "–" : <Loader2 size={22} className="animate-spin text-slate-300" />)}
            </p>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
              {label}
            </p>
          </div>
        ))}
      </div>

      <section className="card mt-6 flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Sesi aktif
          </p>
          {data?.active_meeting ? (
            <>
              <p className="mt-1 text-lg font-bold text-navy">
                Pertemuan {data.active_meeting.meeting_number}
                <span className="ml-2 text-sm font-medium text-slate-500">
                  {formatDateLong(data.active_meeting.date)}
                </span>
              </p>
              <p className="text-sm text-slate-600">
                {data.active_meeting.description || "—"}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-slate-500">
              Tidak ada sesi yang sedang dibuka.
            </p>
          )}
        </div>
        <Link href="/admin/pertemuan" className="btn-dark">
          Kelola Pertemuan <ArrowRight size={16} />
        </Link>
      </section>
    </>
  );
}
