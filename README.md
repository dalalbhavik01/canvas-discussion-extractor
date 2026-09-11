# Canvas Discussion Extractor

A portable agent skill for extracting Canvas discussion posts and **all** replies into section-specific CoEqual workbooks. Inspired by the workflow structure of [coequal-assignment-creator](https://github.com/dalalbhavik01/coequal-assignment-creator).

## Use

Install `skills/discussion` in your agent's skills folder, then invoke:

```text
$discussion <discussion URL for cohort 1> <discussion URL for cohort 2>
```

`\discussion <URLs>` is also a phrase recognized by these instructions; it is not a registered application command. The native Codex skill invocation is `$discussion`.

The agent uses an authenticated browser supplied by the user. This is an agent-assisted extraction workflow, not a standalone crawler. It requires no Canvas API token or OAuth integration. Browser access and permitted inspection capabilities depend on the host. No credentials or student records ship with the skill.

## Output

Each section gets its own `.xlsx`. The first sheet is `Posts and Replies`, with `Student Name`, `Discussion Post`, `Reply 1`, `Reply 2`, and additional reply columns as needed. Rows represent authors, not threads. Replies belong to their writer, not the author of the thread they answered. An `Audit` sheet maps rows and cells back to entry IDs. Local JSON records preserve extraction evidence and original captured text.

The workflow reconciles thread counts, validates parent relationships, preserves multiple initial posts, and verifies saved workbook cells. An extraction that cannot establish completeness stays incomplete. It does not grade or upload to CoEqual.

## Transfer and Development

See [transfer instructions](skills/discussion/references/transfer.md) for installation, dependencies, generic-agent use, and packaging. The entire skill is self-contained under `skills/discussion`.

Run the dependency-free checks with Node.js 20 or newer:

```sh
node --test tests/discussion.test.mjs
```

To exercise actual workbook exports, generate synthetic captures with `node tests/export_fixture.mjs capture.json`, run the builder and verifier from the transfer guide, then run `DISCUSSION_TEST_EXPORT=/path/to/synthetic/export python3 -m unittest discover -s tests -p 'test_*.py'`. Keep synthetic captures under `outputs/`; never run mutation tests against real student work.

The optional Excel export uses the host's `@oai/artifact-tool` runtime. It never installs packages globally. Use [the data contract](skills/discussion/references/data-contract.md) to supply a capture, then follow [the workflow](skills/discussion/references/workflow.md).

## Verification Boundary

Offline tests cover synthetic records, not a live Canvas session. A passing workbook comparison proves that export preserved the supplied capture; it does not independently prove that the capture includes everything on Canvas. That requires page coverage, count evidence, and source spot-checks for each actual run. CoEqual acceptance of extra reply columns must be checked in the target account before upload.

Canvas course content is never edited by this workflow. Viewing discussions may change read/unread state. Unexpected clicks or suspected mutations are reported immediately, without attempting a reversal.
