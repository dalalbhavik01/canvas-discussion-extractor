# Canvas Discussion Extractor

An agentic skill for turning Canvas discussions into cohort-specific Excel workbooks. It follows the same one-request workflow as [CoEqual Assignment Creator](https://github.com/dalalbhavik01/coequal-assignment-creator): the agent reads the source, does the checks, and returns the deliverables. Canvas remains read-only.

## Use

Give the agent one discussion link for one workbook, or two links for two separate workbooks:

    \discussion https://canvas.tamu.edu/courses/123/discussion_topics/456
    \discussion https://canvas.tamu.edu/courses/123/discussion_topics/456 https://canvas.tamu.edu/courses/124/discussion_topics/789

Codex also supports the native skill invocation $discussion. Claude Code uses /discussion. The backslash form is a conversational trigger, not a registered shell command. No cohort flags, manual expansion instructions, or second-link confirmation are needed. The agent never adds another open tab or an old discussion to the request.

The agent needs a browser that can read your already-authenticated Canvas session and save page text locally. A cloned skill does not provide a Canvas login, bypass browser restrictions, or install a browser connector. If that capability is unavailable, it stops and says so; it does not quietly use a text editor or hidden API as a substitute.

## Result

Each requested cohort gets its own Excel file. Its first sheet, **Posts and Replies**, has one row per visible author and columns **Student Name**, **Discussion Post**, **Reply 1**, **Reply 2**, then **Reply 3** and beyond as needed. Replies are attributed to their writer, even when nested. Multiple initial posts stay together in the post cell. The skill does not grade, upload to CoEqual, or edit Canvas.

The agent expands threads, visits all pages, compares Canvas's thread counts with captured replies, spot-checks source text, and reads the saved Excel cells back. If those checks fail, it reports the specific gap instead of presenting a complete-looking file.

## Install

Clone this repository. It exposes the same skill folder automatically in both hosts:

- Codex, when opened in the clone: .agents/skills/discussion
- Claude Code, when opened in the clone: .claude/skills/discussion

Both entries point to skills/discussion, so there is one maintained skill, not two drifting copies. To use it from another project, copy or symlink that complete folder into your personal Codex skills directory (usually ~/.codex/skills/discussion) or Claude Code skills directory (usually ~/.claude/skills/discussion).

Node 20+ runs the snapshot parser and normalizer. The Excel builder uses Codex's bundled spreadsheet runtime when available. On another host it automatically uses Python/openpyxl; install requirements.txt in a project virtual environment once, then run the agent from that environment. No packages or student data are stored in the Git repository.

## Workflow

The original flow diagram is retained:

![Original workflow diagram](docs/workflow-diagram.svg)

The day-to-day flow is simpler:

~~~mermaid
flowchart LR
    A[One or two Canvas links] --> B[Read-only capture of all pages]
    B --> C[Posts and every reply]
    C --> D{Counts and text checked?}
    D -->|Yes| E[One Excel per cohort]
    E --> F[Saved-cell readback]
    F --> G[Deliver workbooks]
    D -->|No| H[Recheck source or report gap]
    H --> B
~~~

## Local tools

The agent creates a private manifest and page snapshots, then runs the included tools. These are internal steps, not extra instructions for the user:

    node skills/discussion/scripts/parse_snapshots.mjs manifest.json capture.json
    node skills/discussion/scripts/build_workbooks.mjs capture.json fresh-output-folder
    python3 skills/discussion/scripts/verify_workbooks.py fresh-output-folder

Only the Excel files appear as normal files in the output folder; a hidden .audit folder holds readback evidence. See [capture details](skills/discussion/references/capture.md) for the input shape and fallback behavior.

## Status and limits

The simplified parser and both Excel exporters were tested against saved, six-page Canvas discussion snapshots for two sections. It recovered two depth-4 replies that an older two-level parser missed, and all exported cells passed independent readback. The parser recognizes the Canvas accessibility format in those snapshots; if Canvas changes that format or presents content it cannot interpret, it must be checked against the live source before delivery. This repository has not been proven end-to-end on every browser or Claude Code installation.

Opening discussions may change read/unread state, even though the skill does not edit course content. The unread badge is not a submission total. Keep captures, workbooks, credentials, cookies, and student data out of Git.

Run the synthetic tests with Node's test runner and Python unittest. The tests never contact Canvas.
