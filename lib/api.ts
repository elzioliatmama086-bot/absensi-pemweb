import { NextResponse } from "next/server";
import { isAdmin } from "./auth";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function fail(message: string, status = 400) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

/** Mengembalikan response 401 bila bukan admin, atau null bila lolos. */
export function requireAdmin() {
  return isAdmin() ? null : fail("Tidak diizinkan. Silakan login sebagai admin.", 401);
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "Terjadi kesalahan pada server";
}
