---
name: discussion
description: Extract Canvas discussion posts and every reply into separate cohort Excel workbooks. Use for \discussion, $discussion, /discussion, or a request for CoEqual discussion upload sheets. This skill does not grade or edit Canvas.
---

# Discussion

The user supplies one or more Canvas discussion URLs. One URL means one discussion; two URLs mean two separate workbooks. Use only the URLs in the current request, never other open tabs or old course links. Do not ask for a second URL or cohort-selection flags.

## Work

1. Open each requested URL in the authenticated browser. Confirm the course, section, discussion title and unfiltered view. Canvas is read-only: navigate, expand threads, scroll and paginate only. Never post, edit, grade, publish, change settings, or "fix" Canvas content. Viewing may change read/unread indicators.
2. Expand all threads and visit every page. Save each page's complete readable page/accessibility snapshot directly to private local files, in Canvas display order. Do not route student content through a text editor, clipboard relay, hidden Canvas API, frontend cache, or manual transcription. Use the browser's documented read capability. If it cannot capture and save the content, stop and explain the specific missing capability; a skill cannot grant browser access.
3. Normalize the snapshots with [Capture](references/capture.md). The included parser handles the known Canvas accessibility format, including nested replies. If the UI format has changed, adapt the capture carefully from observed source text; do not invent entry IDs, dates, authors or content. Resolve parser issues against Canvas before exporting. A local record ID is a file-position label, not a Canvas ID.
4. Confirm all pages were captured, threads were expanded, and displayed reply counts match captured descendants. Spot-check authors and full text on the first and last pages, plus unusual formatting or nesting. Keep every authored reply, including Reply 3 and beyond. Do not treat the unread badge as a submission count.
5. Build one workbook per requested URL. The first sheet is **Posts and Replies**, with **Student Name**, **Discussion Post**, **Reply 1**, **Reply 2**, and as many additional reply columns as needed. One row belongs to one verified author. If the same display name has conflicting author IDs, resolve it before export. Preserve multiple top-level posts in the same post cell with a labeled separator. Do not infer missing submissions or grades.
6. Read the saved workbook back with the verifier. If source coverage, attribution, text, or workbook cells do not reconcile, fix the affected local capture/output or report the precise limitation. Do not call an incomplete capture verified.
7. Return only the requested Excel links, per-cohort post/reply totals, and any material limitation. Keep the local capture and verification records private; do not upload student data to GitHub or CoEqual.

## Recovery

Retry a failed read-only page capture or parsing step after checking the current page. If one of two URLs is inaccessible, finish the independent URL and report the other as incomplete. If a browser action may have changed course content, stop browser interaction and disclose the uncertainty; never attempt an undo. Do not switch models or extraction methods automatically to hide missing evidence.

The skill is agentic guidance plus local parsing/export helpers, not a Canvas connector. A logged-in browser with readable page content and local file access is required on every host.
