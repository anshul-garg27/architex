# 09 — Testing, DevOps & Quality Assurance Strategy

> Comprehensive testing plan for Architex covering unit, component, E2E, visual regression, CI/CD, bundle monitoring, performance budgets, and observability.

---

## Current State Assessment

| Aspect | Status |
|---|---|
| `vitest.config.ts` | Not present |
| `playwright.config.ts` | Not present |
| `.github/` workflows | Not present (no CI/CD) |
| Test scripts in `package.json` | None (`dev`, `build`, `start`, `lint` only) |
| Test dependencies | None installed (no vitest, playwright, testing-library) |
| Test files | Zero `.test.ts` / `.spec.ts` files |

**Verdict:** Testing infrastructure must be built from scratch.

---

## 1. Test Infrastructure Setup

### 1.1 Required Dependencies

```bash
# Unit & component testing
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom happy-dom

# E2E testing
pnpm add -D @playwright/test

# Visual regression
pnpm add -D @playwright/test @storybook/addon-storyshots storybook-addon-vis

# Coverage & reporting
pnpm add -D @vitest/coverage-v8 @vitest/ui

# Bundle analysis
pnpm add -D size-limit @size-limit/preset-app @size-limit/preset-big-lib

# MSW for API mocking
pnpm add -D msw
```

### 1.2 Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/**/index.ts',
        'src/test/**',
        'src/**/*.d.ts',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 1.3 Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    process.env.CI ? ['github'] : ['list'],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'pnpm build && pnpm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

### 1.4 Test Setup File

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

// Mock ResizeObserver (not available in jsdom)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

