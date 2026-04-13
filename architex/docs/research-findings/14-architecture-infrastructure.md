# 14 - Architecture & Infrastructure Gaps

> Full inventory of missing infrastructure across 11 categories.
> Based on audit of `package.json`, `STATE_ARCHITECTURE.ts`, and all module source code.

---

## Current Stack Inventory

### Installed Dependencies (from `package.json`)

| Package | Version | Status | Notes |
|---------|---------|--------|-------|
| `@xyflow/react` | ^12.10.2 | Active | Canvas engine |
| `zustand` | ^5.0.12 | Active | State management |
| `zundo` | ^2.3.0 | Installed | Undo middleware -- NOT wired up properly (see STATE_ARCHITECTURE.ts) |
| `dexie` | ^4.4.2 | **Installed but unused** | IndexedDB wrapper -- no schemas defined |
| `dexie-react-hooks` | ^4.4.0 | **Installed but unused** | React bindings for Dexie |
| `comlink` | ^4.4.2 | **Installed but unused** | Web Worker bridge -- no workers exist |
| `lz-string` | ^1.5.0 | **Installed but unused** | Compression -- no URL encoding implemented |
| `motion` | ^12.38.0 | Active | Animations (minimal usage) |
| `cmdk` | ^1.1.1 | Active | Command palette |
| `react-resizable-panels` | ^4.9.0 | Active | Layout panels |
| `next-themes` | ^0.4.6 | Active | Theme support |
| Various Radix UI | Latest | Active | UI primitives |

