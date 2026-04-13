# ML Design Module — Backend & Data Migration Analysis

> **Status:** Analysis only — no code changes.
> **Date:** 2026-04-13
> **Module:** ML Design (`src/lib/ml-design/` + `src/components/modules/MLDesignModule.tsx`)
> **Total source:** 334 KB (122 KB lib + 212 KB components)

---

## 1. Data Inventory

### 1.1 Static Content (descriptions, explanations, metadata)

| File | Data | Bytes | Type | Changes at Runtime? | Non-dev Updateable? |
|------|------|-------|------|--------------------|--------------------|
| pipeline-templates.ts | 3 ML pipeline templates (Spotify, TikTok, Fraud) with 5 stages each, rich descriptions, input/output schemas, config objects | 12,589 | Content catalog | No | Yes — descriptions, schemas are editorial |
| serving-patterns.ts | 3 serving pattern configs (A/B, Canary, Shadow) with names, descriptions, traffic splits | 7,487 | Content catalog | No | Yes — descriptions are editorial |
| cnn-forward.ts | 3 CNN preset architectures (LeNet, VGG, Tiny) with layer configs | 11,060 | Config + computation | No | Partially — presets are editorial, engine is code |
| cnn-layer.ts | 3 preset filters (edge, sharpen, blur) with numeric matrices | 3,552 | Config | No | Yes — filter values are data |
| MLDesignModule.tsx | MODE_TABS array (6 modes with labels + icons), DATASET_OPTIONS (4 options), ACTIVATION_OPTIONS (3 options), FS_NODES layout constants, TICK_HIGHLIGHTS mappings, step description text strings | ~5,000 (est.) | UI config + content | No | Yes — labels, descriptions are editorial |

**Total static content: ~40 KB.** Relatively small compared to Algorithms module (which has 60+ algorithm CONFIG objects). Most ML Design content is inline in the monolith, not in structured config objects.

### 1.2 Configuration Data (parameters, defaults, presets)

| File | Data | Type | User-configurable? | Saveable? |
|------|------|------|-------------------|-----------|
| MLDesignModule.tsx:75-76 | `DATASET_SAMPLE_COUNT = 200`, `GRID_RESOLUTION = 30` | Constants | No (hardcoded) | N/A |
| MLDesignModule.tsx:3332-3384 | Default hyperparameters: layerCount=2, neuronsPerLayer=4, activation="sigmoid", learningRate=0.1, epochs=100, etc. | Defaults | Yes (sliders) | No (lost on refresh) |
| pipeline-templates.ts:38-344 | Pipeline stage configs: `{ source: "kafka://", partitions: 128, ... }` | Static presets | No (view-only) | N/A |
| serving-patterns.ts:43-230 | Simulation params: `totalRequests=10000`, `rolloutSteps=[1,5,25,50,100]` | Hardcoded | No | N/A |

**Key finding:** Hyperparameters ARE user-configurable at runtime but NOT saveable. Users lose their configuration on page refresh. This is the #1 candidate for backend persistence.

### 1.3 Implementation Logic (computation engines)

| File | Logic | Bytes | Pure Function? | Heavy? (>100ms) | Needs Server? |
|------|-------|-------|----------------|-----------------|---------------|
| neural-net.ts | Dense NN: constructor, forward pass, backpropagation, gradient clipping | 7,914 | YES (class, stateful but deterministic) | YES at 1000 epochs | NO — but Web Worker candidate |
| neural-network.ts | Advanced NN: Xavier init, pluggable optimizers, forward/backward | 13,935 | YES | YES | NO — Web Worker |
| datasets.ts | 4 dataset generators (circle, XOR, spiral, gaussian) | 3,614 | YES | NO (<1ms) | NO |
| dataset-generators.ts | 5 dataset generators with bounds computation | 6,654 | YES | NO | NO |
| activations.ts | 6 activation functions + derivatives | 3,896 | YES (pure math) | NO | NO |
| loss-functions.ts | 3 loss functions + derivatives | 4,266 | YES (pure math) | NO | NO |
| optimizers.ts | SGD, Adam, RMSProp optimizer classes | 6,159 | YES (stateful) | NO | NO |
| decision-boundary.ts | Grid-based boundary computation (50×50 forward passes) | 2,789 | YES | MODERATE (2500 forward passes) | NO — Web Worker candidate |
| cnn-forward.ts | CNN shape propagation simulator | 11,060 | YES | NO (<1ms, shape only) | NO |
| cnn-layer.ts | 2D convolution sliding-window demo | 3,552 | YES | NO | NO |
| dropout-viz.ts | Dropout simulation (random drop + scaling) | 2,758 | YES | NO | NO |
| loss-landscape.ts | 2D loss landscape grid computation (40×40 evaluations) | 8,564 | YES | MODERATE (1600 evaluations) | NO — Web Worker candidate |
| ab-testing.ts | Z-test, p-value, sample size calculator | 5,515 | YES (pure stats) | NO | NO |
| multi-armed-bandit.ts | ε-greedy, UCB1, Thompson Sampling simulators | 7,777 | YES | NO (<10ms for 500 rounds) | NO |
| feature-store.ts | 8-step feature store lifecycle simulation | 7,799 | YES | NO | NO |
| serving-patterns.ts | A/B, Canary, Shadow simulation engines | 7,487 | YES | NO | NO |

