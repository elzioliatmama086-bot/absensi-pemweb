import { getAdminClient } from "@/lib/supabase";
import { errorMessage, fail, ok, requireAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Daftar 16 pertemuan beserta jumlah absensi per status. */
export async function GET() {
  const denied = requireAdmin();
  if (denied) return denied;

  try {
    const db = getAdminClient();
    const [{ data: meetings, error: e1 }, { data: rows, error: e2 }] =
      await Promise.all([
        db.from("meetings").select("*").order("meeting_number"),
        db.from("attendance").select("meeting_id, status"),
      ]);
    if (e1) throw e1;
    if (e2) throw e2;

    const counts: Record<string, Record<string, number>> = {};
    for (const r of rows ?? []) {
      counts[r.meeting_id] ??= { hadir: 0, izin: 0, sakit: 0, alpa: 0 };
      counts[r.meeting_id][r.status] += 1;
    }

    return ok({
      meetings: (meetings ?? []).map((m) => ({
        ...m,
        counts: counts[m.id] ?? { hadir: 0, izin: 0, sakit: 0, alpa: 0 },
      })),
    });
  } catch (e) {
    return fail(errorMessage(e), 500);
  }
}
