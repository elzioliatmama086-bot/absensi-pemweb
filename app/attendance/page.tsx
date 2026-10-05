import { Suspense } from "react";
import AttendanceFlow from "./AttendanceFlow";

export const dynamic = "force-dynamic";

export default function AttendancePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center text-sm text-slate-500">
          Memuat…
        </main>
      }
    >
      <AttendanceFlow />
    </Suspense>
  );
}
