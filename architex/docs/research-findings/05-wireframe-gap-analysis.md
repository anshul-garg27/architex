# Wireframe Gap Analysis: 22 Screens

> Source: `/docs/wireframes/architex-wireframe-specs.md`
> Compared against: `/architex/src/components/`, `/architex/src/app/`, `/architex/src/stores/`, `/architex/src/lib/`
> Date: 2026-04-11

---

## Summary

| Status | Count |
|--------|-------|
| FULLY BUILT | 0 |
| PARTIALLY BUILT | 7 |
| NOT STARTED | 15 |

The wireframe spec defines 22 distinct screens. The current implementation has partial coverage for 7 screens (System Design Editor, Algorithm Visualizer, Distributed Systems Playground, Interview Challenge, Template Gallery, Command Palette, Share/Export Dialog). The remaining 15 screens have zero component files. There are zero Next.js page routes beyond the single root `app/page.tsx`. No routing structure exists.

---

## Screen-by-Screen Analysis

### 1. Landing Page (Public)
**Status: NOT STARTED** | **Priority: P1**

**Purpose:** Marketing page to convert visitors. 10 sections (Navbar, Hero, Social Proof, Features Grid, How It Works, Interview Callout, Testimonials, Pricing, CTA, Footer).

**What's BUILT:**
- Nothing. The root `app/page.tsx` exists but is the default Next.js page, not the landing page.

**What's MISSING:**
- `LandingNavbar` component (sticky, scroll-aware, transparent-to-blur transition)
- `HeroSection` component (two-column, animated illustration, gradient text, CTAs)
- `SocialProofBar` component (4 stats with responsive 2x2 grid)
- `FeaturesGrid` component (12 module cards, 3-column layout, hover lift animation)
- `HowItWorks` component (3-step with connected dashed line animation)
- `InterviewCallout` component (gradient card, screenshot, bullet points)
- `TestimonialsCarousel` component (auto-advance, 5s interval, dot indicators)
- `PricingTable` component (3-column comparison, Free/Pro/Team)
- `FinalCTABanner` component
- `LandingFooter` component (4-column link grid, social icons)
- Scroll-based animations (IntersectionObserver fade-up)
- Responsive breakpoints for tablet (768px) and mobile (375px)
- SSR/ISR for SEO

---

### 2. Home Dashboard (Logged In)
**Status: NOT STARTED** | **Priority: P0**

**Purpose:** Central hub showing progress, recent work, AI recommendations, quick actions.

**What's BUILT:**
- `workspace-layout.tsx` provides a basic shell structure (sidebar concept exists)
- `activity-bar.tsx` is a partial sidebar but implements module tabs, not dashboard navigation
- `status-bar.tsx` exists as a bottom status bar

**What's MISSING:**
- Global shell sidebar (240px, collapsible to 64px, nav items: Dashboard, Modules, Templates, Learning Paths, Interview Prep, Community, Recent Designs, Settings, Help)
- Top bar (56px, breadcrumbs, search bar triggering Command Palette, notification bell, theme toggle, avatar dropdown)
- `WelcomeBanner` component (greeting, streak display, 4 quick-action buttons)
- `ProgressSummaryRow` (4 stat cards: Level/XP ring, Streak/flame, Modules pie, Interview gauge)
- `RecentDesigns` list (5 cards with thumbnails, 3-dot menus, empty state)
- `AIRecommendations` panel (3-4 suggestion cards with AI sparkle icon)
- `StreakActivitySection` (GitHub-style heatmap + weekly goals progress bars)
- Skeleton loading states for all sections
- Responsive layouts (tablet 2x2, mobile stacked)
- Route: `/dashboard`

---

### 3. Module Selection
**Status: NOT STARTED** | **Priority: P0**

**Purpose:** Browse 12 learning modules with progress, difficulty, prerequisites.

**What's BUILT:**
- `activity-bar.tsx` has a rudimentary module list but it is a vertical tab bar, not the specified grid layout
- Individual module components exist (`AlgorithmModule.tsx`, `NetworkingModule.tsx`, `OSModule.tsx`, `ConcurrencyModule.tsx`, `InterviewModule.tsx`, `DistributedModule.tsx`, `PlaceholderModule.tsx`) but these are the module content views, not the selection grid

