import OpenAI from "openai";
import { z } from "zod";
import {
  buildDetectTypePrompt,
  buildGenerateEmailPrompt,
} from "@/lib/ai/prompts";
import type { EmailType, Tone } from "@/types";

export class AIUnavailableError extends Error {
  constructor(message = "AI service is temporarily unavailable. Please try again shortly.") {
    super(message);
    this.name = "AIUnavailableError";
  }
}

const EmailSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
});

const TypeSchema = z.object({
  type: z.enum(["invoice", "payment_reminder", "project_update", "proposal"]),
  confidence: z.enum(["high", "medium", "low"]),
});

// Both primary and fallback route through OpenRouter — single API key required.
// Primary model  : google/gemini-2.5-flash
// Fallback model : openrouter/auto (free-tier routing)
function openRouter(): OpenAI {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new AIUnavailableError("AI service is not configured (missing API key).");
  }
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      "HTTP-Referer": "https://mailmind-ai.vercel.app",
      "X-Title": "MailMind AI",
    },
  });
}

// Strips markdown fences and extracts the first JSON object from a raw AI response.
function parseJsonResponse(raw: string): unknown {
  const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object found in AI response");
  return JSON.parse(match[0]);
}

type ModelUsed = "gemini-flash" | "openrouter-auto";
type ErrorKind = "auth_error" | "rate_limit" | "timeout" | "upstream_error" | "parse_error";

function classifyError(err: unknown): { kind: ErrorKind; status?: number; message: string } {
  const status = (err as { status?: number })?.status;
  const message = (err as Error)?.message ?? "Unknown error";

  if (status === 401 || status === 403) return { kind: "auth_error", status, message };
  if (status === 429) return { kind: "rate_limit", status, message };
  if (message.includes("timeout") || message.includes("ETIMEDOUT")) return { kind: "timeout", message };
  return { kind: "upstream_error", status, message };
}

function logAI(level: "warn" | "error", model: string, kind: ErrorKind, message: string, status?: number) {
  const statusPart = status != null ? ` status=${status}` : "";
  console[level](`[AI] ${level} model=${model} code=${kind}${statusPart} msg="${message}"`);
}

// Free plan: openrouter/auto routes to the best available free model.
async function callFreeModel(
  prompt: string,
  maxTokens = 700
): Promise<{ content: string; model: ModelUsed }> {
  const client = openRouter();
  try {
    const res = await client.chat.completions.create({
      model: "openrouter/auto",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      max_tokens: maxTokens,
    });
    const content = res.choices[0]?.message?.content?.trim();
    if (content) return { content, model: "openrouter-auto" };
    throw new Error("Empty response from free model");
  } catch (err) {
    const { kind, status, message } = classifyError(err);
    logAI("error", "openrouter/auto", kind, message, status);
    if (kind === "auth_error") throw new AIUnavailableError("AI service authentication failed. Contact support.");
    if (kind === "rate_limit") throw new AIUnavailableError("AI service is rate-limited. Please try again in a moment.");
  }
  throw new AIUnavailableError();
}

// Pro plan: Gemini 2.5 Flash (paid, higher quality) → falls back to NVIDIA free on failure.
async function callProModel(
  prompt: string,
  maxTokens = 900
): Promise<{ content: string; model: ModelUsed }> {
  const client = openRouter();

  try {
    const res = await client.chat.completions.create({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: maxTokens,
    });
    const content = res.choices[0]?.message?.content?.trim();
    if (content) return { content, model: "gemini-flash" };
    throw new Error("Empty response from pro model");
  } catch (err) {
    const { kind, status, message } = classifyError(err);
    if (kind === "auth_error") {
      logAI("error", "google/gemini-2.5-flash", kind, message, status);
      throw new AIUnavailableError("AI service authentication failed. Contact support.");
    }
    logAI("warn", "google/gemini-2.5-flash", kind, message, status);
  }

  // Fallback to openrouter/auto if Gemini Flash fails
  return callFreeModel(prompt, maxTokens);
}

// ── Public API ───────────────────────────────────────────────────────────────

export interface GenerateEmailParams {
  text: string;
  type: EmailType;
  tone: Tone;
  clientName?: string;
  senderName?: string;
  isPro?: boolean;
}

export interface GenerateEmailResult {
  subject: string;
  body: string;
  model_used: ModelUsed;
}

export async function generateEmail(
  params: GenerateEmailParams
): Promise<GenerateEmailResult> {
  const prompt = buildGenerateEmailPrompt(
    params.text,
    params.type,
    params.tone,
    params.clientName,
    params.senderName
  );

  let content: string;
  let model: ModelUsed;

  try {
    ({ content, model } = await (params.isPro ? callProModel : callFreeModel)(prompt, 900));
  } catch (err) {
    if (err instanceof AIUnavailableError) throw err;
    throw new AIUnavailableError();
  }

  try {
    const parsed = EmailSchema.parse(parseJsonResponse(content));
    return { subject: parsed.subject, body: parsed.body, model_used: model };
  } catch (err) {
    logAI("error", model, "parse_error", (err as Error).message);
    throw new AIUnavailableError("AI returned an unexpected response format. Please try again.");
  }
}

export async function detectEmailType(text: string): Promise<{
  type: EmailType;
  confidence: "high" | "medium" | "low";
}> {
  const prompt = buildDetectTypePrompt(text);

  try {
    const { content } = await callFreeModel(prompt, 100);
    const parsed = TypeSchema.parse(parseJsonResponse(content));
    return { type: parsed.type as EmailType, confidence: parsed.confidence };
  } catch (err) {
    if (err instanceof AIUnavailableError) throw err;
    // JSON parse / schema mismatch — default gracefully rather than crashing
    logAI("warn", "unknown", "parse_error", (err as Error).message);
    return { type: "invoice", confidence: "low" };
  }
}

