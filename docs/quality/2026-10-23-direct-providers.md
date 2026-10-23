# Direct-provider Studio migration record

Date: 23 October 2026

## Scope

Adopt the supplied dual-AI architecture through reusable source modules, direct TypeSafe/Gemini APIs, a private relational ledger, durable operation recovery and an optional separate saved-reply assessment. Preserve the EduNomad visual identity and offline Demo. Update DESIGN.md to version 3.0 and revise the platform reference.

Credentials were configured server-side in this application's deployment project. The isolated database, authenticated ledger bridge and a Production allocation were configured. Preview and Development remain separately disabled and unallocated. No private values, infrastructure identifiers or allowance amounts are included here.

## Results

| Check | Observed outcome |
| --- | --- |
| TypeScript | Pass |
| Deterministic tests | 37 passed with networking disabled; model responses are synthetic |
| Local production build | Pass after refreshing generated compiler cache and correcting static route configuration exports |
| Transactional ledger fixture | Pass; fixtures rolled back |
| Bridge authentication | 401 without its server credential; 200 with authorised usage projection |
| Concurrent ledger admission | Two simultaneous requests: one admitted, one blocked; reservation released; allowance unchanged; no model attempt |
| Database security advisors | No findings after explicit private-backend policies |
| Provider keys | Stored separately; validity unverified |
| Live AI calls | None for this migration |
| AI response quality / invoice reconciliation | Not checked |
| Candidate deployment | Vercel Preview READY for implementation revision `a606f326d297600bf6908dd963769eea2a257fab`; GitHub Vercel status successful |
| Deployed application access | Workspace, usage and operation-recovery reads return 401 without an application access code |
| Interactive browser review | Browser reached the Vercel sign-in screen; desktop/mobile interaction remains unverified |

## Contracts exercised

The synthetic and database checks establish that validated current evaluation precedes generation, malformed evaluation does not reach the generator, receipts survive output interpretation failures, duplicates reuse saved results, unknown costs retain a hold and operator reconciliation cannot rewrite a saved reply or remove known charges.

The optional post-reply operation creates a distinct evaluator receipt and leaves the conversation version and original answer unchanged. Ordinary users and the application bridge cannot invoke operator reconciliation. The safe usage projection excludes monetary amounts and provider receipts.

## Architecture feedback

The supplied method gives clear responsibility boundaries and useful failure semantics. An explicit operator recovery procedure is essential: idempotency alone cannot resolve a provider outcome lost in transit. Conservative reservations protect the internal cap while sometimes reducing usable allowance temporarily. An optional final evaluation must remain a visible, independently metered choice.

This implementation is a shared private pilot. Individual identity, customer tenancy, browser administration, automatic invoice reconciliation, retention automation and operational alerts are not claimed. Real direct-provider receipts and expert review of generated recommendations remain necessary before claiming AI quality or broad production readiness.

## Historical baseline

The earlier Gateway release recorded two degraded Preview build-time checks with authentication rejection and withheld fit scores. Those observations remain in the earlier dated report and sanitised JSON. They are not tests of these direct adapters and have not been relabelled as passes.
