"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  DoorClosed,
  DoorOpen,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import type { AttendanceStatus, Meeting } from "@/lib/types";
import { ATTENDANCE_STATUSES } from "@/lib/types";
import { apiFetch } from "@/lib/client";
import {
  ATTENDANCE_LABEL,
  formatDateTimeWIB,
} from "@/lib/format";
import Modal from "./Modal";
import QrPanel from "./QrPanel";
import { AttendanceBadge, MeetingBadge } from "./StatusBadge";
import EditMeetingDialog from "./EditMeetingDialog";

interface StudentRow {
  id: string;
  npm: string;
  name: string;
  attendance: {
    id: string;
    status: AttendanceStatus;
    attendance_time: string;
  } | null;
}

interface Detail {
  meeting: Meeting;
  students: StudentRow[];
}

export default function MeetingDetailDialog({
  meetingId,
  onClose,
  onChanged,
}: {
  meetingId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setDetail(await apiFetch<Detail>(`/api/admin/meetings/${meetingId}`));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat detail.");
    }
  }, [meetingId]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(async () => {
    await load();
    onChanged();
  }, [load, onChanged]);

  async function patch(body: object) {
    setBusy(true);
    setError("");
    try {
      await apiFetch(`/api/admin/meetings/${meetingId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan.");
    } finally {
      setBusy(false);
    }
  }

  async function setStudentStatus(studentId: string, status: AttendanceStatus) {
    setError("");
    try {
      await apiFetch("/api/admin/attendance", {
        method: "PUT",
        body: JSON.stringify({ meeting_id: meetingId, student_id: studentId, status }),
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengubah absensi.");
    }
  }

  async function removeAttendance(id: string) {
    if (!window.confirm("Hapus data absensi ini?")) return;
    setError("");
    try {
      await apiFetch(`/api/admin/attendance?id=${id}`, { method: "DELETE" });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menghapus.");
    }
  }

  const stats = { hadir: 0, izin: 0, sakit: 0, alpa: 0, belum: 0 };
  detail?.students.forEach((s) => {
    if (s.attendance) stats[s.attendance.status] += 1;
    else stats.belum += 1;
  });

  const m = detail?.meeting;

  return (
    <>
      <Modal
        title={m ? `Pertemuan ${m.meeting_number}` : "Detail Pertemuan"}
        onClose={onClose}
        wide
      >
        {!m ? (
          error ? (
            <p className="flex items-start gap-2 text-sm text-rose-600">
              <AlertCircle size={16} className="mt-0.5" /> {error}
            </p>
          ) : (
            <div className="flex justify-center py-10 text-slate-400">
              <Loader2 className="animate-spin" />
            </div>
          )
        ) : (
          <div className="space-y-6">
            {/* Aksi sesi */}
            <div className="flex flex-wrap items-center gap-2">
              <MeetingBadge status={m.status} />
              <div className="ml-auto flex flex-wrap gap-2">
                {m.status === "dibuka" ? (
                  <button
                    className="btn-dark !py-2"
                    disabled={busy}
                    onClick={() => patch({ action: "close" })}
                  >
                    <DoorClosed size={16} /> Tutup Absensi
                  </button>
                ) : (
                  <button
                    className="btn-primary !py-2"
                    disabled={busy}
                    onClick={() => patch({ action: "open" })}
                  >
                    <DoorOpen size={16} /> Buka Absensi
                  </button>
                )}
                <button className="btn-ghost !py-2" onClick={() => setEditing(true)}>
                  <Pencil size={15} /> Edit Pertemuan
                </button>
              </div>
            </div>

            {error && (
              <p className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {error}
              </p>
            )}

            {/* Statistik */}
            <div className="grid grid-cols-5 gap-2 text-center">
              {(
                [
                  ["Hadir", stats.hadir, "text-emerald-600"],
                  ["Izin", stats.izin, "text-sky-600"],
                  ["Sakit", stats.sakit, "text-amber-600"],
                  ["Alpa", stats.alpa, "text-rose-600"],
                  ["Belum", stats.belum, "text-slate-500"],
                ] as const
              ).map(([label, value, tone]) => (
                <div key={label} className="rounded-xl bg-slate-50 px-1 py-3">
                  <p className={`text-xl font-extrabold ${tone}`}>{value}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            {/* QR */}
            <section>
              <h3 className="mb-3 text-sm font-bold text-navy">QR Code</h3>
              <QrPanel
                meeting={m}
                onRegenerate={() => patch({ action: "regenerate_qr" })}
              />
            </section>

            {/* Daftar mahasiswa */}
            <section>
              <h3 className="mb-3 text-sm font-bold text-navy">
                Daftar Mahasiswa
              </h3>
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {detail.students.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-navy">
                        {s.name}
                      </p>
                      <p className="font-mono text-xs text-slate-500">
                        {s.npm}
                        {s.attendance && (
                          <span className="ml-2 font-sans">
                            · {formatDateTimeWIB(s.attendance.attendance_time)}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.attendance ? (
                        <AttendanceBadge status={s.attendance.status} />
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">
                          Belum absen
                        </span>
                      )}
                      <select
                        aria-label={`Ubah status ${s.name}`}
                        className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
                        value=""
                        onChange={(e) => {
                          if (e.target.value)
                            setStudentStatus(s.id, e.target.value as AttendanceStatus);
                        }}
                      >
                        <option value="">Ubah…</option>
                        {ATTENDANCE_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {ATTENDANCE_LABEL[st]}
                          </option>
                        ))}
                      </select>
                      {s.attendance && (
                        <button
                          aria-label={`Hapus absensi ${s.name}`}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          onClick={() => removeAttendance(s.attendance!.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </Modal>

      {editing && m && (
        <EditMeetingDialog
          meeting={m}
          onClose={() => setEditing(false)}
          onSaved={refresh}
        />
      )}
    </>
  );
}
