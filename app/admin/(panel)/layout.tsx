import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import AdminShell from "@/components/AdminShell";

export const dynamic = "force-dynamic";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  if (!isAdmin()) redirect("/admin/login");
  return <AdminShell>{children}</AdminShell>;
}