### 1.5 Updated package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:visual": "playwright test --project=visual",
    "test:all": "vitest run && playwright test",
    "size": "size-limit",
    "size:why": "size-limit --why"
  }
}
```

---

## 2. Unit Test Files (47 Files)

### 2.1 Simulation Engine (8 files) -- Priority: P0 (Critical)

| # | File Path | What It Tests | Priority |
|---|---|---|---|
| 1 | `src/lib/simulation/__tests__/queuing-model.test.ts` | M/M/1 utilization, avg queue length, avg wait time, avg system time, Erlang-C, M/M/c variants, Little's law, percentile estimation, `simulateNode` | P0 |
| 2 | `src/lib/simulation/__tests__/traffic-simulator.test.ts` | `TrafficGenerator` class, `generateRequests`, `poissonSample`, traffic timeline generation, rate parameter variations | P0 |
| 3 | `src/lib/simulation/__tests__/metrics-collector.test.ts` | `MetricsCollector` accumulation, reset, snapshot, windowed aggregation | P0 |
| 4 | `src/lib/simulation/__tests__/chaos-engine.test.ts` | `ChaosEngine` event generation per category/severity, node-type event filtering, `CHAOS_EVENTS` constant integrity | P0 |
| 5 | `src/lib/simulation/__tests__/capacity-planner.test.ts` | `estimateCapacity` with various inputs (CPU-bound, I/O-bound, mixed), `formatEstimate` human-readable output | P0 |

### 2.2 Algorithm Library (8 files) -- Priority: P0

| # | File Path | What It Tests | Priority |
|---|---|---|---|
| 6 | `src/lib/algorithms/sorting/__tests__/bubble-sort.test.ts` | Correctness on empty, single, sorted, reverse, duplicates; step generation for visualizer | P0 |
| 7 | `src/lib/algorithms/sorting/__tests__/merge-sort.test.ts` | Correctness, stability, step recording with merge phases | P0 |
| 8 | `src/lib/algorithms/sorting/__tests__/quick-sort.test.ts` | Correctness, pivot selection variants, worst-case behavior | P0 |
| 9 | `src/lib/algorithms/sorting/__tests__/heap-sort.test.ts` | Correctness, heapify steps, in-place behavior | P0 |
| 10 | `src/lib/algorithms/sorting/__tests__/insertion-sort.test.ts` | Correctness, step generation, nearly-sorted optimization | P0 |
| 11 | `src/lib/algorithms/sorting/__tests__/selection-sort.test.ts` | Correctness, minimum-finding steps | P0 |
| 12 | `src/lib/algorithms/__tests__/playback-controller.test.ts` | Step-through, play/pause/reset, speed control, boundary conditions | P0 |
| 13 | `src/lib/algorithms/__tests__/types.test.ts` | Type guard functions, enum exhaustiveness | P1 |

### 2.3 Distributed Systems Library (6 files) -- Priority: P0

| # | File Path | What It Tests | Priority |
|---|---|---|---|
| 14 | `src/lib/distributed/__tests__/vector-clock.test.ts` | Increment, merge, comparison (before/after/concurrent), serialization | P0 |
| 15 | `src/lib/distributed/__tests__/consistent-hash.test.ts` | Virtual node placement, key lookup, node addition/removal, distribution uniformity | P0 |
| 16 | `src/lib/distributed/__tests__/raft.test.ts` | Leader election, log replication, term management, split-brain prevention | P0 |
| 17 | `src/lib/distributed/__tests__/gossip.test.ts` | Gossip propagation, convergence, failure detection | P0 |
| 18 | `src/lib/distributed/__tests__/cap-theorem.test.ts` | CA/CP/AP classification, partition tolerance scenarios | P1 |
| 19 | `src/lib/distributed/__tests__/crdt.test.ts` | G-Counter, PN-Counter, LWW-Register merge, commutativity, idempotency | P0 |

### 2.4 Networking Library (6 files) -- Priority: P1

| # | File Path | What It Tests | Priority |
|---|---|---|---|
| 20 | `src/lib/networking/__tests__/tcp-state-machine.test.ts` | All TCP state transitions, 3-way handshake, FIN/RST, edge cases | P1 |
| 21 | `src/lib/networking/__tests__/tls-handshake.test.ts` | TLS 1.2 vs 1.3 step sequences, certificate validation steps | P1 |
| 22 | `src/lib/networking/__tests__/dns-resolution.test.ts` | Recursive/iterative resolution, caching, TTL, CNAME chains | P1 |
| 23 | `src/lib/networking/__tests__/http-comparison.test.ts` | HTTP/1.1 vs 2 vs 3 feature comparison data integrity | P1 |
| 24 | `src/lib/networking/__tests__/websocket-lifecycle.test.ts` | Upgrade handshake, message framing, close handshake | P1 |
| 25 | `src/lib/networking/__tests__/cors-simulator.test.ts` | Preflight checks, simple vs preflighted requests, wildcard origins | P1 |

### 2.5 OS Library (4 files) -- Priority: P1

| # | File Path | What It Tests | Priority |
|---|---|---|---|
| 26 | `src/lib/os/__tests__/scheduling.test.ts` | FCFS, SJF, Round Robin, Priority scheduling correctness and Gantt chart generation | P1 |
| 27 | `src/lib/os/__tests__/page-replacement.test.ts` | FIFO, LRU, Optimal page replacement; hit/miss rates | P1 |
| 28 | `src/lib/os/__tests__/memory.test.ts` | Memory allocation strategies, fragmentation calculation | P1 |
| 29 | `src/lib/os/__tests__/deadlock.test.ts` | Deadlock detection (resource-allocation graph), Banker's algorithm | P1 |

### 2.6 Concurrency Library (3 files) -- Priority: P1

| # | File Path | What It Tests | Priority |
|---|---|---|---|
| 30 | `src/lib/concurrency/__tests__/race-condition.test.ts` | Race condition detection, interleaving generation | P1 |
| 31 | `src/lib/concurrency/__tests__/producer-consumer.test.ts` | Buffer management, blocking semantics, throughput calculation | P1 |
| 32 | `src/lib/concurrency/__tests__/dining-philosophers.test.ts` | Deadlock detection, resource hierarchy solution verification | P1 |

### 2.7 Interview Engine (4 files) -- Priority: P0

| # | File Path | What It Tests | Priority |
|---|---|---|---|
| 33 | `src/lib/interview/__tests__/scoring.test.ts` | Score calculation per dimension, overall grade, percentile ranking | P0 |
| 34 | `src/lib/interview/__tests__/srs.test.ts` | Spaced repetition interval calculation, ease factor adjustment, review scheduling | P0 |
| 35 | `src/lib/interview/__tests__/challenges.test.ts` | Challenge data integrity, difficulty progression, requirement validation | P1 |
| 36 | `src/lib/interview/__tests__/achievements.test.ts` | Achievement unlock conditions, progress tracking, badge assignment | P1 |

### 2.8 Export Library (5 files) -- Priority: P1

| # | File Path | What It Tests | Priority |
|---|---|---|---|
| 37 | `src/lib/export/__tests__/to-json.test.ts` | JSON serialization round-trip, schema validation, edge cases | P1 |
| 38 | `src/lib/export/__tests__/to-mermaid.test.ts` | Mermaid syntax generation, node/edge mapping, subgraph support | P1 |
| 39 | `src/lib/export/__tests__/to-plantuml.test.ts` | PlantUML syntax correctness, component diagram generation | P1 |
| 40 | `src/lib/export/__tests__/to-terraform.test.ts` | HCL generation, resource naming, dependency ordering | P1 |
| 41 | `src/lib/export/__tests__/to-url.test.ts` | URL encoding/decoding, compression (lz-string), max length handling | P1 |

### 2.9 Store Tests (4 files) -- Priority: P0

| # | File Path | What It Tests | Priority |
|---|---|---|---|
| 42 | `src/stores/__tests__/ui-store.test.ts` | Module switching, panel toggling, theme persistence, command palette state | P0 |
| 43 | `src/stores/__tests__/canvas-store.test.ts` | Node CRUD, edge CRUD, selection, undo/redo, batch operations | P0 |
| 44 | `src/stores/__tests__/simulation-store.test.ts` | Play/pause/stop/reset lifecycle, tick processing, metric accumulation | P0 |
| 45 | `src/stores/__tests__/interview-store.test.ts` | Challenge lifecycle, timer, scoring state, streak tracking | P0 |

### 2.10 Utility & Constants (2 files) -- Priority: P2

| # | File Path | What It Tests | Priority |
|---|---|---|---|
| 46 | `src/lib/__tests__/utils.test.ts` | `cn` merge behavior, class precedence | P2 |
| 47 | `src/lib/constants/__tests__/numbers.test.ts` | Latency, throughput, system numbers data integrity and reasonableness | P2 |

---

## 3. Component Test Files (20 Files)

### 3.1 Canvas Components (7 files) -- Priority: P0

| # | File Path | What It Tests | Priority |
|---|---|---|---|
| 1 | `src/components/canvas/__tests__/DesignCanvas.test.tsx` | Canvas renders, node drop handling, zoom/pan, selection, context menu | P0 |
| 2 | `src/components/canvas/nodes/system-design/__tests__/BaseNode.test.tsx` | Category color mapping, state dot, metric badge, handle positions, selected ring | P0 |
| 3 | `src/components/canvas/nodes/system-design/__tests__/NodeVariants.test.tsx` | WebServer, LoadBalancer, Database, Cache, MQ, APIGateway, CDN, Client, Storage node rendering | P0 |
| 4 | `src/components/canvas/edges/__tests__/DataFlowEdge.test.tsx` | Edge rendering per type (http, grpc, ws, etc.), animation, label | P1 |
| 5 | `src/components/canvas/panels/__tests__/ComponentPalette.test.tsx` | Category grouping, drag initiation, search filtering, keyboard navigation | P0 |
| 6 | `src/components/canvas/panels/__tests__/PropertiesPanel.test.tsx` | Config field rendering, value changes propagate to store, empty state | P0 |
| 7 | `src/components/canvas/panels/__tests__/BottomPanel.test.tsx` | Tab switching (code/timeline/metrics/console), panel resize | P1 |

### 3.2 Shared Components (5 files) -- Priority: P0

| # | File Path | What It Tests | Priority |
|---|---|---|---|
| 8 | `src/components/shared/__tests__/activity-bar.test.tsx` | Module button rendering, active state indicator, click triggers module switch, keyboard shortcuts | P0 |
| 9 | `src/components/shared/__tests__/command-palette.test.tsx` | Opens on Cmd+K, search filtering, group headings, command execution, Escape closes | P0 |
| 10 | `src/components/shared/__tests__/status-bar.test.tsx` | Simulation status display, node/edge count, zoom level | P1 |
| 11 | `src/components/shared/__tests__/export-dialog.test.tsx` | Format selection, export triggers correct exporter, copy-to-clipboard | P1 |
| 12 | `src/components/shared/__tests__/template-gallery.test.tsx` | Template cards render, category filter, load-template action | P1 |

### 3.3 Visualization Components (5 files) -- Priority: P1

| # | File Path | What It Tests | Priority |
|---|---|---|---|
| 13 | `src/components/visualization/charts/__tests__/MetricsDashboard.test.tsx` | All four chart sub-components render with data, empty state, data updates | P1 |
| 14 | `src/components/visualization/gauges/__tests__/Gauges.test.tsx` | UtilizationGauge and CacheHitGauge render at 0%, 50%, 100%, color thresholds | P1 |
| 15 | `src/components/visualization/sparklines/__tests__/Sparkline.test.tsx` | SVG path generation, responsive sizing, data point highlighting | P2 |
| 16 | `src/components/visualization/algorithms/__tests__/SortingVisualizer.test.tsx` | Bar rendering, step highlighting, comparison/swap indicators, playback controls | P1 |
| 17 | `src/components/visualization/distributed/__tests__/DistributedVis.test.tsx` | RaftVisualizer leader election, ConsistentHashRing node placement, VectorClockDiagram merges | P1 |

### 3.4 Module Components (3 files) -- Priority: P1

| # | File Path | What It Tests | Priority |
|---|---|---|---|
| 18 | `src/components/modules/__tests__/AlgorithmModule.test.tsx` | Algorithm selection, category tabs, playback integration | P1 |
| 19 | `src/components/modules/__tests__/InterviewModule.test.tsx` | Challenge card list, start challenge, timer display, score submission | P1 |
| 20 | `src/components/modules/__tests__/DistributedModule.test.tsx` | Raft/Gossip/ConsistentHash visualization toggling, parameter controls | P1 |

---

## 4. E2E Test Files (12 Files)

### 4.1 Core User Flows (4 files) -- Priority: P0

| # | File Path | What It Tests | Priority |
|---|---|---|---|
| 1 | `e2e/canvas-design-flow.spec.ts` | Full flow: open app, drag 3 nodes from palette onto canvas, connect with edges, verify topology | P0 |
| 2 | `e2e/simulation-lifecycle.spec.ts` | Build architecture, start simulation, verify metrics appear, pause, resume, stop, reset | P0 |
| 3 | `e2e/module-switching.spec.ts` | Click each activity bar icon, verify correct module loads, keyboard shortcut switching (Cmd+1..9) | P0 |
| 4 | `e2e/command-palette.spec.ts` | Cmd+K opens, type to filter, arrow-key navigate, Enter executes, Escape closes | P0 |

### 4.2 Feature Flows (4 files) -- Priority: P1

| # | File Path | What It Tests | Priority |
|---|---|---|---|
| 5 | `e2e/export-import.spec.ts` | Export to JSON, Mermaid, PlantUML, Terraform; re-import JSON and verify graph restored | P1 |
| 6 | `e2e/template-loading.spec.ts` | Open template gallery, select template, verify nodes/edges match template definition | P1 |
| 7 | `e2e/algorithm-visualization.spec.ts` | Select algorithm, set input array, play visualization, verify step progression, pause at step N | P1 |
| 8 | `e2e/interview-challenge.spec.ts` | Start challenge, timer counts down, build solution, submit, verify score displayed | P1 |

### 4.3 Cross-Cutting Concerns (4 files) -- Priority: P1

| # | File Path | What It Tests | Priority |
|---|---|---|---|
| 9 | `e2e/keyboard-shortcuts.spec.ts` | All registered shortcuts work: Cmd+B sidebar, Cmd+J bottom panel, Cmd+Shift+B properties, ? help | P1 |
| 10 | `e2e/theme-switching.spec.ts` | Dark/light/system theme via command palette, persistence after reload | P1 |
| 11 | `e2e/responsive-layout.spec.ts` | Desktop (1920x1080), tablet (768x1024), mobile (375x812): verify layout adapts, panels collapse | P1 |
| 12 | `e2e/persistence.spec.ts` | Create design, refresh page, verify canvas state restored from IndexedDB/localStorage | P1 |

---

## 5. Visual Regression Tests (4 Files)

| # | File Path | What It Tests | Priority |
|---|---|---|---|
| 1 | `e2e/visual/canvas-nodes.visual.spec.ts` | Screenshot comparison of every node type (9 variants) in idle, active, error states across dark/light themes | P1 |
| 2 | `e2e/visual/metrics-dashboard.visual.spec.ts` | Dashboard with sample data: charts, gauges, sparklines rendering pixel-accurately | P2 |
| 3 | `e2e/visual/activity-bar.visual.spec.ts` | Activity bar with each module active, dark/light theme | P2 |
| 4 | `e2e/visual/command-palette.visual.spec.ts` | Command palette open with search results, group headings, shortcut badges | P2 |

### Visual Test Configuration

```typescript
// e2e/visual/visual.config.ts
import { expect } from '@playwright/test';

