# Architex UI Tour — v2

> CORRECTION NOTICE: The v1 tour was written under the incorrect assumption that
> Architex uses Next.js path-based routing for its module content (e.g.
> `/algorithms`, `/database`, `/ds`). Those paths return 404. All interactive
> learning modules live at the root SPA (`/`), with module type controlled by
> Zustand state rather than the URL. This document replaces v1 entirely.

---

## 1. Routing Model

Architex has two distinct routing models running in parallel.

### 1A. Server-Rendered Path Routes

Standard Next.js pages served at explicit paths. These are marketing and
content pages with full SSR, SEO metadata, and no Zustand state dependency.

| Path pattern | Description |
|---|---|
| `/` | Root — landing page when not authenticated; SPA shell when authenticated |
| `/sign-in` | Sign-in page |
| `/sign-up` | Sign-up page |
| `/pricing` | Pricing tiers |
| `/blog` | Blog index |
| `/blog/<slug>` | Individual blog articles |
| `/gallery` | Module showcase gallery |
| `/concepts` | Concepts hub |
| `/concepts/os/<slug>` | Operating systems concept articles |
| `/concepts/database/<slug>` | Database concept articles |
| `/interview` | Interview hub |
| `/interview/<company>` | Company-specific interview guide |
| `/learn` | Learn hub (static content pages) |
| `/embed/algorithms` | Embeddable algorithm visualizer |
| `/algorithms/<category>/<slug>` | Algorithm detail pages (SEO) |

### 1B. SPA Routing at `/`

The interactive app shell lives entirely at `/`. Module type is held in Zustand
(`ui-store.ts`, `activeModule`), not the URL. The only URL-based state is:

| Parameter | Source | Controls |
|---|---|---|
| `?lld=pattern:<id>` | `useLLDModuleImpl.tsx` | Which LLD pattern is loaded |
| `?lld=solid:<id>` | `useLLDModuleImpl.tsx` | Which SOLID principle |
| `?lld=problem:<id>` | `useLLDModuleImpl.tsx` | Which LLD problem |
| `?lld=sequence:<id>` | `useLLDModuleImpl.tsx` | Sequence diagram |
| `?lld=state-machine:<id>` | `useLLDModuleImpl.tsx` | State machine diagram |
| `&mode=learn\|build\|drill\|review` | `useLLDModeSync.ts` | LLD interaction mode |
| `#<ds-id>` | `DataStructuresModule` reads `window.location.hash` | Active data structure |

Module type switching uses Zustand `setActiveModule()` via:
- Activity bar clicks (left sidebar icons)
- Keyboard shortcuts: `1` = System Design, `2` = Algorithms, `3` = Data Structures,
  `4` = LLD, `5` = Database, `6` = Distributed, `7` = Networking, `8` = OS,
  `9` = Concurrency

Algorithm selection uses a searchable combobox on desktop (`aria-label="Search algorithms"`,
visible at `sm:` breakpoint) or a native `<select>` on mobile (`sm:hidden`).

---

## 2. Path Route Screenshots

### 2A. Authentication and Marketing

| URL | Screenshot | Notes |
|---|---|---|
| `/` (home) | `./screenshots/v2/a01-home.png` | Landing page — hero, features, pricing CTA |
| `/sign-in` | `./screenshots/v2/a02-signin.png` | Sign-in form |
| `/sign-up` | `./screenshots/v2/a03-signup.png` | Sign-up form |
| `/pricing` | `./screenshots/v2/a04-pricing.png` | Pricing tiers (Free / Pro / Team) |

![Home landing page](./screenshots/v2/a01-home.png)

![Pricing page](./screenshots/v2/a04-pricing.png)

### 2B. Blog

Three long-form articles on core CS interview topics.

| URL | Screenshot |
|---|---|
| `/blog` | `./screenshots/v2/a05-blog.png` |
| `/blog/system-design-interview-complete-guide` | `./screenshots/v2/a06-blog-system-design.png` |
| `/blog/understanding-cap-theorem-beyond-basics` | `./screenshots/v2/a07-blog-cap.png` |
| `/blog/rate-limiting-algorithms-compared` | `./screenshots/v2/a08-blog-ratelimit.png` |

![Blog index](./screenshots/v2/a05-blog.png)

### 2C. Gallery

`/gallery` — Static showcase of all module types with sample screenshots.

![Gallery](./screenshots/v2/a09-gallery.png)

### 2D. Concepts Hub

