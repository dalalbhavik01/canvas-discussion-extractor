# Extraction and Verification

## 0. Verify the Established Path Before Bulk Capture

Resolve the current URL scope, then check the active tool's documented capabilities. A capability gate is an internal decision, not a new user task. Use an existing matching authenticated tab for a small read-only inspection when necessary.

- Confirm the permitted extraction source can provide authored text, author identities, thread relationships, pagination and reconciliation evidence.
- Confirm the browser result can be saved directly to private local files using supported tool output/file operations, without routing it through another desktop application or manually retyping student text. Confirm the workbook runtime and independent readback are available as well. Test local serialization with synthetic text if needed, not a student's submission.
- Reuse a previously successful method only when its implementation and required capabilities are actually available. Prior chat claims are not proof that DOM evaluation, an Apollo cache or a file bridge exists now. Do not substitute an API request for missing browser support.
- Record the selected method, permitted tools and local transport in run state. Proceed without asking about ordinary scope, expansion or verification decisions.

If the established method is unavailable, stop before bulk capture. State the specific missing capability and its effect in plain language. Offer one supported alternative only if it can preserve the required evidence and content, and obtain agreement before switching. TextEdit/Word, clipboard relays, manual transcription and asking the user to run console code are not automatic fallbacks. Do not relax identity, timestamp, ordering or completeness requirements just to make an exporter accept the result. A user-approved alternative must have an explicit supported data contract; approval alone does not make the existing exporter compatible.

Use the same gate if a capability fails mid-run: retain verified local evidence and pause only affected work. Bounded retries of the same approved read-only method are normal recovery, not a method change. Do not repeatedly ask about a fallback already agreed for the current run. Approval from an older run is not a permanent change to the default workflow.

## 1. Start From the Current Page

Use the discussion URLs explicitly supplied for this invocation: one link processes one source, two links process both. No extra cohort-selection command or confirmation is required. Do not add links from ambient tabs or prior runs. The agent handles any internal capture selectors. Use the logged-in browser and its setup documentation; prefer the existing matching tab. Match course/discussion IDs as well as titles. Record actual section labels from Canvas or user-provided evidence. If one discussion spans several sections, capture membership and filter scope explicitly; do not infer section membership from the URL alone.

Record the discussion prompt and rubric only if separately requested. For this skill, the required deliverable is student discussion content. Do not initiate grading, assignment creation, or uploads.

Take a fresh snapshot before interactions. Use semantic locators for Expand Threads and pagination. If coordinates are the only option, use coordinates from the current tool screenshot in its own coordinate system, never `getBoundingClientRect()` values from a differently scaled viewport. Verify the destination immediately after every click. Do not use programmatic click dispatch as a shortcut.

Check search/unread/author filters. If the view is filtered, report the filter and use a permitted view-only reset only if known to be safe; never export a filtered subset as all submissions.

## 2. Extract Through Permitted Sources

Use the established permitted extraction source selected at preflight. For rendered DOM extraction, confirm selectors/labels against the current page; do not reuse historical selectors blindly. Scroll through each page and accumulate entries by stable ID, revisiting overlaps to check edits and deduplicate observations. Traverse every pagination page and every nested reply until there are no additional entries to load. A disabled Next button proves pagination ended, not that every nested reply loaded. Likewise, Collapse Threads proves the expansion control is active, not that asynchronous replies have finished loading. Check loading indicators and thread counts on every page; wait for a fresh ready observation before saving that page as complete.

If only text/accessibility snapshots are exposed and this differs from the established method, use the capability gate before proceeding. In an agreed snapshot-based run, preserve snapshot files through direct local transport and identify entries by the hierarchy actually present. Do not classify posts vs replies solely from heading levels or indentation unless the mapping has been visually verified, including deeper nesting. If stable identity or relationships cannot be established, report the specific missing evidence rather than inventing Canvas IDs. Do not present accessibility-tree inspection as an accessibility audit or make it a separate user step.

