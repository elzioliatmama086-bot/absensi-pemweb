"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  QrCode,
  Settings,
  Terminal,
  X,
  type LucideIcon,
} from "lucide-react";

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/pertemuan", label: "Pertemuan", icon: CalendarDays },
  { href: "/admin/absensi", label: "Data Absensi", icon: ClipboardList },
  { href: "/admin/qr", label: "QR Code", icon: QrCode },
  { href: "/admin/pengaturan", label: "Pengaturan", icon: Settings },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const sidebar = (
    <div className="flex h-full flex-col bg-navy text-slate-300">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400">
          <Terminal size={18} />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-bold text-white">WebProg.absen</p>
          <p className="text-[11px] text-slate-500">Dashboard Dosen</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-ink text-white shadow-[inset_2px_0_0_#06B6D4]"
                  : "hover:bg-ink/60 hover:text-white"
              }`}
            >
              <Icon size={17} className={active ? "text-cyan-400" : ""} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition hover:bg-ink/60 hover:text-white"
        >
          <LogOut size={17} /> Keluar
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 lg:block">
        {sidebar}
      </aside>

      {/* Topbar mobile */}
      <div className="sticky top-0 z-30 flex items-center justify-between bg-navy px-4 py-3 text-white lg:hidden">
        <div className="flex items-center gap-2">
          <Terminal size={18} className="text-cyan-400" />
          <span className="text-sm font-bold">WebProg.absen</span>
        </div>
        <button onClick={() => setOpen(true)} aria-label="Buka menu" className="p-1">
          <Menu size={22} />
        </button>
      </div>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-navy/60"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 animate-rise">
            <button
              onClick={() => setOpen(false)}
              aria-label="Tutup menu"
              className="absolute right-3 top-4 z-10 text-slate-400"
            >
              <X size={20} />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
