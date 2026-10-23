import { z } from "zod";
import { type ProviderResult, readProviderJson, serverKey, UnsentRequest } from "./contracts.ts";

const token = z.number().int().nonnegative().safe();
const usageSchema = z.object({ promptTokenCount: token, cachedContentTokenCount: token.default(0), candidatesTokenCount: token.default(0), thoughtsTokenCount: token.default(0), toolUsePromptTokenCount: token.default(0), totalTokenCount: token });

export function normaliseGeminiUsage(value: unknown) {
  const u = usageSchema.parse(value);
  if (u.cachedContentTokenCount > u.promptTokenCount || u.toolUsePromptTokenCount !== 0 || u.totalTokenCount !== u.promptTokenCount + u.candidatesTokenCount + u.thoughtsTokenCount) throw new Error("Unsupported Gemini usage receipt.");
  return { inputTokens: u.promptTokenCount, cachedInputTokens: u.cachedContentTokenCount, outputTokens: u.candidatesTokenCount, reasoningTokens: u.thoughtsTokenCount, nativeUsage: u };
}

export interface GeminiOutput { text: string; finishReason: string; actualModel?: string }

export async function generateGemini(input: { model: string; instructions: string; prompt: string }, fetcher: typeof fetch = fetch): Promise<ProviderResult<GeminiOutput>> {
  const root = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(input.model)}`;
  const headers = { "Content-Type": "application/json", "x-goog-api-key": serverKey("GEMINI_API_KEY") };
  const content = { systemInstruction: { parts: [{ text: input.instructions }] }, contents: [{ role: "user", parts: [{ text: input.prompt }] }] };
  if (Buffer.byteLength(JSON.stringify(content), "utf8") > 120000) throw new UnsentRequest("The review contains too much evidence. Select fewer units.");
  // Preflight runs only inside an admitted user operation, never during a build.
  const preflight = await fetcher(`${root}:countTokens`, { method: "POST", headers, body: JSON.stringify({ generateContentRequest: { model: `models/${input.model}`, ...content } }), redirect: "error", signal: AbortSignal.timeout(15000) });
  const count = z.object({ totalTokens: token }).parse(await readProviderJson(preflight, "Gemini"));
  if (count.totalTokens > 128000) throw new UnsentRequest("The review exceeds this Studio's context limit.");
  const response = await fetcher(`${root}:generateContent`, { method: "POST", headers, body: JSON.stringify({ ...content, generationConfig: { maxOutputTokens: 4096, thinkingConfig: { thinkingLevel: "LOW" } } }), redirect: "error", signal: AbortSignal.timeout(60000) });
  const raw = z.object({ usageMetadata: z.unknown() }).passthrough().parse(await readProviderJson(response, "Gemini"));
  const candidates = z.array(z.object({ finishReason: z.string().default("UNKNOWN"), content: z.object({ parts: z.array(z.object({ text: z.string().optional(), thought: z.boolean().optional() }).passthrough()) }).optional() })).safeParse(raw.candidates);
  const candidate = candidates.success ? candidates.data[0] : undefined;
  // A malformed answer still returns its usable receipt for durable settlement.
  return { output: { text: candidate?.content?.parts.filter(p => !p.thought).map(p => p.text ?? "").join("") ?? "", finishReason: candidate?.finishReason ?? "INVALID", ...(typeof raw.modelVersion === "string" ? {actualModel:raw.modelVersion} : {}) }, receipt: {
    provider: "gemini", model: input.model, ...normaliseGeminiUsage(raw.usageMetadata), ...(typeof raw.responseId === "string" ? { responseId: raw.responseId } : {}),
  } };
}
