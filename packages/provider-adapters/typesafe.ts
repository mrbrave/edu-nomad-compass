import { z } from "zod";
import { type ProviderResult, readProviderJson, serverKey, UnsentRequest } from "./contracts.ts";

const receiptSchema = z.object({
  usage: z.object({ input_tokens: z.number().int().nonnegative().safe(), output_tokens: z.number().int().nonnegative().safe() }),
}).passthrough();

export async function evaluateTypeSafe(body: { model: string; state: unknown; questions: Record<string, unknown> }, fetcher: typeof fetch = fetch): Promise<ProviderResult<Record<string, unknown>>> {
  const payload = JSON.stringify(body);
  if (Buffer.byteLength(payload, "utf8") > 120000) throw new UnsentRequest("The review contains too much evidence. Select fewer units.");
  const response = await fetcher("https://api.typesafe.ai/v1/systemone", {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${serverKey("TYPESAFE_API_KEY")}` },
    body: payload, redirect: "error", signal: AbortSignal.timeout(40000),
  });
  const raw = receiptSchema.parse(await readProviderJson(response, "TypeSafe"));
  // Domain validation follows durable receipt settlement, including on a model mismatch.
  return { output: { model: raw.model, answers: raw.answers }, receipt: {
    provider: "typesafe", model: body.model, inputTokens: raw.usage.input_tokens, outputTokens: raw.usage.output_tokens,
    cachedInputTokens: 0, reasoningTokens: 0, nativeUsage: raw.usage,
  } };
}
