# Transfer

## Codex

Copy this complete `discussion` folder into the target account's `$CODEX_HOME/skills` (normally `~/.codex/skills`). Keep `SKILL.md`, `agents`, `references`, and `scripts` together. Open a new task so the app can discover the skill and use `$discussion <URLs>`. The backslash phrase `\discussion` is a conversational alias, not a command registered with Codex.

No personal paths, Canvas URLs, authentication details, course IDs, or student records are built into the skill. Each run needs fresh discussion URLs and the user's logged-in browser. Installing the skill does not give another account your Canvas session.

## Another Agent

Provide `SKILL.md` and the referenced files to the agent. Ask it to follow the workflow with its documented browser and file tools. Browser application-state access is optional and must be allowed by that host; never transfer an assumption that hidden-cache evaluation is supported. If only screenshots are available, the agent must establish identity and completeness or request a user export, not fabricate structured records.

## Local Export Commands

Node.js 20+ runs the data validation without external packages:

```sh
node scripts/prepare.mjs capture.json prepared.json
```

For Excel, use the target Codex workspace dependency loader to obtain the bundled Node executable and `node_modules` directory. Link `node_modules` in the working directory to that dependency directory, then run the scripts from the skill folder (or a complete local copy). Do not put machine-specific dependency paths in the shared skill. The builder dynamically locates the artifact tool from the current working directory.

```sh
node /path/to/discussion/scripts/build_workbooks.mjs capture.json outputs/run-001
python3 /path/to/discussion/scripts/verify_workbooks.py outputs/run-001
```

The output directory must be new. If the host does not provide `@oai/artifact-tool`, use its supported spreadsheet tool to write the exact matrices from `prepare.mjs` and run the OOXML verifier. Do not claim the bundled exporter is runnable without its dependency. Any dependency installation must be isolated to a project environment; use a virtual environment for Python downloads. The validator and OOXML verifier use only standard libraries and need no downloads.

The builder requires Python 3.9+ for a standard-library text-preservation step. Set `DISCUSSION_PYTHON` to the host's Python executable if `python3` is unavailable. Artifact Tool can coerce ISO timestamps into numeric dates even in text-formatted ranges, so `restore_text_cells.py` replaces only expected string cells with literal OOXML strings after export. The separate verifier then checks all saved cells and rejects formulas. No dependencies are downloaded for this step.

Transfer only the skill folder or repository source. Exclude outputs, captures, downloaded files, ZIPs of student work, cookies, credentials, and node_modules. The repository `.gitignore` covers the default output locations but is not a substitute for reviewing files before publishing. No public GitHub publication is required to use or transfer the skill.
