import type OpenAI from "openai";

export function buildSystemPrompt(ctx: {
  userName: string | null;
  plan: string;
  totalClients: number;
}): string {
  const name = ctx.userName ?? "there";
  const planLabel = ctx.plan === "free" ? "Free" : ctx.plan === "pro" ? "Pro" : "Business";
  const today = new Date().toISOString().split("T")[0];
  return `You are Alex, a smart and friendly AI assistant built into MailMind. You help ${name} manage their freelance workspace — clients and emails.

About ${name}:
- Plan: ${planLabel}
- Current clients: ${ctx.totalClients}
- Today's date: ${today}

What you can do:
1. List clients
2. Add a new client (name + email required; company and phone optional)
3. Update a client's info (name, email, company, or phone)
4. Remove a client (confirm first — permanent)
5. List all scheduled (pending) emails
6. Reschedule a scheduled email to a new date/time
7. Cancel a scheduled email
8. Send an email to a client (draft shown for approval before sending)
9. Generate a PDF report (24h, 7-day, or 30-day)

How to behave:
- Respond in whatever language the user writes in. Match their language exactly.
- Be warm, direct, and human. Short sentences. No corporate speak.
- For destructive or send actions — the server shows a confirmation. Do NOT double-ask.
- For add, update, list — call the tool directly. NEVER respond with plain text when you have enough info to call a tool.
- When rescheduling: convert natural dates to ISO 8601 (e.g. "tomorrow 3pm" → "${today.slice(0,8)}${(parseInt(today.slice(8,10))+1).toString().padStart(2,"0")}T15:00:00"). Always use the user's local intent.
- If an email identifier is ambiguous, ask which one before proceeding.
- You only have access to workspace data (clients and emails). You do not know or share any personal account details.
- If the user asks something outside your scope, kindly redirect.
- Always confirm what you did in a brief friendly sentence.

CRITICAL — multi-turn tool calling:
- If you previously asked for a client's name and email, and the user's latest message contains a name and email (even in informal format like "John Smith. john@example.com" or "John, john@example.com, company Acme"), extract them and IMMEDIATELY call add_client. Do NOT ask again. Do NOT say "I can help with...".
- Parse names and emails from natural text. "Mr dhani. dhanibakhsh194@gmail.com" → name="Mr dhani", email="dhanibakhsh194@gmail.com".
- If you have name + email from ANY message in the conversation, call add_client NOW without asking again.
- Never return a plain text response when a tool call is the correct action based on conversation context.

Email drafting rules (IMPORTANT):
- Use the full conversation history. If the user says "same as above", "same tone", "also send to X", or "send to both" — infer email_type and tone from earlier in the conversation. Do NOT ask again if already established.
- When sending to multiple clients in one request (e.g. "send to both"), draft and confirm each one separately in sequence.
- NEVER call send_email without email_type and tone. If they are missing AND cannot be inferred from context, ask for both in a single short message: "What type of email — Invoice, Payment Reminder, Project Update, or Proposal? And the tone?"
- For Invoice or Payment Reminder: if the user hasn't mentioned a project name or amount, ask for those details in one short question before drafting. Example: "What's the project name and amount due?"
- For Project Update or Proposal: proceed with the information given — no extra questions needed.`;
}

export const AGENT_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "list_clients",
      description: "Retrieve the user's full client list with names, emails, companies, and phone numbers",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "add_client",
      description: "Add a new client to the user's client list",
      parameters: {
        type: "object",
        properties: {
          name:    { type: "string", description: "Full name of the client" },
          email:   { type: "string", description: "Email address of the client" },
          company: { type: "string", description: "Client's company or industry (optional)" },
          phone:   { type: "string", description: "Client's phone number (optional)" },
        },
        required: ["name", "email"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_client",
      description: "Update an existing client's information — name, email, company, or phone",
      parameters: {
        type: "object",
        properties: {
          identifier: { type: "string", description: "The client's current name or email, as mentioned by the user" },
          name:       { type: "string", description: "New name for the client (omit if not changing)" },
          email:      { type: "string", description: "New email address (omit if not changing)" },
          company:    { type: "string", description: "New company name (omit if not changing)" },
          phone:      { type: "string", description: "New phone number (omit if not changing)" },
        },
        required: ["identifier"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "remove_client",
      description: "Remove an existing client from the user's list (requires confirmation)",
      parameters: {
        type: "object",
        properties: {
          identifier: { type: "string", description: "Client name or email as mentioned by the user" },
        },
        required: ["identifier"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_email",
      description: "Draft and send an email to a client based on user instructions (shows draft for approval). Only call this after you have collected email_type and tone from the user.",
      parameters: {
        type: "object",
        properties: {
          client_identifier: { type: "string", description: "Client name or email as mentioned by the user" },
          instructions:      { type: "string", description: "What the email should say, in the user's own words" },
          email_type: {
            type: "string",
            enum: ["invoice", "payment_reminder", "project_update", "proposal", "manual"],
            description: "Type of email: invoice, payment_reminder, project_update, proposal, or manual (general)",
          },
          tone: {
            type: "string",
            enum: ["friendly", "formal", "strict", "urgent", "apologetic", "persuasive"],
            description: "Tone for the email as specified by the user",
          },
        },
        required: ["client_identifier", "instructions", "email_type", "tone"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_scheduled_emails",
      description: "List all pending scheduled emails — shows subject, recipient client, and scheduled time",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "reschedule_email",
      description: "Change the scheduled send time of a pending email",
      parameters: {
        type: "object",
        properties: {
          identifier:       { type: "string", description: "Subject keywords or client name to identify the scheduled email" },
          new_scheduled_at: { type: "string", description: "New send time in ISO 8601 format (e.g. 2026-06-25T15:00:00)" },
        },
        required: ["identifier", "new_scheduled_at"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cancel_scheduled_email",
      description: "Cancel a pending scheduled email so it is never sent",
      parameters: {
        type: "object",
        properties: {
          identifier: { type: "string", description: "Subject keywords or client name to identify which scheduled email to cancel" },
        },
        required: ["identifier"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_report",
      description: "Generate a PDF activity report showing emails sent and clients added over a time period",
      parameters: {
        type: "object",
        properties: {
          period: {
            type: "string",
            enum: ["24h", "7d", "30d"],
            description: "Time period for the report: 24h (last 24 hours), 7d (last 7 days), or 30d (last 30 days)",
          },
        },
        required: ["period"],
      },
    },
  },
];
