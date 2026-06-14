// Shared TypeScript interfaces for MailMind AI
// Source of truth: specs/001-mailmind-ai/data-model.md

export type Plan = "free" | "pro" | "business";
export type EmailStatus = "draft" | "scheduled" | "sent" | "failed";
export type EmailType =
  | "invoice"
  | "payment_reminder"
  | "project_update"
  | "proposal"
  | "manual";
export type Tone = "friendly" | "formal" | "strict";

export interface User {
  id: string;
  name: string;
  email: string;
  plan: Plan;
  gmail_email: string | null;
  gmail_connected: boolean; // derived: gmail_token IS NOT NULL
  email_signature: string | null;
  created_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientSnapshot {
  name: string;
  email: string;
}

export interface Email {
  id: string;
  user_id: string;
  client_id: string | null;
  client_snapshot: ClientSnapshot;
  subject: string;
  body: string;
  ai_detected_type: EmailType | null;
  tone: Tone | null;
  status: EmailStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  failure_reason: string | null;
  gmail_message_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  filename: string;
  extracted_text: string;
  uploaded_at: string;
}

export interface PlanLimits {
  max_emails_per_month: number | null; // null = unlimited
  max_clients: number | null;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: { max_emails_per_month: 10, max_clients: 3 },
  pro: { max_emails_per_month: null, max_clients: null },
  business: { max_emails_per_month: null, max_clients: null },
};

export interface PlanLimitError {
  error: string;
  limit_type: "clients" | "emails_per_month";
  current_count: number;
  max_allowed: number;
  upgrade_url: string;
}

export interface DashboardStats {
  emails_sent_this_month: number;
  scheduled_count: number;
  per_client_activity: ClientActivity[];
  plan: Plan;
  plan_usage: PlanUsage;
}

export interface ClientActivity {
  client_id: string | null;
  client_name: string;
  email_count: number;
  last_sent_at: string | null;
}

export interface PlanUsage {
  emails_used: number;
  emails_limit: number | null;
  clients_used: number;
  clients_limit: number | null;
}

export interface AIGenerateResult {
  subject: string;
  body: string;
  model_used: "gemini-flash" | "nemotron-3-super" | "none";
}

export interface AIDetectTypeResult {
  detected_type: EmailType;
  confidence: "high" | "medium" | "low";
}
