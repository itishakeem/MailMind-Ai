import { type SupabaseClient } from "@supabase/supabase-js";
import { assertPlanLimit, PlanLimitReachedError } from "@/lib/plan-limits";
import { sendGmail, GmailSendError } from "@/lib/gmail/send";
import { generatePDFReport, type ReportPeriod } from "@/lib/agent/report";
import type { AgentActionResultResponse, AgentReportResponse } from "@/lib/agent/types";
import type { EmailType } from "@/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function handleAddClient(
  supabase: SupabaseClient,
  userId: string,
  args: { name: string; email: string; company?: string; phone?: string }
): Promise<AgentActionResultResponse> {
  const name    = args.name?.trim();
  const email   = args.email?.trim().toLowerCase();
  const company = args.company?.trim() || null;
  const phone   = args.phone?.trim()   || null;

  if (!name || name.length > 200) {
    return { type: "action_result", content: "I need a valid client name (up to 200 characters) to add them.", success: false };
  }
  if (!email || !EMAIL_RE.test(email)) {
    return { type: "action_result", content: "I need a valid email address to add this client.", success: false };
  }

  try {
    await assertPlanLimit(supabase, userId, "client_create");
  } catch (err) {
    if (err instanceof PlanLimitReachedError) {
      return { type: "action_result", content: "You've reached your client limit. Upgrade to Pro to add more.", success: false };
    }
    return { type: "action_result", content: "Couldn't check your plan limits. Please try again.", success: false };
  }

  const { error } = await supabase
    .from("clients")
    .insert({ user_id: userId, name, email, company, phone });

  if (error) {
    if (error.code === "23505") {
      return { type: "action_result", content: `A client with email ${email} already exists.`, success: false };
    }
    return { type: "action_result", content: "Failed to add the client. Please try again.", success: false };
  }

  const extra = [company, phone].filter(Boolean).join(" · ");
  return {
    type: "action_result",
    content: `Added ${name} (${email})${extra ? ` — ${extra}` : ""} to your clients. ✓`,
    success: true,
  };
}

export async function handleUpdateClient(
  supabase: SupabaseClient,
  userId: string,
  clientId: string,
  updates: { name?: string; email?: string; company?: string; phone?: string }
): Promise<AgentActionResultResponse> {
  if (updates.email && !EMAIL_RE.test(updates.email.trim())) {
    return { type: "action_result", content: "The new email address doesn't look valid.", success: false };
  }

  const patch: Record<string, string> = { updated_at: new Date().toISOString() };
  if (updates.name)    patch.name    = updates.name.trim();
  if (updates.email)   patch.email   = updates.email.trim().toLowerCase();
  if (updates.company) patch.company = updates.company.trim();
  if (updates.phone)   patch.phone   = updates.phone.trim();

  const { data: client } = await supabase
    .from("clients")
    .select("name")
    .eq("id", clientId)
    .eq("user_id", userId)
    .single();

  const { error } = await supabase
    .from("clients")
    .update(patch)
    .eq("id", clientId)
    .eq("user_id", userId);

  if (error) {
    if (error.code === "23505") {
      return { type: "action_result", content: `A client with email ${updates.email} already exists.`, success: false };
    }
    return { type: "action_result", content: "Couldn't update the client. Please try again.", success: false };
  }

  const displayName = client?.name ?? "The client";
  const fields = Object.keys(updates).join(", ");
  return {
    type: "action_result",
    content: `Updated ${displayName}'s ${fields}. ✓`,
    success: true,
  };
}

export async function handleRemoveClient(
  supabase: SupabaseClient,
  userId: string,
  clientId: string
): Promise<AgentActionResultResponse> {
  const { data: client } = await supabase
    .from("clients")
    .select("name")
    .eq("id", clientId)
    .eq("user_id", userId)
    .single();

  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId)
    .eq("user_id", userId);

  if (error) {
    return { type: "action_result", content: "Couldn't remove the client. Please try again.", success: false };
  }

  return {
    type: "action_result",
    content: `${client?.name ?? "The client"} has been removed from your clients. ✓`,
    success: true,
  };
}

