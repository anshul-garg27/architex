# Architex Research Library

> 21 parallel research agents investigated every tool, competitor, algorithm, pattern, and technique across the entire engineering visualization ecosystem. This directory contains their complete findings.

## Research Files

### Core Platform Research
| # | File | Description | Key Findings |
|---|------|-------------|--------------|
| 1 | [01-dsa-visualization-platforms.md](01-dsa-visualization-platforms.md) | VisuAlgo, Algorithm Visualizer, USFCA, Red Blob Games, Python Tutor | Gap analysis: no tool combines code editor + visualization + memory model |
| 2 | [02-system-design-tools.md](02-system-design-tools.md) | paperdraw.dev, Excalidraw, draw.io, Miro, chaos engineering tools | 17 features nobody has built (CAP sandbox, auto-scaling sim, cost modeling) |
| 3 | [03-lld-os-database-tools.md](03-lld-os-database-tools.md) | PlantUML, Mermaid, StarUML, OSTEP simulators, dbdiagram.io | Best-in-class tools per category with feature comparisons |
| 4 | [04-tech-stack-recommendations.md](04-tech-stack-recommendations.md) | React Flow, Motion, Monaco, shadcn/ui, Zustand, Dexie, WASM | Complete tech stack with versions, sizes, and rationale |

### Domain-Specific Research
| # | File | Description | Key Findings |
|---|------|-------------|--------------|
| 5 | [05-networking-security-viz.md](05-networking-security-viz.md) | TCP, TLS, DNS, OAuth, JWT, CORS visualization tools | 6 major gaps: no HTTP/3 comparison, no CORS simulator |
| 6 | [06-concurrency-ml-devops.md](06-concurrency-ml-devops.md) | Thread viz, TensorFlow Playground, Argo CD, Kubernetes | No interactive concurrency visualizer exists (biggest gap) |
| 7 | [07-interview-gamification.md](07-interview-gamification.md) | interviewing.io, Pramp, Exponent, Liveblocks, Yjs | "System design prep is where coding prep was 10 years ago" |
| 8 | [08-distributed-systems-algorithms.md](08-distributed-systems-algorithms.md) | Raft, Paxos, CRDTs, consistent hashing, gossip, vector clocks | Tiered quality ranking of every distributed systems viz tool |
| 9 | [09-real-world-case-studies.md](09-real-world-case-studies.md) | 55+ system architectures: Netflix, Twitter, Uber, etc. | Full component breakdown + simulation targets per system |

### Implementation Research
| # | File | Description | Key Findings |
|---|------|-------------|--------------|
| 10 | [10-uiux-developer-tools.md](10-uiux-developer-tools.md) | Linear, Vercel, Raycast UI patterns, command palette, keyboard-first | cmdk + react-resizable-panels + Lucide icons + Geist font |
| 11 | [11-animation-visualization-techniques.md](11-animation-visualization-techniques.md) | Particle flow, SVG vs Canvas, spring physics, LOD rendering | 4-layer hybrid rendering architecture, 60fps techniques |
| 12 | [12-export-sharing-persistence.md](12-export-sharing-persistence.md) | SnapDOM, lz-string, Yjs, browser-fs-access, OPFS, oEmbed | Yjs + y-webrtc for P2P collaboration, no server needed |
| 13 | [13-competitive-analysis.md](13-competitive-analysis.md) | 20+ platforms: pricing, features, gaps for every competitor | 10 critical market gaps, pricing comparison table |
| 14 | [14-accessibility-performance.md](14-accessibility-performance.md) | WCAG 2.2, keyboard navigation, colorblind palettes, React perf | Spatial keyboard nav algorithm, atomic Zustand stores |
| 15 | [15-testing-deployment.md](15-testing-deployment.md) | Vitest, Playwright, Storybook, GitHub Actions, Tauri v2 | Complete CI/CD pipeline, Docker + Vercel + Tauri configs |

### Advanced Research
| # | File | Description | Key Findings |
|---|------|-------------|--------------|
| 16 | [16-queuing-theory-simulation-math.md](16-queuing-theory-simulation-math.md) | M/M/1, M/M/c, USL, Little's Law, tail latency, cascading failure | The math that makes simulation realistic, not toy-like |
| 17 | [17-ai-integration-strategy.md](17-ai-integration-strategy.md) | Claude API for review, Socratic tutoring, diagram generation | 4-phase strategy, $0.02-0.05 per interview session |
| 18 | [18-microservices-patterns.md](18-microservices-patterns.md) | 29 patterns: Saga, CQRS, CDC, Circuit Breaker, Rate Limiting | Each with simulation ideas and configurable parameters |
| 19 | [19-onboarding-plugins-mobile.md](19-onboarding-plugins-mobile.md) | React Joyride, iframe sandbox plugins, touch gestures, PWA | Figma-style plugin architecture, progressive disclosure |
| 20 | [20-advanced-dsa-competitive.md](20-advanced-dsa-competitive.md) | Skip List, Bloom Filter, LSM Tree, HyperLogLog, FFT, HLD | 15 advanced structures + 10 CP algorithms with viz specs |
| 21 | [21-benchmarks-real-world-numbers.md](21-benchmarks-real-world-numbers.md) | Latency numbers, throughput benchmarks, cloud costs, scale numbers | Exact numbers for realistic simulation defaults |

### Content Pipeline & Templates
| # | File | Description | Key Findings |
|---|------|-------------|--------------|
| 22 | [22-content-pipeline-specification.md](22-content-pipeline-specification.md) | Complete content pipeline: CMS selection, template JSON schema, QA process, community workflow, SRS/quiz design, AI-assisted authoring, versioning | Velite+JSON hybrid, 5-gate QA, AI generates drafts at ~$12 total, 190hr human review, Bloom's taxonomy alignment, FSRS integration |

### Platform & Growth Research
| # | File | Description | Key Findings |
|---|------|-------------|--------------|
| 23 | [22-search-social-integrations.md](22-search-social-integrations.md) | Search (FlexSearch, Meilisearch, Cmd+K), social (profiles, feeds, heatmap, upvotes, fork/remix), integrations (VS Code, Chrome, GitHub Action, Slack, Notion, Obsidian) | FlexSearch for offline, Meilisearch for cloud; self-built feed over GetStream; 17 integration points with priority matrix |
| 26 | [26-monetization-community-strategy.md](26-monetization-community-strategy.md) | Pricing tiers, open source strategy, launch playbook, growth tactics | AGPL-3.0 core, $12/mo Pro, Product Hunt + HN launch |

## How to Use This Research

1. **Building Architex?** Start with `MEGA_PROMPT.md` (the main specification). Use these research files for deep-dive reference on specific modules.
2. **Each file is self-contained** — you can read any file independently for its domain.
3. **The competitive analysis** (file 13) shows exactly what exists and what doesn't — use it to prioritize unique features.
4. **The simulation math** (file 16) is CRITICAL — it's what separates a toy simulation from a credible one.
5. **The benchmarks** (file 21) provide exact numbers to hardcode as simulation defaults.

## Stats
- **21 research agents** running in parallel
- **Total research volume**: ~150,000+ words across all files
- **Tools analyzed**: 100+
- **Platforms compared**: 20+
- **Patterns documented**: 50+
- **Algorithms catalogued**: 100+
- **Real-world architectures**: 55+