**Total computation code: ~96 KB.** ALL pure functions, ALL run in browser, NONE need server data. The only performance concern is NN training (1000 epochs × 200 samples × backprop) which should move to a Web Worker, NOT the server.

### 1.4 User-Generated Data

| Store | Data | Persisted? | Where? | Cross-device? | Size |
|-------|------|-----------|--------|-------------|------|
| useMLDesignModule hook (30× useState) | Current mode, hyperparams, trained network, training log, simulation results, animation ticks | **NO** | RAM only | No | ~1-5 KB per session |
| progress-store (Zustand + persist) | XP, streak, challenge attempts | YES | localStorage | **No** — needs server for cross-device | ~0.5 KB |
| cross-module-store (Zustand + persist) | Per-module mastery (theory + practice), concept completion | YES | localStorage | **No** | ~1 KB |
| ui-store (Zustand + persist) | activeModule, panel visibility, theme | YES | localStorage | **No** | ~0.2 KB |

**Total user data: ~3-7 KB.** Small, but the cross-device gap is the #1 reason to use the DB. A student who learns on their laptop should see progress on their phone.

---

## 2. Recommendations: What Should Move

### 2.1 MOVE TO DATABASE (Neon PostgreSQL)

#### Candidate 1: User Progress + Streaks + XP

```
CURRENTLY: Zustand persist → localStorage (progress-store.ts, cross-module-store.ts)
WHY MOVE:
  ✅ Users need progress across devices (login on laptop, check on phone)
  ✅ Enables leaderboards and social features
  ✅ Analytics: which concepts do users struggle with?
  ✅ Spaced repetition scheduling (server-calculated review dates)
DB TABLE: `progress` (ALREADY EXISTS in schema)
  - userId, moduleId="ml-design", conceptId="neural-network", score=0.85
MIGRATION EFFORT: S — schema exists, just need to run migrations and wire API
```

#### Candidate 2: Saved Experiments (hyperparameter configs + training results)

```
CURRENTLY: Does not exist — lost on page refresh
WHY MOVE:
  ✅ Users want to save and compare multiple training runs (MLD-216)
  ✅ Enables sharing experiments via URL
  ✅ Enables "continue where you left off" feature (MLD-174)
DB TABLE: NEW — `ml_experiments`
SCHEMA (draft):
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  module_mode VARCHAR(50),         -- "neural-network", "ab-testing", etc.
  config JSONB,                     -- { datasetType, layers, neurons, activation, lr, epochs }
  results JSONB,                    -- { finalLoss, accuracy, lossHistory, trainedWeights? }
  created_at TIMESTAMPTZ DEFAULT NOW()
MIGRATION EFFORT: M — new table + API + UI for save/load
```

#### Candidate 3: Pipeline Templates (content catalog)

```
CURRENTLY: Hardcoded in pipeline-templates.ts (12,589 bytes)
WHY MOVE:
  ✅ Content writers can update descriptions without code deploy
  ✅ Enables user-created pipeline templates (community contribution)
  ✅ Enables search and filtering across templates
  ✅ Enables versioning (track editorial changes)
DB TABLE: `templates` (ALREADY EXISTS — supports category, description, JSONB data)
  - Could store pipeline stages + connections as JSONB
MIGRATION EFFORT: M — extract data, create seed script, update components to fetch
```

#### Candidate 4: Daily Challenges (challenge definitions + completion tracking)

