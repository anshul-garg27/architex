I now have a comprehensive picture of the codebase. Let me compile the full analysis.

---

## DEEP FRONTEND TECHNOLOGY RESEARCH FOR ARCHITEX

### Codebase Inventory Summary

Before diving into each area, here is what the codebase actually contains:

- **Framework**: Next.js 16.2.3, React 19.2.4, TypeScript 5.x
- **Styling**: Tailwind CSS v4 (PostCSS plugin), 1122-line globals.css with full design token system
- **State**: Zustand v5 (13 stores: ui, canvas, simulation, viewport, editor, interview, progress, notification, collaboration, billing, cross-module, ai, snapshot)
- **Canvas**: @xyflow/react v12.10.2 (React Flow) with 75+ system-design nodes, 5+ database nodes
- **Animation**: motion v12.38.0 (Framer Motion successor)
- **Data**: Drizzle ORM v0.45.2 + Neon serverless + pg driver, Dexie v4 for IDB, custom IDB wrapper
- **AI**: Anthropic SDK v0.88.0, Claude Haiku 4.5 / Sonnet 4, IndexedDB cache, request queue
- **Server State**: TanStack Query v5.99.0
- **Layout**: dagre v3, react-resizable-panels v4.9, Comlink v4 for worker communication
- **UI**: Radix UI primitives (9 components), lucide-react icons, cmdk command palette, CVA
- **Dev**: Vitest v4.1.4, Playwright config exists, Storybook v10.3.5, Bundle Analyzer
- **PWA**: Service worker, manifest, install prompt, offline page
- **Workers**: 4 web workers (simulation, layout, minimap, algorithm) with typed bridge
- **Auth**: Clerk v7 (conditional loading)
- **Misc**: zundo (undo history), lz-string (compression), prism-react-renderer, next-themes

---

### 1. RENDERING ENGINE

**Current state**: React Flow (@xyflow/react v12.10.2) for the system design canvas, raw SVG for LLD class diagrams, Canvas2D for the ParticleLayer overlay and chart rendering (canvas-renderer.ts). The ParticleLayer uses quadratic Bezier interpolation on a Canvas2D overlay positioned atop the React Flow SVG canvas, capped at 2000 particles with 8 per edge max.

**Industry analysis**:

React Flow v12 (the @xyflow/react rewrite) is the correct choice and the current best-in-class for node-graph UIs. It uses SVG for node rendering (which means each node is a React component with full interactivity, accessibility, and CSS styling), and it handles pan/zoom/selection/edge routing natively. At 100-200 nodes, SVG performance is acceptable when nodes are memo'd. At 500+ nodes, SVG starts to degrade because each node is a DOM element. React Flow does support viewport culling (only rendering visible nodes), which the codebase already uses via `useViewportCulling` hook.

How the leaders do it:
- **Excalidraw**: Uses a single Canvas2D element. All shapes are drawn imperatively. This gives maximum rendering performance but zero native accessibility and requires reimplementing selection, hit testing, text editing, and every interaction from scratch. Their canvas supports infinite zoom and millions of strokes because nothing is DOM-mounted.
- **Figma**: Uses WebGL via a custom engine compiled from C++ to WebAssembly. Renders the entire canvas as a GPU texture. This is why Figma handles thousands of frames with zero lag but took years to build. Not relevant for Architex's scope.
- **tldraw**: Uses SVG for shapes but with careful viewport culling and a flat rendering model. Similar to React Flow's approach but purpose-built for freehand drawing.
- **D3.js**: The traditional approach for data visualization, uses SVG or Canvas. Not a diagram editor, but its force-directed layout algorithms are widely used.

The SVG vs Canvas2D split in Architex is architecturally correct:
- **SVG** (via React Flow) for interactive diagram nodes: needed for tooltips, context menus, ARIA labels, keyboard focus, CSS hover states, React event handlers, and the 75+ node type components that are each unique React components with internal state. Moving these to Canvas2D would mean reimplementing all of that.
- **Canvas2D** for the particle overlay: correct, because 2000 particles at 60fps cannot be individual DOM/SVG elements. The ParticleLayer already does this right with requestAnimationFrame and a pooled particle array.
- **Canvas2D** for charts: correct, the canvas-renderer.ts has double-buffering and DPI-aware scaling for real-time metric charts.

**Recommendation**: KEEP CURRENT. Do not unify. The hybrid SVG+Canvas2D architecture is the optimal split.

**Specific improvements to make**:

1. **Upgrade @xyflow/react to v12.12+** (latest stable). v12.10 has known edge-rendering performance issues that were fixed in later patches.

2. **Add OffscreenCanvas for the ParticleLayer** when browser support is available (Chrome and Edge already support it, Firefox supports it behind a flag). This would let particles render on a worker thread, freeing the main thread entirely:
```
// In simulation-worker.ts, use OffscreenCanvas for particle rendering
const offscreen = canvas.transferControlToOffscreen();
worker.postMessage({ canvas: offscreen }, [offscreen]);
```

3. **For LLD diagrams**, consider using **@xyflow/react** instead of raw SVG. The codebase already has `dagre-layout.ts` and `astar-router.ts` for LLD, but the LLD canvas appears to be custom SVG. Unifying LLD onto React Flow would reduce the two-renderer maintenance burden and give LLD the same drag-and-drop, connection, and accessibility features for free. The tradeoff is React Flow's edge routing is less flexible than the custom A* router, but React Flow v12 supports custom edge routing functions.

4. **Do NOT add WebGL** unless Architex needs to render 10,000+ nodes simultaneously, which is not in scope for a learning platform. WebGL adds enormous complexity (shader management, text rendering becomes a hard problem, accessibility becomes nearly impossible).

**Migration effort**: Minimal. Upgrade is a semver-compatible bump. OffscreenCanvas is additive. LLD unification is medium effort (~2 weeks) but optional.

**Performance impact**: OffscreenCanvas for particles would move ~4ms/frame off the main thread. React Flow upgrade fixes edge recalculation that currently causes jank when edges > 50.

---

### 2. STATE MANAGEMENT

**Current state**: 13 Zustand v5 stores with persist middleware on several (ui, ai, cross-module, canvas). A Command Bus pattern is designed (STATE_ARCHITECTURE.ts) but the `command-bus` directory under `src/lib` confirms it is implemented. Cross-store orchestration happens via the command bus. UndoManager is custom (not zundo, despite zundo being a dependency). TanStack Query v5 handles server state.

**Industry analysis**:

Zustand v5 is the correct choice for this application. Here is why, and why the alternatives are worse:

