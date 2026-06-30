import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import OpenAI from "openai";
import { AGENT_TOOLS, buildSystemPrompt } from "@/lib/agent/tools";
import { fuzzyMatchClients } from "@/lib/agent/fuzzy";
import {
  handleAddClient,
  handleUpdateClient,
  handleRemoveClient,
  handleSendEmail,
  handleScheduleEmail,
  handleRescheduleEmail,
  handleCancelScheduledEmail,
  handleGenerateReport,
} from "@/lib/agent/handlers";
import { generateEmail, AIUnavailableError } from "@/lib/ai/generate";
import type { AgentChatRequest, AgentResponse } from "@/lib/agent/types";
import type { ReportPeriod } from "@/lib/agent/report";
import type { Tone } from "@/types";

const FREE_DAILY_LIMIT = 10;

// Agent always uses the free key + free-tier models — no credits required.
// The paid key (OPENROUTER_API_KEY) is reserved for email generation only.
// Free-tier Gemini 2.0 Flash supports function/tool calling and is fast enough
// for agent decisions. Pro plan gets the non-experimental variant.
function openRouter() {
  const apiKey = process.env.OPENROUTER_API_KEY_FREE ?? process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY_FREE not configured");
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://mailmindai.xyz",
      "X-Title": "MailMind AI",
    },
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("plan, name, gmail_token")
    .eq("id", user.id)
    .single();
  if (profileError || !profile) {
    return NextResponse.json({ error: "User profile not found" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as AgentChatRequest | null;
  if (!body || !Array.isArray(body.messages)) {
    return NextResponse.json({ error: "messages array is required" }, { status: 400 });
  }

  // ── Pending action resolution (no AI call, no rate-limit charge) ──────────

  if (body.pendingAction) {
    const { action, confirmed } = body.pendingAction;

    if (!confirmed) {
      return NextResponse.json({
        type: "text",
        content: "Got it, cancelled. Anything else I can help with?",
      } satisfies AgentResponse);
    }

    if (action.type === "remove_client") {
      const result = await handleRemoveClient(supabase, user.id, action.client.id);
      return NextResponse.json(result satisfies AgentResponse);
    }

    if (action.type === "update_client") {
      const result = await handleUpdateClient(supabase, user.id, action.client.id, action.updates);
      return NextResponse.json(result satisfies AgentResponse);
    }

    if (action.type === "send_email") {
      if (!profile.gmail_token) {
        return NextResponse.json({
          type: "text",
          content: "Your Gmail isn't connected. Reconnect it in Settings, then try again.",
        } satisfies AgentResponse);
      }
      const result = await handleSendEmail(supabase, user.id, action.client, action.draft);
      return NextResponse.json(result satisfies AgentResponse);
    }

    if (action.type === "schedule_email") {
      const result = await handleScheduleEmail(supabase, user.id, action.client, action.draft, action.scheduled_at);
      return NextResponse.json(result satisfies AgentResponse);
    }

    if (action.type === "reschedule_email") {
      const result = await handleRescheduleEmail(supabase, user.id, action.email.id, action.new_scheduled_at);
      return NextResponse.json(result satisfies AgentResponse);
    }

    if (action.type === "cancel_scheduled_email") {
      const result = await handleCancelScheduledEmail(supabase, user.id, action.email.id);
      return NextResponse.json(result satisfies AgentResponse);
    }
  }

  // ── Rate limit: free users get FREE_DAILY_LIMIT messages per 24 hours ─────

  if (profile.plan === "free") {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("agent_message_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", cutoff);

    const used = count ?? 0;
    if (used >= FREE_DAILY_LIMIT) {
      return NextResponse.json({
        type: "text",
        content: `You've used all ${FREE_DAILY_LIMIT} free messages for today. Upgrade to Pro for unlimited access — messages reset every 24 hours.`,
      } satisfies AgentResponse);
    }
  }

  // Fetch total client count for system prompt context
  const { count: clientCount } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const systemPrompt = buildSystemPrompt({
    userName:     profile.name ?? null,
    plan:         profile.plan,
    totalClients: clientCount ?? 0,
  });

  // ── AI call ───────────────────────────────────────────────────────────────

  let aiResponse: Awaited<ReturnType<OpenAI["chat"]["completions"]["create"]>>;
  try {
    const client = openRouter();
    const messages = [{ role: "system" as const, content: systemPrompt }, ...body.messages];
    const primaryModel = profile.plan === "free"
      ? "google/gemini-2.0-flash-exp:free"
      : "google/gemini-2.5-flash-preview:free";

    try {
      aiResponse = await client.chat.completions.create({
        model: primaryModel,
        messages,
        tools: AGENT_TOOLS,
        tool_choice: "auto",
        max_tokens: 1024,
      });
    } catch (primaryErr) {
      console.warn(`[agent] Primary model (${primaryModel}) failed, falling back to openrouter/auto:`, (primaryErr as Error).message);
      aiResponse = await client.chat.completions.create({
        model: "openrouter/auto",
        messages,
        tools: AGENT_TOOLS,
        tool_choice: "auto",
        max_tokens: 1024,
      });
    }
  } catch (err) {
    const msg = (err as Error).message;
    console.error("[agent] AI call failed:", msg);
    const isAuthErr = msg.includes("401") || msg.includes("403") || msg.toLowerCase().includes("auth");
    return NextResponse.json(
      { error: isAuthErr ? "AI service authentication failed." : "AI service unavailable. Please try again." },
      { status: 503 }
    );
  }

  // Log message for free-tier rate limiting (after successful AI call)
  if (profile.plan === "free") {
    await supabase.from("agent_message_logs").insert({ user_id: user.id });
  }

  const choice = aiResponse.choices[0];

  if (!choice.message.tool_calls || choice.message.tool_calls.length === 0) {
    return NextResponse.json({
      type: "text",
      content: choice.message.content ?? "I can help with clients and emails. What would you like to do?",
    } satisfies AgentResponse);
  }

  const toolCall = choice.message.tool_calls[0];
  const toolName = toolCall.function.name;
  let toolArgs: Record<string, string>;
  try {
    toolArgs = JSON.parse(toolCall.function.arguments) as Record<string, string>;
  } catch {
    return NextResponse.json({
      type: "text",
      content: "I had trouble understanding that. Could you rephrase?",
    } satisfies AgentResponse);
  }

  // ── list_clients ──────────────────────────────────────────────────────────

  if (toolName === "list_clients") {
    const { data: clients } = await supabase
      .from("clients")
      .select("name, email, company, phone")
      .eq("user_id", user.id)
      .order("name");

    if (!clients || clients.length === 0) {
      return NextResponse.json({
        type: "text",
        content: "You don't have any clients yet. Want me to add one?",
      } satisfies AgentResponse);
    }

    const lines = clients.map((c, i) => {
      const extras = [c.company, c.phone].filter(Boolean).join(" · ");
      return `${i + 1}. **${c.name}** — ${c.email}${extras ? `  (${extras})` : ""}`;
    });

    return NextResponse.json({
      type: "text",
      content: `You have ${clients.length} client${clients.length === 1 ? "" : "s"}:\n\n${lines.join("\n")}`,
    } satisfies AgentResponse);
  }

  // ── add_client ────────────────────────────────────────────────────────────

  if (toolName === "add_client") {
    const result = await handleAddClient(supabase, user.id, {
      name:    toolArgs.name    ?? "",
      email:   toolArgs.email   ?? "",
      company: toolArgs.company,
      phone:   toolArgs.phone,
    });
    return NextResponse.json(result satisfies AgentResponse);
  }

  // ── update_client ─────────────────────────────────────────────────────────

  if (toolName === "update_client") {
    const identifier = toolArgs.identifier ?? "";
    const { data: clients } = await supabase
      .from("clients")
      .select("id, name, email, company, phone")
      .eq("user_id", user.id);

    const matches = fuzzyMatchClients(clients ?? [], identifier);

    if (matches.length === 0) {
      return NextResponse.json({
        type: "text",
        content: `I couldn't find a client matching "${identifier}". Check the name or email and try again.`,
      } satisfies AgentResponse);
    }

    if (matches.length > 1) {
      return NextResponse.json({
        type: "clarification",
        content: `Found ${matches.length} clients matching "${identifier}". Which one should I update?`,
        options: matches,
      } satisfies AgentResponse);
    }

    const match = matches[0] as { id: string; name: string; email: string; company: string | null; phone: string | null };
    const updates: { name?: string; email?: string; company?: string; phone?: string } = {};
    if (toolArgs.name)    updates.name    = toolArgs.name;
    if (toolArgs.email)   updates.email   = toolArgs.email;
    if (toolArgs.company) updates.company = toolArgs.company;
    if (toolArgs.phone)   updates.phone   = toolArgs.phone;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({
        type: "text",
        content: "Please tell me what you'd like to change — name, email, company, or phone number.",
      } satisfies AgentResponse);
    }

    return NextResponse.json({
      type: "confirmation",
      content: `Update ${match.name}'s details?`,
      pendingAction: {
        type: "update_client",
        client: { id: match.id, name: match.name, email: match.email, company: match.company ?? null, phone: match.phone ?? null },
        updates,
      },
    } satisfies AgentResponse);
  }

  // ── remove_client ─────────────────────────────────────────────────────────

  if (toolName === "remove_client") {
    const identifier = toolArgs.identifier ?? "";
    const { data: clients } = await supabase
      .from("clients")
      .select("id, name, email, company")
      .eq("user_id", user.id);

    const matches = fuzzyMatchClients(clients ?? [], identifier);

    if (matches.length === 0) {
      return NextResponse.json({
        type: "text",
        content: `No client found matching "${identifier}". Check the name or email and try again.`,
      } satisfies AgentResponse);
    }

    if (matches.length > 1) {
      return NextResponse.json({
        type: "clarification",
        content: `Found ${matches.length} clients matching "${identifier}". Which one did you mean?`,
        options: matches,
      } satisfies AgentResponse);
    }

    const match = matches[0];
    return NextResponse.json({
      type: "confirmation",
      content: `Remove ${match.name} (${match.email}) from your clients?`,
      pendingAction: {
        type: "remove_client",
        client: { id: match.id, name: match.name, email: match.email, company: match.company ?? null },
      },
    } satisfies AgentResponse);
  }

  // ── send_email ────────────────────────────────────────────────────────────

  if (toolName === "send_email") {
    const clientIdentifier = toolArgs.client_identifier ?? "";
    const instructions     = toolArgs.instructions     ?? "";

    if (!profile.gmail_token) {
      return NextResponse.json({
        type: "text",
        content: "Your Gmail isn't connected. Go to Settings and connect it first.",
      } satisfies AgentResponse);
    }

    const { data: clients } = await supabase
      .from("clients")
      .select("id, name, email, company")
      .eq("user_id", user.id);

    const matches = fuzzyMatchClients(clients ?? [], clientIdentifier);

    if (matches.length === 0) {
      return NextResponse.json({
        type: "text",
        content: `No client found matching "${clientIdentifier}". Add them first, then try again.`,
      } satisfies AgentResponse);
    }

    if (matches.length > 1) {
      return NextResponse.json({
        type: "clarification",
        content: `Found ${matches.length} clients matching "${clientIdentifier}". Which one should I email?`,
        options: matches,
      } satisfies AgentResponse);
    }

    const match = matches[0];
    const emailType = (toolArgs.email_type ?? "manual") as import("@/types").EmailType;
    const tone = (toolArgs.tone ?? "friendly") as Tone;

    let draft: { subject: string; body: string; emailType: import("@/types").EmailType; tone: string };
    try {
      const result = await generateEmail({
        text: instructions,
        type: emailType,
        tone,
        clientName: match.name,
        senderName: profile.name ?? undefined,
        isPro: profile.plan !== "free",
      });
      draft = { subject: result.subject, body: result.body, emailType, tone };
    } catch (err) {
      if (err instanceof AIUnavailableError) {
        return NextResponse.json({
          type: "text",
          content: "The AI email writer is temporarily unavailable. Please try again.",
        } satisfies AgentResponse);
      }
      return NextResponse.json({
        type: "text",
        content: "Couldn't draft the email. Please try again.",
      } satisfies AgentResponse);
    }

    return NextResponse.json({
      type: "confirmation",
      content: `Here's the draft for ${match.name}. Ready to send?`,
      pendingAction: {
        type: "send_email",
        client: { id: match.id, name: match.name, email: match.email },
        draft,
      },
    } satisfies AgentResponse);
  }

  // ── schedule_email ────────────────────────────────────────────────────────────

  if (toolName === "schedule_email") {
    const clientIdentifier = toolArgs.client_identifier ?? "";
    const instructions     = toolArgs.instructions      ?? "";
    const scheduledAt      = toolArgs.scheduled_at      ?? "";

    if (!profile.gmail_token) {
      return NextResponse.json({
        type: "text",
        content: "Your Gmail isn't connected. Go to Settings and connect it first.",
      } satisfies AgentResponse);
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date(Date.now() + 60 * 1000)) {
      return NextResponse.json({
        type: "text",
        content: "Please give me a valid date/time at least 1 minute in the future.",
      } satisfies AgentResponse);
    }

    const { data: clients } = await supabase
      .from("clients")
      .select("id, name, email, company")
      .eq("user_id", user.id);

    const matches = fuzzyMatchClients(clients ?? [], clientIdentifier);

    if (matches.length === 0) {
      return NextResponse.json({
        type: "text",
        content: `No client found matching "${clientIdentifier}". Add them first, then try again.`,
      } satisfies AgentResponse);
    }

    if (matches.length > 1) {
      return NextResponse.json({
        type: "clarification",
        content: `Found ${matches.length} clients matching "${clientIdentifier}". Which one should I schedule the email for?`,
        options: matches,
      } satisfies AgentResponse);
    }

    const match = matches[0];
    const emailType = (toolArgs.email_type ?? "manual") as import("@/types").EmailType;
    const tone = (toolArgs.tone ?? "friendly") as Tone;

    let draft: { subject: string; body: string; emailType: import("@/types").EmailType; tone: string };
    try {
      const result = await generateEmail({
        text: instructions,
        type: emailType,
        tone,
        clientName: match.name,
        senderName: profile.name ?? undefined,
        isPro: profile.plan !== "free",
      });
      draft = { subject: result.subject, body: result.body, emailType, tone };
    } catch (err) {
      if (err instanceof AIUnavailableError) {
        return NextResponse.json({ type: "text", content: "The AI email writer is temporarily unavailable. Please try again." } satisfies AgentResponse);
      }
      return NextResponse.json({ type: "text", content: "Couldn't draft the email. Please try again." } satisfies AgentResponse);
    }

    const dateStr = scheduledDate.toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });
    return NextResponse.json({
      type: "confirmation",
      content: `Here's the draft for ${match.name}, scheduled for ${dateStr}. Confirm?`,
      pendingAction: {
        type: "schedule_email",
        client: { id: match.id, name: match.name, email: match.email },
        draft,
        scheduled_at: scheduledDate.toISOString(),
      },
    } satisfies AgentResponse);
  }

  // ── list_scheduled_emails ─────────────────────────────────────────────────────

  if (toolName === "list_scheduled_emails") {
    const { data: scheduled } = await supabase
      .from("emails")
      .select("id, subject, client_snapshot, scheduled_at")
      .eq("user_id", user.id)
      .eq("status", "scheduled")
      .order("scheduled_at");

    if (!scheduled || scheduled.length === 0) {
      return NextResponse.json({
        type: "text",
        content: "You have no scheduled emails right now.",
      } satisfies AgentResponse);
    }

    const lines = scheduled.map((e, i) => {
      const clientName = (e.client_snapshot as { name?: string })?.name ?? "Unknown";
      const dateStr = new Date(e.scheduled_at as string).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });
      return `${i + 1}. **${e.subject}** → ${clientName} — ${dateStr}`;
    });

    return NextResponse.json({
      type: "text",
      content: `You have ${scheduled.length} scheduled email${scheduled.length === 1 ? "" : "s"}:\n\n${lines.join("\n")}`,
    } satisfies AgentResponse);
  }

  // ── reschedule_email ──────────────────────────────────────────────────────────

  if (toolName === "reschedule_email") {
    const identifier     = toolArgs.identifier       ?? "";
    const newScheduledAt = toolArgs.new_scheduled_at ?? "";

    const newDate = new Date(newScheduledAt);
    if (isNaN(newDate.getTime()) || newDate <= new Date(Date.now() + 60 * 1000)) {
      return NextResponse.json({
        type: "text",
        content: "Please give me a valid date/time at least 1 minute in the future.",
      } satisfies AgentResponse);
    }

    const { data: scheduled } = await supabase
      .from("emails")
      .select("id, subject, client_snapshot, scheduled_at")
      .eq("user_id", user.id)
      .eq("status", "scheduled");

    const reschedMatches = (scheduled ?? []).filter(e => {
      const clientName = (e.client_snapshot as { name?: string })?.name?.toLowerCase() ?? "";
      return (e.subject as string)?.toLowerCase().includes(identifier.toLowerCase()) ||
             clientName.includes(identifier.toLowerCase());
    });

    if (reschedMatches.length === 0) {
      return NextResponse.json({
        type: "text",
        content: `No scheduled email found matching "${identifier}". Ask me to "check scheduled emails" to see all pending ones.`,
      } satisfies AgentResponse);
    }

    if (reschedMatches.length > 1) {
      const list = reschedMatches.map((e, i) => {
        const cn = (e.client_snapshot as { name?: string })?.name ?? "Unknown";
        const ds = new Date(e.scheduled_at as string).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });
        return `${i + 1}. "${e.subject}" → ${cn} — ${ds}`;
      }).join("\n");
      return NextResponse.json({
        type: "text",
        content: `Found ${reschedMatches.length} matches. Which one did you mean?\n\n${list}`,
      } satisfies AgentResponse);
    }

    const rm = reschedMatches[0];
    const rmClient = (rm.client_snapshot as { name?: string })?.name ?? "Unknown";
    const oldStr = new Date(rm.scheduled_at as string).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });
    const newStr = newDate.toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });

    return NextResponse.json({
      type: "confirmation",
      content: `Reschedule "${rm.subject}" (to ${rmClient}) from ${oldStr} to ${newStr}?`,
      pendingAction: {
        type: "reschedule_email",
        email: { id: rm.id as string, subject: rm.subject as string, client_name: rmClient, old_scheduled_at: rm.scheduled_at as string },
        new_scheduled_at: newDate.toISOString(),
      },
    } satisfies AgentResponse);
  }

  // ── cancel_scheduled_email ────────────────────────────────────────────────────

  if (toolName === "cancel_scheduled_email") {
    const identifier = toolArgs.identifier ?? "";

    const { data: scheduled } = await supabase
      .from("emails")
      .select("id, subject, client_snapshot, scheduled_at")
      .eq("user_id", user.id)
      .eq("status", "scheduled");

    const cancelMatches = (scheduled ?? []).filter(e => {
      const clientName = (e.client_snapshot as { name?: string })?.name?.toLowerCase() ?? "";
      return (e.subject as string)?.toLowerCase().includes(identifier.toLowerCase()) ||
             clientName.includes(identifier.toLowerCase());
    });

    if (cancelMatches.length === 0) {
      return NextResponse.json({
        type: "text",
        content: `No scheduled email found matching "${identifier}".`,
      } satisfies AgentResponse);
    }

    if (cancelMatches.length > 1) {
      const list = cancelMatches.map((e, i) => {
        const cn = (e.client_snapshot as { name?: string })?.name ?? "Unknown";
        const ds = new Date(e.scheduled_at as string).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });
        return `${i + 1}. "${e.subject}" → ${cn} — ${ds}`;
      }).join("\n");
      return NextResponse.json({
        type: "text",
        content: `Found ${cancelMatches.length} matches. Which one to cancel?\n\n${list}`,
      } satisfies AgentResponse);
    }

    const cm = cancelMatches[0];
    const cmClient = (cm.client_snapshot as { name?: string })?.name ?? "Unknown";
    const cmDate = new Date(cm.scheduled_at as string).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });

    return NextResponse.json({
      type: "confirmation",
      content: `Cancel "${cm.subject}" to ${cmClient} (scheduled for ${cmDate})?`,
      pendingAction: {
        type: "cancel_scheduled_email",
        email: { id: cm.id as string, subject: cm.subject as string, client_name: cmClient, scheduled_at: cm.scheduled_at as string },
      },
    } satisfies AgentResponse);
  }

  // ── generate_report ───────────────────────────────────────────────────────

  if (toolName === "generate_report") {
    const period = (toolArgs.period ?? "7d") as ReportPeriod;
    const result = await handleGenerateReport(supabase, user.id, period, profile.name ?? null);
    return NextResponse.json(result satisfies AgentResponse);
  }

  return NextResponse.json({
    type: "text",
    content: "I can help with clients and emails. What would you like to do?",
  } satisfies AgentResponse);
}