expect.extend({
  toHaveScreenshot: async (page, name, options = {}) => {
    return page.screenshot({
      ...options,
      animations: 'disabled',
      caret: 'hide',
    });
  },
});

// Threshold: 0.1% pixel difference allowed
export const VISUAL_THRESHOLD = 0.001;
export const VISUAL_MAX_DIFF_PIXELS = 50;
```

---

## 6. CI/CD Pipeline Design

### 6.1 Primary Workflow: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: '20'
  PNPM_VERSION: '9'

jobs:
  # ── Lint & Type Check ──────────────────────────────────
  lint:
    name: Lint & Types
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm tsc --noEmit

  # ── Unit & Component Tests ─────────────────────────────
  test-unit:
    name: Unit Tests
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:coverage
      - name: Upload coverage
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/
      - name: Check coverage thresholds
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          echo "Line coverage: $COVERAGE%"
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage below 80% threshold"
            exit 1
          fi

  # ── Build ──────────────────────────────────────────────
  build:
    name: Build
    runs-on: ubuntu-latest
    timeout-minutes: 15
    needs: [lint]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - name: Upload build
        uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: .next/
          retention-days: 1

  # ── Bundle Size Check ──────────────────────────────────
  bundle-size:
    name: Bundle Size
    runs-on: ubuntu-latest
    timeout-minutes: 10
    needs: [build]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - uses: actions/download-artifact@v4
        with:
          name: build-output
          path: .next/
      - run: pnpm size
      - name: Comment bundle size on PR
        if: github.event_name == 'pull_request'
        uses: andresz1/size-limit-action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          skip_step: build

  # ── E2E Tests ──────────────────────────────────────────
  test-e2e:
    name: E2E Tests (${{ matrix.project }})
    runs-on: ubuntu-latest
    timeout-minutes: 30
    needs: [build]
    strategy:
      fail-fast: false
      matrix:
        project: [chromium, firefox, webkit]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps ${{ matrix.project }}
      - uses: actions/download-artifact@v4
        with:
          name: build-output
          path: .next/
      - name: Run E2E tests
        run: pnpm test:e2e --project=${{ matrix.project }}
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: e2e-results-${{ matrix.project }}
          path: |
            test-results/
            playwright-report/

  # ── Visual Regression ──────────────────────────────────
  test-visual:
    name: Visual Regression
    runs-on: ubuntu-latest
    timeout-minutes: 20
    needs: [build]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - uses: actions/download-artifact@v4
        with:
          name: build-output
          path: .next/
      - name: Run visual tests
        run: pnpm test:visual
      - name: Upload snapshots
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: visual-diff
          path: e2e/visual/**/*-diff.png

  # ── Deploy Preview ─────────────────────────────────────
  deploy-preview:
    name: Deploy Preview
    runs-on: ubuntu-latest
    timeout-minutes: 10
    needs: [test-unit, test-e2e, build]
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  # ── Deploy Production ──────────────────────────────────
  deploy-production:
    name: Deploy Production
    runs-on: ubuntu-latest
    timeout-minutes: 10
    needs: [test-unit, test-e2e, test-visual, bundle-size, build]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 6.2 Nightly Workflow: `.github/workflows/nightly.yml`

```yaml
name: Nightly

