# Course Compass development test protocol

Version 1.0 | 23 October 2026

## Purpose

Keep a repeatable record of how the application retrieves evidence, uses JEV and passes its result to Gemini. Separate deterministic contract tests, live service checks and human assessment of output quality. Do not claim model quality from a build or a simulated test.

## Fixed synthetic brief

Qualification: BSB50420. Selected unit: BSBCMM412. Objective: develop frontline managers who can prepare and lead difficult workplace conversations. Cohort: experienced team leaders in Australian businesses with access to workplace teams. No real learner or customer information is used.

## Test register

| ID | Scenario | Expected result | Method |
| --- | --- | --- | --- |
| FLOW-01 | Selected-unit review | Evidence retrieved; JEV completes before the final Gemini explanation receives the fresh assessment | Deterministic integration test |
| FLOW-02 | JEV unavailable | Fit withheld; Gemini is given an explicit unavailable assessment | Deterministic integration test |
| FLOW-03 | Gemini unavailable | JEV result retained; explanation is labelled evidence-only fallback | Deterministic integration test |
| FLOW-04 | Both unavailable | Official evidence retained; no substitute scores | Deterministic integration test |
| FLOW-05 | No units selected | Gemini planner precedes unit retrieval, JEV and explanation | Deterministic integration test |
| CREDIT-01 | Valid allowance | Only normalised percentage and timestamp reach the browser | Deterministic test |
| CREDIT-02 | Missing/invalid allowance | Not assigned or unavailable; never a fictional zero or full balance | Deterministic test |
| LIVE-01 | One real selected-unit review | JEV complete; Gemini reply present; recognised supporting section; source links; timings and usage recorded | Authorised live check |
| UI-01 | Demo journey | No register/model request; all sample figures labelled | Browser review plus sample tests |
| UI-02 | Studio access | Gate before register retrieval; incorrect key reported; key cleared on exit | Server and browser review |
| UI-03 | Mobile/keyboard | No horizontal overflow; drawer focus and Escape behaviour; visible mode control | Browser review |
| HUMAN-01 | Explanation quality | Claims match supplied evidence, context is addressed and outstanding checks are clear | Human review |

## Commands

`npm run verify` runs TypeScript, automated tests and a production build. `npm run test:register` checks current official retrieval. `npm run test:workflow:live` makes one selected-unit live model review using configured server access.

The optional Preview build flag runs LIVE-01 only when both COMPASS_VERIFY_PIPELINE=1 and VERCEL_ENV=preview. Keep it branch-specific and reset it after the observed run. It is not a production monitoring schedule.

## Live result interpretation

PASS means the register, JEV and Gemini completed the bounded connectivity/sequence check. DEGRADED means a labelled fallback was returned. BLOCKED means the workflow did not complete. All three must be recorded; a DEGRADED result must not be silently promoted to PASS.

The live check is one observation, not a statistically meaningful benchmark. A fit score need not remain identical across runs. Record model IDs, code version, source release, evidence section, elapsed time, usage and evaluator status before comparing runs.

## Human quality review

Check that the explanation supports each material claim with the retrieved content; responds to the fixed objectives and cohort; preserves core/importing/prerequisite boundaries; does not infer compliance from fit; and states missing information clearly. Record each check as Pass, Concern or Not checked with a short evidence note. Do not assign an overall accuracy percentage without a defined benchmark and sample size.

## Evolution record

For every candidate, append a dated record with code/deployment version, changes, deterministic results, live results, browser results, human findings, open issues and release decision. Keep prior records. Do not include keys, personal names, real customer prompts, private budgets or raw provider errors.

The platform document's Tests and evolution tab contains the readable summary. The repository preserves the detailed test definitions and dated results. Acceptance of a pull request remains a separate decision.
