# System Design Module · The Architect's Studio Rebuild

> **Design spec** · consolidated from an 11-batch brainstorm with the product owner
>
> **Date:** 2026-04-20
> **Scope:** Complete rebuild + expansion of the Architex SD (System Design / HLD) module
> **Goal:** Turn a respectable simulation engine into **"the place engineers go to become *distributed-systems* architects"**
> **Sister spec:** `2026-04-20-lld-architect-studio-rebuild.md` — match its structure, tone, and lifespan
> **Status:** Design approved; implementation plan pending
>
> **For agentic workers:** every decision in this document is traceable to a specific brainstorm batch-and-question (e.g. "B4·Q8 · whisper-mode coach"). When you implement, open the brainstorm HTML at `.superpowers/brainstorm/26797-1776687940/content/NN-sd-*.html` alongside the task — the reasoning behind the choice is there.

---

## The Unifying Thesis

> **System Design is the wind tunnel. The diagram is the airframe. The outage is the stall.**
>
> Architex SD is not a canvas. It is a **drafting hall** joined to a **wind tunnel** by one seamless door.

The LLD module builds *an architect's studio* — a place where a working engineer designs a single codebase. The SD module extends that studio into its second hall: where the engineer stops drafting one program and starts drafting **an organism of many programs**. Same physical metaphor. Same serif voice. Same motion language. One accent-color swap (amber → cobalt) and a door at the far end of the studio that opens onto **the wind tunnel** — a room where every diagram the engineer has ever drawn can be run, shaken, set on fire, rewound, and argued with.

Four principles — one per area of the spec — are repeated throughout:

- **The wind-tunnel principle.** A system diagram that cannot be *run* is decoration. Every design in Architex SD must be executable against traffic, cost, and chaos. The simulation engine is not an afterthought; it is the organ around which the pedagogy is grown.
- **The war-story principle.** Distributed systems failures are myth, not trivia. Facebook 2021 BGP, AWS us-east-1 2021, CrowdStrike 2024 — each is taught as a **cinematic replay**, not a footnote. Every chaos event the user triggers is narrated in the same serif-typeset ribbon the real incidents use. The feeling should be: *"my laptop just went through what Fastly went through in 2021."*
- **The invisible-force principle.** The three forces that kill production systems — **latency, cost, and failure propagation** — are invisible in every other tool. Architex SD makes them visible, always. A latency heat overlay. A corner meter for dollars-per-second. A blast-radius graph that pulses when a node falls. You cannot hide from physics; you can only watch it.
- **The one-organism principle.** There is no "System Design app" and "LLD app" and "Algorithms app". There is one Architex, one profile, one FSRS queue, one palette, one shortcut muscle-memory. Cross-module links everywhere. The SD problem "Design Twitter" carries a link to its LLD counterpart ("Tweet feed object model") and back. Knowledge graph, not silos.

### Why this thesis drives every subsequent decision

