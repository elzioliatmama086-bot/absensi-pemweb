"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Download, Loader2, Search, X } from "lucide-react";
import type { AttendanceRow, AttendanceStatus, Meeting } from "@/lib/types";
import { ATTENDANCE_STATUSES } from "@/lib/types";
import { apiFetch } from "@/lib/client";
import {
  ATTENDANCE_LABEL,
  formatDateShort,
  formatDateTimeWIB,
} from "@/lib/format";
import PageHeader from "@/components/PageHeader";
import { AttendanceBadge } from "@/components/StatusBadge";

export default function AbsensiPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [rows, setRows] = useState<AttendanceRow[] | null>(null);
  const [error, setError] = useState("");

  const [q, setQ] = useState("");
  const [meeting, setMeeting] = useState("");
  const [status, setStatus] = useState<AttendanceStatus | "">("");
  const [date, setDate] = useState("");

  useEffect(() => {
    apiFetch<{ meetings: Meeting[] }>("/api/admin/meetings")
      .then((d) => setMeetings(d.meetings))
      .catch(() => undefined);
  }, []);

  const load = useCallback(async () => {
    const sp = new URLSearchParams();
    if (q.trim()) sp.set("q", q.trim());
    if (meeting) sp.set("meeting", meeting);
    if (status) sp.set("status", status);
    if (date) sp.set("date", date);
    try {
      const d = await apiFetch<{ rows: AttendanceRow[] }>(
        `/api/admin/attendance?${sp.toString()}`
      );
      setRows(d.rows);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data absensi.");
    }
  }, [q, meeting, status, date]);

  // debounce pencarian & filter
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const hasFilter = !!(q || meeting || status || date);

  function exportCsv() {
    if (!rows) return;
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [
      ["Nama", "NPM", "Pertemuan", "Tanggal", "Status", "Waktu"].join(","),
      ...rows.map((r) =>
        [
          esc(r.students?.name ?? ""),
          esc(r.students?.npm ?? ""),
          r.meetings?.meeting_number ?? "",
          r.meetings ? formatDateShort(r.meetings.date) : "",
          ATTENDANCE_LABEL[r.status],
          esc(formatDateTimeWIB(r.attendance_time)),
        ].join(",")
      ),
    ];
    const blob = new Blob(["﻿" + lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "data-absensi.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <>
      <PageHeader
        title="Data Absensi"
        subtitle="Seluruh data absensi mahasiswa. Waktu tercatat dari server/database (WIB)."
      >
        <button
          className="btn-ghost"
          onClick={exportCsv}
          disabled={!rows || rows.length === 0}
        >
          <Download size={16} /> Ekspor CSV
        </button>
      </PageHeader>

      <div className="card mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            className="input !pl-10"
            placeholder="Cari nama / NPM…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          className="input"
          value={meeting}
          onChange={(e) => setMeeting(e.target.value)}
          aria-label="Filter pertemuan"
        >
          <option value="">Semua pertemuan</option>
          {meetings.map((m) => (
            <option key={m.id} value={m.id}>
              Pertemuan {m.meeting_number}
            </option>
          ))}
        </select>
        <select
          className="input"
          value={status}
          onChange={(e) => setStatus(e.target.value as AttendanceStatus | "")}
          aria-label="Filter status"
        >
          <option value="">Semua status</option>
          {ATTENDANCE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ATTENDANCE_LABEL[s]}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Filter tanggal"
        />
        {hasFilter && (
          <button
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-navy sm:col-span-2 lg:col-span-4"
            onClick={() => {
              setQ("");
              setMeeting("");
              setStatus("");
              setDate("");
            }}
          >
            <X size={13} /> Reset filter
          </button>
        )}
      </div>

      {error && (
        <div className="card mb-4 flex items-start gap-3 p-4 text-sm text-rose-600">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {!rows && !error && (
        <div className="flex justify-center py-16 text-slate-400">
          <Loader2 className="animate-spin" />
        </div>
      )}

      {rows && (
        <>
          <p className="mb-2 text-xs text-slate-500">{rows.length} data</p>

          {/* Tabel desktop */}
          <div className="card hidden overflow-hidden md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nama</th>
                  <th className="px-4 py-3 font-semibold">NPM</th>
                  <th className="px-4 py-3 font-semibold">Pertemuan</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                      Belum ada data absensi.
                    </td>
                  </tr>
                )}
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-semibold text-navy">
                      {r.students?.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {r.students?.npm}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {r.meetings?.meeting_number}
                      <span className="ml-1.5 text-xs text-slate-400">
                        {r.meetings && formatDateShort(r.meetings.date)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <AttendanceBadge status={r.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">
                      {formatDateTimeWIB(r.attendance_time)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Kartu mobile */}
          <ul className="space-y-2 md:hidden">
            {rows.length === 0 && (
              <li className="card p-6 text-center text-sm text-slate-500">
                Belum ada data absensi.
              </li>
            )}
            {rows.map((r) => (
              <li key={r.id} className="card flex items-center justify-between gap-3 p-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-navy">
                    {r.students?.name}
                  </p>
                  <p className="font-mono text-xs text-slate-500">{r.students?.npm}</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Pertemuan {r.meetings?.meeting_number} ·{" "}
                    {formatDateTimeWIB(r.attendance_time)}
                  </p>
                </div>
                <AttendanceBadge status={r.status} />
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
