# Research Files Audit: Complete Inventory & Priority Analysis

> Audit of all 36 research files in `/research/`.
> Each file summarized with key findings and top 3 actionable items.
> All findings organized into priority tiers.

---

# Complete File Inventory

## Core Platform Research (Files 01-04)

### 01-dsa-visualization-platforms.md
**Summary**: Comprehensive analysis of VisuAlgo, Algorithm Visualizer, USFCA, Red Blob Games, and Python Tutor. Identifies the critical gap that no existing tool combines a code editor, step-through visualization, and memory model in one interface.
**Top 3 Actionable Items**:
1. Implement synchronized code highlighting with visualization (the primary differentiator)
2. Support custom input for every algorithm (most competitors use fixed inputs)
3. Add comparison mode for side-by-side algorithm execution

### 02-system-design-tools.md
**Summary**: Reviews paperdraw.dev, Excalidraw, draw.io, Miro, and chaos engineering tools. Identifies 17 features that no existing tool has built, including CAP theorem sandbox, auto-scaling simulation, and cost modeling.
**Top 3 Actionable Items**:
1. Build the WASM simulation engine (nothing like it exists in the market)
2. Implement chaos engineering injection (unique selling point)
3. Add real-time metrics dashboard during simulation

### 03-lld-os-database-tools.md
**Summary**: Analyzes PlantUML, Mermaid, StarUML, OSTEP simulators, and dbdiagram.io. Provides best-in-class feature comparison per category.
**Top 3 Actionable Items**:
1. Offer bidirectional diagram-to-code generation (most tools are one-way)
2. Include interactive state machine simulation (not just static diagrams)
3. Implement normalization step-through (currently only in academic tools)

### 04-tech-stack-recommendations.md
**Summary**: Complete tech stack specification with React Flow, Motion, Monaco, shadcn/ui, Zustand, Dexie, WASM. Includes version numbers, bundle sizes, and rationale for every choice.
**Top 3 Actionable Items**:
1. Use React Flow v12 with custom node/edge types for canvas
2. Use Zustand with atomic stores separated by update frequency
3. Use WASM (Rust via wasm-pack) for simulation engine performance

## Domain-Specific Research (Files 05-09)

### 05-networking-security-viz.md
**Summary**: Reviews TCP, TLS, DNS, OAuth, JWT, and CORS visualization tools. Identifies 6 major gaps including no HTTP/3 comparison tool and no CORS simulator.
**Top 3 Actionable Items**:
1. Build HTTP/1.1 vs 2 vs 3 side-by-side comparison with packet loss toggle
2. Create interactive CORS simulator with pass/fail for different configurations
3. Animate TLS 1.3 with key derivation tree (no existing tool shows this)

### 06-concurrency-ml-devops.md
**Summary**: Analyzes thread visualization tools, TensorFlow Playground, Argo CD, and Kubernetes dashboards. Finds that no interactive concurrency visualizer exists -- this is the biggest market gap.
**Top 3 Actionable Items**:
1. Build event loop visualization (call stack + microtask + macrotask queues)
2. Create race condition demo with interleaved execution
3. Enhance TF Playground with CNN, Dropout, BatchNorm, and 3D loss landscape

### 07-interview-gamification.md
**Summary**: Reviews interviewing.io, Pramp, Exponent, Liveblocks, and Yjs. Key insight: "System design prep is where coding prep was 10 years ago."
**Top 3 Actionable Items**:
1. Implement AI-powered evaluation with Claude API (no competitor does this)
2. Add spaced repetition (FSRS) for concept retention
3. Build gamification (XP, streaks, achievements, leaderboards)

### 08-distributed-systems-algorithms.md
**Summary**: Tiered quality ranking of every distributed systems visualization tool for Raft, Paxos, CRDTs, consistent hashing, gossip, and vector clocks.
**Top 3 Actionable Items**:
1. Build Raft consensus as the centerpiece (full sandbox with 3/5/7 nodes)
2. Add consistent hashing ring with virtual nodes toggle
3. Implement CRDT merge visualization with 3 replicas

### 09-real-world-case-studies.md
**Summary**: 55+ real-world system architectures (Netflix, Twitter, Uber, etc.) with full component breakdowns and simulation targets per system.
**Top 3 Actionable Items**:
1. Create 30 starter templates derived from these case studies
2. Include interview talking points for each template
3. Add chaos scenarios specific to each architecture

