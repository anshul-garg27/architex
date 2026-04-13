# Distributed Systems Algorithm Visualizations

> Every tool ranked by quality, with gap analysis.

---

## TIER 1: GOLD STANDARD

### Raft — The Secret Lives of Data (thesecretlivesofdata.com/raft)
- Guided animated walkthrough (~50 slides). Leader election, log replication, partition recovery.
- **Quality:** EXCELLENT. The universally recommended Raft introduction.
- **Missing:** Not interactive sandbox. Can't inject failures or change cluster size.

### Raft — RaftScope (raft.github.io)
- Live 5-node cluster. Kill nodes, watch re-election. Messages as animated arrows.
- **Quality:** Good but "super hacky" (creator's words). Created by Raft's inventor.
- **Missing:** No network partition. Rough UI.

### CRDTs — CRDT Dictionary (iankduncan.com)
- 14+ CRDT types: G-Counter, PN-Counter, OR-Set, LWW-Register, MV-Register, RGA, WOOT, etc.
- Interactive demos for G-Counter, OR-Set, LWW-Register, Vector Clocks.
- **Quality:** EXCEPTIONAL (9/10). 19 cited papers, mathematically rigorous.

### Consistent Hashing — selfboot.cn/algorithms/hashring
- Hash ring with virtual nodes, key distribution, add/remove nodes.
- **Quality:** VERY GOOD. Real-time feedback, clear labeling.

---

## TIER 2: VERY GOOD

| Tool | What | Quality |
|---|---|---|
| Jake Lazaroff CRDT Intro | LWW-Register, pixel art editor | Very Good |
| Lars Hupel CRDT Series | 8-part, live JS, property-based testing | Very Good |
| Gossip Simulator (flopezluis) | Epidemic spread, 80-120 nodes | Good |
| ShiViz (Vector Clocks) | Time-space diagrams from logs | Very Good (peer-reviewed) |
| CAP Theorem Proof (Whittaker) | Illustrated proof, ~26 SVG diagrams | Excellent (not interactive) |
| PlanetScale Sharding | Interactive insert/select across shards | Very Good |
| Kademlia DHT Viz | XOR distance, k-buckets, lookup | Good |

---

## TIER 3: GOOD

- Two-Phase Commit (JWShaw) — Java GUI, color-coded states
- Paxos Visualization (visual.ofcoder.com) — Basic/Multi-Paxos + Raft
- Merkle Tree demos — Multiple basic tools (hash propagation, proof verification)
- Bully Algorithm — Docker-based Go implementation

---

## TIER 4: FRAMEWORKS

- **Maelstrom (Jepsen)** — Workbench for building & testing distributed systems. Gold standard for hands-on learning. Code-based, not visual.
- **Runway (Salesforce)** — Formal spec + model checking + visualization framework. Custom DSL.

---

## MAJOR GAPS (What Nobody Has Built)

1. **Lamport Timestamps** — NO good interactive viz exists
2. **Eventual Consistency** — NO compelling interactive demo
3. **CAP Theorem Interactive** — NO sandbox (only static proofs)
4. **MapReduce** — NO browser-based step-through
5. **Sharding Strategy Comparison** — No custom shard key tool
6. **Leader Election (Bully/Ring)** — Only Docker-based project
7. **Chord DHT** — Nothing comparable to Kademlia viz
8. **Paxos** — Poorly visualized despite decades of existence
9. **Vector Clocks vs Lamport side-by-side** — Nobody compares them
10. **Blockchain Consensus** — No polished step-by-step browser tool