```
CURRENTLY: Does not exist (MLD-207 designs it)
WHY MOVE:
  ✅ Challenge rotation must be consistent across users (same challenge for everyone today)
  ✅ Completion tracking needs persistence
  ✅ Enables analytics: which challenges are hardest?
DB TABLE: NEW — `daily_challenges`
SCHEMA:
  id UUID PRIMARY KEY,
  module VARCHAR(50),
  challenge_date DATE,
  title VARCHAR(255),
  description TEXT,
  config JSONB,              -- { targetAccuracy: 0.95, maxLayers: 2, dataset: "spiral" }
  points INTEGER DEFAULT 25
MIGRATION EFFORT: M — new table + API + seeding + UI
```

### 2.2 MOVE TO API ROUTE (lazy-load via API)

#### Candidate 1: Pipeline Template Catalog

```
CURRENTLY: Entire pipeline-templates.ts (12 KB) imported on module load
WHY API: Too large to bundle; data rarely changes; perfect for ISR
API ROUTE: GET /api/ml-design/pipelines
METHOD: GET
CACHE: ISR 24 hours (content rarely changes)
RESPONSE:
  {
    pipelines: [
      { id: "spotify-rec", name: "Spotify Recommendation", stageCount: 5 },
      { id: "tiktok-rank", name: "TikTok Video Ranking", stageCount: 5 },
      { id: "fraud-detect", name: "Fraud Detection", stageCount: 5 }
    ]
  }

API ROUTE: GET /api/ml-design/pipelines/[id]
RESPONSE: Full pipeline with all stages, descriptions, schemas, connections
CACHE: ISR 24 hours
MIGRATION FROM: import { PIPELINE_TEMPLATES } from "@/lib/ml-design" → useSWR("/api/ml-design/pipelines")
```

#### Candidate 2: User Progress API

```
API ROUTE: GET /api/ml-design/progress
PURPOSE: Fetch user's ML module progress (mastery, completed concepts, streak)
AUTH: Required (Clerk)
CACHE: No cache (user-specific)
RESPONSE:
  {
    mastery: { theory: 45, practice: 20 },
    completedConcepts: ["neural-network", "ab-testing"],
    streak: 5,
    totalXP: 350,
    experiments: [{ id: "...", mode: "neural-network", accuracy: 0.97 }]
  }

API ROUTE: POST /api/ml-design/progress
PURPOSE: Save progress after training/challenge completion
AUTH: Required
BODY: { conceptId: "neural-network", score: 0.85, type: "training" }
```

### 2.3 KEEP IN FRONTEND (no change)

```
✅ neural-net.ts — Pure computation, real-time interactive, latency-sensitive
✅ neural-network.ts — Same (after consolidation via MLD-035)
✅ datasets.ts / dataset-generators.ts — Pure generators, <1ms, tiny output
✅ activations.ts — Pure math functions (6 functions, 4KB)
✅ loss-functions.ts — Pure math (3 functions, 4KB)
✅ optimizers.ts — Stateful but pure computation (3 classes, 6KB)
✅ ab-testing.ts — Pure statistics (z-test, sample size, 5KB)
✅ multi-armed-bandit.ts — Pure simulation (<10ms, 8KB)
✅ feature-store.ts — Pure simulation (<1ms, 8KB)
✅ serving-patterns.ts — Pure simulation (<1ms, 7KB) [data portion could move]
✅ cnn-layer.ts — Pure convolution (<1ms, 4KB)
✅ dropout-viz.ts — Pure random (<1ms, 3KB)
✅ decision-boundary.ts — Pure computation, needed for real-time viz
✅ loss-landscape.ts — Pure computation, interactive rotation
✅ cnn-forward.ts — Pure shape propagation (<1ms)
✅ ALL visualization/rendering code in MLDesignModule.tsx
✅ ALL animation logic (RAF loops, SVG animate, state transitions)
✅ Canvas state (current training, animation ticks)
✅ UI state (panels, mode selection)
```

**96 KB of computation code stays in frontend.** This is correct — moving pure math to an API would add latency with zero benefit.

### 2.4 MOVE TO WEB WORKER (keep in frontend, off main thread)

