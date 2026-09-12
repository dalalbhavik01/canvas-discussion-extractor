# Recovery for Unlisted Edge Cases

The model currently running the skill owns recovery: Codex in Codex, Claude in Claude, or the active model in another host. The workflow does not require a second model or a model-provider API key. It switches from the normal workflow to evidence-based recovery reasoning when an unexpected condition occurs. Do not claim a different model was invoked unless the host actually supports and performs that operation.

## Procedure

1. Preserve the current checkpoint, source evidence and error. Identify exactly which requested cohort/stage is affected. Distinguish a normal scope preference (one cohort only) from a real failure.
2. Restate the current user intent and verified scope. Separate observed facts from uncertainty. Do not use stale assumptions from previous courses or the other cohort.
3. Identify the invariant at risk: authorized scope, Canvas content safety, permitted tool use, identity, source fidelity, completeness, or workbook preservation.
4. Consider only permitted actions. Prefer a fresh observation, a targeted read-only retry, replay from verified local records, or a local serialization repair. Never propose an edit to Canvas, fabricated entry, changed expected count, silent reply truncation, or cross-cohort substitution as a repair.
5. Choose L0/L1/L2/L3 with a concise evidence-based explanation. Routine choices and safe recoveries are autonomous. Ask only for a missing decision/access/source mapping that cannot be resolved from available evidence. Never ask again for an authorization already given.
6. Execute the chosen safe action and verify its actual result against the failed check. A proposed recovery is not a successful recovery. Use one retry per unchanged hypothesis; if it fails, inspect the new evidence and try a materially different permitted route or stop that stage. Avoid blind loops and repeated model calls.
7. Resume from the last verified checkpoint. Keep each requested cohort's status independent. Deliver a verified subset only with explicit outstanding statuses; do not silently remove blocked cohorts from the user's request. A suspected Canvas mutation stops all browser interaction and must be disclosed first.

## Decision Input

Record these fields in the private decision log: current host (only if known), stage, requested cohorts, affected cohorts, observed problem, evidence references, verified facts, unresolved facts, attempted actions/results, permitted alternatives, and relevant user constraints. Do not log credentials, hidden reasoning, or unneeded student text.

## Decision Output

```json
{
  "decision_level": "L1",
  "affected_sections": ["verified section key"],
  "decision": "retry_read_only",
  "reason": "Concise explanation supported by the observed evidence",
  "next_action": "Specific permitted action",
  "verification_required": "Source observation or failed check to repeat",
  "requires_user_input": false,
  "question": null,
  "outcome": "pending"
}
```

The example values are not a default answer. Populate them for the actual case and update outcome only after verification. Allowed decisions include `continue`, `retry_read_only`, `use_verified_local_capture`, `repair_local_export`, `request_source_or_mapping`, and `stop_unsafe_action`.

## Model Changes or Delegation

Use [Checkpoint Recovery](checkpoint-recovery.md) for model changes, local rollback, interrupted writes, stale source checks and invalidating downstream results. Rollback never alters Canvas and does not automatically select another model.

If the user changes the host model mid-run, the new model reads the same checkpoint, current instructions and evidence before resuming. Do not assume it remembers the previous model's work. A separate review agent may be used when supported and authorized, with the minimum necessary local evidence. The main host remains responsible. Lack of a second model does not itself block recovery.

Do not automatically send student data to another provider, change account settings, spend on an external model, or create another task merely because an edge case occurred. Ask only if a genuinely necessary action requires missing user authorization or information. If available tools cannot safely establish the answer, report the unresolved limitation instead of asserting that AI can handle every case.
