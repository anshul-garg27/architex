# System Design & Chaos Engineering Tools

> Every system design tool analyzed + 17 features nobody has built.

---

## TOOLS ANALYZED

### paperdraw.dev — ONLY tool with simulation
- Drag-drop + real-time traffic simulation + 50+ chaos events
- ~1K-1.5K daily users. Flutter Web. Free.
- **Missing:** Limited components (~15), no education, no AI, no export, no collab

### Excalidraw — Best whiteboard
- Hand-drawn style, real-time collab, open-source, embeddable
- System design libraries (AWS, custom components)
- **Missing:** Zero simulation. Purely static.

### draw.io — Most shapes
- 10,000+ shapes (AWS, Azure, GCP, Cisco, K8s, Docker)
- Free, open-source, works everywhere
- **Missing:** No simulation, no collab, dated UI

### Miro — Best collaboration
- 7,000+ templates, 250+ integrations, AI features
- **Missing:** Not purpose-built for system design, expensive

### Eraser.io — Best diagram-as-code
- Eraserbot auto-updates diagrams on PRs
- **Missing:** No simulation, enterprise-focused

---

## DISTRIBUTED SYSTEMS VISUALIZATION TOOLS

| Tool | What | Interactivity |
|---|---|---|
| The Secret Lives of Data | Raft guided tutorial | Scroll-driven (excellent pedagogy) |
| RaftScope | 5-node Raft sandbox | Kill nodes, watch re-election |
| Consistent HashRing (selfboot.cn) | Hash ring + virtual nodes | Add/remove nodes, 1000 keys |
| Load Balancing (samwho.dev) | 5 LB algorithms animated | Interactive playground |
| Paxos Demo | Basic Paxos 5-node | Limited |

---

## CHAOS ENGINEERING TOOLS COMPARED

| Tool | Type | Chaos Events |
|---|---|---|
| **Gremlin** | Commercial | CPU, Memory, Disk, Network (latency/loss/DNS), State (process kill, restart, clock skew) |
| **LitmusChaos** | Open-source (CNCF) | Pod delete/kill/CPU/memory, Network loss/corruption/latency, IO stress |
| **Chaos Mesh** | Open-source (CNCF) | Pod, Network, DNS, HTTP, Stress, IO, Time, Kernel, AWS, GCP, JVM chaos |
| **AWS FIS** | AWS only | Stop instances, throttle APIs, failover DBs, network blackhole |

---

## 17 FEATURES NOBODY HAS BUILT

1. Combined simulation + chaos + diagramming with deep fidelity
2. Consensus algorithm comparison (Raft vs Paxos vs PBFT side-by-side)
3. **Interactive CAP theorem sandbox** (toggle C/A/P, observe behavior)
4. Consistent hashing INTEGRATED with system design (not isolated)
5. **Replication topology visualization** with animated data flow
6. **Sharding strategy visualization** (range vs hash vs geographic)
7. **Auto-scaling simulation** (watch system scale up/down)
8. **Network partition with split-brain visualization**
9. Gossip protocol visualization
10. Vector clock / Lamport timestamp visualization
11. **Rate limiting algorithm comparison** (token bucket, sliding window, leaky bucket)
12. **Circuit breaker state machine** (open/closed/half-open)
13. **Database transaction isolation level demo** (dirty read, phantom read)
14. **Event sourcing / CQRS flow**
15. **Service mesh visualization** (sidecar, mTLS, traffic routing)
16. **Multi-region architecture simulation** (latency, failover)
17. **Cost modeling** for architectures
