# Comparison With the Assignment-Creator Repository

Reviewed all 22 tracked files from [coequal-assignment-creator](https://github.com/dalalbhavik01/coequal-assignment-creator/tree/7765c96f3a3284a09501f8e3abc09d8339a00c76) at commit `7765c96f3a3284a09501f8e3abc09d8339a00c76`: three root files, eleven docs/diagram files, the skill entrypoint, and seven skill references. Both the full docs and shorter installed-skill references were reviewed.

The initial discussion version followed the core safety and portability approach but did not yet mirror all recovery/documentation components. This revision fills those gaps.

| Old repository component | Discussion counterpart | Intentional difference |
| --- | --- | --- |
| Primary `\createAssignment` trigger | Primary `\discussion` trigger | Discussion URLs initiate extraction. |
| Native `$coequal-assignment-creator` skill | Native `$discussion` skill | Installed as `discussion`. |
| README, config and workflow diagrams | Matching README section order, example config, compact SVG overview and original Mermaid workflow | No account-specific default URLs; original discussion Mermaid preserved. |
| Framework-neutral agentic architecture | `docs/agentic-architecture.md` | Adds executable export/validation tools; browser orchestration remains agent-assisted. |
| Canvas action gate/read-only policy | `references/canvas-read-only-policy.md` | Read-state side effects explicitly distinguished from course-content edits. |
| L0-L3 escalation and error taxonomy | `references/error-handling.md` and failure matrix | Recovery decisions concern capture truth and output integrity. |
| Per-stage recovery state | `references/run-state-template.json` | Agent-owned browser state is separate from deterministic export reports. |
| Full verification checklist | `references/verification-checklist.md` | Roots, replies, authorship, all columns, saved cells and source spot-checks. |
| Failure drills | `references/failure-drills.md` plus tests | Distinguishes automated synthetic tests from untested browser behavior. |
| Portable operating prompt and transfer guide | `references/portable-workflow.md` and `transfer.md` | All necessary instructions travel inside the copied skill folder. |
| Exact rubric mapping and instructor notes | Not part of extraction | No grading rules or benchmark requirements are imported. |
| CoEqual draft and final user Create click | Local-file handoff | No CoEqual edits, uploads or creation. |
| Privacy exclusions | `.gitignore`, local run records, transfer guidance | Student capture is necessary locally but excluded from repository/ZIP. |

It is the same style of portable operating playbook, adapted to a different task, not an identical copy. Unlike the old repo's unconditional integrity wording, this skill records uncertainty and read-marker side effects. It also does not copy any instruction to infer cohort size: discussion identity and membership must come from source evidence.

Validation establishes local skill structure and synthetic data/export behavior. Neither this comparison nor the test suite establishes a successful live Canvas extraction or CoEqual import.
