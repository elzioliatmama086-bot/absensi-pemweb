"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  CalendarDays,
  Clock,
  HeartPulse,
  Loader2,
  Lock,
  Search,
  ThermometerSun,
  UserCheck,
  UserX,
  type LucideIcon,
} from "lucide-react";
import type { AttendanceStatus, PublicMeeting } from "@/lib/types";
import {
  ATTENDANCE_LABEL,
  formatDateLong,
  formatDateTimeWIB,
  formatTimeRange,
} from "@/lib/format";
import { MeetingBadge } from "@/components/StatusBadge";

interface StudentItem {
  id: string;
  npm: string;
  name: string;
  attended: boolean;
}

type Step = "search" | "status" | "confirm" | "done";

const STATUS_OPTIONS: {
  value: AttendanceStatus;
  icon: LucideIcon;
  hint: string;
  active: string;
}[] = [
  { value: "hadir", icon: UserCheck, hint: "Saya mengikuti kelas", active: "border-emerald-500 bg-emerald-50 text-emerald-700" },
  { value: "izin", icon: HeartPulse, hint: "Berhalangan, ada izin", active: "border-sky-500 bg-sky-50 text-sky-700" },
  { value: "sakit", icon: ThermometerSun, hint: "Tidak hadir karena sakit", active: "border-amber-500 bg-amber-50 text-amber-700" },
  { value: "alpa", icon: UserX, hint: "Tanpa keterangan", active: "border-rose-500 bg-rose-50 text-rose-700" },
];