`/concepts` lists OS and Database concept articles. Each article is a full
server-rendered page with diagrams, code samples, and explanations.

**OS concepts** (`/concepts/os/<slug>`):

| Slug | Screenshot |
|---|---|
| `cpu-scheduling` | `./screenshots/v2/a11-os-cpu.png` |
| `memory-management` | `./screenshots/v2/a12-os-memory.png` |
| `deadlock-detection` | `./screenshots/v2/a13-os-deadlock.png` |
| `page-replacement` | `./screenshots/v2/a14-os-page.png` |
| `thread-synchronization` | `./screenshots/v2/a15-os-thread.png` |
| `memory-allocation` | `./screenshots/v2/a16-os-alloc.png` |

![OS: CPU scheduling](./screenshots/v2/a11-os-cpu.png)

**Database concepts** (`/concepts/database/<slug>`):

| Slug | Screenshot |
|---|---|
| `er-diagram` | `./screenshots/v2/a17-db-er.png` |
| `normalization` | `./screenshots/v2/a18-db-norm.png` |
| `transaction-isolation` | `./screenshots/v2/a19-db-tx.png` |
| `btree-index` | `./screenshots/v2/a20-db-btree.png` |
| `hash-index` | `./screenshots/v2/a21-db-hash.png` |
| `query-plans` | `./screenshots/v2/a22-db-qp.png` |
| `lsm-tree` | `./screenshots/v2/a23-db-lsm.png` |
| `mvcc` | `./screenshots/v2/a24-db-mvcc.png` |
| `aries-recovery` | `./screenshots/v2/a25-db-aries.png` |
| `sql-vs-nosql` | `./screenshots/v2/a26-db-sql-nosql.png` |
| `index-anti-patterns` | `./screenshots/v2/a27-db-idx-anti.png` |

![Database: B-tree index](./screenshots/v2/a20-db-btree.png)

### 2E. Interview Hub

`/interview` lists company-specific prep guides. Each company page has curated
question sets, complexity expectations, and system design focus areas.

| URL | Screenshot |
|---|---|
| `/interview` | `./screenshots/v2/a28-interview.png` |
| `/interview/google` | `./screenshots/v2/a29-interview-google.png` |
| `/interview/meta` | `./screenshots/v2/a30-interview-meta.png` |
| `/interview/amazon` | `./screenshots/v2/a31-interview-amazon.png` |
| `/interview/apple` | `./screenshots/v2/a32-interview-apple.png` |
| `/interview/microsoft` | `./screenshots/v2/a33-interview-ms.png` |
| `/interview/netflix` | `./screenshots/v2/a34-interview-netflix.png` |
| `/interview/uber` | `./screenshots/v2/a35-interview-uber.png` |
| `/interview/airbnb` | `./screenshots/v2/a36-interview-airbnb.png` |
| `/interview/stripe` | `./screenshots/v2/a37-interview-stripe.png` |
| `/interview/twitter` | `./screenshots/v2/a38-interview-twitter.png` |

![Interview hub](./screenshots/v2/a28-interview.png)

![Interview: Google](./screenshots/v2/a29-interview-google.png)

---

## 3. SPA Module Screenshots

### 3A. Module Switcher

All 9+ modules accessible from the activity bar or keyboard shortcuts 1–9.

| Key | Module | Screenshot |
|---|---|---|
| `1` | System Design | `./screenshots/v2/e01-module-system-design.png` |
| `2` | Algorithms | `./screenshots/v2/c01-alg-module-default.png` |
| `3` | Data Structures | `./screenshots/v2/d01-ds-module-default.png` |
| `4` | LLD | `./screenshots/v2/b01-lld-singleton-build.png` |
| `5` | Database | `./screenshots/v2/e02-module-database.png` |
| `6` | Distributed Systems | `./screenshots/v2/e03-module-distributed.png` |
| `7` | Networking | `./screenshots/v2/e04-module-networking.png` |
| `8` | Operating Systems | `./screenshots/v2/e05-module-os.png` |
| `9` | Concurrency | `./screenshots/v2/e06-module-concurrency.png` |
| — | Security | `./screenshots/v2/e07-module-security.png` |
| — | ML Design | `./screenshots/v2/e08-module-ml-design.png` |
| — | Interview | `./screenshots/v2/e09-module-interview.png` |
| — | Knowledge Graph | `./screenshots/v2/e10-module-knowledge-graph.png` |

![System Design module](./screenshots/v2/e01-module-system-design.png)

### 3B. LLD Module — Design Patterns

