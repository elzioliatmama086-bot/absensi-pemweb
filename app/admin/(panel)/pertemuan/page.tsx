"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  DoorClosed,
  DoorOpen,
  Eye,
  Loader2,
  Pencil,
} from "lucide-react";
import type { Meeting } from "@/lib/types";
import { apiFetch } from "@/lib/client";
import { formatDateShort, formatTimeRange } from "@/lib/format";
import PageHeader from "@/components/PageHeader";
import { MeetingBadge } from "@/components/StatusBadge";
import EditMeetingDialog from "@/components/EditMeetingDialog";
import MeetingDetailDialog from "@/components/MeetingDetailDialog";

type MeetingWithCounts = Meeting & {
  counts: { hadir: number; izin: number; sakit: number; alpa: number };
};

export default function PertemuanPage() {
  const [meetings, setMeetings] = useState<MeetingWithCounts[] | null>(null);
  const [error, setError] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Meeting | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<{ meetings: MeetingWithCounts[] }>(
        "/api/admin/meetings"
      );
      setMeetings(data.meetings);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat pertemuan.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(m: Meeting) {
    setBusyId(m.id);
    setError("");
    try {
      await apiFetch(`/api/admin/meetings/${m.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: m.status === "dibuka" ? "close" : "open" }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengubah status sesi.");
    } finally {
      setBusyId(null);
    }
  }

  const actions = (m: MeetingWithCounts) => (
    <div className="flex items-center justify-end gap-1.5">
      <button
        className="btn-ghost !px-2.5 !py-1.5 text-xs"
        onClick={() => setDetailId(m.id)}
        aria-label={`Lihat pertemuan ${m.meeting_number}`}
      >
        <Eye size={14} /> Lihat
      </button>
      <button
        className="btn-ghost !px-2.5 !py-1.5 text-xs"
        onClick={() => setEditing(m)}
        aria-label={`Edit pertemuan ${m.meeting_number}`}
      >
        <Pencil size={14} /> Edit
      </button>
      <button
        className={`${m.status === "dibuka" ? "btn-dark" : "btn-primary"} !px-2.5 !py-1.5 text-xs`}
        disabled={busyId === m.id}
        onClick={() => toggle(m)}
      >
        {busyId === m.id ? (
          <Loader2 size={14} className="animate-spin" />
        ) : m.status === "dibuka" ? (
          <DoorClosed size={14} />
        ) : (
          <DoorOpen size={14} />
        )}
        {m.status === "dibuka" ? "Tutup" : "Buka"}
      </button>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Pertemuan"
        subtitle="16 pertemuan · Senin & Kamis 13.00–15.00 WIB. Tanggal, jam, materi, dan status dapat diubah."
      />

      {error && (
        <div className="card mb-4 flex items-start gap-3 p-4 text-sm text-rose-600">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {!meetings && !error && (
        <div className="flex justify-center py-16 text-slate-400">
          <Loader2 className="animate-spin" />
        </div>
      )}

      {meetings && (
        <>
          {/* Tabel desktop */}
          <div className="card hidden overflow-hidden md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">Tanggal</th>
                  <th className="px-4 py-3 font-semibold">Hari</th>
                  <th className="px-4 py-3 font-semibold">Waktu</th>
                  <th className="px-4 py-3 font-semibold">Keterangan</th>
                  <th className="px-4 py-3 font-semibold">Hadir</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {meetings.map((m) => (
                  <tr
                    key={m.id}
                    className={m.status === "dibuka" ? "bg-cyan-50/50" : "hover:bg-slate-50/60"}
                  >
                    <td className="px-4 py-3 font-mono font-bold text-cyan-700">
                      {m.meeting_number}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{formatDateShort(m.date)}</td>
                    <td className="px-4 py-3">{m.day}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatTimeRange(m.start_time, m.end_time).replace(" WIB", "")}
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-3 font-medium text-navy">
                      {m.description || "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">{m.counts.hadir}</td>
                    <td className="px-4 py-3">
                      <MeetingBadge status={m.status} />
                    </td>
                    <td className="px-4 py-3">{actions(m)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Timeline mobile */}
          <ol className="space-y-3 md:hidden">
            {meetings.map((m) => (
              <li
                key={m.id}
                className={`card p-4 ${m.status === "dibuka" ? "ring-2 ring-cyan-500/40" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-semibold text-cyan-700">
                      PERTEMUAN {String(m.meeting_number).padStart(2, "0")}
                    </p>
                    <p className="mt-0.5 font-bold text-navy">{m.description || "—"}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {m.day}, {formatDateShort(m.date)} ·{" "}
                      {formatTimeRange(m.start_time, m.end_time).replace(" WIB", "")}
                    </p>
                  </div>
                  <MeetingBadge status={m.status} />
                </div>
                <div className="mt-3 border-t border-slate-100 pt-3">{actions(m)}</div>
              </li>
            ))}
          </ol>
        </>
      )}

      {detailId && (
        <MeetingDetailDialog
          meetingId={detailId}
          onClose={() => setDetailId(null)}
          onChanged={load}
        />
      )}
      {editing && (
        <EditMeetingDialog
          meeting={editing}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
    </>
  );
}
