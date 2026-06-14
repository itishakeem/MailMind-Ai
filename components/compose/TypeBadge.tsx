"use client";

import { useState } from "react";
import type { EmailType } from "@/types";

interface TypeBadgeProps {
  type: EmailType;
  onChange: (type: EmailType) => void;
}

const TYPE_CONFIG: Record<EmailType, { label: string; color: string }> = {
  invoice: { label: "Invoice", color: "bg-blue-100 text-blue-700 border-blue-200" },
  payment_reminder: { label: "Payment Reminder", color: "bg-orange-100 text-orange-700 border-orange-200" },
  project_update: { label: "Project Update", color: "bg-green-100 text-green-700 border-green-200" },
  proposal: { label: "Proposal", color: "bg-purple-100 text-purple-700 border-purple-200" },
  manual: { label: "Manual", color: "bg-gray-100 text-gray-600 border-gray-200" },
};

const SELECTABLE_TYPES: EmailType[] = [
  "invoice",
  "payment_reminder",
  "project_update",
  "proposal",
];

export default function TypeBadge({ type, onChange }: TypeBadgeProps) {
  const [open, setOpen] = useState(false);
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.manual;

  return (
    <div className="relative inline-block">
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}
        >
          {config.label}
        </span>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-xs text-gray-400 hover:text-blue-600 underline"
        >
          Wrong? Change
        </button>
      </div>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-48">
            {SELECTABLE_TYPES.map((t) => {
              const c = TYPE_CONFIG[t];
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    onChange(t);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                    t === type ? "font-medium" : ""
                  }`}
                >
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      c.color.split(" ")[0].replace("bg-", "bg-")
                    }`}
                  />
                  {c.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