```
CANDIDATE 1: Neural Network Training
CURRENTLY: neural-net.ts train() runs on main thread, blocks UI for 1000 epochs
WHY WORKER: Blocks UI for noticeable duration. RAF batching helps but doesn't eliminate jank.
WORKER FILE: src/lib/workers/nn-training-worker.ts
COMMUNICATION:
  Main → Worker: { type: 'train', config: { layerSizes, activations, data, lr, epochs } }
  Worker → Main: { type: 'epoch', metrics: { epoch, loss, accuracy } }  (per epoch)
  Worker → Main: { type: 'complete', weights: SerializedWeights }
  Main → Worker: { type: 'cancel' }
EFFORT: M (comlink already in node_modules)
EXISTING TASK: MLD-034

CANDIDATE 2: Decision Boundary Computation
CURRENTLY: 30×30 = 900 forward passes per render
WHY WORKER: Moderate latency during training (blocks rendering pipeline)
COULD COMBINE: Run in same worker as training — compute boundary after each epoch batch
EFFORT: S (if combined with training worker)

CANDIDATE 3: Loss Landscape Computation
CURRENTLY: 40×40 = 1600 evaluations (orphaned, but will be wired in via MLD-026)
WHY WORKER: Heavy computation, not needed in real-time
EFFORT: S (standalone worker)
```

---

## 3. Database Schema Recommendations

### 3.1 Existing Tables (ready to use)

| Table | Schema File | Status | Usable for ML Design? |
|-------|------------|--------|----------------------|
| `users` | users.ts | Schema exists, not migrated | YES — user identity for progress |
| `progress` | progress.ts | Schema exists, not migrated | YES — per-concept mastery tracking |
| `templates` | templates.ts | Schema exists, not migrated | YES — pipeline templates can use this |
| `diagrams` | diagrams.ts | Schema exists, not migrated | POSSIBLE — could store saved experiments as "diagrams" |
| `simulations` | simulations.ts | Schema exists, not migrated | YES — simulation run tracking |
| `gallery` | gallery.ts | Schema exists, not migrated | POSSIBLE — community-shared experiments |
| `ai-usage` | ai-usage.ts | Schema exists, not migrated | NOT NEEDED for ML Design |

### 3.2 New Tables Needed

```sql
-- ML Experiments: saved training configurations + results
CREATE TABLE ml_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_mode VARCHAR(50) NOT NULL,          -- "neural-network", "ab-testing", etc.
  title VARCHAR(255),                        -- user-assigned name
  config JSONB NOT NULL,                     -- hyperparameters
  results JSONB,                             -- training metrics
  trained_weights JSONB,                     -- serialized network weights (nullable, large)
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ml_experiments_user_id_idx ON ml_experiments(user_id);
CREATE INDEX ml_experiments_mode_idx ON ml_experiments(module_mode);

-- Daily Challenges: rotating challenges per module
CREATE TABLE daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module VARCHAR(50) NOT NULL,               -- "ml-design"
  challenge_date DATE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  config JSONB NOT NULL,                     -- challenge parameters
  points INTEGER NOT NULL DEFAULT 25,
  difficulty VARCHAR(20) NOT NULL DEFAULT 'medium',
  UNIQUE(module, challenge_date)
);
CREATE INDEX daily_challenges_date_idx ON daily_challenges(challenge_date);

-- Challenge Completions: track who completed what
CREATE TABLE challenge_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
  score REAL NOT NULL,
  time_spent_seconds INTEGER,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);
```

### 3.3 Data Seeding Strategy

```
Step 1: Run Drizzle migrations (create all tables)
  $ pnpm drizzle-kit generate
  $ pnpm drizzle-kit migrate
  Effort: S (schema already defined for core tables)

Step 2: Create seed for pipeline templates
  - Read PIPELINE_TEMPLATES from pipeline-templates.ts
  - Transform into `templates` table rows
  - Script: src/db/seeds/ml-design-templates.ts
  Effort: S

Step 3: Create seed for daily challenges
  - Define 30+ rotating challenges (from MLD-207 design)
  - Insert into daily_challenges table
  - Script: src/db/seeds/ml-design-challenges.ts
  Effort: M

Step 4: No seeding needed for user data (starts empty, populated by usage)
```

---

## 4. API Design

### 4.1 Content APIs (public, cacheable)

```
GET /api/ml-design/pipelines
  Purpose: Fetch pipeline template catalog
  Auth: None (public)
  Cache: ISR 24 hours
  Response: { pipelines: [{ id, name, description, stageCount }] }

GET /api/ml-design/pipelines/[id]
  Purpose: Fetch full pipeline detail
  Auth: None
  Cache: ISR 24 hours
  Response: { id, name, description, stages: [...], connections: [...] }

GET /api/ml-design/challenges/today
  Purpose: Fetch today's daily challenge
  Auth: None (challenge is same for everyone)
  Cache: ISR until midnight
  Response: { id, title, description, config, points, difficulty }
```

