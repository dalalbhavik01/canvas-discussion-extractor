# Capture and Export

This file is for the agent, not a list of extra commands for the user. The user only supplies discussion URLs.

## Browser capture

- Use the authenticated browser's supported read-only page or accessibility snapshot. In Canvas, select **Expand Threads**, wait for replies to load, and verify the control now says **Collapse Threads**. Capture every pagination page, including the last. Confirm no search/author/unread filter is active.
- Save snapshots directly to private local files such as captures/701/page_1.txt, page_2.txt, etc. Keep the original snapshots until the workbook has been checked. Never rely on a single virtualized DOM view, an unread count, or a screenshot as proof of completeness.
- Inspect the first and last page in Canvas and spot-check several entries and unusual structures. The parser compares each visible **Hide N Replies** count with all captured descendants, including deeper nesting. A changed Canvas UI or unsupported body structure creates an issue to investigate, not a reason to silently skip content.
- Browser navigation can mark content read. This is not a course-content edit, but do not promise that no server state changed.

## Internal manifest

Create a private JSON manifest with only the URLs in the current request:

    {
      "sections": [
        {
          "key": "701",
          "url": "https://canvas.tamu.edu/courses/123/discussion_topics/456",
          "title": "Observed discussion title",
          "dir": "captures/701"
        }
      ]
    }

Use the verified section label from Canvas, not URL order. For two links, add a second section object. Keep capture files and student data out of Git.

## Local processing

Run from the cloned repository, using the host's Node 20+ and Python 3:

    node skills/discussion/scripts/parse_snapshots.mjs manifest.json capture.json
    node skills/discussion/scripts/build_workbooks.mjs capture.json new-output-directory
    python3 skills/discussion/scripts/verify_workbooks.py new-output-directory

The parser exits nonzero and lists issues when source counts or content are unresolved. Do not export a capture with issues. The builder uses Codex's Artifact Tool when available and otherwise uses the included openpyxl exporter. On a non-Codex host, install requirements.txt into a project virtual environment and run from that environment; never install packages globally. The output directory must be new. It contains one .xlsx per requested section and a hidden .audit directory for the readback manifest.

If the host's browser returns a different structured format, the agent may prepare the equivalent private capture.json directly from the observed content. It must have version 1 and sections with a key, URL, title, contiguous pages, ordered entries, and an empty issues list. Each entry has a local ID, kind (post or reply), visible author, optional author ID, parent ID, page, one-based order, source file, full text, and expected reply count when Canvas displays one. Do not fill missing fields with invented facts. The exporter validates this contract.

Text that begins with an Excel formula remains literal text. Long cells and unrecognized rich content require review; do not truncate them. Image filenames in snapshots are represented as labeled references, not as extracted image contents. Verify link and media-heavy entries against Canvas before delivering.