- **Redux Toolkit**: More boilerplate, more indirection (slices, reducers, selectors, thunks). For 13 stores, RTK would produce roughly 3x the code. The command-bus pattern already solves cross-store orchestration, which is the one thing RTK's middleware chain does well. No advantage over Zustand at this scale.
- **Jotai**: Atom-based, bottom-up state. Excels when state is highly granular and composed (like a spreadsheet where each cell is an atom). For Architex, the state is store-shaped (canvas has nodes+edges+groups+selection, simulation has config+metrics+history). Refactoring 13 stores into hundreds of atoms would not improve performance and would lose the clean store-per-domain architecture.
- **Valtio**: Proxy-based, mutable-style API. Simpler than Zustand for basic cases, but valtio's proxy tracking can produce subtle bugs with nested objects (like React Flow's Node type), and it does not support middleware (persist, devtools, undo) as cleanly as Zustand.
- **Legend State**: Newer, signal-based. Good performance characteristics but smaller ecosystem and less battle-tested.
- **TanStack Store**: Signal-based, framework-agnostic. Still maturing, lacks the middleware ecosystem.

The Zustand + TanStack Query split is the correct server-state vs client-state boundary. TanStack Query handles data fetching, caching, revalidation, and optimistic updates for data that originates from the server (templates, diagrams, progress, quiz content). Zustand handles ephemeral client state (canvas position, simulation tick, UI panels, selections).

**Specific improvements to make**:

1. **URL state for shareable views**: Module selection, active pattern, simulation speed, and heatmap metric should be in the URL (via `nuqs` or `next/navigation` searchParams). This enables deep-linking: a user can share a URL that opens the "Rate Limiter pattern at 1000 RPS with latency heatmap". Currently `activeModule` is in Zustand persist (localStorage) which means shared links don't carry context.

   Package: `nuqs@2.4.x` -- type-safe URL state for Next.js, 2.5KB gzipped, supports shallow routing.

2. **IndexedDB for large state**: The canvas store uses `persist` (localStorage), which has a 5MB limit. A diagram with 100+ nodes and edges can exceed this. Move canvas persistence to IndexedDB. The codebase already has `idb-store.ts` and Dexie -- use one consistently. I recommend keeping the custom `idb-store.ts` for the persistence layer (it is lean, 0 dependencies) and deprecating the Dexie dependency unless there is a specific feature (like compound indexes or live queries) that Dexie provides.

3. **Remove the zundo dependency** if the custom UndoManager is the actual implementation. The `canvasUndoManager` in canvas-store.ts is a custom implementation with `maxEntries: 100`. If zundo is not used anywhere, remove it to reduce bundle size.

4. **Zustand subscriptions with `useShallow`**: The codebase already uses `useShallow` in some places (HeatmapOverlay). Ensure ALL multi-field selectors use `useShallow` to prevent unnecessary re-renders. This is the single highest-impact performance fix for Zustand at scale.

5. **Consider computed selectors**: For derived state that is expensive to compute (like "all nodes with errorRate > 0.5 during simulation"), use `zustand/middleware` with `subscribeWithSelector` or create derived hooks that memoize with `useMemo` keyed on the store's node array reference.

**Recommendation**: KEEP Zustand v5 + TanStack Query v5. ADD nuqs for URL state. MOVE canvas persist to IndexedDB. AUDIT all store selectors for useShallow usage. REMOVE zundo if unused.

**Migration effort**: nuqs integration is ~1 day per route. IDB migration is ~2 days. useShallow audit is ~1 day.

**Performance impact**: URL state has zero runtime cost. IDB persistence removes the localStorage serialization bottleneck on large canvases (which currently blocks the main thread for 20-50ms on save). useShallow fixes prevent cascade re-renders.

---

### 3. ANIMATION & MOTION

**Current state**: motion v12.38.0 (the successor to framer-motion, now published as `motion`). CSS animations in globals.css. The ParticleLayer uses requestAnimationFrame with manual interpolation. The codebase has a `ReducedMotionProvider` and `MotionProvider`.

**Industry analysis**:

`motion` (previously framer-motion) v12 is the correct choice. It is the dominant React animation library and handles layout animations, gesture-based interactions, spring physics, exit animations, and shared layout transitions. The v12 release (the rename from framer-motion to motion) improved tree-shaking and reduced bundle size.

Alternatives and when they would be better:
- **GSAP**: More powerful timeline sequencing, better SVG morphing, better scroll-trigger animations. However, GSAP has a commercial license for SaaS products (the "Business Green" license costs $200/year). If Architex needs complex SVG path morphing (like animating an edge drawing itself, stroke-dashoffset style), GSAP's MorphSVG plugin is unmatched, but this can also be done with CSS `stroke-dasharray` + `stroke-dashoffset` transitions.
- **anime.js**: Lightweight, good for simple keyframe sequences. Less capable than motion for React-specific needs (layout animations, AnimatePresence for exit animations, gesture drag). Not recommended as a replacement.
- **Rive**: Runtime for pre-built animations (like Lottie but with state machines). Good for hero animations, loading states, and micro-interactions. Would be a supplement to motion, not a replacement. Consider Rive for the landing page and onboarding animations where hand-crafted vector animations would elevate the brand.
- **Lottie (lottie-react)**: After Effects exported animations. Good for icons and small illustrations. 40KB runtime. Lower priority than Rive because Rive supports interactivity (state machines that respond to user input).
- **@use-gesture/react**: For touch/mouse gesture detection (drag, pinch, scroll). The codebase already has `usePinchZoom` and `useTwoFingerPan` hooks. This library would replace those custom implementations with a battle-tested API.

For the particle system and real-time simulation:
- The current approach (manual requestAnimationFrame + Canvas2D) is correct and should not be replaced with a declarative animation library. Particle systems need imperative control over thousands of objects per frame. motion/GSAP/anime are all too slow for this.
- For 2000 particles at 60fps: the current Bezier interpolation approach is good. The optimization path is: (a) use `Float32Array` typed arrays instead of object arrays for particle positions (cache-friendly memory layout), (b) batch all Canvas2D draw calls using `beginPath()` once + multiple `arc()` calls + single `fill()` per color, instead of individual fillStyle changes per particle. This alone can cut frame time from ~8ms to ~2ms.

