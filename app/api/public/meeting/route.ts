import { getAdminClient } from "@/lib/supabase";
import { errorMessage, fail, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

const PUBLIC_COLUMNS =
  "id, meeting_number, date, day, start_time, end_time, description, status";

/**
 * GET /api/public/meeting?meeting=5
 * Tanpa parameter: mengembalikan pertemuan yang sedang dibuka (jika ada).
 * Menyertakan daftar mahasiswa beserta penanda sudah/belum absen
 * (status absensi orang lain tidak dibuka ke publik).
 */
export async function GET(req: Request) {
  try {
    const db = getAdminClient();
    const param = new URL(req.url).searchParams.get("meeting");

    let query = db.from("meetings").select(PUBLIC_COLUMNS);
    if (param) {
      const n = Number(param);
      if (!Number.isInteger(n)) return fail("Nomor pertemuan tidak valid.");
      query = query.eq("meeting_number", n);
    } else {
      query = query.eq("status", "dibuka");
    }

    const { data: meeting, error } = await query.maybeSingle();
    if (error) throw error;
    if (!meeting) {
      return ok({ meeting: null, students: [] });
    }

    const [{ data: students, error: e1 }, { data: done, error: e2 }] =
      await Promise.all([
        db.from("students").select("id, npm, name").order("name"),
        db.from("attendance").select("student_id").eq("meeting_id", meeting.id),
      ]);
    if (e1) throw e1;
    if (e2) throw e2;

    const attended = new Set((done ?? []).map((d) => d.student_id));
    return ok({
      meeting,
      students: (students ?? []).map((s) => ({
        ...s,
        attended: attended.has(s.id),
      })),
    });
  } catch (e) {
    return fail(errorMessage(e), 500);
  }
}
