"use client";

import type { Tone } from "@/types";

interface ToneSelectorProps {
  value: Tone;
  onChange: (tone: Tone) => void;
  isPro?: boolean;
}

const FREE_TONES: { value: Tone; label: string; desc: string }[] = [
  { value: "friendly",   label: "Friendly",   desc: "Warm & approachable" },
  { value: "formal",     label: "Formal",     desc: "Professional & structured" },
  { value: "strict",     label: "Strict",     desc: "Firm & direct" },
];

const PRO_TONES: { value: Tone; label: string; desc: string }[] = [
  { value: "urgent",     label: "Urgent",     desc: "Deadline-focused" },
  { value: "apologetic", label: "Apologetic", desc: "Sincere & empathetic" },
  { value: "persuasive", label: "Persuasive", desc: "Benefit-led & motivating" },
];

export default function ToneSelector({ value, onChange, isPro = false }: ToneSelectorProps) {
  const allTones = [...FREE_TONES, ...PRO_TONES];

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">Tone</p>
      <div className="grid grid-cols-3 gap-2">
        {allTones.map((t) => {
          const isProTone = PRO_TONES.some(pt => pt.value === t.value);
          const locked = isProTone && !isPro;
          const active = value === t.value;

          return (
            <button
              key={t.value}
              type="button"
              disabled={locked}
              onClick={() => !locked && onChange(t.value)}
              title={locked ? "Upgrade to Pro to unlock" : t.desc}
              className={`relative py-2 px-2 rounded-lg border text-sm font-medium transition-colors ${
                active
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : locked
                  ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              <span className="block text-xs">{t.label}</span>
              <span className="text-xs font-normal opacity-60 leading-tight block">{t.desc}</span>
              {locked && (
                <span
                  className="absolute top-1 right-1 text-xs leading-none"
                  style={{ color: "#a5b4fc" }}
                  aria-label="Pro feature"
                >
                  ⚡
                </span>
              )}
            </button>
          );
        })}
      </div>
      {!isPro && (
        <p className="mt-1.5 text-xs text-gray-400">
          ⚡ <a href="/profile" className="underline" style={{ color: "#6366f1" }}>Upgrade to Pro</a> to unlock Urgent, Apologetic & Persuasive tones.
        </p>
      )}
    </div>
  );
}
