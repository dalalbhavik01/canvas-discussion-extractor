# Development and Testing

The workflow has two layers: agent-operated browser capture and deterministic local validation/export. A passing local test does not verify a Canvas session.

## Runtime

- Node.js 20 or newer runs capture validation and Node tests.
- The included Excel builder requires the host's `@oai/artifact-tool` runtime.
- Python 3.9 or newer runs text preservation and OOXML verification using only the standard library.

Use the [transfer guide](../skills/discussion/references/transfer.md) to locate the host runtime and make its modules available. Install additional dependencies only in an isolated project environment. Do not hard-code local runtime paths into shared source.

## Capture Validation

From the repository root:

```sh
node --test tests/discussion.test.mjs
```

No external packages are required. These tests exercise author attribution, reply depths, root coverage, conflicts, quote/attachment states, text limits and cohort selection.

## Cohort Exports

With the spreadsheet runtime available:

```sh
node --test tests/selection_export.test.mjs
```

This runs capture tests plus default two-cohort and selected one-cohort exports. It independently reads each output and verifies excluded student data is absent. The current suite reports 45 tests in total; do not add the capture suite's count again.

## Workbook Verification

Use a fresh ignored run directory, replacing this example path if it already exists:

```sh
mkdir -p outputs/test-run-001
node tests/export_fixture.mjs outputs/test-run-001/capture.json
node skills/discussion/scripts/build_workbooks.mjs outputs/test-run-001/capture.json outputs/test-run-001/export
python3 skills/discussion/scripts/verify_workbooks.py outputs/test-run-001/export
DISCUSSION_TEST_EXPORT=outputs/test-run-001/export python3 -m unittest discover -s tests -p test_verifier.py -v
```

The fixture contains synthetic students only. The 12 Python tests copy it to temporary directories before altering files. They test changed text, formulas, extra content, missing workbooks and invalid manifests. Never run mutation tests against student submissions. The combined count is 45 Node tests plus 12 Python tests: 57.

## Review Before Publishing

Check relative documentation links and JSON syntax; render changed diagrams at README width. Validate the skill using the host's skill validator when available. Review staged changes and exclude captures, workbooks, credentials, private URLs and dependencies. Match the installed skill to the repository without overwriting independent customizations.

Routine tests need no Canvas access or CoEqual uploads. Supervised live testing is a separate authorized run described in the [reliability audit](reliability-audit.md).
