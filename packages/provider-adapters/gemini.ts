import { z } from "zod";
import { type ProviderResult, ProviderStageError, readProviderJson, serverKey, UnsentRequest } from "./contracts.ts";

export const GEMINI_GENERATION_TIMEOUT_MS = 30000;
export const GEMINI_INPUT_TOKEN_LIMIT = 32768;
export const GEMINI_OUTPUT_TOKEN_LIMIT = 2048;

export interface GeminiRequest {
  model: string;
  instructions: string;
  prompt: string;
  history?: { role: "user" | "assistant"; content: string }[];
}

function geminiBody(input: GeminiRequest) {
  return {
    systemInstruction: { parts: [{ text: input.instructions }] },
    contents: [
      ...(input.history ?? []).map(message => ({ role: message.role === "assistant" ? "model" : "user", parts: [{ text: message.content }] })),
      { role: "user", parts: [{ text: input.prompt }] },
    ],
    generationConfig: { maxOutputTokens: GEMINI_OUTPUT_TOKEN_LIMIT, thinkingConfig: { thinkingLevel: "low" } },
  };
}

const token = z.number().int().nonnegative().safe();
const usageSchema = z.object({ promptTokenCount: token, cachedContentTokenCount: token.default(0), candidatesTokenCount: token.default(0), thoughtsTokenCount: token.default(0), toolUsePromptTokenCount: token.default(0), totalTokenCount: token });

export function normaliseGeminiUsage(value: unknown) {
  const u = usageSchema.parse(value);
  if (u.cachedContentTokenCount > u.promptTokenCount || u.toolUsePromptTokenCount !== 0 || u.totalTokenCount !== u.promptTokenCount + u.candidatesTokenCount + u.thoughtsTokenCount) throw new Error("Unsupported Gemini usage receipt.");
  return { inputTokens: u.promptTokenCount, cachedInputTokens: u.cachedContentTokenCount, outputTokens: u.candidatesTokenCount, reasoningTokens: u.thoughtsTokenCount, nativeUsage: u };
}

export interface GeminiOutput { text: string; finishReason: string; actualModel?: string }

export async function generateGemini(input: GeminiRequest, fetcher: typeof fetch = fetch): Promise<ProviderResult<GeminiOutput>> {
  const root = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(input.model)}`;
  const headers = { "Content-Type": "application/json", "x-goog-api-key": serverKey("GEMINI_API_KEY") };
  const body = geminiBody(input);
  const payload = JSON.stringify(body);
  if (Buffer.byteLength(payload, "utf8") > 120000) throw new UnsentRequest("The review contains too much evidence. Select fewer units or start a new review.");
  // Preflight runs only inside an admitted user operation, never during a build.
  try {
    const preflight = await fetcher(`${root}:countTokens`, { method: "POST", headers, body: JSON.stringify({ generateContentRequest: { model: `models/${input.model}`, ...body } }), redirect: "error", signal: AbortSignal.timeout(10000) });
    const count = z.object({ totalTokens: token }).parse(await readProviderJson(preflight, "Gemini"));
    if (count.totalTokens > GEMINI_INPUT_TOKEN_LIMIT) throw new UnsentRequest("The review exceeds this Studio's context limit.");
  } catch (error) {
    // No generateContent request has been sent, including on a countTokens timeout.
    throw new ProviderStageError("preflight", error);
  }
  let value: unknown;
  let response: Response;
  try {
    response = await fetcher(`${root}:generateContent`, { method: "POST", headers, body: payload, redirect: "error", signal: AbortSignal.timeout(GEMINI_GENERATION_TIMEOUT_MS) });
  } catch (error) { throw new ProviderStageError("generation", error, "headers"); }
  try { value = await readProviderJson(response, "Gemini"); }
  catch (error) { throw new ProviderStageError("generation", error, "body"); }
  let raw: { usageMetadata: unknown; [key: string]: unknown };
  let usage: ReturnType<typeof normaliseGeminiUsage>;
  try {
    raw = z.object({ usageMetadata: z.unknown() }).passthrough().parse(value);
    usage = normaliseGeminiUsage(raw.usageMetadata);
  } catch (error) { throw new ProviderStageError("receipt", error); }
  const candidates = z.array(z.object({ finishReason: z.string().default("UNKNOWN"), content: z.object({ parts: z.array(z.object({ text: z.string().optional(), thought: z.boolean().optional() }).passthrough()) }).optional() })).safeParse(raw.candidates);
  const candidate = candidates.success ? candidates.data[0] : undefined;
  // A malformed answer still returns its usable receipt for durable settlement.
  return { output: { text: candidate?.content?.parts.filter(p => !p.thought).map(p => p.text ?? "").join("") ?? "", finishReason: candidate?.finishReason ?? "INVALID", ...(typeof raw.modelVersion === "string" ? {actualModel:raw.modelVersion} : {}) }, receipt: {
    provider: "gemini", model: input.model, ...usage, ...(typeof raw.responseId === "string" ? { responseId: raw.responseId } : {}),
  } };
}
