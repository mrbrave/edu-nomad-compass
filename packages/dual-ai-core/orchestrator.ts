import { ProviderError, UnsentRequest, type ProviderResult } from "../provider-adapters/contracts.ts";
import { ceiling, costOf, type RateCard } from "../usage-ledger/pricing.ts";
import type { CorePolicy, FailureCode, FrozenConfig, OperationStore, Role, StoredOperation, TurnIdentity } from "./contracts.ts";

export class StudioError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, status = 409) { super(code); this.code = code; this.status = status; }
}
function failureCode(error: unknown): FailureCode {
  if(error instanceof UnsentRequest)return "input_limit";
  if(error instanceof StudioError)return "ledger";
  if(error instanceof ProviderError)return error.status===401||error.status===403?"authentication":error.status===402?"credits":error.status===429?"rate_limit":"service_error";
  const name=error instanceof Error?error.name:"";
  return name==="TimeoutError"||name==="AbortError"?"timeout":name==="ZodError"?"invalid_output":"service_error";
}

export async function meteredCall(store: OperationStore, operationId: string, role: Role, rate: RateCard, run: () => Promise<ProviderResult>) {
  const attemptId = crypto.randomUUID();
  // A failed start/settlement is never retried automatically.
  await store.call("start_attempt", { operationId, attemptId, role, rate, ceiling: ceiling(rate) });
  let response: ProviderResult;
  try { response = await run(); }
  catch (error) {
    await store.call("reject_attempt", { operationId, attemptId, definitive: error instanceof UnsentRequest || error instanceof ProviderError && error.definitiveRejection });
    throw error;
  }
  try {
    await store.call("settle_attempt", { operationId, attemptId, receipt: response.receipt, cost: costOf(response.receipt, rate) });
  } catch {
    // The provider may already have billed this attempt; preserve the hold.
    throw new StudioError("review_required", 503);
  }
  return response;
}

export async function executeTurn<P, E, R>(input: TurnIdentity & { message: string; requestHash: string; immutableInput: unknown }, config: FrozenConfig, store: OperationStore, policy: CorePolicy<P, E, R>) {
  const admitted = await store.call<StoredOperation>("admit", { ...input, config, kind: "turn", ceiling: (BigInt(ceiling(config.evaluator)) + BigInt(ceiling(config.generator))).toString() });
  if (admitted.result) return admitted.result as R;
  if (admitted.status !== "new") throw new StudioError(admitted.status);
  let prepared: P;
  try { prepared = await policy.prepare(admitted.history); }
  catch (error) { await store.call("fail_operation", { operationId: input.requestId }); throw error; }
  let evaluation: E | null = null, reply: string | null = null, failure: Role | undefined;
  for (const role of ["evaluator", "generator"] as const) {
    const started = performance.now();
    try {
      const result = await meteredCall(store, input.requestId, role, config[role], () => role === "evaluator" ? policy.evaluate(prepared) : policy.generate(prepared, evaluation!));
      // Receipt is durable before interpreting model output; parse failures remain charged.
      if (role === "evaluator") {
        evaluation = policy.validateEvaluation(result.output, prepared);
        await store.call("save_evaluation", { operationId: input.requestId, evaluation });
      } else reply = policy.validateReply(result.output);
      policy.observe?.(role, "complete", Math.round(performance.now() - started), result.receipt);
    } catch (error) {
      failure = role; policy.observe?.(role, "unavailable", Math.round(performance.now() - started), undefined, failureCode(error));
      break; // Invalid/unavailable evaluation must never reach the generator.
    }
  }
  const result = policy.present(prepared, evaluation, reply, failure);
  return store.call<R>("commit_reply", { operationId: input.requestId, result });
}
