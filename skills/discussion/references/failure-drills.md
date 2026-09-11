# Failure Drills

Use synthetic captures or a user-authorized read-only test discussion. Never simulate risky clicks in a real course. An agent's explanation of what it would do is a behavioral walkthrough, not a passed live test.

| Scenario | Expected behavior | Existing evidence |
| --- | --- | --- |
| `\discussion` plus two current URLs | Route to this skill, extract separately, do not create a CoEqual assignment | Trigger documented; live invocation not tested here |
| DOM virtualizes after scrolling | Accumulate stable IDs and independently reconcile every thread | Browser walkthrough pending |
| Expanded capture omits an entire root | Reject root coverage despite matching remaining reply counts | Automated synthetic test |
| Reply 3+ or depth-three reply | Retain it and assign to its writer | Automated synthetic test |
| Same name, distinct IDs | Keep separate students | Automated synthetic test |
| Same IDs in different cohorts | Keep separate outputs | Automated synthetic test |
| Duplicate observation differs in text | Stop normalization for version reconciliation | Automated synthetic test |
| Deleted parent has active descendants | Retain parent relationship and apply observed count semantics | Automated synthetic test |
| Quote/attachment unresolved | Refuse verified export; preserve source | Automated synthetic test |
| Timestamp/formula-like text coerced by Excel | Preserve literal string and independently check saved cells | Synthetic export and readback test |
| Saved workbook is changed after export | Reject comparison and remove stale verification marker | Automated synthetic mutation test |
| Browser session fails mid-capture | Read checkpoint, verify scope/stability, resume safely | Agent walkthrough pending |
| Expand click target is ambiguous | Do not click; re-inspect permitted controls | Live test deliberately not attempted |
| Actual click may have touched Publish | Stop and disclose immediately, no attempted reversal | No real mutation test |

Repository tests are under `tests/`. In a copied skill without those tests, use these drills to review decisions and run a fresh synthetic capture through the included scripts. Do not represent the absence of real attachments, deeper nesting or additional pages in a particular live discussion as evidence those cases were live-tested.
