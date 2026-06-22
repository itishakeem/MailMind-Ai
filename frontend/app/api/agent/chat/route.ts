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
  handleGenerateReport,
} from "@/lib/agent/handlers";
import { generateEmail, AIUnavailableError } from "@/lib/ai/generate";
import type { AgentChatRequest, AgentResponse } from "@/lib/agent/types";
import type { ReportPeriod } from "@/lib/agent/report";

const FREE_DAILY_LIMIT = 10;

function openRouter(plan: string) {
  const isFree = plan === "free";
  const apiKey = isFree
    ? process.env.OPENROUTER_API_KEY_FREE
    : process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(isFree ? "OPENROUTER_API_KEY_FREE not configured" : "OPENROUTER_API_KEY not configured");
  }
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": "https://mailmind-ai.vercel.app",
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
    const client = openRouter(profile.plan);
    aiResponse = await client.chat.completions.create({
      model: profile.plan === "free" ? "openrouter/auto" : "google/gemini-2.5-flash",
      messages: [{ role: "system", content: systemPrompt }, ...body.messages],
      tools: AGENT_TOOLS,
      tool_choice: "auto",
    });
  } catch (err) {
    console.error("[agent] AI call failed:", (err as Error).message);
    return NextResponse.json({ error: "AI service unavailable" }, { status: 503 });
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
    let draft: { subject: string; body: string };
    try {
      const result = await generateEmail({
        text: instructions,
        type: "manual",
        tone: "friendly",
        clientName: match.name,
        senderName: profile.name ?? undefined,
        isPro: profile.plan !== "free",
      });
      draft = { subject: result.subject, body: result.body };
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
