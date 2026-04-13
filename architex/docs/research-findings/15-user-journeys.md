# 15 - User Journey Maps

> 5 persona journeys, onboarding variants, progressive disclosure, and re-engagement triggers.
> Based on analysis of all 8 module files and their user-facing flows.

---

## Available Modules (from source audit)

| Module | Status | Key Interaction |
|--------|--------|----------------|
| System Design (canvas) | Fully functional | Drag-and-drop node placement, edge connections, simulation |
| Algorithms | Fully functional | Sorting visualization with step-by-step playback |
| Distributed Systems | Partially functional | Raft consensus + consistent hashing (4 sims are "coming soon") |
| Networking | Fully functional | TCP, TLS, DNS, HTTP, WebSocket, CORS sequence diagrams |
| OS Concepts | Partially functional | CPU scheduling + page replacement (2 are "coming soon") |
| Concurrency | Fully functional | Race condition, producer-consumer, dining philosophers |
| Interview | Fully functional | Timed challenge mode with checklist |
| Data Structures | Placeholder only | "Coming Soon" |
| LLD | Placeholder only | "Coming Soon" |
| Database Design | Placeholder only | "Coming Soon" |
| Security | Placeholder only | "Coming Soon" |
| ML Design | Placeholder only | "Coming Soon" |

---

## Persona 1: Interview Prep Student (60% of users)

**Profile:** Software engineer with 2-5 years experience. Preparing for FAANG-level system design interviews in the next 2-8 weeks. Has read "Designing Data-Intensive Applications" but struggles to explain designs visually. Willing to pay for tools that give them an edge.

### Screen-by-Screen Flow

#### Visit 1: Discovery (Day 0)

```
Landing Page (future)
  |
  v
[1] First load -> page.tsx renders AppShell
    - Current: Dumps user directly into System Design canvas
    - Needed: First-time detection (localStorage check)
  |
  v
[2] Onboarding Tour (variant A: "Interview Prep" path)
    - Step 1: "Welcome to Architex. Let's get you interview-ready."
    - Step 2: Highlight Activity Bar -> "Switch between learning modules"
    - Step 3: Highlight Interview module icon -> "Start timed challenges"
    - Step 4: Highlight System Design module -> "Build diagrams interactively"
    - Step 5: "Let's start with a quick challenge!" -> Auto-navigate to Interview module
  |
  v
[3] Interview Module -> ChallengeBrowser
    - Sees grid of ChallengeCards (from InterviewModule.tsx:281-301)
    - Filters by difficulty (stars 1-5)
    - Selects "Design a URL Shortener" (difficulty 2, 30 min)
  |
  v
[4] ChallengeView (InterviewModule.tsx:132-277)
    - Reads description and requirements
    - Sees checklist items (not toggleable -- gap #69)
    - Clicks "Start" -> Timer begins counting
    - Reads hints (progressive reveal via <details>)
  |
  v
[5] Switches to System Design module (Activity Bar click)
    - CRITICAL MOMENT: Timer keeps running? (Currently: timer state lost on module switch -- gap #86)
    - Needed: Timer persists, shows in StatusBar
  |
  v
[6] DesignCanvas (empty)
    - Current: Empty canvas with dots. No guidance.
    - Needed: "Drag components from sidebar" prompt (gap #21)
    - Drags "Load Balancer" from ComponentPalette
    - Drags "API Server", "Database", "Cache"
    - Connects with edges
  |
  v
[7] PropertiesPanel (selects a node)
    - Configures Load Balancer: algorithm=round-robin, replicas=3
    - No save feedback (gap #47)
  |
  v
[8] BottomPanel -> Metrics tab
    - No simulation running, so MetricsDashboard is empty
    - Timeline tab: can click Play to start simulation
  |
  v
[9] Timer hits 30:00 -> No notification (gap #48)
    - Timer turns red (overtime indicator exists)
    - User finishes, goes back to challenge
    - Cannot check off checklist items (gap #69)
```

