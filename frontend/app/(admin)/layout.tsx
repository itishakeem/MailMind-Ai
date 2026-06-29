import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { canAccess, type UserRole } from "@/types";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, name, email, role")
    .eq("id", user.id)
    .single();

  const role = (profile?.role ?? "user") as UserRole;

  // Any role with access >= support can enter the admin panel
  if (!profile || !canAccess(role, "support")) {
    redirect("/dashboard");
  }

  return (
    <AdminShell
      adminId={profile.id}
      adminName={profile.name}
      adminEmail={profile.email}
      adminRole={role}
    >
      {children}
    </AdminShell>
  );
}
