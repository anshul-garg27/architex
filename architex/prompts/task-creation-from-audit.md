# Task Creation from Audit Findings

> **Usage:** After running the Module Deep Audit prompt, feed its output into this prompt to generate structured, board-ready tasks. Give to any capable AI agent.

---

## Prompt

You are a senior engineering manager converting audit findings into a structured, actionable task board. You have received a comprehensive audit report for the **{{MODULE_NAME}}** module of the Architex application.

Your job is to create a JSON file at `docs/tasks/batch-{{module-slug}}-fixes.json` containing every task needed to fix all bugs, wire up all broken features, and implement all recommended enhancements.

### Input

You will be given the audit report. Read it completely before creating any tasks.

### Task Schema

Every task MUST follow this exact JSON schema:

```json
{
  "id": "{{EPIC}}-{{NUMBER}}",
  "epic": "{{EPIC}}",
  "title": "Concise action-oriented title (imperative verb first)",
  "description": "Detailed description including: what's broken/missing, where (file:line), root cause, and the specific fix or implementation approach. Include code snippets where helpful.",
  "acceptanceCriteria": [
    "Specific, testable criterion 1",
    "Specific, testable criterion 2",
    "Specific, testable criterion 3"
  ],
  "priority": "P0|P1|P2|P3",
  "effort": "S|M|L|XL",
  "status": "ready",
  "phase": 3,
  "module": "{{module-name}}",
  "category": "frontend",
  "files": ["src/path/to/file1.tsx", "src/path/to/file2.ts"],
  "dependencies": ["{{EPIC}}-XXX"],
  "blockedBy": [],
  "tags": ["relevant", "searchable", "tags"]
}
```

### Task ID Convention

Use the epic prefix from this mapping:
- Algorithm Visualizer → `ALG`
- Data Structure Explorer → `DST`
- System Design Simulator → `SDS`
- Low-Level Design Studio → `LLD`
- Database Design Lab → `DBL`
- Distributed Systems → `DIS`
- Networking & Protocols → `NET`
- OS Concepts → `OSC`
- Concurrency Lab → `CON`
- Security & Cryptography → `SEC`
- ML System Design → `MLD`
- Interview Engine → `INT`

Check `docs/tasks/tasks.json` for the last used task number in the epic and continue from there.

### Priority Rules

- **P0 (Critical):** Feature completely broken — user clicks something and nothing happens, or app crashes. Includes: silent failures, broken runners, wrong UI rendering, data corruption.
- **P1 (High):** Feature works but produces wrong results, has visible bugs, or is significantly degraded. Includes: wrong descriptions, visual mismatches, playback issues, missing state sync.
- **P2 (Medium):** Feature works correctly but has UX friction, missing polish, or minor visual issues. Includes: extra clicks required, no validation feedback, missing legends, dropdown issues.
- **P3 (Low):** Code quality, accessibility, performance, structural cleanup. Doesn't affect current user-visible behavior but improves maintainability or future extensibility.

### Effort Estimation

- **S (Small):** 1-2 files changed, < 50 lines of code, straightforward fix
- **M (Medium):** 2-4 files changed, 50-200 lines, some design decisions needed
- **L (Large):** 4-8 files changed, 200-500 lines, significant implementation work
- **XL (Extra Large):** 8+ files, 500+ lines, new component/system creation

### Task Organization Rules

1. **One task per logical fix.** Don't bundle unrelated bugs into one task. But DO bundle related bugs in the same file/component (e.g., "Fix 4 bugs in ArrayVisualizer" is fine if they're all in the same file).

2. **Group by theme, not by file.** "Wire up 10 missing sorting runners" is better than 10 separate "Wire up shell-sort" tasks.

3. **Dependencies must be explicit.** If Task B can't start until Task A is done, add `"dependencies": ["EPIC-XXX"]`.

4. **Bug fixes before enhancements.** All P0/P1 bug fixes should have lower task IDs than P2/P3 enhancements.

5. **Every broken dropdown item = P0.** If a user can select something from a dropdown and clicking Run does nothing — that's a P0, not a P2.

6. **World-class features are P1-P2, not P3.** If a feature would meaningfully improve the learning experience (sonification, code sync, race mode), it's P1 or P2, not backlog.

### Acceptance Criteria Rules

- Every criterion must be **independently testable** — someone could check ✅ or ❌
- Include **negative criteria** where relevant: "No silent failures — every dropdown item produces visible output"
- Include **edge case criteria**: "Works with empty input", "Handles arrays > 1000 elements"
- For UI tasks, include **visual criteria**: "Active state uses blue highlight matching design tokens"

### Output Requirements

1. **Create the batch JSON file** at `docs/tasks/batch-{{module-slug}}-fixes.json`
2. **Update the epic metadata** in `docs/tasks/tasks.json` — increment `taskCount` by the number of new tasks
3. **Update the board loader** — add the new batch filename to the `BATCH_FILES` array in `docs/tasks/board-index.html` (line ~621, inside the `loadData` function)
4. **Print a summary table** showing tasks by priority and effort

### Summary Table Format

```
## Task Summary: {{MODULE_NAME}} Audit

### By Priority
| Priority | Count | Description |
|----------|-------|-------------|
| P0       | X     | Critical — broken features |
| P1       | X     | High — wrong behavior |
| P2       | X     | Medium — UX polish |
| P3       | X     | Low — code quality |

### By Category
| Category | Count | Examples |
|----------|-------|---------|
| Wire up broken items | X | Missing runners, wrong vizType |
| Visualizer bugs | X | Colors, animations, layout |
| Engine/data bugs | X | Wrong descriptions, stale values |
| Playback bugs | X | Sync, auto-stop, drift |
| UX improvements | X | Validation, presets, dropdowns |
| World-class features | X | Sound, code sync, race mode |
| Accessibility | X | ARIA, reduced motion |
| Performance | X | Memoization, indexing |
| Cleanup/refactor | X | Dedup, dead code removal |

### Recommended Execution Order
1. First: [P0 tasks — make everything work]
2. Then: [P1 bug fixes — make everything correct]
3. Then: [P1 world-class features — make it exceptional]
4. Then: [P2 UX polish — make it delightful]
5. Last: [P3 cleanup — make it maintainable]

### Files Modified
Total files touched: X
Most-modified file: [filename] (appears in Y tasks)
```
