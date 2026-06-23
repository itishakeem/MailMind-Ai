"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, X, Send, Download, History, Plus, Trash2, ChevronLeft } from "lucide-react";
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
const SESSIONS_KEY   = "mailmind_chat_sessions";
const MAX_SESSIONS   = 20;

interface PendingReport {
  base64: string;
  filename: string;
}

interface ChatSession {
  id: string;
  name: string;
  messages: ConversationMessage[];
  updatedAt: number;
}

function loadSessions(): ChatSession[] {
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY) ?? "[]") as ChatSession[];
  } catch {
    return [];
  }
}

function saveSessions(sessions: ChatSession[]) {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS)));
  } catch { /* storage full */ }
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 2)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

export default function AgentChatPanel({ user }: { user: User }) {
  const [isOpen,        setIsOpen]        = useState(false);
  const [dismissed,     setDismissed]     = useState(false);
  const [showSessions,  setShowSessions]  = useState(false);
  const [sessions,      setSessions]      = useState<ChatSession[]>([]);
  const [currentId,     setCurrentId]     = useState<string | null>(null);
  const [messages,      setMessages]      = useState<ConversationMessage[]>([]);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [pendingReport, setPendingReport] = useState<PendingReport | null>(null);
  const [isLoading,     setIsLoading]     = useState(false);
  const [input,         setInput]         = useState("");
  const [msgsUsed,      setMsgsUsed]      = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setSessions(loadSessions()); }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingAction, pendingReport, isLoading]);

  useEffect(() => {
    if (!currentId || messages.length === 0) return;
    setSessions(prev => {
      const updated = prev.map(s =>
        s.id === currentId ? { ...s, messages, updatedAt: Date.now() } : s
      );
      saveSessions(updated);
      return updated;
    });
  }, [messages, currentId]);

  function startNewSession() {
    setMessages([]);
    setPendingAction(null);
    setPendingReport(null);
    setCurrentId(null);
    setShowSessions(false);
  }

  function loadSession(session: ChatSession) {
    setMessages(session.messages);
    setCurrentId(session.id);
    setPendingAction(null);
    setPendingReport(null);
    setShowSessions(false);
  }

  function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== id);
      saveSessions(updated);
      return updated;
    });
    if (currentId === id) startNewSession();
  }

  const callAgent = useCallback(
    async (
      newUserMessage: string | null,
      pendingPayload?: { action: PendingAction; confirmed: boolean }
    ) => {
      const userMsg: ConversationMessage | null = newUserMessage
        ? { role: "user", content: newUserMessage }
        : null;

      const history = (userMsg ? [...messages, userMsg] : messages).slice(-MAX_HISTORY);

      if (userMsg) {
        if (!currentId && !pendingPayload) {
          const newSession: ChatSession = {
            id:        Date.now().toString(),
            name:      newUserMessage!.slice(0, 50),
            messages:  [userMsg],
            updatedAt: Date.now(),
          };
          setCurrentId(newSession.id);
          setSessions(prev => {
            const updated = [newSession, ...prev];
            saveSessions(updated);
            return updated;
          });
        }
        setMessages(prev => [...prev, userMsg]);
      }

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
          throw new Error(errJson.error ?? (res.status === 401 ? "Session expired — please refresh the page." : `HTTP ${res.status}`));
        }
        data = (await res.json()) as AgentResponse;
      } catch (err) {
        setMessages(prev => [
          ...prev,
          { role: "assistant", content: `Something went wrong — ${(err as Error).message}. Please try again.` },
        ]);
        setIsLoading(false);
        return;
      }

      setIsLoading(false);

      if (data.type === "text" || data.type === "action_result") {
        setMessages(prev => [...prev, { role: "assistant", content: data.content }]);
        setPendingAction(null);
        if (!pendingPayload && user.plan === "free") setMsgsUsed(n => Math.min(n + 1, FREE_DAILY_MSG));
      } else if (data.type === "clarification") {
        const list = data.options.map((o, i) => `${i + 1}. ${o.name} (${o.email})`).join("\n");
        setMessages(prev => [...prev, { role: "assistant", content: `${data.content}\n\n${list}` }]);
        setPendingAction(null);
      } else if (data.type === "confirmation") {
        setMessages(prev => [...prev, { role: "assistant", content: data.content }]);
        setPendingAction(data.pendingAction);
        if (!pendingPayload && user.plan === "free") setMsgsUsed(n => Math.min(n + 1, FREE_DAILY_MSG));
      } else if (data.type === "report") {
        const r = data as AgentReportResponse;
        setMessages(prev => [...prev, { role: "assistant", content: r.content }]);
        setPendingReport({ base64: r.pdf.base64, filename: r.pdf.filename });
        if (!pendingPayload && user.plan === "free") setMsgsUsed(n => Math.min(n + 1, FREE_DAILY_MSG));
      }
    },
    [messages, currentId, user.plan]
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
    const bytes = Uint8Array.from(atob(pendingReport.base64), c => c.charCodeAt(0));
    const blob  = new Blob([bytes], { type: "application/pdf" });
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement("a");
    a.href      = url;
    a.download  = pendingReport.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const isFree        = user.plan === "free";
  const msgsRemaining = Math.max(0, FREE_DAILY_MSG - msgsUsed);
  const atLimit       = isFree && msgsRemaining === 0;

  return (
    <>
      {/* ── Floating trigger button ───────────────────────────────────────── */}
      {!isOpen && !dismissed && (
        <div className="fixed bottom-5 right-5 z-50 group">
          <button
            onClick={() => setIsOpen(true)}
            className="w-11 h-11 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            style={{ background: "linear-gradient(135deg, var(--a-from), var(--a-to))", boxShadow: "0 4px 16px var(--a-glow)" }}
            aria-label="Open Alex"
          >
            <MessageSquare size={18} className="text-white" />
          </button>
          {/* Dismiss badge — visible on hover */}
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss Alex"
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-700 border border-slate-600 text-slate-400 hover:text-white hover:bg-slate-600 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center shadow-sm"
          >
            <X size={9} />
          </button>
        </div>
      )}

      {/* Re-show button if dismissed */}
      {!isOpen && dismissed && (
        <button
          onClick={() => { setDismissed(false); setIsOpen(true); }}
          className="fixed bottom-5 right-5 z-50 px-3 py-1.5 rounded-full text-[11px] font-medium text-slate-400 bg-slate-800 border border-slate-700 hover:text-slate-200 hover:border-slate-600 transition-all shadow-lg"
        >
          Show Alex
        </button>
      )}

      {/* ── Chat panel ───────────────────────────────────────────────────────── */}
      {isOpen && (
        <div className="fixed z-50 flex flex-col overflow-hidden bg-[#0f172a]
          inset-0 rounded-none
          sm:inset-auto sm:bottom-5 sm:right-5 sm:w-[340px] sm:h-[520px] sm:rounded-2xl
          border border-slate-700 shadow-2xl shadow-black/60"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-700/80 bg-slate-900 flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              {showSessions ? (
                <button
                  onClick={() => setShowSessions(false)}
                  className="p-1 -ml-1 rounded text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label="Back to chat"
                >
                  <ChevronLeft size={14} />
                </button>
              ) : (
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "var(--a-text)", boxShadow: "0 0 6px var(--a-glow)" }} />
              )}
              <span className="text-xs font-semibold text-slate-100 truncate">
                {showSessions ? "Chat History" : "Alex · MailMind AI"}
              </span>
              {!showSessions && (
                isFree ? (
                  <span className="flex-shrink-0 text-[10px] font-medium text-slate-400 bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded-full">
                    {msgsRemaining}/{FREE_DAILY_MSG}
                  </span>
                ) : (
                  <span
                    className="flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                    style={{ color: "var(--a-text)", background: "var(--a-bg)", border: "1px solid var(--a-bd)" }}
                  >
                    {user.plan === "pro" ? "Pro" : "Business"}
                  </span>
                )
              )}
            </div>

            <div className="flex items-center gap-0.5 flex-shrink-0">
              {!showSessions && (
                <button onClick={startNewSession} title="New chat" className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors">
                  <Plus size={13} />
                </button>
              )}
              <button
                onClick={() => setShowSessions(v => !v)}
                title="Chat history"
                className={`p-1.5 rounded-lg transition-colors ${showSessions ? "text-slate-200 bg-slate-700" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"}`}
              >
                <History size={13} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* ── Sessions panel ───────────────────────────────────────────────── */}
          {showSessions ? (
            <div className="flex-1 overflow-y-auto">
              <div className="p-2.5 border-b border-slate-800">
                <button
                  onClick={startNewSession}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors border border-slate-700"
                >
                  <Plus size={13} />
                  New chat
                </button>
              </div>

              {sessions.length === 0 ? (
                <div className="text-center text-slate-600 text-xs py-10 px-4">
                  <History size={24} className="mx-auto mb-2 opacity-30" />
                  <p>No previous sessions yet.</p>
                  <p className="mt-1 text-[10px] opacity-70">Your chats are saved automatically.</p>
                </div>
              ) : (
                <div className="p-2 space-y-0.5">
                  {sessions.map(s => (
                    <div
                      key={s.id}
                      onClick={() => loadSession(s)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all group ${
                        currentId === s.id ? "bg-slate-700" : "hover:bg-slate-800/70"
                      }`}
                    >
                      <MessageSquare size={12} className="text-slate-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-slate-300 truncate leading-tight">{s.name}</p>
                        <p className="text-[10px] text-slate-600 mt-0.5">{timeAgo(s.updatedAt)}</p>
                      </div>
                      <button
                        onClick={e => deleteSession(s.id, e)}
                        title="Delete"
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded text-slate-600 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* ── Message list ─────────────────────────────────────────────── */}
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
                {messages.length === 0 && !isLoading && (
                  <div className="text-center text-slate-500 text-xs mt-6 space-y-2 px-2">
                    <p className="text-slate-400 font-semibold text-sm">Hi, I&apos;m Alex!</p>
                    <p className="text-slate-500 leading-relaxed text-[11px]">
                      I manage your clients and emails. Try:
                    </p>
                    <div className="flex flex-col gap-1 mt-2 text-slate-600 text-[11px] text-left bg-slate-800/50 rounded-xl p-2.5 space-y-1">
                      <p className="italic">&ldquo;Show my scheduled emails&rdquo;</p>
                      <p className="italic">&ldquo;Reschedule the invoice email to tomorrow 3pm&rdquo;</p>
                      <p className="italic">&ldquo;Cancel the email to Ahmed&rdquo;</p>
                      <p className="italic">&ldquo;Add Sara Ali, sara@agency.com&rdquo;</p>
                      <p className="italic">&ldquo;Email Ahmed about payment&rdquo;</p>
                    </div>
                    {isFree && (
                      <p className="text-slate-700 mt-2 text-[10px]">
                        Free · {FREE_DAILY_MSG} messages / 24 hrs
                      </p>
                    )}
                  </div>
                )}

                {messages.map((msg, i) => (
                  <AgentMessage key={i} role={msg.role} content={msg.content} />
                ))}

                {/* ── Pending action cards ──────────────────────────────────── */}

                {pendingAction?.type === "update_client" && !isLoading && (
                  <UpdateClientCard
                    client={pendingAction.client}
                    updates={pendingAction.updates}
                    onConfirm={handleConfirm}
                    isLoading={isLoading}
                  />
                )}

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
                    confirmLabel="Yes, Remove"
                    confirmVariant="danger"
                    loadingLabel="Removing…"
                    onConfirm={handleConfirm}
                    isLoading={isLoading}
                  />
                )}

                {pendingAction?.type === "send_email" && !isLoading && (
                  <EmailDraftCard
                    to={pendingAction.client}
                    subject={pendingAction.draft.subject}
                    body={pendingAction.draft.body}
                    onConfirm={handleConfirm}
                    isLoading={isLoading}
                  />
                )}

                {pendingAction?.type === "reschedule_email" && !isLoading && (
                  <ConfirmActionCard
                    title="Reschedule Email"
                    description={`Update the send time for this scheduled email.`}
                    details={[
                      { label: "Subject", value: pendingAction.email.subject },
                      { label: "To",      value: pendingAction.email.client_name },
                      { label: "From",    value: new Date(pendingAction.email.old_scheduled_at).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" }) },
                      { label: "To",      value: new Date(pendingAction.new_scheduled_at).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" }) },
                    ]}
                    confirmLabel="Yes, Reschedule"
                    confirmVariant="primary"
                    loadingLabel="Rescheduling…"
                    onConfirm={handleConfirm}
                    isLoading={isLoading}
                  />
                )}

                {pendingAction?.type === "cancel_scheduled_email" && !isLoading && (
                  <ConfirmActionCard
                    title="Cancel Scheduled Email"
                    description="This email will not be sent."
                    details={[
                      { label: "Subject", value: pendingAction.email.subject },
                      { label: "To",      value: pendingAction.email.client_name },
                      { label: "Was due", value: new Date(pendingAction.email.scheduled_at).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" }) },
                    ]}
                    confirmLabel="Yes, Cancel Email"
                    confirmVariant="danger"
                    loadingLabel="Cancelling…"
                    onConfirm={handleConfirm}
                    isLoading={isLoading}
                  />
                )}

                {/* PDF report download */}
                {pendingReport && !isLoading && (
                  <div className="rounded-xl border border-slate-600 bg-slate-800 p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-200 truncate">{pendingReport.filename}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">PDF Report · Ready</p>
                    </div>
                    <button
                      onClick={handleDownloadReport}
                      className="flex-shrink-0 flex items-center gap-1.5 rounded-lg text-white text-xs font-medium px-2.5 py-1.5 transition-colors"
                      style={{ background: "linear-gradient(135deg, var(--a-from), var(--a-to))" }}
                    >
                      <Download size={11} />
                      Download
                    </button>
                  </div>
                )}

                {/* Typing indicator */}
                {isLoading && (
                  <div className="flex gap-2 items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center">
                      <span className="text-[10px] font-bold" style={{ color: "var(--a-text)" }}>A</span>
                    </div>
                    <div className="bg-slate-700 rounded-2xl rounded-tl-sm px-3 py-2">
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

              {/* ── Input bar ────────────────────────────────────────────────── */}
              <form
                onSubmit={handleSubmit}
                className="border-t border-slate-700/80 px-2.5 py-2 flex gap-2 bg-slate-900 flex-shrink-0"
              >
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  disabled={isLoading || atLimit}
                  placeholder={atLimit ? "Daily limit reached — resets in 24 hrs" : "Message Alex…"}
                  className="flex-1 bg-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2 placeholder-slate-600 border border-slate-700 focus:outline-none disabled:opacity-50 transition-colors"
                  onFocus={e => (e.currentTarget.style.borderColor = "var(--a-to)")}
                  onBlur={e  => (e.currentTarget.style.borderColor  = "rgb(51 65 85)")}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim() || atLimit}
                  aria-label="Send"
                  className="w-8 h-8 flex-shrink-0 rounded-lg self-center disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                  style={{ background: "linear-gradient(135deg, var(--a-from), var(--a-to))" }}
                >
                  <Send size={13} />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
