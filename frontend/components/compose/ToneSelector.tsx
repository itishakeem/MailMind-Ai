"use client";

import type { Tone } from "@/types";

interface ToneSelectorProps {
  value: Tone;
  onChange: (tone: Tone) => void;
}

const TONES: { value: Tone; label: string; desc: string }[] = [
  { value: "friendly", label: "Friendly", desc: "Warm & approachable" },
  { value: "formal", label: "Formal", desc: "Professional & structured" },
  { value: "strict", label: "Strict", desc: "Firm & direct" },
];

export default function ToneSelector({ value, onChange }: ToneSelectorProps) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">Tone</p>
      <div className="flex gap-2">
        {TONES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
              value === t.value
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            }`}
          >
            <span className="block">{t.label}</span>
            <span className="text-xs font-normal opacity-70">{t.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
