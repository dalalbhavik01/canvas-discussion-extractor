# Canvas Read-Only Policy

Before each Canvas interaction, identify the current page and target using a fresh observation. Decide whether the action reads content or could change content/settings. Record the target and resulting observation in the run state's action log; routine actions can have concise entries.

Allowed for this extraction: open the specified discussion, scroll, expand threads, navigate discussion pagination, read visible content, and inspect a requested roster through read-only views. Opening an accessible attachment reference is permitted when needed to verify it. These actions require no repeated approval when already authorized.

Never use Edit, Save, Reply, Post, Publish, Unpublish, Delete, Upload, Grade, Manage Discussion, bulk actions, settings changes, or Canvas forms. Do not change course tabs, assignments, due dates, rubrics, feedback, enrollment, groups, or grades to solve an extraction issue. No Canvas API/OAuth, direct API queries, or requests constructed by the extraction script.

Use the current browser tool's documented capabilities. DOM-only evaluation permission does not authorize reading frontend application state. No hidden-cache workaround when the tool forbids it. Do not insert export nodes, write localStorage, or dispatch scripted clicks.

Action record:

```json
{
  "stage": "capture",
  "target": "observed page and control",
  "action": "expand_threads",
  "read_only_safe": true,
  "evidence_before": "snapshot reference",
  "evidence_after": "expanded state reference",
  "outcome": "verified"
}
```

These are example field values, not evidence to paste into a real run. If read-only safety is uncertain, do not perform the action. Re-inspect for a safe route. If an ambiguous click has already happened, stop further interaction immediately and report what is known and unknown. Do not attempt to undo it.

Viewing a discussion may update read/unread state. Log observed changes separately from course-content edits. A final integrity statement must reflect the actual action record and uncertainties. Do not claim a server audit proved no edits unless that audit was actually checked.
