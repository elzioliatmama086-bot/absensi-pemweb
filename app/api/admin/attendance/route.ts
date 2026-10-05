import { getAdminClient } from "@/lib/supabase";
import { errorMessage, fail, ok, requireAdmin } from "@/lib/api";
import { ATTENDANCE_STATUSES, type AttendanceStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

/** GET ?meeting=<id>&status=hadir&date=YYYY-MM-DD&q=nama/npm */
export async function GET(req: Request) {
  const denied = requireAdmin();
  if (denied) return denied;

  try {
    const sp = new URL(req.url).searchParams;
    const meeting = sp.get("meeting");
    const status = sp.get("status");
    const date = sp.get("date");
    const q = (sp.get("q") ?? "").trim().toLowerCase();

    const db = getAdminClient();
    let query = db
      .from("attendance")
      .select(
        "id, meeting_id, student_id, status, attendance_time, created_at, students(name, npm), meetings!inner(meeting_number, date)"
      )
      .order("attendance_time", { ascending: false });

    if (meeting) query = query.eq("meeting_id", meeting);
    if (status) query = query.eq("status", status);
    if (date) query = query.eq("meetings.date", date);

    const { data, error } = await query;
    if (error) throw error;

    let rows = (data ?? []) as unknown as Array<{
      students: { name: string; npm: string } | null;
    }>;
    if (q) {
      rows = rows.filter(
        (r) =>
          r.students?.name.toLowerCase().includes(q) ||
          r.students?.npm.includes(q)
      );
    }
    return ok({ rows });
  } catch (e) {
    return fail(errorMessage(e), 500);
  }
}

/** PUT — admin menambah/mengubah absensi seorang mahasiswa pada suatu pertemuan. */
export async function PUT(req: Request) {
  const denied = requireAdmin();
  if (denied) return denied;

  try {
    const body = (await req.json().catch(() => ({}))) as {
      meeting_id?: string;
      student_id?: string;
      status?: string;
    };
    if (!body.meeting_id || !body.student_id || !body.status) {
      return fail("Data tidak lengkap.");
    }
    if (!ATTENDANCE_STATUSES.includes(body.status as AttendanceStatus)) {
      return fail("Status tidak valid.");
    }

    const db = getAdminClient();
    const { data, error } = await db
      .from("attendance")
      .upsert(
        {
          meeting_id: body.meeting_id,
          student_id: body.student_id,
          status: body.status,
        },
        { onConflict: "meeting_id,student_id" }
      )
      .select("id, status, attendance_time")
      .single();
    if (error) throw error;
    return ok({ attendance: data });
  } catch (e) {
    return fail(errorMessage(e), 500);
  }
}

/** DELETE ?id=<attendance id> — admin menghapus absensi. */
export async function DELETE(req: Request) {
  const denied = requireAdmin();
  if (denied) return denied;

  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return fail("ID absensi wajib diisi.");
    const { error } = await getAdminClient().from("attendance").delete().eq("id", id);
    if (error) throw error;
    return ok({ ok: true });
  } catch (e) {
    return fail(errorMessage(e), 500);
  }
}
