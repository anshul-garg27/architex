# FIX: Data Structures Module Browser Freeze

> Read `DS-MODULE-ANALYSIS.md` in the repo root for the complete technical analysis.

---

## THE PROBLEM

When user clicks Data Structures module, the **entire browser tab freezes** for 5-15 seconds and may crash. No clicks work anywhere — not even the sidebar to switch to another module.

## ROOT CAUSE

**~24,000 lines / 820 KB of JavaScript loads synchronously on the main thread in one chunk.**

The import chain:
```
DataStructuresWrapper
  → data-structures/index.tsx (1,680 lines, 160+ named imports)
    → @/lib/data-structures barrel (1,010 line index.ts re-exports ALL 41 files)
      → 40 implementation files (14,997 lines, 450 KB)
    → DSCanvas.tsx
      → ALL 8 visualizer files (4,776 lines)
    → DSBottomPanel.tsx
      → 3 heavy sub-components (1,116 lines)
────────────────────────────────────────────────
TOTAL SYNCHRONOUS: ~24,000 lines, ~820 KB
```

## WHY OTHER MODULES WORK

| Module | Lib (lines) | Component (lines) | Total Sync | Status |
|--------|------------:|-------------------:|-----------:|--------|
| Algorithm | 22,080 | **1,762** | ~24K | WORKS — tiny component layer |
| Distributed | 4,323 | 5,478 | ~10K | WORKS — uses React.lazy() |
| Security | 4,576 | 5,168 | ~10K | WORKS — half the size |
| **Data Structures** | **14,997** | **8,950** | **~24K** | **CRASHES — both layers massive** |

Algorithm has similar TOTAL size but its component layer is only 1,762 lines. Data Structures has BOTH a massive lib (15K) AND a massive component layer (9K).

## CURRENT STATE

- `DataStructuresWrapper.tsx` → shows placeholder ("Temporarily disabled")
- Split files exist at `src/components/modules/data-structures/`
- `initial-state.ts` → returns minimal state (only array data, everything else null)
- **BUT `index.tsx` still imports 160+ functions from the barrel** — this is what needs to change

## YOUR TASK: 4 Steps

### Step 1: Extract DS_CATALOG from the barrel

The barrel at `src/lib/data-structures/index.ts` contains `DS_CATALOG` (~520 lines of metadata) plus a runtime assertion. Files that only need catalog data (DSSidebar, DSControls, DSProperties) currently pull in ALL 41 implementations just to get catalog info.

**Create:** `src/lib/data-structures/catalog.ts`
- Move `DS_CATALOG`, `DS_ID_LIST` type, and the runtime assertion to this file
- Update `DSSidebar.tsx`, `DSControls.tsx`, `DSProperties.tsx` to import from `catalog.ts` not the barrel

### Step 2: Lazy-load visualizers in DSCanvas.tsx

Currently `DSCanvas.tsx` statically imports ALL 8 visualizer files. Only 1 renders at a time (based on `activeDS`).

**Replace static imports with React.lazy:**
```tsx
import { lazy, Suspense } from "react";

const TreeCanvases = lazy(() => import("./visualizers/TreeCanvases"));
const LinearCanvases = lazy(() => import("./visualizers/LinearCanvases"));
const HashCanvases = lazy(() => import("./visualizers/HashCanvases"));
const HeapCanvases = lazy(() => import("./visualizers/HeapCanvases"));
const GraphCanvases = lazy(() => import("./visualizers/GraphCanvases"));
const ProbabilisticCanvases = lazy(() => import("./visualizers/ProbabilisticCanvases"));
const SystemCanvases = lazy(() => import("./visualizers/SystemCanvases"));
const CRDTCanvases = lazy(() => import("./visualizers/CRDTCanvases"));

// Wrap each in <Suspense fallback={<LoadingSpinner />}>
```

This cuts ~4,500 lines from initial parse.

### Step 3: Replace barrel imports with per-DS dynamic imports in index.tsx

The biggest change. `index.tsx` imports 160+ functions from `@/lib/data-structures`. These need to become lazy per-DS imports.

**Replace the 160+ static imports with a lazy operation dispatcher:**

```tsx
// Instead of:
// import { arrayInsert, arrayDelete, hashInsert, ... } from "@/lib/data-structures";

// Create a per-DS operation loader:
async function loadDSOperations(ds: string) {
  switch (ds) {
    case "array":
      return import("@/lib/data-structures/array-ds");
    case "stack":
    case "queue":
      return import("@/lib/data-structures/array-ds"); // stack/queue use array ops
    case "linked-list":
      return import("@/lib/data-structures/linked-list");
    case "hash-table":
      return import("@/lib/data-structures/hash-table");
    case "bst":
      return import("@/lib/data-structures/bst-ds");
    // ... one case per DS, importing only its specific file
  }
}
```

Then `handleOperation` and `handleRandom` become async — they call `loadDSOperations(activeDS)` and use the returned module.

**Keep only these static imports** (needed for initial render):
```tsx
import type { DSStep } from "@/lib/data-structures/types"; // types only, no runtime code
import { DS_CATALOG } from "@/lib/data-structures/catalog"; // metadata only
```

### Step 4: Restore the wrapper

After Steps 1-3, the module should load in <200ms. Restore the real wrapper:

```tsx
// src/components/modules/wrappers/DataStructuresWrapper.tsx
"use client";
import { memo, useEffect } from "react";
import { useDataStructuresModule } from "@/components/modules/data-structures";
import type { ModuleContent } from "@/components/modules/module-content";

export default memo(function DataStructuresModuleContent({ onContent }: { onContent: (c: ModuleContent) => void }) {
  const content = useDataStructuresModule();
  useEffect(() => { onContent(content); }, [onContent, content]);
  return null;
});
```

## VERIFICATION CHECKLIST

After all 4 steps:

- [ ] `pnpm dev` starts without errors
- [ ] Click Data Structures — page does NOT freeze
- [ ] Sidebar buttons remain clickable while DS loads
- [ ] Array visualizer shows on first load (default DS)
- [ ] Switch to BST → loads and shows tree
- [ ] Switch to Hash Table → loads and shows table
- [ ] Operations work: insert, delete, search
- [ ] Playback works: step forward, step back, play/pause
- [ ] Switch to System Design → works normally
- [ ] Switch back to Data Structures → loads faster (cached)
- [ ] Other modules (Algorithms, Distributed, etc.) still work

## EXPECTED RESULT

| Metric | Before | After |
|--------|--------|-------|
| Initial sync load | ~24,000 lines / 820 KB | ~200 lines / 8 KB |
| Per-DS activation | 0 (already loaded) | ~300-800 lines (lazy) |
| Time to interactive | 5-15 seconds (freeze) | <200ms |
| Browser crash risk | HIGH | NONE |

## CRITICAL RULES

- R1. Zustand selectors: NEVER `(s) => ({x: s.x})` — infinite loop
- R2. ALL hooks before any early return
- R3. Keep `getInitialState` lazy — minimal state, nulls for inactive DS
- R4. Don't change functionality — everything must work the same
- R5. `memo()` all visualizer components
- R6. Test every data structure after changes
- R7. Clerk auth NOT installed — don't import from @clerk/nextjs

## FILES TO READ FIRST

1. `DS-MODULE-ANALYSIS.md` — full technical analysis (in repo root)
2. `src/lib/data-structures/index.ts` — the barrel (1,010 lines)
3. `src/components/modules/data-structures/index.tsx` — the hook (1,680 lines)
4. `src/components/modules/data-structures/DSCanvas.tsx` — canvas dispatcher
5. `src/components/modules/data-structures/initial-state.ts` — state init (already minimal)