### NPM Scripts

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
}
```

**Missing scripts:** `test`, `test:e2e`, `format`, `typecheck`, `storybook`, `analyze`, `db:generate`, `db:push`, `wasm:build`.

---

## Category 1: WASM/Rust Simulation Engine (11 tasks)

The STATE_ARCHITECTURE.ts describes a simulation engine that should handle physics simulation, traffic modeling, and chaos injection. Currently all simulation logic is JavaScript-only and synchronous.

| # | Task | Description | Estimated Effort | Dependencies |
|---|------|-------------|-----------------|--------------|
| 1 | Create `wasm/` directory with `Cargo.toml` | Initialize Rust workspace with `wasm-bindgen`, `serde`, `serde_json`. Target: `wasm32-unknown-unknown`. | 2h | Rust toolchain |
| 2 | Define `SimulationConfig` struct | Rust equivalent of `TrafficConfigPayload` from STATE_ARCHITECTURE.ts. Include traffic pattern (constant/sine-wave/spike/ramp/random), requests per second, distribution. | 2h | Task 1 |
| 3 | Implement `SimulationGraph` | Port the node/edge graph model to Rust. `Vec<SimNode>` + `Vec<SimEdge>` with adjacency list. | 4h | Task 2 |
| 4 | Traffic generator module | Implement Poisson, uniform, normal distributions. Sine-wave and spike patterns. `fn generate_tick(config: &SimulationConfig, tick: u64) -> Vec<Request>`. | 4h | Task 2 |
| 5 | Request routing engine | Implement load balancer algorithms (round-robin, least-connections, consistent-hash) in Rust. Route requests through the graph. | 8h | Task 3, 4 |
| 6 | Metrics collector | Per-node throughput, latency (P50/P95/P99), error rate, queue depth. Rolling window calculations. | 4h | Task 5 |
| 7 | Chaos injection module | Implement fault types: node crash, network partition, latency injection, packet loss. Duration-based with tick expiry. | 4h | Task 5 |
| 8 | WASM bindings layer | Expose `SimulationEngine` class to JS via `wasm-bindgen`. Methods: `new()`, `init(json_config)`, `step()`, `get_metrics()`, `inject_chaos()`. | 4h | Task 2-7 |
| 9 | NPM build script | Add `wasm:build` script using `wasm-pack build --target web`. Output to `public/wasm/`. | 2h | Task 8 |
| 10 | Next.js WASM loader | Configure `next.config.js` for WASM support. Dynamic import with `import()`. Fallback to JS engine. | 4h | Task 9 |
| 11 | Feature chunk splitting | Split WASM module into lazy-loaded chunks: `simulation-core.wasm` (always), `chaos-engine.wasm` (on demand), `analytics.wasm` (on demand). | 4h | Task 10 |

**Total: ~42 hours**

---

## Category 2: Web Workers (6 tasks)

Comlink is installed but no workers exist. All computation runs on the main thread.

| # | Task | Description | Estimated Effort | Dependencies |
|---|------|-------------|-----------------|--------------|
| 12 | Create `src/workers/types.ts` | Shared TypeScript interfaces between main thread and workers. `SimulationWorkerAPI`, `AlgorithmWorkerAPI`, `LayoutWorkerAPI`. | 2h | None |
| 13 | Simulation worker | `src/workers/simulation.worker.ts` -- Hosts the WASM simulation engine. Receives graph + config, runs ticks, returns metrics via `Comlink.expose()`. | 8h | Category 1 |
| 14 | Algorithm worker | `src/workers/algorithm.worker.ts` -- Runs sorting/searching algorithms off main thread. Returns `AnimationStep[]` for visualization. Prevents UI freeze on large arrays. | 4h | Task 12 |
| 15 | Layout worker | `src/workers/layout.worker.ts` -- Runs auto-layout algorithms (dagre/ELK). Returns new node positions. | 4h | Task 12, Category 3 |
| 16 | Comlink bridge | `src/lib/worker-bridge.ts` -- Singleton factory that creates/terminates workers. Handles `Comlink.wrap()` and `Comlink.proxy()` for callbacks. | 4h | Task 12 |
| 17 | Worker error handling | Add `onerror` and `onmessageerror` handlers. Surface errors to UI via toast. Implement worker restart on crash. | 2h | Task 16 |

**Total: ~24 hours**

---

## Category 3: Auto-Layout Engine (5 tasks)

Canvas has no auto-layout. Users must manually position every node.

| # | Task | Description | Estimated Effort | Dependencies |
|---|------|-------------|-----------------|--------------|
| 18 | Install `@dagrejs/dagre` and/or `elkjs` | Add graph layout libraries. dagre for simple hierarchical, ELK for more complex layouts. | 1h | None |
| 19 | Hierarchical layout | Top-to-bottom layout for typical system design diagrams. Client -> LB -> Services -> DB. Configure rankSep, nodeSep. | 4h | Task 18 |
| 20 | Horizontal layout | Left-to-right layout variant. Good for pipeline architectures. | 2h | Task 18 |
| 21 | Force-directed layout | Spring-based layout for organic clustering. Useful when no clear hierarchy exists. | 4h | Task 18 |
| 22 | Layout toolbar | UI buttons in canvas toolbar: "Auto Layout" dropdown with layout options. Apply with animation (use `motion` to animate node positions). | 4h | Task 19-21 |

**Total: ~15 hours**

---

## Category 4: Import System (7 tasks)

No import functionality exists. Users can only build from scratch.

| # | Task | Description | Estimated Effort | Dependencies |
|---|------|-------------|-----------------|--------------|
| 23 | JSON import | Parse Architex JSON format (from `ExportCommand`). Validate schema, create nodes/edges, handle version migration. | 4h | None |
| 24 | draw.io / diagrams.net import | Parse `.drawio` XML. Map draw.io shapes to Architex node types. Handle groups and nested containers. | 8h | Task 23 |
| 25 | Mermaid import | Parse Mermaid graph syntax (`graph TD`, `flowchart LR`). Map to nodes/edges. Handle subgraphs. | 8h | Task 23 |
| 26 | Clipboard paste | `Ctrl+V` handler. Detect content type (JSON, Mermaid, URL). Parse accordingly. | 4h | Task 23-25 |
| 27 | File drop zone | Drag-and-drop files onto canvas. Accept `.json`, `.drawio`, `.md` (Mermaid). Show drop overlay. | 4h | Task 23-25 |
| 28 | URL import | Parse `?diagram=` URL parameter. Decompress from `lz-string` (already installed). | 4h | None |
| 29 | Template browser | UI panel with pre-built system design templates: URL Shortener, Chat System, News Feed, etc. Click to load. | 8h | Task 23 |

**Total: ~40 hours**

---

## Category 5: Diagram Versioning (6 tasks)

No version history exists. No way to track changes over time.

| # | Task | Description | Estimated Effort | Dependencies |
|---|------|-------------|-----------------|--------------|
| 30 | Define version event types | `NodeAdded`, `NodeRemoved`, `NodeMoved`, `EdgeAdded`, `EdgeRemoved`, `ConfigChanged`, `TemplateLoaded`. Append-only event log. | 4h | None |
| 31 | Snapshot system | Capture full canvas state at key moments (template load, manual save, auto-save). Store in IndexedDB. | 4h | Category 8, Task 30 |
| 32 | History panel | UI panel showing timeline of changes. Click to preview any snapshot. "Restore" button to revert. | 8h | Task 31 |
| 33 | Diff viewer | Visual diff between two snapshots. Highlight added (green), removed (red), moved (blue) nodes. | 8h | Task 31, 32 |
| 34 | Branching | Create named branches from any snapshot. Switch between branches. Merge branches (conflict resolution). | 12h | Task 31 |
| 35 | Export history | Export version history as JSON. Include all events and snapshots for audit trail. | 2h | Task 30, 31 |

**Total: ~38 hours**

---

## Category 6: Real-Time Collaboration (8 tasks)

No multi-user support. Single-user only.

| # | Task | Description | Estimated Effort | Dependencies |
|---|------|-------------|-----------------|--------------|
| 36 | Install Yjs + y-websocket | Add `yjs`, `y-websocket` (or `y-partykit`). CRDT-based sync. | 1h | None |
| 37 | Y.Doc schema for canvas | Define Yjs shared types: `Y.Map<nodes>`, `Y.Map<edges>`, `Y.Map<cursors>`. Map to Zustand stores. | 8h | Task 36 |
| 38 | PartyKit server | Deploy collaboration server. Handle room creation, connection management, awareness protocol. | 8h | Task 36 |
| 39 | Zustand-Yjs sync layer | Bidirectional sync between Zustand canvas-store and Yjs document. Handle conflict resolution. | 12h | Task 37 |
| 40 | Cursor presence | Show other users' cursors on canvas. Display name, color, current selection. | 4h | Task 38 |
| 41 | Selection awareness | Show which nodes other users have selected (colored border). Prevent edit conflicts on same node. | 4h | Task 40 |
| 42 | Room management UI | Create/join room dialog. Share link. Show connected users list. | 4h | Task 38 |
| 43 | Offline support | Queue local changes when disconnected. Sync when reconnected. Show "Offline" indicator. | 8h | Task 39 |

**Total: ~49 hours**

---

## Category 7: Billing & Monetization (6 tasks)

No payment infrastructure. No usage limits.

| # | Task | Description | Estimated Effort | Dependencies |
|---|------|-------------|-----------------|--------------|
| 44 | Stripe integration | Install `stripe` and `@stripe/stripe-js`. Configure products: Free, Pro ($12/mo), Team ($25/user/mo). | 4h | Auth system |
| 45 | Checkout flow | Pricing page component. "Upgrade" button -> Stripe Checkout. Handle success/cancel redirects. | 8h | Task 44 |
| 46 | Webhook handler | `/api/webhooks/stripe` -- Handle `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted`. Update user tier in DB. | 8h | Task 44 |
| 47 | Usage limits enforcement | Free tier: 3 diagrams, 50 nodes/diagram, no export. Pro: unlimited diagrams, 500 nodes, all exports. Check limits in command bus. | 4h | Task 46 |
| 48 | Customer portal | Link to Stripe Customer Portal for subscription management, invoice history, payment method updates. | 2h | Task 44 |
| 49 | Usage tracking | Track: diagrams created, nodes placed, simulations run, exports generated. Show in dashboard. Report to Stripe for metered billing. | 4h | Task 47 |

**Total: ~30 hours**

---

## Category 8: IndexedDB Persistence (6 tasks)

Dexie and dexie-react-hooks are installed but completely unused.

| # | Task | Description | Estimated Effort | Dependencies |
|---|------|-------------|-----------------|--------------|
| 50 | Dexie schema definition | `src/lib/db/schema.ts` -- Define tables: `projects` (id, name, nodes, edges, metadata, updatedAt), `snapshots` (id, projectId, data, createdAt), `settings` (key, value). | 2h | None |
| 51 | Database initialization | `src/lib/db/index.ts` -- Create Dexie instance. Version migration strategy. Export singleton `db`. | 2h | Task 50 |
| 52 | Repository pattern | `src/lib/db/repos/` -- `ProjectRepository` with `save()`, `load()`, `list()`, `delete()`. `SettingsRepository` for user prefs. | 4h | Task 51 |
| 53 | Auto-save middleware | Zustand middleware that writes to IndexedDB on state change. Debounced (5s). Only saves when dirty flag is true. | 4h | Task 52 |
| 54 | Hydration on load | On app mount, load last active project from IndexedDB. Hydrate canvas-store, ui-store, viewport-store. Show "Loaded project" toast. | 4h | Task 53 |
| 55 | Project management UI | Project switcher in status bar. "New Project", "Open Project", "Save As", "Delete Project" dialogs. | 8h | Task 52 |

**Total: ~24 hours**

---

## Category 9: PWA (Progressive Web App) (7 tasks)

No PWA support. App requires network connection.

| # | Task | Description | Estimated Effort | Dependencies |
|---|------|-------------|-----------------|--------------|
| 56 | `manifest.json` | Create web app manifest: name, icons (192px, 512px), theme_color, background_color, display: "standalone", start_url. | 2h | None |
| 57 | App icons | Design and generate PWA icons at all required sizes. Include maskable icon variant. | 2h | None |
| 58 | Service worker (basic) | Next.js App Router compatible service worker. Cache app shell (HTML, CSS, JS) with stale-while-revalidate. | 4h | Task 56 |
| 59 | Offline detection | `navigator.onLine` listener. Show "You're offline" banner. Queue actions for sync. | 2h | Task 58 |
| 60 | Cache WASM modules | Service worker caches `.wasm` files for offline simulation support. | 2h | Task 58, Category 1 |
| 61 | Install prompt | Detect `beforeinstallprompt` event. Show "Install Architex" banner with benefits: "Work offline, faster loading". | 2h | Task 56 |
| 62 | Background sync | Use Background Sync API to push queued changes when connection returns. Register sync events. | 4h | Task 58, 59 |

**Total: ~18 hours**

---

## Category 10: Security Headers (5 tasks)

No security headers configured.

| # | Task | Description | Estimated Effort | Dependencies |
|---|------|-------------|-----------------|--------------|
| 63 | Content Security Policy | `next.config.js` headers: `default-src 'self'`, `script-src 'self' 'wasm-unsafe-eval'`, `style-src 'self' 'unsafe-inline'` (for Tailwind), `img-src 'self' data: blob:`, `connect-src 'self' ws:` (for collab). | 4h | None |
| 64 | CORS configuration | API routes: `Access-Control-Allow-Origin` restricted to app domain. Preflight handling. No `*` in production. | 2h | None |
| 65 | Rate limiting | API routes: 100 req/min for free tier, 1000 req/min for pro. Use sliding window algorithm. Redis or in-memory. | 4h | None |
| 66 | Security headers bundle | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=()`, `Strict-Transport-Security: max-age=31536000`. | 2h | None |
| 67 | Input sanitization | Sanitize all user inputs (node labels, config values) before rendering. Prevent XSS via config fields that render raw HTML. | 4h | None |