on:
  schedule:
    - cron: '0 6 * * *'  # 6 AM UTC daily
  workflow_dispatch:

jobs:
  full-e2e:
    name: Full E2E Suite (All Browsers + Mobile)
    runs-on: ubuntu-latest
    timeout-minutes: 60
    strategy:
      matrix:
        project: [chromium, firefox, webkit, mobile-chrome, mobile-safari]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps
      - run: pnpm build
      - run: pnpm test:e2e --project=${{ matrix.project }}

  lighthouse:
    name: Lighthouse Audit
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile && pnpm build
      - name: Lighthouse CI
        uses: treosh/lighthouse-ci-action@v12
        with:
          configPath: '.lighthouserc.json'
          uploadArtifacts: true

  dependency-audit:
    name: Security Audit
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm audit --audit-level=high
```

### 6.3 Release Workflow: `.github/workflows/release.yml`

```yaml
name: Release

on:
  push:
    tags: ['v*']

jobs:
  release:
    name: Create Release
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Generate changelog
        id: changelog
        uses: mikepenz/release-changelog-builder-action@v4
        with:
          configuration: '.github/changelog-config.json'
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          body: ${{ steps.changelog.outputs.changelog }}
          draft: false
          prerelease: ${{ contains(github.ref, '-rc') }}