#### Critical Moments (risk of abandonment)

| Moment | Risk | Mitigation |
|--------|------|------------|
| First load, empty canvas | "I don't know what to do" -> bounce | Onboarding tour + empty state CTA |
| Timer lost on module switch | "This tool is broken" -> frustration | Persist timer in global store + StatusBar |
| No save on refresh | "I lost my work" -> never return | IndexedDB auto-save |
| Can't export diagram | "Can't share with mock interviewer" -> limited value | Export to image, Mermaid, share URL |
| Checklist not interactive | "Why can't I check things off?" -> feels unfinished | Make checklist stateful |

#### Retention Hooks

1. **Streak counter**: "You've practiced 3 days in a row" -- localStorage tracking
2. **Progress dashboard**: X/N challenges completed, average time vs target
3. **Spaced repetition**: "It's been 7 days since you practiced URL Shortener. Revisit?"
4. **Community rankings**: Anonymous leaderboard by challenge completion time

#### Monetization Trigger

- Free: 3 challenges, basic components, no export
- Wall hit: "Upgrade to Pro for all 20+ challenges, advanced components, and PDF export"
- Timing: Show upgrade prompt after completing 3rd free challenge

---

## Persona 2: Senior Engineer Refresher

**Profile:** Staff/Principal engineer with 10+ years. Hasn't interviewed in 3 years. Needs to refresh system design vocabulary and practice whiteboarding. Already knows the concepts but needs practice articulating them.

### Screen-by-Screen Flow

#### Visit 1: Skip-to-Advanced (Day 0)

```
[1] First load
    - Onboarding variant B: "I know the basics" option
    - Skip tour, go directly to System Design canvas
  |
  v
[2] System Design Canvas
    - Immediately starts building (knows drag-and-drop)
    - Builds complex architecture: microservices + message queues + caches
    - Wants auto-layout (gap -- Category 3, file 14)
    - Manually positions 15+ nodes
  |
  v
[3] Simulation
    - Starts simulation via BottomPanel Timeline
    - Watches traffic flow through system
    - Injects chaos (via future chaos panel)
    - Evaluates system resilience
  |
  v
[4] Export
    - Wants to export to Mermaid for blog post
    - Wants to share URL with colleague for feedback
    - Uses Command Palette (Cmd+K) to find export action
  |
  v
[5] Distributed Systems module
    - Selects Raft Consensus to refresh understanding
    - Steps through leader election
    - Crashes a node, watches re-election
    - Switches to Consistent Hashing
  |
  v
[6] Interview module (Day 3)
    - Picks "Design a Distributed Cache" (difficulty 4)
    - Uses timed mode to practice under pressure
    - Completes in 38 minutes (target: 45)
```

#### Key Differences from Persona 1

| Aspect | Interview Prep Student | Senior Refresher |
|--------|----------------------|------------------|
| Onboarding | Full tour needed | Skip to canvas |
| Starting module | Interview challenges | System Design canvas |
| Component usage | Basic (LB, server, DB) | Advanced (message queues, CDN, rate limiter) |
| Simulation depth | Surface-level metrics | Chaos injection, failure modes |
| Export needs | Share with interviewer | Blog posts, team documentation |
| Retention hook | Streak counter | Challenge difficulty escalation |

#### Hard Challenges Needed

1. "Design a globally distributed database" (difficulty 5, 60 min)
2. "Design a real-time collaborative editor" (difficulty 5, 60 min)
3. "Design ML inference at scale" (difficulty 4, 45 min)
4. "Design a multi-region payment system" (difficulty 5, 60 min)

---

## Persona 3: CS Student Explorer

**Profile:** Undergraduate CS student (sophomore/junior). Taking data structures and algorithms courses. Heard about system design from seniors preparing for internships. Primarily interested in algorithm visualization.

