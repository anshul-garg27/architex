# System Design Module — QA Completeness Check

**Date:** 2026-04-12
**Purpose:** Adversarial review of all 9 completed audits. Find everything they missed.

---

## ❌ AUDIT INCOMPLETE — GAPS FOUND

### Phase 1: Coverage Verification

| Area | Files That Exist | Files Audited | Missing |
|------|:----------------:|:-------------:|:-------:|
| Canvas components | ~25 | 23 | 2 (LayoutPicker, DragGhostPreview) |
| Simulation engines | ~34 | 12 deeply + 22 mentioned | **12 not individually reviewed** |
| Stores | 13 | 13 | 0 ✅ |
| Node components | 73 | 3 deeply + 70 mentioned | OK (pattern-based) |
| Templates | 55 | 10 deeply + 45 listed | OK |
| Tests | ~11 | 4 deeply + 7 mentioned | OK |

**12 simulation files never individually reviewed:**
1. `architecture-diff.ts` — DiffPanel engine
2. `time-travel.ts` — TimeTravelScrubber engine
3. `sla-calculator.ts` — SLA computation
4. `failure-modes.ts` — Failure mode catalog
5. `capacity-planner.ts` — Capacity estimation
6. `traffic-simulator.ts` — Traffic generation
7. `particle-path-cache.ts` — Particle rendering cache
8. `report-generator.ts` — Post-simulation report
9. `what-if-engine.ts` — What-if scenario engine
10. `pressure-counter-tracker.ts` — Pressure tracking runtime
11. `node-service-rates.ts` — Per-node service rate config
12. `simulation-metrics-bus.ts` (vs sim-metrics-bus.ts — confusing dual naming!)

### Phase 2: Automated Checks

**TODO/FIXME Check:**
- `src/app/api/webhooks/clerk/route.ts:6-15` — 3 TODOs for Clerk webhook verification. Not covered in any audit.
- LLD codegen has `# TODO: implement` stubs — not System Design scope but noted.
- **Verdict:** 3 unaddressed TODOs found in System Design-adjacent code.

**Type Safety (`as any`) Check:**
- `SystemDesignNodes.test.tsx` — 14 instances of `(props as any)` in test file. Test-only, acceptable but messy.
- `WarStoryViewer.tsx:812` — `as any` for xmlns attribute. Cross-module.
- `setup.ts:15` — `as any` in test setup. Acceptable.
- **Verdict:** No production `as any` in System Design module. ✅ Clean.

**Console.log Check:**
- 4 instances in simulation files — all in JSDoc examples (not runtime code). ✅ Clean.
- 104 total across project — mostly in analytics, networking modules. Not System Design scope.

**Dead Code Check:**
- `simulation-metrics-bus.ts` exists alongside `sim-metrics-bus.ts` — confusing! One may be dead.

### Phase 3: Feature Completeness

**Features MISSING from task list:**

| # | Feature | Status | Gap? |
|---|---------|--------|:----:|
| 1 | Bottom Panel "Code" tab | **STUB ONLY** — shows placeholder text | ✅ GAP |
| 2 | Capacity planning tab | Exists as overlay, NOT in bottom panel tabs | ✅ GAP |
| 3 | SLA Dashboard tab | Exists as overlay, NOT in bottom panel tabs | ⚠️ Partial |
| 4 | Post-Simulation Report generation | `report-generator.ts` exists but not reviewed | ✅ GAP |
| 5 | PlantUML export | Listed in audit but may not be in CanvasToolbar | ⚠️ Verify |
| 6 | Terraform export | File exists (`terraform-exporter.ts`) but toolbar integration unclear | ⚠️ Verify |
| 7 | C4 export | File exists (`c4-exporter.ts`) but toolbar integration unclear | ⚠️ Verify |
| 8 | YAML import | File exists (`yaml-parser.ts`) but integration unclear | ⚠️ Verify |
| 9 | K8s YAML import | File exists (`k8s-yaml-importer.ts`) but integration unclear | ⚠️ Verify |

### Phase 4: PaperDraw Comparison

**CRITICAL GAPS vs PaperDraw:**

