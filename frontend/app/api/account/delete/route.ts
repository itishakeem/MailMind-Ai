import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // emails has ON DELETE RESTRICT — must be deleted before the auth user
  const { error: emailsError } = await admin
    .from("emails")
    .delete()
    .eq("user_id", user.id);

  if (emailsError) {
    return NextResponse.json({ error: "Failed to delete account data" }, { status: 500 });
  }

  // Deleting auth user cascades to: public.users → clients, documents
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
