# Extraction and Verification

## 1. Start From the Current Page

Use the discussion URLs explicitly supplied for this invocation: one link processes one source, two links process both. No extra cohort-selection command or confirmation is required. Do not add links from ambient tabs or prior runs. The agent handles any internal capture selectors. Use the logged-in browser and its setup documentation; prefer the existing matching tab. Match course/discussion IDs as well as titles. Record actual section labels from Canvas or user-provided evidence. If one discussion spans several sections, capture membership and filter scope explicitly; do not infer section membership from the URL alone.

Record the discussion prompt and rubric only if separately requested. For this skill, the required deliverable is student discussion content. Do not initiate grading, assignment creation, or uploads.

Take a fresh snapshot before interactions. Use semantic locators for Expand Threads and pagination. If coordinates are the only option, use coordinates from the current tool screenshot in its own coordinate system, never `getBoundingClientRect()` values from a differently scaled viewport. Verify the destination immediately after every click. Do not use programmatic click dispatch as a shortcut.

Check search/unread/author filters. If the view is filtered, report the filter and use a permitted view-only reset only if known to be safe; never export a filtered subset as all submissions.

## 2. Extract Through Permitted Sources

Preferred portable method: inspect expanded rendered discussion entries with the host's DOM/accessibility tools. Confirm selectors/labels against the current page; do not reuse historical selectors blindly. Scroll through each page and accumulate entries by stable ID, revisiting overlaps to check edits and deduplicate observations. Traverse every pagination page and every nested reply until there are no additional entries to load. A disabled Next button proves pagination ended, not that every nested reply loaded.

If only text snapshots are exposed, preserve snapshot files and identify entries by the hierarchy actually present. Do not classify posts vs replies solely from heading levels or indentation unless the mapping has been visually verified, including deeper nesting. If stable identity or relationships cannot be established, request a supported user export or leave extraction incomplete.

Optional frontend cache: only when the host tool explicitly permits reading application state and Canvas exposes it. Some Canvas installations have an Apollo cache. Do not assume `window.__APOLLO_CLIENT__` exists, that the cache schema is stable, or that a cached object belongs to this discussion. Never use this path when evaluation is limited to DOM-backed content. Do not dump the entire application cache. Scope records by the observed course/topic root and inspect only already-loaded discussion entries and referenced authors. Do not call client queries, fetch, XHR, GraphQL, cache.write, or refetch methods. Do not use hidden endpoints, cookies, localStorage, or inserted DOM nodes to transport data. Reading a cache neither proves completeness nor promises zero browser-generated requests.

When changing extraction method, record the reason and checks. Distinguish browser navigation requests and automatic read markers from script-initiated API requests. Do not describe frontend-cache extraction as visible-page scraping.

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

Report section labels, source URLs, capture interval, pages visited, extraction method, row/post/peer-reply totals, excluded self/staff/deleted records, count mismatches, saved-cell differences, and source spot-check results. Say whether roster-only students were included and what order was used.

Evidence of a suspected mutation means stop and disclose before any further interaction. Avoid declaring a stray click harmless without evidence or claiming an audit log was checked when it was not. For normal extraction say which course-content actions were not used, and separately record observed read-state changes. Do not use an unconditional boilerplate assertion that no server state changed.
