"use client";

import { useEffect, useState } from "react";
import PDFUpload from "@/components/compose/PDFUpload";
import ToneSelector from "@/components/compose/ToneSelector";
import AIPreview from "@/components/compose/AIPreview";
import type { Client, EmailType, Tone } from "@/types";

interface ComposeWizardProps {
  initialClientId?: string;
  onSent: (emailId: string) => void;
  onScheduled: (emailId: string, scheduledAt: string) => void;
}

type Step = 1 | 2 | 3;
type InputMethod = "text" | "pdf";

export default function ComposeWizard({
  initialClientId,
  onSent,
  onScheduled,
}: ComposeWizardProps) {
  const [step, setStep] = useState<Step>(1);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState(initialClientId ?? "");
  const [inputMethod, setInputMethod] = useState<InputMethod>("text");
  const [inputText, setInputText] = useState("");
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [tone, setTone] = useState<Tone>("formal");
  const [detectedType, setDetectedType] = useState<EmailType>("invoice");
  const [detecting, setDetecting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [fallbackMode, setFallbackMode] = useState(false);
  const [sending, setSending] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((d) => setClients(d.clients ?? []));
  }, []);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  // Step 2: detect type then auto-generate
  async function handleGenerate() {
    if (!inputText.trim() && !documentId) {
      setStepError("Please provide a description or upload a PDF.");
      return;
    }
    setStepError(null);
    setDetecting(true);

    // Detect type
    let confirmedType: EmailType = detectedType;
    try {
      const res = await fetch("/api/ai/detect-type", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });
      const data = await res.json();
      if (res.ok) confirmedType = data.detected_type;
      if (res.status === 503) {
        setFallbackMode(true);
        setDetecting(false);
        setStep(3);
        return;
      }
    } catch {
      // Detection failure is non-fatal — proceed with current type
    }

    setDetectedType(confirmedType);
    setDetecting(false);
    setGenerating(true);

    // Generate email
    await runGenerate(confirmedType, tone);
    setGenerating(false);
    setStep(3);
  }

  async function runGenerate(type: EmailType, selectedTone: Tone) {
    const res = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: inputText,
        tone: selectedTone,
        email_type: type,
        client_name: selectedClient?.name,
      }),
    });

    const data = await res.json();

    if (res.status === 503 || data.fallback_mode) {
      setFallbackMode(true);
      setSubject("");
      setBody("");
      return;
    }

    if (res.ok) {
      setSubject(data.subject ?? "");
      setBody(data.body ?? "");
      setFallbackMode(false);
    }
  }

  async function handleRegenerate() {
    setRegenerating(true);
    await runGenerate(detectedType, tone);
    setRegenerating(false);
  }

  async function handleTypeChange(newType: EmailType) {
    setDetectedType(newType);
    setRegenerating(true);
    await runGenerate(newType, tone);
    setRegenerating(false);
  }

  async function handleSendNow() {
    if (!selectedClientId) return;
    setSending(true);
    const res = await fetch("/api/emails/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: selectedClientId,
        subject,
        body,
        ai_detected_type: fallbackMode ? "manual" : detectedType,
        tone,
      }),
    });

    setSending(false);

    if (res.status === 402) {
      const data = await res.json();
      setStepError(data.error ?? "Email limit reached. Please upgrade your plan.");
      return;
    }

    if (!res.ok) {
      const data = await res.json();
      setStepError(data.error ?? "Failed to send email. Please try again.");
      return;
    }

    const data = await res.json();
    onSent(data.email_id);
  }

  async function handleSchedule(scheduledAt: string) {
    if (!selectedClientId) return;
    setScheduling(true);
    const res = await fetch("/api/emails/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: selectedClientId,
        subject,
        body,
        scheduled_at: scheduledAt,
        ai_detected_type: fallbackMode ? "manual" : detectedType,
        tone,
      }),
    });

    setScheduling(false);

    if (!res.ok) {
      const data = await res.json();
      setStepError(data.error ?? "Failed to schedule email.");
      return;
    }

    const data = await res.json();
    onScheduled(data.email_id, data.scheduled_at);
  }

  return (
    <div className="space-y-6">
      {/* Step indicators */}
      <div className="flex items-center gap-2 text-sm">
        {(["1", "2", "3"] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step === i + 1
                  ? "bg-blue-600 text-white"
                  : step > i + 1
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {step > i + 1 ? "✓" : s}
            </span>
            <span className={step === i + 1 ? "text-gray-900 font-medium" : "text-gray-400"}>
              {["Client & Input", "Type & Tone", "Preview & Send"][i]}
            </span>
            {i < 2 && <span className="text-gray-300">→</span>}
          </div>
        ))}
      </div>

      {stepError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {stepError}
        </div>
      )}

      {/* ── Step 1: Client + Input ── */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Client selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Send To <span className="text-red-500">*</span>
            </label>
            {clients.length === 0 ? (
              <p className="text-sm text-gray-500">
                No clients yet.{" "}
                <a href="/clients" className="text-blue-600 hover:underline">
                  Add a client first.
                </a>
              </p>
            ) : (
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a client…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.email}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Input method tabs */}
          <div>
            <div className="flex gap-2 mb-3">
              {(["text", "pdf"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setInputMethod(m)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                    inputMethod === m
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {m === "text" ? "Write a description" : "Upload PDF"}
                </button>
              ))}
            </div>

            {inputMethod === "text" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Describe what this email is about
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder='e.g. "Website design completed. Invoice for Rs. 15,000, payment due in 7 days."'
                />
              </div>
            ) : (
              <div>
                <PDFUpload
                  onExtracted={({ document_id, extracted_text }) => {
                    setDocumentId(document_id);
                    setInputText(extracted_text);
                    setPdfError(null);
                  }}
                  onError={(msg) => {
                    setPdfError(msg);
                    setInputMethod("text");
                  }}
                />
                {pdfError && (
                  <p className="mt-2 text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                    {pdfError}
                  </p>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              if (!selectedClientId) { setStepError("Please select a client."); return; }
              if (!inputText.trim()) { setStepError("Please describe the email or upload a PDF."); return; }
              setStepError(null);
              setStep(2);
            }}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Next: Choose Tone →
          </button>
        </div>
      )}

      {/* ── Step 2: Tone + Generate ── */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-600">
            <span className="font-medium">To:</span> {selectedClient?.name} ({selectedClient?.email})
          </div>

          <ToneSelector value={tone} onChange={setTone} />

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={detecting || generating}
              className="flex-1 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {detecting
                ? "Detecting type…"
                : generating
                ? "Generating email…"
                : "Generate Email →"}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Preview + Send ── */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-600 flex items-center justify-between">
            <span>
              <span className="font-medium">To:</span> {selectedClient?.name} ({selectedClient?.email})
            </span>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-blue-600 hover:underline"
            >
              Change
            </button>
          </div>

          <AIPreview
            detectedType={detectedType}
            subject={subject}
            body={body}
            tone={tone}
            fallbackMode={fallbackMode}
            regenerating={regenerating}
            onTypeChange={handleTypeChange}
            onSubjectChange={setSubject}
            onBodyChange={setBody}
            onRegenerate={handleRegenerate}
            onSendNow={handleSendNow}
            onSchedule={handleSchedule}
            sending={sending}
            scheduling={scheduling}
          />
        </div>
      )}
    </div>
  );
}