**Total: ~16 hours**

---

## Category 11: Monitoring & Analytics (6 tasks)

No error tracking, analytics, or performance monitoring.

| # | Task | Description | Estimated Effort | Dependencies |
|---|------|-------------|-----------------|--------------|
| 68 | Sentry integration | Install `@sentry/nextjs`. Configure DSN. Source maps upload. Error boundaries auto-report. | 4h | None |
| 69 | Sentry performance | Enable Sentry Performance monitoring. Custom spans for: simulation step, algorithm run, canvas render, WASM call. | 2h | Task 68 |
| 70 | PostHog analytics | Install `posthog-js`. Track events: module_switch, node_added, simulation_started, challenge_started, export_triggered. | 4h | None |
| 71 | Feature flags | PostHog feature flags for: wasm_enabled, collaboration_beta, new_modules. Gradual rollout. | 2h | Task 70 |
| 72 | Web Vitals reporting | Use `next/web-vitals` to track LCP, FID, CLS, TTFB. Report to analytics dashboard. Set budgets: LCP < 2.5s, CLS < 0.1. | 2h | None |
| 73 | Custom dashboard | Admin page: active users, popular modules, simulation count, error rate, P95 latency. Pull from PostHog API. | 8h | Task 70 |

**Total: ~22 hours**

