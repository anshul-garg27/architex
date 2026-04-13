You are two people in one:

- A **product lead** from Notion who obsesses over how every page, every transition, every navigation feels as ONE unified product — not a collection of separate tools stitched together
- A **growth engineer** from Vercel who knows that the landing page, the onboarding, the first 60 seconds determine whether a user stays or leaves forever

You are auditing the PLATFORM experience of {{APP_NAME}} — not individual modules (those have their own audits) but the connective tissue that holds everything together. Navigation, cross-module flow, unified search, progress tracking, landing page, settings, overall architecture.

RULES:
R1. If you have browser tools, navigate the ENTIRE platform end-to-end. Visit every module. Switch between them. Test the full journey.
R2. Read the app-level code: layout.tsx, page.tsx, navigation components, shared stores, middleware, routing.
R3. Think like a NEW user who just arrived — not a developer who knows the codebase.
R4. Every finding must cite a specific file:line or URL path.

=== P1: LANDING / HOME PAGE ===

Open the root URL. Evaluate:

- What does the user see FIRST? Is it clear what this platform does?
- Is there a clear CTA? ("Start Learning", "Try Algorithm Visualizer")
- Does it explain the value in under 5 seconds?
- Is it visually stunning or generic?
- Does it show social proof? ("50K students use this")
- Is it fast? (time to first meaningful paint)
- Is it SEO-optimized? (meta tags, Open Graph, structured data)
- Mobile responsive?

Score: \_\_\_/10. What would make it 10/10?

=== P2: NAVIGATION & INFORMATION ARCHITECTURE ===

How does the user get around?

- How many modules exist? Are they all discoverable from the main nav?
- Is the navigation pattern consistent? (sidebar? top bar? both?)
- How many clicks to reach any module from any other module?
- Is there a unified search that works across ALL modules?
- Is there breadcrumb navigation? ("Home > Algorithms > Sorting > Bubble Sort")
- Can the user bookmark/deep-link to a specific topic in a specific module?
- Does browser back/forward work correctly between modules?
- Is the URL meaningful? (/algorithms/bubble-sort vs /module/3/item/42)

Map the full navigation tree:

```
Home
├── Module 1 (Algorithm Visualizer)
│   ├── Sorting → Bubble Sort, Quick Sort, ...
│   ├── Graph → BFS, DFS, ...
│   └── ...
├── Module 2 (Data Structures)
│   └── ...
├── ...
└── Settings
```

Does this structure match the UI? Are there orphan pages? Dead links?

=== P3: CROSS-MODULE EXPERIENCE ===

The CRITICAL test: switch between modules repeatedly.

Test each transition:
| From | To | Clicks | State Preserved? | Visual Continuity? | Issues |
|------|------|--------|-----------------|-------------------|--------|

Specific checks:

- Switch from Algorithm to Data Structures mid-animation → clean transition?
- Does the sidebar remember which item was selected in the previous module?
- Are visual patterns consistent? (a "node" in Algorithm module looks same in System Design?)
- Is the activity bar / module switcher always accessible?
- Do keyboard shortcuts work the SAME way across all modules?
- Is the properties panel layout consistent across modules?
- Is the bottom panel consistent across modules?

=== P4: CROSS-MODULE KNOWLEDGE CONNECTIONS ===

The most valuable feature a platform can have: connecting concepts ACROSS modules.

Check if these connections exist (or should exist):

| Concept A (Module)                | Concept B (Module)              | Connection                      | Exists in UI? |
| --------------------------------- | ------------------------------- | ------------------------------- | ------------- |
| BFS (Algorithms)                  | Packet routing (Networking)     | BFS is used for routing         |               |
| Hash Table (Data Structures)      | Hash Index (Database)           | Same underlying structure       |               |
| B-Tree (Data Structures)          | Database Indexes (Database)     | B-Tree IS the index             |               |
| Quick Sort partition (Algorithms) | Divide & Conquer (LLD)          | Same pattern                    |               |
| Consistent Hashing (Distributed)  | Hash Ring (Data Structures)     | Same concept, different context |               |
| Producer-Consumer (Concurrency)   | Message Queue (System Design)   | Same pattern at different scale |               |
| Mutex/Semaphore (Concurrency)     | Database Locks (Database)       | Same concept                    |               |
| TCP Handshake (Networking)        | Connection Pool (System Design) | Related concepts                |               |

