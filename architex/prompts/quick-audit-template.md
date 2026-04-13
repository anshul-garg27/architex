# Quick Audit Template (Copy-Paste Ready)

> Replace the 3 variables and paste to any AI agent.

---

## Variables to Replace:
- `MODULE` = e.g., "Data Structures", "Algorithm Visualizer", "LLD Studio"  
- `EPIC` = e.g., "DST", "ALG", "LLD"
- `PATH` = e.g., "src/components/modules/DataStructuresModule.tsx"

---

## The Prompt (copy everything below)

```
I need you to do two things for the {{MODULE}} module in the Architex project (Next.js 15 + React 19 + TypeScript + Tailwind + Zustand):

═══════════════════════════════════════════
PART 1: EXHAUSTIVE DEEP AUDIT
═══════════════════════════════════════════

Read EVERY file involved in this module. Start from {{PATH}} and trace all imports, hooks, components, types, engines, and stores.

Deliver:

1. COMPLETENESS TABLE — Every item in every dropdown/selector. For each: does it work? Does Run/Execute produce visible output? If not, where does the code path break?

2. BUG REPORT — Every bug found, categorized:
   - Critical: silent failures, crashes, wrong UI rendering
   - High: wrong output, visual mismatches, state desync
   - Medium: UX friction, missing feedback, minor visual glitches
   - Low: code quality, accessibility, performance

   Format: [BUG-XXX] Description — File:Line — Root cause — Fix approach

3. WORLD-CLASS FEATURE GAPS — Compare against the best in class (VisuAlgo, Brilliant, Red Blob Games, 3Blue1Brown, Sorting.at). What features would make this go viral? Think: sonification, live code sync, race mode, interactive manipulation, shareable URLs, export as GIF, heatmaps, natural language explanations.

═══════════════════════════════════════════
PART 2: CREATE STRUCTURED TASKS
═══════════════════════════════════════════

From your audit, create a JSON task file at: docs/tasks/batch-{{EPIC_LOWERCASE}}-fixes.json

Each task follows this schema:
{
  "id": "{{EPIC}}-XXX",
  "epic": "{{EPIC}}",
  "title": "Imperative verb first — concise action",
  "description": "Detailed: what's broken, where (file:line), root cause, fix approach",
  "acceptanceCriteria": ["Testable criterion 1", "Testable criterion 2"],
  "priority": "P0|P1|P2|P3",
  "effort": "S|M|L|XL",
  "status": "ready",
  "phase": 3,
  "module": "{{module-slug}}",
  "category": "frontend",
  "files": ["src/path/to/file.tsx"],
  "dependencies": [],
  "blockedBy": [],
  "tags": ["relevant", "tags"]
}

Priority rules:
- P0: User clicks something → nothing happens (silent failure)
- P1: Feature works but output is wrong/buggy
- P2: Works correctly but UX friction or missing polish
- P3: Code quality, accessibility, performance

Also:
- Update the epic's taskCount in docs/tasks/tasks.json
- Add the batch filename to BATCH_FILES array in docs/tasks/board-index.html (inside loadData function around line 621)

Check docs/tasks/tasks.json for the last task number used in the {{EPIC}} epic and continue numbering from there.

End with a summary table: tasks by priority, by category, and recommended execution order.
```
