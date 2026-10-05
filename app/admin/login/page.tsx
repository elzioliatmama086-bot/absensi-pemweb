"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Loader2, Lock, Terminal } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login gagal.");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Koneksi bermasalah. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid-bg flex min-h-screen items-center justify-center bg-navy px-5 py-10">
      <div className="w-full max-w-sm animate-rise">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-white"
        >
          <ArrowLeft size={16} /> Beranda
        </Link>
        <form onSubmit={onSubmit} className="rounded-2xl bg-white p-6 shadow-2xl shadow-black/30">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-cyan-400">
            <Terminal size={20} />
          </span>
          <h1 className="mt-4 text-xl font-extrabold text-navy">Masuk Dosen</h1>
          <p className="mt-1 text-sm text-slate-500">
            Dashboard absensi Pemrograman Web.
          </p>

          <label className="label mt-6" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <Lock
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              id="password"
              type="password"
              className="input !pl-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password admin"
              autoComplete="current-password"
              autoFocus
              required
            />
          </div>

          {error && (
            <p className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary mt-5 w-full">
            {loading && <Loader2 size={16} className="animate-spin" />}
            Masuk
          </button>
        </form>
      </div>
    </main>
  );
}
