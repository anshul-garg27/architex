# Architex — Platform Experience Audit

**Date:** 2026-04-12
**Scope:** Platform-wide connective tissue — not individual modules but the navigation, cross-module flow, unified progress, design system, and infrastructure that holds everything together.
**Method:** Full codebase analysis + live browser testing (from visual audit screenshots)

---

## P1: LANDING / HOME PAGE — Score: 6/10

**What the user sees:** The root URL `/` loads directly into the System Design canvas workspace (the "AppShell"). There is no landing page at `/` — the user lands IN the tool. A separate `/landing` route exists but is not the default.

**What works:**
- Immediately interactive — no gate-keeping, no signup wall
- Onboarding overlay appears for first-time users ("Welcome to Architex" + tutorial)
- The canvas with empty state CTA ("Drag components" / "Browse templates") is clear

**What's missing:**
- No value proposition visible to a first-time visitor ("What does this tool DO?")
- No social proof ("50K students use this")
- No feature showcase for the 13 modules
- Landing page at `/landing` exists separately but isn't the default entry
- PWA install banner distracts from first impression

**What would make it 10/10:** The `/landing` page should be the default for unauthenticated users — a stunning, scroll-driven page showcasing: value proposition, 13 modules, simulation demo GIF, testimonials, "Try it free" CTA. Authenticated users skip to the canvas.

---

## P2: NAVIGATION & INFORMATION ARCHITECTURE — Score: 8/10

**Module Count:** 13 modules, all discoverable from the activity bar

**Navigation Patterns:**
- **Activity Bar** (sidebar desktop / bottom nav mobile): always visible, shows all 13 modules with icons + tooltips
- **Command Palette** (Cmd+K): searches across modules, commands, templates — excellent
- **Module Switcher** (Cmd+1-9): instant keyboard access to first 9 modules
- **URL Routing**: `/modules`, `/dashboard`, `/problems/[slug]`, `/concepts/[slug]`, `/patterns/[slug]`, `/interviews/[company]`, `/blog/[slug]` — comprehensive

**Navigation Tree (from code):**
```
/                          → Canvas workspace (module switcher)
├── /modules               → Module browser (13 modules, search/filter/sort)
├── /dashboard             → Stats hub, skill radar, recommendations
├── /problems/[slug]       → System design problems
├── /lld-problems/[slug]   → Low-level design problems
├── /concepts/[slug]       → Concept explanations
├── /patterns/[slug]       → Design patterns
├── /interviews/[company]  → Company-specific prep
├── /blog/[slug]           → Blog posts
├── /gallery               → Design gallery
├── /team                  → Team page
├── /profile/[username]    → User profile
├── /pricing               → Pricing
├── /landing               → Landing page
├── /settings              → User settings
└── /offline               → PWA offline fallback
```

**What works excellently:**
- Command palette is the best navigation feature — searches everything
- Keyboard shortcuts (Cmd+1-9) for module switching
- Deep-linking to problems, concepts, patterns, and interviews
- `/modules` page with search, filter by category, sort by progress
- 404 and error pages have helpful CTAs