### Screen-by-Screen Flow

#### Visit 1: Algorithm-First (Day 0)

```
[1] First load
    - Onboarding variant C: "I'm learning CS fundamentals"
    - Tour highlights: Algorithms module -> OS module -> Networking module
    - Skips System Design (too advanced for now)
  |
  v
[2] Algorithm Module (primary home)
    - AlgorithmPanel sidebar shows sorting algorithms
    - Generates random array (default: 20 elements)
    - Selects "Bubble Sort"
    - Clicks Run -> Watches step-by-step animation
    - AlgorithmProperties panel shows:
      - Time complexity: O(n^2) avg
      - Space complexity: O(1)
      - Stable: Yes
      - Pseudocode with highlighted current line
  |
  v
[3] Compares algorithms
    - Runs Merge Sort on same array
    - Notes fewer comparisons
    - Wants side-by-side comparison (not available -- future feature)
    - Manually switches between algorithms
  |
  v
[4] Discovers Networking module (Week 2)
    - Clicks Networking icon in Activity Bar
    - Sees TCP Handshake sequence diagram
    - Steps through SYN -> SYN-ACK -> ACK
    - Explores TLS 1.3, DNS resolution
    - "Oh, THIS is what my networking class is about"
  |
  v
[5] Discovers OS module (Week 3)
    - CPU Scheduling: configures 4 processes
    - Runs FCFS, SJF, Round Robin
    - Compares Gantt charts and metrics
    - Page Replacement: enters reference string
    - Steps through FIFO, LRU, Optimal
  |
  v
[6] Discovers System Design (Week 6)
    - After learning distributed concepts via Distributed module
    - Starts with simple: "Client -> Server -> Database"
    - Gradually adds complexity
    - "Now I understand what senior engineers talk about"
```

#### Discovery Path

```
Week 1-2:  Algorithms (sorting) -----> Data Structures (future)
              |
Week 3-4:  OS Concepts + Concurrency
              |
Week 5-6:  Networking + Distributed
              |
Week 7+:   System Design (the payoff)
```

#### Retention Hooks for CS Students

1. **Concept map**: Visual graph showing which topics they've explored (nodes light up)
2. **"Study mode"**: Algorithm comparison table auto-generated from their runs
3. **Course alignment**: "This maps to CS 161: Operating Systems, Week 7"
4. **Shareable progress**: "I've explored 40/60 CS concepts on Architex"

---

## Persona 4: Team Lead / Hiring Manager

**Profile:** Engineering manager at mid-stage startup (50-200 eng). Evaluating tools for: (a) team onboarding documentation, (b) interview pipeline standardization, (c) team training on system design.

### Screen-by-Screen Flow

#### Visit 1: Evaluation (Day 0)

```
[1] Landing page (future) -> Pricing page
    - Compares Free vs Pro vs Team
    - Team plan: $25/user/mo, SSO, team dashboard, shared challenges
    - Clicks "Start free trial" (14 days)
  |
  v
[2] Team Setup (future)
    - Creates team: "Acme Engineering"
    - Invites 3 engineers for pilot
    - Configures SSO (future: SAML/OIDC)
  |
  v
[3] System Design canvas
    - Builds reference architecture for their service
    - Exports as documentation (Mermaid/image)
    - Shares with team
  |
  v
[4] Interview module (Day 3)
    - Wants to assign challenges to candidates
    - Needs: Assignment system (email link with challenge + time limit)
    - Needs: Candidate view (no account required, timed session)
    - Needs: Submission review (see their canvas + time taken)
  |
  v
[5] Team Dashboard (Day 7)
    - Sees: team members' activity, challenges completed, time distributions
    - Assigns "mandatory" challenges for new hires
    - Creates custom challenges from templates
  |
  v
[6] Purchase decision (Day 14)
    - Trial ending -> conversion prompt
    - Decision factors: team adoption rate, candidate experience quality
```