---

## Grand Total Effort Estimate

| Category | Tasks | Hours |
|----------|-------|-------|
| 1. WASM/Rust Engine | 11 | 42h |
| 2. Web Workers | 6 | 24h |
| 3. Auto-Layout | 5 | 15h |
| 4. Import System | 7 | 40h |
| 5. Diagram Versioning | 6 | 38h |
| 6. Collaboration | 8 | 49h |
| 7. Billing | 6 | 30h |
| 8. IndexedDB Persistence | 6 | 24h |
| 9. PWA | 7 | 18h |
| 10. Security Headers | 5 | 16h |
| 11. Monitoring | 6 | 22h |
| **Total** | **73** | **318h** |

---

## Dependency Graph

```
Phase 1 (Foundation):
  Cat 8 (IndexedDB) ──> Cat 5 (Versioning)
  Cat 10 (Security) ──> Cat 7 (Billing)
  Cat 11 (Monitoring)
  Cat 3 (Auto-Layout)

Phase 2 (Core Features):
  Cat 1 (WASM) ──> Cat 2 (Workers)
  Cat 4 (Import)

Phase 3 (Advanced):
  Cat 6 (Collaboration) -- depends on Cat 8
  Cat 9 (PWA) -- depends on Cat 1, Cat 8
  Cat 7 (Billing) -- depends on Auth (not yet built)

Phase 4 (Scale):
  Cat 5 (Versioning) -- depends on Cat 8
```

## Recommended Build Order

1. **Cat 8: IndexedDB** -- Unblock persistence, user data survives refresh
2. **Cat 10: Security Headers** -- Low effort, high impact for production
3. **Cat 11: Monitoring** -- See errors before users report them
4. **Cat 3: Auto-Layout** -- High user value, medium effort
5. **Cat 4: Import System** -- User acquisition (import existing diagrams)
6. **Cat 1: WASM Engine** -- Core differentiator
7. **Cat 2: Web Workers** -- Required for WASM, benefits algorithms
8. **Cat 5: Diagram Versioning** -- Requires IndexedDB
9. **Cat 9: PWA** -- Offline support
10. **Cat 6: Collaboration** -- Requires IndexedDB + auth
11. **Cat 7: Billing** -- Last, requires auth + usage tracking