export async function handleSendEmail(
  supabase: SupabaseClient,
  userId: string,
  client: { id: string; name: string; email: string },
  draft: { subject: string; body: string; emailType?: EmailType | null; tone?: string }
): Promise<AgentActionResultResponse> {
  let messageId: string;
  try {
    const result = await sendGmail(userId, client.email, draft.subject, draft.body, {
      emailType: draft.emailType ?? null,
    });
    messageId = result.messageId;
  } catch (err) {
    if (err instanceof GmailSendError) {
      return { type: "action_result", content: `Gmail send failed — ${err.message}`, success: false };
    }
    return { type: "action_result", content: "Failed to send the email. Please try again.", success: false };
  }

  await supabase.from("emails").insert({
    user_id: userId,
    client_id: client.id,
    client_snapshot: { name: client.name, email: client.email },
    subject: draft.subject,
    body: draft.body,
    ai_detected_type: draft.emailType ?? "manual",
    tone: draft.tone ?? "friendly",
    status: "sent",
    sent_at: new Date().toISOString(),
    gmail_message_id: messageId,
  });

  return {
    type: "action_result",
    content: `Email sent to ${client.name}. ✓`,
    success: true,
  };
}

export async function handleScheduleEmail(
  supabase: SupabaseClient,
  userId: string,
  client: { id: string; name: string; email: string },
  draft: { subject: string; body: string; emailType?: EmailType | null; tone?: string },
  scheduledAt: string
): Promise<AgentActionResultResponse> {
  const { error } = await supabase.from("emails").insert({
    user_id: userId,
    client_id: client.id,
    client_snapshot: { name: client.name, email: client.email },
    subject: draft.subject,
    body: draft.body,
    ai_detected_type: draft.emailType ?? "manual",
    tone: draft.tone ?? "friendly",
    status: "scheduled",
    scheduled_at: scheduledAt,
  });

  if (error) {
    return { type: "action_result", content: "Couldn't schedule the email. Please try again.", success: false };
  }

  const dateStr = new Date(scheduledAt).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });
  return {
    type: "action_result",
    content: `Email to ${client.name} scheduled for ${dateStr}. ✓`,
    success: true,
  };
}

export async function handleRescheduleEmail(
  supabase: SupabaseClient,
  userId: string,
  emailId: string,
  newScheduledAt: string
): Promise<AgentActionResultResponse> {
  const newDate = new Date(newScheduledAt);
  if (isNaN(newDate.getTime()) || newDate <= new Date(Date.now() + 60 * 1000)) {
    return { type: "action_result", content: "The new time must be at least 1 minute in the future.", success: false };
  }

  const { data: email } = await supabase
    .from("emails")
    .select("subject")
    .eq("id", emailId)
    .eq("user_id", userId)
    .single();

  const { error } = await supabase
    .from("emails")
    .update({ scheduled_at: newDate.toISOString() })
    .eq("id", emailId)
    .eq("user_id", userId)
    .eq("status", "scheduled");

  if (error) {
    return { type: "action_result", content: "Couldn't reschedule the email. Please try again.", success: false };
  }

  const dateStr = newDate.toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });
  return {
    type: "action_result",
    content: `"${email?.subject ?? "Email"}" rescheduled to ${dateStr}. ✓`,
    success: true,
  };
}

export async function handleCancelScheduledEmail(
  supabase: SupabaseClient,
  userId: string,
  emailId: string
): Promise<AgentActionResultResponse> {
  const { data: email } = await supabase
    .from("emails")
    .select("subject")
    .eq("id", emailId)
    .eq("user_id", userId)
    .single();

  const { error } = await supabase
    .from("emails")
    .update({ status: "cancelled" })
    .eq("id", emailId)
    .eq("user_id", userId)
    .eq("status", "scheduled");

  if (error) {
    return { type: "action_result", content: "Couldn't cancel the email. Please try again.", success: false };
  }

  return {
    type: "action_result",
    content: `"${email?.subject ?? "Email"}" cancelled. ✓`,
    success: true,
  };
}

export async function handleGenerateReport(
  supabase: SupabaseClient,
  userId: string,
  period: ReportPeriod,
  userName: string | null
): Promise<AgentReportResponse | AgentActionResultResponse> {
  try {
    const pdfBytes = await generatePDFReport(supabase, userId, period, userName);
    const base64   = Buffer.from(pdfBytes).toString("base64");
    const labels   = { "24h": "24-Hour", "7d": "7-Day", "30d": "30-Day" };
    const filename = `mailmind-${period}-report.pdf`;
    return {
      type: "report",
      content: `Your ${labels[period]} report is ready! Click below to download it.`,
      pdf: { base64, filename },
    };
  } catch {
    return {
      type: "action_result",
      content: "Couldn't generate the report. Please try again in a moment.",
      success: false,
    };
  }
}