#### Features Needed (Not Built)

| Feature | Priority | Effort |
|---------|----------|--------|
| Pricing page | P0 | 8h |
| Team creation / management | P0 | 16h |
| User authentication (SSO) | P0 | 24h |
| Team dashboard | P1 | 16h |
| Challenge assignment | P1 | 12h |
| Candidate link (no account) | P1 | 8h |
| Submission review | P2 | 12h |
| Custom challenge creation | P2 | 16h |
| Usage analytics for team | P2 | 8h |

---

## Persona 5: Open Source Contributor

**Profile:** Developer who finds Architex on GitHub. Wants to contribute a new module (e.g., Database Design visualization) or fix a bug. Needs clear contribution path.

### Journey

```
[1] Finds GitHub repo
    - README.md exists (confirmed by audit)
    - CONTRIBUTING.md does NOT exist (gap)
    - LICENSE does NOT exist (gap)
    - .github/ does NOT exist (no issue/PR templates)
  |
  v
[2] Tries to set up locally
    - README.md has setup instructions (assumed)
    - .env.example does NOT exist (gap) -- will they know what env vars are needed?
    - Runs `npm install` then `npm run dev`
    - package.json scripts: only dev/build/start/lint (no test, no typecheck)
  |
  v
[3] Wants to understand architecture
    - STATE_ARCHITECTURE.ts is 800+ lines of design documentation (great)
    - But it's a .ts file with comments, not proper docs
    - No architecture decision records (ADRs)
    - No component hierarchy diagram
  |
  v
[4] Picks an issue to work on
    - No GitHub issues exist (no `.github/` directory)
    - No "good first issues" labels
    - No issue templates
  |
  v
[5] Makes a change
    - No test suite exists (`test` script not in package.json)
    - No CI/CD pipeline (no `.github/workflows/`)
    - Cannot verify their change doesn't break anything
    - Submits PR with no template guidance
  |
  v
[6] PR review
    - No code owners file
    - No PR template
    - No automated checks (lint, typecheck, tests)
```

#### Contributor Experience Gaps

| Gap | Impact | Fix |
|-----|--------|-----|
| No CONTRIBUTING.md | Contributors don't know how to help | Write comprehensive guide |
| No LICENSE | Legal uncertainty blocks contributions | Add AGPL-3.0 |
| No .github/ directory | No templates, no CI/CD | Create full .github structure |
| No test suite | Can't verify changes | Add Vitest + Testing Library |
| No .env.example | Setup confusion | Document all environment variables |
| No architecture docs | Hard to understand codebase | Convert STATE_ARCHITECTURE.ts to proper docs |

---

## First-Time User Detection Logic

```typescript
// src/lib/onboarding.ts

interface OnboardingState {
  hasVisited: boolean;
  onboardingVariant: 'interview-prep' | 'senior' | 'student' | null;
  onboardingCompleted: boolean;
  tourStep: number;
  modulesVisited: Set<string>;
  firstVisitTimestamp: number;
}

function detectFirstTimeUser(): boolean {
  return !localStorage.getItem('architex:hasVisited');
}

function markVisited(): void {
  localStorage.setItem('architex:hasVisited', 'true');
  localStorage.setItem('architex:firstVisit', Date.now().toString());
}

function getOnboardingVariant(): string | null {
  return localStorage.getItem('architex:onboardingVariant');
}

function setOnboardingVariant(variant: string): void {
  localStorage.setItem('architex:onboardingVariant', variant);
}
```

---

## 3 Onboarding Variants

### Variant A: Interview Prep (Default)

| Step | UI Element | Action | Tooltip Text |
|------|-----------|--------|-------------|
| 1 | Welcome modal | Choice of 3 paths | "What brings you to Architex?" |
| 2 | Activity Bar (Interview icon) | Pulse highlight | "Start with timed system design challenges" |
| 3 | Challenge card | Auto-highlight first challenge | "Try a 30-minute challenge to see how it works" |
| 4 | Timer + Start button | Highlight | "Click Start when you're ready. The timer is your friend." |
| 5 | Activity Bar (System Design) | Highlight | "Switch here to build your design on the interactive canvas" |

