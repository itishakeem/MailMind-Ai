"use client";

import { User, Bot } from "lucide-react";

interface AgentMessageProps {
  role: "user" | "assistant";
  content: string;
}

export default function AgentMessage({ role, content }: AgentMessageProps) {
  const isUser = role === "user";
  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
          isUser ? "bg-cyan-600" : "bg-slate-700"
        }`}
      >
        {isUser ? (
          <User size={13} className="text-white" />
        ) : (
          <Bot size={13} className="text-cyan-300" />
        )}
      </div>
      <div
        className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? "bg-cyan-600 text-white rounded-tr-sm"
            : "bg-slate-700 text-slate-100 rounded-tl-sm"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{content}</p>
      </div>
    </div>
  );
}