**What's MISSING:**
- Page header with filter row (Difficulty segmented control, Status filter, Sort dropdown)
- Progress overview bar (12-segment progress bar, modules complete counter)
- Module card grid (12 cards, 360x320px, gradient backgrounds, progress bars, difficulty badges, prerequisite lock overlays)
- Filter/sort logic
- Empty state (pulsing highlight on Module 1, welcome banner)
- Skeleton loading (12 pulsing cards)
- Route: `/modules`

---

### 4. System Design Editor
**Status: PARTIALLY BUILT** | **Priority: P0**

**Purpose:** Core canvas for building system architecture diagrams.

**What's BUILT:**
- `DesignCanvas.tsx` -- React Flow infinite canvas with background pattern
- `ComponentPalette.tsx` -- left panel with categorized component list, search, drag-and-drop
- `PropertiesPanel.tsx` -- right panel with component properties and metrics tabs
- `BottomPanel.tsx` -- simulation controls area
- 9 node types: `BaseNode`, `WebServerNode`, `LoadBalancerNode`, `DatabaseNode`, `CacheNode`, `MessageQueueNode`, `APIGatewayNode`, `CDNNode`, `ClientNode`, `StorageNode`
- `DataFlowEdge.tsx` -- custom edge with animated particles
- `canvas-store.ts`, `simulation-store.ts`, `editor-store.ts`, `viewport-store.ts` -- Zustand stores
- Simulation library: `queuing-model.ts`, `traffic-simulator.ts`, `metrics-collector.ts`, `chaos-engine.ts`, `capacity-planner.ts`
- Export library: `to-json.ts`, `to-mermaid.ts`, `to-plantuml.ts`, `to-terraform.ts`, `to-url.ts`

**What's MISSING:**
- Top toolbar (48px): back arrow, editable design title, save status indicator, zoom controls, undo/redo, Simulate toggle, AI Assist button, share button, collaborator avatars, 3-dot menu
- Component palette categories missing: Clients (Web Browser, Mobile, Desktop, IoT), many Compute variants (Worker, Serverless, Container, VM), many Storage variants (NoSQL subtypes, Object Storage, Data Warehouse), Infrastructure section (Monitoring, Logging, Service Mesh, Config Server, Service Registry), Custom section (Generic Service, Text Annotation, Group/Zone, External System)
- Canvas interactions: multi-select (Shift+click, drag selection box), axis-constrained move, right-click context menus (canvas and component), connection handle hover behavior
- Minimap (160x120px, bottom-right, Cmd+M toggle)
- AI Assist drawer (400px slide-in, chat interface, suggestion chips)
- Metrics tab: system-level metrics (total QPS sparkline, p50/p95/p99, availability, cost), component-level metrics (CPU/memory gauges, connections, throughput chart, error rate, queue depth)
- Bottom simulation bar: play/pause, speed control (0.5x-10x), scenario dropdown (Normal, Peak 10x, DB Failure, Network Partition, Gradual Ramp, Custom), reset, time elapsed counter, event notification toasts
- Empty state (centered prompt card with "Browse Templates" and "Start from Scratch" buttons)
- Route: `/editor/[id]`

---

### 5. Algorithm Visualizer
**Status: PARTIALLY BUILT** | **Priority: P1**

**Purpose:** Step-by-step algorithm visualization with code panel and complexity analysis.

**What's BUILT:**
- `AlgorithmModule.tsx` -- module wrapper
- `AlgorithmPanel.tsx` -- algorithm selection and controls
- `ArrayVisualizer.tsx` -- array bar visualization with color coding
- `SortingVisualizer.tsx`, `GraphVisualizer.tsx`, `DPTableVisualizer.tsx`, `StringMatchVisualizer.tsx` -- visualization renderers
- Sorting algorithms: bubble, merge, quick, heap, insertion, selection sort implementations
- `playback-controller.ts` -- step/play/pause/speed control logic
- Algorithm type system in `lib/algorithms/types.ts`