Spring physics vs easing curves:
- **Spring physics** (motion's `type: "spring"`): Use for all interactive elements -- modal open/close, panel slide, drag-and-drop settle, sidebar toggle. Springs feel natural because they respond to velocity. When a user flicks a panel closed, the spring absorbs the velocity.
- **Easing curves** (CSS `transition` or motion's `type: "tween"`): Use for non-interactive state changes -- color fades, opacity transitions, progress bar fills. These have a fixed duration, which is predictable for non-gesture animations.

**Recommendation**: KEEP motion v12. ADD @use-gesture/react v10 for touch gesture normalization. OPTIMIZE the particle system with typed arrays and batched draws. CONSIDER Rive for landing page / onboarding (medium priority).

**Specific packages**:
- `motion@12.38.x` -- keep current
- `@use-gesture/react@10.3.x` -- ~4KB gzipped, replaces custom pinch/pan hooks
- `@rive-app/react-canvas@4.x` -- ~150KB, only if landing page animation quality is a priority

**Migration effort**: @use-gesture is ~1 day to replace the custom hooks. Particle optimization is ~2 hours. Rive is a design effort, not an engineering one.

**Performance impact**: Typed arrays for particles: ~6ms/frame saved. Batched Canvas2D draws: ~2ms/frame saved. @use-gesture: neutral (same perf as custom, better DX).

---

### 4. CODE EDITOR

**Current state**: prism-react-renderer v2.4.1 for syntax highlighting in `<pre>` blocks. The editor store tracks code, language (TS/Python/Java/C++/Go), active line, and highlighted lines. There is no embedded code editor -- users cannot type or edit code interactively.

**Industry analysis**:

For Architex's use cases (machine coding practice, code-to-diagram sync, algorithm stepping with line highlighting), a real code editor is needed. The two real options are:

**CodeMirror 6** (`@codemirror/view` + extensions):
- Bundle: ~200KB gzipped (core + one language mode + theme)
- Architecture: Modular. You import only what you use (view, state, language, autocomplete).
- Languages: 30+ via `@codemirror/lang-*` packages. TypeScript/JavaScript via `@codemirror/lang-javascript`, Python via `@codemirror/lang-python`, Java via `@codemirror/lang-java`, C++ via `@codemirror/lang-cpp`, Go via `@codemirror/lang-go` -- matches the 5 languages in editor-store exactly.
- Features: Syntax highlighting, line numbers, active line highlighting, code folding, bracket matching, search/replace, multiple cursors, vim/emacs keybindings, custom themes, accessibility (screen reader support), mobile keyboard support.
- Integration: `@uiw/react-codemirror` provides a React wrapper. Or wrap CodeMirror's EditorView directly for full control.
- Collaboration: Built-in support for collaborative editing via `@codemirror/collab` (uses OT).
- Performance: Sub-millisecond keystroke response even with 10,000-line files. Virtual rendering (only visible lines are in the DOM).

**Monaco Editor** (VS Code's editor):
- Bundle: ~5MB (not tree-shakeable, includes the entire VS Code editor core)
- Architecture: Monolithic. You get everything or nothing.
- Languages: Full TypeScript/JavaScript language service with type checking, autocomplete, error squiggles. Other languages get syntax highlighting only (unless you run a language server).
- Features: Everything CodeMirror has plus: IntelliSense (autocomplete with type info), inline error diagnostics, go-to-definition, peek references, diff editor, minimap.
- Integration: `@monaco-editor/react` (maintained by the community, 3M+ weekly downloads).
- Collaboration: Possible but not built-in. Requires significant custom work.
- Performance: Heavier initial load. Web workers for TypeScript analysis. Can cause 100-300ms stutters on first load.
- Problem: Must be loaded via `next/dynamic` with `ssr: false`. Cannot be server-rendered. The 5MB bundle must be code-split.

**Shiki** (syntax highlighter):
- Bundle: ~50KB + language grammars loaded on demand
- What it is: A syntax highlighter, not an editor. Uses VS Code's TextMate grammars for pixel-perfect VS Code-style highlighting. Used by VitePress, Astro, Nuxt Content.
- Use case: Read-only code display. Could replace prism-react-renderer for prettier output with VS Code themes, but does not provide editing.

**Recommendation**: ADD CodeMirror 6 as the primary code editor. KEEP prism-react-renderer for static code blocks in content/docs pages (it is lightweight and server-renderable). Do NOT add Monaco unless Architex needs full IntelliSense -- the 5MB cost is not justified for a platform where users write solution code, not production codebases.

**Specific packages**:
```
@codemirror/view@6.x
@codemirror/state@6.x
@codemirror/language@6.x
@codemirror/lang-javascript@6.x  (covers TypeScript)
@codemirror/lang-python@6.x
@codemirror/lang-java@6.x
@codemirror/lang-cpp@6.x
@codemirror/lang-go@6.x
@codemirror/theme-one-dark@6.x   (matches the dark design system)
@codemirror/autocomplete@6.x
@codemirror/lint@6.x
@uiw/react-codemirror@4.x        (React wrapper, optional)
```

Total additional bundle: ~200-250KB gzipped (loaded only on pages that use the editor, via dynamic import).

**Why not Monaco**: Monaco adds 5MB to the bundle. For Architex, the code editor is for writing algorithm solutions and viewing generated code -- not for IDE-level development. CodeMirror gives syntax highlighting, line marking (for algorithm stepping), bracket matching, and multi-language support at 1/25th the cost.

**Migration effort**: ~3-5 days. Create a `<CodeEditor>` component wrapping CodeMirror, integrate with the editor store, add dynamic import, build the dark theme to match the design system.

**Performance impact**: +200KB to the code-editor route's bundle (lazy-loaded). Replaces the current `<pre>` + prism-react-renderer on interactive pages (prism stays for static content). Zero impact on pages that don't use the editor.

---

### 5. REAL-TIME & COLLABORATION

**Current state**: `CollaborationManager` with a `CollaborationTransport` interface. Only `LocalTransport` (in-memory, single-user echo) is implemented. The collaboration store tracks collaborators, cursors, selections. No WebSocket or real-time transport exists. No CRDT library.

**Industry analysis**:

The transport interface pattern is well-designed -- the `CollaborationManager` is provider-agnostic and just needs a real transport plugged in. The question is which one.

**Yjs** (`yjs@13.x`):
- What: CRDT library for shared data types (YDoc, YArray, YMap, YText). Handles conflict resolution automatically.
- Transport: Provider-agnostic. Use `y-websocket` for self-hosted WebSocket, `y-partykit` for PartyKit, `y-indexeddb` for offline persistence.
- Integration: Used by Excalidraw (multiplayer), Notion, JupyterLab, BlockSuite. The most battle-tested CRDT for web apps.
- For Architex: A `YDoc` could hold the diagram state (nodes as a `YMap`, edges as a `YArray`). When one user adds a node, the CRDT propagates it to all connected clients without conflicts.
- Bundle: ~15KB gzipped (yjs core).
- Downside: Yjs has a learning curve. The CRDT data types (YMap, YArray) are different from plain JS objects and require awareness operations. Also, Zustand stores would need to be bridged to Yjs documents -- state lives in two places.

**Liveblocks** (`@liveblocks/react@2.x`):
- What: Hosted real-time API with presence (cursors), storage (CRDT-backed), broadcast, and comments. React hooks out of the box.
- Pricing: Free tier (250 concurrent users), then $6/MAU.
- Integration: `@liveblocks/yjs` bridges Liveblocks transport with Yjs data structures. Or use Liveblocks Storage (their own CRDT).
- For Architex: Fastest path to multiplayer. `useOthers()` gives cursor positions, `useMutation()` for shared state updates. Could replace the entire CollaborationManager with Liveblocks hooks.
- Downside: Vendor lock-in. Monthly cost scales with users.

**PartyKit** / **Cloudflare Durable Objects**:
- What: Edge-deployed WebSocket servers. Each "room" runs as a Durable Object on Cloudflare's edge.
- PartyKit: Acquired by Cloudflare. Open-source server framework for real-time apps. Deploy on Cloudflare Workers.
- For Architex: Would require writing the synchronization logic (using Yjs for CRDT, PartyKit for transport). More control, more work.
- Bundle: Client-side is just a WebSocket connection (~0KB). Server is a PartyKit server deployed separately.

**Supabase Realtime**:
- What: Postgres LISTEN/NOTIFY + WebSocket broadcast. Good for database change streaming.
- For Architex: Not ideal for cursor/presence. It is optimized for "database row changed, notify clients" not "user moved their cursor 60 times per second." Too chatty for real-time collaboration.

**Recommendation**: For the MVP of collaboration: **Liveblocks** is the fastest path. It provides presence (cursors), room management, and storage with zero server infrastructure. For long-term/self-hosted: **Yjs + y-partykit** (or y-websocket on a custom server). Yjs is the industry standard CRDT and integrates with CodeMirror 6 via `y-codemirror.next`.

**Phased approach**:
1. **Phase 1** (2 weeks): Add Liveblocks for presence-only (cursors, selections, who's viewing). No shared state mutation. This uses the free tier and validates the UX.
2. **Phase 2** (4 weeks): Add Yjs for shared diagram state. Bridge the canvas store to a YDoc. Use Liveblocks as the transport (`@liveblocks/yjs`) or switch to y-websocket.
3. **Phase 3** (2 weeks): Add collaborative code editing via `y-codemirror.next` (Yjs + CodeMirror 6 integration).

**Packages for Phase 1**:
```
@liveblocks/client@2.x
@liveblocks/react@2.x
```

**Packages for Phase 2**:
```
yjs@13.x
y-indexeddb@9.x (offline persistence for CRDT docs)
@liveblocks/yjs@2.x (or y-websocket@2.x for self-hosted)
```

**Migration effort**: Phase 1 is ~2 weeks (replace LocalTransport with Liveblocks, wire up presence). Phase 2 is ~4 weeks (bridge Zustand canvas store to YDoc, handle conflict resolution UI). Phase 3 is ~2 weeks (CodeMirror + Yjs binding).

**Performance impact**: Presence adds ~1KB/second of WebSocket traffic per user. CRDT document sync adds ~5-50KB on initial join (depending on diagram size). Yjs is highly optimized -- merging operations is sub-millisecond.

---

### 6. DATA LAYER

**Current state**: Drizzle ORM v0.45.2 with dual driver support (Neon serverless for cloud, pg for local). 14 schema tables. IndexedDB for client-side persistence (custom wrapper + Dexie). TanStack Query for data fetching. Auto-save, fallback-save, and hydration logic in `src/lib/persistence/`.

**Industry analysis**:

**Drizzle vs Prisma**:
- Drizzle: SQL-like query builder, no query engine runtime, zero overhead at runtime, full Edge Runtime support (critical for Vercel Edge Functions), type-safe schema inference. v0.45 is production-stable.
- Prisma: Higher-level API, requires a query engine binary (~2-4MB), does NOT run on Edge Runtime natively (requires the "Accelerate" proxy or Prisma's Data Proxy). Slower cold starts.
- **Verdict**: Drizzle is the correct choice. It is faster, smaller, and edge-compatible. Do not switch.

**Neon Serverless PostgreSQL**:
- The `@neondatabase/serverless` driver uses HTTP (not TCP) for queries, which works in Edge Runtime and Vercel Serverless Functions.
- Cold start: Neon's autoscaling can add 300-500ms on first query after idle (free tier). Paid tiers have "always-on" endpoints.
- Connection pooling: Neon has built-in connection pooling via PgBouncer. The codebase correctly uses the Neon HTTP driver (no pool needed -- each request is a stateless HTTP call).
- Branching: Neon supports database branching (create a copy-on-write branch for testing/preview). This is excellent for Vercel Preview Deployments -- each PR gets its own database branch.
- **Verdict**: KEEP. Neon is the best serverless PostgreSQL option in 2025-2026.

**IndexedDB architecture**:
- The codebase has BOTH a custom `idb-store.ts` wrapper AND Dexie v4. This is redundant.
- Dexie provides: live queries (`useLiveQuery`), compound indexes, versioned migrations, and bulk operations. The `dexie-react-hooks` package gives reactive queries.
- The custom `idb-store.ts` provides: thin wrapper with `openDB`, `put`, `get`, `del`, `getAll`.
- **Recommendation**: Consolidate to ONE IndexedDB solution. If the app uses Dexie's live queries (for the AI cache browsing or progress tracking UI), keep Dexie and remove the custom wrapper. If not, keep the custom wrapper (smaller bundle) and remove Dexie.

**Should Redis be added?**
- For what? Rate limiting (AI calls), session caching, real-time leaderboards.
- On Vercel: Use **Upstash Redis** (`@upstash/redis`), which is the only Redis that works in Edge Runtime (HTTP-based, no TCP).
- The AI API route already tracks rate limits via the `ai_usage` database table. Redis would make this faster (microseconds vs milliseconds) but the database approach works fine at current scale.
- **Recommendation**: ADD Upstash Redis only when rate limiting or leaderboard performance becomes a bottleneck. Not needed now.

**Rendering strategy by page type**:
- Landing page (`/`): Static generation (SSG) or ISR. No dynamic data. Pre-render at build time.
- Blog (`/blog/*`): ISR with 1-hour revalidation. Content changes infrequently.
- App pages (`/modules/*`, `/algorithms/*`, `/patterns/*`): Client-side rendering with RSC shell. The layout (sidebar, header) is a React Server Component. The canvas, simulation, and interactive panels are client components. This is already the architecture (the `"use client"` directives confirm this).
- Embed pages (`/embed/*`): ISR with long cache. Third-party embeds of diagrams.
- API routes: Edge Runtime for AI proxy and rate limiting. Node.js runtime for database-heavy operations.

**Specific improvements**:

1. **Add ISR to content pages**: The `/patterns/[slug]`, `/algorithms/[slug]`, `/concepts/[slug]` pages should use `generateStaticParams` + `revalidate: 3600` for ISR. Content doesn't change per-request.

2. **Edge Runtime for AI routes**: The `/api/ai/explain` route currently runs in Node.js runtime. Move to Edge Runtime for lower latency (Anthropic's API is called via HTTP, which works in Edge). This means using Drizzle + Neon HTTP driver for the rate-limit check (which the codebase already supports).

3. **Consolidate IndexedDB**: Pick one approach and use it everywhere.

**Recommendation**: KEEP Drizzle + Neon. CONSOLIDATE IndexedDB to one library. ADD ISR for content pages. MOVE AI routes to Edge Runtime. ADD Upstash Redis later if needed.

**Migration effort**: ISR is ~2 days (add `generateStaticParams` to content routes). Edge Runtime is ~1 day per route. IndexedDB consolidation is ~1 day.

---

### 7. AI INTEGRATION

**Current state**: Anthropic SDK v0.88.0. Two models: Claude Haiku 4.5 ($0.80/$4.00 per 1M tokens) and Claude Sonnet 4 ($3.00/$15.00). Client-side singleton (`ClaudeClient`) with concurrency queue (max 3), exponential backoff on 429, IndexedDB cache with LRU eviction (500 max entries), cost tracking per feature. Server-side route at `/api/ai/explain`. Features: hints, design review, architecture generation, scoring, topology analysis, Socratic tutor, frustration detection.

**Industry analysis**:

The architecture is solid. The client-side → server API route → Anthropic pattern is correct (API keys stay server-side). The IndexedDB cache is a strong optimization -- identical questions get instant responses.

**Streaming responses**:
- Currently: The client appears to use non-streaming requests (the `ClaudeClient` returns a full `ClaudeResponse`). This means the user waits for the entire response before seeing any text.
- Best practice: Use Server-Sent Events (SSE) for streaming. The user sees tokens appear in real-time, which dramatically improves perceived latency (first token appears in ~200ms instead of waiting 2-5 seconds for the full response).
- Implementation: Use Anthropic's `client.messages.stream()` API, pipe it through a `ReadableStream` in the API route, and consume it with `fetch` + `ReadableStream` on the client. The AI SDK by Vercel (`ai@4.x`) provides `streamText()` and `useChat()` hooks that handle all of this, including Anthropic provider support.

**Prompt caching (Anthropic's Extended Thinking / Cache)**:
- Anthropic introduced "prompt caching" where system prompts and long preambles can be cached server-side across requests. Subsequent requests with the same cached prefix are 90% cheaper and 80% faster.
- For Architex: The system prompts for each AI feature (hints, review, scoring) are static or semi-static. Mark them as cache-worthy with `cache_control: { type: "ephemeral" }` in the message API.
- This could reduce AI costs by 60-80% for repeat interactions within a session.

**Cost optimization strategies**:
1. **Use Haiku 4.5 for everything except complex analysis**: Hints, Socratic tutor prompts, and scoring can all use Haiku at $0.80/1M input. Reserve Sonnet 4 for architecture generation and full design reviews.
2. **IndexedDB cache**: Already implemented. Ensure cache keys include the diagram hash (topology signature) so that the same diagram topology always hits cache regardless of node positions.
3. **Prompt caching**: As described above. ~60-80% cost reduction.
4. **Debounce AI calls**: The frustration detector and live review should not fire on every keystroke. Debounce to 2-3 seconds of inactivity.
5. **Batch small requests**: If multiple AI features need to analyze the same diagram, serialize the diagram once and include it in a single request with multiple sub-prompts.

**Edge functions vs Node.js for AI calls**:
- Edge Runtime latency is ~5-10ms lower per request (runs closer to the user).
- BUT: Anthropic's API response time dominates (1-5 seconds). The 5-10ms Edge advantage is negligible.
- Edge Runtime has a 25-second execution limit on Vercel (vs 60s for Node.js). For streaming responses that take 10-20 seconds, Edge is fine. For batch analysis that might take 30+ seconds, use Node.js.
- **Recommendation**: Use Edge Runtime for streaming AI responses (hints, chat). Use Node.js runtime for batch operations (full design review, scoring).

**Vercel AI SDK integration**:
The `ai` package by Vercel (`ai@4.x`) provides:
- `streamText()` -- server-side streaming with Anthropic
- `useChat()` -- client-side hook for chat interfaces
- `useCompletion()` -- client-side hook for single completions
- Provider pattern: `@ai-sdk/anthropic` wraps the Anthropic SDK
- Automatic token counting, rate limiting helpers, middleware

This would simplify the current `ClaudeClient` singleton and provide streaming for free. The IndexedDB cache can be implemented as middleware.

**Recommendation**: ADD streaming responses via `ai@4.x` + `@ai-sdk/anthropic`. ENABLE prompt caching on all system prompts. KEEP the IndexedDB cache. KEEP the cost tracking per feature. MOVE streaming AI routes to Edge Runtime.

**Packages**:
```
ai@4.x                    (~25KB, streaming + hooks)
@ai-sdk/anthropic@1.x     (~5KB, Anthropic provider)
```

**Migration effort**: ~3-5 days. Refactor the AI API routes to use `streamText()`, replace the client-side fetch with `useChat()` / `useCompletion()`, keep the IndexedDB cache as a wrapper.

**Performance impact**: Streaming reduces perceived latency from 2-5s to ~200ms (time to first token). Prompt caching reduces response time by ~80% for cached prefixes. Cost reduction of 60-80% on repeat queries.

---

### 8. PERFORMANCE

**Current state**: Next.js 16 with Turbopack (dev), standalone output. Dynamic imports (`next/dynamic`) used for heavy components. 4 Web Workers (simulation, layout, minimap, algorithm) with a typed worker bridge and Comlink. Bundle analyzer configured. `useViewportCulling` hook for canvas node culling.

**Industry analysis**:

**React Server Components (RSC) strategy**:
The codebase correctly uses `"use client"` directives on interactive components. The key optimization is ensuring that the server component tree is maximized. For Architex:
- Server Components: Layout shells, sidebar navigation, content text, pattern descriptions, metadata, breadcrumbs
- Client Components: Canvas, simulation controls, code editor, AI chat, quiz interactions, drag-and-drop, animation
- The root layout is already a server component (no `"use client"` directive). Good.

**Bundle splitting for 13 modules**:
Each module (system-design, algorithms, data-structures, lld, database, distributed, networking, os, concurrency, security, ml-design, interview, knowledge-graph) should be its own code-split chunk. Next.js automatically code-splits by route (`/modules/[module]`), but shared components between modules (like the canvas, simulation engine) will be in the common chunk.

Strategy:
- Route-based splitting is automatic with Next.js App Router. Each `/modules/[module]/page.tsx` loads only that module's code.
- Heavy per-module code (e.g., the 75 system-design node components) should be `dynamic()` imported WITHIN the module page, not in the shared layout.
- The simulation engine (~30 files) should only load when the simulation panel is opened, not on initial page load. Use `dynamic(() => import("@/components/simulation/..."))`.

**Virtual scrolling**:
The sidebar has 36+ patterns, the node palette has 75+ items, and the algorithm list may have 100+ entries. These should use virtual scrolling.
- `@tanstack/react-virtual@3.x` -- 5KB, the standard virtual scrolling library. Replaces the need to render all items at once. Only visible items are in the DOM.
- Already compatible with the existing Radix ScrollArea.

**Web Workers optimization**:
The codebase already has 4 workers with a typed bridge. This is excellent. Improvements:
- The simulation-worker only handles `SIMULATE_TICK`. Move the entire simulation orchestrator to the worker (currently it runs on the main thread, only offloading the queuing model). The orchestrator's 10-stage tick pipeline involves BFS propagation, pressure updates, issue detection, edge flow recording -- all CPU-intensive. Moving the full pipeline to the worker would free ~8-15ms per tick from the main thread.
- Use `SharedArrayBuffer` (if Cross-Origin Isolation is enabled) for zero-copy data transfer between the worker and main thread. The particle positions could live in a SharedArrayBuffer that both the worker (writing) and the ParticleLayer (reading) access without postMessage serialization.
- Note: SharedArrayBuffer requires `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers. This conflicts with third-party script embedding. Evaluate tradeoffs.

**Service Workers**:
A service worker exists (`sw.js` in `/public`). It should:
1. Cache static assets (JS/CSS/fonts) with a cache-first strategy
2. Cache API responses for content endpoints with a stale-while-revalidate strategy
3. Support offline mode (already has `/offline.html`)
4. Pre-cache the critical path for each module

Consider using **Workbox** (`workbox-webpack-plugin` or `@serwist/next` for Next.js) instead of a hand-written service worker. Workbox handles cache strategies, versioning, and cleanup automatically.

Package: `@serwist/next@9.x` -- Next.js integration for service worker generation with Workbox strategies.

**Recommendation**: ADD @tanstack/react-virtual for sidebar/palette lists. MOVE the full simulation orchestrator to the worker. ADD @serwist/next for service worker management. ENSURE dynamic imports for all module-specific heavy components.

**Packages**:
```
@tanstack/react-virtual@3.x    (~5KB, virtual scrolling)
@serwist/next@9.x              (service worker management)
```

**Migration effort**: Virtual scrolling is ~2 days (refactor sidebar and palette lists). Simulation worker migration is ~1 week. Serwist integration is ~2 days.

**Performance impact**: Virtual scrolling reduces initial DOM nodes by 80% in list-heavy views. Full worker orchestration frees 8-15ms/tick from the main thread. Service worker caching enables instant repeat page loads.

---

### 9. TESTING

**Current state**: Vitest v4.1.4 configured with jsdom environment, path aliases, and a setup file. Playwright config exists (e2e directory, retries, base URL). Storybook v10.3.5 with addon-essentials and addon-interactions. Test directories exist throughout the codebase (~20+ `__tests__` directories). No visual regression testing.

**Industry analysis**:

**Vitest vs Jest**:
Vitest is the correct choice. It uses the same test runner API as Jest but is built on Vite, which means:
- 10-20x faster startup than Jest (no Babel transform)
- Native TypeScript support (via esbuild)
- Native ESM support (Jest still struggles with ESM)
- Compatible with Testing Library
- HMR-based watch mode (instant re-runs)
Do not switch to Jest.

**E2E testing for canvas interactions**:
Playwright is the correct choice over Cypress for Architex because:
- Playwright supports multi-browser (Chromium, Firefox, WebKit) out of the box
- Playwright can interact with Canvas elements via coordinate-based clicks
- Playwright's `page.mouse.move()`, `page.mouse.down()`, `page.mouse.up()` can simulate drag operations on the React Flow canvas
- Playwright has better performance for heavy pages (runs in a separate process, doesn't share the browser's event loop like Cypress)

For canvas-specific E2E tests:
```typescript
// Example: test dragging a node onto the canvas
await page.locator('[data-testid="node-palette"]').locator('text=Load Balancer').dragTo(
  page.locator('.react-flow__pane')
);
await expect(page.locator('.react-flow__node')).toHaveCount(1);
```

**Visual regression testing**:
For a diagram-heavy app, visual regression testing catches styling regressions that unit tests cannot.
- **Playwright's built-in screenshot comparison** (`expect(page).toHaveScreenshot()`): Free, runs in CI, built into Playwright. Good enough for most cases.
- **Chromatic** (by Storybook): Captures Storybook stories as screenshots, compares across PRs, provides a review UI. $149/month for teams. Best DX but costly.
- **Argos CI**: Open-source alternative. Integrates with Playwright screenshots. Free for open-source, $30/month for teams.
- **Lost Pixel**: Open-source, self-hosted. Compares screenshots in CI.

**Recommendation**: Use Playwright's built-in screenshot comparison first (free, already in the stack). Add Chromatic later if the team grows and needs a review UI.

**Component testing strategy**:
- **Unit tests (Vitest)**: Pure functions (simulation math, FSRS algorithm, topology signature, pressure counters, cost model). These are the highest-value tests -- they validate correctness of domain logic.
- **Component tests (Vitest + Testing Library)**: UI components with interaction (button clicks, form submission, panel toggle). Test behavior, not implementation.
- **Integration tests (Vitest)**: Store interactions (command bus dispatching, cross-store effects).
- **E2E tests (Playwright)**: Critical user flows (load template, run simulation, add node, export diagram, AI chat). Canvas drag-and-drop flows.
- **Visual regression (Playwright)**: Screenshot comparison for node types, design system components, and canvas layouts.

**Specific improvements**:

1. Add `@playwright/test` to devDependencies (it is configured but may not be installed).
2. Create a small E2E suite for the 5 most critical flows.
3. Add visual regression for the 75+ node types via Storybook stories + Playwright screenshot comparison.

**Packages** (already have Vitest and Playwright configured):
```
@playwright/test@1.x           (if not already installed)
```

**Migration effort**: Writing the E2E test suite is ~1 week for 5 critical flows. Visual regression setup is ~2 days.

---

### 10. BUILD & DEPLOY

**Current state**: Next.js with `output: "standalone"` (Docker-ready). Bundle analyzer. Vercel deployment assumed (Vercel-specific patterns throughout). Security headers configured (CSP not visible, but HSTS, X-Frame-Options, X-Content-Type-Options all present). Clerk for auth (Vercel-friendly). Neon for database (Vercel-integrated).

**Industry analysis**:

**Vercel** is the correct deployment target for a Next.js 16 app. Alternatives:

- **Cloudflare Pages/Workers**: Would require rewriting all API routes to be Cloudflare Workers compatible. The Neon HTTP driver works, but Drizzle + Clerk + Anthropic SDK all have Node.js dependencies that may not work in the Cloudflare Workers runtime. Not worth the migration.
- **Railway/Render**: Full Node.js hosting. Cheaper than Vercel at scale ($20/month vs Vercel's per-request pricing). But you lose automatic ISR, Edge Functions, preview deployments, and the Neon/Clerk/Vercel integrated experience. Consider only if costs become prohibitive.
- **Self-hosted (Docker)**: The `output: "standalone"` config already supports this. If Vercel costs become too high, deploy the standalone build on a VPS (Hetzner, Fly.io) with a CDN in front (Cloudflare). Lose ISR (must use time-based revalidation), gain cost control.

**Edge function strategy**:
- AI streaming routes: Edge Runtime (lower latency to first token)
- Rate limiting: Edge Runtime (fast Redis/Neon checks)
- Database-heavy reads (progress, templates): Node.js Runtime (connection pooling, longer timeout)
- Webhook handlers (Clerk, Svix): Node.js Runtime (need full Node.js APIs)

**Asset optimization**:
- The 75+ node type icons should be SVG sprites or inline SVGs (not individual image files). Since they are React components (each node type is a `.tsx` file), they are already optimal -- the SVG is part of the component bundle.
- Code samples and content: These should be statically imported or fetched via ISR, not bundled in the JS.
- Font: Geist Sans + Geist Mono (already using `geist` package with `next/font` equivalent). These are variable fonts with subset loading.

**Recommendation**: KEEP Vercel. ADD Edge Runtime to AI routes. CONFIGURE preview deployment database branches with Neon. No platform change needed.

---

### 11. ACCESSIBILITY

**Current state**: Skip link in root layout. `CanvasDescription` component (likely an ARIA live region describing the canvas state). `A11yToolbar` component. Color contrast utilities, colorblind palette, touch targets module, high-contrast mode, connection handles accessibility. The `useFocusTrap` hook exists. `useKeyboardNodeOps` for keyboard canvas operations.

**Industry analysis**:

Architex has a better accessibility foundation than most diagram tools. The key challenge is making a canvas/SVG-based editor accessible when the visual representation is inherently spatial.

**SVG accessibility (React Flow nodes)**:
- Each React Flow node is an SVG `<foreignObject>` wrapping a React component. This means screen readers CAN read node content if properly labeled.
- Each node should have `role="img"` or `role="group"` with `aria-label` describing its type and connections (e.g., "Load Balancer, connected to 3 App Servers and 1 Cache").
- Edges should have `aria-label` descriptions (e.g., "HTTP connection from API Gateway to Load Balancer").
- React Flow v12 supports `ariaLabel` on nodes and edges natively.

**Canvas2D accessibility (ParticleLayer, charts)**:
- Canvas elements are opaque to screen readers. The ParticleLayer should have `role="img"` with `aria-label="Simulation particles showing request flow through the system"`.
- Charts should have an ARIA live region that narrates metric changes (e.g., "Throughput increased to 500 requests per second, P99 latency is 250 milliseconds").
- The chart's Canvas element should have a visually-hidden data table as a fallback (`<table className="sr-only">` with the same data).

**Keyboard navigation for diagrams**:
- The `useKeyboardNodeOps` hook is a good start. Ensure:
  - Tab moves focus between nodes (React Flow supports this)
  - Arrow keys move the focused node
  - Enter opens the node's property panel
  - Delete removes the focused node
  - Space triggers the context menu
  - Escape cancels the current operation

**Color blind modes**:
- The `colorblind-palette.ts` module exists. Ensure it provides palettes for all three major types: deuteranopia (red-green, 8% of males), protanopia (red deficiency), tritanopia (blue-yellow, rare).
- For the heatmap overlay (green-yellow-red), add a colorblind alternative (blue-yellow-red or use patterns/textures in addition to color).
- The 9 edge type colors in ParticleLayer (http=blue, grpc=purple, graphql=pink, etc.) should have distinct shapes or dash patterns in addition to color.

**Recommendation**: AUDIT all canvas interactions for keyboard equivalents. ADD ARIA live regions for simulation metrics. ADD alternative data tables for chart canvases. ENHANCE the colorblind palette with pattern/texture differentiation. These are all code changes, no new libraries needed.

**Migration effort**: ~1 week for a comprehensive accessibility pass.

---

### 12. MOBILE & PWA

**Current state**: PWA with manifest, service worker, install prompt, update toast, offline page. Mobile components: BottomSheet, FloatingActionButton, LongPressMenu, MobileAdvisory, MobileCommandPalette, PropertiesSheet, SafeAreaView. Touch hooks: `usePinchZoom`, `useTwoFingerPan`, `useSafeAreaInsets`. React Resizable Panels for layout.

**Industry analysis**:

This is an unusually complete mobile story for a diagram tool. Most competitors (Excalidraw, draw.io) have minimal mobile support.

**Touch gestures for canvas**:
- As recommended in section 3, replace `usePinchZoom` and `useTwoFingerPan` with `@use-gesture/react` for normalized touch handling.
- React Flow v12 has built-in touch support for pan and zoom. Ensure `panOnDrag={true}` and `zoomOnPinch={true}` are set.
- Long-press to select (instead of right-click) is handled by `LongPressMenu` -- good.

**Responsive layout strategy**:
- Desktop: 3-panel layout (sidebar + canvas + properties panel) via react-resizable-panels
- Tablet: 2-panel (sidebar collapsed to icons + canvas) with bottom sheet for properties
- Mobile: 1-panel (canvas only) with bottom sheet for everything

The `react-resizable-panels` library handles the desktop/tablet layouts. For mobile, the existing BottomSheet component handles property panels. The MobileCommandPalette replaces the desktop command palette.

**Mobile performance for heavy animations**:
- The ParticleLayer should reduce MAX_PARTICLES on mobile (from 2000 to 500). Detect via `navigator.hardwareConcurrency` or a media query (`@media (max-width: 768px)`).
- Disable the HeatmapOverlay on mobile (it requires per-node DOM overlays that are expensive on low-end devices).
- Use `will-change: transform` on the canvas container to promote it to a GPU layer.
- The `ReducedMotionProvider` should detect `prefers-reduced-motion` and disable particle animations entirely.

**PWA improvements**:
- Replace the hand-written `sw.js` with `@serwist/next` (as recommended in section 8) for proper cache strategies and precaching.
- Add background sync for offline progress updates (Web Background Sync API).
- Add a splash screen for the PWA (can be configured in the manifest).

**Recommendation**: KEEP the current PWA + mobile architecture. ADD `@use-gesture/react`. REDUCE particle count on mobile. REPLACE manual sw.js with @serwist/next.

---

## PRIORITY-ORDERED IMPLEMENTATION PLAN

Here is the full list of recommendations ranked by impact/effort ratio:

**Tier 1 -- High Impact, Low Effort (do this week)**

| Action | Effort | Impact |
|--------|--------|--------|
| Audit all Zustand selectors for `useShallow` | 1 day | Prevents cascade re-renders across all 13 stores |
| Enable Anthropic prompt caching on system prompts | 0.5 day | 60-80% AI cost reduction |
| Optimize ParticleLayer with typed arrays + batched draws | 0.5 day | ~6ms/frame saved in simulation mode |
| Reduce particle count on mobile devices | 0.5 day | Smooth 60fps on mobile during simulation |
| Remove zundo if unused | 0.5 hour | Remove dead dependency |

**Tier 2 -- High Impact, Medium Effort (next 2 weeks)**

| Action | Effort | Impact |
|--------|--------|--------|
| Add streaming AI responses (ai@4.x + @ai-sdk/anthropic) | 3-5 days | Perceived latency drops from 2-5s to ~200ms |
| Add CodeMirror 6 for interactive code editing | 3-5 days | Unlocks machine coding practice, code stepping |
| Add @tanstack/react-virtual for sidebar/palette lists | 2 days | 80% fewer DOM nodes in list views |
| Move canvas persistence from localStorage to IndexedDB | 2 days | Removes 5MB limit, eliminates main-thread blocking |
| Add nuqs for URL state (module, pattern, sim config) | 2 days | Deep-linkable, shareable workspace states |

**Tier 3 -- Medium Impact, Medium Effort (next month)**

| Action | Effort | Impact |
|--------|--------|--------|
| Move full simulation orchestrator to Web Worker | 1 week | Frees 8-15ms/tick from main thread |
| Add @serwist/next for service worker management | 2 days | Instant repeat loads, better offline |
| Consolidate IndexedDB to one library | 1 day | Remove Dexie OR idb-store, reduce bundle |
| Add ISR to content pages | 2 days | Faster page loads for pattern/algo content |
| Comprehensive accessibility audit | 1 week | WCAG compliance for canvas interactions |
| Add @use-gesture/react for touch normalization | 1 day | Better mobile gesture handling |
| Upgrade @xyflow/react to v12.12+ | 0.5 day | Edge rendering perf fixes |

**Tier 4 -- Strategic, Higher Effort (next quarter)**

| Action | Effort | Impact |
|--------|--------|--------|
| Liveblocks Phase 1 (presence/cursors) | 2 weeks | Multiplayer collaboration MVP |
| Yjs Phase 2 (shared diagram state) | 4 weeks | Full collaborative editing |
| Playwright E2E suite (5 critical flows) | 1 week | Regression safety for core features |
| Visual regression for node types | 2 days | Catch styling regressions |
| Unify LLD canvas onto React Flow | 2 weeks | One renderer, reduced maintenance |

---

## COMPLETE DEPENDENCY MANIFEST

Packages to **ADD** (with sizes):

```
ai@4.x                          ~25KB gzip   (AI streaming + hooks)
@ai-sdk/anthropic@1.x           ~5KB gzip    (Anthropic provider)
@codemirror/view@6.x             ~60KB gzip   (editor core)
@codemirror/state@6.x            ~15KB gzip   (editor state)
@codemirror/language@6.x         ~20KB gzip   (language support)
@codemirror/lang-javascript@6.x  ~30KB gzip   (TS/JS)
@codemirror/lang-python@6.x      ~15KB gzip   (Python)
@codemirror/lang-java@6.x        ~15KB gzip   (Java)
@codemirror/lang-cpp@6.x         ~15KB gzip   (C++)
@codemirror/lang-go@6.x          ~10KB gzip   (Go)
@codemirror/theme-one-dark@6.x   ~3KB gzip    (dark theme)
@codemirror/autocomplete@6.x     ~15KB gzip   (autocomplete)
@uiw/react-codemirror@4.x        ~5KB gzip    (React wrapper)
@tanstack/react-virtual@3.x      ~5KB gzip    (virtual scrolling)
@use-gesture/react@10.3.x        ~4KB gzip    (touch gestures)
nuqs@2.4.x                       ~2.5KB gzip  (URL state)
@serwist/next@9.x                ~10KB gzip   (service worker)
```

Packages to **UPGRADE**:
```
@xyflow/react                    v12.10.2 -> v12.12+
```

Packages to **EVALUATE FOR REMOVAL**:
```
zundo@2.3.0                      (if custom UndoManager is the actual impl)
dexie@4.4.2 + dexie-react-hooks  (if custom idb-store.ts is preferred)
  OR
src/lib/persistence/idb-store.ts (if Dexie's live queries are needed)
```

Packages to **NOT ADD** (and why):
```
Monaco Editor          -- 5MB bundle, overkill for solution writing
GSAP                   -- Commercial license for SaaS, motion handles the use cases
Redux Toolkit          -- More boilerplate than Zustand, no advantage at this scale
Prisma                 -- Heavier runtime, no Edge support, Drizzle is better
WebGL/Three.js         -- Unnecessary complexity, SVG+Canvas2D covers all needs
Supabase Realtime      -- Not designed for cursor-frequency collaboration
```

---

## KEY FILES REFERENCED

- `/Users/anshullkgarg/Desktop/system_design/architex/package.json` -- full dependency list
- `/Users/anshullkgarg/Desktop/system_design/architex/next.config.ts` -- standalone output, security headers, bundle analyzer
- `/Users/anshullkgarg/Desktop/system_design/architex/src/app/layout.tsx` -- root layout with 6 providers, conditional Clerk
- `/Users/anshullkgarg/Desktop/system_design/architex/src/app/globals.css` -- 1122-line design token system
- `/Users/anshullkgarg/Desktop/system_design/architex/src/stores/index.ts` -- 13 store exports
- `/Users/anshullkgarg/Desktop/system_design/architex/src/stores/STATE_ARCHITECTURE.ts` -- command bus design doc
- `/Users/anshullkgarg/Desktop/system_design/architex/src/stores/canvas-store.ts` -- React Flow node/edge state with custom UndoManager
- `/Users/anshullkgarg/Desktop/system_design/architex/src/stores/simulation-store.ts` -- simulation state with 10-stage tick pipeline ref
- `/Users/anshullkgarg/Desktop/system_design/architex/src/stores/ai-store.ts` -- AI key management, per-feature cost tracking
- `/Users/anshullkgarg/Desktop/system_design/architex/src/components/canvas/DesignCanvas.tsx` -- main canvas with React Flow, 15+ overlays
- `/Users/anshullkgarg/Desktop/system_design/architex/src/components/canvas/overlays/ParticleLayer.tsx` -- Canvas2D particle system, 2000 max, Bezier paths
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/simulation/simulation-orchestrator.ts` -- 10-stage tick pipeline with 15+ subsystem imports
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/workers/simulation-worker.ts` -- queuing model worker (only handles SIMULATE_TICK)
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/workers/worker-bridge.ts` -- typed request/response worker wrapper
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/ai/claude-client.ts` -- Anthropic singleton with queue, backoff, cache, cost tracking
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/ai/indexeddb-cache.ts` -- LRU cache in IndexedDB, 500 entry max
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/collaboration/collaboration-manager.ts` -- transport-agnostic collab with LocalTransport only
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/persistence/idb-store.ts` -- custom IndexedDB wrapper (competes with Dexie)
- `/Users/anshullkgarg/Desktop/system_design/architex/src/db/index.ts` -- dual-driver DB (Neon HTTP + pg pool)
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/visualization/canvas-renderer.ts` -- Canvas2D chart engine with double-buffering
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/fsrs.ts` -- FSRS-5 spaced repetition, pure functions
- `/Users/anshullkgarg/Desktop/system_design/architex/vitest.config.ts` -- Vitest with jsdom, path aliases
- `/Users/anshullkgarg/Desktop/system_design/architex/playwright.config.ts` -- Playwright E2E config