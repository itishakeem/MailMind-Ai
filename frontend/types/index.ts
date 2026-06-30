// Shared TypeScript interfaces for MailMind AI
// Source of truth: specs/001-mailmind-ai/data-model.md

export type Plan = "free" | "pro" | "business";
export type EmailStatus = "draft" | "scheduled" | "sending" | "sent" | "failed";
export type EmailType =
  | "invoice"
  | "payment_reminder"
  | "project_update"
  | "proposal"
  | "manual";
export type Tone = "friendly" | "formal" | "strict" | "urgent" | "apologetic" | "persuasive";

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
  max_emails_per_day: number | null; // null = unlimited; resets every 24 hours
  max_clients: number | null;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free:     { max_emails_per_day: 15, max_clients: 5 },
  pro:      { max_emails_per_day: null, max_clients: null },
  business: { max_emails_per_day: null, max_clients: null },
};

export interface PlanLimitError {
  error: string;
  limit_type: "clients" | "emails_per_month";
  current_count: number;
  max_allowed: number;
  upgrade_url: string;
}

export interface EmailTemplate {
  id: string;
  user_id: string;
  name: string;
  subject: string;
  body: string;
  created_at: string;
}

export interface ClientNote {
  id: string;
  client_id: string;
  user_id: string;
  body: string;
  created_at: string;
}

export interface DailyEmailCount {
  date: string;   // YYYY-MM-DD
  label: string;  // "Mon", "Tue", …
  count: number;
}

export interface DashboardStats {
  emails_sent_this_month: number;
  scheduled_count: number;
  per_client_activity: ClientActivity[];
  plan: Plan;
  user_name: string | null;
  plan_usage: PlanUsage;
  daily_emails: DailyEmailCount[];
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
  model_used: "gemini-flash" | "openrouter-auto";
}

export interface AIDetectTypeResult {
  detected_type: EmailType;
  confidence: "high" | "medium" | "low";
}

// ── RBAC ──────────────────────────────────────────────────────────────────

// Role string is intentionally wide (TEXT in DB) so new roles require zero
// schema changes — just add to this union and the ROLE_HIERARCHY map.
export type UserRole =
  | "user"
  | "support"
  | "moderator"
  | "admin"
  | "super_admin";

// Numeric weights that define who can do what.
// Higher = more privilege. canAccess() is the single call-site for all checks.
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  user:        0,
  support:     1,
  moderator:   2,
  admin:       3,
  super_admin: 4,
};

export function canAccess(userRole: UserRole, minRole: UserRole): boolean {
  return (ROLE_HIERARCHY[userRole] ?? -1) >= (ROLE_HIERARCHY[minRole] ?? 999);
}

// ── Admin types ────────────────────────────────────────────────────────────

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  plan: Plan;
  gmail_email: string | null;
  role: UserRole;
  created_at: string;
}

export interface AdminOverviewStats {
  total_users: number;
  new_users_this_month: number;
  users_by_plan: { free: number; pro: number; business: number };
  total_emails: number;
  emails_sent_this_month: number;
  emails_failed: number;
  emails_scheduled: number;
  total_clients: number;
  gmail_connections: number;
  contact_messages: number;
  recent_users: AdminUserRow[];
}

export interface AdminAnalytics {
  daily_volume: Array<{ date: string; label: string; sent: number; failed: number }>;
  status_breakdown: { sent: number; failed: number; scheduled: number; draft: number };
  type_distribution: Array<{ type: string; count: number }>;
  top_users: Array<{ user_id: string; name: string; email: string; email_count: number }>;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
}
