# Chief Architect: Final Architecture Review

> "The research is excellent. The technology choices are sound individually. The specification needs to be restructured from 'everything we will ever build' into 'the smallest thing that proves the core hypothesis.'"

---

## TOP 5 BIGGEST ARCHITECTURAL RISKS

### 1. Simulation-to-UI Communication Boundary (CRITICAL)
No TypeScript interface defined for data flowing from WASM Worker → main thread. SharedArrayBuffer requires COOP/COEP headers that break PostHog, Sentry, Clerk. Without this contract, Rust devs and React devs cannot work in parallel.

### 2. 6 Zustand Stores With No Cross-Store Coordination (HIGH)
Undo/redo via zundo is per-store. Multi-store user actions have no atomic undo. Need: command bus, derived-store pattern, or transaction manager.

### 3. WASM Fallback Not Specified (HIGH)
WASM loading failure = entire app becomes static diagramming. Need: TS fallback for critical algorithms, graceful degradation UI, loading states.

### 4. Offline-First + Cloud Sync = Conflict Hell (HIGH)
IndexedDB (Dexie) vs PostgreSQL (Neon) — no defined source of truth. No migration path from anonymous local → authenticated cloud. Yjs CRDTs don't cover SRS scores or interview progress.

### 5. Rust Build Pipeline Complexity (MEDIUM-HIGH)
wasm-pack builds take 2-5 min in CI. Every contributor needs Rust toolchain. Unlimited WASM growth as devs default to Rust.

---

## TOP 5 OVER-ENGINEERED FOR V1

1. **12 Modules at launch** → Ship 2 (System Design + Interview Engine)
2. **Rust WASM engine** → TypeScript Workers for V1 (queuing math is 15 lines of TS)
3. **Plugin architecture** → No users = no plugin demand
4. **Multi-region world map view** → Mature product feature
5. **9 export formats** → V1 needs JSON (save) + PNG (share) only

---

## TOP 5 UNDER-SPECIFIED

1. **Module boundary contract** — No `Module` interface. Do modules share canvas? Stores? Can 2 modules be open simultaneously?
2. **Simulation time model** — Pre-computed steps (algorithms) vs continuous (system design) are fundamentally different. No unified timeline.
3. **Error handling** — No retry strategies for Claude API failure, IndexedDB full, Worker crash, Yjs sync failure.
4. **Auth + offline paradox** — Offline users can't auth with Clerk. Which features require auth?
5. **Performance budget** — No count-based LOD threshold, no particle limit, no total bundle budget validated.

---

## THE SINGLE MOST IMPORTANT DECISION

**The Module-Platform Boundary Contract.** Must define:
1. `ModuleConfig` — What a module declares (name, icon, component types, store slices)
2. `ModuleCanvas` — Shared React Flow or own canvas?
3. `ModuleSimulation` — Pre-computed steps vs continuous vs none
4. `ModuleStore` — Extends shared stores or private state?
5. `ModuleExport` — What formats supported?

---

## WHAT I'D CHANGE IF STARTING FROM SCRATCH

1. **V1 = 2 modules** (System Design + Interview), not 12
2. **TypeScript Workers**, not WASM (add WASM for proven bottlenecks in V2)
3. **Define simulation protocol FIRST** (SimulationCommand, SimulationSnapshot, SimulationEvent interfaces)
4. **Command-based state architecture** instead of 6 independent stores
5. **Online-first + local cache**, not offline-first (defer CRDT sync to V2)
6. **Monorepo** with `packages/core`, `packages/ui`, `packages/simulation`, `modules/system-design`, `modules/interview`

---

## BOTTOM LINE

> Build System Design Simulator + Interview Engine as a Vite+React app with TypeScript Workers, 2 modules, and 5 templates. Ship in 12 weeks. If it finds users, you've earned the right to add the other 10 modules. If it doesn't, you've saved months.
