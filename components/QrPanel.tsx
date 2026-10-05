"use client";

import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  Loader2,
  RefreshCw,
} from "lucide-react";
import type { Meeting } from "@/lib/types";
import { attendanceUrl, getBaseUrl, isLocalUrl } from "@/lib/client";
import {
  formatDateLong,
  formatTimeRange,
} from "@/lib/format";
import { MeetingBadge } from "./StatusBadge";

export default function QrPanel({
  meeting,
  onRegenerate,
}: {
  meeting: Meeting;
  onRegenerate: () => Promise<void>;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const url = attendanceUrl(meeting.meeting_number, meeting.qr_token);
  const local = isLocalUrl(getBaseUrl());

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard tidak tersedia */
    }
  }

  function download() {
    const svg = wrapRef.current?.querySelector("svg");
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      const size = 1024;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      const a = document.createElement("a");
      a.download = `qr-pertemuan-${meeting.meeting_number}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);
  }

  async function regenerate() {
    if (
      !window.confirm(
        "Buat QR baru? QR lama (yang sudah dicetak/dibagikan) tidak akan berlaku lagi."
      )
    )
      return;
    setBusy(true);
    try {
      await onRegenerate();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {local && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <p>
            QR ini mengarah ke alamat lokal ({getBaseUrl()}) sehingga tidak bisa dibuka
            dari HP mahasiswa. Buka dashboard dari URL Vercel, atau isi{" "}
            <code className="font-mono">NEXT_PUBLIC_SITE_URL</code>.
          </p>
        </div>
      )}

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div
          ref={wrapRef}
          className="shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft"
        >
          <QRCodeSVG value={url} size={200} level="M" fgColor="#0F172A" bgColor="#FFFFFF" />
        </div>
        <div className="min-w-0 flex-1 text-sm">
          <div className="flex items-center gap-2">
            <p className="font-mono text-xs font-semibold text-cyan-700">
              PERTEMUAN {meeting.meeting_number}
            </p>
            <MeetingBadge status={meeting.status} />
          </div>
          <p className="mt-1 font-bold text-navy">{meeting.description || "—"}</p>
          <p className="mt-1 text-xs text-slate-500">
            {meeting.day}, {formatDateLong(meeting.date)} ·{" "}
            {formatTimeRange(meeting.start_time, meeting.end_time)}
          </p>
          <p className="mt-3 break-all rounded-lg bg-slate-100 px-3 py-2 font-mono text-[11px] text-slate-600">
            {url}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn-ghost !px-3 !py-2 text-xs" onClick={copy}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Tersalin" : "Salin Link"}
            </button>
            <button className="btn-ghost !px-3 !py-2 text-xs" onClick={download}>
              <Download size={14} /> Unduh PNG
            </button>
            <button
              className="btn-ghost !px-3 !py-2 text-xs"
              onClick={regenerate}
              disabled={busy}
            >
              {busy ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              Regenerate QR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
