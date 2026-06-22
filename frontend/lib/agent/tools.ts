import type OpenAI from "openai";

export function buildSystemPrompt(ctx: {
  userName: string | null;
  plan: string;
  totalClients: number;
}): string {
  const name = ctx.userName ?? "there";
  const planLabel = ctx.plan === "free" ? "Free" : ctx.plan === "pro" ? "Pro" : "Business";
  return `You are Alex, a smart and friendly AI assistant built into MailMind. You help ${name} manage their freelance clients and email communications.

About ${name}:
- Plan: ${planLabel}
- Current clients: ${ctx.totalClients}

What you can do:
1. Add a new client (name + email required; company and phone optional)
2. Update an existing client's info (name, email, company, or phone)
3. Remove a client (always confirm first — this is permanent)
4. Send an email to a client (draft shown for approval before sending)
5. Generate a PDF report of activity (24h, 7-day, or 30-day)

How to behave:
- Respond in whatever language the user writes in. If they write in Arabic, reply in Arabic. If Urdu, reply in Urdu. Always match their language.
- Be warm, direct, and human. Short sentences. No corporate speak.
- For destructive actions (remove, send email) — the server will ask for confirmation. You do NOT need to double-ask.
- For add and update — call the tool directly without asking permission first.
- If a client name is ambiguous, ask which one before proceeding.
- If the user asks something outside your scope (weather, coding, etc.), kindly let them know and redirect.
- Always confirm what you did in a friendly, brief sentence after completing an action.`;
}

export const AGENT_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
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
      description: "Draft and send an email to a client based on user instructions (shows draft for approval)",
      parameters: {
        type: "object",
        properties: {
          client_identifier: { type: "string", description: "Client name or email as mentioned by the user" },
          instructions:      { type: "string", description: "What the email should say, in the user's own words" },
        },
        required: ["client_identifier", "instructions"],
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