### 4.2 User APIs (authenticated)

```
GET /api/ml-design/progress
  Purpose: Fetch user's ML module progress
  Auth: Required (Clerk)
  Cache: No cache (user-specific)
  Response: { mastery, completedConcepts[], streak, totalXP, experiments[] }

POST /api/ml-design/progress
  Purpose: Record concept completion or training run
  Auth: Required
  Body: { conceptId, score, type: "training"|"challenge"|"exploration" }
  Response: { success, newXP, newStreak }

GET /api/ml-design/experiments
  Purpose: List user's saved experiments
  Auth: Required
  Response: { experiments: [{ id, mode, config, results, createdAt }] }

POST /api/ml-design/experiments
  Purpose: Save a training experiment
  Auth: Required
  Body: { mode, title?, config, results, trainedWeights? }
  Response: { id, shareUrl }

GET /api/ml-design/experiments/[id]
  Purpose: Fetch a specific experiment (own or public)
  Auth: Optional (public experiments viewable by anyone)
  Response: Full experiment data
```

---

## 5. Benefits Analysis

### Performance

| Metric | Current | After Migration |
|--------|---------|----------------|
| ML module JS bundle | ~100KB gzipped (lib + components) | ~90KB gzipped (-10KB from removing pipeline content) |
| First load | All 17 lib files imported immediately | UI loads first, pipeline data lazy-fetched |
| Training responsiveness | Main thread blocked during training | Web Worker — UI stays responsive |

**NOTE:** Unlike the Algorithms module (where CONFIG objects dominate the bundle), ML Design's bundle is 80% computation code that MUST stay in frontend. The performance gain from DB migration is **modest** (~10% bundle reduction). The real value is in features, not performance.

### Feature Benefits

| Feature | Requires DB? | Currently Possible? |
|---------|-------------|-------------------|
| Progress across devices | YES | NO (localStorage only) |
| Save/compare experiments | YES | NO (lost on refresh) |
| Daily challenges | YES (rotation) | NO |
| Share experiment via URL | YES (store state server-side) | PARTIAL (URL params for config, not results) |
| Community experiment gallery | YES | NO |
| Admin content updates | YES | NO (requires code deploy) |
| Analytics (popular concepts) | YES | NO |
| Leaderboard | YES | NO |
| Spaced repetition scheduling | YES (server-calculated dates) | PARTIAL (localStorage, no cross-device) |

### User Experience

| Improvement | Impact |
|------------|--------|
| Login → see progress on any device | HIGH — students use laptop + phone |
| Save experiment → compare later | HIGH — experimentation is the core loop |
| Daily challenge → reason to return | MEDIUM — retention driver |
| Community gallery → social proof | MEDIUM — engagement + discovery |

---

## 6. Migration Roadmap

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Run Drizzle Migrations (create tables)              │
│ Effort: S (1-2 hours)                                       │
│ Prereq: Neon database connection string in .env              │
│ Command: pnpm drizzle-kit generate && pnpm drizzle-kit push │
│ Tables created: users, progress, templates, diagrams, etc.  │
│ Risk: LOW — schema is already defined and reviewed          │
└─────────────────────────────────────┬───────────────────────┘
                                      │
┌─────────────────────────────────────▼───────────────────────┐
│ STEP 2: Create ml_experiments + daily_challenges tables     │
│ Effort: S (1-2 hours)                                       │
│ Add new table schemas to src/db/schema/                     │
│ Run drizzle-kit generate + push                             │
└─────────────────────────────────────┬───────────────────────┘
                                      │
┌─────────────────────────────────────▼───────────────────────┐
│ STEP 3: Seed pipeline templates into DB                     │
│ Effort: M (3-4 hours)                                       │
│ Script reads pipeline-templates.ts → inserts into templates │
│ Verify data integrity after seeding                         │
└─────────────────────────────────────┬───────────────────────┘
                                      │
┌─────────────────────────────────────▼───────────────────────┐
│ STEP 4: Create API routes                                   │
│ Effort: M (4-6 hours)                                       │
│ /api/ml-design/pipelines (GET — ISR cached)                 │
│ /api/ml-design/progress (GET/POST — auth required)          │
│ /api/ml-design/experiments (GET/POST — auth required)       │
│ /api/ml-design/challenges/today (GET — ISR daily)           │
└─────────────────────────────────────┬───────────────────────┘
                                      │
