import type { AttendanceStatus, MeetingStatus } from "@/lib/types";
import { ATTENDANCE_LABEL, MEETING_STATUS_LABEL } from "@/lib/format";

const MEETING_STYLE: Record<MeetingStatus, string> = {
  belum_dibuka: "bg-slate-100 text-slate-600 ring-slate-200",
  dibuka: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  selesai: "bg-navy text-slate-100 ring-navy",
};

export function MeetingBadge({ status }: { status: MeetingStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${MEETING_STYLE[status]}`}
    >
      {status === "dibuka" && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-500 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-500" />
        </span>
      )}
      {MEETING_STATUS_LABEL[status]}
    </span>
  );
}

const ATTENDANCE_STYLE: Record<AttendanceStatus, string> = {
  hadir: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  izin: "bg-sky-50 text-sky-700 ring-sky-200",
  sakit: "bg-amber-50 text-amber-700 ring-amber-200",
  alpa: "bg-rose-50 text-rose-700 ring-rose-200",
};

export function AttendanceBadge({ status }: { status: AttendanceStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${ATTENDANCE_STYLE[status]}`}
    >
      {ATTENDANCE_LABEL[status]}
    </span>
  );
}
