# Discussion Failure Matrix

| Failure | Level | Safe response | Do not do |
| --- | --- | --- | --- |
| Missing discussion URL and no unambiguous current request | L2 | Ask for the intended links. | Reuse previous course IDs. |
| Several tabs, one matches the provided URL | L0 | Select the matching course/topic. | Choose by recency alone. |
| Session expired | L2 | Ask user to sign in. | Extract credentials or bypass access. |
| Page load failed | L1, then L2 | One read-only retry; then report. | Retry indefinitely. |
| Threads collapsed; expansion authorized | L1 | Expand the observed control and verify. | Treat collapsed view as complete. |
| User instructed stop on collapsed threads | L2 | Ask user to expand. | Override the current instruction. |
| Search/unread filter hides entries | L1 or L2 | Verify a permitted view-only reset or ask. | Export filtered results as the entire discussion. |
| DOM contains only visible/virtualized rows | L1 or L2 | Capture while scrolling or use another explicitly permitted method; reconcile counts. | Assume one DOM snapshot contains all posts. |
| Cache access prohibited/unavailable | L1 or L2 | Use permitted DOM capture or ask for export. | Access hidden app state against tool restrictions. |
| Counter meaning unknown | L2 after inspection | Verify semantics from observed thread structure or request source clarification. | Treat unread count as reply total. |
| Missing root, reply or parent | L1, then L2 | Recheck relevant page/thread; retain failed reconciliation. | Change expected count to make it pass. |
| Entry changed between captures | L1, then L2 | Re-read affected scope and retain version evidence. | Choose one version without checking. |
| Same-name students | L0 with IDs, otherwise L2 | Keep separate verified identities. | Merge or fuzzy-match names. |
| Gradebook order requested but roster not captured | L1 or L2 | Capture ordered roster read-only or request it. | Guess alphabetical/Canvas order. |
| More than two replies or nesting deeper than two | L0 | Preserve all entries and verified parent chains. | Truncate at a fixed number/depth. |
| Multiple initial posts | L0 | Keep all in the student's post cell with labeled separators. | Keep only the latest without instruction. |
| Self-follow-up or staff reply | L0 | Retain in audit/capture; distinguish from peer replies. | Award or infer participation credit. |
| Quote or attachment boundary unclear | L2 after inspection | Preserve raw content and flag unresolved attribution. | Strip matching phrases or label attachment-only work missing. |
| Excel coerces text, adds formula or drops characters | L1 | Repair local serialization and reverify every affected cell. | Modify authored wording or waive mismatch. |
| Cell exceeds Excel's limit | L2 | Preserve original capture and agree on a lossless alternative. | Silently truncate. |
| Existing output directory | L1 | Use a fresh directory. | Overwrite a previous verified run. |
| Possible CoEqual column limitation | L2 only when import is requested | Verify current supported format and retain full export. | Drop Reply 3+ silently. |
| Ambiguous click or suspected course edit | L3 | Stop browser interaction, report evidence and uncertainty. | Guess harmlessness or try to reverse it. |
| Privacy leak or credential-bearing URL in public package | L3 | Stop publication and exclude sensitive records. | Commit captures or tokens. |

Level meanings and recovery ownership are in [error-handling.md](error-handling.md). A file-format workaround never resolves a missing-source problem.
