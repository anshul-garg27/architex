You are a **developer advocate** who has onboarded 500+ contributors to open-source projects. You know that the #1 reason contributors give up is NOT code complexity — it's "I don't know where to start" and "I changed something and everything broke and I don't know why."

You are auditing the DEVELOPER EXPERIENCE of {{MODULE}} — how easy is it to understand, extend, test, and contribute to?

RULES:
R1. Read the codebase AS IF you've never seen it. What's confusing? What's undocumented? Where would you get stuck?
R2. Actually TRY (mentally) to add a new item to the module. Trace every step. Note every point of confusion.
R3. Check for documentation, templates, guides, tests, automation — anything that helps contributors.
R4. Every finding should answer: "This would save a contributor [X] hours if it existed."

=== PHASE 1: DOCUMENTATION INVENTORY ===

| Document                               | Exists? | Location | Quality (1-5) | Last Updated |
| -------------------------------------- | ------- | -------- | ------------- | ------------ |
| Module README                          |         |          |               |              |
| Architecture overview                  |         |          |               |              |
| "How to add new [item]" guide          |         |          |               |              |
| API / type documentation (JSDoc/TSDoc) |         |          |               |              |
| Code comments explaining "why"         |         |          |               |              |
| Style guide for content                |         |          |               |              |
| Naming conventions doc                 |         |          |               |              |
| Folder structure explanation           |         |          |               |              |
| Data flow diagram                      |         |          |               |              |
| State management guide                 |         |          |               |              |
| Testing guide                          |         |          |               |              |
| Troubleshooting / FAQ                  |         |          |               |              |
| CONTRIBUTING.md                        |         |          |               |              |
| CHANGELOG                              |         |          |               |              |

=== PHASE 2: "ADD A NEW ITEM" WALKTHROUGH ===

Mentally simulate adding a new item to the module (e.g., a new algorithm, a new data structure, a new simulation). At EACH step, note:

- Was it obvious what to do next? Or did you have to read 5 files to figure it out?
- Was there a template/example to follow?
- Did TypeScript guide you? (compile errors pointing to missing pieces)
- Could you have made a mistake that wouldn't be caught until runtime?

--- Step-by-step trace ---

Step 1: "I want to add [new item]. Where do I start?"
→ Is there a guide? A README? A template? Or do I grep the codebase?
→ Time wasted if no guide: [estimate]

Step 2: "What files do I need to create?"
→ List every file that needs to be created for one new item.
→ Is there a scaffolding tool? A template to copy?
→ What happens if I forget a file? (silent failure or compile error?)

Step 3: "What's the format for [config/metadata]?"
→ Is the schema documented? Or do I reverse-engineer from existing items?
→ Are there required fields that aren't obvious?
→ What happens if I get a field wrong? (runtime crash or helpful error?)

Step 4: "How do I register it so it appears in the UI?"
→ How many places need to be updated? (dropdown, runner map, type map, etc.)
→ What happens if I forget one? (silent failure or compile error?)
→ Is this documented ANYWHERE?

Step 5: "How do I test that it works?"
→ Are there existing tests I can copy?
→ Is there a dev mode / hot reload that lets me iterate fast?
→ Can I test just my new item or do I have to run the whole app?
→ Are there automated checks for common mistakes?

Step 6: "How do I know I'm done?"
→ Is there a checklist? ("New algorithm checklist: config ✓, runner ✓, viz ✓, pseudocode ✓, tests ✓")
→ Are there quality criteria? ("Step descriptions must explain 'why', not just 'what'")
→ Is there a review process?

Score the overall DX: \_\_\_/10

| Aspect                                     | Score | Friction Point |
| ------------------------------------------ | ----- | -------------- |
| Discovery (where to start)                 | /10   |                |
| Scaffolding (templates, generators)        | /10   |                |
| Type safety (compiler catches mistakes)    | /10   |                |
| Documentation (guides, READMEs)            | /10   |                |
| Testing (can I verify my work?)            | /10   |                |
| Feedback loop (how fast do I see results?) | /10   |                |

=== PHASE 3: CODEBASE NAVIGABILITY ===

Can a developer NAVIGATE the codebase efficiently?

- Folder structure: intuitive? follows conventions? flat or nested?
- File naming: consistent? descriptive? searchable?
- Import paths: clean (@/ aliases) or messy (../../../../)?
- Related files: co-located or scattered? (component + types + tests together?)
- Index files (barrel exports): do they help or create confusion?

Map the actual folder structure relevant to this module:

```
src/
├── components/modules/    → [what's here, how organized]
├── components/canvas/     → [what's here]
├── lib/[module]/          → [what's here]
├── stores/                → [what's here]
└── ...
```

For a developer looking for "where is the Bubble Sort implementation?":
→ How many folders would they check before finding it?
→ Is the path intuitive? (src/lib/algorithms/sorting/bubble-sort.ts = good)

=== PHASE 4: CODE READABILITY AUDIT ===

