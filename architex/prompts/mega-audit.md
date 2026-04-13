# The Mega Audit — Universal Module Quality Prompt (v2)

> **What this is:** A single copy-paste prompt that produces an exhaustive audit of ANY module in ANY interactive application. Covers every quality dimension — from pixel color to product strategy. Designed for AI agents but works for human reviewers too.
>
> **How to use:** Replace the variables below, paste to any capable AI agent. The agent will produce a complete audit report + structured task JSON.
>
> **Score: Engineered for 8.5+/10** — includes anti-hallucination guards, chain-of-thought, few-shot examples, quality gates, and self-review.

---

## Variables (replace ALL before pasting)

```
MODULE          = Display name (e.g., "Data Structures Explorer")
EPIC            = Uppercase prefix (e.g., "DST", "ALG", "LLD", "SDS")
EPIC_LOWERCASE  = Lowercase prefix (e.g., "dst", "alg")
MODULE_SLUG     = Kebab-case module name (e.g., "data-structures", "algorithms")
ENTRY           = Entry point file (e.g., "src/components/modules/DataStructuresModule.tsx")
PHASE           = Project phase number (e.g., 3)
```

---

## The Prompt

You are a world-class product engineer — equal parts designer, architect, and educator — auditing the {{MODULE}} module of Architex, an interactive engineering learning platform (Next.js 15, React 19, TypeScript, Tailwind CSS, Zustand, React Flow).

Your audit will be used to create every task needed to take this module from its current state to best-in-class.

Start from {{ENTRY}} and recursively read every file it imports — hooks, components, panels, visualizers, engines, types, stores, utilities.

--- CRITICAL RULES (read before doing anything) ---

1. EVIDENCE REQUIRED: Every finding MUST include a file path and line number. If you cannot point to a specific line, the finding is not valid. Do not report it.

2. READ COMPLETELY: For every file in the dependency tree, read it in its entirety. Do not skim. If a file is over 500 lines, read it in chunks. For each file, note at least one specific detail (function name, variable, comment) that proves you read beyond the first 50 lines.

3. NO HALLUCINATION: If you are unsure whether something is a bug, mark it as [NEEDS-RUNTIME-VERIFICATION] and explain what would need to be tested. Do not report uncertain findings as confirmed bugs.

4. SPECIFICITY OVER QUANTITY: "Add try/catch in SortEngine.ts:87 for empty array edge case" is ONE good finding. "Consider adding error handling throughout the module" is ZERO findings.

5. DE-DUPLICATION: If the same root cause appears in multiple dimensions, report it ONCE where it is most relevant. Cross-reference from other dimensions with "See [BUG-XXX] in Dimension N."

6. CODE vs RUNTIME: Mark every finding as [CODE] (verifiable by reading source) or [RUNTIME] (requires running the app). Prioritize [CODE] findings.

7. NO GENERIC ADVICE: Every recommendation must reference specific code in THIS module. Advice applicable to "any React app" is not acceptable.

DO NOT:
- Report findings without file:line references
- Assume features are broken without tracing the code path
- Generate advice applicable to any React app rather than THIS module
- Report the same bug across multiple dimensions (cross-reference instead)
- Recommend rewriting from scratch — suggest incremental improvements
- Skip a dimension because it "looks fine" — every dimension MUST have findings OR an explicit "No issues found — verified by checking [files]"
- Create tasks for unconfirmed issues (mark [NEEDS-VERIFICATION] instead)
- Leave any task schema field empty or null

--- CHECKPOINT 0: DEPENDENCY MAP (complete BEFORE any findings) ---

Read every file in the module dependency tree. Output a numbered inventory:

[1] src/path/to/File.tsx (347 lines) — imports: [2], [5], [8]
[2] src/path/to/Hook.ts (89 lines) — imports: [3]
...

Total files: N | Total lines: N

Then write: "I have read all N files in their entirety. Proceeding to Act 1."

DO NOT proceed until this checkpoint is complete.

--- EXAMPLE: GOOD vs BAD FINDINGS ---

BAD finding (do NOT produce this):
[HIGH-FUNC-001] Error handling needed — SortingModule.tsx — Add try/catch
Why bad: No line number, no root cause, no specific scenario, generic fix.

GOOD finding (produce findings like this):
[HIGH-FUNC-001] Selecting "Radix Sort" and clicking Run silently fails [CODE]
— File: src/panels/AlgorithmPanel.tsx:567
— Root cause: SORTING_RUNNERS map (line 124) only includes 6 of 16 algorithms. "radix-sort" is not in the map. handleRun (line 567) calls SORTING_RUNNERS[selectedId] which returns undefined, then silently returns.
— Fix: Add 'radix-sort': runRadixSort to SORTING_RUNNERS at line 124. Import runRadixSort from src/lib/algorithms/sorting/radix-sort.ts.

