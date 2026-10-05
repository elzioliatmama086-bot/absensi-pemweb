import { getAdminClient } from "@/lib/supabase";
import { errorMessage, fail, ok, requireAdmin } from "@/lib/api";
import { dayNameFromDate } from "@/lib/format";

export const dynamic = "force-dynamic";

function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return t.toISOString().slice(0, 10);
}

/**
 * POST { start_date: "YYYY-MM-DD" } — susun ulang tanggal 16 pertemuan
 * mengikuti pola Senin & Kamis mulai dari tanggal pertama (harus Senin/Kamis).
 * Setelah itu admin tetap bebas mengubah tiap tanggal secara manual.
 */
export async function POST(req: Request) {
  const denied = requireAdmin();
  if (denied) return denied;

  try {
    const { start_date } = (await req.json().catch(() => ({}))) as {
      start_date?: string;
    };
    if (!start_date || !/^\d{4}-\d{2}-\d{2}$/.test(start_date)) {
      return fail("Tanggal mulai tidak valid.");
    }
    const firstDay = dayNameFromDate(start_date);
    if (firstDay !== "Senin" && firstDay !== "Kamis") {
      return fail("Tanggal pertemuan pertama harus hari Senin atau Kamis.");
    }

    // Senin -> +3 -> Kamis -> +4 -> Senin, dst.
    const dates: string[] = [];
    let current = start_date;
    for (let i = 0; i < 16; i++) {
      dates.push(current);
      current = addDays(current, dayNameFromDate(current) === "Senin" ? 3 : 4);
    }

    const db = getAdminClient();
    for (let i = 0; i < 16; i++) {
      const { error } = await db
        .from("meetings")
        .update({ date: dates[i], day: dayNameFromDate(dates[i]) })
        .eq("meeting_number", i + 1);
      if (error) throw error;
    }
    return ok({ dates });
  } catch (e) {
    return fail(errorMessage(e), 500);
  }
}