| Gap | PaperDraw | Architex | Task Exists? |
|-----|-----------|----------|:------------:|
| Topology-aware rule profiles | **741 profiles** | ~80 profiles (rule-database.ts) | ❌ NO TASK |
| Formal issue taxonomy depth | **150+ named issues** | 52 issues (issue-taxonomy.ts) | ❌ NO TASK |
| SimulatesAs behavior modes | 23 per-component behavior modes | Not found | ❌ NO TASK |
| Post-simulation report | Full markdown report with timeline | report-generator.ts exists (unreviewed) | ❌ NO TASK |
| Causal narrative depth | 20 templates with slot interpolation | narrative-engine.ts (20 templates) ✅ | ✅ Covered |
| Pressure counters | 35 counters | 35 counters ✅ | ✅ Covered |
| Chaos event catalog | 73 events | 73 events ✅ | ✅ Covered |

### Phase 5: Edge Case Sweep

| Scenario | Covered by Task? | Gap? |
|----------|:----------------:|:----:|
| 0 nodes on canvas (empty) | SDS-143 (show message) | ✅ |
| 1 node, no edges | Not explicitly tested | ⚠️ |
| 500+ nodes (performance) | SDS-161 (input guard), SDS-138 (alignment perf) | ✅ |
| Mobile 375px | SDS-196 (P0 — broken) | ✅ |
| Keyboard only | SDS-163 (shortcuts), SDS-199 (aria labels) | ✅ |
| Screen reader | SDS-199, SDS-155, A11Y-001 through A11Y-007 | ✅ |
| Offline/PWA | Offline page exists, not audited | ⚠️ GAP |
| Slow network/loading | No loading states for template gallery | ⚠️ GAP |
| Very long node labels | Not tested — could overflow BaseNode | ⚠️ GAP |
| Special characters in labels | Not tested — potential XSS via node label | ⚠️ GAP |
| Rapid clicks on Play/Stop | SDS audit says safe (debounced) | ✅ |
| Browser back/forward | PLT-001 (URL routing) | ✅ |
| Page refresh | State persists via Zustand persist | ✅ |
| Dark/light mode | SDS-284 (light theme secondary) | ✅ |
| Zoom 150%+ | SDS-195 (hooks crash on zoom) + SDS-278 (minZoom) | ✅ |
| Incognito (no localStorage) | Not tested — graceful degradation? | ⚠️ GAP |
| `simulation-metrics-bus.ts` vs `sim-metrics-bus.ts` confusion | Not investigated | ⚠️ GAP |

---

## Missed Issues: 18 Total

| # | What Was Missed | Severity | Why It Matters |
|---|----------------|:--------:|----------------|
| 1 | 12 simulation files never individually reviewed | P2 | Bugs in what-if-engine, time-travel, sla-calculator, traffic-simulator could exist undetected |
| 2 | Bottom Panel "Code" tab is a STUB | P2 | Users see a tab that does nothing |
| 3 | Post-Simulation Report generator not reviewed or tasked | P2 | Feature exists but quality unknown |
| 4 | PaperDraw has 741 topology profiles vs our ~80 | P1 | This is THE competitive differentiator |
| 5 | PaperDraw has 150+ issue types vs our 52 | P2 | Less diagnostic depth |
| 6 | SimulatesAs behavior modes (23) not found in Architex | P2 | Same component should behave differently in different contexts |
| 7 | Dual file confusion: simulation-metrics-bus.ts vs sim-metrics-bus.ts | P3 | Dead code or naming confusion |
| 8 | Offline/PWA behavior not audited | P3 | PWA exists but edge cases untested |
| 9 | Long node labels not tested for overflow | P3 | Visual bug potential |
| 10 | Special characters in labels not tested for XSS | P2 | Security gap |
| 11 | Incognito mode graceful degradation not tested | P3 | UX gap for privacy-mode users |
| 12 | Export integration unclear (PlantUML, Terraform, C4 in toolbar?) | P3 | Features may exist but be undiscoverable |
| 13 | Import integration unclear (YAML, K8s YAML wired to UI?) | P3 | Features may exist but be undiscoverable |
| 14 | Test coverage is ~20% — no tests for drag-drop, simulation lifecycle, exports, imports | P1 | Regression risk |
| 15 | 3 Clerk webhook TODOs unaddressed | P3 | Auth integration incomplete |
| 16 | LayoutPicker.tsx and DragGhostPreview.tsx never reviewed | P3 | Canvas features unaudited |
| 17 | `as any` in 14 test assertions (SystemDesignNodes.test.tsx) | P3 | Test type safety |
| 18 | Loading states missing for template gallery and heavy operations | P2 | UX gap during slow loads |