export default function AttendanceFlow() {
  const params = useSearchParams();
  const meetingParam = params.get("meeting");
  const token = params.get("t");

  const [meeting, setMeeting] = useState<PublicMeeting | null>(null);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [step, setStep] = useState<Step>("search");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<StudentItem | null>(null);
  const [status, setStatus] = useState<AttendanceStatus | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [result, setResult] = useState<{ time: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const url = meetingParam
        ? `/api/public/meeting?meeting=${encodeURIComponent(meetingParam)}`
        : "/api/public/meeting";
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal memuat pertemuan.");
      setMeeting(data.meeting);
      setStudents(data.students);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Gagal memuat pertemuan.");
    } finally {
      setLoading(false);
    }
  }, [meetingParam]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) => s.name.toLowerCase().includes(q) || s.npm.includes(q)
    );
  }, [students, query]);

  const isOpen = meeting?.status === "dibuka";

  async function submit() {
    if (!meeting || !selected || !status) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meeting_number: meeting.meeting_number,
          student_id: selected.id,
          status,
          token: token ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Gagal mengirim absensi.");
        if (res.status === 409) load();
        return;
      }
      setResult({ time: data.attendance_time });
      setStep("done");
    } catch {
      setSubmitError("Koneksi bermasalah. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  const stepIndex = { search: 0, status: 1, confirm: 2, done: 3 }[step];

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-6">
      <header className="mb-5 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-navy"
        >
          <ArrowLeft size={16} /> Beranda
        </Link>
        <span className="font-mono text-xs font-semibold text-slate-400">
          WebProg.absen
        </span>
      </header>

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-slate-500">
          <Loader2 className="animate-spin" size={22} />
        </div>
      ) : loadError ? (
        <div className="card flex items-start gap-3 p-4 text-sm text-rose-600">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Gagal memuat</p>
            <p className="mt-0.5 text-slate-600">{loadError}</p>
            <button onClick={load} className="btn-ghost mt-3 !py-1.5">
              Coba lagi
            </button>
          </div>
        </div>
      ) : !meeting ? (
        <div className="card p-6 text-center">
          <Lock className="mx-auto text-slate-400" size={28} />
          <h1 className="mt-3 text-lg font-bold text-navy">
            Belum ada sesi absensi dibuka
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Tunggu dosen membuka absensi, lalu scan QR Code pertemuan.
          </p>
          <Link href="/pertemuan" className="btn-ghost mt-5">
            Lihat Pertemuan
          </Link>
        </div>
      ) : (
        <>
          {/* Kartu pertemuan */}
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between gap-3 bg-navy px-4 py-3">
              <div>
                <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-cyan-400">
                  Pertemuan {meeting.meeting_number}
                </p>
                <p className="mt-0.5 text-sm font-bold leading-snug text-white">
                  {meeting.description || "—"}
                </p>
              </div>
              <MeetingBadge status={meeting.status} />
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 px-4 py-3 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={13} className="text-cyan-600" />
                {meeting.day}, {formatDateLong(meeting.date)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock size={13} className="text-cyan-600" />
                {formatTimeRange(meeting.start_time, meeting.end_time)}
              </span>
            </div>
          </section>

          {!isOpen ? (
            <div className="card mt-4 flex items-start gap-3 p-4">
              <Lock size={18} className="mt-0.5 shrink-0 text-slate-400" />
              <div className="text-sm">
                <p className="font-bold text-navy">Absensi Ditutup</p>
                <p className="mt-0.5 text-slate-500">
                  {meeting.status === "belum_dibuka"
                    ? "Sesi ini belum dibuka oleh dosen."
                    : "Sesi ini sudah selesai, absensi tidak dapat dikirim."}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Indikator langkah */}
              <div className="mt-5 flex items-center gap-1.5" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i <= stepIndex ? "bg-cyan-500" : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>

              {/* 1. Cari mahasiswa */}
              {step === "search" && (
                <section className="mt-5 animate-rise">
                  <h2 className="text-lg font-bold text-navy">Cari namamu</h2>
                  <p className="text-sm text-slate-500">
                    Ketik nama atau NPM, lalu pilih dari daftar.
                  </p>
                  <div className="relative mt-4">
                    <Search
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      className="input !pl-10"
                      placeholder="Nama atau NPM…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      autoFocus
                      inputMode="search"
                    />
                  </div>
                  <ul className="mt-3 space-y-2">
                    {filtered.length === 0 && (
                      <li className="card p-4 text-center text-sm text-slate-500">
                        Mahasiswa tidak ditemukan.
                      </li>
                    )}
                    {filtered.map((s) => (
                      <li key={s.id}>
                        <button
                          disabled={s.attended}
                          onClick={() => {
                            setSelected(s);
                            setStep("status");
                            setSubmitError("");
                          }}
                          className="card flex w-full items-center justify-between gap-3 p-3.5 text-left transition hover:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-slate-200"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-navy">
                              {s.name}
                            </span>
                            <span className="font-mono text-xs text-slate-500">
                              {s.npm}
                            </span>
                          </span>
                          {s.attended && (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                              <Check size={12} /> Sudah absen
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* 2. Pilih status */}
              {step === "status" && selected && (
                <section className="mt-5 animate-rise">
                  <h2 className="text-lg font-bold text-navy">Pilih status</h2>
                  <p className="text-sm text-slate-500">
                    {selected.name} · <span className="font-mono">{selected.npm}</span>
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {STATUS_OPTIONS.map(({ value, icon: Icon, hint, active }) => {
                      const on = status === value;
                      return (
                        <button
                          key={value}
                          onClick={() => setStatus(value)}
                          className={`rounded-2xl border-2 p-3.5 text-left transition ${
                            on
                              ? active
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                          }`}
                          aria-pressed={on}
                        >
                          <Icon size={20} />
                          <span className="mt-2 block text-sm font-bold">
                            {ATTENDANCE_LABEL[value]}
                          </span>
                          <span className="mt-0.5 block text-[11px] leading-snug opacity-80">
                            {hint}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-5 flex gap-3">
                    <button
                      className="btn-ghost flex-1"
                      onClick={() => {
                        setStep("search");
                        setStatus(null);
                      }}
                    >
                      Kembali
                    </button>
                    <button
                      className="btn-primary flex-1"
                      disabled={!status}
                      onClick={() => setStep("confirm")}
                    >
                      Lanjut
                    </button>
                  </div>
                </section>
              )}

              {/* 3. Konfirmasi */}
              {step === "confirm" && selected && status && (
                <section className="mt-5 animate-rise">
                  <h2 className="text-lg font-bold text-navy">Konfirmasi</h2>
                  <p className="text-sm text-slate-500">
                    Periksa kembali. Absensi tidak bisa diubah setelah dikirim.
                  </p>
                  <dl className="card mt-4 divide-y divide-slate-100 text-sm">
                    {[
                      ["Nama", selected.name],
                      ["NPM", selected.npm],
                      ["Pertemuan", `Pertemuan ${meeting.meeting_number}`],
                      ["Status", ATTENDANCE_LABEL[status]],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 px-4 py-3">
                        <dt className="text-slate-500">{k}</dt>
                        <dd className="text-right font-semibold text-navy">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  {submitError && (
                    <p className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      {submitError}
                    </p>
                  )}
                  <div className="mt-5 flex gap-3">
                    <button
                      className="btn-ghost flex-1"
                      disabled={submitting}
                      onClick={() => setStep("status")}
                    >
                      Kembali
                    </button>
                    <button
                      className="btn-primary flex-1"
                      disabled={submitting}
                      onClick={submit}
                    >
                      {submitting ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Check size={16} />
                      )}
                      Kirim Absensi
                    </button>
                  </div>
                </section>
              )}

              {/* 4. Berhasil */}
              {step === "done" && selected && status && (
                <section className="mt-8 animate-rise text-center">
                  <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <CheckCircle2 size={34} />
                  </span>
                  <h2 className="mt-4 text-xl font-extrabold text-navy">
                    Absensi Berhasil
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {selected.name} tercatat{" "}
                    <strong className="text-navy">{ATTENDANCE_LABEL[status]}</strong>{" "}
                    pada Pertemuan {meeting.meeting_number}.
                  </p>
                  {result && (
                    <p className="mt-2 font-mono text-xs text-slate-400">
                      {formatDateTimeWIB(result.time)} WIB
                    </p>
                  )}
                  <Link href="/" className="btn-dark mt-6">
                    Kembali ke Beranda
                  </Link>
                </section>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}
