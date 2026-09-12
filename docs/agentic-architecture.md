# Discussion Workflow Architecture

This uses the old assignment-creator repo's agent-owned stages, read-only action decisions, recovery checkpoints and final verification. The workflow ends at local discussion workbooks. Assignment setup, rubric mapping and CoEqual creation belong to the separate assignment-creator skill.

| Responsibility | Owner | Evidence/output |
| --- | --- | --- |
| Current request, course/section identity and read-only decisions | Host agent | Run state and action log |
| Expand, paginate and capture permitted source content | Host agent using browser tools | Raw snapshots/observations and normalized capture |
| Resolve student IDs, parents and source counts | Host agent plus `prepare.mjs` | Source-backed mappings and reconciliation |
| Preserve all peer replies and cohort separation | `prepare.mjs` | Prepared matrices and audit |
| Write Excel and preserve literal strings | `build_workbooks.mjs`, `restore_text_cells.py` | Section workbooks |
| Independently read saved cells | `verify_workbooks.py` | Readback report with file hashes |
| Review visible source and final output | Host agent | Spot-check evidence and final handoff |

These are responsibilities, not claims that separate subagents or an unattended browser service have been implemented. A single agent can perform them. When the host supports delegation and the task warrants it, independent review can use local captures without sharing concurrent control of the Canvas tab.

The [run-state template](../skills/discussion/references/run-state-template.json) is agent-maintained, whereas the scripts emit deterministic capture/export artifacts. Recovery reads saved evidence and rechecks source stability; it never treats previous conversation memory as source data. The [error rules](../skills/discussion/references/error-handling.md) define L0-L3 decisions and interruption handling.

All operational references reside inside `skills/discussion` so the installed skill and a repository clone contain the full workflow. README/config/docs support repository use without becoming external dependencies of the installed skill.
