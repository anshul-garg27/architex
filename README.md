# System Design Mastery

> A comprehensive system design learning repository containing structured study materials, an interactive learning platform (Architex), interview preparation guides, and deep research.

---

## Repository Structure

```
system_design/
│
├── architex/                    # The Interactive Learning Platform (main product)
│   ├── src/                     # Next.js application source
│   ├── docs/                    # Research findings, demos, specs
│   ├── README.md                # Detailed setup & architecture guide
│   ├── ARCHITEX_PRODUCT_VISION.md
│   ├── ARCHITEX_INTERVIEW_PREP_SPEC.md
│   └── LLD_CANVAS_PLAYBOOK.md
│
├── 01-foundations/               # Foundational system design concepts
├── 02-core-system-design/        # Core distributed systems topics
├── 03-advanced/                  # Advanced patterns & architectures
├── 04-specialization/            # Specialized topics
├── 05-hld-problems/              # High-Level Design interview problems
├── 06-lld-problems/              # Low-Level Design interview problems
├── 07-uber-prep/                 # Company-specific interview prep
│
├── research/                     # Platform research & competitive analysis
├── docs/                         # Architecture docs, wireframes, plans
├── prompts/                      # AI prompt templates for building
├── scripts/                      # Build & automation scripts
│
├── BUILD_PLAN.md                 # Layered build execution strategy
├── MEGA_PROMPT.md                # Full platform specification
├── ONBOARDING.md                 # Onboarding guide
├── uber-interview-prep.md        # Uber interview complete guide
└── advanced_system_design_curriculum.md
```

---

## Study Materials (Folders 01-07)

### 01 — Foundations
| Topic | What You'll Learn |
|-------|------------------|
| Estimation | Back-of-envelope calculations, QPS, storage, bandwidth |
| Architecture Styles | Monolith, microservices, event-driven, serverless |
| Networking Basics | TCP/IP, HTTP, DNS, WebSocket, gRPC |
| API Design | REST, GraphQL, gRPC — design principles & tradeoffs |
| SQL Databases | Schema design, indexing, normalization, transactions |
| NoSQL Databases | Document, key-value, wide-column, graph — when to use |
| CAP/ACID/BASE | Consistency models, tradeoffs, real-world examples |
| Caching | Redis, Memcached, cache-aside, write-through, invalidation |
| Load Balancing | Round-robin, least-connections, consistent hashing |
| Message Queues | Kafka, RabbitMQ, SQS — patterns & guarantees |
| OOP & SOLID | Principles, violations, refactoring |
| Design Patterns | Gang of Four patterns with examples |

### 02 — Core System Design
| Topic | What You'll Learn |
|-------|------------------|
| Distributed Systems | Consensus, replication, partitioning |
| Replication & Partitioning | Leader-follower, multi-leader, leaderless |
| Consistent Hashing | Ring-based, virtual nodes, load distribution |
| CDN & Blob Storage | Content delivery, S3, edge caching |
| Distributed Transactions | 2PC, Saga, compensation |
| Rate Limiting | Token bucket, sliding window, leaky bucket |
| Unique ID Generation | Snowflake, UUID, auto-increment tradeoffs |
| Search Systems | Inverted index, Elasticsearch, ranking |
| All Design Patterns | Complete catalog with UML & code |
| UML Diagrams | Class, sequence, state machine diagrams |

### 03-07 — Advanced, Specialization, HLD/LLD Problems, Company Prep
Deeper topics, practice problems, and company-specific preparation (Uber, Google, etc.)

---

## Architex — The Interactive Platform

The core of this repository. A full-stack interactive engineering learning platform.

### Quick Start