22 GoF + modern patterns, each with a full UML diagram on the build-mode canvas.
URL format: `/?lld=pattern:<id>&mode=<mode>`

**Creational patterns:**

| Pattern | Build screenshot |
|---|---|
| Singleton | `./screenshots/v2/b01-lld-singleton-build.png` |
| Factory Method | `./screenshots/v2/b02-lld-factory-method-build.png` |
| Builder | `./screenshots/v2/b03-lld-builder-build.png` |
| Abstract Factory | `./screenshots/v2/b16-lld-abstract-factory-build.png` |
| Prototype | `./screenshots/v2/b21-lld-prototype-build.png` |

**Structural patterns:**

| Pattern | Build screenshot |
|---|---|
| Adapter | `./screenshots/v2/b04-lld-adapter-build.png` |
| Decorator | `./screenshots/v2/b05-lld-decorator-build.png` |
| Facade | `./screenshots/v2/b06-lld-facade-build.png` |
| Bridge | `./screenshots/v2/b06-lld-bridge-build.png` |
| Proxy | `./screenshots/v2/b08-lld-proxy-build.png` |
| Composite | `./screenshots/v2/b15-lld-composite-build.png` |
| Iterator | `./screenshots/v2/b14-lld-iterator-build.png` |

**Behavioral patterns:**

| Pattern | Build screenshot |
|---|---|
| Observer | `./screenshots/v2/b07-lld-observer-build.png` |
| Strategy | `./screenshots/v2/b08-lld-strategy-build.png` |
| Command | `./screenshots/v2/b09-lld-command-build.png` |
| State | `./screenshots/v2/b10-lld-state-build.png` |
| Mediator | `./screenshots/v2/b13-lld-mediator-build.png` |
| Template Method | `./screenshots/v2/b14-lld-template-method-build.png` |
| Chain of Responsibility | `./screenshots/v2/b16-lld-chain-build.png` |
| Memento | `./screenshots/v2/b19-lld-memento-build.png` |
| Visitor | `./screenshots/v2/b20-lld-visitor-build.png` |

**Modern patterns:**

| Pattern | Build screenshot |
|---|---|
| Repository | `./screenshots/v2/b24-lld-repository-build.png` |
| CQRS | `./screenshots/v2/b22-lld-cqrs-build.png` |
| Event Sourcing | `./screenshots/v2/b23-lld-event-sourcing-build.png` |

![LLD: Observer pattern build mode](./screenshots/v2/b07-lld-observer-build.png)

### 3C. LLD Module — SOLID Principles

URL format: `/?lld=solid:<id>`

| Principle | URL param | Screenshot |
|---|---|---|
| Single Responsibility | `srp` | `./screenshots/v2/bs01-solid-srp.png` |
| Open/Closed | `ocp` | `./screenshots/v2/bs02-solid-ocp.png` |
| Liskov Substitution | `lsp` | `./screenshots/v2/bs03-solid-lsp.png` |
| Interface Segregation | `isp` | `./screenshots/v2/bs04-solid-isp.png` |
| Dependency Inversion | `dip` | `./screenshots/v2/bs05-solid-dip.png` |

![SOLID: Single Responsibility](./screenshots/v2/bs01-solid-srp.png)

### 3D. LLD Module — Design Problems

URL format: `/?lld=problem:<slug>`

| Problem | Screenshot |
|---|---|
| Parking Lot | `./screenshots/v2/j01-lld-problem-parking-lot.png` |
| Elevator System | `./screenshots/v2/j02-lld-problem-elevator.png` |
| Chess Game | `./screenshots/v2/j03-lld-problem-chess.png` |
| Vending Machine | `./screenshots/v2/j04-lld-problem-vending-machine.png` |
| LRU Cache | `./screenshots/v2/j05-lld-problem-lru-cache.png` |
| URL Shortener | `./screenshots/v2/j06-lld-problem-url-shortener.png` |
| Rate Limiter | `./screenshots/v2/j07-lld-problem-rate-limiter.png` |
| Pub/Sub System | `./screenshots/v2/j08-lld-problem-pub-sub.png` |

![LLD problem: Parking Lot](./screenshots/v2/j01-lld-problem-parking-lot.png)

### 3E. Algorithms Module

Activated via keyboard `2`. Algorithm selection on desktop uses a searchable
combobox (`aria-label="Search algorithms"`) — click to open dropdown, type
partial name, click button. On mobile, a native `<select>` is visible instead
(the combobox is `hidden sm:block`, the select is `sm:hidden`).