```

---

## 7. Bundle Size Monitoring

### `.size-limit.json`

```json
[
  {
    "name": "Initial JS (First Load)",
    "path": ".next/static/chunks/*.js",
    "limit": "200 kB",
    "gzip": true
  },
  {
    "name": "Canvas Module",
    "path": ".next/static/chunks/*canvas*.js",
    "limit": "80 kB",
    "gzip": true
  },
  {
    "name": "Simulation Engine",
    "path": ".next/static/chunks/*simulation*.js",
    "limit": "30 kB",
    "gzip": true
  },
  {
    "name": "Algorithm Library",
    "path": ".next/static/chunks/*algorithm*.js",
    "limit": "25 kB",
    "gzip": true
  },
  {
    "name": "Visualization Charts",
    "path": ".next/static/chunks/*chart*.js",
    "limit": "40 kB",
    "gzip": true
  },
  {
    "name": "Distributed Systems Lib",
    "path": ".next/static/chunks/*distributed*.js",
    "limit": "20 kB",
    "gzip": true
  },
  {
    "name": "Export Utilities",
    "path": ".next/static/chunks/*export*.js",
    "limit": "15 kB",
    "gzip": true
  },
  {
    "name": "Total CSS",
    "path": ".next/static/css/*.css",
    "limit": "50 kB",
    "gzip": true
  }
]
```

### Bundle Budget Enforcement

```typescript
// next.config.ts addition
const nextConfig = {
  experimental: {
    // Warn when page JS exceeds budget
    largePageDataBytes: 128 * 1024, // 128 KB
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.performance = {
        hints: 'warning',
        maxAssetSize: 250_000,       // 250 KB per asset
        maxEntrypointSize: 500_000,  // 500 KB per entry
      };
    }
    return config;
  },
};
```

---

## 8. Performance Budgets

### 8.1 Core Web Vitals Targets

| Metric | Target (P75) | Ceiling (P95) | Measurement |
|---|---|---|---|
| **LCP** (Largest Contentful Paint) | < 1.5s | < 2.5s | Canvas first render complete |
| **INP** (Interaction to Next Paint) | < 100ms | < 200ms | Node drag, palette click, sim toggle |
| **CLS** (Cumulative Layout Shift) | < 0.05 | < 0.1 | Panel open/close, template load |
| **FCP** (First Contentful Paint) | < 1.0s | < 1.8s | Shell + activity bar render |
| **TTFB** (Time to First Byte) | < 200ms | < 500ms | Vercel edge response |
| **TBT** (Total Blocking Time) | < 150ms | < 300ms | Initial hydration |

### 8.2 Lighthouse Budget Configuration

```json
// .lighthouserc.json
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:3000",
        "http://localhost:3000/problems/design-url-shortener"
      ],
      "numberOfRuns": 3,
      "settings": {
        "preset": "desktop"
      }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["error", { "minScore": 0.95 }],
        "categories:seo": ["warn", { "minScore": 0.9 }],
        "first-contentful-paint": ["error", { "maxNumericValue": 1800 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "interactive": ["error", { "maxNumericValue": 3500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-blocking-time": ["error", { "maxNumericValue": 300 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

### 8.3 Application-Specific Performance Budgets

| Operation | Budget | Measurement Method |
|---|---|---|
| Canvas render (100 nodes) | < 16ms per frame (60fps) | `performance.measure()` |
| Canvas render (500 nodes) | < 33ms per frame (30fps) | `performance.measure()` |
| Node drag responsiveness | < 8ms | `performance.measure()` on `onNodeDrag` |
| Simulation tick | < 10ms | Worker `postMessage` round-trip |
| Algorithm step advance | < 5ms | Playback controller timing |
| Export to JSON (100 nodes) | < 50ms | Export function timing |
| Export to Mermaid (100 nodes) | < 100ms | Export function timing |
| Template load | < 200ms | Canvas + store hydration |
| Undo/Redo | < 16ms | Store patch application |
| Command palette open | < 50ms | Mount + focus timing |
| Theme switch | < 100ms | CSS variable swap |
| IndexedDB save | < 100ms | Dexie write timing |
| IndexedDB load | < 200ms | Dexie read timing |

---

## 9. Monitoring & Observability Setup

### 9.1 Sentry — Error Tracking & Performance

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
    Sentry.browserTracingIntegration({
      enableInp: true,
    }),
  ],

  beforeSend(event) {
    // Scrub PII
    if (event.user) {
      delete event.user.ip_address;
      delete event.user.email;
    }
    return event;
  },

  // Custom tags for Architex
  initialScope: {
    tags: {
      app: 'architex',
      component: 'web',
    },
  },
});
```

**Custom Sentry Spans:**

```typescript
// Canvas performance tracking
const transaction = Sentry.startTransaction({ name: 'canvas.render' });
const span = transaction.startChild({ op: 'render', description: 'node-paint' });
// ... render
span.finish();
transaction.finish();

// Simulation engine tracking
Sentry.addBreadcrumb({
  category: 'simulation',
  message: `Simulation ${action} with ${nodeCount} nodes`,
  level: 'info',
});
```

### 9.2 PostHog — Product Analytics

```typescript
// src/lib/analytics/posthog.ts
import posthog from 'posthog-js';

export function initPostHog() {
  if (typeof window === 'undefined') return;

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    capture_pageview: false, // Manual control in Next.js
    capture_pageleave: true,
    persistence: 'localStorage+cookie',
    autocapture: {
      dom_event_allowlist: ['click', 'submit'],
      element_allowlist: ['button', 'a', 'input', 'select'],
    },
  });
}

