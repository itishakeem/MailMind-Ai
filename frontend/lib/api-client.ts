import type { PlanLimitError } from "@/types";

interface ApiOptions extends RequestInit {
  json?: unknown;
}

export interface ApiError {
  status: number;
  message: string;
  planLimit?: PlanLimitError;
}

// Thin fetch wrapper for all client-side API calls.
// • Serialises JSON bodies automatically.
// • On 402: dispatches "plan-limit-reached" event (caught by UpgradePrompt).
// • On 401: redirects to /auth/login.
// • Returns parsed JSON or throws ApiError.
export async function apiFetch<T = unknown>(
  url: string,
  options: ApiOptions = {}
): Promise<T> {
  const { json, ...rest } = options;

  const headers: Record<string, string> = {
    ...(rest.headers as Record<string, string> | undefined),
  };

  let body: BodyInit | undefined = rest.body ?? undefined;
  if (json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  }

  const res = await fetch(url, { ...rest, headers, body });

  // Unauthorised — redirect to login
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      window.location.href = "/auth/login";
    }
    throw { status: 401, message: "Session expired. Please sign in again." } as ApiError;
  }

  // Plan limit — fire global event for UpgradePrompt
  if (res.status === 402) {
    const data = await res.json().catch(() => ({})) as PlanLimitError;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("plan-limit-reached", { detail: data }));
    }
    throw { status: 402, message: data.error ?? "Plan limit reached.", planLimit: data } as ApiError;
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw {
      status: res.status,
      message: (data as { error?: string })?.error ?? `Request failed (${res.status})`,
    } as ApiError;
  }

  return data as T;
}