┌─────────────────────────────────────▼───────────────────────┐
│ STEP 5: Update components to use API                        │
│ Effort: M (4-6 hours)                                       │
│ Pipeline selector: import → useSWR("/api/ml-design/...")    │
│ Progress: localStorage → API calls                          │
│ Add loading states + error handling                          │
│ Add Clerk auth integration for user APIs                    │
└─────────────────────────────────────┬───────────────────────┘
                                      │
┌─────────────────────────────────────▼───────────────────────┐
│ STEP 6: Move NN training to Web Worker                      │
│ Effort: M (4-6 hours)                                       │
│ Use comlink for type-safe worker communication              │
│ Training, decision boundary, loss landscape → worker        │
│ Main thread: UI only                                         │
└─────────────────────────────────────┬───────────────────────┘
                                      │
┌─────────────────────────────────────▼───────────────────────┐
│ STEP 7: Clean up — remove hardcoded pipeline data           │
│ Effort: S (1-2 hours)                                       │
│ Delete pipeline template content from lib (keep types only) │
│ Verify bundle size reduction                                │
└─────────────────────────────────────────────────────────────┘

TOTAL ESTIMATED EFFORT: 3-4 days of focused development
```

---

## 7. What NOT to Move

```
KEEP IN FRONTEND — COMPUTATION (96 KB):
  ✅ neural-net.ts — NN training engine (real-time interactive)
  ✅ neural-network.ts — Advanced NN engine
  ✅ datasets.ts + dataset-generators.ts — Data generation (<1ms)
  ✅ activations.ts — Pure math (6 functions)
  ✅ loss-functions.ts — Pure math (3 functions)
  ✅ optimizers.ts — SGD/Adam/RMSProp (stateful computation)
  ✅ ab-testing.ts — Z-test, sample size (pure statistics)
  ✅ multi-armed-bandit.ts — Simulation engines
  ✅ feature-store.ts — Simulation engine
  ✅ serving-patterns.ts — Simulation engines (but descriptions could move)
  ✅ cnn-layer.ts — Conv2D simulation
  ✅ cnn-forward.ts — CNN shape propagation
  ✅ dropout-viz.ts — Dropout simulation
  ✅ decision-boundary.ts — Grid computation
  ✅ loss-landscape.ts — Surface computation

KEEP IN FRONTEND — UI (212 KB):
  ✅ MLDesignModule.tsx — All visualization/rendering code
  ✅ 5 orphaned component files (until wired in or deleted)
  ✅ All SVG drawing, Canvas rendering, animation logic
  ✅ All React state for real-time interaction

KEEP IN FRONTEND — STATE:
  ✅ Current training state (epoch, loss, trained network)
  ✅ Current animation tick (serving, bandit, feature store)
  ✅ UI panel state (sidebar open, mode selected)
  ✅ Canvas interaction state (step scrubber position)

MOVE TO WEB WORKER (stays frontend, off main thread):
  → NN training loop (MLD-034)
  → Decision boundary computation (combine with training worker)
  → Loss landscape grid computation

MOVE TO DATABASE:
  → User progress + streaks + XP
  → Saved experiments (config + results)
  → Daily challenge definitions + completions
  → Pipeline template content (editorial data)

MOVE TO API:
  → Pipeline catalog (GET, ISR cached)
  → Progress read/write (authenticated)
  → Experiment save/load (authenticated)
  → Daily challenge fetch (ISR daily)
```

---

## Key Insight: ML Design ≠ Algorithms Module

The Algorithms module has ~60 CONFIG objects (each 30-50 lines of descriptions, pseudocode, complexity metadata) that total 200+ KB of pure content. Moving that to a DB saves massive bundle size.

**ML Design is different.** Its 122 KB lib is 80% computation code (math, simulation engines) and only 20% content (pipeline descriptions, mode labels, step text). Moving content to DB saves ~10-15 KB — meaningful but not transformative.

**The real value of backend migration for ML Design is not performance — it's FEATURES:**
- Experiment saving/comparison (the #1 missing feature from all audits)
- Cross-device progress (students use laptop + phone)
- Daily challenges (retention driver)
- Community gallery (social sharing)

These features are IMPOSSIBLE without a database. The performance gain is a bonus, not the driver.
