# Verification Checklist

For each cohort, record evidence and mark every applicable item `verified`, `unresolved`, or `not applicable`. A checklist template is not proof of completion.

## Preflight and Actions

- Intended discussion URL, course, section and title match the current request.
- Login and permitted browser inspection method are available.
- User instructions on expansion, ordering and output scope are recorded.
- Requested and excluded cohort identities are verified; only selected cohorts are captured/exported. One-cohort requests do not require a second cohort.
- Every interaction has a read-only action decision and resulting observation.
- Filters and read-state side effects are documented separately.

## Source Coverage

- All pages and nested threads were visited and expanded.
- Root coverage is supported independently of the captured-entry list.
- Per-thread counters use verified semantics and reconcile.
- Every entry has a verified author and parent/root relationship, or an explicitly handled deleted placeholder.
- Same-name authors remain separate; cross-cohort records remain separate.
- Quotes, attachments and edited/deleted entries have documented handling.
- No unresolved data conflict or unexplained text transformation remains.
- Roster-only students and gradebook order are included only from verified roster evidence.

## Workbook

- Prepared manifest is nonempty, well-formed and has unique safe section keys; no unrelated workbook is present.

- One file per requested cohort; first sheet is `Posts and Replies`.
- Headers start `Student Name`, `Discussion Post`, `Reply 1`, `Reply 2`.
- Additional replies appear in additional columns without a cap.
- Replies are attributed to their writer, with self/staff content retained separately.
- All top-level posts, paragraph breaks and source wording are preserved.
- Saved OOXML cells match prepared matrices; formulas and unexpected cells are absent.
- Representative views are legible; long-cell limitations are disclosed.

## Final Source Review

- After interruptions, checkpoint files/hashes, source freshness and dependent-stage invalidation were assessed under checkpoint-recovery.md.

- Source spot-checks cover page boundaries and present exception cases.
- Source is stable across the capture interval, or changed scope was reverified.
- Section row/post/reply counts and exclusions are reported.
- Unseen edge cases and live-test limitations are stated.
- No claim of complete extraction is made if source coverage remains unresolved.
- Partial delivery is identified when a requested cohort remains blocked; excluded cohorts are labeled not requested.
- Canvas integrity wording matches observed actions and unresolved uncertainty.
- No Canvas editing, grading or CoEqual uploading is inferred from the extraction request.
