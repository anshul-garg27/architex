# How to Add a New Module

This guide walks through every step required to add a new learning module to Architex. A "module" is a top-level section of the platform (e.g., Algorithms, Distributed Systems, Security) that provides its own sidebar, canvas, properties panel, and bottom panel.

## Prerequisites

- Familiarity with React hooks, Zustand, and the existing module structure.
- The codebase checked out and `pnpm install` completed.

## Overview of touched files

| Step | File | Purpose |
|------|------|---------|
| 1 | `src/stores/ui-store.ts` | Add to `ModuleType` union |
| 2 | `src/components/modules/YourModule.tsx` | Module hook + components |
| 3 | `src/components/modules/index.ts` | Barrel export |
| 4 | `src/app/page.tsx` | Wire into the module router |
| 5 | `src/components/shared/activity-bar.tsx` | Add icon to nav |
| 6 | `src/components/shared/command-palette.tsx` | Add to command list |

---

## Step 1: Add to the ModuleType union

Open `src/stores/ui-store.ts` and add your module's identifier to the `ModuleType` union type. Module IDs use `kebab-case`.

```ts
// src/stores/ui-store.ts

export type ModuleType =
  | "system-design"
  | "algorithms"
  | "data-structures"
  | "lld"
  | "database"
  | "distributed"
  | "networking"
  | "os"
  | "concurrency"
  | "security"
  | "ml-design"
  | "interview"
  | "knowledge-graph"
  | "your-module";          // <-- add here
```

The same union is mirrored in `src/lib/types.ts`. Update it there as well to keep the canonical type definition in sync.

---

## Step 2: Create the module hook

Every module follows the `useXxxModule` hook pattern. The hook returns an object with four ReactNode properties that the workspace layout consumes:

```ts
{
  sidebar: ReactNode;      // Left panel (palette, topic list, etc.)
  canvas: ReactNode;       // Main content area
  properties: ReactNode;   // Right panel (details, config, etc.)
  bottomPanel: ReactNode;  // Bottom panel (console, metrics, etc.)
}
```

Create `src/components/modules/YourModule.tsx`. Here is a minimal working example modeled after the existing modules:

```tsx
// src/components/modules/YourModule.tsx
"use client";

import React, { memo, useState, useCallback } from "react";
import { Atom } from "lucide-react";  // pick an appropriate icon
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────

interface YourModuleState {
  selectedTopic: string;
}

// ── Topic definitions ───────────────────────────────────────

const TOPICS = [
  { id: "topic-1", label: "Topic One", description: "First topic" },
  { id: "topic-2", label: "Topic Two", description: "Second topic" },
];

// ── Sidebar ─────────────────────────────────────────────────

const YourModuleSidebar = memo(function YourModuleSidebar({
  selectedTopic,
  onSelectTopic,
}: {
  selectedTopic: string;
  onSelectTopic: (id: string) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border px-3 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Your Module
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {TOPICS.map((topic) => (
          <button
            key={topic.id}
            onClick={() => onSelectTopic(topic.id)}
            className={cn(
              "mb-1 w-full rounded-md px-3 py-2 text-left text-xs transition-colors",
              selectedTopic === topic.id
                ? "bg-primary/15 text-primary"
                : "text-foreground-muted hover:bg-sidebar-accent hover:text-foreground",
            )}
          >
            {topic.label}
          </button>
        ))}
      </div>
    </div>
  );
});

// ── Canvas ──────────────────────────────────────────────────

const YourModuleCanvas = memo(function YourModuleCanvas({
  selectedTopic,
}: {
  selectedTopic: string;
}) {
  const topic = TOPICS.find((t) => t.id === selectedTopic);
  return (
    <div className="flex h-full w-full items-center justify-center bg-background">
      <div className="text-center">
        <Atom className="mx-auto mb-4 h-16 w-16 text-primary opacity-30" />
        <h2 className="text-lg font-semibold text-foreground">
          {topic?.label ?? "Select a topic"}
        </h2>
        <p className="text-sm text-foreground-muted">
          {topic?.description ?? "Choose a topic from the sidebar."}
        </p>
      </div>
    </div>
  );
});

// ── Properties ──────────────────────────────────────────────

const YourModuleProperties = memo(function YourModuleProperties() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border px-3 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Properties
        </h2>
      </div>
      <div className="flex flex-1 items-center justify-center px-3 py-8">
        <p className="text-center text-xs text-foreground-subtle">
          Select a topic to view properties.
        </p>
      </div>
    </div>
  );
});

// ── Bottom Panel ────────────────────────────────────────────

const YourModuleBottomPanel = memo(function YourModuleBottomPanel() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Console
        </span>
      </div>
      <div className="flex flex-1 items-center justify-center text-xs text-foreground-subtle">
        Module output will appear here.
      </div>
    </div>
  );
});

// ── Module Hook ─────────────────────────────────────────────

export function useYourModule() {
  const [selectedTopic, setSelectedTopic] = useState(TOPICS[0].id);

  const handleSelectTopic = useCallback((id: string) => {
    setSelectedTopic(id);
  }, []);

  return {
    sidebar: (
      <YourModuleSidebar
        selectedTopic={selectedTopic}
        onSelectTopic={handleSelectTopic}
      />
    ),
    canvas: <YourModuleCanvas selectedTopic={selectedTopic} />,
    properties: <YourModuleProperties />,
    bottomPanel: <YourModuleBottomPanel />,
  };
}

// Named export for barrel (not always needed, but conventional)
export const YourModule = memo(function YourModule() {
  return null;
});
```

