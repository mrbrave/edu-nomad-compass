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

Supply the verified **additional** cost, excluding charges already in `studio_private.charges`. A confirmed no-charge outcome uses zero. Document the evidence and decision in the reason; do not include credentials. The procedure records an immutable reconciliation entry, marks unresolved attempts reconciled, releases the remaining hold and leaves saved reply content intact. It rejects an already resolved operation.

Execution is revoked from browser roles and the application's privileged bridge role. Use a database-owner session after review. A stale admitted operation is eligible after three minutes, but elapsed time is not proof of no billing: check provider evidence first.

## Release and rollback

`npm run verify` runs type checks, synthetic tests and a model-free build. Run the rollback-only SQL fixture and check database advisors after schema changes. Confirm bridge 401/200 behaviour, environment isolation and safe projections without calling either model.

Publish through a feature branch and pull request. Check the exact candidate's deployment before an authorised merge. Production must be verified after deployment; a build result does not establish live AI quality. A code rollback does not remove already recorded costs or imply that pre-ledger releases are safe to restore with paid access enabled.

Keep the ledger contract compatible during future releases. Use `STUDIO_ENABLE_LIVE=false` to pause new paid work while investigating; status recovery and accounting reads remain available. Rotate each provider key independently through the host's secret management and deploy the application to pick up changed values.

## Retention and future operation

Transcripts and private receipts currently persist until an operator applies an explicit retention/deletion process. No automatic expiry, customer administration interface or automated invoice reconciliation is configured. Shared-code access is a pilot mechanism. Customer-facing expansion requires individual identity, permissions, tenant routing, retention operations and alerting.