**What's MISSING:**
- Top bar (48px): algorithm selector dropdown with categories (Sorting, Searching, Graph, Tree, DP, String), input configuration gear icon
- Code panel (right, 60% of right column): syntax-highlighted code with current-line highlighting, language selector (Python, JS, Java, C++, Go), Pseudocode tab, Explanation tab
- Complexity panel (right bottom, 40%): time/space complexity display, live counters (comparisons, swaps, recursive calls, memory), mini chart showing operations vs input size
- Playback controls bar (48px): jump-to-start, step-back, play/pause, step-forward, jump-to-end, speed slider (0.25x-4x), progress bar (clickable, step markers)
- Input configuration popover: size slider (5-100), input type radio (Random, Nearly Sorted, Reversed, Few Unique, Custom)
- Graph algorithm visualizations (BFS/DFS coloring, path highlighting)
- Tree algorithm visualizations (BST operations, AVL rotations)
- DP visualizations (table cell fill animation, color gradient)
- Annotations (floating variable labels, pointer positions, recursion depth)
- Step indicator with progress bar
- Route: `/visualizer/algorithm`

---

### 6. Data Structure Explorer
**Status: NOT STARTED** | **Priority: P1**

**Purpose:** Interactive exploration of 40+ data structures with animated operations.

**What's BUILT:**
- Nothing specific to this screen. `PlaceholderModule.tsx` exists as a generic placeholder.

**What's MISSING:**
- Complete screen implementation (see File 4 for detailed plan)
- Top bar with DS selector (12+ data structures as segmented control)
- Operation controls (Insert, Delete, Search, Clear, structure-specific ops)
- Visualization canvas for each structure type (Array, Linked List, Stack, Queue, Hash Table, BST, AVL, Red-Black, Heap, Trie, Graph, B-Tree)
- Operation log panel with replay
- Info panel (complexity table, use cases)
- Step controls (same playback pattern as Algorithm Visualizer)
- Compare mode (side-by-side DS comparison)
- Route: `/explorer/data-structure`

---

### 7. LLD Studio
**Status: NOT STARTED** | **Priority: P1**

**Purpose:** Build class diagrams, sequence diagrams, state machines. Pattern library and code generation.

**What's BUILT:**
- Nothing specific to this screen.

**What's MISSING:**
- Complete screen implementation (see File 4 for detailed plan)
- Top toolbar with diagram type selector (Class, Sequence, State, Component)
- Pattern library panel (240px, 23 GoF patterns + 10 modern patterns, drag-to-canvas)
- Class diagram canvas (UML boxes, relationships with cardinality, inline editing)
- Sequence diagram mode (lifelines, message arrows, activation boxes, combined fragments)
- State diagram mode (states, transitions, composite states)
- Properties + Code Gen panel (class editor, attribute/method CRUD, language selector, syntax-highlighted output)
- AI Review and Generate Code buttons
- Route: `/studio/lld`

---

### 8. Database Lab
**Status: NOT STARTED** | **Priority: P1**

**Purpose:** ER diagrams, normalization exercises, query plan visualization, index visualization.

**What's BUILT:**
- Nothing specific to this screen.

**What's MISSING:**
- Complete screen implementation (see File 4 for detailed plan)
- Top bar with 4 primary tabs (ER Diagram, Normalization, Query Plan, Index Visualizer)
- ER Diagram tab: entity palette (New Table, enum, Import SQL), canvas with crow's foot notation, table properties panel (columns, types, constraints, indexes, SQL preview)
- Normalization tab: interactive exercise area (FD identification, table splitting), step indicator (5 steps), reference panel with hints
- Query Plan tab: SQL input area, visual execution plan tree, cost color-coding, EXPLAIN text view
- Index Visualizer tab: B-Tree visual, animated query traversal, configuration panel, stats display
- Route: `/lab/database`

---

### 9. Distributed Systems Playground
**Status: PARTIALLY BUILT** | **Priority: P1**

**Purpose:** Interactive Raft, consistent hashing, CAP theorem, failure scenarios.

**What's BUILT:**
- `DistributedModule.tsx` -- module wrapper component
- `RaftVisualizer.tsx` -- Raft consensus visualization
- `ConsistentHashRingVisualizer.tsx` -- consistent hashing ring visualization
- `VectorClockDiagram.tsx` -- vector clock diagram
- Library implementations: `raft.ts`, `consistent-hash.ts`, `vector-clock.ts`, `cap-theorem.ts`, `gossip.ts`, `crdt.ts`

