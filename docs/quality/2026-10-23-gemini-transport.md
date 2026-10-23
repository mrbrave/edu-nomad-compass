# Gemini native-message transport review

23 October 2026 · Candidate 3.2 · Awaiting release review

## Executive summary

A second real user request completed official evidence retrieval and JEV evaluation, then Gemini timed out after approximately 121 seconds. The earlier longer deadline did not establish a working explanation path. The candidate now aligns the native request structure and limits with the reviewed reference implementation. No other application's prompts, private context, credentials, database, branding or deployment configuration were copied or changed.

The confirmed failure is a generation-stage timeout. Request differences were identified and corrected, but their causal role remains unverified without a live acceptance run. Matching a working transport is not itself evidence of live provider success.

## Observed result

The user turn for BSB40120 with BSBCRT411 and BSBTEC404 shows completed course retrieval (392 ms), unit evidence (352 ms) and JEV evaluation (650 ms; 7,095 input / 710 output tokens). Gemini generation is unavailable after 121,368 ms. The restricted ledger records completed evaluator usage, an uncertain generator attempt without a receipt, and a saved evidence-only reply. A matching hosting diagnostic identifies `stage: generation`, `code: timeout`, `definitive: false`.

The reference code uses the same native model family and non-streaming `generateContent` endpoint. It sends separate user/model conversation messages, counts the complete body, uses low thinking, 32,768 input tokens, 2,048 output tokens, a 10-second preflight and a 30-second generation deadline. Only these generic transport and response mechanics informed this change. Existing uppercase `LOW` was not proven invalid; the setting now matches the reviewed request form and is not claimed as a confirmed root cause.

## Candidate behaviour

| Area | Candidate contract |
| --- | --- |
| Request | Direct native endpoint; key remains in the server header |
| History | Saved user/assistant messages mapped to native user/model roles in order |
| Latest turn | Current question plus fresh validated course guidance once; no duplicate history envelope |
| Evidence projection | Preserve qualification sections, all selected-unit sections, prerequisites, validated assessments, limitations and sources; omit the unselected-unit grid and redundant product metadata |
| Input counting | Exact generation body plus required model ID; 32,768-token maximum |
| Generation | 2,048 output tokens; thinkingLevel low; one attempt with 30-second deadline |
| Preflight | 10-second deadline; failures before generation are definitively unsent |
| Response | Require STOP for a usable reply; exclude thought parts; settle usable native usage before domain interpretation |
| Ambiguous outcomes | Preserve holds, evaluator costs and saved fallback; never automatically repeat a paid request |
| Diagnostics | Distinguish generation headers/body from receipt validation using bounded fields; no prompt, body, key or monetary logging |
| Versioning | Adapter direct-rest-v3; host generation policy compass-explanation-v4 |

The input/output limits are request bounds. The existing conservative financial reservation remains unchanged, including for already admitted operations. No provider credentials, model registration, allowance allocation or access setting changed.

## Verification

`npm run verify` passes in the restored checkout: TypeScript, all **45 network-disabled automated tests** and the model-free production build. The same transport tests passed before temporary workspace maintenance; the final restored checkout was verified again before publication.

The tests check native role order, exact count/generation body parity, accepted 32,768 and rejected 32,769 input counts, header/body timeout distinction, no automatic retry, valid receipt retention despite malformed answer content, unchanged evaluator-before-generator ordering, saved history from the repository and the restricted evidence projection. Synthetic responses do not prove Gemini availability, latency or content quality.

No new live AI request was made. A future authorised acceptance run should use STUDIO-BUSINESS-01, confirm both model stages complete, record actual receipt-derived usage, then test the second message for continuity. An evidence-only fallback is not a full integration pass. If another timeout occurs, inspect its transport phase and provider reporting rather than extending the deadline or repeating paid probes blindly.

## Operational recovery and remaining release work

The second unresolved generator hold was reviewed and converted to an immutable `UPPER_BOUND` adjustment equal to its full frozen ceiling. Preconditions checked the same uncertain attempt, missing receipt/charge, matching hold and saved result. Assertions confirmed existing evaluator charges and saved content were unchanged. Production returned available with **94% remaining**. Actual generator invoice usage remains unknown; no zero-cost claim, paid replay or allowance increase was made.

The earlier recovery migration remains unapplied: Production was confirmed to use a three-minute stale threshold on 23 October 2026. The merged migration defines six minutes to exceed the existing 300-second complete-route ceiling. Apply and verify that existing migration during the authorised release. This transport change adds no migration. No database fixture was rerun because this candidate changes neither accounting SQL nor permissions.

The candidate must be reviewed before merge/release. Live Gemini success, quality and protected browser interaction remain unverified. The existing live application retains the preceding transport until release.
