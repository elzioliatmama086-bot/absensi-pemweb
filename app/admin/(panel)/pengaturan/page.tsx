"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CalendarClock, CheckCircle2, Globe, Loader2, LogOut } from "lucide-react";
import { apiFetch, getBaseUrl, isLocalUrl } from "@/lib/client";
import { dayNameFromDate, formatDateShort } from "@/lib/format";
import PageHeader from "@/components/PageHeader";

export default function PengaturanPage() {
  const router = useRouter();
  const [startDate, setStartDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dates, setDates] = useState<string[] | null>(null);

  const base = getBaseUrl();

  async function applySchedule(e: React.FormEvent) {
    e.preventDefault();
    if (
      !window.confirm(
        "Tanggal semua 16 pertemuan akan disusun ulang (Senin & Kamis). Keterangan, jam, dan status tidak berubah. Lanjutkan?"
      )
    )
      return;
    setBusy(true);
    setError("");
    setDates(null);
    try {
      const d = await apiFetch<{ dates: string[] }>("/api/admin/schedule", {
        method: "POST",
        body: JSON.stringify({ start_date: startDate }),
      });
      setDates(d.dates);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyusun jadwal.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <>
      <PageHeader title="Pengaturan" subtitle="Jadwal semester dan informasi deployment." />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-navy">
            <CalendarClock size={16} className="text-cyan-600" /> Susun Jadwal Senin &amp; Kamis
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Isi tanggal pertemuan pertama (Senin atau Kamis). Sistem mengisi 16 tanggal
            otomatis. Setelah itu, setiap tanggal tetap bisa diubah manual lewat Edit
            Pertemuan, misalnya saat libur atau jadwal pengganti.
          </p>
          <form onSubmit={applySchedule} className="mt-4 space-y-3">
            <div>
              <label className="label" htmlFor="start">
                Tanggal Pertemuan 1
              </label>
              <input
                id="start"
                type="date"
                className="input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
              {startDate && (
                <p className="mt-1 text-xs text-slate-500">
                  {dayNameFromDate(startDate)}
                </p>
              )}
            </div>
            {error && (
              <p className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {error}
              </p>
            )}
            {dates && (
              <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
                <p className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 size={16} /> Jadwal diperbarui
                </p>
                <p className="mt-1 font-mono text-xs leading-relaxed">
                  {dates.map(formatDateShort).join(" · ")}
                </p>
              </div>
            )}
            <button className="btn-primary" disabled={busy || !startDate}>
              {busy && <Loader2 size={16} className="animate-spin" />}
              Terapkan Jadwal
            </button>
          </form>
        </section>

        <div className="space-y-4">
          <section className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-navy">
              <Globe size={16} className="text-cyan-600" /> URL untuk QR Code
            </h2>
            <p className="mt-2 break-all rounded-lg bg-slate-100 px-3 py-2 font-mono text-xs text-slate-700">
              {base}
            </p>
            <p
              className={`mt-2 text-xs ${isLocalUrl(base) ? "text-amber-700" : "text-emerald-700"}`}
            >
              {isLocalUrl(base)
                ? "Alamat lokal — QR tidak bisa dibuka dari HP mahasiswa. Gunakan URL Vercel."
                : "URL publik — aman dipakai untuk QR Code."}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Untuk memaksa domain tertentu, isi{" "}
              <code className="font-mono">NEXT_PUBLIC_SITE_URL</code> di Vercel.
            </p>
          </section>

          <section className="card p-5">
            <h2 className="text-sm font-bold text-navy">Sesi</h2>
            <p className="mt-1 text-sm text-slate-500">
              Keluar dari dashboard dosen di perangkat ini.
            </p>
            <button className="btn-danger mt-3" onClick={logout}>
              <LogOut size={16} /> Keluar
            </button>
          </section>
        </div>
      </div>
    </>
  );
}
