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

export type ProviderFailureCode = "input_limit" | "authentication" | "credits" | "rate_limit" | "timeout" | "invalid_output" | "service_error";
export function providerFailureCode(error: unknown): ProviderFailureCode {
  if (error instanceof ProviderStageError) return error.code;
  if (error instanceof UnsentRequest) return "input_limit";
  if (error instanceof ProviderError) return error.status === 401 || error.status === 403 ? "authentication" : error.status === 402 ? "credits" : error.status === 429 ? "rate_limit" : "service_error";
  const name = error instanceof Error ? error.name : "";
  return name === "TimeoutError" || name === "AbortError" ? "timeout" : name === "ZodError" ? "invalid_output" : "service_error";
}

// Stage information is safe to persist; upstream bodies and credentials are excluded.
export class ProviderStageError extends Error {
  readonly stage: "preflight" | "generation" | "receipt";
  readonly code: ProviderFailureCode;
  readonly definitiveRejection: boolean;
  readonly status?: number;
  readonly transportPhase?: "headers" | "body";
  constructor(stage: ProviderStageError["stage"], error: unknown, transportPhase?: ProviderStageError["transportPhase"]) {
    super(`Gemini ${stage} unavailable.`);
    this.name = "ProviderStageError";
    this.stage = stage;
    this.transportPhase = transportPhase;
    this.code = providerFailureCode(error);
    this.status = error instanceof ProviderError ? error.status : undefined;
    this.definitiveRejection = stage === "preflight" || error instanceof UnsentRequest || error instanceof ProviderError && error.definitiveRejection;
  }
}

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
