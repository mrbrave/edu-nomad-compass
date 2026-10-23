# Course Compass verification and evolution

## Evidence levels

| Level | Purpose | Does not establish |
| --- | --- | --- |
| Deterministic contracts | Synthetic model schemas, sequencing, pricing, access and safe failures | Real credentials, provider availability or AI accuracy |
| Transactional database | Idempotency, versions, separate receipts, holds, reconciliation and permissions | Provider billing or model quality |
| Non-AI HTTP | Bridge authentication, atomic admission and operation recovery | AI integration success |
| Browser review | Visible layout, navigation, sample flow and recovery controls | Assessed output quality |
| Authorised live check | Actual direct-provider responses, receipts, latency and human evidence review | Broad reliability from one successful example |

## Automated checks

Run `npm run verify`. The test preload disables networking; provider tests inject explicit synthetic transports. The build never contacts a model. Current cases cover:

- Evaluator output is validated and saved before generation; malformed or unavailable evaluation stops the generator.
- Known receipts are settled before answer interpretation. A generator failure preserves valid evaluation.
- Rejected requests release their hold; ambiguous outcomes do not trigger a retry.
- A completed duplicate returns saved output without model calls.
- Independent saved-reply assessment calls only the evaluator and cannot rewrite the answer.
- Stale versions, unsupported registrations and invalid usage fail closed.
- Cached input is counted once; thinking tokens are included; pinned prices remain stable.
- Demo makes no network request; access codes differ from provider keys; private usage fields are stripped.

Run `tests/ledger.sql` against this application's isolated, idle Preview workspace. Fixtures are inside one transaction and roll back. It checks duplicate/hash conflicts, version increments, three distinct receipts, immutable saved replies, uncertain holds, positive fractions below 1%, operator-only reconciliation and denied browser permissions. Preview must be unfunded and unused for this fixture; do not run it against a shared customer environment.

`npm run test:ledger` is an explicitly configured operator check requiring the ledger endpoint, bridge credential and `STUDIO_CHECK_WORKSPACE`. It sends two concurrent ledger admissions, starts no model attempt and releases its test reservation. It requires an idle workspace with enough allocated allowance for its small temporary hold. Never include the credential or private allowance amounts in its record.

## Browser scenarios

| Case | Expected outcome |
| --- | --- |
| Demo on desktop/mobile | Prepared sample; no register or model request; clear labels and usable evidence tabs |
| Studio entry with wrong application code | Error on the access form; provider keys never requested |
| Missing access configuration | Closed access; no anonymous paid route |
| Live-disabled or unassigned environment | Clear usage notice; paid submission unavailable |
| Pending/uncertain response | Recover status reads the existing operation; no automatic model retry |
| Closed or missing operation | Explicit New review action; no automatic resubmission |
| Saved reply plus optional assessment | Original reply stays intact; extra allowance use is explained |
| Lock/reload | Access code cleared; unresolved opaque IDs support re-authenticated recovery |
| Keyboard and narrow viewport | Named controls, focus visibility, drawer Escape/focus return and no horizontal overflow |

## Controlled live case — not executed for this migration

Use only a synthetic course brief: BSB50420 with BSBCMM412; develop frontline managers who can prepare and lead difficult workplace conversations; experienced team leaders with access to workplace teams. Start only after the operator authorises a direct-provider check and its allowance/environment.

Record the source commit/deployment, adapter/policy/rate versions, model IDs, register release, actual evidence sections, result status, provider-reported tokens, duration and a safe operation reference. Do not record private credentials, raw prompts containing personal data, account identifiers or monetary allowances in the public report.

Verify evaluator → validated guidance → generator ordering, a real supporting section, correct source citations, a saved reply and separate usage receipts. A missing or invalid evaluator result must stop generation. Test an independent saved-reply assessment separately; it is an extra call and cannot alter the answer.

Human review records Pass, Concern or Not checked for source grounding, fixed-brief relevance, suitability/compliance distinction, missing-information treatment and practical next steps. Repeat after material model or prompt changes; identical wording or scores are not required. Retain failed observations and compare evidence quality and review effort.

## Reporting

Use a dated release record with actual outcomes. Keep historical Gateway results clearly historical. A configured secret, passing build, successful mock or HTTP 200 is not proof of working AI. Report unverified live integration explicitly until evidence exists.

## Controlled Studio acceptance scenario

Use [STUDIO-BUSINESS-01](STUDIO-TEST-GUIDE.md): BSB40120 with BSBCRT411 and BSBTEC404. The guide specifies the complete brief, two messages, UI options, expected results, optional evaluator-only insights and recovery stop conditions. It differs from Demo. Record each live outcome separately; automated fixtures cannot mark this case passed.

Recovery regressions cover native role order, exact preflight/generation body parity, the 32,768-token boundary, response-header/body timeout phases, failed token preflight with no generation, a sent-generation timeout retaining its hold, unusable usage metadata, preserved JEV guidance, upper-bound reconciliation retaining allowance, duplicate reconciliation rejection and stale-worker detection beyond the route budget.
