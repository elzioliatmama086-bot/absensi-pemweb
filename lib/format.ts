import type { AttendanceStatus, MeetingStatus } from "./types";

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

/** Nama hari (Indonesia) dari string YYYY-MM-DD, tanpa pengaruh zona waktu. */
export function dayNameFromDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

/** 2026-10-05 -> 05/10/2026 */
export function formatDateShort(date: string): string {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

/** 2026-10-05 -> 5 Oktober 2026 */
export function formatDateLong(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** 13:00:00 -> 13.00 */
export function formatTime(time: string): string {
  return time.slice(0, 5).replace(":", ".");
}

export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)}–${formatTime(end)} WIB`;
}

/** Waktu absensi dari database, ditampilkan dalam WIB. */
export function formatDateTimeWIB(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .format(new Date(iso))
    .replace(/\./g, ":")
    .replace(",", "");
}

export const MEETING_STATUS_LABEL: Record<MeetingStatus, string> = {
  belum_dibuka: "Belum Dibuka",
  dibuka: "Dibuka",
  selesai: "Selesai",
};

export const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  hadir: "Hadir",
  izin: "Izin",
  sakit: "Sakit",
  alpa: "Alpa",
};
