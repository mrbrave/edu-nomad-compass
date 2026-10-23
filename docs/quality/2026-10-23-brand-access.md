# Brand access and workflow release record

Date: 23 October 2026
Status: Candidate under review

## Changes

Parent-brand navy and gold interface; larger reading text; dedicated shared-key Studio entry; explicit credits states; latest-request Workflow tab; model orchestration diagnostics; repeatable regression and live-check protocol.

## Evidence available before Preview

| Check | Observed result | Interpretation |
| --- | --- | --- |
| Hosting connection | Correct project accessible | Earlier connection blocker resolved |
| Environment names | Five original keys present | Private values not read; not proof of model access |
| TypeScript | Passed | Source contracts compile |
| Automated tests | 22 passed | Includes five orchestration/failure cases and credits validation |
| Production build | Passed | Candidate compiles locally |
| Main colour contrast | White/navy 18.69:1; navy/gold 8.26:1; body ink/white 15.64:1; secondary ink/white 5.98:1 | Principal colour pairs only; not a full accessibility audit |
| Live model check | Two DEGRADED observations | Official retrieval passed; both models rejected authentication |
| Browser and mobile | Browser sign-in wall; not verified | Authenticated connector fetched the candidate page with HTTP 200; interactive/mobile QA did not pass |
| Credit allocation | No source configured | UI reports not assigned; no personal ledger or spend cap |

## Baseline comparison

The first release had 13 automated tests and no verified live model check. This candidate has 22 tests. An increased test count is not a model-accuracy metric. Retain the earlier decision record and append the live result and human findings below.

## Release decision

Open a pull request and wait for acceptance. Do not merge automatically. Production configuration and protection are preserved. A temporary branch-only Preview test flag must be reset after the bounded live run.

## Observed live runs

| Run | Code revision | Duration | Register | JEV | Gemini | Result |
| --- | --- | --- | --- | --- | --- | --- |
| LIVE-01 A | 28ec15e3cc711539e096551ed4004df1b21cfa61 | 6,120 ms | Six sources retrieved | Authentication rejected | Authentication rejected | DEGRADED |
| LIVE-01 B | 42b7b98967926c24109b58d6b515dc1c2f6cffec | 4,914 ms | Six sources retrieved | Authentication rejected using OIDC | Authentication rejected using OIDC | DEGRADED |

Both runs used synthetic course context in Preview builds. Unit fit, confidence and supporting assessment section were withheld. JEV preceded the final explanation attempt. No real AI quality or calibration result is claimed. Build-time authentication failures do not determine the exact cause of a deployed runtime failure.

The hosted authentication selector now consistently prefers the project's OIDC identity when present and ignores known placeholder credentials. Two added tests cover this selection. The temporary Preview test flag has been reset to 0.

## Access and presentation checks

The deployed candidate page returned HTTP 200 through the authenticated connector and contained the revised EduNomad wordmark and Demo notice. The Studio workspace endpoint returned HTTP 401 without a key. The interactive browser reached the hosting sign-in wall; visual/mobile and entered-key interaction QA remain unverified. Hosting protection was preserved.

## Outstanding review

Complete a successful runtime JEV/Gemini request with valid Gateway access; inspect its explanation against actual retrieved evidence; connect an authoritative allowance source if credit percentages are to be shown; and complete desktop/mobile interaction review. The current credits state is not assigned.
