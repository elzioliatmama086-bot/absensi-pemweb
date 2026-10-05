"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import type { Meeting } from "@/lib/types";
import { apiFetch } from "@/lib/client";
import PageHeader from "@/components/PageHeader";
import QrPanel from "@/components/QrPanel";

export default function QrPage() {
  const [meetings, setMeetings] = useState<Meeting[] | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const d = await apiFetch<{ meetings: Meeting[] }>("/api/admin/meetings");
      setMeetings(d.meetings);
      setSelectedId((cur) => {
        if (cur) return cur;
        const active = d.meetings.find((m) => m.status === "dibuka");
        return (active ?? d.meetings[0])?.id ?? "";
      });
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat pertemuan.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const meeting = meetings?.find((m) => m.id === selectedId);

  async function regenerate() {
    if (!meeting) return;
    await apiFetch(`/api/admin/meetings/${meeting.id}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "regenerate_qr" }),
    });
    await load();
  }

  return (
    <>
      <PageHeader
        title="QR Code"
        subtitle="Setiap pertemuan punya QR Code sendiri yang mengarah ke halaman absensinya."
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
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <div className="card max-h-[70vh] overflow-y-auto p-2">
            {meetings.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                  m.id === selectedId
                    ? "bg-navy text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>
                  <span className="font-mono font-bold">
                    {String(m.meeting_number).padStart(2, "0")}
                  </span>{" "}
                  <span className="truncate">{m.description || "—"}</span>
                </span>
                {m.status === "dibuka" && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-cyan-400" />
                )}
              </button>
            ))}
          </div>

          <div className="card p-5">
            {meeting ? (
              <QrPanel meeting={meeting} onRegenerate={regenerate} />
            ) : (
              <p className="text-sm text-slate-500">Pilih pertemuan.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
