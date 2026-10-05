export type MeetingStatus = "belum_dibuka" | "dibuka" | "selesai";
export type AttendanceStatus = "hadir" | "izin" | "sakit" | "alpa";

export const ATTENDANCE_STATUSES: AttendanceStatus[] = [
  "hadir",
  "izin",
  "sakit",
  "alpa",
];

export interface Student {
  id: string;
  npm: string;
  name: string;
  created_at: string;
}

export interface Meeting {
  id: string;
  meeting_number: number;
  date: string; // YYYY-MM-DD
  day: string;
  start_time: string; // HH:MM:SS
  end_time: string;
  description: string;
  status: MeetingStatus;
  qr_token: string;
  created_at: string;
  updated_at: string;
}

/** Versi aman untuk publik (tanpa qr_token). */
export type PublicMeeting = Omit<Meeting, "qr_token">;

export interface AttendanceRecord {
  id: string;
  meeting_id: string;
  student_id: string;
  status: AttendanceStatus;
  attendance_time: string;
  created_at: string;
}

export interface AttendanceRow extends AttendanceRecord {
  students: { name: string; npm: string } | null;
  meetings: { meeting_number: number; date: string } | null;
}
