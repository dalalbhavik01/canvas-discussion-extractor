# Capture Contract (Version 1)

One JSON file contains `version: 1` and `sections: [...]`. Each section is independently validated. See `tests/discussion.test.mjs` in the repository for synthetic inputs; the skill scripts have no dependency on the tests.

Each section has:

- `key`: unique filename-safe cohort key, letters/digits/underscore/hyphen, 1-64 characters.
- `label`: actual course/section display label.
- `source`: `url` (HTTPS discussion URL), `course_id`, `discussion_id`, `title`, `captured_at` (ISO timestamp with timezone), `method` (`dom` or `frontend-cache`), `evidence` (local source reference), `section_evidence` (membership/label source).
- `coverage`: `all_pages_visited: true`, `all_threads_expanded: true`, `unfiltered: true`, `stable: true`, `pages` (nonempty unique page references), `expected_root_ids` (unique complete set of root IDs, including deleted placeholders), `root_evidence` (independent source of complete thread coverage), `roster_complete` (boolean), `order` (`captured` or `gradebook`), `order_evidence` (required for gradebook order).
- `students`: ordered list of `{id, name, role, evidence}`. Despite the field name this identity registry includes every observed author, including staff. Roles are `student`, `instructor`, `test`, or `other`. For excluded staff/test authors, evidence must justify the role. To include roster-only students or assert gradebook ordering, set `roster_complete` only after verifying the roster.
- `entries`: records described below. Repeated observations may occur, but same-ID records must agree completely. Reconcile changing versions before running the exporter.
- `threads`: one `{root_id, expected_replies, semantics, evidence}` per root. `expected_replies` is an integer >= 0. `semantics` is `all-descendants-active`, `all-descendants-including-deleted`, `direct-active`, or `direct-including-deleted`. Direct-only counts cannot prove completeness when descendants have children, so provide descendant totals or manually verified complete-tree counts in those cases.
- `source_checks`: nonempty list of `{entry_id, result: "match", evidence}` recording actual comparison with Canvas, not a self-comparison to normalized JSON. An empty discussion may use an empty list, supported by zero-root evidence.
- `observations`: list of factual read-state changes/limitations (empty if none observed).

Entry fields (all required unless described as optional):

```json
{
  "id": "entry-123",
  "author_id": "student-123",
  "parent_id": null,
  "root_id": "entry-123",
  "created_at": "2026-01-01T12:00:00Z",
  "deleted": false,
  "text": "Exact authored plain text. No paraphrasing.",
  "source_text": "Exact captured text, possibly with quoted material.",
  "quote_status": "none",
  "quoted_text": "",
  "quote_evidence": "",
  "attachments": [],
  "evidence": "page-1/entry-123"
}
```

`parent_id` is null only for roots. `author_id` can be null only for deleted placeholders. Preserve `edited_at` when supplied. Timestamps must include a timezone. Replies are sorted by creation timestamp then stable ID. If timestamps are unavailable, stop before implying chronological order; agree on a documented alternative rather than inventing timestamps.

`quote_status` is `none`, `separated`, or `unresolved`. For `none`, `text` equals `source_text` and `quoted_text` is empty. For `separated`, `quoted_text` and `quote_evidence` must be nonempty; `text` is only the confirmed authored portion. Unresolved quoting blocks verified output. Quoted text is retained in the original capture; a quote exclusion is separately visible in the audit.

Each attachment is `{name, url, status}` where `status` is `reference-verified` or `unresolved`. Include media links the same way, without claiming their content was read. Verified references are appended to the cell under `[Attachment reference]`; no content is inferred. If the task requires attachment contents, extract them separately and do not claim text-only export covers them. Unresolved attachment references block final export.

The producer, not the validator, is responsible for observing evidence and normalizing only the current discussion. Evidence fields are references to actual captures or UI observations, never invented assertions. The validator proves internal consistency, not access to Canvas or authenticity of the submitted evidence.

## Prepared Output

`prepared.json` includes per-section matrices for `Posts and Replies` and `Audit`, with summary counts and cell-to-entry mappings. `capture.json` retains the original input. `report.json` describes the checks and input hash. A `VERIFIED.json` is created by the separate OOXML reader only after all saved cells match. That marker covers workbook preservation only; live-source review remains a separate requirement.
