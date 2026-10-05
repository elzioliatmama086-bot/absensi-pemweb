import { getAdminClient } from "@/lib/supabase";
import { errorMessage, fail, ok } from "@/lib/api";
import { ATTENDANCE_STATUSES, type AttendanceStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Body {
  meeting_number?: number;
  student_id?: string;
  status?: string;
  token?: string;
}

/**
 * POST /api/attendance — mahasiswa mengirim absensi.
 * Aturan:
 *  - sesi harus berstatus "dibuka"
 *  - satu mahasiswa hanya satu absensi per pertemuan (unique constraint)
 *  - tidak ada update lewat jalur publik (hanya admin yang boleh mengubah)
 *  - waktu absensi diisi oleh database (default now())
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const { meeting_number, student_id, status, token } = body;

    if (!Number.isInteger(meeting_number) || !student_id || !status) {
      return fail("Data absensi tidak lengkap.");
    }
    if (!ATTENDANCE_STATUSES.includes(status as AttendanceStatus)) {
      return fail("Status absensi tidak valid.");
    }

    const db = getAdminClient();

    const { data: meeting, error: me } = await db
      .from("meetings")
      .select("id, meeting_number, status, qr_token")
      .eq("meeting_number", meeting_number)
      .maybeSingle();
    if (me) throw me;
    if (!meeting) return fail("Pertemuan tidak ditemukan.", 404);

    // Jika QR membawa token, token harus cocok (QR lama tidak berlaku setelah regenerate).
    if (token && token !== meeting.qr_token) {
      return fail("QR Code sudah tidak berlaku. Silakan scan QR terbaru.", 403);
    }
    if (meeting.status !== "dibuka") {
      return fail("Absensi untuk pertemuan ini sedang ditutup.", 403);
    }

    const { data: student, error: se } = await db
      .from("students")
      .select("id, name, npm")
      .eq("id", student_id)
      .maybeSingle();
    if (se) throw se;
    if (!student) return fail("Mahasiswa tidak ditemukan.", 404);

    const { data: record, error: ie } = await db
      .from("attendance")
      .insert({ meeting_id: meeting.id, student_id: student.id, status })
      .select("status, attendance_time")
      .single();

    if (ie) {
      if (ie.code === "23505") {
        return fail("Kamu sudah melakukan absensi untuk pertemuan ini.", 409);
      }
      throw ie;
    }

    return ok(
      {
        student: { name: student.name, npm: student.npm },
        meeting_number: meeting.meeting_number,
        status: record.status,
        attendance_time: record.attendance_time,
      },
      201
    );
  } catch (e) {
    return fail(errorMessage(e), 500);
  }
}