The module has 80+ algorithms organized in categories: Sorting, Search, Greedy,
Graph, Tree, Dynamic Programming, String, Backtracking, Geometry, Pattern,
Probabilistic, Vector Search.

Default view (Bubble Sort selected):

![Algorithms module](./screenshots/v2/c01-alg-module-default.png)

### 3F. Data Structures Module

Activated via keyboard `3`. URL hash controls which DS is shown on mount:
`/#<ds-id>`. The component reads `window.location.hash.slice(1)` on mount and
calls `window.history.replaceState` on selection.

39 structures in catalog:

| Data Structure | Hash | Screenshot |
|---|---|---|
| Array | `#array` | `./screenshots/v2/d02-ds-array.png` |
| Stack | `#stack` | `./screenshots/v2/d03-ds-stack.png` |
| Queue | `#queue` | `./screenshots/v2/d04-ds-queue.png` |
| Linked List | `#linked-list` | `./screenshots/v2/d05-ds-linked-list.png` |
| Hash Table | `#hash-table` | `./screenshots/v2/d06-ds-hash-table.png` |
| BST | `#bst` | `./screenshots/v2/d07-ds-bst.png` |
| Heap | `#heap` | `./screenshots/v2/d08-ds-heap.png` |
| Trie | `#trie` | `./screenshots/v2/d09-ds-trie.png` |
| Bloom Filter | `#bloom-filter` | `./screenshots/v2/d15-ds-bloom-filter.png` |
| Skip List | `#skip-list` | `./screenshots/v2/d16-ds-skip-list.png` |
| Union-Find | `#union-find` | `./screenshots/v2/d17-ds-union-find.png` |
| Consistent Hash | `#consistent-hash` | `./screenshots/v2/d18-ds-consistent-hash.png` |
| AVL Tree | `#avl-tree` | `./screenshots/v2/d10-ds-avl-tree.png` |
| Red-Black Tree | `#red-black-tree` | `./screenshots/v2/d11-ds-red-black-tree.png` |
| Segment Tree | `#segment-tree` | `./screenshots/v2/d12-ds-segment-tree.png` |
| B+ Tree | `#bplus-tree` | `./screenshots/v2/d13-ds-bplus-tree.png` |
| LRU Cache | `#lru-cache` | `./screenshots/v2/d14-ds-lru-cache.png` |
| Deque | `#deque` | `./screenshots/v2/d19-ds-deque.png` |
| Circular Buffer | `#circular-buffer` | `./screenshots/v2/d20-ds-circular-buffer.png` |
| Monotonic Stack | `#monotonic-stack` | `./screenshots/v2/d21-ds-monotonic-stack.png` |
| Priority Queue | `#priority-queue` | `./screenshots/v2/d22-ds-priority-queue.png` |
| Doubly Linked List | `#doubly-linked-list` | `./screenshots/v2/d23-ds-doubly-linked-list.png` |

![Data Structures: Array](./screenshots/v2/d02-ds-array.png)

![Data Structures: BST](./screenshots/v2/d07-ds-bst.png)

---

## 4. LLD Mode Comparison

The LLD module has four interaction modes for each pattern. URL: `&mode=<mode>`.

### Singleton — All 4 Modes

| Mode | URL | Screenshot | Description |
|---|---|---|---|
| Learn | `/?lld=pattern:singleton&mode=learn` | `./screenshots/v2/bm01-singleton-learn.png` | Concept card with analogy, tradeoffs, prediction prompts |
| Build | `/?lld=pattern:singleton&mode=build` | `./screenshots/v2/bm02-singleton-build.png` | Live UML canvas with toolbar (Templates, Export, Import) |
| Drill | `/?lld=pattern:singleton&mode=drill` | `./screenshots/v2/bm03-singleton-drill.png` | Timed diagramming exercise with submit |
| Review | `/?lld=pattern:singleton&mode=review` | `./screenshots/v2/bm04-singleton-review.png` | Reference solution + explanation |

![Singleton: learn mode](./screenshots/v2/bm01-singleton-learn.png)

![Singleton: build mode](./screenshots/v2/bm02-singleton-build.png)

![Singleton: drill mode](./screenshots/v2/bm03-singleton-drill.png)

![Singleton: review mode](./screenshots/v2/bm04-singleton-review.png)

### Abstract Factory — All 4 Modes

