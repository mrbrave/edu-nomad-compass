import type { ProviderResult, UsageReceipt } from "../provider-adapters/contracts.ts";
import type { RateCard } from "../usage-ledger/pricing.ts";

export type Role = "evaluator" | "generator" | "post_assessment";
export type FailureCode = "authentication" | "credits" | "rate_limit" | "timeout" | "input_limit" | "invalid_output" | "ledger" | "service_error";
export interface TurnIdentity { requestId: string; conversationId: string; expectedVersion: number }
export interface StoredOperation {
  status: string; result: unknown | null; version: number; history: { role: "user" | "assistant"; content: string }[];
}
export interface OperationStore {
  call<T = unknown>(action: string, payload: Record<string, unknown>): Promise<T>;
}
export interface CorePolicy<Prepared, Evaluation, Reply> {
  prepare(history: StoredOperation["history"]): Promise<Prepared>;
  evaluate(value: Prepared): Promise<ProviderResult>;
  validateEvaluation(value: unknown, prepared: Prepared): Evaluation;
  generate(value: Prepared, evaluation: Evaluation): Promise<ProviderResult>;
  validateReply(value: unknown): string;
  present(value: Prepared, evaluation: Evaluation | null, reply: string | null, failure?: Role): Reply;
  observe?(role: Role, state: "complete" | "unavailable", duration: number, usage?: UsageReceipt, failure?: FailureCode): void;
}
export interface FrozenConfig { evaluator: RateCard; generator: RateCard; [key: string]: unknown }