Key conventions observed across the codebase:

- Every sub-component is wrapped in `memo()`.
- State lives in the hook, not in a global store (module-local state).
- Sidebar styling uses `border-sidebar-border`, `text-foreground-muted`, `bg-sidebar-accent` tokens.
- The canvas area uses `bg-background` and centers content by default.

For a real-world example, see `src/components/modules/SecurityModule.tsx` (complex, with multiple topics and step-through animations) or `src/components/modules/PlaceholderModule.tsx` (minimal skeleton).

---

## Step 3: Export from the modules barrel

Add exports in `src/components/modules/index.ts`:

```ts
// src/components/modules/index.ts
export { YourModule, useYourModule } from "./YourModule";
```

---

## Step 4: Wire into the module router in page.tsx

Open `src/app/page.tsx`. Three changes are needed:

### 4a. Import the hook

```ts
import { useYourModule } from "@/components/modules/YourModule";
```

### 4b. Call the hook unconditionally

Inside `useModuleContent()`, add a call to your hook. Because of the Rules of Hooks, every module hook must be called on every render regardless of which module is active:

```ts
function useModuleContent() {
  const activeModule = useUIStore((s) => s.activeModule);

  // ... existing hooks ...
  const yourContent = useYourModule();          // <-- add here

  switch (activeModule) {
    // ... existing cases ...
    case "your-module":
      return yourContent;                       // <-- add case
    default:
      return placeholderContent;
  }
}
```

### 4c. Ensure the default branch still handles unknown modules

The `default` case already returns `placeholderContent`, which renders a "Coming Soon" page. Your new module replaces this for its specific ID.

---

## Step 5: Add to the activity bar

Open `src/components/shared/activity-bar.tsx` and add an entry to the `modules` array:

```ts
import { Atom } from "lucide-react";  // or whichever icon you chose

const modules: ModuleItem[] = [
  // ... existing entries ...
  { id: "your-module", label: "Your Module", icon: Atom, shortcut: "" },
];
```

The `shortcut` field maps to a `Cmd+<number>` keyboard shortcut. The first 9 modules use shortcuts `1` through `9`. Modules beyond that leave `shortcut` as an empty string.

Both the desktop vertical sidebar and the mobile horizontal bottom bar are generated from this single array, so adding one entry covers both layouts.

---

## Step 6: Add to the command palette

Open `src/components/shared/command-palette.tsx` and add a `moduleCmd` call inside the `useCommands()` hook's `useMemo` array:

```ts
moduleCmd("your-module", "Your Module", Atom),
```

This enables users to switch to your module via `Cmd+K` and typing its name.

---

## Verification checklist

After completing the above steps:

1. `pnpm typecheck` passes with no errors.
2. The activity bar shows your module icon.
3. Clicking the icon switches to your module.
4. `Cmd+K` > "Your Module" switches correctly.
5. The sidebar, canvas, properties, and bottom panel all render.
6. Mobile layout works (the module appears in the overflow sheet if beyond the first 5).

---

## Optional: Add library code

If your module needs domain logic (e.g., simulation engines, data generators), place it under `src/lib/your-module/` with an `index.ts` barrel export. Follow the existing pattern in `src/lib/algorithms/`, `src/lib/distributed/`, `src/lib/security/`, etc.

---

## Architecture notes

- Modules are **not** lazy-loaded at the route level (all share `/`), but their heavy content is behind conditional rendering controlled by `activeModule` in the UI store.
- State that should persist across module switches (e.g., canvas nodes) lives in Zustand stores (`canvas-store`, `simulation-store`). Module-local ephemeral state lives in the hook's `useState`.
- The `WorkspaceLayout` component in `src/components/shared/workspace-layout.tsx` receives the four panel ReactNodes and handles resizable panel layout via `react-resizable-panels`.