## Implementation Research (Files 10-15)

### 10-uiux-developer-tools.md
**Summary**: Analysis of Linear, Vercel, Raycast UI patterns. Recommends cmdk + react-resizable-panels + Lucide icons + Geist font for the command palette, keyboard-first developer tool experience.
**Top 3 Actionable Items**:
1. Build Command Palette with cmdk (Cmd+K) as primary navigation
2. Use react-resizable-panels for VS Code-style panel management
3. Implement 13px base font size (Linear/VS Code density)

### 11-animation-visualization-techniques.md
**Summary**: Covers particle flow, SVG vs Canvas rendering, spring physics, and LOD (Level of Detail) rendering. Proposes a 4-layer hybrid rendering architecture for 60fps.
**Top 3 Actionable Items**:
1. Use Canvas 2D for particle rendering (not DOM -- performance critical)
2. Implement LOD system (3 detail levels based on zoom)
3. Use spring physics for organic movement, tween for predictable timing

### 12-export-sharing-persistence.md
**Summary**: Evaluates SnapDOM, lz-string, Yjs, browser-fs-access, OPFS, and oEmbed. Recommends Yjs + y-webrtc for P2P collaboration.
**Top 3 Actionable Items**:
1. Use lz-string for URL-based sharing of small diagrams
2. Use IndexedDB (via Dexie) for local persistence (not localStorage)
3. Use Yjs for real-time collaboration with CRDT conflict resolution

### 13-competitive-analysis.md
**Summary**: Analyzes 20+ platforms with pricing, features, and gaps. Identifies 10 critical market gaps and a comprehensive pricing comparison table.
**Top 3 Actionable Items**:
1. Price at $12/mo Pro (undercut competitors at $149-349/yr)
2. Open source core under AGPL-3.0 (no competitor does this)
3. Target the "interactive simulation" gap (no competitor simulates systems)

### 14-accessibility-performance.md
**Summary**: WCAG 2.2 compliance guide, keyboard navigation patterns, colorblind-safe palettes, and React performance optimizations. Includes spatial keyboard nav algorithm.
**Top 3 Actionable Items**:
1. Implement spatial arrow-key navigation for canvas nodes
2. Use IBM colorblind-safe palette as default
3. Separate stores by update frequency (viewport 60fps vs nodes 1-10fps)

### 15-testing-deployment.md
**Summary**: Complete CI/CD pipeline specification with Vitest, Playwright, Storybook, GitHub Actions, Tauri v2, Docker, and Vercel configurations.
**Top 3 Actionable Items**:
1. Set up Vitest with happy-dom for unit tests
2. Use Playwright for E2E testing of canvas interactions
3. Configure size-limit CI checks for bundle regression prevention

## Advanced Research (Files 16-21)

### 16-queuing-theory-simulation-math.md
**Summary**: The mathematical foundation for realistic simulation: M/M/1, M/M/c, USL (Universal Scalability Law), Little's Law, tail latency, and cascading failure models. This is what separates a toy simulation from a credible one.
**Top 3 Actionable Items**:
1. Implement all queuing models in Rust/WASM for performance
2. Use lognormal distribution for latency (not normal -- real systems are skewed)
3. Model cascading failures with queue overflow propagation

### 17-ai-integration-strategy.md
**Summary**: 4-phase AI strategy using Claude API for review, Socratic tutoring, diagram generation. Cost estimate: $0.02-0.05 per interview session with prompt caching.
**Top 3 Actionable Items**:
1. Use Claude Sonnet for evaluation, Haiku for hints (cost optimization)
2. Implement 3-tier hint system (nudge, guided question, teaching)
3. Use prompt caching for rubric + reference solution (63% cost savings)

### 18-microservices-patterns.md
**Summary**: 29 microservices patterns documented (Saga, CQRS, CDC, Circuit Breaker, Rate Limiting, etc.) each with simulation ideas and configurable parameters.
**Top 3 Actionable Items**:
1. Implement Circuit Breaker as visual state machine (closed/open/half-open)
2. Animate Saga compensation flow (forward + reverse on failure)
3. Include pattern detection in AI evaluation feedback

### 19-onboarding-plugins-mobile.md
**Summary**: React Joyride for onboarding, iframe-sandboxed plugin architecture (Figma-style), touch gestures, and PWA configuration. Progressive disclosure strategy.
**Top 3 Actionable Items**:
1. Build 90-second guided onboarding to first "aha" moment
2. Use iframe sandbox for plugin security isolation
3. Implement PWA with offline support

