import type { UsageReceipt } from "../provider-adapters/contracts.ts";

export interface RateCard {
  version: string; provider: "gemini" | "typesafe"; model: string;
  // USD nanodollars per token. One USD = 1,000,000,000 nanodollars.
  input: number; cachedInput: number; output: number; reasoning: number;
}

export function registry(env: Record<string, string | undefined> = process.env, now = new Date()) {
  if ((env.EVALUATOR_PROVIDER ?? "typesafe") !== "typesafe" || (env.GENERATOR_PROVIDER ?? "gemini") !== "gemini" || (env.EVALUATOR_MODEL ?? "jev-1.14.0") !== "jev-1.14.0" || (env.GENERATOR_MODEL ?? "gemini-3.8-flash") !== "gemini-3.8-flash" || (env.GENERATOR_BILLING_TIER ?? "paid") !== "paid") throw new Error("Studio model or rate configuration is unsupported.");
  // Verified standard text pricing. No grounding, batch, explicit cache or tools.
  const changed = now >= new Date("2027-01-01T00:00:00Z");
  const evaluator: RateCard = { version: "typesafe-2026-10-23", provider: "typesafe", model: "jev-1.14.0", input: 42, cachedInput: 42, output: 0, reasoning: 0 };
  const generator: RateCard = { version: changed ? "gemini-standard-2027-01-01" : "gemini-standard-2026-10-23", provider: "gemini", model: "gemini-3.8-flash", input: changed ? 1500 : 750, cachedInput: changed ? 150 : 75, output: changed ? 7500 : 3750, reasoning: changed ? 7500 : 3750 };
  return { evaluator, generator, adapterVersion: "direct-rest-v2", schemaVersion: "1" };
}

export function costOf(usage: UsageReceipt, rate: RateCard): string {
  if (usage.provider !== rate.provider || usage.model !== rate.model) throw new Error("Receipt does not match the pinned rate card.");
  for (const n of [usage.inputTokens, usage.cachedInputTokens, usage.outputTokens, usage.reasoningTokens, rate.input, rate.cachedInput, rate.output, rate.reasoning]) if (!Number.isSafeInteger(n) || n < 0) throw new Error("Invalid metering quantity.");
  if (usage.cachedInputTokens > usage.inputTokens) throw new Error("Invalid cached input quantity.");
  return (BigInt(usage.inputTokens - usage.cachedInputTokens) * BigInt(rate.input) + BigInt(usage.cachedInputTokens) * BigInt(rate.cachedInput) + BigInt(usage.outputTokens) * BigInt(rate.output) + BigInt(usage.reasoningTokens) * BigInt(rate.reasoning)).toString();
}

export function ceiling(rate: RateCard): string {
  // TypeSafe: a conservative envelope of 16 questions × the 64k request limit.
  // Gemini: bounded 128k input and 8k combined response/thinking envelope.
  return rate.provider === "typesafe" ? (BigInt(64000 * 16) * BigInt(rate.input)).toString() : (BigInt(128000) * BigInt(rate.input) + BigInt(8192) * BigInt(Math.max(rate.output, rate.reasoning))).toString();
}
