# Checkpoint Recovery and Model Handoff

"Rollback" means returning to a verified **local workflow checkpoint**. It never means undoing Canvas actions, changing read markers, reverting a student's post, or assuming a previous model was correct. No automatic provider switch or durable orchestration service is implemented: the host agent follows this protocol.

## Checkpoint Contents

Record a checkpoint ID, capture time, current requested scope, per-section stage/status, source course/topic identity, evidence paths, and actual SHA-256 hashes of the files relied on. Record the workflow/script commit or version if known. Keep a concise next action and unresolved issues. Never write passwords, browser tokens, hidden reasoning, or unnecessary student content into the decision log.

Preserve each checkpoint as a new private file. Write the new state to a temporary file and rename it only after a successful write; do not overwrite the only recovery record. The agent must actually create and check these records before claiming checkpoint protection. A template containing nulls is not a checkpoint.

## Resume Gate

1. Read the latest user instructions first. A stop request overrides a saved next action. Resolve newly selected/excluded cohorts without assuming array position.
2. Locate the most recent completed checkpoint for each requested cohort. Check referenced files exist and their hashes match. A missing, truncated, or mismatched record is untrusted; retain it for diagnosis and use an earlier verified record or recapture the affected scope.
3. Re-observe the browser with a fresh snapshot. Verify source URL, course/topic, login, filters and expansion. Never reuse cached element indices or coordinates from before interruption.
4. Check source stability. Counts alone cannot detect same-count edits. Compare available entry/edit identifiers and source observations; if freshness cannot be established, recapture the affected page/cohort. An explicitly requested historical export can use its verified captured snapshot, labeled with capture time rather than presented as current.
5. Invalidate dependent results when inputs change: source change invalidates reconciliation, matrices, workbook and final source review; matrix/export change invalidates workbook readback and visual review. A cohort scope change requires a newly scoped export and final completeness assessment. Other unchanged cohorts can retain their own verified evidence.
6. Rebuild local exports in a fresh directory. Never erase the last good workbook or silently reuse a partially written one. Rerun the verifier and source/visual gates before delivery. `VERIFIED.json` certifies saved cells only, not Canvas completeness, freshness, or instructor approval.

## Failure Boundaries

| Event | Recovery | Boundary |
| --- | --- | --- |
| Model context lost or user selects another model | New host reads instructions, checkpoint, evidence and resume gate | No implicit memory transfer, provider call or new task |
| Tool timeout or rate limit | Honor available retry timing; one unchanged retry, then a different permitted route or pause | No credential changes, unlimited retries or paid model escalation |
| Export/write interrupted or disk full | Preserve source and failed output; choose an approved writable location and fresh directory | Do not deliver partial workbooks or remove unrelated files to free space |
| Renderer unavailable | Preserve export and readback; mark visual review unresolved | Do not claim visual QA passed from a successful file write |
| Spreadsheet dependency missing | Use host-supported exporter or isolated environment per transfer guide | No global dependency installations or fabricated workbook |
| Checkpoint/source version conflict | Preserve both versions and re-establish applicable evidence | Never select the most favorable count or merge conflicting text |
| Suspected accidental Canvas mutation | Stop all browser interaction and disclose known/unknown facts | No automated undo, rollback, or guarantee of unchanged Canvas |

## Completion Gate

Report `complete` only when every currently requested cohort passed capture coverage, identity/parent reconciliation, saved-cell readback, visual review and source checks. Otherwise report `partial`, `blocked`, or the specific unresolved stage. Excluded cohorts are `not requested`. An unknown failure must go through [model-escalation.md](model-escalation.md), not be converted into a success flag.

The resume gate is agent-operated guidance. Offline data tests do not validate model handoffs, browser recovery or remote state. These require a supervised live run before operational reliability can be claimed.
