import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import type { User } from "@/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, name, email, plan, gmail_email, gmail_token, email_signature, created_at")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/auth/login");
  }

  const appUser: User = {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    plan: profile.plan,
    gmail_email: profile.gmail_email,
    gmail_connected: !!profile.gmail_token,
    email_signature: profile.email_signature,
    created_at: profile.created_at,
  };

  return <DashboardShell user={appUser}>{children}</DashboardShell>;
}