Optional frontend cache: only when the host tool explicitly permits reading application state and Canvas exposes it. Some Canvas installations have an Apollo cache. Do not assume `window.__APOLLO_CLIENT__` exists, that the cache schema is stable, or that a cached object belongs to this discussion. Never use this path when evaluation is limited to DOM-backed content. Do not dump the entire application cache. Scope records by the observed course/topic root and inspect only already-loaded discussion entries and referenced authors. Do not call client queries, fetch, XHR, GraphQL, cache.write, or refetch methods. Do not use hidden endpoints, cookies, localStorage, or inserted DOM nodes to transport data. Reading a cache neither proves completeness nor promises zero browser-generated requests.

When an approved extraction-method change is necessary, record the reason, agreement and checks. Distinguish browser navigation requests and automatic read markers from script-initiated API requests. Do not describe frontend-cache extraction as visible-page scraping.

## 3. Normalize Without Inventing Data

Use [data-contract.md](data-contract.md). Preserve full captured text and separate original text/quotes/media references with explicit evidence. Decode HTML entities through a structured HTML parser if extracting HTML. Preserve paragraph boundaries and Unicode. Do not double-decode strings or remove repeated authored paragraphs. Record any HTML-to-text transformation and compare its output to visible content.

Resolve parent chains at any depth, including descendants of deleted parents. Count deleted placeholders only when the source counter includes them. Do not assume `subentriesCount` counts all descendants: verify the current meaning and use the contract's matching semantics. Unknown meanings are unresolved, not zeros. Reconcile root coverage independently from per-thread replies: matching all captured thread counts can still omit a whole thread.

Keep roster scope explicit. IDs are opaque strings, not numeric arithmetic values. Same display name with different IDs means different students. For two sections, the same ID may appear in both when supported by membership; never merge across sections. Student rows contain their own top-level entries plus their own peer replies anywhere in the discussion. Self-replies are retained in the audit so they cannot be mistaken for peer participation.

## 4. Export and Check

The deterministic exporter validates records and emits each section independently. It rejects incomplete coverage, count mismatches, unresolved parent/author IDs, duplicate versions, impossible relationships, unknown quote status, and unconfirmed attachments. It does not retrieve Canvas data or verify the truth of an agent-entered evidence statement.

Every workbook starts with `Posts and Replies`. `Audit` records identity, cell assignment, and exclusions without altering student text. All replies beyond two get additional columns. If CoEqual's current importer cannot accept these, keep the full workbook and ask about the supported import format; do not silently discard extra replies or assert an untested column limit.

The exporter refuses Excel cell lengths beyond 32,767 UTF-16 units and invalid XML characters rather than silently truncating them. Retain the original JSON and report the issue before agreeing on split cells/files. Content that resembles a formula is literal text; verify this in saved OOXML. Avoid CSV for exact source text unless a tested formula-injection strategy is explicitly chosen.

Run saved-file verification and inspect previews. For long entries that exceed practical row heights, make clear that the full cell content is available through the formula bar; visual preview is a sample, not a proof of full text.

Source spot-checks should include first/last page, first/last student, the largest reply count, nesting, same-name authors, multiple initial posts, attachments and quote cases when present. Compare authors, full text and reply attribution. For larger cohorts check at least five students distributed across pages plus the exception cases. Record cases not encountered as untested. Reconcile again if counts or edited timestamps changed during capture.

## 5. Report Honestly

Keep the normal handoff short: workbook links, per-cohort totals, verification outcome and any material limitation. Keep detailed source evidence and technical method notes in the private audit. Explain a blocker when it happens, not after introducing a workaround. Never claim an unfinished workbook exists or that capturing text alone completed the extraction.

Report section labels, source URLs, capture interval, pages visited, extraction method, row/post/peer-reply totals, excluded self/staff/deleted records, count mismatches, saved-cell differences, and source spot-check results. Say whether roster-only students were included and what order was used.

Evidence of a suspected mutation means stop and disclose before any further interaction. Avoid declaring a stray click harmless without evidence or claiming an audit log was checked when it was not. For normal extraction say which course-content actions were not used, and separately record observed read-state changes. Do not use an unconditional boilerplate assertion that no server state changed.
