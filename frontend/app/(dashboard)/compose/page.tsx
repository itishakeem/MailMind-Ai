"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { CheckCircle2, Clock } from "lucide-react";
import ComposeWizard from "@/components/compose/ComposeWizard";

const gradientBtn: React.CSSProperties = {
  background: "linear-gradient(135deg,#2563eb,#4f46e5)",
  boxShadow: "0 4px 14px rgba(79,70,229,0.35)",
};

function ComposePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialClientId = searchParams.get("clientId") ?? undefined;
  const [result, setResult] = useState<
    | { type: "sent"; emailId: string }
    | { type: "scheduled"; emailId: string; scheduledAt: string }
    | null
  >(null);

  if (result) {
    const isSent = result.type === "sent";
    return (
      <div className="max-w-xl mx-auto text-center py-16 space-y-4 animate-fade-in-up">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
          style={{ background: isSent ? "rgba(34,197,94,0.12)" : "rgba(79,70,229,0.12)" }}
        >
          {isSent
            ? <CheckCircle2 className="w-8 h-8" style={{ color: "#22c55e" }} />
            : <Clock        className="w-8 h-8" style={{ color: "#818cf8" }} />
          }
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900">
          {isSent ? "Email Sent!" : "Email Scheduled!"}
        </h2>
        <p className="text-gray-500 text-sm leading-relaxed">
          {isSent
            ? "Your email has been sent from your Gmail account."
            : `Your email will be delivered on ${new Date(result.scheduledAt).toLocaleString("en-PK", {
                dateStyle: "medium",
                timeStyle: "short",
              })}.`}
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={() => setResult(null)}
            className="px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:-translate-y-0.5"
            style={gradientBtn}
          >
            Compose Another
          </button>
          <button
            onClick={() => router.push("/clients")}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            View Clients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-extrabold text-gray-900">Compose Email</h1>
        <p className="mt-1 text-sm text-gray-500">
          Let AI generate a professional email from your description or PDF.
        </p>
      </div>
      <div
        className="animate-fade-in-up bg-white rounded-2xl p-6"
        style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", animationDelay: "80ms" }}
      >
        <ComposeWizard
          initialClientId={initialClientId}
          onSent={(emailId) => setResult({ type: "sent", emailId })}
          onScheduled={(emailId, scheduledAt) =>
            setResult({ type: "scheduled", emailId, scheduledAt })
          }
        />
      </div>
    </div>
  );
}

export default function ComposePage() {
  return (
    <Suspense>
      <ComposePageInner />
    </Suspense>
  );
}