BAD task:
{ "title": "Fix sorting bugs", "description": "Several sorting algorithms have issues" }

GOOD task:
{ "title": "Wire up 10 missing sorting algorithms in SORTING_RUNNERS", "description": "SORTING_RUNNERS at AlgorithmPanel.tsx:124 only maps 6 of 16. The missing 10 silently fail.", "acceptanceCriteria": ["All 16 sorting algorithms produce visible output when Run is clicked", "No silent failures in any dropdown item"] }

=== ACT 1: AUDIT WHAT EXISTS ===

--- DIMENSION 1: FUNCTIONAL COMPLETENESS ---

For every selectable item in every dropdown, menu, tab, or selector:

| Item Name | Category | Can Select? | Correct UI? | Run Works? | Output OK? | Code Path |

Definitions:
- "Can Select" = item exists in UI and is clickable
- "Correct UI" = the right input form / controls / canvas renders for it
- "Run Works" = clicking the action button produces a result (no silent failure)
- "Output OK" = the visualizer shows correct, educational output
- "Code Path" = brief trace: selector to handler to engine to visualizer

Summary: "X of Y items fully functional, Z broken, W wrong UI"

For EVERY broken item, trace the bug step by step:
STEP 1: I click [item] in the UI at [Component.tsx:line]
STEP 2: This triggers [handler] at [file:line]
STEP 3: The handler calls [function] at [file:line]
STEP 4: At [file:line], the code does [X] but should do [Y]
STEP 5: Root cause: [specific technical reason]
STEP 6: Fix: [specific code change at specific location]

--- DIMENSION 2: VISUAL DESIGN ---

For each finding, cite the specific element, file:line, and current vs expected.

Color: All colors from design token system or hardcoded hex? Text/background meet WCAG contrast (4.5:1 text, 3:1 UI)? Color palette consistent? State colors consistent? Dark theme contrast proper?

Typography: Clear visual hierarchy? Font sizes consistent (any below 10px)? Line-height readable? Labels concise? Monospace used only for code/numbers?

Spacing: Follows 4px/8px grid? Gaps consistent? Padding consistent? Elements aligned? Density appropriate?

Components: All icons same set and size? All buttons have all states (default, hover, active, disabled)? All inputs have all states? Dropdowns properly styled?

--- DIMENSION 3: INTERACTION DESIGN AND EDGE CASES ---

Feedback: Does EVERY click produce visible feedback? List every dead click. Loading indicators? Success/error messages?

Flow Efficiency: Click count from "want to see X" to "X running"? Unnecessary steps? Presets work immediately or need extra clicks?

Edge Cases (trace through code for each):
- Empty input then Run: code path and result?
- Invalid input (non-numeric, special chars): code path and result?
- Extremely large input (10K elements): code path and result?
- Rapid-clicking Run 10 times: timer leaks? debounce?
- Switch context mid-operation: clean transition?
- Refresh mid-animation: state preserved or reset?
- Step Forward at last step / Step Backward at first step: feedback?

Keyboard: Shortcuts? Mouse-free operation? Tab order? Focus indicators?

--- DIMENSION 4: SIMULATION / ENGINE QUALITY ---

Correctness: Results mathematically correct? Edge cases handled? Step descriptions accurate (not stale/post-mutation)? Complexity metrics correct? Metadata correct?

Step Quality: Every meaningful operation has a step? Steps educational? Granularity appropriate? Mutation data sufficient for visualizer?

Playback: All controls working? Speed control works? Play icon updates on natural end? Scrubber exists? State resets between runs?

Comparison: Side-by-side works? Controllers synchronized? Data propagated correctly?

CHECKPOINT 1: Dimensions 1-4 complete. Files examined: [count]. Findings: [count] ([code-verified] / [needs-runtime]). Most severe: [ID]. Proceeding to 5-8.

--- DIMENSION 5: VISUALIZER QUALITY ---

For every visualizer: Rendering tech, appropriate for data size?, smooth animations?, colors from tokens?, legend complete? Entry/exit animations? Reduced-motion fallback? Resizes with container? Handles tiny and large datasets? Click/drag/hover/zoom support?

--- DIMENSION 6: TEXT, CONTENT AND EDUCATIONAL VALUE ---

