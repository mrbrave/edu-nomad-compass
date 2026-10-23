# Studio operations

## Scope and deployment

Use only this application's repository, deployment project and isolated database. Environment workspaces are `production`, `preview` and `development`; the server selects them from hosting metadata, not a browser request. Separate apps must provision their own database and bridge credential.

Apply the versioned migrations to an empty isolated PostgreSQL project. The bridge depends on the platform-provided `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; that privileged key stays inside the database platform's function runtime.

Generate a high-entropy backend-to-bridge bearer credential. Store its plaintext as `STUDIO_LEDGER_TOKEN` only in the application host's secret environment. Replace `__STUDIO_LEDGER_AUTH_HASH__` in the bridge deployment source with its SHA-256 hex digest. Do not commit a populated deployment file. Deploy only that function with JWT validation disabled because the function performs its own credential verification. Ordinary requests without the bridge credential must return 401.

Populate the direct provider secrets separately. Use `STUDIO_ACCESS_TOKEN` for a new installation. Existing Compass pilots can retain their configured `COMPASS_ACCESS_TOKEN` alias. Keep live requests disabled until provider configuration, rates, access and allowance are ready. The supplied production credentials have been stored, but no live request has validated them in this migration.

## Allocation

Only an authorised database operator changes allowance. Amounts are integer USD nanodollars. An allocation is an internal cap, not a payment, provider prepaid credit purchase or invoice.

Use a database transaction: lock the target row in `studio_private.workspaces`, insert a new immutable `studio_private.allocations` entry with tenant, environment, positive amount, reason and operator reference, then commit. Do not replace the total in place or calculate a balance from an environment variable. Snapshot and admission use the same workspace lock.

The ordinary application bridge has no allocation action. A Studio access code cannot change the budget. Keep Preview and Development unallocated and disabled until explicitly approved for isolated testing.

## Recovery

Read `GET /api/ai/operations/:id` after an unclear response. A completed operation returns its saved result. A pending operation is not a reason to submit another ID. A worker interrupted after admission retains its reservation and eventually presents a review-required state.

Inspect the restricted operation and its attempt records. Compare provider response IDs and usage where available with authorised provider reporting. Never infer a zero charge from the absence of a reply. Already recorded charges must remain intact even if the generated content was invalid.

## Operator reconciliation

The database-owner procedure is:

```sql
studio_private.reconcile_operation(
  target_workspace text,
  operation_uuid uuid,
  additional_cost_nano bigint,
  evidence_reason text,
  operator_ref text
)
```

Supply an **additional** allowance adjustment, excluding charges already in `studio_private.charges`. Prefer verified provider cost. A confirmed no-charge outcome uses zero. If a sent request has no recoverable native outcome, an authorised operator may instead retain the full frozen ceiling of its unresolved attempts as a conservative internal adjustment. Calculate that ceiling from the private attempt rows under the workspace lock; do not invent an estimated actual charge. Prefix the reason with `UPPER_BOUND`, state that actual provider cost remains unverified and preserve the missing receipt. Do not add known charges again. This consumes already reserved allowance without increasing the approved cap. If later invoice evidence supports a lower cost, an operator can append a compensating allocation with a reference to the original adjustment; never edit the original audit entry. Document the evidence and decision in the reason; do not include credentials. The procedure records an immutable reconciliation entry, marks unresolved attempts reconciled, releases the remaining hold and leaves saved reply content intact. It rejects an already resolved operation.

Execution is revoked from browser roles and the application's privileged bridge role. Use a database-owner session after review. A stale admitted operation is eligible after six minutes in the recovery update (three minutes in the preceding release), but elapsed time is not proof of no billing: check provider evidence first.

## Release and rollback

`npm run verify` runs type checks, synthetic tests and a model-free build. Run the rollback-only SQL fixture and check database advisors after schema changes. Confirm bridge 401/200 behaviour, environment isolation and safe projections without calling either model.

Publish through a feature branch and pull request. Check the exact candidate's deployment before an authorised merge. Production must be verified after deployment; a build result does not establish live AI quality. A code rollback does not remove already recorded costs or imply that pre-ledger releases are safe to restore with paid access enabled.

Keep the ledger contract compatible during future releases. Use `STUDIO_ENABLE_LIVE=false` to pause new paid work while investigating; status recovery and accounting reads remain available. Rotate each provider key independently through the host's secret management and deploy the application to pick up changed values.

## Retention and future operation

Transcripts and private receipts currently persist until an operator applies an explicit retention/deletion process. No automatic expiry, customer administration interface or automated invoice reconciliation is configured. Shared-code access is a pilot mechanism. Customer-facing expansion requires individual identity, permissions, tenant routing, retention operations and alerting.

## Timeout incident and diagnostic handling

The 23 October recovery retained the full unresolved generator ceiling, preserved the completed evaluator charge and saved evidence-only result, and reopened Production. No provider request was repeated and no provider balance was changed. Actual generator cost remains unknown. The internal remaining percentage stayed conservative.

The earlier recovery change was merged, but the observed 120-second generation timeout showed that increasing the deadline alone did not restore explanations. The current transport candidate instead uses native user/model messages, exact-body token counting, a 32,768-token input limit, 2,048-token output limit, low thinking, a 10-second preflight and a 30-second generation deadline. No automatic retry is added.

Query `studio_provider_failure` in the hosting runtime logs to distinguish `preflight`, `generation` and `receipt` stages. Generation diagnostics also distinguish `headers` and `body`. A definitive preflight record proves no generator request was sent; preserve all earlier evaluator costs. Never clear a later generation hold from a preflight log belonging to another operation or attempt.

The previously merged recovery migration still needs an authorised database application; Production was confirmed to retain the three-minute stale threshold on 23 October 2026. Git merges do not apply SQL migrations. The current transport candidate adds no migration and retains the 300-second route ceiling. Apply the existing six-minute recovery migration as part of the authorised release, then verify the database threshold separately from the hosting build.

The second observed generator hold was reconciled by retaining its full frozen ceiling against the internal allowance. The resulting snapshot was available with 94% remaining; evaluator charges and the saved reply were unchanged. Actual generator cost remains unknown. No paid replay or allocation increase was made.