// Key events to track
export const AnalyticsEvents = {
  // Canvas interactions
  NODE_ADDED: 'node_added',
  NODE_DELETED: 'node_deleted',
  EDGE_CREATED: 'edge_created',
  CANVAS_EXPORTED: 'canvas_exported',

  // Simulation
  SIMULATION_STARTED: 'simulation_started',
  SIMULATION_COMPLETED: 'simulation_completed',
  CHAOS_EVENT_TRIGGERED: 'chaos_event_triggered',

  // Learning
  MODULE_SWITCHED: 'module_switched',
  ALGORITHM_VISUALIZED: 'algorithm_visualized',
  CHALLENGE_STARTED: 'challenge_started',
  CHALLENGE_COMPLETED: 'challenge_completed',

  // Template
  TEMPLATE_LOADED: 'template_loaded',
  TEMPLATE_SAVED: 'template_saved',

  // Engagement
  SESSION_DURATION: 'session_duration',
  COMMAND_PALETTE_USED: 'command_palette_used',
  KEYBOARD_SHORTCUT_USED: 'keyboard_shortcut_used',

  // Growth
  SIGNUP_STARTED: 'signup_started',
  SIGNUP_COMPLETED: 'signup_completed',
  FEATURE_GATE_HIT: 'feature_gate_hit',
} as const;
```

### 9.3 Web Vitals — Real User Monitoring

```typescript
// src/lib/analytics/web-vitals.ts
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

