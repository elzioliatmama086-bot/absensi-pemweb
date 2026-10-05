import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "admin_session";

function sessionToken(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return createHmac("sha256", password).update("absensi-admin-session-v1").digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function verifyPassword(input: string): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password || !input) return false;
  return safeEqual(input, password);
}

export function createSessionValue(): string | null {
  return sessionToken();
}

/** True jika request membawa cookie sesi admin yang valid. */
export function isAdmin(): boolean {
  const expected = sessionToken();
  if (!expected) return false;
  const value = cookies().get(ADMIN_COOKIE)?.value;
  return !!value && safeEqual(value, expected);
}