Microcopy: Labels action-oriented? Placeholders helpful? Errors specific? Terminology consistent?

Education: Explanations clear? Complexity displayed? Code available? Steps explain "why" not just "what"?

Gaps: Missing concepts? Missing examples? Missing "Learn More"?

--- DIMENSION 7: ACCESSIBILITY ---

For each item cite the component file:line where fix goes.

ARIA roles? ARIA labels? Live regions? Keyboard nav? Focus indicators? WCAG AA contrast? Reduced motion? No color-only information?

--- DIMENSION 8: PERFORMANCE ---

Unnecessary re-renders? Props mutation? O(n squared) where O(n) possible? Memory leaks? Stack overflow risks? Missing virtualization? Mutation iteration efficiency? Duplicate components?

CHECKPOINT 2: Dimensions 5-8 complete. Cumulative findings: [count]. Any dimension with zero findings? [explain]. Proceeding to 9-12.

--- DIMENSION 9: CODE ARCHITECTURE ---

Single source of truth? Dead code? Type safety? Files over 500 lines? Naming consistent? Error boundaries? displayName on memoized components?

--- DIMENSION 10: SECURITY AND INPUT SAFETY ---

User input reaches unsafe rendering methods? Engine inputs sanitized? Crafted input causes infinite loops or memory exhaustion? Storage data validated on read? Error messages leak internals?

--- DIMENSION 11: STATE MANAGEMENT ---

Zustand store structure? Selector granularity? Persistence config? Cross-store dependencies? Stale closures? SSR hydration mismatches?

--- DIMENSION 12: EMOTIONAL DESIGN AND POLISH ---

Rate 1-10 with specific observations:
- First Impression: delightful or confusing?
- Delight: micro-animations alive?
- Shareability: would someone screenshot it?
- Wow Factor: "whoa" moment within 30 seconds?
- Premium Feel: Apple-quality or basic?
- Empty State: inspires action or blank?
- Personality: human copy or robotic?

CHECKPOINT 3: All dimensions complete. Total findings: [count]. By severity: CRITICAL=[n] HIGH=[n] MEDIUM=[n] LOW=[n]. Code-verified: [n]. Needs-runtime: [n]. Proceeding to Act 2.

=== ACT 2: REPORT AND TASKS ===

Structure findings as:

1. Architecture Map — component tree, data flow, file inventory
2. Completeness Report — full table from Dimension 1
3. Bug Report by severity — [SEV-CATEGORY-NUMBER] Title [CODE/RUNTIME] File:Line Root cause Fix
4. Visual Design Audit — from Dimension 2
5. UX Friction Points — ranked from Dimension 3
6. Emotional Design Scores — from Dimension 12

TASK GENERATION:

Create JSON task file at: docs/tasks/batch-{{EPIC_LOWERCASE}}-fixes.json

Task schema:
{
"id": "{{EPIC}}-XXX",
"epic": "{{EPIC}}",
"title": "Imperative verb first — max 80 chars",
"description": "What is wrong, where (file:line), root cause, fix approach",
"acceptanceCriteria": ["Testable criterion 1", "Edge case criterion", "Visual criterion"],
"priority": "P0|P1|P2|P3",
"effort": "S|M|L|XL",
"status": "ready",
"phase": {{PHASE}},
"module": "{{MODULE_SLUG}}",
"category": "frontend",
"files": ["src/exact/paths.tsx"],
"dependencies": ["{{EPIC}}-XXX"],
"blockedBy": [],
"tags": ["searchable", "tags"]
}

Priority: P0 = silent failure. P1 = wrong result or game-changing feature. P2 = UX friction. P3 = code quality/cleanup.

Effort: S (<50 lines). M (50-200). L (200-500). XL (500+).

Granularity: One task = one dev sitting. Group related micro-fixes. One root cause = one task. Target 30-80 tasks per module.

Validation: All fields required. Files must exist in dependency map. At least 2 acceptance criteria. Sequential IDs.

Also: Check docs/tasks/tasks.json for last {{EPIC}}-XXX number. Update epic taskCount. Add batch filename to BATCH_FILES in docs/tasks/board-index.html.

=== ACT 3: ENVISION WHAT IS MISSING ===

Now that you have deep context from auditing every file, think about what this module COULD be. Do not check a list. DISCOVER what is missing by understanding WHO uses this and WHAT they need.

--- STEP 1: CONSUMER RESEARCH ---

For EACH persona: What makes them choose THIS over everything else? Come back daily? Tell a friend?

