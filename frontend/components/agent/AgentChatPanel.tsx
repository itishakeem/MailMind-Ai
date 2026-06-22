"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, X, Send, Download } from "lucide-react";
import AgentMessage from "./AgentMessage";
import ConfirmActionCard from "./ConfirmActionCard";
import EmailDraftCard from "./EmailDraftCard";
import UpdateClientCard from "./UpdateClientCard";
import type { User } from "@/types";
import type {
  ConversationMessage,
  PendingAction,
  AgentResponse,
  AgentChatRequest,
  AgentReportResponse,
} from "@/lib/agent/types";

const MAX_HISTORY    = 10;
const FREE_DAILY_MSG = 10;

interface PendingReport {
  base64: string;
  filename: string;
  content: string;
}

export default function AgentChatPanel({ user }: { user: User }) {
  const [isOpen,        setIsOpen]        = useState(false);
  const [messages,      setMessages]      = useState<ConversationMessage[]>([]);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [pendingReport, setPendingReport] = useState<PendingReport | null>(null);
  const [isLoading,     setIsLoading]     = useState(false);
  const [input,         setInput]         = useState("");
  const [msgsUsed,      setMsgsUsed]      = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingAction, pendingReport, isLoading]);

  const callAgent = useCallback(
    async (
      newUserMessage: string | null,
      pendingPayload?: { action: PendingAction; confirmed: boolean }
    ) => {
      const userMsg: ConversationMessage | null = newUserMessage
        ? { role: "user", content: newUserMessage }
        : null;

      const history = (userMsg ? [...messages, userMsg] : messages).slice(-MAX_HISTORY);

      if (userMsg) setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setPendingReport(null);

      const requestBody: AgentChatRequest = {
        messages: history,
        pendingAction: pendingPayload ?? null,
      };

      let data: AgentResponse;
      try {
        const res = await fetch("/api/agent/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });
        if (!res.ok) {
          const errJson = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(errJson.error ?? `HTTP ${res.status}`);
        }
        data = (await res.json()) as AgentResponse;
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Something went wrong — ${(err as Error).message}. Please try again.` },
        ]);
        setIsLoading(false);
        return;
      }

      setIsLoading(false);

      if (data.type === "text" || data.type === "action_result") {
        setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
        setPendingAction(null);
        if (!pendingPayload && user.plan === "free") {
          setMsgsUsed((n) => Math.min(n + 1, FREE_DAILY_MSG));
        }
      } else if (data.type === "clarification") {
        const list = data.options.map((o, i) => `${i + 1}. ${o.name} (${o.email})`).join("\n");
        setMessages((prev) => [...prev, { role: "assistant", content: `${data.content}\n\n${list}` }]);
        setPendingAction(null);
      } else if (data.type === "confirmation") {
        setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
        setPendingAction(data.pendingAction);
        if (!pendingPayload && user.plan === "free") {
          setMsgsUsed((n) => Math.min(n + 1, FREE_DAILY_MSG));
        }
      } else if (data.type === "report") {
        const r = data as AgentReportResponse;
        setMessages((prev) => [...prev, { role: "assistant", content: r.content }]);
        setPendingReport({ base64: r.pdf.base64, filename: r.pdf.filename, content: r.content });
        if (!pendingPayload && user.plan === "free") {
          setMsgsUsed((n) => Math.min(n + 1, FREE_DAILY_MSG));
        }
      }
    },
    [messages, user.plan]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    void callAgent(text);
  };

  const handleConfirm = useCallback(
    (confirmed: boolean) => {
      if (!pendingAction) return;
      const action = pendingAction;
      setPendingAction(null);
      void callAgent(confirmed ? "Confirmed." : "Cancelled.", { action, confirmed });
    },
    [pendingAction, callAgent]
  );

  function handleDownloadReport() {
    if (!pendingReport) return;
    const bytes  = Uint8Array.from(atob(pendingReport.base64), (c) => c.charCodeAt(0));
    const blob   = new Blob([bytes], { type: "application/pdf" });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement("a");
    a.href       = url;
    a.download   = pendingReport.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const isFree         = user.plan === "free";
  const msgsRemaining  = Math.max(0, FREE_DAILY_MSG - msgsUsed);
  const atLimit        = isFree && msgsRemaining === 0;

  return (
    <>
      {/* Floating toggle button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-cyan-600 hover:bg-cyan-500 shadow-lg shadow-cyan-900/40 flex items-center justify-center transition-colors"
          aria-label="Open MailMind Assistant"
        >
          <MessageSquare size={20} className="text-white" />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[580px] rounded-2xl border border-slate-700 bg-[#0f172a] shadow-2xl shadow-black/60 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/80 bg-slate-900">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
              <span className="text-sm font-semibold text-slate-100">Alex — MailMind AI</span>
              {isFree ? (
                <span className="text-[10px] font-medium text-slate-400 bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded-full">
                  {msgsRemaining}/{FREE_DAILY_MSG} msgs
                </span>
              ) : (
                <span className="text-[10px] font-medium text-cyan-300 bg-cyan-900/50 border border-cyan-800/60 px-1.5 py-0.5 rounded-full">
                  {user.plan === "pro" ? "Pro" : "Business"}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-500 hover:text-slate-300 transition-colors p-0.5 rounded"
              aria-label="Close assistant"
            >
              <X size={15} />
            </button>
          </div>

          {/* Message list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && !isLoading && (
              <div className="text-center text-slate-500 text-xs mt-8 space-y-2 px-4">
                <p className="text-slate-400 font-medium text-sm">Hi, I&apos;m Alex!</p>
                <p className="leading-relaxed">
                  I can manage your clients and send emails. Just describe what you need — in any language.
                </p>
                <div className="flex flex-col gap-1 mt-3 text-slate-600">
                  <p className="italic">&ldquo;Add Sara Ali, sara@agency.com&rdquo;</p>
                  <p className="italic">&ldquo;Update Ahmed&apos;s phone to +923001234567&rdquo;</p>
                  <p className="italic">&ldquo;Email Ahmed about the invoice&rdquo;</p>
                  <p className="italic">&ldquo;Generate a 7-day report&rdquo;</p>
                </div>
                {isFree && (
                  <p className="text-slate-600 mt-3 text-[10px]">
                    Free plan · {FREE_DAILY_MSG} messages per 24 hrs
                  </p>
                )}
              </div>
            )}

            {messages.map((msg, i) => (
              <AgentMessage key={i} role={msg.role} content={msg.content} />
            ))}

            {/* Update client confirmation */}
            {pendingAction?.type === "update_client" && !isLoading && (
              <UpdateClientCard
                client={pendingAction.client}
                updates={pendingAction.updates}
                onConfirm={handleConfirm}
                isLoading={isLoading}
              />
            )}

            {/* Remove client confirmation */}
            {pendingAction?.type === "remove_client" && !isLoading && (
              <ConfirmActionCard
                title="Remove Client"
                description={`Permanently remove ${pendingAction.client.name} from your clients.`}
                details={[
                  { label: "Name",  value: pendingAction.client.name },
                  { label: "Email", value: pendingAction.client.email },
                  ...(pendingAction.client.company
                    ? [{ label: "Company", value: pendingAction.client.company }]
                    : []),
                ]}
                onConfirm={handleConfirm}
                isLoading={isLoading}
              />
            )}

            {/* Send email draft */}
            {pendingAction?.type === "send_email" && !isLoading && (
              <EmailDraftCard
                to={pendingAction.client}
                subject={pendingAction.draft.subject}
                body={pendingAction.draft.body}
                onConfirm={handleConfirm}
                isLoading={isLoading}
              />
            )}

            {/* Report download button */}
            {pendingReport && !isLoading && (
              <div className="rounded-xl border border-slate-600 bg-slate-800 p-3 flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-xs font-medium text-slate-200">{pendingReport.filename}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">PDF Report · Ready to download</p>
                </div>
                <button
                  onClick={handleDownloadReport}
                  className="flex items-center gap-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium px-3 py-2 transition-colors"
                >
                  <Download size={12} />
                  Download
                </button>
              </div>
            )}

            {/* Loading dots */}
            {isLoading && (
              <div className="flex gap-2 items-start">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center">
                  <span className="text-cyan-300 text-[11px] font-bold">A</span>
                </div>
                <div className="bg-slate-700 rounded-2xl rounded-tl-sm px-3 py-2.5">
                  <div className="flex gap-1 items-center h-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-slate-700/80 p-3 flex gap-2 bg-slate-900"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading || atLimit}
              placeholder={
                atLimit
                  ? "Daily limit reached — resets in 24 hrs"
                  : "Type in any language…"
              }
              className="flex-1 bg-slate-800 text-slate-100 text-sm rounded-lg px-3 py-2 placeholder-slate-600 border border-slate-700 focus:outline-none focus:border-cyan-600 disabled:opacity-50 transition-colors"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim() || atLimit}
              aria-label="Send"
              className="w-9 h-9 flex-shrink-0 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
