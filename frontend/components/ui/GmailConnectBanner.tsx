"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function GmailConnectBanner() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    fetch("/api/gmail/status")
      .then((r) => r.json())
      .then((d) => setShow(!d.connected))
      .catch(() => {});
  }, [dismissed]);

  if (!show || dismissed) return null;

  return (
    <div className="mb-5 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
      <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
      <div className="flex-1 text-sm text-amber-800">
        <span className="font-medium">Gmail not connected.</span> Connect your Gmail account
        to start sending emails from your own address.
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/api/gmail/connect"
          className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
        >
          Connect Gmail
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-500 hover:text-amber-700"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
