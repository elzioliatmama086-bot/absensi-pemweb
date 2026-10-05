"use client";

import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import type { Meeting, MeetingStatus } from "@/lib/types";
import { apiFetch } from "@/lib/client";
import { dayNameFromDate } from "@/lib/format";
import Modal from "./Modal";

export default function EditMeetingDialog({
  meeting,
  onClose,
  onSaved,
}: {
  meeting: Meeting;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [date, setDate] = useState(meeting.date);
  const [start, setStart] = useState(meeting.start_time.slice(0, 5));
  const [end, setEnd] = useState(meeting.end_time.slice(0, 5));
  const [description, setDescription] = useState(meeting.description);
  const [status, setStatus] = useState<MeetingStatus>(meeting.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiFetch(`/api/admin/meetings/${meeting.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          date,
          start_time: start,
          end_time: end,
          description,
          status,
        }),
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Edit Pertemuan ${meeting.meeting_number}`} onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="label" htmlFor="desc">
            Keterangan / Materi
          </label>
          <input
            id="desc"
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={200}
            placeholder="contoh: Praktikum CSS dan Responsive Design"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className="label" htmlFor="date">
              Tanggal
            </label>
            <input
              id="date"
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            <p className="mt-1 text-xs text-slate-500">
              Hari: {date ? dayNameFromDate(date) : "—"}
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="label" htmlFor="status">
              Status Sesi
            </label>
            <select
              id="status"
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value as MeetingStatus)}
            >
              <option value="belum_dibuka">Belum Dibuka</option>
              <option value="dibuka">Dibuka</option>
              <option value="selesai">Selesai</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="start">
              Jam Mulai
            </label>
            <input
              id="start"
              type="time"
              className="input"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="end">
              Jam Selesai
            </label>
            <input
              id="end"
              type="time"
              className="input"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              required
            />
          </div>
        </div>

        {error && (
          <p className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Batal
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving && <Loader2 size={16} className="animate-spin" />}
            Simpan
          </button>
        </div>
      </form>
    </Modal>
  );
}