```bash
# Navigate to the platform
cd architex

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Edit .env.local — add DATABASE_URL at minimum

# Database setup (choose one):

# Option A: Local PostgreSQL
brew install postgresql@16
brew services start postgresql@16
createdb architex_dev
# Set DATABASE_URL=postgresql://localhost/architex_dev in .env.local

# Option B: Neon (Cloud) — sign up at neon.tech, copy connection string

# Push schema & seed data
pnpm db:push
pnpm db:seed

# Start development server
pnpm dev
# Open http://localhost:3000
```

### What Architex Has

| Module | What It Teaches | Key Feature |
|--------|----------------|-------------|
| **System Design** | Architecture at scale | Live traffic simulation with chaos injection |
| **Algorithms** | 240+ algorithms | Step-by-step visualization with racing |
| **Data Structures** | 50+ structures | Break-it mode, prediction overlay |
| **Low-Level Design** | 36 design patterns | Interactive UML canvas with auto-grading |
| **Database** | 17 internal concepts | B-Tree, LSM, MVCC animated |
| **Distributed Systems** | Raft, CRDTs, Vector Clocks | Consensus visualization |
| **Networking** | TCP, TLS, DNS, HTTP | Packet journey simulator |
| **OS** | Scheduling, memory, deadlocks | 6 CPU scheduling algorithms |
| **Concurrency** | Threads, locks, channels | Race condition camera |
| **Security** | OAuth, JWT, XSS, CSRF | Attack & defense simulation |
| **ML Design** | Neural nets, A/B testing | Live training visualization |
| **Interview** | 20+ challenges | AI-scored mock interviews |
| **Knowledge Graph** | Cross-module concepts | Force-directed concept map |

### Simulation Engine
- 10-stage tick pipeline with BFS traffic propagation
- 30+ chaos events across 10 categories
- 35 pressure counters (CPU, memory, connections, etc.)
- Cascading failure detection with narrative engine
- What-if scenario analysis with architecture diffing
- Cost model with ~75 AWS component types
- Time-travel debugging with frame-by-frame replay

### AI Features
- Socratic tutor (4-phase: assess, challenge, guide, reinforce)
- AI diagram review (detects SPOF, scaling issues)
- Architecture generation from natural language
- 8-dimension interview scoring
- Frustration detection with adaptive hints

> See `architex/README.md` for full setup guide, architecture details, and all scripts.

---

## Research & Documentation

### Product Research (`architex/docs/research-findings/`)

30+ agent research outputs covering every aspect of the product:

| Category | Files | What They Cover |
|----------|-------|----------------|
| Interview Prep Topics | `agent-01` to `agent-06` | 350+ features across DSA, LLD, HLD, DB, Backend, Concurrency, OS, Networking, DevOps, Cloud, Security, SRE, Debugging, Testing, Code Review, Behavioral, Resume |
| Product Vision | `agent-pv-01` to `agent-pv-06` | Feature universe, competitive analysis (16 platforms), simulation R&D, AI features, retention science, codebase audit |
| WOW Features | `agent-wow-*` | 180 by sub-topic + 127 by interview round + 13 per module + 10 unique |
| Information Architecture | `agent-ia-01` to `agent-ia-10` | Navigation, visual design, component architecture, tech stack, motion, responsive, accessibility, aesthetic soul, micro-interactions, content strategy |

### Strategy Documents

| Document | Description |
|----------|-------------|
| `ARCHITEX_PRODUCT_VISION.md` | Executive strategy — the pitch, competitive moat, roadmap |
| `ARCHITEX_INTERVIEW_PREP_SPEC.md` | Complete feature spec for all 18 interview round types |
| `LLD_CANVAS_PLAYBOOK.md` | Technical playbook — every technique used in building |
| `BUILD_PLAN.md` | Layered prompt architecture for AI-assisted building |
| `MEGA_PROMPT.md` | Original full platform specification |

### Interactive Demos (`architex/docs/demos/learning-mode/`)

12 standalone HTML demos showing different learning approaches:

| Demo | What It Shows |
|------|--------------|
| `architex-complete-demo.html` | **All 7 modes** with working mode switcher (2,840 lines) |
| `approach-e-progressive.html` | Progressive Canvas — scroll-synced lesson (recommended) |
| `approach-b-brilliant.html` | Brilliant-style full-screen lesson cards |
| `novel-1-saboteur.html` | Break a pattern, watch it degrade live |
| `novel-2-memory-palace.html` | Patterns as buildings in a navigable city |
| + 7 more | Various learning UX approaches |

---

## Interview Preparation

### Company-Specific Prep
- `uber-interview-prep.md` — Complete Uber interview guide with LeetCode questions, HLD, LLD, DSA patterns
- `07-uber-prep/` — Detailed preparation materials

### Interview Round Coverage
The platform + study materials cover ALL interview rounds:

| Round | Study Materials | Platform Module |
|-------|----------------|-----------------|
| DSA / Coding | `01-foundations/` | Algorithms + Data Structures |
| Machine Coding | `06-lld-problems/` | LLD (33 problems) |
| Low-Level Design | `01-foundations/11-12` | LLD (36 patterns + SOLID) |
| System Design | `02-core/`, `05-hld/` | System Design (simulation) |
| Database | `01-foundations/05-06` | Database (17 canvases) |
| Concurrency | `02-core/` | Concurrency module |
| OS / Networking | `01-foundations/03` | OS + Networking modules |
| Behavioral / HR | `uber-interview-prep.md` | (coming soon) |

---

## Task Boards

| File | Tasks |
|------|-------|
| `tasks-sds-326-380.json` | Tasks 326-380 |
| `tasks_sds_381_468.json` | Tasks 381-468 |
| `architex/docs/tasks/` | LLD content enrichment, canvas polish tasks |

---

## Environment Setup

### Prerequisites
- **Node.js** >= 20
- **pnpm** >= 9
- **PostgreSQL** >= 14 (local or [Neon](https://neon.tech))
- **Git**

### Required Environment Variables

Create `architex/.env.local`:

```env
# Database (REQUIRED)
DATABASE_URL=postgresql://localhost/architex_dev

# Auth (optional — app works without it)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# AI Features (optional — heuristic fallback without it)
ANTHROPIC_API_KEY=sk-ant-...

# LLD API Mode (optional — uses static data without it)
NEXT_PUBLIC_LLD_USE_API=true
```

### Full Setup (from scratch)

```bash
# 1. Clone the repo
git clone https://github.com/anshul-garg27/architex.git system_design
cd system_design

# 2. Install dependencies
cd architex
pnpm install

# 3. Set up PostgreSQL
brew install postgresql@16        # macOS
brew services start postgresql@16
createdb architex_dev

# 4. Configure environment
cp .env.example .env.local
# Edit .env.local — set DATABASE_URL=postgresql://localhost/architex_dev

# 5. Push schema & seed data
pnpm db:push     # Creates all 14 tables
pnpm db:seed     # Seeds: 36 patterns, 33 problems, 240+ algos,
                 #        walkthroughs, checkpoints, quizzes, Java code

# 6. Start the dev server
pnpm dev
# Open http://localhost:3000

# 7. (Optional) View the demos
open docs/demos/learning-mode/index.html
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16, React 19, TypeScript 5 |
| Styling | Tailwind CSS v4, CSS custom properties |
| State | Zustand v5 (13 stores), TanStack Query v5 |
| Canvas | React Flow (xyflow), SVG, Canvas2D |
| Animation | motion/react v12 (framer-motion successor) |
| Database | Drizzle ORM, PostgreSQL (Neon serverless) |
| AI | Anthropic Claude API (Haiku 4.5 + Sonnet 4) |
| Auth | Clerk v7 (optional) |
| Testing | Vitest, Playwright, Storybook |
| PWA | Service worker, offline support, install prompt |

---

## License

AGPL-3.0 — See [LICENSE](architex/LICENSE) for details.