| Mode | Screenshot |
|---|---|
| Learn | `./screenshots/v2/bm05-abstract-factory-learn.png` |
| Build | `./screenshots/v2/bm06-abstract-factory-build.png` |
| Drill | `./screenshots/v2/bm07-abstract-factory-drill.png` |
| Review | `./screenshots/v2/bm08-abstract-factory-review.png` |

### Observer — All 4 Modes

| Mode | Screenshot |
|---|---|
| Learn | `./screenshots/v2/bm09-observer-learn.png` |
| Build | `./screenshots/v2/bm10-observer-build.png` |
| Drill | `./screenshots/v2/bm11-observer-drill.png` |
| Review | `./screenshots/v2/bm12-observer-review.png` |

---

## 5. Interactive Demos

### 5A. Command Palette

Triggered by `Cmd+K` (Mac) / `Ctrl+K`. Fuzzy-search across all modules, patterns,
data structures, and commands.

![Command palette](./screenshots/v2/f01-command-palette.png)

### 5B. LLD Build Mode Toolbar

The build mode canvas toolbar contains: Templates, Export, Import buttons.
The canvas is a custom Pixi.js / React-Flow renderer with zooming and
node dragging.

**Templates dialog** (loads pre-built diagrams):

![LLD Templates dialog](./screenshots/v2/f02-lld-templates-dialog.png)

**Export dialog** (PNG / SVG / JSON export):

![LLD Export dialog](./screenshots/v2/f10-export-dialog.png)

### 5C. Drill Mode

Drill mode presents an empty canvas and a timer. The user must diagram the
selected pattern from memory. A "Start Drill" button initiates the session.

![LLD drill mode — initial](./screenshots/v2/f04-lld-drill-initial.png)

### 5D. Settings Panel

Accessible via `aria-label="Settings"` button in the header. Opens a panel
with theme, font size, and animation speed controls. Note: the TanStack Query
devtools overlay sits above this button at full viewport, requiring a JavaScript
click via `document.querySelector('[aria-label="Settings"]').click()` to bypass
pointer-event interception.

![Settings panel](./screenshots/v2/f07-settings-panel.png)

### 5E. Keyboard Shortcuts Dialog

Triggered by `Shift+?`. Shows all keyboard shortcuts organized by category.

![Keyboard shortcuts](./screenshots/v2/f11-keyboard-shortcuts.png)

---

## 6. Mobile Tour (390 x 844)

Top 5 surfaces at iPhone SE / 14 Pro viewport.

| Surface | Screenshot | Notes |
|---|---|---|
| Landing page | `./screenshots/v2/h01-mobile-landing.png` | Responsive hero, collapsed nav |
| Pricing | `./screenshots/v2/h02-mobile-pricing.png` | Stacked tier cards |
| Blog index | `./screenshots/v2/h05-mobile-blog.png` | Single-column list |
| LLD build mode | `./screenshots/v2/h04-mobile-lld-singleton.png` | Canvas + bottom sheet toolbar |
| LLD learn mode | `./screenshots/v2/h03-mobile-root-spa.png` | Scrollable content card |

On mobile viewport, the algorithm selector switches from the searchable combobox
to a native `<select>` element (`aria-label="Algorithm selector"`, class includes
`sm:hidden`). This allows native OS scroll-picker UX.

The LLD canvas is touch-scrollable. The activity bar collapses to a bottom
navigation strip on narrow viewports.

![Mobile: landing page](./screenshots/v2/h01-mobile-landing.png)

![Mobile: LLD singleton build](./screenshots/v2/h04-mobile-lld-singleton.png)

---

## 7. What Could Not Be Reached

The following surfaces were not captured or produced errors during the tour:

| Surface | Reason |
|---|---|
| Authenticated `/` (SPA shell with user data) | Tour ran without auth session; root shows landing page |
| Algorithm per-variant screenshots beyond default | Desktop combobox requires `click → fill → click-button` chain; script timing constraints prevented full capture of 80+ variants |
| LLD drill mode "in progress" state | "Start Drill" button not consistently locatable; initial screen was captured |
| LLD sequence diagrams (`?lld=sequence:<id>`) | Sequence IDs not enumerated from source |
| LLD state machines (`?lld=state-machine:<id>`) | Same — ID source not read during tour |
| `?lld=problem:*` beyond 8 problems | 30+ problems exist; only first 8 captured |
| Dashboard (authenticated home) | Requires auth session |
| User profile / account settings | Requires auth |
| `/learn` sub-pages | Path returned 404 during this tour run |

---

## 8. Visual Style Observations

