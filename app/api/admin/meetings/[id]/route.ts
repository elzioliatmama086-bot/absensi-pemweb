import { randomBytes } from "crypto";
import { getAdminClient } from "@/lib/supabase";
import { errorMessage, fail, ok, requireAdmin } from "@/lib/api";
import { dayNameFromDate } from "@/lib/format";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

/** Detail pertemuan + daftar mahasiswa dengan status absensinya. */
export async function GET(_req: Request, { params }: Ctx) {
  const denied = requireAdmin();
  if (denied) return denied;

  try {
    const db = getAdminClient();
    const { data: meeting, error } = await db
      .from("meetings")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();
    if (error) throw error;
    if (!meeting) return fail("Pertemuan tidak ditemukan.", 404);

    const [{ data: students, error: e1 }, { data: rows, error: e2 }] =
      await Promise.all([
        db.from("students").select("id, npm, name").order("name"),
        db
          .from("attendance")
          .select("id, student_id, status, attendance_time")
          .eq("meeting_id", meeting.id),
      ]);
    if (e1) throw e1;
    if (e2) throw e2;

    const byStudent = new Map((rows ?? []).map((r) => [r.student_id, r]));
    return ok({
      meeting,
      students: (students ?? []).map((s) => ({
        ...s,
        attendance: byStudent.get(s.id) ?? null,
      })),
    });
  } catch (e) {
    return fail(errorMessage(e), 500);
  }
}

interface PatchBody {
  action?: "open" | "close" | "regenerate_qr";
  date?: string;
  start_time?: string;
  end_time?: string;
  description?: string;
  status?: "belum_dibuka" | "dibuka" | "selesai";
}

/**
 * Edit pertemuan (tanggal, jam, keterangan, status) dan aksi sesi:
 *  - open: buka absensi (pertemuan lain yang sedang dibuka otomatis ditutup)
 *  - close: tutup absensi (status menjadi selesai)
 *  - regenerate_qr: buat token QR baru
 */
export async function PATCH(req: Request, { params }: Ctx) {
  const denied = requireAdmin();
  if (denied) return denied;

  try {
    const body = (await req.json().catch(() => ({}))) as PatchBody;
    const db = getAdminClient();
    const update: Record<string, string> = {};

    if (body.date !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) return fail("Format tanggal tidak valid.");
      update.date = body.date;
      update.day = dayNameFromDate(body.date);
    }
    for (const key of ["start_time", "end_time"] as const) {
      const v = body[key];
      if (v !== undefined) {
        if (!/^\d{2}:\d{2}(:\d{2})?$/.test(v)) return fail("Format jam tidak valid.");
        update[key] = v.slice(0, 5);
      }
    }
    if (body.description !== undefined) {
      update.description = body.description.trim().slice(0, 200);
    }

    let nextStatus = body.status;
    if (body.action === "open") nextStatus = "dibuka";
    if (body.action === "close") nextStatus = "selesai";
    if (nextStatus !== undefined) {
      if (!["belum_dibuka", "dibuka", "selesai"].includes(nextStatus)) {
        return fail("Status tidak valid.");
      }
      update.status = nextStatus;
    }
    if (body.action === "regenerate_qr") {
      update.qr_token = randomBytes(12).toString("hex");
    }

    if (Object.keys(update).length === 0) return fail("Tidak ada perubahan.");

    if (
      update.start_time &&
      update.end_time &&
      update.start_time >= update.end_time
    ) {
      return fail("Jam selesai harus setelah jam mulai.");
    }

    // Hanya satu sesi aktif: tutup sesi lain yang sedang dibuka lebih dulu.
    if (update.status === "dibuka") {
      const { error: ce } = await db
        .from("meetings")
        .update({ status: "selesai" })
        .eq("status", "dibuka")
        .neq("id", params.id);
      if (ce) throw ce;
    }

    const { data, error } = await db
      .from("meetings")
      .update(update)
      .eq("id", params.id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    if (!data) return fail("Pertemuan tidak ditemukan.", 404);

    return ok({ meeting: data });
  } catch (e) {
    return fail(errorMessage(e), 500);
  }
}