### 20-advanced-dsa-competitive.md
**Summary**: 15 advanced data structures (Skip List, Bloom Filter, LSM Tree, HyperLogLog, FFT, HLD) and 10 competitive programming algorithms with visualization specs.
**Top 3 Actionable Items**:
1. Implement Bloom Filter and HyperLogLog (most requested for system design)
2. Implement LSM Tree visualization (critical for database understanding)
3. Add competitive programming algorithms as advanced content

### 21-benchmarks-real-world-numbers.md
**Summary**: Exact latency numbers, throughput benchmarks, cloud costs, and scale numbers for realistic simulation defaults. Jeff Dean's numbers and real-world measurements.
**Top 3 Actionable Items**:
1. Hardcode these numbers as simulation defaults in component registry
2. Use them for capacity planning calculator accuracy
3. Reference them in interview talking points

## Design System & Architecture Research (Files 22-series)

### 22-architex-design-system.md (61KB)
**Summary**: The complete design system specification with color tokens, typography, spacing, and component styles for dark and light themes.
**Top 3 Actionable Items**:
1. Implement as CSS custom properties in globals.css
2. Map to Tailwind config for utility class usage
3. Include light theme as well as dark theme default

### 22-landing-page-design.md
**Summary**: Landing page design direction: "Linear-style dark theme + Stripe-level animation polish + Excalidraw's product-as-hero philosophy."
**Top 3 Actionable Items**:
1. Use WebGL gradient mesh background for hero section
2. Make the product itself the hero (embedded mini-simulator)
3. Target 8%+ signup conversion rate

### 22-sound-microinteractions-polish.md
**Summary**: Sound design and micro-interaction specifications for the platform.
**Top 3 Actionable Items**:
1. Add subtle sound effects for key interactions (optional, off by default)
2. Implement haptic-like micro-interactions (scale, bounce)
3. Use prefers-reduced-motion to disable all non-essential motion

### 22-canvas-editor-ui-deep-dive.md
**Summary**: Deep analysis of canvas editor UI patterns from Figma, Excalidraw, and other tools.
**Top 3 Actionable Items**:
1. Implement snap-to-grid with visual guides during drag
2. Add magnetic connection handles that snap to compatible ports
3. Support multi-select with rubber band and Shift+click

### 22-auth-security-compliance.md
**Summary**: Authentication, security, and compliance considerations including CVE-2025-29927 middleware bypass.
**Top 3 Actionable Items**:
1. ALWAYS call requireAuth() in route handlers (never rely on middleware alone)
2. Validate and sanitize all user input with Zod + DOMPurify
3. Never prefix API keys with NEXT_PUBLIC_

### 22-backend-infrastructure.md
**Summary**: Backend infrastructure architecture including Neon Postgres, Inngest jobs, and edge functions.
**Top 3 Actionable Items**:
1. Use Neon for serverless Postgres with connection pooling
2. Use Inngest for background jobs (email sequences, analytics aggregation)
3. Deploy to Vercel with edge functions for low-latency API

### 22-search-social-integrations.md
**Summary**: Search (FlexSearch offline, Meilisearch cloud), social features, and 17 integration points with priority matrix.
**Top 3 Actionable Items**:
1. Use FlexSearch for offline client-side search
2. Build self-hosted feed (not GetStream -- cost savings)
3. Prioritize VS Code and GitHub integrations first

### 22-content-pipeline-specification.md
**Summary**: Complete content pipeline: CMS selection, template JSON schema, QA process, community workflow, SRS/quiz design, AI-assisted authoring.
**Top 3 Actionable Items**:
1. Use Velite+JSON hybrid for content management
2. Implement 5-gate QA process for challenge quality
3. Use AI to generate draft challenges (then human review)

## Growth & Strategy Research (Files 26, 31, 32)

### 26-monetization-community-strategy.md
**Summary**: Pricing tiers, open source strategy, launch playbook, and growth tactics. AGPL-3.0 core, $12/mo Pro, coordinated PH + HN launch.
**Top 3 Actionable Items**:
1. Ship free tier first (build user base before monetization)
2. Launch on Product Hunt Tuesday at 00:01 PST
3. Prepare 10 "Show HN" angles for Hacker News

