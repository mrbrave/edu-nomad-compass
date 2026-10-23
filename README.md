# EduNomad Course Compass

A private course-design research workspace with an offline Demo and direct JEV → Gemini Studio workflow. It retrieves official training.gov.au evidence, evaluates unit suitability against a fixed course brief and saves a guided explanation. It supports research; it does not approve qualification packaging or RTO compliance.

The implementation follows the supplied reusable dual-AI method: separate provider adapters, validated fresh guidance, durable operations, precise receipt accounting and an internal allowance gate. Optional post-reply evaluation is separate and cannot rewrite the saved reply.

- [DESIGN.md](DESIGN.md): complete UX/UI baseline, tokens, layout, component states and Figma/Stitch recreation brief.
- [PLATFORM.md](PLATFORM.md): executive summary, architecture, provider contracts, access, ledger, limitations and adoption feedback.
- [Operations](docs/operations.md): environment setup, allocation and reconciliation.
- [Test plan](docs/quality/TEST-PLAN.md) and [migration record](docs/quality/2026-10-23-direct-providers.md): actual evidence and deferred checks.

## Local development

Use Node.js 24 and `npm ci`. Copy `.env.example` to a private local environment file and populate only the server settings needed for your isolated environment. Never commit that file.

```sh
npm run dev
npm run verify
```

Demo makes no external requests. Studio requires an application access code. Paid calls also require direct TypeSafe and Gemini credentials, supported model registrations, the authenticated ledger adapter, an allocated allowance and `STUDIO_ENABLE_LIVE=true`. The default is false. A provider key is not a Studio access code.

## Source organisation

`packages/dual-ai-core` sequences model work. `provider-adapters` owns vendor HTTP schemas and receipts. `usage-ledger` owns rates and cost logic. `shared-persistence` supplies the store adapter. `shared-auth` and `studio-shell` supply reusable access and UI. Course-specific evidence, prompts and rules remain in `lib` and `app`.

Private relational tables and atomic RPC logic are versioned in `supabase/migrations`. An authenticated ledger bridge is in `supabase/functions/studio-ledger`; its deployment injects a SHA-256 credential hash without committing a secret. It never calls an AI provider.

Vercel hosts the app. Both model providers are called directly. Legacy agent session pages redirect to the main workspace; no alternate agent runtime can bypass the ledger.

## Verification

The automated test preload disables networking. All model response tests use explicit synthetic transports. The production build never calls a model. `tests/ledger.sql` runs real accounting assertions in a rollback-only transaction. Live provider checks are separate and require explicit authorisation.

Changes use a reviewable pull request. Merge and production release follow the user's authorisation for that release.
