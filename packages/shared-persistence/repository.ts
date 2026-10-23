import type { OperationStore } from "../dual-ai-core/contracts.ts";
import { StudioError } from "../dual-ai-core/orchestrator.ts";

export function environmentWorkspace(env: Record<string, string | undefined> = process.env) {
  return env.VERCEL_ENV === "production" ? "production" : env.VERCEL_ENV === "preview" ? "preview" : "development";
}

export function repository(env: Record<string, string | undefined> = process.env, fetcher: typeof fetch = fetch): OperationStore {
  return { async call<T>(action: string, payload: Record<string, unknown>): Promise<T> {
    if (!env.STUDIO_LEDGER_URL || !env.STUDIO_LEDGER_TOKEN) throw new StudioError("misconfigured", 503);
    const url = new URL(env.STUDIO_LEDGER_URL);
    if (url.protocol !== "https:" || url.username || url.password) throw new StudioError("misconfigured", 503);
    const response = await fetcher(url, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.STUDIO_LEDGER_TOKEN}` }, body: JSON.stringify({ action, payload, workspace: environmentWorkspace(env) }), redirect: "error", cache: "no-store", signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new StudioError("ledger_unavailable", 503);
    const data = await response.json();
    if (data?.error) throw new StudioError(String(data.error), data.error === "credits_exhausted" ? 402 : data.error === "ledger_unavailable" ? 503 : 409);
    return data as T;
  } };
}
