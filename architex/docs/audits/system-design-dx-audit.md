# System Design Module — Developer Experience (DX) Audit

**Date:** 2026-04-12
**Module:** System Design (Architex)
**Score:** 7.2/10

---

## Executive Summary

**The guides are excellent. The tooling is modern. The silent failures are devastating.**

Architex has 6 detailed contributor guides (300+ lines each), 8 ADRs, TypeScript strict mode, Vitest, Storybook, and comprehensive CI. A contributor who follows the guides will succeed 90% of the time.

But the 10% failure case is brutal: forget to register a node in 1 of 6 files → no compile error, no runtime error, just a blank rectangle on the canvas or wrong simulation numbers. The developer spends 30 minutes debugging something that a 2-line validation check would have caught.

---

## DX Scores

| Aspect | Score | Friction Point |
|--------|:-----:|----------------|
| Discovery (where to start) | 9/10 | CONTRIBUTING.md → docs/guides/ is clear |
| Scaffolding (templates/generators) | 3/10 | No CLI scaffold tool. Must create/update 6 files manually |
| Type safety (compiler catches mistakes) | 5/10 | TypeScript catches store errors but NOT config/registration errors |
| Documentation (guides, READMEs) | 9/10 | 6 guides totaling 2000+ lines, 8 ADRs |
| Testing (can I verify my work?) | 4/10 | No automated validation. Manual "load in browser" only |
| Feedback loop (see results) | 7/10 | Hot reload works. But no "your node is missing from X" warnings |

## "Add New Item" Time Estimate

| Task | With Current DX | With Proposed DX |
|------|:-:|:-:|
| Add a new template | 1-2 hours | 30 minutes |
| Add a new node component | 3-4 hours | 1 hour |
| Add a new chaos event | 2-3 hours | 45 minutes |
| Fix a simulation bug | 1-2 hours | 30 minutes |

## Top 5 DX Friction Points

1. **No JSON schema validation** — Templates fail silently with missing fields
2. **No pre-commit hooks** — Devs push lint violations, CI fails 5 minutes later
3. **6-file node registration with no sync check** — Forget one = silent failure
4. **No scaffold CLI** — Each new item requires manually creating/updating 3-6 files
5. **1500-line simulation files with sparse narrative** — Hard to understand and extend

## Files That Need Splitting (>500 lines)

| File | Lines | Suggested Split |
|------|:-----:|----------------|
| chaos-engine.ts | 1521 | chaos-event-types.ts + chaos-engine.ts + chaos-catalog.ts |
| simulation-orchestrator.ts | 1119 | pipeline-stages.ts + orchestrator.ts + lifecycle.ts |
| rule-database.ts | 1004 | rule-profiles.ts + rule-engine.ts |
| STATE_ARCHITECTURE.ts | 1806 | Move to docs/adr/ (it's a design doc, not code) |
| issue-taxonomy.ts | 833 | issue-definitions.ts + issue-detection.ts |
| what-if-engine.ts | 728 | scenario-types.ts + scenario-runner.ts |
| CanvasToolbar.tsx | 797 | ToolGroup.tsx + SimControls.tsx + ExportMenu.tsx + ViewControls.tsx |

## Missing Documentation

| Document | Priority | Time to Write | Saves Contributors |
|----------|:--------:|:-------------:|:------------------:|
| JSON Schema for templates | P0 | 1 hour | 30 min per template |
| Node type sync validator | P0 | 2 hours | 30 min per node |
| .prettierrc config | P0 | 15 min | Formatting confusion |
| "Common Mistakes" FAQ | P1 | 1 hour | 20 min per mistake |
| Architecture overview diagram | P1 | 2 hours | 1 hour for new devs |
| Simulation pipeline narration | P2 | 8 hours | 2 hours per sim change |