**What's MISSING:**
- Top bar (56px) with experiment selector (segmented control: Raft, Consistent Hashing, CAP Explorer, Failure Scenarios)
- Raft sandbox: server nodes in pentagon layout with state display (Follower/Candidate/Leader, term, log entries), message arrows (RequestVote, AppendEntries), control panel (Trigger Election, Kill/Revive Node, Create/Heal Partition, Client Request), speed control, event log
- Consistent hashing: large circle ring canvas, server/key positioning, key reassignment animation, control panel (add/remove server, virtual nodes slider), distribution stats chart
- CAP Explorer: interactive triangle diagram with movable point, scenario toggles (Network Partition, Write Request, Read Request), outcome panel, animated two-datacenter visualization
- Failure Scenario Simulator: distributed system diagram canvas, failure injection panel (Network Latency, Service Crash, Database Failover, Message Queue Backlog, Split Brain, Cascading Failure), observe mode, metrics dashboard
- Route: `/playground/distributed`

---

### 10. Interview Challenge Screen
**Status: PARTIALLY BUILT** | **Priority: P0**

**Purpose:** Timed system design challenge with requirements panel and constrained canvas.

**What's BUILT:**
- `ChallengeCard.tsx` -- card component for displaying challenges
- `InterviewModule.tsx` -- module wrapper
- `interview-store.ts` -- Zustand store for interview state
- Library: `scoring.ts`, `srs.ts`, `challenges.ts`, `achievements.ts`

**What's MISSING:**
- Top bar (56px, high contrast): challenge title, difficulty badge, TIMER (32px monospace countdown with color changes green/yellow/red pulsing), Hints button with remaining count, Submit button, Give Up button
- Requirements panel (left, 300px, collapsible): functional requirements with checkboxes, non-functional requirements, constraints, evaluation criteria with mini progress bars, progressive hint reveal (3 hints, each costs score), "Ask AI" option
- Design canvas: reduced floating mini-palette (icons only), no simulation controls, no AI assist, sticky notes tool, text annotation tool, estimation scratch pad (DAU/read-write ratio/storage/retention calculator)
- Bottom action bar (48px): requirements checklist summary, component/connection count, Save Draft, Submit Design with confirmation modal
- Route: `/interview/[challengeSlug]`

---

### 11. Interview Results Screen
**Status: PARTIALLY BUILT** | **Priority: P1**

**Purpose:** Post-submission AI analysis with score breakdown and reference architecture comparison.

**What's BUILT:**
- `ScoreDisplay.tsx` -- basic score display component

**What's MISSING:**
- Score summary banner (120px): large circular gauge (78/100), 5 criteria mini-bars (Scalability, Reliability, API Design, Data Model, Trade-offs), time taken, hint penalties, time bonus
- Split-view comparison: user's design (left, 50%, read-only canvas with green/yellow/red annotation badges, AI callout bubbles) vs reference design (right, 50%, toggle overlay at 50% opacity, missing component dashed red outlines)
- Draggable split handle
- AI Feedback section (3 tabs): Detailed Feedback (strengths/improvements/critical gaps/estimation review), Improvement Suggestions (prioritized list with impact/effort/module links), Trade-offs Analysis (decision comparison table)
- Next Steps section: 3 action cards (Retry, Related Challenge, Study Materials), Return to Dashboard, Share Results
- Loading state with 10-step AI analysis progress
- Route: `/interview/[challengeSlug]/results`

---

### 12. Template Gallery
**Status: PARTIALLY BUILT** | **Priority: P1**

**Purpose:** Browse 55+ system design templates with rich previews.

**What's BUILT:**
- `template-gallery.tsx` -- basic template gallery component
- `lib/templates/types.ts`, `lib/templates/index.ts` -- template type definitions and data

**What's MISSING:**
- Page header with prominent search bar (400px, 44px height, debounced 200ms)
- View toggle (Grid/List icons)
- Sort dropdown (Popularity, Newest, Difficulty, Alphabetical)
- Category tabs (horizontal scroll pills): All, Social Media, E-Commerce, Messaging, Storage, Streaming, Search, Infrastructure, Finance, Real-Time, Gaming, IoT, ML/AI
- Template cards (360x300px): canvas preview thumbnail (miniature rendering), info section (title, category badge, difficulty badge, description 2-line clamp, meta row with component count/likes/forks)
- Hover overlay with "Preview" and "Open in Editor" buttons
- List view alternative (80px rows)
- Infinite scroll (12 initial, sentinel-triggered loading)
- Empty state for no search results
- Route: `/templates`