**What's missing:**
- No breadcrumb navigation ("Home > System Design > URL Shortener")
- Browser back/forward after module switching via activity bar goes to the same URL (`/`) since all modules share the same route
- No URL-level distinction between modules (switching from System Design to Algorithms doesn't change the URL from `/`)

---

## P3: CROSS-MODULE EXPERIENCE — Score: 8/10

**The Bridge System is remarkable.** 23+ cross-module connections with a full Bridge Registry, BridgePanel in sidebar, BridgeConsumer with ContextDrawer, breadcrumb trail (ModuleContextBar), and RecommendedBridges in properties panel.

**Cross-Module Connections Found (from bridge-registry.ts):**

| From | To | Bridge Type | In UI? |
|------|----|------------|:------:|
| Algorithms → System Design | Algorithm latency/throughput impact | ✅ Yes |
| Data Structures → System Design | Cache layer, indexing config | ✅ Yes |
| Data Structures → Database | Indexing data structures | ✅ Yes |
| Database → System Design | Schema deployment, index config | ✅ Yes |
| Distributed → System Design | Raft, consistent hashing | ✅ Yes |
| Networking → System Design | gRPC, WebSocket protocols | ✅ Yes |
| Concurrency → System Design | Thread pool, event-loop models | ✅ Yes |
| LLD → System Design | Design patterns, CQRS | ✅ Yes |
| Security → System Design | JWT, mTLS auth | ✅ Yes |
| Interview → System Design | Run simulation scoring | ✅ Yes |
| Knowledge Graph → Distributed | Concept exploration | ✅ Yes |
| Knowledge Graph → Database | Concept exploration | ✅ Yes |

**What works:**
- Bridge links visible in sidebar for current module
- ContextDrawer shows payload context before switching
- Breadcrumb shows "You came from [Source]" with back button
- RecommendedBridges in properties panel shows incoming connections
- CrossModuleStore persists mastery and concept progress

**What's missing:**
- Bridges are one-directional in the UI (no easy way to see ALL connections for a concept)
- No visual graph of all module connections (would help users understand the platform structure)
- Bridge navigation doesn't deep-link into the target module's specific topic

---

## P4: CROSS-MODULE KNOWLEDGE CONNECTIONS — Score: 7/10

The Bridge Registry has 23+ connections, which is more than expected. But some natural connections are missing:

| Missing Connection | Why It Should Exist |
|-------------------|---------------------|
| Consistent Hashing (Distributed) ↔ Hash Ring (Data Structures) | Same concept, different abstraction level |
| B-Tree (Data Structures) ↔ Database Indexes (Database) | B-Tree IS the index |
| Producer-Consumer (Concurrency) ↔ Message Queue (System Design) | Same pattern at different scale |
| TCP Handshake (Networking) ↔ Connection Pool (System Design) | Related concepts |
| Mutex/Semaphore (OS) ↔ Database Locks (Database) | Same concept |
| Load Balancing Algorithms (Algorithms) ↔ Load Balancer (System Design) | Direct implementation |
| Graph algorithms (Algorithms) ↔ Network Routing (Networking) | BFS used for routing |

---

## P5: UNIFIED PROGRESS & STATE — Score: 7/10

**What exists (good):**
- `progress-store.ts` — per-module visit tracking, feature exploration, visit counts
- `cross-module-store.ts` — mastery (theory + practice) per module, concept completion
- `/dashboard` — skill radar (13-module mastery chart), daily challenge, recommendations
- `/modules` — progress bars per module, recently visited
- Activity log with 200-entry ring buffer
- Streak tracking (via streak-protector)
- Achievements system (25+)
- Leaderboard with Elo

**What's missing:**
- No "Continue where you left off" card on root page (just shows empty state or last template)
- No unified recently-visited panel across modules (activity log exists in code but may not be surfaced prominently)
- No weekly/monthly recap email with cross-module stats
- No skill map visualization (the data exists in cross-module-store but the visual is only on dashboard)

---

## P6: UNIFIED SETTINGS & PREFERENCES — Score: 6/10

**What exists:**
- Theme (dark/light/system): persists, consistent everywhere ✅
- Panel sizes: resizable with `react-resizable-panels` ✅
- Keyboard shortcuts: documented in shortcuts dialog ✅

**What's missing:**
- No font size / zoom preference (relies on browser zoom)
- No animation speed preference (motion.ts has springs but no user control)
- No sound preference toggle (sound-engine exists but no setting)
- No notification preference (in-app notifications exist but no control)
- Settings panel is sparse (only theme + about)

---

## P7: DESIGN SYSTEM CONSISTENCY — Score: 8/10

**Consistent across modules:**
- Color tokens (CSS variables from globals.css) — ✅ shared
- Motion system (motion.ts) — ✅ shared
- Activity bar styling — ✅ consistent
- Status bar — ✅ consistent
- Properties panel position — ✅ right panel
- Icon set (lucide-react) — ✅ consistent
- Border-radius — ✅ --radius: 0.5rem
- Spacing — ✅ 4px base grid
- Shadow system — ✅ 4-level scale

**Inconsistent across modules (from prior cross-module audit):**
- Sidebar architecture: ComponentPalette (SD) vs AlgorithmPanel (Algo) vs DSSidebar (DS)
- Canvas controls location: floating toolbar (SD) vs sidebar (Algo) vs header (DS)
- State management: 4 Zustand stores (SD) vs useState hook (Algo, DS)
- Naming conventions: full names (SD) vs abbreviations (DS)
- Empty state design: varies per module
- Loading indicator: varies

---

## P8: PLATFORM PERFORMANCE — Score: 7/10

**Code splitting:** ✅ All 13 modules use `dynamic()` with `ssr: false` — each loaded only when active
**Middleware:** ✅ Rate limiting (100 req/100s), CSP, security headers, cache headers
**Persistence:** ✅ All stores use Zustand persist — survives refresh
**Known issue:** Simulation not stopped on module switch (memory/CPU leak, SDS-123)

---

## P9: PLATFORM INFRASTRUCTURE — Score: 7/10

**What exists:**
- Error handling: Custom error.tsx, global-error.tsx, not-found.tsx ✅
- Analytics: PostHog infrastructure ready (awaiting API key) ✅
- CSP reporting: /api/csp-report (currently broken — 400s) ⚠️
- Security: Rate limiting, CORS, CSP, security headers ✅
- PWA: Install prompt, offline fallback ✅
- Auth scaffold: Clerk routes exist (commented out) ⚠️

**What's missing:**
- No error tracking (Sentry or similar) connected
- CSP report endpoint is broken (all reports return 400)
- Auth not activated (Clerk scaffolded but not enabled)
- No monitoring dashboard

---

## P10: OVERALL EMOTIONAL IMPRESSION

| Quality | Score | Evidence |
|---------|:-----:|---------|
| "This feels like ONE product" | **8/10** | Shared design tokens, motion system, activity bar, and bridge system create strong unity. The bridge breadcrumb ("You came from Algorithms") is particularly impressive. Minor inconsistencies in sidebar and controls per module prevent 9/10. |
| "I know where everything is" | **7/10** | Command palette is excellent. Activity bar shows all modules. But no breadcrumbs, URL doesn't change on module switch, and the relationship between the canvas workspace and content pages (/concepts, /problems) is unclear. |
| "My progress matters" | **7/10** | Dashboard with skill radar, mastery tracking, achievements, streaks, XP — the data is rich. But it's not surfaced prominently enough at the point of need (e.g., no "continue where you left off" on the canvas page). |
| "I want to explore more" | **8/10** | Bridge system naturally leads from one module to another. RecommendedBridges in properties panel suggests connections. The 13-module breadth is impressive and each feels substantive. |
| "I'd recommend this" | **7/10** | Would recommend the System Design canvas specifically (simulation is impressive). The platform as a whole needs the landing page and social sharing to be recommendation-ready. |

**Overall Platform Score: 7.2/10**

---

## GENERATE TASKS

### Priority Summary for Platform Tasks

The platform connective tissue is surprisingly well-built. The bridge system, cross-module store, and dashboard are sophisticated. The main gaps are:

1. **P1:** URL-based module routing (currently all modules share `/`) — prevents bookmarking/sharing specific modules
2. **P1:** "Continue where you left off" on root page
3. **P1:** Fix CSP report endpoint (currently broken)
4. **P2:** Make `/landing` the default for unauthenticated/first-time visitors
5. **P2:** Add breadcrumb navigation within modules
6. **P2:** Add missing bridge connections (7 natural connections missing)
7. **P2:** Expand settings panel (animation speed, sound, notifications)
8. **P3:** Add cross-module concept graph visualization