function sendToAnalytics(metric: Metric) {
  // Send to PostHog
  posthog.capture('web_vital', {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,       // 'good' | 'needs-improvement' | 'poor'
    delta: metric.delta,
    navigationType: metric.navigationType,
    id: metric.id,
  });

  // Send to Sentry
  Sentry.setMeasurement(metric.name, metric.value, metric.name === 'CLS' ? '' : 'millisecond');
}

export function reportWebVitals() {
  onCLS(sendToAnalytics);
  onFCP(sendToAnalytics);
  onINP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}
```

### 9.4 Custom Performance Dashboard Metrics

```typescript
// src/lib/analytics/performance-marks.ts

export function markCanvasRender(nodeCount: number, durationMs: number) {
  performance.mark('canvas-render-end');
  performance.measure('canvas-render', {
    start: 'canvas-render-start',
    end: 'canvas-render-end',
  });

  if (durationMs > 16) {
    console.warn(`[perf] Canvas render took ${durationMs}ms for ${nodeCount} nodes (budget: 16ms)`);
  }
}

export function markSimulationTick(tickNumber: number, durationMs: number) {
  if (durationMs > 10) {
    console.warn(`[perf] Simulation tick #${tickNumber} took ${durationMs}ms (budget: 10ms)`);
  }
}

