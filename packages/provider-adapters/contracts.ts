export interface UsageReceipt {
  provider: "typesafe" | "gemini";
  model: string;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  responseId?: string;
  nativeUsage: Record<string, unknown>;
}

export interface ProviderResult<T = unknown> { output: T; receipt: UsageReceipt }

// The adapter can prove no generation/evaluation request was sent.
export class UnsentRequest extends Error {}

// Only a documented rejection proves that a request did not start generation.
export class ProviderError extends Error {
  readonly provider: string;
  readonly status?: number;
  constructor(provider: string, status?: number) {
    super(`${provider} request unavailable${status ? ` (${status})` : ""}.`);
    this.provider = provider; this.status = status;
    this.name = "ProviderError";
  }
  get definitiveRejection() { return [400, 401, 402, 403, 404, 413, 422, 429].includes(this.status ?? 0); }
}

export function serverKey(name: string, env: Record<string, string | undefined> = process.env) {
  const value = env[name]?.trim();
  if (!value || /^(replace[-_ ]?me|placeholder|your[-_ ])/i.test(value)) throw new Error(`Studio provider configuration is incomplete.`);
  return value;
}

export async function readProviderJson(response: Response, provider: string) {
  if (!response.ok) throw new ProviderError(provider, response.status);
  const text = await response.text();
  if (Buffer.byteLength(text, "utf8") > 500000) throw new ProviderError(provider);
  try { return JSON.parse(text) as unknown; } catch { throw new ProviderError(provider); }
}