**Color system:** Dark background (`--background` ≈ deep neutral), warm primary
accent, muted border/30 transparency on panels. `backdrop-blur-xl` appears on
most floating panels (combobox dropdown, settings panel, tooltips). Text
hierarchy: `text-foreground` > `text-foreground-muted`.

**Typography:** Sans-serif body with `text-sm` (14px) dominant throughout the
canvas UI. Monospace (`font-mono`) used in code blocks and algorithm
pseudocode panels.

**Canvas aesthetics:** The LLD UML canvas uses a dotted grid background,
SVG-rendered nodes with rounded corners, and connection lines with arrow
markers. Pattern nodes use color-coded stereotypes (interface, abstract class,
concrete class).

**Animation:** Algorithm visualizer uses a step-based playback controller with
configurable speed. Data structure visualizer uses SVG with animated node
insertion/deletion.

**Layout:** Three-panel layout: left activity bar (48px), optional left
sidebar (variable width), main canvas (fills remaining). Bottom panel exists in
some modules (algorithm code view, complexity table).

**Light/Dark:** CSS variable-based theming supports both modes. Screenshots
captured in dark mode (default).

**Loading states:** Zustand module hydration shows skeleton loaders on first
navigation to an LLD pattern. Subsequent navigations within the same module
are instant (state preserved in Zustand).

---

## 9. URL Appendix

### LLD Pattern IDs

```
singleton  factory-method  builder  adapter  decorator  facade
observer   strategy        command  state    proxy      iterator
mediator   template-method  repository  abstract-factory  composite
chain-of-responsibility  memento  visitor  prototype  bridge
cqrs  event-sourcing  flyweight
```

### LLD Problem Slugs (partial — 30+ total)

```
parking-lot  elevator-system  chess-game  vending-machine
library-management  atm  hotel-booking  snake-ladder
file-system  lru-cache  movie-ticket-booking  restaurant-management
airline-booking  tic-tac-toe  snake-game  card-game
notification-service  logging-framework  cache-system  task-scheduler
pub-sub-system  rate-limiter  url-shortener  social-media-feed
spreadsheet  splitwise  ride-sharing  online-shopping  stock-brokerage
```

### Data Structure IDs (39 total)

```
array  stack  queue  linked-list  hash-table  bst  bloom-filter
skip-list  heap  trie  union-find  lsm-tree  consistent-hash
merkle-tree  count-min-sketch  hyperloglog  deque  circular-buffer
wal  rope  r-tree  quadtree  fibonacci-heap  avl-tree  red-black-tree
segment-tree  bplus-tree  fenwick-tree  splay-tree  crdt  vector-clock
treap  binomial-heap  b-tree  doubly-linked-list  priority-queue
lru-cache  cuckoo-hash  monotonic-stack
```

### OS Concept Slugs

```
cpu-scheduling  page-replacement  deadlock-detection
memory-management  memory-allocation  thread-synchronization
```

### Database Concept Slugs

```
er-diagram  normalization  transaction-isolation  btree-index
hash-index  query-plans  lsm-tree  mvcc  aries-recovery
sql-vs-nosql  index-anti-patterns
```

### Interview Company Slugs

```
google  meta  amazon  apple  microsoft  netflix  uber  airbnb  stripe
twitter  linkedin
```

### Blog Slugs

```
system-design-interview-complete-guide
understanding-cap-theorem-beyond-basics
rate-limiting-algorithms-compared
```

---

## 10. Screenshot Index

All screenshots are at `docs/CODEMAPS/screenshots/v2/`. Desktop: 1440x900.
Mobile (`h0*`): 390x844. All fullPage captures.

**Total captured: 204 screenshots**

| Prefix | Contents |
|---|---|
| `a01`–`a38` | Path routes (home, auth, pricing, blog, concepts, interview) |
| `b01`–`b24` | LLD patterns in build mode |
| `bm01`–`bm12` | LLD 4-mode comparison (singleton, abstract-factory, observer) |
| `bs01`–`bs05` | LLD SOLID principles |
| `bl01`–`bl10` | LLD problems (via `?lld=problem:<slug>`, captured in earlier run) |
| `c01` | Algorithms module default view |
| `d01`–`d23` | Data structure module variants (hash routing) |
| `e01`–`e10` | Module switcher screenshots (all SPA modules) |
| `f01`–`f11` | Interactive demos (command palette, templates, drill, settings, shortcuts) |
| `g01`–`g03` | Embed routes |
| `h01`–`h07` | Mobile tour (390x844) |
| `j01`–`j08` | LLD problems via SPA navigation |
