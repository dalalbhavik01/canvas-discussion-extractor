# Error Handling and Checkpoints

The model running the skill handles recovery. A different model, agent framework, or external service is not required. Record the problem, evidence, decision and result in `run-state.json` using [run-state-template.json](run-state-template.json).

| Level | Use when | Action |
| --- | --- | --- |
| L0 | Current action and result match expected evidence | Continue. |
| L1 | A permitted retry or local repair preserves source truth | Proceed autonomously and record the fallback. |
| L2 | Missing access, ambiguous identity/scope, or unresolved source mismatch requires user input | Pause the affected stage and ask for the specific missing information. Independent work may continue. |
| L3 | An action could mutate Canvas, an ambiguous click occurred, or a workaround violates host permissions | Stop the unsafe action. For a suspected mutation stop browser interaction and disclose immediately. |

Do not ask for repeated confirmation merely because the workflow is read-only or has multiple stages. Missing data must not be replaced with guesses. Existing user authorization governs routine work; the skill does not grant new browser capabilities.

## Recovery Record

Create a private run directory at preflight. Copy the state template to `run-state.json`; fill actual IDs, timestamps and references as observed. Checkpoint after each page/cohort capture, reconciliation, export, readback and source review. Keep the raw captures and normalized entries separate. The agent owns this lifecycle; export scripts do not log browser activity or set source verification flags.

After interruption, read the current user instructions, saved checkpoint, and current browser state. Confirm course/topic scope and whether source counts/edits changed. Resume from verified captures only when still applicable. Otherwise recapture the affected scope. Do not overwrite earlier evidence or mix changed versions silently.

For a page load failure, retry once using a permitted read-only navigation. If still blocked, ask the user to sign in/refresh or provide a source export. For local export failure, preserve the capture, repair the specific failure and rebuild into a new output directory. Do not re-scrape merely because a local workbook failed.

## Decision Record

Each nonroutine decision records `stage`, `observed_problem`, `evidence`, `risk_area`, `decision_level`, `decision`, `reason`, `next_action`, and `requires_user_input`. Canvas integrity is `unknown` when an ambiguous action cannot be resolved; never default it to verified.

Use [the failure matrix](comprehensive-error-handling-matrix.md) for known cases. For an unlisted failure, identify which invariant is threatened: course-content safety, identity, scope, source fidelity, completeness, or output preservation. Choose a permitted action that preserves that invariant; otherwise pause and explain the precise unresolved issue.