// PostHog custom dashboard queries
// SELECT avg(value) FROM events WHERE name = 'web_vital' AND properties.name = 'LCP' GROUP BY day
// SELECT count(*) FROM events WHERE name = 'simulation_started' GROUP BY week
```

### 9.5 Alerting Rules

| Alert | Condition | Channel | Severity |
|---|---|---|---|
| Error rate spike | > 1% of sessions in 5min window | Sentry + Slack | P0 |
| LCP regression | P75 > 2.5s for 30 min | PostHog + Slack | P1 |
| INP regression | P75 > 200ms for 30 min | PostHog + Slack | P1 |
| Build failure on main | Any CI job fails | GitHub + Slack | P0 |
| Bundle size increase | > 10% increase vs main | GitHub PR comment | P1 |
| Coverage decrease | < 80% line coverage | GitHub PR check | P2 |
| Lighthouse score drop | Performance < 90 | Nightly report | P1 |
| Unhandled promise rejection | Any occurrence | Sentry | P1 |
| Canvas frame drop | > 5% of frames > 33ms | Custom telemetry | P2 |

---

## 10. Test Priority & Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- Install all test dependencies
- Configure vitest and playwright
- Write 15 P0 unit tests (simulation + algorithm core)
- Write 4 P0 E2E tests (core user flows)
- Set up CI pipeline (lint + test + build)

### Phase 2: Coverage (Week 3-4)
- Write remaining 32 unit tests
- Write 12 P0 component tests
- Set up bundle size monitoring
- Add Sentry error tracking
- Target: 70% line coverage

### Phase 3: Polish (Week 5-6)
- Write 8 remaining component tests
- Write 8 remaining E2E tests
- Add visual regression tests
- Set up PostHog analytics
- Set up Web Vitals reporting
- Target: 80% line coverage

### Phase 4: Optimization (Week 7-8)
- Performance budget enforcement in CI
- Nightly Lighthouse audits
- Alerting rules active
- Full monitoring dashboard
- Target: 85%+ line coverage

---

## Summary Statistics

| Category | Count | P0 | P1 | P2 |
|---|---|---|---|---|
| Unit Tests | 47 | 22 | 21 | 4 |
| Component Tests | 20 | 9 | 9 | 2 |
| E2E Tests | 12 | 4 | 8 | 0 |
| Visual Regression | 4 | 0 | 2 | 2 |
| **Total** | **83** | **35** | **40** | **8** |