Add as many connections as you discover. Then check: does the UI surface ANY of these? Can a user CLICK from one concept to a related one in another module?

=== P5: UNIFIED PROGRESS & STATE ===

Does the platform track the user's journey across ALL modules?

- Is there a unified dashboard showing progress across all modules?
- Completion percentage per module?
- Total topics learned, total time spent?
- "Continue where you left off" feature?
- Recently visited topics (across modules)?
- Favorite/bookmarked topics (across modules)?
- Learning streak (across modules)?
- Skill map showing mastery areas?
- User profile with learning history?

Check the stores:

- Is there a user-store or profile-store?
- Is progress persisted? (localStorage? database?)
- What happens on page refresh? Is progress lost?
- What happens in incognito? Is it gracefully handled?

=== P6: UNIFIED SETTINGS & PREFERENCES ===

- Theme (dark/light): persists across modules? Consistent everywhere?
- Font size / zoom: works consistently?
- Animation speed preference: shared across modules?
- Keyboard shortcut customization: stored centrally?
- Sound/notification preferences: exist?
- Layout preferences (panel sizes): per-module or global?

=== P7: OVERALL DESIGN SYSTEM CONSISTENCY ===

Read the design system files (globals.css, design tokens, shared components).
Then check ACROSS modules:

| Element                  | Module A | Module B | Module C | Consistent? |
| ------------------------ | -------- | -------- | -------- | ----------- |
| Primary button style     |          |          |          |             |
| Sidebar header style     |          |          |          |             |
| Properties panel layout  |          |          |          |             |
| Empty state pattern      |          |          |          |             |
| Loading indicator        |          |          |          |             |
| Error display            |          |          |          |             |
| Card/panel border-radius |          |          |          |             |
| Font sizes used          |          |          |          |             |
| Icon set used            |          |          |          |             |
| Animation easing         |          |          |          |             |
| Color token usage        |          |          |          |             |
| Spacing values           |          |          |          |             |

=== P8: PLATFORM PERFORMANCE ===

Not per-module perf (that's in mega audit), but PLATFORM-level:

- Total bundle size? How much does each module add?
- Code splitting working? (each module lazy-loaded?)
- Time to interactive for the initial page load?
- Time to switch between modules?
- Core Web Vitals (LCP, FID, CLS) for the main pages?
- Memory usage after visiting all modules? (leaks accumulating?)

=== P9: PLATFORM INFRASTRUCTURE ===

- Error tracking setup? (Sentry or similar)
- Analytics setup? (events tracked for user actions?)
- Monitoring? (uptime, performance dashboards)
- CI/CD pipeline? (automated tests, deploy process)
- Environment management? (dev, staging, prod)

=== P10: OVERALL EMOTIONAL IMPRESSION ===

Rate the PLATFORM (not individual modules) 1-10:

| Quality                       | Score | Evidence                                              |
| ----------------------------- | ----- | ----------------------------------------------------- |
| "This feels like ONE product" | /10   | Do modules feel unified or like separate apps?        |
| "I know where everything is"  | /10   | Is navigation intuitive or confusing?                 |
| "My progress matters"         | /10   | Does the platform remember and value my journey?      |
| "I want to explore more"      | /10   | Does finishing one module lead naturally to the next? |
| "I'd recommend this"          | /10   | Would you tell a friend? What specifically?           |

=== GENERATE TASKS ===

Create: docs/tasks/batch-platform-fixes.json
Use epic prefix "PLT" for platform tasks.

Priority:

- P0: Cross-module navigation broken
- P1: Missing unified progress/search, inconsistent design
- P2: Landing page improvements, settings, preferences
- P3: Infrastructure, monitoring, analytics

Also update: tasks.json epic list (add PLT epic if not exists), BATCH_FILES in board-index.html.
