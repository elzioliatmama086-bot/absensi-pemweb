import { getAdminClient } from "@/lib/supabase";
import { errorMessage, fail, ok, requireAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = requireAdmin();
  if (denied) return denied;

  try {
    const db = getAdminClient();
    const [students, meetings, attendance, active] = await Promise.all([
      db.from("students").select("id", { count: "exact", head: true }),
      db.from("meetings").select("id", { count: "exact", head: true }),
      db.from("attendance").select("status"),
      db
        .from("meetings")
        .select("id, meeting_number, date, description")
        .eq("status", "dibuka")
        .maybeSingle(),
    ]);
    if (students.error) throw students.error;
    if (meetings.error) throw meetings.error;
    if (attendance.error) throw attendance.error;

    const totals = { hadir: 0, izin: 0, sakit: 0, alpa: 0 };
    for (const r of attendance.data ?? []) {
      totals[r.status as keyof typeof totals] += 1;
    }

    return ok({
      total_students: students.count ?? 0,
      total_meetings: meetings.count ?? 0,
      totals,
      active_meeting: active.data ?? null,
    });
  } catch (e) {
    return fail(errorMessage(e), 500);
  }
}
