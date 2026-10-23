# Studio test guide: everyday decisions and digital collaboration

23 October 2026 · Test case STUDIO-BUSINESS-01 · Release candidate 3.2

## Purpose and readiness

Check that a real brief moves from official evidence to JEV evaluation, then Gemini explanation, with traceable usage and a saved reply. This scenario uses a different qualification and units from Demo. It is a two-unit research exercise, not a complete qualification selection.

The native-message transport update is a release candidate awaiting review. The earlier 120-second deadline also timed out, so a longer wait is not presented as a confirmed solution. The current candidate uses the reviewed request structure and bounded generation settings. The existing usage block has been cleared through a full-ceiling internal adjustment, with actual provider cost still unknown. No successful live Gemini response is claimed by this guide. Run the paid steps only after the reviewed candidate is released; send each message once and record its result.

Use the Production Studio supplied for this project. Enter only its shared Studio access code. Provider API keys do not belong in the interface or test notes. Confirm **Usage remaining** is available; use **Refresh** if it still shows the previous state.

## Set up the brief

1. Select **Studio**, enter the **Studio access code**, then select **Enter Studio**.
2. If **Recover status** is visible, use it to recover the saved operation first. A saved response does not repeat the provider call. If an operation is still pending or requires review, stop and follow the recovery section below.
3. Select **New review**. In **Qualification or skill set**, enter `BSB40120` and select the arrow labelled **Load qualification**. Confirm **Certificate IV in Business**, current, release 1. If the register now reports a different release/status, record it and check the scenario before continuing.
4. Replace **What should learners achieve?** with the objectives below. Replace **Who are the learners?** with the cohort below. Do this before the first submission: changing the brief starts a new conversation.
5. In **Unit workspace**, use **Filter qualification units** to select `BSBCRT411`, clear the filter, then select `BSBTEC404`. Confirm exactly two units are selected. Clear the filter to inspect both selections.
6. Use the question box **Ask about course units** for the exact messages below. Press Enter or the send arrow once. Use Shift+Enter for a line break. Do not use **Let the agent choose** for this controlled test.

**What should learners achieve?**

> Improve everyday business decisions and digital collaboration in a small service organisation. Learners will analyse a recurring work problem, compare practical options and use shared digital tools to coordinate work. Prioritise evidence that can be produced through normal workplace tasks.

**Who are the learners?**

> Adult business administrators and team coordinators with at least six months of workplace experience. They use email, shared documents and video meetings, but have varied digital confidence. They can access de-identified workplace tasks and a supervisor; some work remotely.

| Selection | Official title | Grid role verified on 23 October 2026 |
| --- | --- | --- |
| BSBCRT411 | Apply critical thinking to work practices | Core |
| BSBTEC404 | Use digital technologies to collaborate in a work environment | Core |

The official qualification grid and both current unit records were retrieved on 23 October 2026. Both prerequisite lookups returned empty lists successfully. Membership and these lookups do not establish complete packaging or delivery compliance.

## First message: compare the units

Copy and send once:

> Compare BSBCRT411 and BSBTEC404 against this brief. For each unit, give the strongest evidence of fit, the main gap and the workplace evidence learners would need. Explain how the units complement each other, and identify checks still required. Keep the explanation within 450 words.

Wait for the result. In the update, a longer-wait message appears after 15 seconds. Gemini has a 30-second response window; course retrieval, evaluation and saving also take time. Keep the tab open. A slow response is not a reason to send again.

Inspect these tabs before continuing:

| Option | What to inspect | Expected outcome |
| --- | --- | --- |
| **Workflow** | Course retrieval, Unit evidence, JEV assessment, Gemini explanation | For a full integration pass, all four show Complete. JEV precedes Gemini. Provider usage appears for completed model stages. |
| **Unit workspace** | The two unit cards and their evidence | Exact selected codes; current source evidence; fit tied to the brief. Core remains core regardless of fit. Do not require predetermined scores. |
| **Evidence trail** | Official sources, release, review boundaries | Links open the matching training.gov.au records; limitations remain visible. |
| **Usage remaining → Refresh** | Percentage and status | Available after completion. A small actual deduction may not change the rounded percentage. It is an internal allowance, not a provider balance. |

If the reply is labelled **Evidence summary · AI unavailable**, record a partial result. Completed JEV with unavailable Gemini is not a full integration pass, even if unit scores are visible. If JEV fails, fit must remain unassessed and Gemini must not run.

## Second message: check continuity

Keep the same brief and two units. Do not select New review or reload. Copy and send once:

> Building on your previous comparison, focus on the remote learners in this cohort. Which evidence can be gathered through normal collaborative work, which conditions require confirmation, and what should be checked with the RTO? Keep the same units and brief.

Expect the reply to use the earlier comparison and fixed brief, address remote collaboration with source-based limits, and avoid claiming automatic compliance. A fresh JEV evaluation must precede this fresh Gemini explanation. The earlier reply stays saved; it is not overwritten. Record Workflow and usage again.

## Optional independent check

After a successful saved reply, select **Assess saved reply** once if a separate evaluator check is wanted. This consumes additional allowance and calls JEV only. It reports evidence support and limitations clarity without rewriting the original reply. Treat these as model estimates, not verified accuracy or compliance percentages. This action is optional and does not replace checking the source links.

In **Evidence trail**, use **Export review & evidence** to keep the current review record. Store only a de-identified test brief and record any quality concern separately.

## Recovery and stop conditions

- **Unclear response / Recover status:** select **Recover status**. It reads the existing operation; it does not call the models again. Do not submit the same message under a new ID to investigate.
- **Usage pending:** allow the saved operation to finish, then recover its status. The whole request can include work beyond Gemini's response window.
- **Usage review required:** stop paid steps. Record the displayed stage/error and time, and ask the workspace operator to review the restricted operation record. After confirmation of reconciliation, select **Refresh** under Usage remaining. If recovery reports a failed operation, use **Start new review**.
- **Provider authentication, rate limit or unavailable result:** record the precise Workflow label. A fallback is not a successful Gemini test. Avoid repeated paid probes.
- **Allowance exhausted, disabled or not assigned:** stop and contact the workspace operator. Changing modes does not create allowance.

An operator can reconcile verified additional provider usage or conservatively retain the full unresolved attempt ceiling against the internal allowance when the native outcome cannot be recovered. The latter must be labelled an upper-bound adjustment; it does not prove the actual invoice cost. Existing known charges and saved replies remain intact.

## Record one result per run

| Field | Entry |
| --- | --- |
| Run ID / date / local time | |
| Deployed revision shown in release notes | |
| Qualification release and two selected codes | |
| First message: JEV / Gemini status and elapsed time | |
| Second message: JEV / Gemini status and continuity observation | |
| Official source links checked | |
| Usage before / after / final status | |
| Optional insights requested / result | |
| Pass / Concern / Blocked | |
| Observed result, expected result and reproduction steps | |

**Pass:** both turns complete through JEV and Gemini; sources, continuity and usage recovery behave as described. **Concern:** the flow completes but content or interaction needs improvement. **Blocked:** a required stage, access, allowance or saved-operation recovery prevents the test. Leave unrun steps marked **Not run**. Never invent a passing result, a target fit score or a provider charge.

## Verified reference records

- [BSB40120 Certificate IV in Business](https://training.gov.au/training/details/BSB40120)
- [Official release 1 unit grid](https://training.gov.au/api/training/BSB40120/releases/1/unitgrid)
- [BSBCRT411](https://training.gov.au/training/details/BSBCRT411)
- [BSBTEC404](https://training.gov.au/training/details/BSBTEC404)
