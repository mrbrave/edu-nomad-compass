// Deployment replaces the hash marker, never a plaintext credential.
// This bridge authenticates its own server credential; Supabase JWT validation is disabled only for this function.
declare const Deno: { env: { get(name: string): string | undefined }; serve(handler: (request: Request) => Promise<Response>): void };
const secretHash = "__STUDIO_LEDGER_AUTH_HASH__";
const allowed = new Set(["snapshot", "recover", "admit", "start_attempt", "settle_attempt", "reject_attempt", "save_evaluation", "fail_operation", "commit_reply", "commit_assessment"]);

export async function handler(request: Request): Promise<Response> {
  const reply = (value: unknown, status = 200) => Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
  if (request.method !== "POST") return reply({ error: "method_not_allowed" }, 405);
  const token = request.headers.get("Authorization")?.replace(/^Bearer /, "") ?? "";
  if (token.length < 40 || token.length > 200) return reply({ error: "unauthorised" }, 401);
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token))), n => n.toString(16).padStart(2, "0")).join("");
  let diff = digest.length ^ secretHash.length;
  for (let i = 0; i < digest.length; i++) diff |= digest.charCodeAt(i) ^ (secretHash.charCodeAt(i) || 0);
  if (diff !== 0) return reply({ error: "unauthorised" }, 401);
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).length > 1500000) return reply({ error: "request_too_large" }, 413);
    const { action, payload, workspace } = JSON.parse(text);
    if (!allowed.has(action) || !["production", "preview", "development"].includes(workspace) || !payload || typeof payload !== "object" || Array.isArray(payload)) return reply({ error: "invalid_request" }, 400);
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const url = Deno.env.get("SUPABASE_URL");
    if (!serviceKey || !url) return reply({ error: "ledger_unavailable" }, 503);
    const result = await fetch(`${url}/rest/v1/rpc/compass_ledger`, { method: "POST", headers: { "Content-Type": "application/json", apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, body: JSON.stringify({ action, payload, workspace }), signal: AbortSignal.timeout(12000) });
    if (!result.ok) return reply({ error: "ledger_unavailable" }, 503);
    return reply(await result.json());
  } catch { return reply({ error: "ledger_unavailable" }, 503); }
}

Deno.serve(handler);
