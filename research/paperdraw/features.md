# PaperDraw.dev — Complete Feature Analysis

> Explored via logged-in session on 2026-04-11

## Top Navigation Bar

| Feature | Description | Free/Pro |
|---------|------------|----------|
| **AI (dropdown)** | "AI design" — auto-generate architecture from prompt. "AI review" — get AI feedback on current design | **Pro only** (PayPal subscription) |
| **AUTO LAYOUT** | Auto-arrange components on canvas | Free |
| **IMPORT EXTERNAL** | Import designs from external sources | Free |
| **TEMPLATES** | 9 pre-built system design blueprints (see solutions/) | Free |
| **MY DESIGNS** | Saved user designs | Free |
| **FEEDBACK** | Submit feedback to developers | Free |
| **LIBRARY** | Community-shared design library (/community page) | Free |
| **MORE →** | Import external, Export video, Share, Save, Account | Mixed |

## Canvas Toolbar (Drawing Tools)

### Basic Shapes (keyboard shortcuts 1-8)
| Tool | Shortcut | Description |
|------|----------|-------------|
| Select | 1 | Select/move components |
| Hand/Pan | R | Pan canvas |
| Rectangle | C | Draw rectangle |
| Circle | 3 | Draw circle |
| Ellipse | 4 | Draw ellipse |
| Triangle | 5 | Draw triangle |
| Arrow | 6 | Draw connection arrow |
| Line | 7 | Draw line |
| Pen | — | Freehand drawing |
| Text | T | Add text label |
| Magic Wand | 8 | Unknown/special tool |

### UML Tools
| Tool | Description |
|------|-------------|
| UML | Toggle UML mode |
| Class | UML Class diagram box |
| Iface | UML Interface |
| Abs | Abstract class |
| Enum | Enumeration |
| API | API endpoint box |
| Table | Database table |
| State | State machine node |
| Ext | Extension/external system |

## Component Palette (Left Sidebar)

### Categories & Components (80+ total)

**Traffic & Edge:**
- DNS, CDN, Load Balancer, API Gateway, WAF, Ingress

**Network:**
- Load Balancer (L4/L7), Reverse Proxy, API Gateway (Network), Edge Router
- Discovery Service, Routing Rule, WAF Module, Rate Limiter
- Health Check Service, Network Interface, Routing Table, Security Group
- Firewall Rule, Sidecar Proxy, Registry Database, Routing Policy

**Compute** (inferred from scrolling — between Network and Observability):
- App Server, Worker, Custom Service, Function Service, etc.

**Observability:**
- Log Aggregation Service, Distributed Tracing Collection
- Alerting Engine, Health Check Monitor, Media Processor

**Storage:**
- Time-Series Metrics Store, Cache, Database, Object Store
- And more (Ledger, Queue, Stream, etc.)

**FinTech:**
- Fraud Detection, HSM (Hardware Security Module)

**Security:**
- DDoS Shield, SIEM

**Data Engineering:**
- ETL Pipeline, CDC Service, Schema Registry, Batch Processor, Feature Store

**AI & Agents:**
- LLM Gateway, Tool Registry, Memory Fabric, Agent Orchestrator
- Safety & Observability Mesh

**Techniques (Conceptual Nodes):**
- Sharding, Hashing, Shard Node, Primary Node
- Partition Node, Replica Node, Input Source, Output Sink

## Chaos Items Panel (Second Tab)

### Infrastructure Failures
- Node Kill / CPU Crash
- Node Freeze
- Disk/Disk Failure
- OOM (Out of Memory)
- Network Partition
- BSOD / Kernel Panic
- Storage Corruption
- File System Full
- Cache Wipe/Crash/Meltdown

### Network Chaos
- Network Partition
- Chaos Gateway
- Packet Loss
- High Latency Injection
- Bandwidth Throttle
- Connection Interruption
- Load Surge
- Backend Failure
- Header Injection
- Sticky Session Issues

### Traffic Chaos
- Traffic Spike
- Slow Traffic
- Payload Flood

### Dependency Chaos
- Faulty API
- Service Restart
- Message Queue issues
- Cache Chaos

## Simulation Engine