---

### 13. Template Detail / Preview
**Status: NOT STARTED** | **Priority: P2**

**Purpose:** Read-only detailed view of a template before opening in editor.

**What's BUILT:**
- Nothing.

**What's MISSING:**
- Top bar (56px): back arrow, breadcrumb, "Open in Editor" button, "Fork to My Designs", "Like" toggle, share icon
- Canvas preview (left, 60%): read-only React Flow rendering, interactive component tooltips, zoom controls, "Highlight Data Flow" toggle with animated arrows
- Info panel (right, 40%, 4 tabs): Overview (name, author, category, description, tags, stats), Components (sorted list with canvas highlighting), Learning Notes (key concepts, design decisions, interview tips, further reading), Discussion (threaded comments)
- Related templates (full width, horizontal scroll row)
- Route: `/templates/[slug]`

---

### 14. Learning Path View
**Status: NOT STARTED** | **Priority: P2**

**Purpose:** Visual skill tree roadmap showing topic dependencies and progress.

**What's BUILT:**
- Nothing.

**What's MISSING:**
- Top bar with path selector dropdown (5 preset paths + Custom Path)
- Overall path progress bar
- Skill tree canvas (horizontal scrollable, left-to-right flow): node cards (180x100px, icon, name, progress bar, lesson count), node states (Locked/Available/In Progress/Completed), edge states (completed green solid, available primary solid, locked gray dashed), pan/zoom/minimap
- Current position indicator (user avatar with pulsing ring)
- Topic detail drawer (right, 360px, slide-in): description, lessons list, prerequisites, skills gained, related challenges, action button
- Responsive: vertical layout for tablet, list format for mobile
- Route: `/learning-paths`

---

### 15. Profile / Progress
**Status: NOT STARTED** | **Priority: P2**

**Purpose:** User's learning progress, achievements, XP history, activity patterns.

**What's BUILT:**
- Nothing.

**What's MISSING:**
- Profile header (160px): avatar (editable), name, username, member since, level display with XP ring, Edit Profile / Share Profile buttons
- Stats row (4 cards): Total XP with sparkline, Streak (current/best), Designs Created with breakdown, Interview Score with trend
- Charts section (left, 60%, 3 tabs): Progress (radar chart across 12 modules), XP History (line chart, selectable range), Time Spent (stacked bar chart by week)
- Achievements section (right, 40%): badge grid (64x64px, unlocked/locked states, hover tooltips)
- Activity calendar (full width): GitHub-style heatmap (52 weeks), color scale, day tooltips
- Route: `/profile`

---

### 16. Settings
**Status: NOT STARTED** | **Priority: P2**

**Purpose:** Application preferences, account details, AI settings, keybindings.

**What's BUILT:**
- `theme-provider.tsx` -- basic theme provider (light/dark switching exists)
- `ui-store.ts` -- some UI preferences in Zustand

**What's MISSING:**
- Settings navigation (left, 240px): 10 categories (General, Appearance, Editor, Keyboard Shortcuts, AI Assistant, Collaboration, Export & Import, Notifications, Account, Billing)
- General settings: language, region, default module, tutorial tips, telemetry
- Appearance settings: theme selector (3 visual cards), accent color swatches (8 colors), font size slider, code font dropdown, canvas grid toggle, reduced motion toggle
- Editor settings: auto-save interval, snap-to-grid, grid size, default zoom, connection style, minimap, undo limit
- Keyboard shortcuts (embedded shortcut sheet with edit/reset per binding)
- AI Assistant settings: model preference, suggestion toggle, detail level slider, code gen language, credits display
- Collaboration settings: default permission, cursor sharing, join notification, cursor color
- Export & Import settings: default format, quality, annotations toggle, import button
- Notifications: per-category email/in-app/push toggles
- Account: email, password change, connected accounts, 2FA, GDPR export, delete account
- Billing: current plan, usage, upgrade, invoice history
- Route: `/settings`