- **The 5 modes** are not tabs. They are *rooms in the hall*: **Learn** (the reading nook), **Build** (the drafting hall), **Simulate** (the wind tunnel, flagship), **Drill** (the exam room), **Review** (the reading chair by the window). One shell, four doors, a wind tunnel at the end.
- **The content** is both **atomic (40 concepts)** and **molecular (30 problems)** — cross-linked by design, because a distributed system is simultaneously "the 40 ideas you need to have" and "the 30 questions you will be asked". You cannot teach one without the other.
- **The simulation engine is not replaced**; it is **dressed**. Architex already has 34 files of simulation infra (chaos-engine, cost-model, cascade-engine, narrative-engine, metrics-engine, queuing-model, capacity-planner, 27 more). This spec layers pedagogy on top of it — threshold coaching, whisper-mode coach, cinematic chaos, 6 activity framings. The infra stays.
- **The interview layer is gated**. The 5-stage interview clock (Clarify → Estimate → Design → Deep Dive → Q&A) is enforced in Drill mode. This is not a preference. Interviews have phases; muscle memory is what we are training.
- **Cost is never hidden.** Every node has a dollar number. The corner meter ticks. When the user adds a Global Accelerator, a diff annotation shows "+$2.40/hr". Cloud-bill shock is a teachable moment, not a surprise the user gets six months after the interview.
- **Failure is cinema.** Chaos events trigger a full-width ribbon, a red vignette, and an optional bass thump. The screen briefly belongs to the failure. Then a margin card captures it as a running narrative stream on the right, so the user can scroll back and read the story of their outage.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Target Personas](#2-target-personas)
3. [Product Surface · the Five Modes at a Glance](#3-product-surface)
4. [Information Architecture](#4-information-architecture)
5. [Content Strategy · 40 Concepts + 30 Problems + 10 Real Incidents](#5-content-strategy)
6. [Mode Deep-Dive · Learn](#6-learn-mode)
7. [Mode Deep-Dive · Build](#7-build-mode)
8. [Mode Deep-Dive · Simulate (flagship)](#8-simulate-mode)
9. [Mode Deep-Dive · Drill](#9-drill-mode)
10. [Mode Deep-Dive · Review](#10-review-mode)
11. [Canvas & Diagram System · 10 diagram types · 16 node families · 10 overlays](#11-canvas-diagram-system)
12. [Chaos Library · 73 events · 10 real incidents · 6 control modes · narrative](#12-chaos-library)
13. [Cost & Scaling Model · 6 providers · hidden costs · scale slider · real benchmarks](#13-cost-scaling-model)
14. [Smart Canvas Features · pattern detection · anti-patterns · AI suggestions · constraint solver](#14-smart-canvas-features)
15. [AI Integration · coach · interviewer personas · explain-inline · progress-aware context](#15-ai-integration)
16. [Pedagogical Formats · Build-Along · Debug-This · Inherit-Mess · Scale-Up · CTO Interview · etc.](#16-pedagogical-formats)
17. [Cross-Module Seamlessness · knowledge graph · unified profile · shortcuts · persistence](#17-cross-module-seamlessness)
18. [UI & Visual Language · accent shift · panels · rail nav · content formats · motion · onboarding](#18-ui-visual-language)
19. [Collaboration · Mobile · Extensibility · shareables · 8 integrations · Crunch Mode · 12 wild cards](#19-collaboration-mobile-extensibility)
20. [Immersion & Narrative · Ambient Studio + Decade Saga optional campaign](#20-immersion-narrative)
21. [Data Model Sketch · DB schema for SD-specific tables](#21-data-model-sketch)
22. [Feature Catalog · 200+ features, tagged must-ship / nice-to-have / later](#22-feature-catalog)
23. [Implementation Phases](#23-implementation-phases)
24. [Rollout Plan](#24-rollout-plan)
25. [Success Metrics](#25-success-metrics)
26. [Non-Goals](#26-non-goals)
27. [Open Questions](#27-open-questions)
28. [References](#28-references)

---

## Q&A Decision Record — 54 locked decisions across 11 batches

| Batch | # | Topic | Chosen |
|---|---|---|---|
| 2 | Q1 | Mode count | **5 modes** — Learn / Build / Simulate / Drill / Review (Simulate added over LLD's 4) |
| 2 | Q2 | Content shape | **Both atoms & molecules** — 40 concepts cross-linked with 30 problems |
| 2 | Q3 | Templates | **Elevate** — each problem gets 2-3 canonical solutions adapted from existing templates |
| 2 | Q4 | Studio metaphor | **Same studio as LLD** — SD is the drafting hall + wind tunnel |
| 2 | Q5 | Cross-module links | **Deep linking** — LLD ↔ SD ↔ Algorithms ↔ OS&DB, every page, both directions |
| 3 | — | Concept waves | 40 concepts in 8 waves (Foundations 5 · Scaling 6 · Data 6 · Messaging 4 · Distributed 5 · Resilience 4 · Operational 5 · Modern 5) |
| 3 | — | Problem domains | 30 problems in 6 domains (Media 8 · Location 5 · Storage 4 · Commerce 5 · Search 3 · Infra 5) |
| 3 | — | Page format | 8-section concept (1200-1800w) · 6-pane problem (2500-3500w) |
| 3 | — | Authorship | Opus 4.7 hand-writes all 70 pieces · ~150k words total · ~200-300 Opus hours |
| 4 | Q6 | Metric display | **Threshold coaching** — each metric classified and explained, not raw numbers |
| 4 | Q7 | Activities | **All 6** — Validate · Stress Test · Chaos Drill (flagship) · Compare A/B · Forecast · Archaeology |
| 4 | Q8 | AI in sim | **Whisper-mode coach** (Haiku, max 3 interventions per 5-min sim) |
| 4 | Q9 | Drill-ins | **All 7** — Pause & Inspect · Time Scrubber · Cascade Trace · Slow-Mo · Replay & Share · Metric Drilldown · What-If Branching |
| 4 | Q10 | Post-sim loops | **Triple learning loop** — Learn/Build/Drill paths out of every sim result |
| 5 | Q11 | Chaos taxonomy | **By failure domain** — 7 groups: Infra 14 · Data 11 · Network 10 · Cascade 9 · External 8 · Human 10 · Load 11 = **73 events** |
| 5 | Q12 | Chaos narration | **Cinematic narrator** — third-person present-tense, serif-typeset ribbon |
| 5 | Q13 | Real incidents | **All 10** — FB 2021 BGP · AWS us-east-1 2021 · CF regex 2019 · GH DB 2018 · Fastly 2021 · Slack 2021 · Discord 2022 · Roblox 2021 · Knight 2012 · CrowdStrike 2024 |
| 5 | Q14 | Chaos controls | **All 6** — scenario script · chaos dice · manual injection · chaos budget · auto-escalation · red-team AI |
| 5 | Q15 | Chaos visual | **Cinematic pulse** — full-width ribbon slide · red vignette · optional bass thump |
| 5 | Q16 | Post-event capture | **Margin card** — running narrative stream on right |
| 6 | Q17 | Interview timing | **Gated 5-stage** — Clarify 5m · Estimate 5m · Design 15m · Deep Dive 15m · Q&A 5m |
| 6 | Q18 | Interview modes | **All 7** — Study · Timed Mock · Exam · Pair AI · Review · Full-Stack Loop (90m SD+LLD) · Verbal |
| 6 | Q19 | Interviewer personas | **All 8** — Staff · Bar-raiser · Coach · Skeptic · Principal · Industry Specialist · Company Preset · Silent Watcher |
| 6 | Q20 | Problem browse | **Multi-lens** — domain / difficulty / company / LLD pattern / concept / chaos |
| 6 | Q21 | Post-interview artifacts | **All 8** — 6-axis rubric · AI postmortem · canonical compare · timing heatmap · follow-up drills · simulate-your-design · shareable PDF · streak stats |
| 6 | Q22 | SD↔LLD linkage | **Linked drills + optional 90-min full-stack loop** |
| 7 | Q23 | Cost display | **Per-node + corner meter + diff annotation** (full transparency) |
| 7 | Q24 | Providers | **All 6** — AWS · GCP · Azure · abstract units · cross-provider compare · bare-metal (Hetzner-style) |
| 7 | Q25 | Scale slider | **10k → 1M → 10M → 100M → 1B DAU** |
| 7 | Q26 | Cost activities | **All 7** — budget-constrained problems · cost-optimization drill · "what could we cut?" · cost-per-user · forecast curve · cost-vs-p99 Pareto · "cloud bill shock" |
| 7 | Q27 | Hidden costs | **All 8** — egress · observability · on-call · lock-in · cross-region · idle · retry amplification · compliance |
| 7 | Q28 | Real-company costs | **Named bands** — Netflix $400M/yr, Reddit $100M/yr, etc. with source + year stamp |
| 8 | Q29 | Visual differentiation | **Accent shift** — LLD amber → SD cobalt. Same layout, type, motion. |
| 8 | Q30 | Panel shape | **Collapsible docked** — 3-column baseline, `[` `]` to collapse sides |
| 8 | Q31 | Navigation | **Left rail mode icons + ⌘1-5** — matches LLD muscle memory |
| 8 | Q32 | Content formats | **All 8** — 8-section concept · 6-pane problem · numbers strip · decision tree · engineering blog links · ask-AI inline · try-it · cross-module bridge card |
| 8 | Q33 | Motion | **Match LLD** — 550ms baseline · 900ms chaos ribbons |
| 8 | Q34 | Onboarding | **90-sec guided spotlight** — dimmed mask · 1-sentence tour per panel |
| 9 | Q35 | Cross-module links | **End-of-page + permanent neighbor sidebar** |
| 9 | Q36 | Profile | **Unified with per-module lenses** — one streak · one FSRS queue mixing all |
| 9 | Q37 | Shortcuts | **All 8 universal** — ⌘K · ⌘, · ⌘⇧M · ⌘G · ⌘R · ⌘? · NL queries · ⌘[ ⌘] |
| 9 | Q38 | Persistence | **DB-first** — 10s writes · cross-device resume |
| 9 | Q39 | Dashboard | **Daily** — streak · cards due · resume · AI recommended |
| 9 | Q40 | AI context | **Progress-aware** — structured user state in every Sonnet call |
| 10 | Q41 | Shareability | **Every completed drill/sim → read-only share link** |
| 10 | Q42 | Mobile | **Read+Review** — Learn + Review + Profile + viewing on mobile; Build/Sim/Drill desktop-only |
| 10 | Q43 | User drills | **Private by default, optional public** |
| 10 | Q44 | Integrations | **All 8** — PNG/SVG/Mermaid/JSON export · drawio/Excalidraw/Lucid import · GitHub · Notion · Obsidian · LinkedIn badge · Google Calendar · Public API |
| 10 | Q45 | Crunch Mode | **7-day schedule** — user inputs onsite date + company → system schedules |
| 10 | Q46 | Wild cards | **All 12** — ELI5 · audio · seasons · portfolio · diagnostic quiz · weekly digest · blame-an-org · teacher mode · Architex Verified · talk-aloud mic · 3 themes · reference library |
| 11 | Q47 | Diagram types | **All 10** — architecture · sequence · deployment · data flow · state machine · ER · network · swimlanes · service mesh · cascade graph |
| 11 | Q48 | Node families | **All 16** — client · edge/CDN · LB · gateway · app · 6 DB flavors · cache · queue · storage · search · observability · auth · 3rd-party · containers · replicated badges · edge types |
| 11 | Q49 | Overlays | **All 10** — latency · cost · blast radius · request trace · locality · layered toggle · error rate · semantic zoom · timeline scrub · 3D isometric |
| 11 | Q50 | Smart canvas | **All 8** — pattern detection · anti-pattern warnings · AI suggestions · complexity score · constraint solver · reverse engineering · reference components · auto-layout |
| 11 | Q51 | Pedagogical formats | **All 8** — Build-Along · Debug-This · Inherit-Mess · Scale-Up · CTO Interview · Guided Derivation · Compare-Two-Companies · Evolving-Design Campaign |
| 11 | Q52 | Auto-artifacts | **All 8** — ADR · Runbook · RFC · IaC starter · Capacity Plan · Postmortem · Exec One-Pager · Interview Cheat-Sheet |
| 11 | Q53 | Rendering | **All 8 visuals** — blueprint · hand-drawn · particle flow · node breathing · serif labels · ambient sound · failure cinema · context icons |
| 11 | Q54 | Immersion | **Option F** — Ambient narrative + Decade Saga (40-hour MockFlix optional campaign) |

Fifty-four decisions; no placeholders; no "TBD". Each one locked.

---

## 1. Executive Summary

The Architex SD (System Design / HLD) module today is a 34-file simulation engine wrapped in an early canvas UI. The engine is unusually strong — real queueing theory (Little's Law, M/M/c), cascade propagation with exponential decay, a cost model with per-provider rates, a narrative engine that already turns chaos events into prose, a time-travel system, and a what-if forker. Very few products anywhere in the market have this depth. The surface on top of it is incomplete: no structured content, no interview clock, no coach, no cost transparency, no serif typography, no cinematic failure. **The engine has been built. The studio around it has not.**

This spec captures the rebuild — not a patch, a deliberate expansion — that turns the engine into the category-defining system-design learning experience. Six primary moves:

1. **A 5-mode system** (Learn / Build / Simulate / Drill / Review) replacing the single workspace. Simulate is the flagship and biggest mode. Learn/Review are Brilliant-grade retention surfaces. Build is a free-form drafting hall. Drill is the gated interview room. (B2·Q1)
2. **70 Opus-authored pieces** — 40 concept atoms (1200-1800 words each, 8-section format) + 30 problem molecules (2500-3500 words each, 6-pane format), cross-linked every direction. ~150k words total, ~200-300 Opus hours. World-class content is the content moat. (B3)
3. **Simulation as pedagogy, not tech demo.** Six activity framings — Validate, Stress Test, Chaos Drill (flagship), Compare A/B, Forecast, Archaeology — each with its own narrative arc, coaching layer, and post-sim triple loop (Learn/Build/Drill). Threshold coaching replaces raw numbers; a whisper-mode Haiku coach intervenes max 3 times per 5-minute sim. (B4)
4. **Chaos as cinema.** 73 events across 7 failure domains. 10 real-incident replays — Facebook 2021 BGP, AWS us-east-1 2021, CrowdStrike 2024, and seven others — each a 15-to-20-minute cinematic postmortem you can ride through and rewind. 6 chaos-control modes (scenario, dice, manual, budget, auto-escalation, red-team AI). Third-person present-tense serif narrator. Full-width ribbon slide, red vignette, optional bass thump. (B5)
5. **Interview layer with enforced phases.** Gated 5-stage clock (Clarify 5m · Estimate 5m · Design 15m · Deep Dive 15m · Q&A 5m). 8 interviewer personas including an 8-Company preset (Google, Meta, Amazon, Stripe, Netflix, Uber, Airbnb, generic FAANG). 7 mock modes including a 90-minute SD+LLD Full-Stack Loop. 8 post-interview artifacts including a 6-axis rubric, AI postmortem, canonical-compare side-by-side, timing heatmap, and shareable PDF recap. (B6)
6. **The Architect's Studio visual system, extended by one cobalt door.** Same shell as LLD. Same serif-sans-mono typography. Same motion (550ms baseline, 900ms chaos ribbons). Same 3-column collapsible panels. Same ⌘1-5 mode icons in the left rail. One accent change: LLD's warm amber is replaced by SD's cobalt blue. This preserves muscle memory and signals "you are in the systems wing now". (B8)

The scope is deliberately large. This is a 6-8 month build, three engineers plus one content lead. The phased rollout mirrors LLD's: foundations → Learn/Review for 10 concepts → Simulate+Drill → content expansion → Studio rendering → ecosystem. It is a bet that **depth, truth, and atmosphere — all three visible, felt, remembered — compound into a moat no bootcamp or SaaS tutor can match in the next 24 months**.

### How SD differs from LLD at the surface

| | LLD | SD |
|---|---|---|
| Scale of subject | One program · object model | System of programs · traffic · failure |
| Canvas | UML (classes, relationships, methods) | 10 diagram types (architecture, sequence, deployment, data flow, state, ER, network, swimlane, service mesh, cascade) |
| Node vocabulary | Class · interface · abstract class | 16 node families · 6 DB flavors · 3 edge types |
| Drill currency | 25-40 min, pattern → class structure | 45 min, 5-stage interview, the timer enforces rhythm |
| Flagship mode | Build (drafting table) | **Simulate** (wind tunnel) — new |
| Cost | Nothing (LLD ignores economics) | Per-node dollars · corner meter · diff annotation |
| Failure | AI review flags anti-patterns | **73 cinematic chaos events + 10 real incidents** |
| Accent color | Warm amber | Cobalt blue |

### How Architex SD differs from competitors

- **Hello Interview / ByteByteGo / DesignGurus** — PDF-style content, static diagrams, no simulation. Architex SD is the only product where the diagram *runs*.
- **Excalidraw / Lucid / diagrams.net** — drawing tools, no pedagogy, no cost, no failure. Architex SD is the only tool where the canvas *teaches*.
- **AWS Calculator / GCP Pricing** — cost only, no learning, no architecture. Architex SD integrates cost into the same canvas the user is designing on.
- **Chaos Mesh / Gremlin** — chaos engineering for production systems, not for learning. Architex SD applies chaos to a drawing so the cost of being wrong is zero.
- **Educative / Coursera** — lecture-first, no practice loop. Architex SD is practice-first, backed by Opus-authored explanations on demand.

No single product on the market today combines **Opus-grade content** + **a real simulation engine** + **cinematic chaos** + **enforced interview timing** + **editorial typography** + **cross-module knowledge graph**. That combination, carried at the craft level described in the rest of this spec, is the product.

---

