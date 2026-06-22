export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ClientOption {
  id: string;
  name: string;
  email: string;
  company: string | null;
}

// ── Pending actions (awaiting explicit user confirmation) ─────────────────────

export interface PendingRemoveClient {
  type: "remove_client";
  client: { id: string; name: string; email: string; company: string | null };
}

export interface PendingSendEmail {
  type: "send_email";
  client: { id: string; name: string; email: string };
  draft: { subject: string; body: string };
}

export interface PendingUpdateClient {
  type: "update_client";
  client: { id: string; name: string; email: string; company: string | null; phone: string | null };
  updates: { name?: string; email?: string; company?: string; phone?: string };
}

export type PendingAction = PendingRemoveClient | PendingSendEmail | PendingUpdateClient;

// ── API request ───────────────────────────────────────────────────────────────

export interface AgentChatRequest {
  messages: ConversationMessage[];
  pendingAction?: {
    action: PendingAction;
    confirmed: boolean;
  } | null;
}

// ── API response union ────────────────────────────────────────────────────────

export interface AgentTextResponse {
  type: "text";
  content: string;
}

export interface AgentConfirmationResponse {
  type: "confirmation";
  content: string;
  pendingAction: PendingAction;
}

export interface AgentActionResultResponse {
  type: "action_result";
  content: string;
  success: boolean;
}

export interface AgentClarificationResponse {
  type: "clarification";
  content: string;
  options: ClientOption[];
}

export interface AgentReportResponse {
  type: "report";
  content: string;
  pdf: { base64: string; filename: string };
}

export type AgentResponse =
  | AgentTextResponse
  | AgentConfirmationResponse
  | AgentActionResultResponse
  | AgentClarificationResponse
  | AgentReportResponse;