---

### 17. Collaboration Session
**Status: NOT STARTED** | **Priority: P3**

**Purpose:** Real-time shared editing with live cursors, presence, and chat.

**What's BUILT:**
- `collaboration.ts` schema exists (collab_sessions, collab_participants tables)
- Nothing on the frontend.

**What's MISSING:**
- All collaboration overlay elements: colored cursors with username labels (smoothly interpolated), presence bar (avatars with active/idle rings), component locking indicators, change highlight flashes
- Chat sidebar (320px, toggleable): message area with system messages, @mention support, emoji reactions, input area, send button, attachment button, unread indicator
- Invite dialog (email input, shareable link with permissions, participant list)
- WebSocket integration (PartyKit + Yjs)
- Route: `/editor/[id]?collab=true`

---

### 18. Community Gallery
**Status: NOT STARTED** | **Priority: P2**

**Purpose:** Browse public community designs with social features.

**What's BUILT:**
- Community schema exists (comments, upvotes, reports tables)
- Nothing on the frontend.

**What's MISSING:**
- Top section: title, subtitle, tabs (Trending, Newest, Most Liked, Most Forked, Following), search bar, filter dropdown (category, difficulty, time range)
- Design grid (3 columns): cards (360x380px) with preview image, author row (avatar, username, Follow button), title, description, tags, action row (upvote, comment, fork, bookmark, share)
- Infinite scroll pagination
- Empty states (no designs, no results, no follows)
- Route: `/community`

---

### 19. Share / Export Dialog
**Status: PARTIALLY BUILT** | **Priority: P1**

**Purpose:** Export designs in multiple formats and generate share links.

**What's BUILT:**
- `export-dialog.tsx` -- basic export dialog component
- Export library implementations: `to-json.ts`, `to-mermaid.ts`, `to-plantuml.ts`, `to-terraform.ts`, `to-url.ts`

**What's MISSING:**
- Two-tab structure (Export | Share)
- Format selection grid (8 formats: PNG, SVG, PDF, JSON, Mermaid, Terraform, Draw.io, Clipboard)
- Per-format options: PNG/SVG (scale, background, annotations, metrics), PDF (page size, orientation, cover page, component list), JSON (pretty print, simulation data), Mermaid (diagram type, code preview), Terraform (cloud provider, code preview)
- Share tab: share link with permission/expiration/password options, invite by email, embed code section (iframe with size options), social sharing (Twitter, LinkedIn, Copy Link), OG preview card
- Modal sizing (640px wide, 80vh max, scrollable)

---

### 20. Command Palette (Overlay)
**Status: PARTIALLY BUILT** | **Priority: P1**

**Purpose:** Quick-access command interface (Cmd+K).

**What's BUILT:**
- `command-palette.tsx` -- basic command palette component
- `use-keyboard-shortcuts.ts` -- keyboard shortcut hook
- `palette-items.ts` -- palette item definitions

**What's MISSING:**
- Prefix behavior: `>` for commands, `@` for designs, `#` for templates
- Grouped results with section headers (Recent, Designs, Templates, Modules, Actions)
- Keyboard navigation (Up/Down arrows, Enter to execute, Tab to cycle groups)
- Each result row: icon, name, metadata, shortcut pill for actions
- Footer with tips and keyboard hints
- Fuzzy matching (debounced 100ms)
- No-results state
- Design search integration (once designs exist in DB)
- Responsive: mobile full-width overlay

---

### 21. Onboarding Flow
**Status: NOT STARTED** | **Priority: P2**

**Purpose:** 5-step guided tutorial overlay for first-time users.

**What's BUILT:**
- Nothing.

**What's MISSING:**
- Overlay system with dark backdrop (60% opacity) and spotlight cutouts
- 5 tutorial step cards (420px wide, 12px radius, Primary border, large shadow):
  - Step 1: Welcome (centered, logo animation, name greeting)
  - Step 2: Component Palette (spotlight left panel, interaction required: drag component)
  - Step 3: Canvas Basics (spotlight canvas, interaction required: create connection)
  - Step 4: Properties Panel (spotlight right panel, interaction required: click component)
  - Step 5: Simulate & AI (spotlight toolbar, confetti animation on finish)