PERSONA A — CS Student (1st/2nd year, learning for first time)
"I can read code but cannot visualize what it does"
What "aha moment" feature makes them finally GET it? What do they need at 2am before an exam?

PERSONA B — Interview Candidate (FAANG prep)
"I know the algorithm but cannot trace it under pressure"
What makes prep 10x more effective? What does LeetCode NOT give them?

PERSONA C — Professor / TA
"I need to show this to 200 students in a lecture hall"
What teaching features are missing? Interactive homework?

PERSONA D — Self-taught Developer (bootcamp, no CS degree)
"The jargon is intimidating"
How to make it less intimidating? What helps learn-by-doing people?

PERSONA E — Curious Kid (12 years old, likes games)
"If boring I close the tab in 10 seconds"
What keeps them > 60 seconds? What is the TikTok moment?

PERSONA F — Engineering Manager / Interviewer
"I want to quickly create a visual explanation for my team"
What professional use cases are missing?

PERSONA G — Screen Reader / Motor-impaired User
"I cannot see colors or use a mouse"
What alternative interactions make this fully accessible?

For each: list feature ideas that ONLY become obvious from their perspective.

--- STEP 2: COMPETITIVE INTELLIGENCE ---

What exists — not just competitors but adjacent products and industries:

Education: Brilliant, Khan Academy, Coursera, Duolingo. Code: LeetCode, HackerRank, Codecademy. Viz: VisuAlgo, algorithm-visualizer.org. Creative: Processing, p5.js. Data: D3.js, Observable. Math: 3Blue1Brown, Desmos. Gaming: Kahoot. Audio: Sorting.at, Chrome Music Lab. Dev tools: VS Code debugger. Physical: mechanical sorting machines. Social: TikTok moments.

For each: What ONE principle does it do brilliantly that we could adapt?

--- STEP 3: SENSORY AND DIMENSIONAL THINKING ---

Most tools only use SIGHT. Every sense and dimension:

SIGHT: 3D? VR? AR? New visual metaphors?
SOUND: What would algorithms SOUND like?
TOUCH: Could drag/swipe/pinch teach sorting?
TIME: Auto-slow on pivots, fast on boring parts?
NARRATIVE: Could algorithms have a STORY?
EMOTION: Can you FEEL O(n squared) vs O(n log n)?
SOCIAL: Multiplayer? Competitive? Collaborative?
CREATIVE: Can users CREATE with algorithms?

For each: what is ONE thing no tool has done yet?

--- STEP 4: WHAT IF BRAINSTORM ---

Remove ALL constraints. Generate at least 10 "what if" questions yourself, then answer the most promising.

--- STEP 5: CONVERGENCE ---

For each idea from Steps 1-4, filter:
1. Can I describe the EXACT user interaction in one sentence? (No = too vague, discard)
2. Frontend-only or needs backend? (Frontend-only ships faster)
3. Would user discover it WITHOUT being told? (Self-discoverable better)

Ideas passing all 3 = HIGH CONVICTION.

Prioritized feature table:
| # | Feature | Persona | Why World-Class | Effort | Impact |

Group: Ship this week / Ship this month / Ship this quarter / Dream features.

For each: explain WHY from the USER emotional experience.

Generate innovation tasks, append to same batch JSON. P1 for high-impact, P2 nice-to-have, P3 dream.

=== ACT 4: SELF-REVIEW (mandatory) ===

1. VOLUME: Fewer than 15 issues? Not thorough. Re-read skimmed files.
2. TOP 3: Pick 3 most severe. File:line cited? Root cause explained? Fix implementable?
3. DUPLICATES: Any two findings with same root cause? Merge.
4. TASKS: Spot-check 3. All fields? File paths in dep map? Criteria testable?
5. MATH: Summary numbers add up? Priorities and categories cross-reference?
6. COVERAGE: Every dimension has findings or explicit "No issues — verified [files]"?

FINAL SUMMARY:

| Priority | Count | Examples |
|----------|-------|---------|
| P0 | X | ... |
| P1 | X | ... |
| P2 | X | ... |
| P3 | X | ... |

| Category | Count |
|----------|-------|
| Broken features | X |
| Visual/UI bugs | X |
| Engine/logic bugs | X |
| UX improvements | X |
| World-class features | X |
| Accessibility | X |
| Security | X |
| Performance | X |
| State management | X |
| Architecture | X |

Execution order:
1. P0: make everything work
2. P1 bugs: make everything correct
3. P1 features: make it exceptional
4. P2 polish: make it delightful
5. P3 cleanup: make it maintainable
