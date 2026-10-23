# Studio timeout and allowance recovery

23 October 2026 · Release candidate 3.1 · Awaiting review

## Observed production outcome

The restricted ledger records one real user turn: official course and unit retrieval completed, JEV completed with a valid native receipt, and Gemini explanation timed out after approximately 60.8 seconds. JEV reported 10,177 input tokens and 1,387 output tokens. Its usage was settled before its output was interpreted. Gemini returned no usable receipt before the local generation deadline. The saved result is an evidence-only summary with the completed evaluator guidance.

The unresolved generator attempt retained its ceiling and blocked new workspace spending. No zero-charge inference was made. Hosting runtime-log retrieval returned no matching records for the incident window; the durable operation and attempt records establish the observations above. They do not establish Gemini's eventual invoice outcome.

## Completed operational recovery

An operator transaction checked that the same operation was review-required, its generator attempt was uncertain without a receipt or recorded charge, its reservation matched the frozen generator ceiling, and a saved reply existed. The transaction recorded the full unresolved generator ceiling as an immutable `UPPER_BOUND` internal allowance adjustment, then resolved the hold. Assertions confirmed that known charges and saved reply content were unchanged.

The resulting Production snapshot is **available**, with **97% remaining**. The adjustment preserves the conservative cap; it is not a reported provider charge or invoice reconciliation. Actual Gemini usage remains unverified. No new model request, paid retry, allocation increase or provider-account balance change was made during this repair.

## Candidate changes

- Extend Gemini generation from 60 to 120 seconds and the complete turn-route budget to 300 seconds, without adding automatic retries.
- Distinguish token-count preflight failures, which prove no generation was sent, from generation/receipt failures, which can remain uncertain. Preserve settled JEV usage in both cases.
- Emit safe failure-stage diagnostics with opaque operation/attempt references and bounded status fields; exclude provider bodies, prompts, credentials and financial amounts.
- Prompt for concise explanations within 450 words; pin the changed adapter and host policy versions on new operations.
- Align stale-worker detection to six minutes through a versioned migration. This exceeds the route budget and avoids declaring an active longer request stale.
- Explain slow responses after 15 seconds, clarify operator review and Refresh, and keep all paid submission controls behind the same allowance gate.
- Make Studio's evidence-gap starter use the current selection rather than a Demo unit.
- Update DESIGN.md, PLATFORM.md, operating instructions, the native PLATFORM tabs and a distinct controlled Studio test guide.

## Verification

| Check | Actual result |
| --- | --- |
| TypeScript | Pass |
| Network-disabled automated tests | 43 pass |
| Model-free production build | Pass |
| Delayed response beyond the old deadline | Synthetic 65-second latency accepted within the new budget; one generation attempt |
| Preflight timeout / malformed count / server failure | No generation request; definitive release of generator attempt |
| Sent-generation timeout / unusable receipt | Uncertain outcome retained; no automatic retry |
| JEV guidance after generator failure | Preserved; saved result explicitly evidence-only |
| Accounting migration and fixtures | Pass in one real database transaction; all schema changes and fixtures rolled back |
| Conservative reconciliation regression | Full uncertain ceiling remains deducted; known charges and saved replies unchanged; duplicate reconciliation rejected |
| Stale-worker boundaries | Four-minute operation stays pending; seven-minute operation requires review |
| Private-schema security advisor before repair | No findings |
| Official register scenario | BSB40120 release 1; BSBCRT411 and BSBTEC404 current and core; prerequisite lookups succeeded with empty lists |
| New live AI requests during repair | None |
| Live Gemini success and content quality | Unverified |
| Browser interaction / protected application access checks | Unverified; previous hosting-authentication limitation remains |
| Candidate Production deployment | Not released; requires review and authorisation |

The migration was exercised with rollback; Production retains the preceding three-minute stale threshold until the candidate is released. The operational allowance recovery is already complete and does not depend on that code release. The existing 60-second generation deadline also remains until release, so repeated slow generation can cause another conservative hold.

## Acceptance handover

Use [STUDIO-BUSINESS-01](STUDIO-TEST-GUIDE.md) after the reviewed release. It provides a different qualification and units from Demo, exact objectives/cohort/messages, control labels, two-turn continuity checks, optional evaluator-only insights, recovery instructions and a result template. Mark live results only after running those steps; a synthetic pass is not a live integration pass.