- Progress dots (5 dots per step)
- Skip Tutorial option on each step
- Card slide-in transitions (200ms ease-out)
- Onboarding completion tracking (user.onboardingCompletedAt in DB)

---

### 22. Keyboard Shortcut Sheet
**Status: NOT STARTED** | **Priority: P2**

**Purpose:** Searchable reference modal for all keyboard shortcuts.

**What's BUILT:**
- `use-keyboard-shortcuts.ts` implements some shortcuts
- Nothing for the shortcut sheet UI.

**What's MISSING:**
- Modal (720px wide, 80vh max, scrollable)
- Trigger: Cmd+/ or ? (when not in text field)
- Header with search input (real-time filter)
- Category sections: General (10 shortcuts), Canvas Navigation (7), Components (9), Editor Panels (6), Simulation (4), Algorithm Visualizer (7), Export (2)
- Styled key caps (rounded rectangles with shadow, monospace font)
- Footer: "Customize shortcuts in Settings" link, Print button, Mac/Windows OS toggle
- Empty state for no matching search results

---

## Priority Summary

### P0 (Critical Path -- Must Build First)
1. **Screen 2: Home Dashboard** -- Entry point after login
2. **Screen 3: Module Selection** -- Navigation to all modules
3. **Screen 4: System Design Editor** -- Core product (partially built, needs completion)
4. **Screen 10: Interview Challenge** -- Key differentiator (partially built)

### P1 (High Priority -- Core Experience)
5. **Screen 1: Landing Page** -- User acquisition
6. **Screen 5: Algorithm Visualizer** -- Popular module (partially built)
7. **Screen 6: Data Structure Explorer** -- Not started
8. **Screen 7: LLD Studio** -- Not started
9. **Screen 8: Database Lab** -- Not started
10. **Screen 9: Distributed Systems Playground** -- Partially built
11. **Screen 11: Interview Results** -- Completes interview loop
12. **Screen 12: Template Gallery** -- Content discovery
13. **Screen 19: Share/Export Dialog** -- Partially built
14. **Screen 20: Command Palette** -- Partially built

### P2 (Medium Priority -- Enrichment)
15. **Screen 13: Template Detail** -- Deeper content engagement
16. **Screen 14: Learning Path View** -- Guided progression
17. **Screen 15: Profile/Progress** -- Retention and motivation
18. **Screen 16: Settings** -- Customization
19. **Screen 18: Community Gallery** -- Social features
20. **Screen 21: Onboarding Flow** -- First-time experience
21. **Screen 22: Keyboard Shortcut Sheet** -- Power user aid

### P3 (Lower Priority -- Advanced Features)
22. **Screen 17: Collaboration Session** -- Multi-user real-time editing

---

## Cross-Cutting Gaps

### Routing
Zero Next.js App Router pages exist beyond `app/page.tsx`. The entire routing structure needs to be created:
- `/` -- Landing
- `/dashboard` -- Home Dashboard
- `/modules` -- Module Selection
- `/editor/[id]` -- System Design Editor
- `/visualizer/algorithm` -- Algorithm Visualizer
- `/explorer/data-structure` -- Data Structure Explorer
- `/studio/lld` -- LLD Studio
- `/lab/database` -- Database Lab
- `/playground/distributed` -- Distributed Systems Playground
- `/interview/[slug]` -- Interview Challenge
- `/interview/[slug]/results` -- Interview Results
- `/templates` -- Template Gallery
- `/templates/[slug]` -- Template Detail
- `/learning-paths` -- Learning Path View
- `/profile` -- Profile/Progress
- `/settings` -- Settings
- `/community` -- Community Gallery

### Global Shell
The sidebar + top bar global shell (applies to all logged-in screens) is not implemented. This is a prerequisite for screens 2-18.

### Auth Integration
No Clerk integration exists. No sign-in/sign-up flows, no auth middleware, no protected routes.

### Responsive Design
No responsive breakpoints are implemented in any existing components. Every screen needs tablet (768px) and mobile (375px) adaptations.

### Loading/Empty States
No skeleton loading states or empty states exist in any component. Every screen spec defines both.

### Animations
The motion design system tokens exist in CSS but no Framer Motion / motion-react animations are implemented in components.