### Variant B: Senior / Skip Onboarding

| Step | UI Element | Action | Tooltip Text |
|------|-----------|--------|-------------|
| 1 | Welcome modal | "I know the basics" button | Skips to step 2 |
| 2 | Canvas | Quick 2-step intro | "Drag components from the left. Connect them with edges." |
| 3 | Command Palette | Flash Cmd+K | "Use Cmd+K for quick actions: export, templates, search" |

### Variant C: CS Student

| Step | UI Element | Action | Tooltip Text |
|------|-----------|--------|-------------|
| 1 | Welcome modal | "I'm learning CS" button | Routes to Algorithm module |
| 2 | Algorithm sidebar | Highlight algo list | "Pick any sorting algorithm to see it visualized" |
| 3 | Generate Array button | Highlight | "Generate a random array and hit Run" |
| 4 | Properties panel | Highlight complexity | "See time and space complexity here" |
| 5 | Activity Bar | Highlight all modules | "Explore OS, Networking, and more when you're ready" |

---

## Progressive Disclosure Strategy

### Level 1: Visible on First Visit
- Activity bar (all module icons)
- Sidebar (module-specific content)
- Canvas (main interaction area)
- Command Palette (Cmd+K)

### Level 2: Discovered After First Module Interaction
- Properties panel (opens on first node selection)
- Bottom panel (opens on first simulation start)
- Export functionality (visible after first node placed)

### Level 3: Power User Features (After 3+ Sessions)
- Keyboard shortcuts overlay (? key)
- Template browser
- Import from file/clipboard
- Simulation chaos injection
- Advanced component configurations

### Level 4: Team/Pro Features (After upgrade)
- Collaboration (real-time cursors)
- Version history
- Custom templates
- Team dashboard
- Challenge assignment

---

## Re-Engagement Triggers (Per Persona)

### Interview Prep Student
| Trigger | Channel | Timing |
|---------|---------|--------|
| "Your interview is in {N} days -- practice today" | Push/Email | If user set interview date |
| "New challenge: Design a Rate Limiter" | Email | Weekly new content |
| "3-day streak broken! Keep your momentum" | Push | Day after missed session |
| "You scored 70% on URL Shortener. Retry for 90%?" | In-app | On return visit |

### Senior Engineer Refresher
| Trigger | Channel | Timing |
|---------|---------|--------|
| "New advanced challenge: Multi-Region Payment System" | Email | Bi-weekly |
| "Your Raft knowledge might be rusty -- 7 days since last practice" | In-app | On return visit |
| "Export your designs as documentation" | In-app tooltip | After 3rd diagram |

### CS Student Explorer
| Trigger | Channel | Timing |
|---------|---------|--------|
| "You mastered Sorting. Ready for Graph Algorithms?" | In-app | After completing all sorting |
| "Your classmates are exploring Networking -- try it" | Email | If cohort tracking enabled |
| "New module: Data Structures (Binary Trees, Heaps)" | Email | On module launch |

### Team Lead
| Trigger | Channel | Timing |
|---------|---------|--------|
| "3/5 team members completed this week's challenge" | Email | Weekly digest |
| "New hire John hasn't started onboarding challenges" | Dashboard | Real-time |
| "Trial ending in 3 days -- {team adoption metrics}" | Email | Day 11 of trial |

### OSS Contributor
| Trigger | Channel | Timing |
|---------|---------|--------|
| "Good first issue: Add skeleton loading states" | GitHub | Issue created |
| "Your PR was reviewed -- changes requested" | GitHub notification | On review |
| "New module planned: Database Design -- call for contributors" | GitHub Discussion | Monthly |
