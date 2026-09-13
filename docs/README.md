# Documentation Guide

Start with the [repository README](../README.md) for the two diagrams, setup and output format. These guides describe the workflow, its boundaries and verification.

## Run the Workflow

| Guide | Use it for |
| --- | --- |
| [Skill entrypoint](../skills/discussion/SKILL.md) | Invocation, scope, safety rules and reference routing. |
| [Workflow](../skills/discussion/references/workflow.md) | Read-only capture, normalization, export and handoff. |
| [Portable prompt](../skills/discussion/references/portable-workflow.md) | Running with another browser-capable AI host. |
| [Transfer and setup](../skills/discussion/references/transfer.md) | Installation, runtime requirements and selected-cohort export commands. |
| [Data contract](../skills/discussion/references/data-contract.md) | Capture fields, identity, evidence and count semantics. |

## Safety and Recovery

| Guide | Use it for |
| --- | --- |
| [Canvas read-only policy](../skills/discussion/references/canvas-read-only-policy.md) | Allowed actions, unsafe controls and uncertain clicks. |
| [Error handling](../skills/discussion/references/error-handling.md) | L0-L3 decisions and per-cohort recovery. |
| [Failure matrix](../skills/discussion/references/comprehensive-error-handling-matrix.md) | Known failures, safe recovery and forbidden shortcuts. |
| [Host-model escalation](../skills/discussion/references/model-escalation.md) | Unexpected cases and bounded retries. |
| [Checkpoint recovery](../skills/discussion/references/checkpoint-recovery.md) | Interrupted runs, local rollback, model handoff and stale-output invalidation. |
| [Run-state template](../skills/discussion/references/run-state-template.json) | Agent-maintained checkpoints, decisions and unresolved statuses. |

## Verification and Development

| Guide | Use it for |
| --- | --- |
| [Verification checklist](../skills/discussion/references/verification-checklist.md) | Evidence and delivery gates. |
| [Failure drills](../skills/discussion/references/failure-drills.md) | Synthetic scenarios and explicit live-test gaps. |
| [Reliability audit](reliability-audit.md) | Corrected defects, tested safeguards and remaining limits. |
| [Development](development.md) | Test commands and safe source changes. |
| [Architecture](agentic-architecture.md) | Host responsibilities versus script implementation. |
| [Original repo comparison](old-repo-comparison.md) | Structure carried over and assignment-creation features intentionally excluded. |

## Diagrams

- [Compact overview](workflow-diagram.svg): the new visual, simplified for README readability.
- [Original workflow source](workflow-diagram.mmd): the original Mermaid diagram, also embedded in the README.

Each operational guide has one maintained copy under `skills/discussion/references`. This keeps a standalone skill installation complete while making every topic accessible from this index.