### Live Metrics (Top Status Bar During Simulation)
- **RPS** (Requests Per Second) — real-time with green/yellow/red indicators
- **Latency** (ms) — P95 latency tracking
- **Utilization** (%) — system-wide capacity usage
- **Cost** ($/mo) — projected monthly infrastructure cost

### Per-Component Metrics (Overlaid on Canvas)
- RPS, P95, CPU%, Memory%
- Capacity, Instances
- Queuing: Target utilization, Local Budget %
- System: Budget Left %, Burn Rate, Utilization %
- Anchor points for connections (Top, Right, Bottom, Left)

### Simulation Controls
- **Speed slider**: 1.0x (adjustable)
- **Traffic slider**: 0-100+ (adjustable load)
- **Time scrubber**: Scrub through simulation timeline (0s → minutes)
- **STOP SIMULATION**: Ends simulation and generates report

### Post-Simulation Engineering Report
Auto-generated report containing:
- **Executive Summary**: Final Availability %, P95 Latency, Total Requests, Success Rate, Cost Spent, Monthly Projected Cost, Error Budget Remaining
- **Incident History Table**: Timestamp, Component, Issue Type, Explanation, Severity %, Recommendation
- **Issue Types Detected**: SPOF (Single Point of Failure), Cascading Failure, Overload, Dependency Unavailable, Checkpoint Write Failure
- **Downloadable** as `.md` report

## Chaos Bar (Bottom of Canvas)

6 chaos injection icons visible during simulation:
1. Lightning bolt (traffic spike)
2. Bomb (node kill)
3. Crack/fracture (partition)
4. Fire (cascading failure)
5. Explosion/spark (latency injection)
6. Bug (fault injection)

## Canvas Features

### Component Configuration (Click on Component)
- Real-time metrics display
- Capacity & scaling settings
- Instance count
- Queuing theory parameters (target utilization, local budget)
- Burn rate tracking
- Connection anchor points

### Visual Indicators
- **Color-coded component badges**: Tags like "RBC default", "ASA default", "CMP default", "DB OLTP default"
- **Connection types**: Blue (normal sync), Red (stressed/overloaded), animated flow
- **Metric overlay badges**: Orange/Yellow/Red severity badges during simulation
- **Container grouping**: Visual boxes grouping related components

### Other Canvas Features
- Zoom controls: -, percentage, +, RESET
- Grid background (dark theme: dark blue grid, light theme: light grid)
- Light/Dark mode toggle (settings gear icon)
- Lightbulb icon (hints/tips)

## Cost Calculator (Top Right)

Always visible:
- **RATE**: $/hr (changes during simulation based on component count + instances)
- **SPENT**: Cumulative $ in current sim
- **SIM**: Time elapsed
- **BUDGET**: Monthly budget limit
- **Speed multiplier**: "5s=1h x speed"

## Templates Available (9)

1. Global URL Shortener
2. Social Media Feed
3. Real-Time Ride Sharing
4. AI Agent Orchestration
5. Secure Banking Ledger
6. Video Streaming Platform
7. Modern Data Analytics
8. SOS UML Blueprint
9. Minimal Canvas
+ Clear Canvas option

## Community Library (/community)

- Browse shared designs
- Filter by: Recently, Top Rated, Complexity
- Categories, Classrooms, Most Popular, Tags
- Design cards with: title, author, score, complexity rating
- Details and Function buttons per design

## Monetization

- **Free tier**: Full canvas, simulation, templates, community
- **Pro tier** (PayPal subscription): AI design generation, AI review
- Ads: Google AdSense integrated

## Key Differentiators vs. Other Tools

1. **Real-time simulation** with queuing theory (not just static diagrams)
2. **Chaos injection** — drag chaos items onto running simulation
3. **Auto-generated engineering reports** with incident detection & recommendations
4. **Cost calculator** — projects monthly infrastructure cost based on components
5. **UML mode** — class diagrams with methods, not just boxes
6. **80+ component types** spanning 10 categories including AI/ML, FinTech, Data Engineering
7. **Time scrubber** — replay simulation timeline
8. **Cascading failure detection** — identifies dependency chains and blast radius
9. **Export video** — record simulation as video
10. **Community library** — share and browse designs
