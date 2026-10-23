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
| Automated tests | 20 passed | Includes five orchestration/failure cases and credits validation |
| Production build | Passed | Candidate compiles locally |
| Main colour contrast | White/navy 18.69:1; navy/gold 8.26:1; body ink/white 15.64:1; secondary ink/white 5.98:1 | Principal colour pairs only; not a full accessibility audit |
| Live model check | Pending Preview run | No pass claimed before a real request |
| Browser and mobile | Pending | No visual result inferred from a build |
| Credit allocation | No source configured | UI reports not assigned; no personal ledger or spend cap |

## Baseline comparison

The first release had 13 automated tests and no verified live model check. This candidate has 20 tests. An increased test count is not a model-accuracy metric. Retain the earlier decision record and append the live result and human findings below.

## Release decision

Open a pull request and wait for acceptance. Do not merge automatically. Production configuration and protection are preserved. A temporary branch-only Preview test flag must be reset after the bounded live run.
