# Discussion Failure Matrix

| Failure | Level | Safe response | Do not do |
| --- | --- | --- | --- |
| One discussion link supplied | L0 | Process that source only, with no extra scope command or second-link prompt. | Add another source from an open tab or previous run. |
| Two discussion links supplied | L0 | Process both independently without selector commands or scope confirmation. | Require "both cohorts" or "only" text. |
| Repeated URLs identify the same discussion | L0 after identity verification | Process the verified source once and report deduplication. | Invent an additional cohort workbook. |
| One supplied link is invalid/inaccessible | L2 for that source | Complete independent work; report partial delivery and the specific source issue. | Silently discard the link or claim all work complete. |
| User requests only section 1 or only section 2 | L0 | Resolve the requested label; process that cohort only. | Require both links or include the other cohort. |
| Two URLs provided but one cohort explicitly excluded | L0 | Use the verified selected URL; mark the other not requested. | Treat available URLs as authorization for both. |
| "Section 1" has no verified mapping | L2 after source inspection | Ask which link/section is intended. | Equate it with first tab or array position. |
| User narrows scope during extraction | L0 | Stop new work for excluded cohorts; preserve prior evidence privately. | Continue exporting both or delete existing work. |
| One requested cohort verified, another blocked | L1/L2 per affected stage | Finish independent work; report partial results and remaining issue. | Claim all cohorts complete or silently skip the blocked one. |
| Invalid data in an unrequested cohort | L0 | Use explicit section selection so it is not validated/exported. | Block the requested section on unrelated data. |
| User says prepare one cohort for upload | L0 | Deliver that cohort's upload-ready local workbook. | Initiate an unrequested external upload. |
| User explicitly requests an actual upload | Separate task scope | Resolve target and use an authorized upload workflow, honoring existing permission. | Pretend this extraction skill implements uploading. |
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
| Context lost, model changed, or older checkpoint requested | L1 or L2 | Follow checkpoint-recovery.md; verify hashes, scope and current source before resume. | Assume model memory transferred or revert Canvas. |
| Missing/corrupt checkpoint or changed source with unchanged counts | L1, then L2 | Use an earlier verified record or recapture affected source; invalidate derived output. | Trust counts alone or merge conflicting versions. |
| Disk full, interrupted file write or missing exporter dependency | L1, then L2 | Preserve inputs; rebuild into a fresh approved directory using supported tools. | Delete unrelated files, install globally or deliver partial files. |
| Tool rate limit or timeout | L1, then L2 | Respect observed retry timing and bounded retries. | Retry indefinitely or secretly switch providers. |
| Empty/malformed manifest or extra cohort workbook | L1 | Reject verification and regenerate scoped output from verified input. | Produce a success marker for zero sections or unrelated files. |
| Possible CoEqual column limitation | L2 only when import is requested | Verify current supported format and retain full export. | Drop Reply 3+ silently. |
| Ambiguous click or suspected course edit | L3 | Stop browser interaction, report evidence and uncertainty. | Guess harmlessness or try to reverse it. |
| Privacy leak or credential-bearing URL in public package | L3 | Stop publication and exclude sensitive records. | Commit captures or tokens. |

Level meanings and recovery ownership are in [error-handling.md](error-handling.md). A file-format workaround never resolves a missing-source problem.

For anything absent from this matrix, use [model-escalation.md](model-escalation.md). The same host model reasons from the actual evidence; it does not need a prewritten answer for every case and must not invent one when evidence is insufficient.