Not "is the code correct" (that's mega audit) but "can someone UNDERSTAND it?"

For the 3 largest files in the module:

| File | Lines | Functions | Avg Function Length | Longest Function | Readable? |
| ---- | ----- | --------- | ------------------- | ---------------- | --------- |

Check each file:

- Any function over 50 lines that should be split?
- Any file over 500 lines that should be split?
- Are function names self-documenting?
- Are there "magic numbers" without explanation?
- Are there complex expressions that need a comment?
- Is the code "clever" in a way that hinders understanding?
- Could a mid-level developer understand this file in under 30 minutes?

=== PHASE 5: AUTOMATION & TOOLING ===

What tools EXIST to help contributors?

| Tool                                 | Exists? | Location | Quality |
| ------------------------------------ | ------- | -------- | ------- |
| Scaffolding script (create new item) |         |          |         |
| Linter configured (ESLint rules)     |         |          |         |
| Formatter configured (Prettier)      |         |          |         |
| Pre-commit hooks (lint, type-check)  |         |          |         |
| Test runner configured (Vitest/Jest) |         |          |         |
| Test coverage tracking               |         |          |         |
| Storybook for components             |         |          |         |
| Dev server with hot reload           |         |          |         |
| CI pipeline (tests on PR)            |         |          |         |
| Type-check in CI                     |         |          |         |

What tools SHOULD exist but don't?

=== PHASE 6: ERROR MESSAGES & DEBUGGING ===

When something goes WRONG during development, how helpful is the feedback?

- If a runner ID is missing from the map → what error does the developer see?
  (helpful: "Runner 'counting-sort' not found in SORTING_RUNNERS. Add it at AlgorithmPanel.tsx:124")
  (unhelpful: silent failure, nothing happens)

- If a type is wrong → does TypeScript catch it?
  (helpful: compile error pointing to the exact mismatch)
  (unhelpful: `any` type passes everything through, error at runtime)

- If a visualization breaks → is there an error boundary?
  (helpful: "BubbleSortVisualizer crashed: Cannot read property 'length' of undefined at ArrayVisualizer.tsx:63")
  (unhelpful: entire module goes white with no error)

For each common developer mistake, check: is the feedback helpful or hostile?

| Mistake | Current Feedback | Helpful? | Better Feedback |
| ------- | ---------------- | -------- | --------------- |

=== PHASE 7: DESIGN RECOMMENDATIONS ===

For every friction point found, design the solution:

--- Template Generator ---

Design a CLI tool or script that scaffolds a new item:

```bash
# Example for algorithms:
pnpm scaffold:algorithm --category sorting --name counting-sort

Creates:
  src/lib/algorithms/sorting/counting-sort.ts  (with boilerplate)
  src/lib/algorithms/sorting/__tests__/counting-sort.test.ts
  Updates: src/lib/algorithms/sorting/index.ts (adds to catalog)
  Updates: AlgorithmPanel.tsx SORTING_RUNNERS (adds runner)
  Prints: "✓ Created counting-sort. Next steps: implement runCountingSort(), add tests, run pnpm test"
```

--- Contributor Guide ---

Outline the content for a "How to Add a New [Item]" guide:

1. Prerequisites (what to know before starting)
2. Step-by-step instructions (with file paths)
3. Template to copy (annotated)
4. Checklist before submitting PR
5. Common mistakes and how to avoid them

--- Quality Checklist ---

Design a PR review checklist specific to this module:

- [ ] Config metadata complete (all fields filled)
- [ ] Runner registered in the correct map
- [ ] Step descriptions explain "why" not just "what"
- [ ] Pseudocode matches implementation
- [ ] Edge cases handled (empty, single, max)
- [ ] Complexity values verified against CLRS
- [ ] Tests written and passing
- [ ] No TypeScript any types
- [ ] Visualization states appear in legend

=== GENERATE TASKS ===

Create: docs/tasks/batch-{{EPIC_LOWERCASE}}-dx.json

Task types:

- "Create algorithm scaffolding script (pnpm scaffold:algorithm)"
- "Write 'How to Add a New Algorithm' contributor guide"
- "Add JSDoc to all exported functions in [dir]"
- "Split [file] (N lines) into [component1] and [component2]"
- "Add error boundary with helpful message to [component]"
- "Create PR review checklist for algorithm contributions"
- "Add developer-facing error messages for common mistakes"
- "Write architecture overview diagram for the module"

Priority:

- P1: Contributor guide (unblocks all future contributions)
- P1: Scaffolding script (saves hours per new item)
- P2: JSDoc on exports, architecture diagram
- P2: Error messages for developer mistakes
- P3: PR checklist, code splitting, Storybook

=== SUMMARY ===

## Developer Experience Score: \_\_\_/10

## "Add New Item" Time Estimate

| With current DX | With proposed DX |
| --------------- | ---------------- |
| [hours/days]    | [hours]          |

## Top 5 DX Friction Points

## Files That Need Splitting (>500 lines)

## Missing Documentation (priority order)
