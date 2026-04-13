# System Design Module — Backend & Data Migration Analysis

**Date:** 2026-04-12
**Module:** System Design
**Status:** Analysis only — no code changes

---

## EXECUTIVE SUMMARY

The System Design module has **~1.2 MB of pure static data** hardcoded in TypeScript files that ships to every user in the JS bundle. This includes 73 chaos events, 80 topology rules, 52 issue types, 75 cost entries, 55 templates, 100+ palette items, and 20 narrative templates. None of this data changes at runtime.

**Recommendation:** Move catalog data to DB + lazy-load via API. Keep computation logic in frontend. Estimated bundle reduction: **~600KB** (from lazy-loading catalogs + templates on demand instead of bundling all).

---

## PHASE 1: DATA INVENTORY

### 1.1 Static Content (Catalogs, Descriptions, Metadata)

| File | Data | Lines | KB | Changes at Runtime? | Non-dev Can Update? |
|------|------|:-----:|:--:|:-------------------:|:-------------------:|
| chaos-engine.ts | CHAOS_EVENTS (73 events) | ~1200 | ~45 | No | Yes (descriptions, amplification factors) |
| rule-database.ts | PROFILES (80 rules) | ~780 | ~30 | No | Yes (thresholds, descriptions) |
| issue-taxonomy.ts | ISSUE_CATALOG (52 issues) | ~650 | ~25 | No | Yes (cause, impact, recommendation text) |
| cost-model.ts | BASE_COST_PER_HOUR (75 types) | ~110 | ~4 | No | Yes (pricing updates) |
| narrative-engine.ts | NARRATIVE_TEMPLATES (20 templates) | ~150 | ~6 | No | Yes (template text) |
| pressure-counters.ts | COUNTER_THRESHOLDS (35 counters) | ~100 | ~4 | No | Yes (threshold tuning) |
| palette-items.ts | PALETTE_ITEMS (100+ items) | ~688 | ~25 | No | Yes (add/remove components) |
| constants/motion.ts | Animation configs | ~874 | ~30 | No | No (design system) |
| **templates/system-design/*.json** | **55 templates** | **~12,000** | **509** | No | Yes (add new, edit existing) |
| **TOTAL STATIC DATA** | | **~16,552** | **~678** | | |

### 1.2 Configuration Data

| File | Data | Type |
|------|------|------|
| Each template's `simulation` section | Chaos scenarios, cost breakdown, SLAs, bottleneck progression | Per-template config |
| Each template's `learnSteps` | Educational content (4 steps per template) | Per-template content |
| Node DEFAULT configs | Per-component defaults (e.g., DATABASE_DEFAULTS: {engine: 'postgres', replicas: 1}) | Per-component config |

**User-configurable at runtime?** Yes — Properties panel lets users edit node configs.
**Should users save custom configs?** Yes — but currently lost on page refresh (Zustand persist saves full canvas).
**Community-sharable presets?** Would be valuable — "Netflix-optimized Redis config" shared by community.

### 1.3 Computation Logic (MUST STAY IN FRONTEND)

| File | Logic | Lines | Pure Function? | Needs Server? |
|------|-------|:-----:|:--------------:|:-------------:|
| simulation-orchestrator.ts | 10-stage tick pipeline | ~900 | Yes (stateful but local) | No — real-time, <16ms per tick |
| cascade-engine.ts | Error propagation | ~500 | Yes | No — called per tick |
| queuing-model.ts | M/M/1, M/M/c, Erlang-C | ~450 | Yes (pure math) | No — instant |
| latency-budget.ts | Critical path (Kahn's algo) | ~400 | Yes | No — runs on topology |
| capacity-planner.ts | Capacity estimation | ~250 | Yes | No |
| sla-calculator.ts | SLA computation | ~495 | Yes | No |
| what-if-engine.ts | Scenario comparison | ~728 | Yes | No |
| sim-metrics-bus.ts | Float64Array metrics | ~290 | Yes | No — zero-alloc hot path |
| edge-flow-tracker.ts | Circular buffer tracking | ~140 | Yes | No — per-tick |
| topology-signature.ts | Graph fingerprinting | ~200 | Yes | No |
| report-generator.ts | Post-sim markdown report | ~412 | Yes | No |
| time-travel.ts | Replay/seek engine | ~300+ | Yes | No — reads local state |
| **TOTAL LOGIC** | | **~5,065** | | |

### 1.4 User-Generated Data

| Store | Data | Persisted? | Where? | Should Cross-Device? |
|-------|------|:----------:|--------|:--------------------:|
| canvas-store | nodes, edges, groups | Yes | localStorage (`architex-canvas`) | **YES** — designs lost on device switch |
| progress-store | challenge attempts, XP, streaks | Yes | localStorage (`architex-progress`) | **YES** — progress lost on device switch |
| cross-module-store | mastery scores, concept completion | Yes | localStorage (`architex-cross-module`) | **YES** — learning history |
| notification-store | notification queue | Yes | localStorage | No — ephemeral |
| interview-store | active challenge, hints used | Yes | IndexedDB (`architex-interview`) | Maybe — resume on another device |
| snapshot-store | architecture snapshots | Yes | localStorage (`architex-snapshots`) | **YES** — version history |
| ai-store | API key, usage, budget | Yes | localStorage (`architex-ai-settings`) | No — per-device secret |
| billing-store | plan, subscription | Yes | localStorage (`architex:billing-store`) | **YES** — must sync with server |
| ui-store | theme, panels, module | Yes | localStorage (`architex-ui`) | Nice-to-have — preferences |
| viewport-store | zoom, pan | No | Memory only | No |
| simulation-store | simulation state | No | Memory only | No |
| editor-store | code editor state | No | Memory only | No |

---

## PHASE 2: WHAT SHOULD MOVE

### 2.1 MOVE TO DATABASE

#### Candidate 1: Templates (55 JSON files → `templates` table)

```
CURRENTLY: 55 JSON files in templates/system-design/, imported in src/lib/templates/index.ts
WHY MOVE:
  ✅ Content writers can update without code deploy
  ✅ Users can save/share custom templates
  ✅ Needs to be searchable/filterable (difficulty, category, tags)
  ✅ Needs versioning (track template changes)
  ✅ 509 KB that every user downloads even if they only use 1 template
  ✅ Community can contribute templates via gallery
DB TABLE: templates (already defined in schema)
MIGRATION EFFORT: M
```

**Drizzle Schema (already exists at src/db/schema/):**
```typescript
export const templates = pgTable('templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  difficulty: integer('difficulty').notNull(), // 1-5
  category: text('category').notNull(), // classic, modern, infrastructure, advanced
  tags: text('tags').array(),
  data: jsonb('data').notNull(), // { nodes, edges, learnSteps, simulation }
  isBuiltIn: boolean('is_built_in').default(true),
  authorId: text('author_id').references(() => users.id),
  upvoteCount: integer('upvote_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

#### Candidate 2: User Diagrams (canvas-store → `diagrams` table)

```
CURRENTLY: localStorage via Zustand persist (architex-canvas)
WHY MOVE:
  ✅ Persist across devices (login on phone, see your laptop design)
  ✅ Share designs with others (public URL)
  ✅ Version history (snapshots already exist but in localStorage)
  ✅ localStorage has 5-10MB limit — large designs can hit it
  ✅ Fork/remix other people's designs
DB TABLE: diagrams (already defined)
MIGRATION EFFORT: M
```

#### Candidate 3: User Progress (progress-store + cross-module-store → `progress` table)

```
CURRENTLY: localStorage (architex-progress, architex-cross-module)
WHY MOVE:
  ✅ Persist across devices
  ✅ Analytics (which concepts are hardest? where do users drop off?)
  ✅ Leaderboard data (currently mock data)
  ✅ Streak tracking needs server-side validation (prevent cheating)
DB TABLE: progress (already defined)
MIGRATION EFFORT: M
```

#### Candidate 4: Simulation Catalogs (chaos events, rules, issues → new tables)

```
CURRENTLY: Hardcoded arrays in simulation .ts files (~4,700 lines)
WHY MOVE:
  ✅ Content team can add chaos events without code deploy
  ✅ A/B test different rule thresholds
  ✅ Version catalog changes (which rule set was active when user ran sim?)
  ✅ ~100 KB of data in JS bundle that could be lazy-loaded
  ✅ Enable community-contributed chaos scenarios
DB TABLES: chaos_events, topology_rules, issue_types (NEW)
MIGRATION EFFORT: L
```

**New Schema Needed:**
```typescript
export const chaosEvents = pgTable('chaos_events', {
  id: text('id').primaryKey(),                    // 'node-crash'
  name: text('name').notNull(),                   // 'Node Crash'
  category: text('category').notNull(),           // 'infrastructure'
  description: text('description').notNull(),
  defaultDurationMs: integer('default_duration_ms'),
  defaultSeverity: text('default_severity'),      // 'low'|'medium'|'high'|'critical'
  affectedNodeTypes: text('affected_node_types').array(),
  amplification: jsonb('amplification'),          // { errorAmp, latencyAmp, ... }
  visual: jsonb('visual'),                        // { animation, color, icon }
  pressureEffects: jsonb('pressure_effects'),     // [{ counter, delta }]
  durationType: text('duration_type'),
  isBuiltIn: boolean('is_built_in').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const topologyRules = pgTable('topology_rules', {
  id: text('id').primaryKey(),
  profileId: text('profile_id').notNull(),
  signaturePattern: text('signature_pattern'),
  componentType: text('component_type'),
  issues: jsonb('issues'),
  propagationRules: jsonb('propagation_rules'),
  isBuiltIn: boolean('is_built_in').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const issueTypes = pgTable('issue_types', {
  code: text('code').primaryKey(),                // 'INFRA-001'
  title: text('title').notNull(),
  category: text('category').notNull(),           // 'INFRA'|'NET'|'DATA'|...
  severity: text('severity').notNull(),
  cause: text('cause').notNull(),
  impact: text('impact').notNull(),
  recommendation: text('recommendation').notNull(),
  narrativeTemplate: text('narrative_template'),
  triggerCounters: jsonb('trigger_counters'),
  applicableTypes: text('applicable_types').array(),
  isBuiltIn: boolean('is_built_in').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### 2.2 MOVE TO API ROUTE (lazy-load instead of bundle)

```
ENDPOINT: GET /api/system-design/templates
PURPOSE: Fetch template catalog (metadata only — not full diagram data)
AUTH: None (public)
CACHE: ISR 1 hour
RESPONSE: { templates: [{ id, name, difficulty, category, tags, nodeCount, edgeCount }] }
MIGRATION: Replace `import { SYSTEM_DESIGN_TEMPLATES }` with `useSWR('/api/system-design/templates')`
BUNDLE SAVINGS: ~509 KB (templates no longer in JS bundle)

ENDPOINT: GET /api/system-design/templates/[id]
PURPOSE: Fetch full template data (nodes, edges, learnSteps, simulation)
AUTH: None (public)
CACHE: ISR 24 hours (content rarely changes)
RESPONSE: Full DiagramTemplate JSON

ENDPOINT: GET /api/system-design/chaos-catalog
PURPOSE: Fetch chaos event catalog for ChaosQuickBar
AUTH: None (public)
CACHE: ISR 24 hours
RESPONSE: { events: ChaosEventType[] }
BUNDLE SAVINGS: ~45 KB

ENDPOINT: GET /api/system-design/palette
PURPOSE: Fetch component palette items
AUTH: None (public)
CACHE: ISR 24 hours
RESPONSE: { items: PaletteItem[] }
BUNDLE SAVINGS: ~25 KB

ENDPOINT: POST /api/system-design/diagrams
PURPOSE: Save user diagram to database
AUTH: Required (Clerk)
BODY: { title, description, data: { nodes, edges, groups }, isPublic }

ENDPOINT: GET /api/system-design/diagrams/[id]
PURPOSE: Load user diagram
AUTH: Required for private, none for public

ENDPOINT: POST /api/system-design/progress
PURPOSE: Save learning progress
AUTH: Required (Clerk)
BODY: { moduleId, conceptId, score, completedAt }
```

### 2.3 KEEP IN FRONTEND (no change)

```
✅ simulation-orchestrator.ts — Real-time tick loop, <16ms per tick, can't tolerate API latency
✅ cascade-engine.ts — Error propagation runs per-tick
✅ queuing-model.ts — Pure math (M/M/1, Erlang-C), instant
✅ latency-budget.ts — Critical path algorithm on local topology
✅ sim-metrics-bus.ts — Zero-alloc Float64Array, 60fps hot path
✅ edge-flow-tracker.ts — Circular buffer, per-tick recording
✅ topology-signature.ts — Graph fingerprinting, runs on local data
✅ time-travel.ts — Replay from local tick history
✅ what-if-engine.ts — Scenario comparison on local state
✅ report-generator.ts — Generates markdown from local simulation data
✅ Canvas state (nodes/edges) — Real-time drag-drop, too frequent for API
✅ UI state (panels, theme) — Local preference, privacy
✅ Animation configs (motion.ts) — Design system, <30KB, needed immediately
✅ Visualization rendering (BaseNode, DataFlowEdge, ParticleLayer) — Real-time rendering
```

### 2.4 MOVE TO WEB WORKER (off main thread)

```
CANDIDATE: simulation-orchestrator.ts processTick()
CURRENTLY: Runs on main thread, blocks UI for ~5-10ms per tick at 60 ticks/sec
WHY WORKER: 
  ✅ Heavy computation (~10ms per tick with 50+ nodes)
  ✅ Blocks UI interactions during simulation
  ✅ Can run in background while user drags nodes
WORKER FILE: src/lib/workers/simulation-worker.ts
COMMUNICATION: 
  Main → Worker: { type: 'tick', nodes, edges, trafficConfig, chaosEvents }
  Worker → Main: { type: 'tick-result', nodeMetrics, edgeMetrics, issues, narratives }
NOTE: SimMetricsBus already uses Float64Array which is transferable via SharedArrayBuffer
EFFORT: L (significant refactor to separate orchestrator from store reads)
```

---

## PHASE 3: DATABASE SCHEMA STATUS

### Existing Tables (defined but NOT migrated)

| Table | Schema File | Columns | Ready to Use? |
|-------|------------|:-------:|:-------------:|
| users | users.ts | 6 | Yes — needs migration |
| diagrams | diagrams.ts | 12 | Yes — needs migration |
| simulationRuns | simulations.ts | 7 | Yes — needs migration |
| progress | progress.ts | 7 | Yes — needs migration |
| templates | templates.ts | ~10 | Yes — needs migration |
| gallerySubmissions | gallery.ts | ~8 | Yes — needs migration |
| galleryUpvotes | gallery.ts | ~4 | Yes — needs migration |
| aiUsage | ai-usage.ts | ~6 | Yes — needs migration |

### New Tables Needed

| Table | Purpose | Priority |
|-------|---------|:--------:|
| chaos_events | Chaos event catalog (73+ events) | P2 |
| topology_rules | Topology-aware rule profiles (80+) | P2 |
| issue_types | Formal issue taxonomy (52+ types) | P2 |
| component_costs | Per-component cost table (75+ entries) | P3 |
| narrative_templates | Narrative template strings (20+) | P3 |
| pressure_thresholds | Pressure counter thresholds (35) | P3 |

### Seeding Strategy

```
Step 1: Run drizzle-kit generate + migrate (create all tables)
Step 2: Create seed scripts per data source:
  - src/db/seeds/templates.ts     → Extract 55 templates from JSON files
  - src/db/seeds/chaos-events.ts  → Extract 73 events from CHAOS_EVENTS array
  - src/db/seeds/topology-rules.ts → Extract 80 profiles from PROFILES array
  - src/db/seeds/issue-types.ts   → Extract 52 issues from ISSUE_CATALOG
  - src/db/seeds/costs.ts         → Extract 75 costs from BASE_COST_PER_HOUR
Step 3: Run seeds to populate DB
Step 4: Update components to fetch from API with SWR
Step 5: Keep hardcoded data as FALLBACK (offline support)
```

---

## PHASE 4: BENEFITS ANALYSIS

### Performance Benefits

| Metric | Current | After Migration |
|--------|:-------:|:---------------:|
| Initial JS bundle | ~7.8 MB (all lib/) | ~6.6 MB (-1.2 MB of static data) |
| Template loading | All 55 templates in bundle (509 KB) | Fetch 1 template on demand (~10 KB) |
| First paint | Blocked by 7.8 MB parse | Faster — smaller bundle |
| Module switch | Instant (already loaded) | +50ms API fetch (cached after first) |

### Feature Benefits (ENABLED BY DB)

| Feature | Current | After Migration |
|---------|---------|----------------|
| Cross-device progress | ❌ Lost on device switch | ✅ Login → see your history |
| Share designs | ✅ URL encoding (limited) | ✅ Permanent links, forkable |
| Content updates | ❌ Code deploy required | ✅ Admin panel, no deploy |
| Community templates | ❌ Not possible | ✅ Submit, upvote, share |
| Analytics | ❌ No visibility | ✅ Which templates are popular? Where do users struggle? |
| Search | ❌ Client-side only | ✅ Full-text PostgreSQL search |
| Leaderboards | ⚠️ Mock data | ✅ Real data from DB |
| A/B testing | ❌ Not possible | ✅ Different content per user segment |

### UX Benefits

- **Faster first load** — 1.2 MB less JavaScript to parse
- **Faster template browse** — fetch metadata (2KB) not full data (509KB)
- **Progress never lost** — survives device switch, browser clear, incognito
- **Share anything** — permanent links to designs, not just URL-encoded state
- **Community** — browse and fork other users' designs

---

## PHASE 5: MIGRATION ROADMAP

```
STEP 1: Run Drizzle migrations (S effort, 1 hour)
  ─── Create all existing schema tables in Neon
  ─── pnpm drizzle-kit generate && pnpm drizzle-kit migrate
  ─── Verify tables exist in Neon dashboard

STEP 2: Seed templates into DB (M effort, 4 hours)
  ─── Script reads 55 JSON files → inserts into templates table
  ─── Verify all templates queryable via SQL
  ─── Keep JSON files as fallback/offline mode

STEP 3: Create template API routes (S effort, 2 hours)
  ─── GET /api/system-design/templates (catalog, ISR cached)
  ─── GET /api/system-design/templates/[id] (full data)
  ─── Update TemplateGallery to fetch from API with SWR

STEP 4: Create user data API routes (M effort, 4 hours)
  ─── POST /api/diagrams (save user designs)
  ─── GET /api/diagrams/[id] (load user designs)
  ─── POST /api/progress (save learning progress)
  ─── Requires Clerk auth middleware

STEP 5: Update canvas-store to sync with server (M effort, 6 hours)
  ─── Keep localStorage as fast cache
  ─── Background sync to server on save
  ─── Load from server on login, fallback to localStorage
  ─── Conflict resolution: server wins (last-write)

STEP 6: Seed simulation catalogs (L effort, 8 hours)
  ─── Extract chaos events, rules, issues to DB
  ─── Create API routes with ISR caching
  ─── Update simulation-orchestrator to lazy-load catalogs
  ─── Keep hardcoded arrays as FALLBACK for offline

STEP 7: Remove hardcoded data from bundle (M effort, 4 hours)
  ─── Delete template JSON imports from index.ts
  ─── Replace static catalog imports with API fetches
  ─── Verify bundle size reduction
  ─── Keep computation logic untouched
```

**Total estimated effort: ~29 hours (4-5 developer days)**

---

## PHASE 6: WHAT NOT TO MOVE

```
KEEP IN FRONTEND — NEVER MOVE THESE:
  ✅ Simulation tick loop (simulation-orchestrator.ts) — real-time, <16ms
  ✅ Metrics bus (sim-metrics-bus.ts) — zero-alloc Float64Array, 60fps
  ✅ Queuing math (queuing-model.ts) — pure functions, instant
  ✅ Cascade propagation (cascade-engine.ts) — per-tick computation
  ✅ Latency budget (latency-budget.ts) — Kahn's algorithm on local graph
  ✅ All visualization rendering (BaseNode, DataFlowEdge, ParticleLayer, etc.)
  ✅ All animation configs (motion.ts) — needed immediately for UI
  ✅ Canvas real-time state (drag, zoom, selection) — too frequent for API
  ✅ UI preferences (theme, panels) — local, privacy-sensitive
  ✅ Undo/redo stack — real-time, local operation
  ✅ Simulation playback (time-travel, step) — replays local data
  ✅ What-if scenarios — runs against local topology
  ✅ Report generation — formats local simulation results
  
WHY: All of these run in real-time (<16ms budget) or handle sensitive
local state. Adding API latency would break the simulation experience.
The browser IS the simulation server.
```

---

## SUMMARY

| Category | Size | Action | Priority | Effort |
|----------|:----:|--------|:--------:|:------:|
| 55 templates (JSON) | 509 KB | Move to DB + API | P1 | M |
| User diagrams | Variable | Move to DB + API | P1 | M |
| User progress | ~10 KB | Move to DB + API | P1 | M |
| Palette items | 25 KB | Move to API (lazy-load) | P2 | S |
| Chaos catalog (73 events) | 45 KB | Move to DB + API | P2 | M |
| Topology rules (80 profiles) | 30 KB | Move to DB + API | P2 | M |
| Issue taxonomy (52 types) | 25 KB | Move to DB + API | P2 | M |
| Cost table (75 entries) | 4 KB | Keep in frontend (tiny) | — | — |
| Pressure thresholds (35) | 4 KB | Keep in frontend (tiny) | — | — |
| Narrative templates (20) | 6 KB | Keep in frontend (tiny) | — | — |
| Motion constants | 30 KB | Keep in frontend (design system) | — | — |
| Computation logic | 5,000+ lines | **Keep in frontend** (real-time) | — | — |
| Visualization code | All components | **Keep in frontend** (rendering) | — | — |

**Net bundle reduction: ~634 KB** (templates + palette + chaos + rules + issues)
**New API endpoints: 7** (templates catalog, template detail, diagrams CRUD, progress, chaos catalog, palette)
**New DB tables: 3-6** (chaos_events, topology_rules, issue_types + existing schema migration)
**Total migration effort: ~29 hours (4-5 dev days)**
