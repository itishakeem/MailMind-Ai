import OpenAI from "openai";
import { z } from "zod";
import {
  buildDetectTypePrompt,
  buildGenerateEmailPrompt,
  buildMonthlySummaryPrompt,
} from "@/lib/ai/prompts";
import type { EmailType, Tone } from "@/types";

export class AIUnavailableError extends Error {
  constructor(message = "AI service is temporarily unavailable.") {
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

function openRouter() {
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      "HTTP-Referer": "https://mailmind-ai.vercel.app",
      "X-Title": "MailMind AI",
    },
  });
}

function nvidiaClient() {
  return new OpenAI({
    baseURL: "https://integrate.api.nvidia.com/v1",
    apiKey: process.env.NVIDIA_API_KEY,
  });
}

// Strips markdown fences and extracts the first JSON object from a raw AI response.
function parseJsonResponse(raw: string): unknown {
  const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object found in AI response");
  return JSON.parse(match[0]);
}

type ModelUsed = "gemini-flash" | "nemotron-3-super";

// Calls primary then fallback model. Returns content + which model was used.
async function callWithFallback(
  prompt: string,
  maxTokens = 800
): Promise<{ content: string; model: ModelUsed }> {
  // Primary: OpenRouter / Gemini Flash
  try {
    const res = await openRouter().chat.completions.create({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: maxTokens,
    });
    const content = res.choices[0]?.message?.content?.trim();
    if (content) return { content, model: "gemini-flash" };
  } catch (err) {
    const status = (err as { status?: number })?.status;
    // On auth error (401/403) with the primary key, don't fallback — it won't help
    if (status === 401 || status === 403) throw new AIUnavailableError();
    console.warn("[AI] Primary (Gemini Flash) failed, trying Nemotron:", (err as Error).message);
  }

  // Fallback: NVIDIA NIM / Nemotron 3 Super
  try {
    const res = await nvidiaClient().chat.completions.create({
      model: "nvidia/nemotron-3-8b-chat-4k-steerlm",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: maxTokens,
    });
    const content = res.choices[0]?.message?.content?.trim();
    if (content) return { content, model: "nemotron-3-super" };
  } catch (err) {
    console.error("[AI] Fallback (Nemotron) also failed:", (err as Error).message);
  }

  throw new AIUnavailableError();
}

// ── Public API ──────────────────────────────────────────────────────────────

export interface GenerateEmailParams {
  text: string;
  type: EmailType;
  tone: Tone;
  clientName?: string;
}

export interface GenerateEmailResult {
  subject: string;
  body: string;
  model_used: "gemini-flash" | "nemotron-3-super";
}

export async function generateEmail(
  params: GenerateEmailParams
): Promise<GenerateEmailResult> {
  const prompt = buildGenerateEmailPrompt(
    params.text,
    params.type,
    params.tone,
    params.clientName
  );
  const { content, model } = await callWithFallback(prompt, 900);
  const parsed = EmailSchema.parse(parseJsonResponse(content));
  return { subject: parsed.subject, body: parsed.body, model_used: model };
}

export async function detectEmailType(text: string): Promise<{
  type: EmailType;
  confidence: "high" | "medium" | "low";
}> {
  const prompt = buildDetectTypePrompt(text);
  try {
    const { content } = await callWithFallback(prompt, 100);
    const parsed = TypeSchema.parse(parseJsonResponse(content));
    return { type: parsed.type as EmailType, confidence: parsed.confidence };
  } catch (err) {
    if (err instanceof AIUnavailableError) throw err;
    // JSON parse error — default to invoice with low confidence rather than crashing
    console.warn("[AI] Type detection parse error, defaulting to invoice:", (err as Error).message);
    return { type: "invoice", confidence: "low" };
  }
}

export async function generateMonthlySummary(stats: {
  emailsSent: number;
  topClients: string[];
  commonType: string;
}): Promise<string> {
  const prompt = buildMonthlySummaryPrompt(stats);
  const { content } = await callWithFallback(prompt, 150);
  return content.trim();
}
