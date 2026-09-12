# Reliability Audit

This is an agentic workflow with deterministic local helpers, not a guarantee of perfect browser behavior or exhaustive future error handling. The user must review extraction results before using them for grading.

## Issues Corrected

- The independent verifier could certify an empty prepared manifest without checking any workbook. It now requires a nonempty versioned manifest, unique safe cohort keys and valid rectangular sheet matrices.
- A directory containing unrelated cohort workbooks was not rejected. The verifier now rejects extra workbook files outside the selected manifest.
- Verification success markers are now written atomically after all checks pass. A failed recheck removes the previous marker; an interrupted export is not a verified result.
- Model handoff guidance lacked an explicit local rollback gate. The installed skill now defines checkpoint hashes, current scope, source freshness, stale-selector avoidance and invalidation of dependent results. This protocol is agent-operated, not an implemented autonomous rollback engine.

## Evidence Boundaries

The audit regression run passed 43 Node capture/selection/export tests and 12 Python workbook-verifier tests. These 55 tests use synthetic records only; they do not constitute a live Canvas or model-handoff test.

| Area | Evidence |
| --- | --- |
| Single/subset cohort selection and excluded-data isolation | Automated synthetic selection tests and real local Excel exports |
| Root/reply reconciliation, author IDs, nesting, quotes, attachments, duplicate/conflicting observations | Automated synthetic capture tests; actual browser schema extraction remains host-dependent |
| Literal text, formula prevention, saved-cell comparison, malformed manifests and extra cohort files | Automated workbook and mutation regression tests |
| Model handoff, checkpoint freshness and interrupted browser recovery | Explicit protocol; supervised live test still required |
| Virtualized Canvas pages, real pagination, deleted/edited entries and media | Supervised live extraction still required for each observed UI behavior |
| CoEqual acceptance of additional reply columns | Not established by local workbook tests; verify target importer before uploading |
| Canvas read-only safety | Instructions and action gates, not server-enforced read-only credentials; viewing may affect read markers |
| Diagrams | Documentation of intended control flow, not proof of runtime coverage |

## Remaining Limitations

The capture validator checks the evidence supplied to it. It cannot authenticate a screenshot, verify that the browser visited every page, or prove that the agent's expected counts are independent. Source checks must actually be performed; flags cannot substitute for them.

The OOXML verifier compares a saved workbook with its prepared matrices. It does not establish that those matrices faithfully represent Canvas, and its success marker becomes stale if any file changes afterward. Reverify the exact files to be delivered.

Attachments are preserved as references, not transcribed or OCR-verified by the exporter. Large content exceeding Excel limits blocks output rather than being silently cut. Self-follow-ups and staff content are retained separately in the audit, not counted as peer replies. These distinctions must be disclosed at handoff.

Full live validation needs a user-authorized read-only discussion with known totals and representative cases, followed by manual source spot-checks and an actual CoEqual import check. Do not simulate publish/undo failures in a real course. No Canvas interaction or student-data upload is required for the repository's synthetic tests.
