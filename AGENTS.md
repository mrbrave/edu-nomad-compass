# Course Compass development rules

Work only in this application's confirmed repository, deployment project and isolated database. Never reuse another product's database, provider credentials, prompts, branding or deployment configuration.

## Release review

Prepare changes on a feature branch and open a pull request. Do not merge, enable auto-merge or release to production unless the user explicitly authorises that release. An explicit instruction for the current release overrides the default review gate; it does not authorise future merges.

## Architecture

- Keep reusable orchestration in `packages/dual-ai-core`, direct vendor clients in `packages/provider-adapters`, accounting in `packages/usage-ledger`, persistence behind `OperationStore`, and generic access/UI in `packages/shared-auth` and `packages/studio-shell`.
- Keep course-specific evidence, prompts, scoring and register rules in `lib` and the host application.
- Call the evaluator first. Validate its output and save the updated state before generation. Invalid evaluation stops generation.
- Persist an attempt before any model request. Settle provider-reported usage before interpreting output. Preserve holds after ambiguous failures; never retry a paid call automatically.
- Access codes and provider keys have different roles. Provider secrets, native receipts, rate cards and monetary balances stay server-side. Never commit populated environment files.
- Use direct TypeSafe and Gemini APIs. Do not add an AI routing intermediary or restore a legacy agent endpoint that bypasses the ledger.

## Verification

`npm test` disables networking and injects synthetic provider transports. `npm run verify` checks types, those tests and the production build. Builds must never call a model provider. Live AI checks require explicit user authorisation and are not part of CI.

Run `tests/ledger.sql` against the isolated database for transactional checks; its fixtures roll back. Review private-schema permissions and run database advisors after schema changes. Follow `docs/operations.md` for allocation and reconciliation; ordinary Studio access must never grant administration.

Update `DESIGN.md` for UI behaviour and `PLATFORM.md` for platform contracts. Record actual results and unverified areas in `docs/quality`; do not describe mocks as real AI quality measurements.
