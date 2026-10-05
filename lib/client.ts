/** Helper fetch untuk komponen client (dashboard admin). */
export async function apiFetch<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = "/admin/login";
  }
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Permintaan gagal.");
  return data as T;
}

export function getBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (env) return env;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export function isLocalUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      /^(10|192\.168|172\.(1[6-9]|2\d|3[01]))\./.test(hostname)
    );
  } catch {
    return false;
  }
}

/** URL halaman absensi untuk QR Code satu pertemuan. */
export function attendanceUrl(meetingNumber: number, token: string): string {
  return `${getBaseUrl()}/attendance?meeting=${meetingNumber}&t=${token}`;
}