### 31-seo-content-growth.md
**Summary**: SEO and content growth strategy for programmatic pages.
**Top 3 Actionable Items**:
1. Generate 270+ programmatic SEO pages (problems, concepts, cheatsheets)
2. Create dynamic OG images for social sharing
3. Target long-tail keywords ("design [X] system design interview")

### 32-analytics-email-notifications.md
**Summary**: Analytics, email, and notification infrastructure.
**Top 3 Actionable Items**:
1. Use PostHog for product analytics (self-hostable)
2. Use Resend for transactional email with React Email templates
3. Implement smart notification center with real-time updates

## Review & Hardening Research (Files 40-50)

### 40-devils-advocate-review.md
**Summary**: Devil's advocate review challenging architectural decisions.
**Top 3 Actionable Items**:
1. Address WASM cold start concern (preload during idle)
2. Validate React Flow performance at 500+ nodes
3. Stress-test Yjs conflict resolution under high concurrency

### 41-defense-architect-counter.md
**Summary**: Counter-arguments and defenses against the devil's advocate review.
**Top 3 Actionable Items**:
1. Implement LOD system to handle 500+ nodes gracefully
2. Use OffscreenCanvas for minimap rendering
3. Add automatic animation degradation below 45fps

### 42-chief-architect-final-review.md
**Summary**: Final architectural review and sign-off.
**Top 3 Actionable Items**:
1. Finalize state architecture with Command Bus pattern
2. Confirm module isolation with lazy loading
3. Validate persistence strategy (IndexedDB + auto-save)

### 43-security-threat-model.md
**Summary**: Comprehensive security threat model identifying 29 vulnerabilities.
**Top 3 Actionable Items**:
1. Fix 5 CRITICAL vulnerabilities before any public launch
2. Implement prompt injection prevention in AI endpoints
3. Add rate limiting to all API endpoints

### 44-scalability-breaking-points.md
**Summary**: Scalability analysis identifying breaking points and mitigation strategies.
**Top 3 Actionable Items**:
1. Cap canvas at 500 nodes with LOD degradation
2. Limit simulation to 2000 concurrent particles
3. Cap undo history at 10MB with oldest-first eviction

### 50-content-growth-task-list.md
**Summary**: Content growth task list for post-launch activities.
**Top 3 Actionable Items**:
1. Publish 10 seed blog posts before launch
2. Create tutorial video series (5 videos)
3. Build community challenge creation workflow

---

# Priority Tier Organization

## P0 CRITICAL (Ship-Blocking)

These must be complete before any public launch:

1. **Security: requireAuth() on every server boundary** (43-security-threat-model) -- CVE-2025-29927 bypass risk
2. **Security: XSS sanitization with DOMPurify + Zod** (43-security-threat-model) -- User content injection risk
3. **Security: API key protection** (43-security-threat-model) -- Never expose API keys client-side
4. **Security: Prompt injection prevention** (43-security-threat-model) -- AI evaluation endpoint protection
5. **Performance: React Flow 500+ node handling** (44-scalability-breaking-points) -- Core UX broken without this
6. **Core Tech: WASM simulation engine** (02-system-design-tools, 16-queuing-theory) -- Primary differentiator
7. **Core Tech: React Flow canvas with custom nodes** (04-tech-stack) -- Foundation for everything
8. **Core Tech: Zustand stores with atomic separation** (04-tech-stack, 14-accessibility-performance) -- Prevents re-render cascade
9. **Design System: CSS custom properties and Tailwind config** (22-architex-design-system) -- Visual foundation
10. **Auth: Clerk integration with requireAuth pattern** (22-auth-security-compliance) -- User management

## P1 HIGH (Needed for Launch)

These are essential for a competitive launch:

1. **Simulation: All 8 queuing models** (16-queuing-theory) -- Realistic simulation is the USP
2. **Simulation: 52 chaos engineering events** (02-system-design-tools) -- Key differentiator
3. **Components: 60+ system design components** (02-system-design-tools) -- Complete component palette
4. **Templates: 30 starter templates from real architectures** (09-real-world-case-studies) -- Immediate value
5. **AI: Claude evaluation with 6-dimension scoring** (17-ai-integration-strategy) -- Core interview prep value
6. **Interview: 246 challenges across 12 modules** (07-interview-gamification) -- Content depth
7. **Algorithms: 15 sorting + 22 graph + playback controller** (01-dsa-visualization) -- Phase 3 MVP
8. **Export: JSON + PNG + Mermaid** (12-export-sharing) -- Minimum viable export suite
9. **Landing Page: High-converting with product-as-hero** (22-landing-page-design) -- Growth engine
10. **SEO: 270+ programmatic pages** (31-seo-content-growth) -- Organic acquisition
11. **Accessibility: Keyboard navigation + screen reader support** (14-accessibility-performance) -- Inclusive design
12. **Performance: FCP < 1.2s, LCP < 2.5s, 60fps canvas** (14-accessibility-performance) -- UX quality gate

## P2 MEDIUM (Post-Launch Growth)

These accelerate growth but can ship iteratively:

1. **Collaboration: Yjs + PartyKit real-time multiplayer** (12-export-sharing, 07-interview-gamification)
2. **Gamification: XP, streaks, achievements, leaderboards** (07-interview-gamification)
3. **Spaced Repetition: FSRS-4.5 for concept retention** (17-ai-integration-strategy)
4. **Community Gallery: Upvotes, comments, forks** (26-monetization-community-strategy)
5. **Distributed Systems: Raft, Paxos, CRDTs, consistent hashing** (08-distributed-systems)
6. **Concurrency: Event loop, race conditions, goroutines** (06-concurrency-ml)
7. **Database Lab: ER diagrams, normalization, query plans** (03-lld-os-database-tools)
8. **LLD Studio: Class diagrams, design patterns, SOLID** (03-lld-os-database-tools)
9. **Email Sequences: Onboarding drip, streak reminders** (32-analytics-email-notifications)
10. **Analytics: PostHog events, conversion tracking** (32-analytics-email-notifications)
11. **Sound Design: Micro-interaction audio** (22-sound-microinteractions)
12. **Additional Exports: SVG, PDF, PlantUML, draw.io, Terraform** (12-export-sharing)

## P3 LOW (Future Features)

These are valuable but not time-sensitive:

1. **Desktop App: Tauri v2 (macOS, Windows, Linux)** (15-testing-deployment)
2. **Plugin Architecture: Iframe-sandboxed plugins** (19-onboarding-plugins)
3. **VS Code Extension** (22-search-social-integrations)
4. **Chrome Extension** (22-search-social-integrations)
5. **GitHub Actions Integration** (22-search-social-integrations)
6. **Slack Bot** (22-search-social-integrations)
7. **ML System Design: Neural network playground, ML pipelines** (06-concurrency-ml)
8. **Enterprise: SSO, team workspaces, admin dashboard** (26-monetization-community-strategy)
9. **Self-hosted Docker deployment** (15-testing-deployment)
10. **Advanced DS: FFT, Heavy-Light Decomposition, vEB Tree** (20-advanced-dsa-competitive)
11. **GIF Recording** (12-export-sharing)
12. **Multi-region visualization** (22-search-social-integrations)
13. **Mobile optimization / React Native** (19-onboarding-plugins)
14. **Notion/Obsidian Integration** (22-search-social-integrations)

---

# Cross-Cutting Findings

## Architecture Consensus
All research files converge on these architectural decisions:
- **Zustand over Redux** -- simpler, smaller, better for atomic store pattern
- **React Flow over D3-only** -- handles canvas, zoom, pan, selection natively
- **WASM over JS for simulation** -- 10x performance for queuing math
- **IndexedDB over localStorage** -- handles large projects, non-blocking
- **Yjs over OT** -- conflict-free for offline-first collaboration

## Biggest Market Gaps (Confirmed Across Multiple Files)
1. No interactive system design simulation exists (files 02, 13, 16)
2. No tool combines visualization + code editor + step-through (files 01, 06)
3. System design interview prep has no interactive equivalent to LeetCode (files 07, 13)
4. No CORS/TLS/HTTP3 interactive simulators (file 05)
5. No interactive concurrency visualizer (file 06)

## Risk Areas (From Review Files 40-44)
1. WASM cold start on first simulation (mitigate: preload during idle)
2. React Flow performance at 500+ nodes (mitigate: LOD + virtualization)
3. AI cost scaling with users (mitigate: prompt caching, tier-based limits)
4. Yjs document size with many collaborators (mitigate: document compaction)
5. Content creation bottleneck for 246 challenges (mitigate: AI-assisted authoring)
