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

## 2. Target Personas

The module must serve all three at once. The 5-mode shell is shaped so a first-visit *Rookie* lands in Learn, a *Journeyman* lands in Build or Simulate, and an *Architect* lands in Drill — but nothing is locked, and the welcome banner gives an explicit choice on day one.

These personas are the SD versions of LLD's A-B-C-D personas. The names are changed because the stakes are higher and the titles more ambitious: reading distributed-systems theory is not the same shape of work as reading a GoF pattern. A chess analogy: *Rookie* has learned the moves, *Journeyman* has played the middlegame, *Architect* has played tournaments.

### Rookie · "I have built backends; I have never designed one."

- **Who:** 1-3 years of shipping. Comfortable with a single service, REST, a PostgreSQL. Has heard of sharding, Kafka, Raft; cannot confidently draw any of them.
- **% traffic:** ~35%
- **Primary mode:** Learn
- **Entry experience:** diagnostic quiz (Q46, 10 questions, 4 minutes) → guided 8-concept "Foundations" track → first Build project (URL Shortener) with rails on → first guided Simulate run ("what does 1k QPS look like?"). Threshold coaching is verbose on purpose. The whisper coach speaks slightly more often (cap 5 interventions instead of 3) in the first two weeks.
- **What success looks like:** at week 4, the Rookie can draw a 3-tier web app from memory, name the four caching layers, and explain what "consistent hashing" is without opening a tab. The knowledge graph shows ~15 concepts Completed, 3 Mastered.
- **Failure modes to design around:** too many acronyms in first session; the tool must feel **warm**, not cold. The diagnostic quiz must surface as *placement*, not *gatekeeping*. The first Simulate run must succeed visibly — no runaway cascade on day one.

### Journeyman · "I have been on-call. I have read the postmortems."

- **Who:** 3-7 years. Owns a service in production. Has debugged a cache stampede, a database migration, a queue backup. Knows there are patterns, does not yet have them catalogued.
- **% traffic:** ~45%
- **Primary mode:** Build, Simulate, and Drill (all three in rotation)
- **Entry experience:** skips the diagnostic; browses the 30 problem library; picks "Design Twitter" or "Design Uber" based on taste; attempts from blank canvas; hits Simulate; watches chaos events break their first attempt; rebuilds; reads the concept page inline when confused. Whisper coach is default (cap 3).
- **What success looks like:** week 8, the Journeyman has completed 12 problems at Mastered tier, survived 5 chaos drills with p99 under budget, can explain 4 hidden-cost categories. Starts appearing in the interview library's "you may be ready for Google Staff" band.
- **Failure modes:** this user will hate being condescended to. If the coach explains Little's Law to someone who clearly already knows it, the product dies. The whisper coach must have a **muted** default for Journeymen with a proven concept graph.

### Architect · "I'm interviewing at Staff or Principal in 6 weeks."

- **Who:** 7+ years. Has designed production systems end to end. Needs *interview fluency* — the specific rhythm of Clarify → Estimate → Design → Deep Dive → Q&A — not the concepts.
- **% traffic:** ~20%
- **Primary mode:** Drill (hard gate) + Simulate (for intuition) + Review (daily FSRS mix)
- **Entry experience:** skips everything; goes to the interview library; picks "Google Staff 45-min" preset; submits design under the 5-stage clock; gets the 6-axis rubric back. Optionally enters Crunch Mode (Q45) with an onsite date — system schedules a 7-day path.
- **What success looks like:** Architect completes 20+ mock interviews across 5+ company presets, average rubric score >= 4/5 on all axes, zero rubric "1" grades. Full-Stack Loop (SD+LLD) completed on at least 3 problems.
- **Failure modes:** the rubric must be *honest*. A 4/5 rubric score cannot be given for a vague design. Architects sniff out grade inflation in 30 seconds and never come back. The AI postmortem (Q21) must be willing to say "your design fails under geographic partition" when it does. The Skeptic persona (Q19) must actually push back.

### Cross-persona rules

- **Default first-visit** is Learn mode + a dismissable welcome banner that explicitly offers *"Start with concepts"*, *"Start with a problem"*, *"Just let me draw"*, and *"I'm interviewing soon"*. The fourth option triggers Crunch Mode directly.
- **Returning users land on their last-used mode**, same rule as LLD. State is DB-first so this survives a device switch (Q38).
- **Placement affects pacing, not permission.** No content is gated. A Rookie can open a Principal-level problem; they will see a "difficulty: hard" badge and a one-line warning, but they can enter. Gating on ambition is product suicide.
- **The diagnostic quiz (Q46) is optional**, appears as a welcome card, takes 4 minutes, and feeds the study-plan generator. Skippable with "I'll figure out my level".
- **Mobile (Q42):** Rookies and Journeymen get mobile Learn + Review. Architects get a mobile-viewable rubric + PDF recap. Build, Simulate, and Drill remain desktop-only with an honest "open on desktop" nudge. This is a tradeoff; see §19.

### One persona pattern the spec will use repeatedly

Throughout this spec, decisions are frequently annotated "**R / J / A**" to indicate which personas benefit most. When R and A pull in opposite directions (e.g. the coach should explain vs. the coach should stay silent), the decision is resolved by personalizing on user state — the Whisper Coach Cap (§15) is a function of `user.masteredConceptCount`, not a global constant.

---

## 3. Product Surface · The Five Modes at a Glance

One URL. One shell. Five modes. One mode at a time. The mode is the *place*, not a panel toggle. The shell around the five modes is identical to LLD's (§18) with the cobalt accent swap.

| Mode | Icon · shortcut | Room metaphor | Purpose | Session shape | Best for |
|---|---|---|---|---|---|
| 📖 **Learn** | book · ⌘1 | Reading nook, lamp, high-backed chair | Teach one concept or problem from zero | 10-25 min, scroll-based, checkpoint-gated | R, J |
| 🎨 **Build** | drafting compass · ⌘2 | Drafting hall, blueprint on the slab | Free-form exploration · sketch a design from scratch or a template | 15-90 min, open-ended, save-driven | J |
| 🌪 **Simulate** | wind turbine · ⌘3 | The wind tunnel at the end of the hall | Run a design against traffic, cost, and chaos | 5-30 min per run, result-oriented | J, A (flagship — every mode links here) |
| 🎯 **Drill** | clipboard · ⌘4 | Examination room, one clock on the wall | Gated 5-stage mock interview under a timer | 45 min (or 90 min for Full-Stack Loop) | A |
| 🔁 **Review** | circling arrow · ⌘5 | Reading chair by the window | FSRS-driven daily retention · mixes SD/LLD/Algorithms cards | 2-4 min/day | all |

The shortcut and icon positions match LLD exactly. LLD's Build is ⌘2; SD's Build is ⌘2. LLD's Review is ⌘4; SD's Review is ⌘5 (shifted by one because Simulate slots into ⌘3). This is the only SD-side change to universal keybindings (Q37). Users who have built LLD muscle memory will retrain in one session.

### Why five, not four

The LLD module has four modes; SD has five because **Simulate is not a feature, it is a room**. You don't "simulate inside Build" any more than you "render inside Illustrator". A simulation is a distinct activity with distinct goals, a distinct UI shape (particle layer + metric strip + narrative stream + chaos console), a distinct attentional posture, and distinct post-activity loops. Trying to collapse it into a panel inside Build would bury the flagship under tabs. The brainstorm in B2·Q1 made this explicit: *"Simulate is the wind tunnel. Wind tunnels are not drafting tables."*

### Mode resolution logic

```typescript
function resolveSDMode(): SDMode {
  if (searchParams.mode) return searchParams.mode;        // URL wins, shareable
  const stored = userPrefs.sd.mode;                        // DB-first, cross-device
  if (stored) return stored;
  if (isFirstVisit) {
    uiStore.setState({ showSDWelcomeBanner: true });
    return "learn";                                          // R default
  }
  return "learn";
}
```

Per Q38, the mode preference is persisted in `user_preferences.preferences.sd.mode`. localStorage is cache only. A 10-second debounce write-through ensures that if a user switches laptops mid-week, the new device lands in the same mode.

### Three design invariants

These mirror LLD §5 but are restated because new readers may come to this spec first.

1. **Build mode's canvas is the same engine Simulate uses.** No bifurcation. The ReactFlow instance in Build is the ReactFlow instance you drag into Simulate's wind tunnel. The particle layer and metric strip appear in Simulate; they are dormant (but present in DOM) in Build. Zero data migration on mode switch.
2. **Mode is a single piece of state.** Persisted to `user_preferences.preferences.sd.mode`. URL-reflectable via `?mode=simulate` for sharing. localStorage caches.
3. **All modes share one content source.** Same 40 `SDConcept` objects, same 30 `SDProblem` objects, same 73 `SDChaosEvent` records, same 10 `SDRealIncident` records. No duplication across modes.

### The shell itself

- **Top chrome** · breadcrumb + **module switcher (⌘⇧M)** to jump SD → LLD → Algorithms → OS&DB · **mode switcher pill** (Learn | Build | Simulate | Drill | Review) · notification bell · search (⌘K) · settings (⌘,)
- **Left icon rail** (Architex-wide, unchanged from LLD except the active-module highlight) — 4 module icons, 1 review icon, 1 profile icon
- **Main content area** · swaps per mode
- **Right neighbor sidebar** (Q35) · collapsible with `]` · shows "what to do next" links and cross-module bridges
- **Status bar** · contextual live info (sim tick, cost/hour, elapsed drill timer, chaos budget remaining)

### Mode-switch choreography

Same 300ms slide as LLD (B8·Q33). Cobalt accent slides in from the right when you enter Simulate, out to the left when you leave. State preservation follows LLD's Smart Boundaries (§7):
- Build canvas state: persists forever
- Simulate mid-run: warn + offer "pause & save run" when switching
- Drill mid-interview: hard-block with a confirmation dialog
- Learn scroll position: persists per concept page
- Review mid-card: persists per session

Three confirmation dialog moments total: unsaved build, mid-sim switch with >10s of sim elapsed, drill mid-submit. Everything else is silent preservation.

---

## 4. Information Architecture

The SD module has four primary object types and a web of secondary relationships that must be navigable from any surface. This section defines the URL shape, the library routes, the browse facets, and the cross-module bridges.

### 4.1 Primary objects

| Object | Count at launch | URL shape | DB table |
|---|---|---|---|
| **Concept** (atom) | 40 | `/sd/concepts/{slug}` | `sd_concepts` |
| **Problem** (molecule) | 30 | `/sd/problems/{slug}` | `sd_problems` |
| **Simulation run** (instance of a Build + scenario) | user-generated, unbounded | `/sd/sim/{runId}` | `sd_simulation_runs` |
| **Drill attempt** (mock interview, timed) | user-generated, unbounded | `/sd/drill/{attemptId}` | `sd_drill_attempts` |

Secondary objects include `SDChaosEvent` (73 records), `SDRealIncident` (10), `SDTemplate` (canonical starter diagrams), and `SDShareLink` (one row per public share, every completed drill/sim produces one per Q41).

### 4.2 URL shape

```
/sd                                      → module home (dashboard)
/sd/learn                                → Learn library (40 concepts + 30 problems)
/sd/learn/concepts/{slug}                → concept page (8-section)
/sd/learn/problems/{slug}                → problem page (6-pane)
/sd/build                                → Build mode (empty canvas or resume)
/sd/build/{diagramId}                    → named saved diagram
/sd/simulate                             → Simulate mode entry
/sd/simulate/run/{runId}                 → specific past run
/sd/drill                                → Drill library (30 problems, company presets, filters)
/sd/drill/{attemptId}                    → live or completed drill
/sd/review                               → Review mode (FSRS mixed queue)
/sd/chaos                                → chaos library (73 events + 10 incidents)
/sd/chaos/incidents/{slug}               → real-incident replay page
/sd/share/{shareId}                      → public read-only shared diagram / run / drill
```

All mode-switch deep links respect `?mode=build|simulate|drill|learn|review` and `?resume=1`. All share links are OG-image-enabled with a cobalt-blue grade card (Q21).

### 4.3 Library routes and multi-lens browse (Q20)

The concept and problem libraries are one unified `/sd/learn` with a faceted filter bar. The same route is reused from Drill mode (`/sd/drill`) with "problems only" filtering. Users should be able to discover a problem **six ways**:

| Lens | Example filter | Where applied |
|---|---|---|
| **Domain** | `?domain=media-social` | Learn, Drill |
| **Difficulty** | `?difficulty=staff` (easy / mid / staff / principal) | Learn, Drill |
| **Company** | `?company=google` | Drill primarily |
| **LLD pattern** | `?lldPattern=observer` (linked through the graph) | Learn (cross-module bridge) |
| **Concept** | `?concept=consistent-hashing` (show problems that use it) | Learn |
| **Chaos event** | `?chaosFamily=cascade` (problems that train resilience against this) | Chaos library entry |

Lenses stack. `?domain=media-social&difficulty=staff&company=meta` narrows to "Staff-level Meta interview problems in media domain" (typically 2-4 matches). This is the second-most-used navigation in the product after mode-switch, because Journeymen and Architects primarily browse by these axes.

### 4.4 Knowledge graph (cross-module, Q5, Q35)

Every concept, problem, and LLD pattern is a node in a shared graph. Edges:

- `concept → concept` (prerequisite, partial: *consistent-hashing requires hashing-basics*)
- `concept → problem` (problem uses this concept)
- `problem → problem` (related: similar shape, common traps)
- `problem → lld-pattern` (e.g. "Design Twitter" links to LLD's Observer, Pub-Sub)
- `problem → chaos-event` (this problem is vulnerable to this event without the right primitive)
- `lld-pattern → sd-concept` (Circuit Breaker pattern ↔ Resilience concept)

The graph is navigable three ways:

1. **Permanent neighbor sidebar** on every concept / problem page (Q35), shows 4-6 linked nodes with one-line context
2. **End-of-page link cards** (Q35), more expansive — 2-3 sentences per link
3. **Graph view** (⌘G, Q37) — zoomable 2D map of all modules. Cobalt for SD, amber for LLD, teal for Algorithms. Clustered by domain. Click a node to open its page.

The graph is stored as Postgres edges and exposed by a `GET /api/graph` endpoint. The `⌘G` command invokes the graph overlay, not a new page — overlays feel continuous, routes feel like departures.

### 4.5 Dashboard (Q39)

`/sd` (module home) is the SD dashboard. Four cards above the fold:

1. **Streak pill** — total Architex streak (unified across modules, Q36), days to next milestone, don't-break-the-streak nudge
2. **FSRS queue** — "N cards due today" with quick-start button to Review
3. **Resume** — most recent Build, Simulate, or Drill in flight, one-click continue
4. **AI recommended** — Sonnet picks one next thing based on progress state (Q40). "You completed Rate Limiter yesterday. Try it under Chaos Drill conditions." or "Your p99 intuition is still weak — consider the Stress Test activity on your URL Shortener design."

Below the fold:
- Progress rings per concept wave (8 rings, 5 concepts each roughly)
- "Your 7-day heatmap" (minutes per day, per module, color-coded)
- A "Neighborhood" panel showing 4 concepts you have not started, relevant to what you have
- A "Recent shares" strip if the user has any shareable artifacts

The dashboard is mobile-friendly (Q42). Build/Simulate/Drill are not.

### 4.6 Crunch Mode entry (Q45)

A separate entrypoint card on the dashboard: *"Interviewing soon?"*. Clicking opens a 3-field dialog:
- Onsite date (calendar picker)
- Company (free-text with autocomplete, 8 presets available)
- Seniority (IC4 / IC5 / IC6 / Staff / Principal)

Submit → Sonnet generates a 7-day path (Q45), writes it to `sd_study_plans` (see §21), and the dashboard rearranges to show today's Crunch Mode list at the top. The plan is editable. The user can snooze a day; the plan shifts.

### 4.7 Mobile IA

Mobile users (Q42) see a reduced IA:
- `/sd` (dashboard)
- `/sd/learn/*` (read-only concept and problem pages)
- `/sd/review` (mobile-first FSRS card stack with swipe gestures)
- `/sd/share/{shareId}` (view-only shares)
- `/profile/*`

Attempting to visit `/sd/build`, `/sd/simulate/*`, or `/sd/drill/*` on mobile renders an "open on desktop" card with a share-to-desktop QR code (if the user is logged in, the URL + mode deep-link are already persisted, so the desktop session resumes exactly).

### 4.8 Anonymous vs authenticated

Same rules as LLD §7 (Q17). Anonymous users can browse concepts, problems, the chaos library, and real-incident pages. They can run up to 3 Simulate runs and 1 Drill per session (stored in localStorage). On auth, a migration decision tree merges any local state into the DB. First-visit users get Case 1 silent auto-merge with a welcome toast: *"Welcome back. Your 2 drafts have been saved to your account."*

---

## 5. Content Strategy · 40 Concepts + 30 Problems + 10 Real Incidents

The content is the moat. Competitors can copy the UI chrome in six weeks. They cannot copy 150,000 words of Opus-authored prose that is technically accurate, narratively memorable, and structurally consistent across 70 pieces.

### 5.1 Authorship (Q1 elevated from LLD; B3 reaffirms)

All 40 concepts and all 30 problems are hand-written by Claude Opus 4.7. No stock material. No copy-paste from Refactoring Guru. No Wikipedia rewrites. The voice is the Architex brand voice (defined in `architex/docs/CONTENT_STRATEGY.md`) tuned for distributed-systems prose:

- **Clarity over cleverness.** "Consistent hashing reduces the number of keys that must move when the cluster size changes" beats "Consistent hashing is a beautifully elegant algorithm that solves the graceful degradation problem."
- **Specific, concrete, never generic.** "When Twitter shards its timeline by user-id modulo 256, adding shard 257 would move 99.6% of keys. Consistent hashing moves only 1/257 of them." beats "consistent hashing helps with sharding".
- **The tradeoff is never hidden.** Every pattern has a "You gain X. You pay Y." paragraph. "You gain smooth cache rebalance. You pay with an extra hash step per request and a slightly more complex debugging story when a ring is misconfigured."
- **Authority without arrogance.** The voice knows what it is saying; it does not perform its knowledge. No "obviously" or "of course". No condescension. The reader is a peer.
- **Numbers are load-bearing.** "A single Redis shard can serve ~100k ops/sec at sub-millisecond p99 on typical hardware; plan for 30-50k in your capacity model to leave headroom." Numbers are cited (`citation: Instagram engineering blog, 2018`). Unsourced numbers are flagged and reviewed.

Authoring protocol (same as LLD §8):
1. Opus receives a prompt with the section frame, the brand voice rules, the user persona spectrum (R/J/A), and a "what could go wrong in this piece" checklist.
2. First draft. Human editor (content lead) passes. Specific edits routed back to Opus. Second draft. Merge.
3. Every code example is tested. Every number is sourced. Every diagram referenced in the text is confirmed to exist.
4. Voice variants for Q46 (ELI5 mode): Opus writes a second, warmer, analogy-first version of each concept page. Three toggle states — ELI5 / Standard / ELI-Senior — mirror the LLD voice-variant system. Launch ships Standard only; ELI5 and ELI-Senior ship in Phase 4.

### 5.2 The 40 concepts · 8 waves (B3)

Each concept is an atom. 1200-1800 words. 8 sections (see §5.4). Each gets its own `/sd/learn/concepts/{slug}` page and a row in the knowledge graph.

**Wave 1 · Foundations (5)** — the vocabulary every design conversation assumes
- Client-server · Request-response · Statelessness · Idempotency · The three metrics that matter (latency, throughput, availability)

**Wave 2 · Scaling Primitives (6)** — the levers you pull when one box isn't enough
- Vertical vs horizontal scaling · Load balancing (L4, L7, DNS, anycast) · Caching strategies (cache-aside, write-through, write-back, refresh-ahead) · CDN fundamentals · Connection pooling · Backpressure

**Wave 3 · Data & Consistency (6)** — the part nobody understands until they have been burned
- CAP in practice · Consistency models (strict, linearizable, sequential, causal, eventual) · Replication (leader-follower, multi-leader, leaderless) · Sharding & consistent hashing · ACID vs BASE · Distributed transactions (2PC, Saga, TCC)

**Wave 4 · Messaging & Streams (4)** — the async nervous system
- Message queues vs event streams · Delivery semantics (at-most-once, at-least-once, exactly-once) · Change data capture (CDC) · Stream processing (windowing, watermarks, exactly-once in Kafka/Flink)

**Wave 5 · Distributed Systems (5)** — the hard theorems
- Consensus (Raft, Paxos in one paragraph) · Leader election · Distributed clocks (logical, vector, HLC) · Gossip protocols · Quorum reads and writes

**Wave 6 · Resilience (4)** — the "you are going to be paged" wave
- Circuit breakers · Retries with jitter and exponential backoff · Bulkheads and pool isolation · Graceful degradation

**Wave 7 · Operational (5)** — what you wish you had learned before on-call
- Observability (metrics, logs, traces, and how they differ) · SLI/SLO/SLA · Deployment patterns (blue-green, canary, feature flags, rollback) · Capacity planning (Little's Law in practice) · Incident response (the runbook shape)

**Wave 8 · Modern (5)** — what's on the table in 2026
- Edge compute & the stateless-at-the-edge pattern · WebAssembly as a runtime boundary · Vector search & RAG · Event sourcing & CQRS · AI as a system component (LLM behind a queue, embedding indexes, retry behavior for hallucinations)

Total: 40. Each wave finishes with a "wave completion" certificate (same mechanic as LLD). The 8 waves have been ordered so that each wave's concepts are *prerequisites* for the next — a Rookie who completes Wave 1 can enter Wave 2 without gaps, a Journeyman can enter Wave 5 without needing Wave 2 (they already know it).

### 5.3 The 30 problems · 6 domains (B3)

Each problem is a molecule. 2500-3500 words. 6 panes (see §5.5). Each problem is cross-linked to the concepts it uses, the LLD patterns it leans on, and the chaos events it must withstand.

**Domain 1 · Media & Social (8)**
- Design Twitter · Design Instagram · Design YouTube · Design TikTok · Design a comment system (Reddit-style) · Design a newsfeed ranking · Design a notification service · Design a live video stream

**Domain 2 · Location & Real-time (5)**
- Design Uber (dispatch) · Design Google Maps (tiles + routing) · Design Foursquare / proximity service · Design a ride-pricing engine (surge) · Design Find My (device locator, eventually consistent location)

**Domain 3 · Storage & Sync (4)**
- Design Dropbox · Design Google Docs (collaborative editing) · Design a version control system (simplified Git server) · Design an offline-first note app sync

**Domain 4 · Commerce & Payments (5)**
- Design Amazon product catalog + checkout · Design Stripe (payment processing at idempotency grade) · Design an inventory reservation system (Ticketmaster) · Design a fraud-detection pipeline · Design a two-sided marketplace (Etsy-style)

**Domain 5 · Search & Discovery (3)**
- Design Google Search (crawler → index → ranker) · Design autocomplete at typeahead scale · Design a recommendation engine (YouTube-style collaborative filtering)

**Domain 6 · Infrastructure (5)**
- Design a URL shortener (warmup) · Design a rate limiter · Design a distributed cache · Design a monitoring / observability pipeline (Datadog-shape) · Design a message queue (Kafka-shape)

Total: 30. Domain 6 includes two warmups (URL shortener, rate limiter) suitable for Rookies. Domain 4's Stripe problem is Principal-level. The mix is intentional; the library must reach from first-interview to Principal onsite in one span.

### 5.4 Concept page · 8-section format (Q32)

Each 1200-1800 word concept page has these sections in order. The format is explicit so that users recognize it instantly by week two and can skim efficiently.

1. **Hook** · one scenario, 2-3 sentences. Concrete. "It's Black Friday at Amazon. You have 50,000 add-to-carts per second. Your payment provider can handle 500. What do you do?"
2. **Analogy** · one memorable physical mapping. For consistent hashing: "Imagine assigning 10,000 mail carriers to deliver letters across a ring-shaped city. When one carrier quits, you only need to redistribute letters in their slice — the rest continue. That's consistent hashing."
3. **The Primitive** · the formal definition and mechanics. Diagrams, formulas, pseudocode. 3-5 paragraphs. The technical meat.
4. **Numbers that matter** · one "numbers strip" (Q32) — typical latencies, throughputs, cost ranges. "Single Redis shard: 100k ops/sec · sub-ms p99 · ~$0.11/hr on AWS cache.t4g.medium."
5. **Tradeoffs · what you gain, what you pay** · the honest cost-benefit paragraph.
6. **When not to use it** · one paragraph listing 2-3 anti-cases where the primitive is the wrong choice.
7. **Seen in the wild** · one named-company example with source. "Cassandra uses consistent hashing with virtual nodes to balance load across an uneven cluster (DataStax engineering blog, 2016)."
8. **Bridges** · 3-5 links: *concepts this depends on*, *problems that use this*, *LLD patterns that implement this*, *chaos events this protects against*.

Each section has a word target (hook: 60w, analogy: 120w, primitive: 500-700w, numbers: 80w + table, tradeoffs: 200w, anti-cases: 150w, wild: 150w, bridges: cards). Opus hits these targets within ±20%.

### 5.5 Problem page · 6-pane format (Q32)

Each 2500-3500 word problem page has six panes. The panes are tabs or accordion sections in the UI; on-page, they stack in this order.

1. **Problem statement** · the question as an interviewer would state it, with clarifying context and assumed scope. "Design Twitter. Assume 500M DAU, 200B tweets stored, 150k tweets/sec peak. Focus on the read path for the home timeline."
2. **Clarifying questions the user should ask** · 8-12 questions with typical answers. Trains the Clarify phase (5 min) of the gated interview clock. "Is timeline ordered strictly by time? → No, ranked. Is ranking real-time or precomputed? → Hybrid (we'll design the fan-out + re-ranker)."
3. **Napkin math** · the back-of-the-envelope estimate. Storage per tweet. Storage at scale. QPS at peak. Bandwidth. Cache working set. This trains the Estimate phase.
4. **Canonical design (2-3 solutions)** · per Q3, each problem ships with 2-3 canonical solutions. Solution A might be "fan-out on write, Redis-backed timeline cache". Solution B is "fan-out on read, search-based". Solution C for whale problems (users with >10M followers) is "hybrid with whale-detector queue". Each solution is a diagram + walkthrough (400-600 words per solution).
5. **Failure modes & resilience** · a 4-6 paragraph section discussing what breaks at scale: thundering herd, celebrity-user fan-out, cache stampede, database hot keys. Ties to specific chaos events the user can trigger in Simulate.
6. **Real-world references** · 3-5 named-company links: Twitter's engineering blog on timeline architecture, Mastodon's federation model as a contrast, an Instagram post on cache warmup strategies. Includes year stamps (Q28). Each link opens a read-later dialog so the user doesn't leave mid-study.

Word target: 2800 per problem (±300). Opus hits this in 3 rounds.

### 5.6 The 10 real incidents (Q13)

Each is a cinematic multi-scene replay. 1500-2500 words of narration, a replay-able simulation, a real timeline, and a postmortem. All 10:

1. **Facebook 2021 BGP** · Oct 4, 2021. Facebook withdraws its own BGP routes. 6-hour global outage. DNS collapses. Physical access to datacenters needed because badge systems depend on the network.
2. **AWS us-east-1 Dec 2021** · Networking control-plane issue. Cascade through dozens of AWS services. Ring/Echo fall over. Disney+ goes dark. A day of pagers across half the internet.
3. **Cloudflare 2019 regex** · July 2, 2019. A regex with catastrophic backtracking (`.*.*=.*`) is pushed to global. CPU saturation on every edge. 27-minute outage.
4. **GitHub 2018 DB** · Oct 21, 2018. Network partition splits US East from US West for 43 seconds. MySQL primary elects independently in both regions. 24 hours to reconcile.
5. **Fastly 2021** · June 8, 2021. Edge config bug from one customer triggers crash loop across CDN. Reddit, NYT, GOV.UK, Amazon all dark for ~1 hour.
6. **Slack Jan 4, 2021** · Clock skew after holiday leads to stampede on AWS Transit Gateway, plus a cascade in their internal service discovery.
7. **Discord Mar 2022** · 4-hour outage traced to a database migration that did not anticipate read-traffic during switchover.
8. **Roblox Oct-Nov 2021** · 73-hour outage. Consul cluster degraded, cache had gone cold during a holiday-specific traffic pattern. Recovery took days.
9. **Knight Capital 2012** · 45-minute software deploy causes $465M loss. 7 of 8 servers updated; one was not. An old code path reactivated.
10. **CrowdStrike 2024** · July 19, 2024. A kernel-level channel-file update is rolled out without canary. ~8.5M Windows machines blue-screen globally.

Each incident page has:
- **Timeline** · minute-by-minute what happened, with cinematic serif narration
- **Replay** · click "Replay this" and the sim engine runs the cascade on a faithful diagram of the real architecture
- **Postmortem** · what the company's published postmortem said · what Architex adds · learnings extracted
- **Bridges** · which concepts and problems this connects to

Real incidents are the most emotionally resonant content in the product. Users who complete one never forget that day.

### 5.7 Content quality signaling

Extend `moduleContent` with a field:

```typescript
contentQuality: "draft" | "polished" | "published" // DEFAULT "polished"
generatedBy: "human" | "ai" | "hybrid"
lastReviewedAt: timestamp
sourceYear: number // for cited facts that age (e.g. "Redis can do 100k ops/sec")
```

Launch content ships `polished/hybrid` (Opus draft + human editor review). Anything with `sourceYear` older than 4 years triggers a review reminder in the content-ops dashboard.

### 5.8 Content debt strategy

The 70-piece library is built in three phases:
- **Phase 2 (alpha)**: Wave 1 Foundations (5 concepts) + 3 warmup problems (URL shortener, rate limiter, distributed cache). **8 pieces**, ship with alpha.
- **Phase 3 (beta)**: Complete Waves 2-3 (12 more concepts) + 10 more problems across domains. **30 pieces**, ship with beta.
- **Phase 4 (GA)**: Remaining 23 concepts + 17 problems. **40 pieces**, ship with full rollout.

Each phase has a content-ops track running in parallel with engineering. Target: 1.5 pieces per day from Opus + editor. 70 pieces = ~7 weeks of content work, compressible to 5 if editor throughput is doubled. Budget ~200-300 Opus hours plus ~120 editor hours.

---

## 6. Mode Deep-Dive · Learn

> "A concept is where you draft a primitive. A problem is where you draft a machine." — brand voice doc, extended

### 6.1 Purpose

Learn mode teaches either a **concept** (one primitive, one atom) or a **problem** (one molecule, a named design). The two entry routes converge on the same shell but use slightly different lesson shapes: concepts use the 8-section format, problems use the 6-pane format. Learn's measurable success criterion is: the user finishes the page with one Mastered concept or one read-through problem in their graph, and can explain it aloud 10 minutes later without a reference.

### 6.2 Layout (desktop)

3-column collapsible (Q30). Default widths: 200px + center + 420px. Both sides collapsible with `[` and `]`.

```
┌───────────────────────────────────────────────────────────────────┐
│  Top chrome · module switch · mode pill · search · user           │
├───┬───────────────────────────────────────┬───────────────────────┤
│ L │  Center pane:                          │  Right pane:           │
│ i │   · concept pages: read-only canvas   │   · 8-section or       │
│ b │     + 8-section scrolling prose below │     6-pane lesson      │
│ r │   · problem pages: read-only canvas    │   · checkpoints inline │
│ a │     per canonical solution, tabs top  │   · Ask AI button      │
│ r │                                        │   · Tinker toggle      │
│ y │                                        │                       │
├───┴───────────────────────────────────────┴───────────────────────┤
│  Status bar · scroll progress · time-on-page · streak · ⌘? hints  │
└───────────────────────────────────────────────────────────────────┘
```

Mobile (Q42): center canvas is replaced by an inline SVG; lesson prose stacks below. No side rails. Tinker disabled. Read-only.

### 6.3 Concept page (8-section) interaction

The eight sections scroll vertically. As the user scrolls, the center canvas **highlights the diagram parts being discussed** — the LLD scroll-sync pattern, applied to architecture diagrams. Scrolling past the "Consistent hashing ring" section lights the ring overlay on the canvas. Clicking a node in the canvas pops a scroll-target back to the section where it is discussed.

Checkpoint placement:
- End of Section 3 (**Primitive**): one MCQ checkpoint to confirm the technical mechanic was absorbed
- End of Section 5 (**Tradeoffs**): one "rank these tradeoffs" drag-to-order checkpoint
- End of Section 8 (**Bridges**): one "match concept → problem" checkpoint

Three checkpoints per concept. FSRS writes on each attempt. Same progressive reveal on failure as LLD (Q3): attempt 1-2 = targeted why-wrong, attempt 3 = reveal. Skip always available.

### 6.4 Problem page (6-pane) interaction

Problem pages are more complex. Six panes, but users rarely read all six linearly — most jump to **Canonical Design** first, then read backward for context, then read forward for failure modes. The UI respects this:

- Tabs across the top of the center pane for the 6 panes. Active tab highlights.
- A "recommended reading order" pill ("for Rookies: 1→2→3→4→5→6; for Journeymen: 4→5→3→2→6; for Architects: 4→5→2→3→6") visible but dismissable.
- Solution tabs inside **Canonical Design** for A/B/C solutions. Clicking switches the canvas diagram. Each solution has its own walkthrough.
- **Simulate this design** button appears after Canonical Design is read. One click → opens Simulate mode with the solution canvas preloaded. This is the *triple loop* (Q10) entering its first arc.

Checkpoint placement for problems:
- One "estimate this" Fermi checkpoint inside the Napkin Math pane (tests estimate fluency)
- One "pick the failure mode" checkpoint at the end of Failure Modes
- One "which chaos event would break this?" checkpoint that opens a chaos-event picker

### 6.5 Tinker (Q8 ported from LLD)

On any Learn page, a floating **"✏️ Tinker"** button unlocks the canvas temporarily. The read-only lesson canvas becomes editable. Toolbar appears: `Reset · Save to Build · Done · ⎋`. Scroll-sync pauses during tinker.

When the user tinkers, the lesson column greys slightly, conveying "you're in sandbox time". If they accumulate non-trivial edits (>3 node or edge changes), the Done button becomes "Save to Build". Confirming opens Build mode with the tinkered canvas as a new unnamed diagram, ready to save.

### 6.6 Ask-AI contextual surfaces (Q40, Q32)

Three specific surfaces per page (same structure as LLD §6):

1. **End of each section**: "Questions about this section? [Ask the Architect →]". Opens a right-side drawer with a contextual prompt preseeded (section title, concept slug, user's progress state). Sonnet answers with references to diagrams and code samples on-page.
2. **After 3 failed checkpoint attempts**: "Want a deeper explanation? [Ask →]" with the specific checkpoint answer in context.
3. **On a "Confused with" card**: if the concept or problem page has a "commonly confused with" callout (e.g. "Consistent hashing ≠ hash-based sharding"), the Ask card on that callout is pre-loaded with the compare-prompt.

Token cost ~$0.015 per Learn page session at baseline, ~$0.06 for heavy askers. Per-user rate limit: 30 calls/hour via existing `aiUsage` table.

### 6.7 Frustration escalation (Q15 from LLD, reused)

Four levels:
- **Calm**: silent
- **Mild** (time-on-section > 2x median, 1 failed checkpoint): inline nudge — "Stuck? The analogy in section 2 might help here."
- **Frustrated** (2 failed checkpoints + scroll thrashing): AI offer — "Want a 1-on-1 walkthrough? [Ask the Architect →]"
- **Very-Frustrated** (3 failed + back-scroll twice): easier-path card — "This concept often clicks after a related one. Try [Foundations: Caching strategies] first?"

Learn mode is where frustration detection matters most. Drill never intervenes (simulation integrity). Simulate uses a different mechanism (the whisper coach, §15).

### 6.8 Cold recall & elaborative interrogation (CS3, CS6 from LLD)

Both cognitive-science features ship in SD Learn:

- **Cold recall** · 10 minutes after a concept session ends, a toast appears: "You finished Consistent Hashing 10 minutes ago. 30-second recall quiz?". Opt-in, skippable. If taken, three quick Q's. Results feed FSRS.
- **Elaborative interrogation** · after each concept page, one "Why?" prompt appears at the bottom: "In your own words, why does consistent hashing reduce the number of keys that move when a node is added?" Free-text. Haiku grades for depth (1-5 rubric). Writes a `concept_reflection` record.

### 6.9 Learn → Build / Learn → Simulate bridges

At the bottom of every concept page:
- "Draft this yourself in Build →" · opens Build with an empty canvas pre-filled with the concept's reference diagram
- "See it run in Simulate →" · opens Simulate with the canonical example and a default stress test
- "Try a problem that uses this →" · shows 2-3 problem cards (from the graph)

At the bottom of every problem page, additional bridges:
- "Run the chaos drill on this →" · opens Simulate with Chaos Drill activity on this problem's canonical design
- "Do this under the 5-stage clock →" · opens Drill
- "Pair with LLD: [linked pattern] →" · cross-module bridge (Q5, Q35)

### 6.10 Motion & visuals (Q33, Q53)

All motion inherits from LLD's motion.ts with the cobalt accent (Q29). New Learn-specific:

- **Progressive diagram reveal** (M3-analog): as the user scrolls through a concept's 8 sections, diagram nodes fade in + scale up at the moment they are discussed. The first time the user scrolls into section 3 of Consistent Hashing, the ring materializes.
- **Breathing canvas** when idle (M8-analog): on 10s idle, all canvas nodes begin a 4-second breathing pulse. Subtle. Designed to be ignorable.
- **Serif labels on canvas** (Q53): concept pages use IBM Plex Serif for callout labels over the canvas. The diagrams feel like pages from a textbook, not screenshots of a SaaS.

### 6.11 Learn-mode-specific keyboard (Q14 extension)

- `J` / `K` · scroll down / up by one section
- `Enter` on a checkpoint · submit
- `Space` · reveal answer (after 2 failed attempts)
- `T` · toggle Tinker
- `[` / `]` · collapse left / right pane
- `?` · surface all shortcuts

### 6.12 Completion criteria (3-tier, Q4 from LLD)

Same tier model:
- **Introduced ◐** · first scroll past Section 3
- **Completed ◉** · all 3 checkpoints answered, regardless of grade
- **Mastered ★** · all 3 checkpoints answered correctly first-try + 1 follow-up FSRS review passed at Good or Easy

Mastered decays to Completed if a Review rating of Hard or Again is given within 90 days (FSRS-5 handles the schedule). This is honest — distributed systems knowledge is not static; re-earning mastery matters.

---

## 7. Mode Deep-Dive · Build

> "The drafting hall is where the blueprint begins. It is not yet a building."

### 7.1 Purpose

Build mode is the free-form drafting hall. The user draws an architecture from blank canvas, from a template (Q3), or from a tinker handoff out of Learn mode. There is no timer, no grader, no chaos — just diagram, node properties, and unlimited save slots. Build is where Journeymen spend most of their time between interviews.

### 7.2 Layout

3-column collapsible with a bottom tab area (Q30). Default widths: 260px + center + 360px, with a 240px bottom panel.

```
┌───────────────────────────────────────────────────────────────┐
│  Top chrome                                                    │
├──────────┬───────────────────────────────────┬────────────────┤
│  Library │         Canvas (ReactFlow)        │   Properties    │
│          │                                    │                 │
│  · 10    │   · node families palette          │   · selected    │
│    diag. │   · edges (sync / async / batch)   │     node/edge   │
│    types │   · overlays togglable             │   · config      │
│  · 16    │   · auto-layout & snap             │   · cost + SLO  │
│    node  │                                    │     hints       │
│    fam.  │                                    │                 │
│  · refs  │                                    │                 │
│  · tmpls │                                    │                 │
├──────────┴───────────────────────────────────┴────────────────┤
│  Bottom panel tabs: [ Notes · ADR · Capacity · Cost · Chat ]  │
└───────────────────────────────────────────────────────────────┘
```

### 7.3 The canvas (shared infrastructure)

The canvas engine is the same ReactFlow + A* + Dagre + Elk system LLD uses, augmented for distributed-systems vocabulary. Full details in §11. Key Build-mode-specific behavior:

- **Free drag-and-drop** from the library palette
- **Smart edge routing** · edges auto-route around nodes (A* over a grid)
- **Alignment guides** on drag
- **Auto-layout** · one-click "tidy" button runs Dagre LR or Elk layered layout; users can choose
- **Undo/redo** · 100-step history, cached in IndexedDB for multi-session persistence
- **Multi-select + batch actions** (Q50): alignment, distribution, batch-replicate, batch-scale
- **Right-click context menu**: duplicate, delete, wrap in region, extract as sub-diagram, comment

### 7.4 Library palette (left column, Q47, Q48)

Three collapsible sections:

1. **Diagram type** · 10 types (Q47). Switching diagram type changes the node palette and the layout rules. Users can have one canvas with tabs for multiple diagram types of the same system (architecture + sequence + deployment).
2. **Node families** · 16 families (Q48), fully enumerated in §11. Drag-to-canvas.
3. **Reference components** (Q50) · canonical pre-built sub-diagrams. "Netflix CDN stack". "Uber dispatch core". "Stripe idempotency layer". Drag an entire mini-architecture into the canvas. Each is a named 5-to-20-node blueprint with edges + metadata preset.

Below reference components: **User templates** (local) · the user's own saved templates, same mechanic.

### 7.5 Properties panel (right column)

Shows details of the selected node, edge, or region. Tabs within:

- **Basic** · name, type (within family), label, description
- **Config** · node-family-specific fields. For a database: flavor (relational/document/column/KV/graph/time-series, Q48), replication (leader-follower/multi-leader/leaderless), sharding, consistency mode (strong/eventual/causal). For a queue: delivery semantics, retention, partition count.
- **Capacity** · expected QPS, size-per-item, storage, cache working set. Used by the capacity planner (`architex/src/lib/simulation/capacity-planner.ts`) to validate realism.
- **Cost** · per-node cost (Q23) — hourly + projected monthly at current load. Diff annotation appears when the user changes a config that affects cost ("replication: single → multi-region +$2.40/hr").
- **Chaos risk** · concise list of chaos events this node is vulnerable to. Links to chaos library.

### 7.6 Bottom panel (tabs)

Five tabs:

1. **Notes** · free-text markdown. Per-diagram. Saved.
2. **ADR** (Architecture Decision Record) · auto-generated by Sonnet on demand (Q52). The user clicks "Generate ADR from current design" → Sonnet reads the canvas state, produces the standard ADR template (Context / Decision / Consequences / Alternatives Considered). Editable in-place. Exportable as `.md`.
3. **Capacity** · realtime capacity plan derived from node configs. Table of (component, load, utilization, headroom, warnings). Updates as the user edits.
4. **Cost** · realtime cost breakdown (Q23). Per-node bars, total/hour, total/month. Pareto-sorted. Click a bar → jump to that node in the canvas.
5. **Chat** · contextual Ask-AI. Everything the user types is seeded with the current canvas state (Q40). "Why is my latency high?" becomes a structured question with the full diagram as context.

### 7.7 Overlays (Q49, toggled from canvas controls)

Ten overlays, togglable independently:

| Overlay | What it shows |
|---|---|
| **Latency heat** | node border color from green (<10ms) to red (>500ms) |
| **Cost heat** | node size or color by $/hr share of total |
| **Blast radius** | hover a node → show all downstream dependencies highlighted |
| **Request path trace** | click a client node → animated trace of a typical request |
| **Data locality** | highlight nodes by region; multi-region replication visible |
| **Layered views** | toggle between architecture / network / deployment lenses on same canvas |
| **Error rate live** | during a sim run, node edges flash red proportional to error rate |
| **Semantic zoom** | zoom out past 40% hides internal config, shows only top-level nodes and major edges; zoom past 10% shows only regions |
| **Timeline scrub** | bottom slider scrubs canvas back and forth through a simulation run (Q9 — lives in Simulate, Build gets a read-only view of a past run) |
| **3D isometric** | optional rendering flip to 3D axonometric — see §18 |

Overlays persist per-diagram (JSONB in DB).

### 7.8 Build-mode-specific features

- **Split-view (LLD L4 analog)** · compare two diagrams side-by-side. Useful for the Compare-Two-Companies pedagogical format (§16).
- **Pattern tabs (LLD L3 analog)** · browser-style tabs for multiple open diagrams.
- **Zen mode (LLD L5)** · ⌘⇧Z fades all chrome, full-canvas. Useful for presentations and deep focus.
- **Radial command menu (LLD R4 analog)** · long-press anywhere on canvas opens a blooming radial menu — add-node / wrap-region / attach-note / simulate-from-here. Figma-style.
- **Presentation mode (Q32 try-it button + LLD R10)** · click "Present" → auto-generates a 5-8 slide deck from the diagram (title → problem → reveals of each subsystem → tradeoffs → open questions). Self-paced or timed.
- **Export** (Q44): PNG, SVG, Mermaid, JSON. One click from the toolbar.
- **Import** (Q44): drawio, Excalidraw, Lucid. The importer maps their shape vocabulary onto Architex's 16 node families as best it can, flags ambiguous mappings for the user to resolve.

### 7.9 Smart canvas features (Q50) — surfaced in Build

All 8 smart-canvas features ship in Build (details in §14):

1. **Pattern detection** · live background scan identifies named patterns ("You've built a write-through cache in front of MySQL"). Passive tag in a corner.
2. **Anti-pattern warnings** · Haiku inference on idle. "You have a single Redis with no replication as the primary store for carts — consider replication."
3. **AI node suggestions** · type `/` on the canvas → Sonnet proposes what's missing ("Add a rate limiter? Add an auth gateway?"). Ghost-preview, accept/reject.
4. **Complexity score** · 0-100 gauge in the status bar. Rises with node count, edge count, cycle count. Guides users away from over-engineering.
5. **Constraint solver** · user writes a constraint ("p99 < 200ms at 10k QPS, cost under $1000/month") → solver suggests edits. Bounded; surfaces in the bottom-panel Chat tab.
6. **Reverse engineering from text** · paste a system description or an ADR into the Chat tab → Sonnet generates a candidate diagram. User reviews and accepts parts.
7. **Drag-in reference components** · enumerated in §7.4.
8. **Auto-layout presets** · Dagre LR, Dagre TB, Elk layered, Elk mrtree, force-directed. One click each.

### 7.10 Diagram persistence

- Autosave every 10s (DB-first, Q38) to `sd_diagrams`.
- Named save (cmd+S) → user picks a name, optionally tags. Shows up in library.
- Versioning: every named save creates a new version. Users can diff two versions (Q50 reverse-engineering + diff).
- Share (Q41) → generates a read-only URL. OG image rendered with cobalt accent and "shared by [name]" subtitle.

### 7.11 Build → Simulate handoff

One click: **"Simulate this"** button in the top-right of the canvas. Carries the canvas state forward. Simulate mode opens on the same diagram with a "Choose an activity" picker overlaying. This is the most-used transition in the product for Journeymen.

---

## 8. Mode Deep-Dive · Simulate (flagship)

> "A diagram that has not been shaken is a diagram you do not trust."

Simulate is the biggest section of this spec because Simulate is the product's most defensible differentiator. It is the wind tunnel the entire studio is built around. The feature set here was the output of Batch 4 (Q6-Q10) and Batch 5 (Q11-Q16). The engineering backbone already exists: 34 files in `architex/src/lib/simulation/` — chaos-engine, cost-model, cascade-engine, narrative-engine, queuing-model, capacity-planner, metrics-collector, sla-calculator, time-travel, what-if-engine, and more. This spec does not rebuild them; it **wraps them in pedagogy**.

### 8.1 Purpose

The user loads a design (from Build, from a problem template, or from a past save) and runs it against one of six activities. The run produces measurable results — p50/p95/p99 latency, throughput, error rate, cost per request, SLO attainment. It also produces a **narrative** — a serif-typeset stream of events interpreted by the narrative engine. The user can pause, scrub, branch, compare, replay, and share.

Simulate mode's measurable success criterion is: the user leaves the run with a specific next action. Either "fix this hot-spot and re-run", or "read this concept because my design failed for a reason I don't fully understand", or "redo this under Drill's 5-stage clock".

### 8.2 Layout

Four-region layout. Left library collapses; right panel is the metric strip + narrative stream (the signature of Simulate).

```
┌────────────────────────────────────────────────────────────────┐
│  Top chrome · activity pill · scale slider · provider pill      │
├────────┬─────────────────────────────┬──────────────────────────┤
│ L: Ctl │  Center: live canvas         │  R: Metric strip +       │
│        │                               │    narrative stream     │
│ · play │   · particle layer for reqs  │                         │
│ · pause│   · overlays active           │   · p50/p95/p99        │
│ · scrub│   · red vignette on cascade  │   · errors/sec         │
│ · rate │                               │   · cost $/hr          │
│ · chaos│                               │   · SLO indicators     │
│   dice │                               │                         │
│ · mode │                               │   (serif) narrative:   │
│   pick │                               │   19:42:03 Rate limiter│
│        │                               │   saturates...          │
│        │                               │   19:42:05 Cache thrashes│
│        │                               │                         │
├────────┴─────────────────────────────┴──────────────────────────┤
│  Bottom: timeline scrubber · tick clock · ▶ / ⏸ · ⏮ / ⏭           │
└────────────────────────────────────────────────────────────────┘
```

### 8.3 The six activities (Q7)

Users pick an activity after selecting a design. Each activity is a framed experience, not a free-for-all run. The activity shapes the UI, the coaching, the post-run loop.

#### 8.3.1 Validate · "Does it work?"

**Goal:** confirm the design meets stated SLOs under stated load.

**UI:** user sets target QPS, SLO thresholds, and duration (default 5 minutes of sim time, compressed to 60 seconds real-time by a 5x multiplier). Clicks Run. Particle layer animates traffic. Metric strip shows p50/p95/p99 and error rate against the SLO line.

**Output:** Pass/Fail card with three subscores: latency SLO, error SLO, cost ceiling. Threshold coaching on each (§8.5). Post-run loops (§8.7).

**Best for:** first-time runs. Rookies use this as their warmup activity.

#### 8.3.2 Stress Test · "Where does it break?"

**Goal:** find the saturation point.

**UI:** user sets a start QPS and a ramp ("double every 30 sim-seconds"). Runs until a metric (p99 latency, error rate, or sustained queue growth) crosses a breaking threshold. The run auto-stops; the metric strip freezes on the breaking tick; the narrative stream shows the three events leading up to the break.

**Output:** "Your system holds until ~X QPS; after that, [specific component] becomes the bottleneck because [reason]." The first-bottleneck identification is the payoff; it maps directly to a fix.

**Best for:** Journeymen who want intuition for their design's ceiling.

#### 8.3.3 Chaos Drill (flagship) · "Can it survive?"

**Goal:** verify the design's resilience under injected failures.

**UI:** user runs at steady-state target QPS. A chaos control panel (§12.4) is visible — scenarios, dice, manual injection, budget, auto-escalation, red-team AI. The user chooses a mode. Events fire per mode logic. Each event triggers the cinematic ribbon (§12.3) and records into the narrative stream.

**Output:** a chaos report: events fired, cascade paths, SLO impact per event, recovery time, blast radius. A per-event letter grade from the coach.

**Best for:** interview prep in the "Deep Dive" phase and Journeymen preparing for on-call.

#### 8.3.4 Compare A/B · "Which design is better?"

**Goal:** run two candidate designs side-by-side under identical conditions.

**UI:** split-canvas (leveraging the Build split-view mechanic). User loads design A on left and design B on right. Runs both simultaneously with a synced traffic stream. Metrics appear as paired strips; a diff strip shows deltas.

**Output:** a paired comparison table with winner annotations per metric ("A wins on p99 latency; B wins on cost; B wins on availability under partition"). Lets the user make tradeoff decisions visually.

**Best for:** "should I add Redis or just use Postgres replication?" decisions. Heavily used in problem pages (the 2-3 canonical solutions in §5.5 can all be run in Compare A/B to visualize their differences).

#### 8.3.5 Forecast · "What happens in 12 months?"

**Goal:** simulate growth and see when the design fails.

**UI:** user sets a growth curve ("DAU 10k today, 10% month-over-month for 12 months"). Sim advances month-by-month; at each month, it runs a 1-minute validation at the projected load. A curve chart shows metrics over time. When a metric breaks its SLO, the month is highlighted.

**Output:** "Your design fails at month 7 because [specific reason]. Fixes: [suggestions]." Connects to the cost-vs-p99 Pareto activity (§13) for refactor decisions.

**Best for:** Architects designing for long time horizons; for thinking about capacity planning.

#### 8.3.6 Archaeology (real-incident replay) · "Could our design have survived Facebook 2021?"

**Goal:** replay one of the 10 real incidents against the user's design. See whether their system would have survived.

**UI:** user picks an incident from the 10-card chaos-library gallery. Loads. The replay runs with the actual timeline of events. The user's design is tested against the real failure. Cinematic narration describes each beat of the incident.

**Output:** a verdict page: "Your design survives Facebook 2021 BGP for 18 minutes longer than Facebook did, because your DNS is hosted externally. But you have the same circular dependency on internal auth that caused their recovery delay." Highly educational. This is the signature Architex experience.

**Best for:** every persona. Architects use it for prep; Journeymen use it for humility; Rookies use it for motivation.

### 8.4 The six chaos control modes (Q14)

Available in Chaos Drill activity:

1. **Scenario script** · pick a pre-authored scenario (e.g. "Cache warmup after cold start") from a library of 40+. Scripted sequence of events.
2. **Chaos dice** · random event from the 73-event taxonomy, weighted by your design's exposed surface area. Rolls a new event every 45 sim-seconds.
3. **Manual injection** · user clicks a node and fires a specific event ("Kill this node", "Inject 500ms latency here"). Full control.
4. **Chaos budget** · user sets an error budget ("tolerate 2 minutes of SLO breach total") and the engine fires events to consume it. Teaches budget thinking.
5. **Auto-escalation** · system fires a small event, watches recovery, escalates if recovery succeeded. Trains the user to think about cascade amplification.
6. **Red-team AI** · Sonnet plays an adversary who has read your canvas, knows your weak points, and fires events designed to compound. This is the hardest mode. Available only after the user has completed 3 Chaos Drill runs in other modes.

### 8.5 Threshold coaching (Q6)

Every metric the user sees is **classified** and **explained**, never raw.

| Metric | Threshold bands | Coaching phrasing |
|---|---|---|
| p50 latency | `<50ms excellent · <150ms good · <500ms concerning · ≥500ms broken` | "Your p50 of 340ms is **concerning**. Typical web p50 is under 150ms; 340ms means the median user feels your app as sluggish. Bottleneck: the synchronous call from your feed-ranker to the DB." |
| p99 latency | `<200ms excellent · <1000ms good · <3000ms concerning · ≥3000ms broken` | same shape |
| Error rate | `<0.1% excellent · <1% good · <5% concerning · ≥5% broken` | same |
| Throughput attainment | `>95% excellent · >80% good · >50% concerning · ≤50% broken` | "You claimed 10k QPS; you're doing 6,400. The limiter is [component]." |
| Cost per request | `<$0.0001 excellent · <$0.001 good · <$0.01 concerning · ≥$0.01 broken` | "$0.012 per request is **broken territory** at scale. Top offenders: egress ($X/hr), Redis cluster overprovisioned." |
| Recovery time (in chaos) | `<30s excellent · <2min good · <10min concerning · ≥10min broken` | "Your recovery takes 14 minutes. Compare: Netflix averages 40 seconds for circuit-breaker events. Fix: add the recovery path sketched in this callout." |

Threshold bands are per-metric global defaults, overridable per-problem (some problems demand stricter SLOs; e.g. Stripe-style payments have tighter thresholds).

### 8.6 The seven drill-ins (Q9)

Every sim run is inspectable. Seven inspection tools are available during and after a run:

1. **Pause & Inspect** · hit Space. Particle flow freezes. Hover any node → popover with its current state (queue depth, active requests, cache hit rate, CPU util, tail latency for last 1k reqs).
2. **Time Scrubber** · bottom bar. Drag backward or forward through the run. All overlays and metric strip animate in sync. Powered by the existing time-travel engine (`architex/src/lib/simulation/time-travel.ts`).
3. **Cascade Trace** · when a chaos event fires, a cascade-trace overlay shows which node failed first, what it took down, and in what order. Path is highlighted with a glowing cobalt line. Hovers show per-hop latency contribution.
4. **Slow-Mo (0.25x – 4x)** · playback rate control. Default 1.0x. Users can drop to 0.25x to watch a cascade unfold visually. Speed up to 4x for faster replays.
5. **Replay & Share** (Q41) · capture the run as a shareable read-only link. URL embeds the canvas, scenario, chaos events, and metric stream. Anyone with the link can scrub.
6. **Metric Drilldown** · click any metric in the strip → opens a time-series chart specific to it. Overlay multiple for correlation.
7. **What-If Branching** · hit `B` mid-pause. The current sim state forks. User edits the canvas; the forked branch continues from the same tick. Compare branches with the Compare A/B UI.

All seven are powered by existing simulation infra. This spec does not add new engines — it adds UI affordances and coaching.

### 8.7 The triple learning loop (Q10)

Every completed sim run produces a results card with three next-action buttons:

1. **Learn →** · "Your p99 broke because of cache stampede. Read the Cache strategies concept (5 min)."
2. **Build →** · "Fix this: add a single-flight wrapper on the cache and re-run."
3. **Drill →** · "You solved this under Simulate. Do it again under the 5-stage interview clock to test your ability to explain it."

The three buttons are always visible; their recommendations are generated by Sonnet based on the sim result (Q40). Users who click **Learn** after a chaos drill complete more concepts per week than users who don't — this is the retention mechanic that makes Simulate the center of the product.

### 8.8 The whisper-mode AI coach (Q8)

Haiku-backed coach that runs passively during sim runs. Listens to: metric stream, chaos events, user behavior (e.g. "user has been staring at p99 breaking for 8 seconds without action"). Fires at most **3 interventions per 5-minute sim** (cap visible in the status bar).

Intervention shapes:

- **Nudge** (text only, dismissable): "Your p99 is climbing — the queue to [service] has been draining at 0.7x the arrival rate for 40 seconds."
- **Suggestion** (text + highlighted node): "Add a rate limiter in front of [service]? Its backlog won't self-recover at this arrival rate."
- **Context** (text + link to concept): "This is a cache stampede. [Read the 2-paragraph primer.]"

The coach is silent by default in **Drill mode** (simulation integrity). In Simulate, it is on by default with a toggle to silence. For Architects who already know more than the coach, a "Coach quiet" toggle in Settings sets the default to off.

Cap is tunable per-user based on `user.masteredConceptCount`: Rookies get 5 interventions per 5-min sim by default; Journeymen 3; Architects 1 (and always optional).

### 8.9 The cinematic chaos pulse (Q15)

When a chaos event fires, the screen erupts. The choreography:

1. **t=0ms** · full-width ribbon (8vh tall) slides in from the top in serif type. Third-person present tense. *"The primary database's network partition isolates it from the application tier."*
2. **t=50ms** · red vignette (radial gradient from screen edges, 22% opacity at edges, 0% at center) fades in over 300ms.
3. **t=0ms** · optional bass thump (WebAudio-generated, 80Hz + 40Hz, 300ms decay). Off by default; on in settings under "Audio".
4. **t=600ms** · ribbon holds.
5. **t=900ms** · ribbon slides up and docks as a card in the right-side margin (Q16). Red vignette fades over 800ms. Canvas animations resume if paused.

The full ribbon→margin sequence takes 900ms (Q33 baseline for chaos motion). Reduced-motion users get a static red-bordered banner in the top-right; no animation, no sound.

### 8.10 The margin narrative stream (Q16)

The right-panel narrative stream grows during a run. Each chaos event, each SLO breach, each recovery is logged as a card. Cards use serif type (IBM Plex Serif, 13px, 1.6 line-height). Timestamps use monospace (Geist Mono, 10px).

Example stream:

> **19:42:03** The primary database's network partition isolates it from the application tier. *chaos-cut*
>
> **19:42:07** Writes to the read replica begin to back up. Queue depth: 1,400. *warning*
>
> **19:42:11** The circuit breaker on the API gateway opens. 57% of requests now return 503.
>
> **19:42:18** The retry storm from client SDKs amplifies load 3x. *cascade*
>
> **19:42:33** The partition heals. Primary rejoins. Replica catches up after 14 seconds of bounded backpressure.
>
> **19:42:51** System recovers. Total SLO impact: 48 seconds.

The stream is readable as a narrative. Users can scroll back, click any card to scrub the timeline to that moment, and copy the stream as a draft postmortem (Q52).

### 8.11 Sim infrastructure map

For engineers implementing this mode, the relevant files already exist:

- `simulation-orchestrator.ts` · main loop, tick scheduler, activity dispatcher — the entry point
- `traffic-simulator.ts` · request generation per QPS spec
- `queuing-model.ts` · Little's Law, M/M/c queue modeling per node
- `chaos-engine.ts` · event injection, recovery modeling
- `cascade-engine.ts` · failure propagation with exponential decay
- `cost-model.ts` · per-provider rate tables, per-tick cost accrual
- `capacity-planner.ts` · pre-run realism check
- `metrics-collector.ts` · aggregated metric stream
- `sla-calculator.ts` · SLO attainment from metric stream
- `narrative-engine.ts` · rules that turn metric+chaos events into serif prose
- `time-travel.ts` · state snapshots per tick, scrubbing API
- `what-if-engine.ts` · fork-and-branch mechanic
- `latency-budget.ts` · per-edge latency accounting
- `edge-flow-tracker.ts` · request path tracing
- `failure-modes.ts` · failure model per node family
- `issue-taxonomy.ts` · maps metric breaches to named issues for coaching
- `pressure-counters.ts`, `pressure-counter-tracker.ts` · backpressure accounting
- `rule-database.ts` · rules consumed by narrative and coaching
- `particle-path-cache.ts` · optimization for particle flow rendering
- `report-generator.ts` · produces the results card at end of run

Layering pedagogy on top is additive: the coach (Haiku) consumes `metrics-collector` output; the threshold coaching layer reads `metrics-collector` + `issue-taxonomy`; the cinematic pulse listens on `chaos-engine` events. No existing file needs rewriting.

### 8.12 Simulate shortcuts

- `Space` · pause / resume
- `B` · branch into a what-if
- `←` / `→` · scrub timeline (1 tick at a time)
- `⇧←` / `⇧→` · scrub timeline (10 ticks)
- `R` · replay from tick 0
- `S` · open share dialog
- `C` · open chaos control panel
- `1..6` · select activity
- `?` · surface shortcut sheet

---

## 9. Mode Deep-Dive · Drill

> "A real interview has phases. Train the phases, not just the answers."

### 9.1 Purpose

Drill mode is the gated mock interview. The user picks a problem (and optionally a company preset or interviewer persona), enters the 5-stage clock, and designs the system under timer pressure. At end of run, they receive a 6-axis rubric, an AI postmortem, and 7 other artifacts (Q21). Drill is the mode Architects live in.

### 9.2 Layout

3-region desktop layout with a persistent timer bar at the top.

```
┌───────────────────────────────────────────────────────────────┐
│  TIMER BAR (always visible): Stage 2 of 5 · 04:21 / 05:00      │
├──────────┬────────────────────────────────┬───────────────────┤
│  Problem │         Canvas                  │  Interviewer      │
│  statement│                                 │  pane             │
│          │   · same ReactFlow engine       │                   │
│          │                                  │   · persona       │
│          │                                  │     avatar        │
│          │                                  │   · chat stream   │
│  · prompt│                                  │     (Sonnet live) │
│  · SLOs  │                                  │   · hint credits  │
│  · scope │                                  │                   │
│          │                                  │                   │
├──────────┴────────────────────────────────┴───────────────────┤
│  Submit bar · Give up · Request hint · Stage-check             │
└───────────────────────────────────────────────────────────────┘
```

### 9.3 The 5-stage gated clock (Q17)

The signature feature. The interview is enforced in 5 phases:

| # | Stage | Duration | Allowed actions |
|---|---|---|---|
| 1 | **Clarify** | 5 min | Ask questions via typed chat; write "requirements" notes; no canvas editing yet |
| 2 | **Estimate** | 5 min | Napkin math; fill a structured estimate form (QPS, storage, bandwidth); minimal canvas (you can draft high-level boxes) |
| 3 | **Design** | 15 min | Canvas editing enabled; add node families; draw edges; define key APIs |
| 4 | **Deep Dive** | 15 min | Interviewer asks 2-3 focused questions (e.g. "how does your cache invalidate when writes happen?"). User modifies canvas to address. |
| 5 | **Q&A** | 5 min | Final questions. User asks the interviewer about their team, tradeoffs, etc. Cosmetic but graded. |

Total: 45 minutes. The timer advances stage-by-stage automatically. The user can call a stage "done" early with ⇧↵; remaining time banks to next stage only in **Coach** mode. In **Timed Mock** and **Exam**, unused time is forfeit (enforcing realism).

Stage transitions trigger a 600ms curtain animation across the canvas. The new stage label slides in from the right. The interviewer persona's chat gains a one-line stage-transition prompt ("Let's move on to the design phase. Start with a rough architecture.").

### 9.4 The 7 mock modes (Q18)

| Mode | Use |
|---|---|
| **Study** | No timer. Canvas enabled from the start. Interviewer asks questions freely. For building intuition without stress. |
| **Timed Mock** | The default. 5-stage clock enforced. 45 min. |
| **Exam** | Timed Mock + no hints, no AI questions allowed. Full simulation integrity. Grades you harshly. |
| **Pair AI** | Sonnet live at every stage. Interviewer has a personality and pushes back. Most interactive. |
| **Review** | Open a past drill attempt; review the final canvas with AI commentary overlays. |
| **Full-Stack Loop** | 90 minutes. Same problem in SD (45 min) + LLD (45 min). Rubric covers both (Q22). The most demanding mode. |
| **Verbal** | Microphone on. User narrates aloud while drawing. Whisper transcribes. Transcript scored for communication quality. (Q46 talk-aloud.) |

### 9.5 The 8 interviewer personas (Q19)

| Persona | Style |
|---|---|
| **Staff Engineer** | Default. Neutral, technical, clarifying. |
| **Bar-raiser** | Pushes edge cases, tests tradeoffs. |
| **Coach** | Warm, leads with hints, builds up. For Rookies. |
| **Skeptic** | Challenges every decision. "Why not just use Postgres?" |
| **Principal** | Asks about 3-year evolution, team topology, Conway's Law. |
| **Industry Specialist** | Brings domain depth (e.g. "In payments, idempotency is critical — where does your design guarantee it?"). |
| **Company Preset** | 8 company presets (Google, Meta, Amazon, Stripe, Netflix, Uber, Airbnb, generic FAANG). Each has a system-prompt-loaded rubric. Amazon hammers on simplicity; Google on algorithmic depth; Stripe on idempotency; Uber on microservices and scaling. |
| **Silent Watcher** | No feedback during the drill. All feedback at the end. Trains independence. |

Persona selection happens at drill start. The persona's avatar and name appear in the top-right chat pane. The persona's voice is maintained consistently by a system prompt that Sonnet consumes on every turn.

### 9.6 Multi-lens browse for drills (Q20)

Same 6 lenses as §4.3. The Drill library at `/sd/drill` adds one more lens: **"Recommended for you"** — Sonnet-ranked problem list based on user's recent progress and stated interview target.

### 9.7 The hint system

Three-tier, budgeted (mirrors LLD). Each drill starts with 15 credits.

- **Nudge** (1 credit): generic prompt. "Think about the write path."
- **Guided** (3 credits): specific help. "What happens when two users request the same counter at the same time?"
- **Full reveal** (5 credits): explicit answer for the specific question. "The interviewer is looking for single-flight — at most one request reaches the backend per key."

Hints are disabled in **Exam** mode. In **Coach** mode, they are free (no budget).

### 9.8 The 8 post-interview artifacts (Q21)

The moment of truth. At end of drill (submit or timeout), the user sees a results page with 8 artifacts:

1. **6-axis rubric** · six scores 1-5 with one-sentence rationale each. Axes: Requirements & scope · Estimation accuracy · High-level design · Deep dive depth · Communication · Tradeoffs & awareness. Visualized as a radar chart.
2. **AI postmortem** · 200-400 word essay by Sonnet analyzing the attempt. Honest; will call out specific misses.
3. **Canonical compare** · side-by-side of user's canvas vs. the problem's canonical Solution A (or closest canonical). Diff highlighted. Opens in Compare A/B Simulate.
4. **Timing heatmap** · how long the user spent per stage, compared to median of top-50% of attempts. Surfaces whether they underran Clarify (common Rookie error) or overran Design (common Journeyman error).
5. **Follow-up drills** · 3 recommendations: "Try Design Uber next, since it builds on this" · "Re-attempt this under Skeptic persona" · "Take a 7-min concept page on CDC because your data sync was weak".
6. **Simulate-your-design button** · "Does your design survive chaos?" — one-click into Chaos Drill in Simulate.
7. **Shareable PDF recap** (Q21, Q44) · a nicely typeset 2-page PDF. Includes final canvas, rubric, narrative stream, and the user's own notes. OG-image share card auto-generated.
8. **Streak stats** · "This was your 14th drill. Current streak: 7 days. Personal best on Staff rubric: 4.2/5." Motivational but calibrated.

### 9.9 Grading mechanics

The grade is produced by a **grading rubric engine** that consumes:
- Final canvas state (node families, edges, overlays, overlap with canonical)
- Napkin math entries
- Clarification chat transcript
- Stage timing
- Hint credits used
- (Verbal mode only) Transcript

A Sonnet call produces a structured JSON grade with per-axis score and rationale. The grader is seeded with the problem's canonical rubric (authored alongside the problem page). No mystery — every problem page has a visible rubric that the user can read *before* attempting, but the interviewer in **Exam** mode will be harder than the written rubric.

### 9.10 Frustration policy in Drill

**Never mid-task.** Drill is simulation integrity. The coach is silent. The interviewer persona continues per their system prompt.

Post-drill: if rubric shows three consecutive <2.5/5 drills in the same domain, an inline card appears on the results page: "Would it help to spend 30 minutes on [concept] before the next drill?" — offering a soft on-ramp without demanding a change.

### 9.11 Crunch Mode (Q45) interaction

When a user is in Crunch Mode (§4.6), Drill mode gets a special pinned header: "**Day 3 of 7 · Amazon Staff onsite in 4 days**". The mode auto-recommends problems that match the company preset. After each drill, the system rebalances tomorrow's plan based on today's rubric — if communication scored 2/5 today, tomorrow will include a Verbal-mode drill.

### 9.12 Drill shortcuts

- `⇧↵` · move to next stage early
- `⌘↵` · submit (mid-stage or end)
- `⌘K` · open command palette (not hint)
- `H` · request a hint (tier picker)
- `/` · open interviewer chat focus
- `P` · pause (Study mode only)
- `?` · shortcut sheet

---

## 10. Mode Deep-Dive · Review

> "A concept you learned once is a concept you will forget. A concept you re-learn at the right intervals is a concept you own."

### 10.1 Purpose

Review mode is the FSRS-5 daily retention habit. Short sessions (2-4 minutes). Mixes cards across modules — SD, LLD, Algorithms, OS&DB — in one unified queue (Q36). The goal is muscle-memory-level fluency on the 150+ fundamental concepts that carry the user through every interview and on-call.

### 10.2 Layout (mobile-first)

The same minimal single-card layout LLD uses. Big question, 3-4 options or a free-text prompt, rating row (Again / Hard / Good / Easy). Works identically on desktop and mobile.

```
┌──────────────────────────────────────┐
│  Review · 12 cards due · streak 14d   │
├──────────────────────────────────────┤
│                                      │
│   When would you prefer eventual     │
│   consistency over strong?            │
│                                      │
│   ○ When reads must reflect last     │
│     write immediately                │
│   ○ When latency matters more than   │
│     recency (caching, CDN)           │
│   ○ For financial transactions        │
│   ○ When the system is single-region │
│                                      │
│                       [ Reveal ▸ ]  │
│                                      │
├──────────────────────────────────────┤
│   [ Again ] [ Hard ] [ Good ] [ Easy ]│
└──────────────────────────────────────┘
```

### 10.3 Card types

Four card types for SD:

1. **MCQ** (4 choices) · most common · fast · binary scoring
2. **Name-the-primitive** · short-answer (2-5 words) · autograde by fuzzy match
3. **Diagram-spot** · the card shows a small diagram and asks "what's wrong?" or "identify the pattern". User picks from 3-4 options.
4. **Cloze** · one sentence with a missing word. "The ___ protocol guarantees at-least-once delivery." Answer: "Kafka" or "queue".

Cards are authored by Opus alongside each concept and problem page. Target: 3-5 cards per concept, 5-8 cards per problem. Total at launch: 200-300 SD cards.

### 10.4 Session flow

- FSRS-5 selects due cards across **all modules** (SD, LLD, Algorithms, OS&DB). Session defaults to 5 cards or 3 minutes, whichever comes first. User can continue if they want more.
- Cards appear in shuffled order with a soft bias toward whatever the user has been working on in the last 48 hours (if they finished a SD Consistent Hashing concept yesterday, today's review leads with consistent-hashing cards).
- User rates retention → FSRS updates → next card slides in with a 240ms left-out, right-in animation.

### 10.5 Keyboard & swipe (Q14, B8)

Desktop keyboard:
- `1..4` answer options
- `Space` reveal
- `A/H/G/E` rate Again/Hard/Good/Easy
- `↵` next

Mobile swipe (B8 from LLD, reused):
- Swipe **left** → Again
- Swipe **down** → Hard
- Swipe **up** → Good
- Swipe **right** → Easy

### 10.6 Streak & empty state

- Current streak visible top-right. Don't-break-the-streak nudge after a 3-day streak.
- Empty state: "All caught up — come back tomorrow." Streak icon warming up.
- No guilt. A missed day breaks a streak but does not degrade SRS scheduling beyond FSRS-5's natural math. The product does not punish; it just tracks.

### 10.7 Review-specific cognitive science features

- **Confidence-weighted scoring** (CS1, optional toggle) · before revealing the answer, user rates confidence 1-5. Final score = accuracy × confidence. Overconfidence penalized.
- **Cold recall** (CS6) · 10-min-after toasts. Overlaps with Learn mode's cold recall; Review mode can be the surface where the recall happens.
- **Interleaved practice** (CS2) · Review already interleaves by default (mixing concepts across modules). This is effectively interleaved practice by construction.

### 10.8 Review completion

A 5-card session earns a small end-of-session card: "5 cards, 2 Again, 3 Good. Tomorrow: 9 cards due." Subtle. No celebration. Daily habit, not a victory.

### 10.9 Review on mobile (Q42)

Review is the primary mobile experience. First-run mobile experience is Review mode; the dashboard is the only other mobile surface with meaningful functionality. The mobile experience is tuned for one-handed use on the train.

---

## 11. Canvas & Diagram System

> "A canvas is a vocabulary. The richer the vocabulary, the more truthful the design."

The canvas is the most-used surface in the product. It appears in Build, Simulate, Drill, and read-only in Learn. Its vocabulary was specified in Batch 11.

### 11.1 Ten diagram types (Q47)

Each type has its own node palette, its own edge semantics, its own layout rules. Users can switch types per-tab within the same project.

| Type | Purpose | Default layout |
|---|---|---|
| **1 · Architecture (boxes)** | The default. High-level system with services and databases. | Layered (left-to-right: client → edge → app → data) |
| **2 · Sequence** | Request flow across services over time. | Swimlanes + vertical time axis |
| **3 · Deployment topology** | Physical/logical placement: regions, zones, VPCs, containers. | Nested groups |
| **4 · Data flow** | Sources → transforms → sinks. For pipelines, CDC, ETL. | Left-to-right pipeline |
| **5 · State machine** | Entity lifecycle. For order state, payment state, session state. | Circular/force-directed |
| **6 · ER (entity-relationship)** | Persistent data model. Tables, columns, relationships. | Auto-layered |
| **7 · Network topology** | Routers, firewalls, VPNs, peering. For network-design problems. | Free-layout with grouping |
| **8 · Swimlanes (Conway's Law visible)** | Services grouped by owning team. Shows team-boundary friction. | Horizontal swimlanes per team |
| **9 · Service mesh** | Sidecars, control-plane, mTLS edges. For microservice infrastructure. | Concentric — data plane inner, control plane outer |
| **10 · Cascade / blast-radius graph** | Which failure cascades where. Edges weighted by cascade probability. | Force-directed, hub-and-spoke |

Switching types on a canvas with existing content runs a **projection** — preserves node identity, remaps edge semantics if needed, prompts the user on ambiguous mappings. E.g. promoting an Architecture diagram to a Deployment Topology asks "Which region does [service] run in?" for each service.

### 11.2 Sixteen node families (Q48)

The core vocabulary. Each family has an icon, a color band, a set of valid configs, and a simulation model in `failure-modes.ts`.

| # | Family | Examples / sub-types |
|---|---|---|
| 1 | **Client tier** | Browser, mobile app, IoT device, backend service as client |
| 2 | **Edge & CDN** | CloudFront, Fastly, Cloudflare, Akamai |
| 3 | **Load balancers** | L4 (AWS NLB), L7 (ALB, Envoy, nginx), DNS (Route53), anycast |
| 4 | **API gateways** | AWS API Gateway, Kong, Zuul, in-house |
| 5 | **App / service nodes** | Stateless service, stateful service, worker, cron, Lambda/Cloud Function |
| 6 | **Databases · 6 flavors** | **6a relational** (Postgres, MySQL) · **6b document** (MongoDB, DynamoDB) · **6c column** (Cassandra, Scylla, BigQuery) · **6d key-value** (Redis, DynamoDB-KV, Memcached) · **6e graph** (Neo4j, Neptune) · **6f time-series** (InfluxDB, TimescaleDB, Prometheus) |
| 7 | **Caches** | In-process, Redis, Memcached, CDN-cache |
| 8 | **Queues & streams** | SQS, RabbitMQ, Kafka, Kinesis, Pub/Sub |
| 9 | **Object / file storage** | S3, GCS, Azure Blob, HDFS |
| 10 | **Search & analytics** | Elasticsearch, OpenSearch, Algolia, Snowflake, BigQuery (analytic) |
| 11 | **Observability** | Prometheus, Datadog, Sentry, Jaeger, Grafana |
| 12 | **Auth & identity** | OAuth provider, SSO, session store, IAM |
| 13 | **3rd-party external** | Stripe, Twilio, SendGrid, OpenAI API — anything outside the trust boundary |
| 14 | **Containers / regions / zones** | Region group, AZ group, Kubernetes cluster, VPC |
| 15 | **Replicated / sharded badges** | Modifier, not a standalone node — applied to database or cache node to indicate replication topology or shard count |
| 16 | **Edge types** | Also a modifier: solid edge = synchronous call, dashed = asynchronous, dotted = batch / periodic |

Total: 16 families, 6 database sub-flavors, 3 edge modifiers. The grammar is rich enough to express 95%+ of real production architectures.

### 11.3 Node configuration schema

Each node carries a config object. Properties panel (§7.5) is generated from the family's schema. Config affects simulation behavior:

```typescript
interface SDNode {
  id: string
  family: NodeFamily  // 1..14
  subtype?: string    // within family
  name: string
  region?: string
  replication?: "none" | "leader-follower" | "multi-leader" | "leaderless"
  shardCount?: number
  consistency?: "strong" | "sequential" | "causal" | "eventual"
  qpsTarget?: number
  storageGB?: number
  cpuCores?: number
  memoryGB?: number
  provider: "aws" | "gcp" | "azure" | "abstract" | "bare-metal"
  instanceType?: string  // provider-specific
  costOverride?: number  // user-specified $/hr if not a preset
  failureModel?: FailureModelRef  // from failure-modes.ts
  notes?: string
}

interface SDEdge {
  source: string
  target: string
  kind: "sync" | "async" | "batch"
  protocol?: "http" | "grpc" | "websocket" | "tcp" | "custom"
  latencyBudgetMs?: number
  payloadSizeKB?: number
}
```

Validation runs on every save. Misconfigurations surface as anti-pattern warnings (§14).

### 11.4 Ten overlays (Q49)

Enumerated briefly in §7.7. Expanded here for clarity. Overlays are compositional — multiple can be active simultaneously. Each uses a single color channel so they don't fight each other.

| Overlay | Color channel | Rendering |
|---|---|---|
| Latency heat | Node border | Gradient green → yellow → red |
| Cost heat | Node fill shade | Low-alpha fill; darker = more expensive |
| Blast radius | Outline glow | Cobalt glow expanding through reachable downstream |
| Request path trace | Edge stroke width | Thicker during animated trace |
| Data locality | Node tint | Region-coded: us-east blue, us-west green, eu-west orange, ap red |
| Layered views | Canvas opacity | Layer masks dim other layers to 30% |
| Error rate live | Edge stroke dash | Increasing dash frequency as error rate rises |
| Semantic zoom | Node detail | Configs hide at <40% zoom; only region labels at <10% |
| Timeline scrub | Global | Scrubbing rewinds all overlays in sync |
| 3D isometric | Global | Canvas tilts to 30° axonometric; nodes render as cuboids |

3D isometric is a visual flourish (Q49). Performance-hungry. Off by default. The brainstorm noted this as "optional spectacle" — keep it as a toggle, not a default.

### 11.5 Canvas engine layering

```
┌──────────────────────────────────────────┐
│   ReactFlow (base)                        │
│   ├─ Custom node renderers (16 families)  │
│   ├─ Custom edge renderers (3 kinds)      │
│   ├─ A* edge routing                      │
│   ├─ Dagre / Elk auto-layout              │
│   └─ Minimap + controls                   │
│                                           │
│   Overlay layer (compositional)           │
│   ├─ Latency heat                         │
│   ├─ Cost heat                            │
│   ├─ Blast radius                         │
│   ├─ Data locality                        │
│   └─ Layered views                        │
│                                           │
│   Particle layer (Simulate only)          │
│   ├─ Request particles                    │
│   ├─ Edge flow rates                      │
│   └─ Node breathing animation             │
│                                           │
│   Cinematic layer (Simulate only)         │
│   ├─ Chaos ribbon                         │
│   ├─ Red vignette                          │
│   └─ Margin narrative stream              │
│                                           │
│   Blueprint/Hand-drawn rendering modes    │
│   └─ SVG filter passes (Q53)              │
└──────────────────────────────────────────┘
```

Particle and cinematic layers are only mounted in Simulate. In Build, they exist in the DOM but are paused. Zero teardown/re-init on mode switch.

### 11.6 Visual rendering modes (Q53)

Each mode is a single-click toggle. All run on the same underlying canvas state.

1. **Blueprint paper** · cyan/navy palette, graph-paper background, architect-blueprint font (Archivo, condensed). Looks like a drafting-table printout.
2. **Hand-drawn** · rough.js rendering pass, wobble filter, Caveat handwritten labels. Looks like Excalidraw or a whiteboard photo.
3. **Animated data flow particles** · always on during Simulate; optional in Build.
4. **Node breathing** · subtle 4s pulse at each node's current QPS rate. During Simulate, the pulse speeds up with load.
5. **Serif labels** · IBM Plex Serif for node labels. Gives the diagram a magazine quality.
6. **Ambient sound** · see §15 and §20.
7. **Failure cinematography** · the full chaos pulse choreography (§8.9).
8. **Context-aware node icons** · each node family has 4-6 icon variants. The renderer picks based on subtype (e.g. database family shows Postgres elephant icon vs. MongoDB leaf vs. Cassandra cross based on subtype). Small detail; enormous atmosphere.

Rendering modes stack. The default is **Serif labels + animated particles + context-aware icons** (a premium "studio" look). A user can switch to blueprint or hand-drawn for a different mood.

### 11.7 Performance budget

Canvas target: 60 FPS with up to 80 nodes and 150 edges in Build mode, 40 FPS with particle layer active in Simulate mode. Hard ceilings:
- Node count: 200 (soft warning at 100)
- Edge count: 400 (soft warning at 200)
- Particle count: 800 in flight (auto-sampled down if load exceeds)

Past these, the UI surfaces a "You're approaching diagram limits — consider extracting a sub-diagram" nudge.

---

## 12. Chaos Library

> "Every war story you wish you'd read before being paged at 3am."

### 12.1 Taxonomy (Q11) · 73 events in 7 families

Each event has: a canonical name, a family, a severity band, a narrative template, a simulation model, a real-incident tie (if applicable), and a "what protects against this" card. Events are authored alongside concepts and problems. Opus writes each narrative template; the sim model is engineered by the chaos team.

| Family | Count | Examples |
|---|---|---|
| **Infrastructure** | 14 | VM hardware failure, disk corruption, disk-full, kernel panic, clock drift, NUMA imbalance, noisy-neighbor CPU starvation, full TCP socket table, IP exhaustion, DNS server outage, certificate expiry, hypervisor eviction, power outage on rack, cooling failure |
| **Data** | 11 | Replica lag spike, replica desync, corrupt index, silent data corruption, write conflict storm, cache stampede, cache poisoning, split-brain during failover, hot partition, deadlock storm, schema migration failure |
| **Network** | 10 | Partition (full), partition (asymmetric), packet loss, latency injection, bandwidth throttle, TCP SYN flood, DNS poisoning, BGP route leak, MTU mismatch, connection reset storm |
| **Cascade** | 9 | Retry amplification, timeout amplification, circuit-breaker flip-flop, thundering herd, sequential-timeout cascade, deadlock between services, service-dependency loop, queue overflow cascade, Redis memory eviction cascade |
| **External** | 8 | 3rd-party API down (Stripe, etc.), 3rd-party API slow, 3rd-party rate-limit hit, SaaS vendor outage (SaaS chain), DNS-provider outage, TLS provider outage, CDN outage, cloud-provider API-throttle |
| **Human** | 10 | Bad deploy, config push error, credential rotation fail, runbook misuse, accidental deletion, runaway script, test traffic in prod, forgot-to-restart, bad CDN purge, insider mistake |
| **Load** | 11 | Traffic spike (organic), traffic spike (viral), slow-client attack, ddos amplification, scraper flood, celebrity event, product launch, time-based (new year's eve), holiday pattern change, demographic shift, sudden geographic shift |

Total: 14 + 11 + 10 + 9 + 8 + 10 + 11 = **73**. Every event is visible in the chaos library at `/sd/chaos`. Cards are grouped by family, filterable by severity and by the node family that suffers.

### 12.2 The 10 real incident replays (Q13)

Enumerated in §5.6. Each has:

- **A 2-scene-to-7-scene timeline**, narrated in third-person present-tense serif prose
- **A faithful-ish architecture diagram** reproduced from the real company's published postmortem
- **Replay** · run the real incident's event sequence against the faithful diagram, or replay it against your own design (Archaeology activity, §8.3.6)
- **Postmortem** · what the company said, what Architex adds, key learnings
- **Bridges** · which concepts + problems this illuminates

Incident pages are the most linkable assets in the product. They are optimized for OG-image sharing. A "Facebook 2021 BGP" card can be dropped into Slack and looks cinematic.

### 12.3 The narrative engine · cinematic prose (Q12)

Already built (`narrative-engine.ts`); this spec defines **how narratives are composed**.

Voice rules:

- **Third-person present-tense.** "The database's connection pool saturates." Not "The database saturated its connection pool."
- **Physical verbs.** Saturates, floods, isolates, withdraws, drains, starves. Not "experiences issues" or "becomes unavailable".
- **Concrete nouns.** Specific components by their on-canvas name. Not "the backend".
- **Serif typeset.** All event text rendered in IBM Plex Serif 14-16px, 1.6 line-height.
- **1-3 sentences per event.** Short enough to read mid-pulse. Long enough to be memorable.

Narrative template example for "Cache stampede":

> *Template:* `The {cache_name} cools below the hit-rate threshold. Requests begin arriving at {backend_name} faster than it can serve them. A queue forms; the queue deepens; the queue does not drain.`
>
> *Rendered in context:* `The Redis hot-cache cools below the hit-rate threshold. Requests begin arriving at Postgres-primary faster than it can serve them. A queue forms; the queue deepens; the queue does not drain.`

Templates are authored by Opus per chaos event. ~73 templates. Each fires with interpolated names from the user's canvas.

### 12.4 The 6 chaos control modes (Q14)

Already enumerated in §8.4. To restate the taxonomy and their use cases:

1. **Scenario script** · pre-authored. 40+ scenarios at launch. Best for first exposure.
2. **Chaos dice** · weighted-random. Best for repeated practice with variety.
3. **Manual injection** · user controls. Best for testing specific hypotheses.
4. **Chaos budget** · SLO-driven. Best for learning budget thinking (e.g. "I can tolerate 43 minutes of SLO breach per month").
5. **Auto-escalation** · system escalates on recovery. Best for resilience testing.
6. **Red-team AI** · Sonnet plays adversary. Hardest mode. Unlocked after 3 runs.

### 12.5 The cinematic pulse (Q15) · restated

The full choreography is in §8.9. Key constants:

- 8vh full-width ribbon
- 900ms total sequence (slide-in 200ms, hold 500ms, dock 200ms)
- Red vignette 22% alpha at edges, 0% center, 300ms fade
- Optional bass thump 80Hz+40Hz, 300ms decay
- Dock to margin narrative stream (Q16)
- Reduced-motion users get a static banner

### 12.6 The margin narrative stream (Q16) · restated

Living document on the right side of Simulate (or below canvas in Drill). Each event becomes a card. Scrollable. Clickable to scrub timeline. Exportable as a draft postmortem (§13 auto-artifacts).

### 12.7 Chaos budget tracking

Integrated with the cost-model and metric-collector:
- Running SLO-minute counter during a run
- Persistent "budget remaining" display when in Chaos Budget control mode
- Budget-exhausted event triggers its own margin card ("Budget exhausted at 19:47:11. 0 minutes remaining.")

### 12.8 The chaos library UI

`/sd/chaos` has three tabs:

1. **Events** · 73-card grid. Filterable. Each card: severity icon, 1-sentence description, linked problems, "Simulate this on any design" button.
2. **Real Incidents** · 10 cinematic cards. Each links to its replay page.
3. **Scenarios** · 40+ composed sequences. User-authored scenarios (Q43) live here too, flagged as "community" or "your own".

### 12.9 User-authored chaos (Q43)

Any user can compose a custom chaos scenario:
- Pick 3-10 events from the taxonomy
- Sequence them with inter-event delays
- Attach a narrative arc ("Black Friday surge with database failure mid-event")
- Save as private (default) or public (opt-in)

Public scenarios are discoverable in the library's Scenarios tab. Curators (internal team) can promote strong community scenarios to the canonical list. This is the community content loop.

---

## 13. Cost & Scaling Model

> "Cloud bill shock is not a surprise. It is physics you ignored."

### 13.1 The philosophy (Q23)

**Cost is always visible.** There is no mode where the user can hide from dollars. A per-node cost badge appears on every node by default (toggle in settings to hide if a user prefers). A corner meter runs the total. A diff annotation fires when a change moves cost by more than 5% ("+$2.40/hr since last save"). The user learns to think in dollars/hour, dollars/month, dollars/request, and dollars/user-month from the first session.

This is the feature that separates Architex from every free diagramming tool and every AWS calculator. Free diagramming tools teach the user to draw systems that are technically interesting and economically insane. AWS calculators teach the user to cost systems without designing them. Architex teaches both together.

### 13.2 The 6 providers (Q24)

All presets are kept in a `cost-model` table in the DB, refreshed quarterly. Each provider has:
- Per-node-family × per-size rate card
- Egress rates per region
- Storage rates
- Cross-region replication rates
- Observability tax rates

| Provider | Use case | Notes |
|---|---|---|
| **AWS** | Default. | Most realistic for US-company designs. |
| **GCP** | Alternative. | Better egress for YouTube-style designs. |
| **Azure** | Alternative. | Enterprise feel. |
| **Abstract units** | Provider-agnostic | Shows "0.1 units/hr" not "$0.11/hr". Useful for teaching without cloud vendor lock-in. |
| **Cross-provider compare** | Side-by-side | Same design, AWS vs. GCP vs. Azure. See where egress kills you vs. where compute does. |
| **Bare-metal (Hetzner-style)** | Alt-cloud | Shows 3-10x cost reduction for predictable workloads. Teaches that not every system belongs in AWS. |

Provider is a per-design setting. Users switching providers see instant recost. One click.

### 13.3 The scale slider (Q25)

A persistent control at the top of Simulate. Five preset positions:

| Position | DAU | Typical request volume |
|---|---|---|
| **10k** | 10,000 | 1-5 QPS avg, 20 QPS peak |
| **1M** | 1,000,000 | 100 QPS avg, 1k QPS peak |
| **10M** | 10,000,000 | 1k QPS avg, 10k QPS peak |
| **100M** | 100,000,000 | 10k QPS avg, 100k QPS peak |
| **1B** | 1,000,000,000 | 100k QPS avg, 1M QPS peak |

The slider rescales the traffic generator and the cost calculator simultaneously. The user watches metrics and cost shift as the slider moves. "My design works at 1M. At 100M, my Redis cluster is $50k/month. Interesting."

### 13.4 The 7 cost-pressure activities (Q26)

Seven distinct pedagogical framings of the cost problem.

1. **Budget-constrained problems** — the problem page states "Design this with a monthly budget of $8,000" (for a 10M-DAU URL shortener). Hitting the constraint is part of the rubric.
2. **Cost-optimization drill** — a mode that takes an existing design and challenges the user to cut cost by 30% while keeping SLO intact. The AI grader scores the proposed cuts.
3. **"What could we cut?" activity** — displays the top-5 cost lines of the current design and asks the user which is most cut-worthy. Teaches Pareto thinking.
4. **Cost-per-user exposed** — on the dashboard, a persistent badge shows "$0.047 / user / month" for the active design. Runs in the background. The user sees the metric tick as they edit.
5. **Forecast curve** — Simulate's Forecast activity. Projects cost over 12 months against a growth curve.
6. **Cost-vs-p99 Pareto** — a 2D chart plotting cost against p99 latency across candidate designs. Users see the Pareto frontier and understand that some designs are dominated (strictly worse on both axes).
7. **"Cloud bill shock" narratives** — 15 scripted scenarios where a design is running fine, then a bill arrives. Narrative walks the user through how the cost accumulated (egress, retries, idle capacity, etc.) and what the engineering fix is.

### 13.5 The 8 hidden costs (Q27)

These are the cost categories that make junior engineers cry when they see their first real bill. Each is taught explicitly.

| Hidden cost | Taught in | Typical scale of surprise |
|---|---|---|
| **Egress** | Concept: CDN fundamentals · Problem: Design YouTube | 10-40% of bill for video-heavy designs |
| **Observability tax** | Concept: Observability · Problem: Design a monitoring pipeline | 5-15% of bill; logs often worse than metrics |
| **On-call load** | Concept: Incident response · Problem: any | Hidden human cost, but shown as "hours/month on-call" |
| **Vendor lock-in** | Concept: Deployment patterns · Problem: any (compare-providers) | Shown as "6-month migration effort" when changing providers |
| **Cross-region replication** | Concept: Replication · Problem: Design Google Docs | 20-50% of bill for strict-consistency multi-region |
| **Idle waste** | Concept: Capacity planning · Problem: any | 15-30% of bill for over-provisioned stateless tiers |
| **Retry amplification** | Concept: Retries with jitter · Problem: Design Stripe | Can 3-10x load during failures, invisible until chaos drill |
| **Compliance overhead** | Concept: none yet — Phase 4 addition · Problem: Design Stripe | 10-20% for PCI/HIPAA-bound systems |

Each is tagged on nodes that incur it, and pulsed visually during the corresponding Simulate activity.

### 13.6 Named-band real-company costs (Q28)

A library of 30+ named-company cost bands, with source and year stamps.

| Company | Category | Estimated cost | Source · year |
|---|---|---|---|
| Netflix | Streaming infrastructure | ~$400M/yr | Company filings, 2022 |
| Reddit | Hosting | ~$100M/yr | S-1 filing, 2024 |
| Pinterest | Infrastructure | ~$750M/yr (AWS committed) | Earnings, 2022 |
| Slack | Hosting | ~$300M/yr | Salesforce filings, 2023 |
| Dropbox | Infrastructure | $175M/yr savings by leaving AWS | Dropbox engineering blog, 2016 |
| Shopify | Infrastructure | ~$500M/yr | Earnings, 2023 |
| Airbnb | Infrastructure | ~$100M/yr | Earnings, 2022 |
| Twitter/X | Infrastructure | ~$700M/yr (pre-Musk) | Internal leaks, 2022 |
| Stripe | Infrastructure | ~$100M/yr | Industry estimates, 2023 |
| Discord | Infrastructure | ~$40-60M/yr | Industry estimates, 2023 |

Each band is a card in a "Real-world cost library" at `/sd/learn/reference-costs`. Users see these when they finish a design and the dashboard says "Your design costs $8M/yr at 10M DAU. For comparison, Discord spends ~$50M/yr at ~200M users." This gives users a felt sense of scale.

### 13.7 Cost model implementation

Lives in `architex/src/lib/simulation/cost-model.ts` (already built for AWS). Extensions:

- Add GCP rate tables (new file `cost-model-gcp.ts`)
- Add Azure rate tables (new file `cost-model-azure.ts`)
- Add bare-metal tables (Hetzner)
- Add egress matrix (source-region × destination-region × provider)
- Add observability-tax overlay (logs/metrics/traces cost per event)
- Add idle-waste calculator (provisioned - utilized, at provider rates)

Quarterly refresh job refreshes rate tables from provider public pricing pages.

### 13.8 Cost UI surfaces

- **Per-node badge** (default on): small pill "$0.11/hr" or "$0.11 x 12 = $1.32/hr" for scaled clusters
- **Corner meter** in Simulate and Build: "$287/hr · $206k/month"
- **Diff annotation**: popover when a change exceeds 5% cost delta
- **Bottom-panel Cost tab** in Build: full breakdown bar chart
- **Dashboard Cost/User badge**: "0.047 / user / month" when the active design is open
- **Pareto chart** in the Compare A/B activity: 2D cost vs. p99

---

## 14. Smart Canvas Features

> "The canvas should know something about what you are drawing."

### 14.1 Eight smart-canvas features (Q50)

Expanded from §7.9. Each is implemented as a background process in Build and Simulate. None interrupt the flow of work; all surface as subtle passive indicators.

#### 14.1.1 Pattern detection

A passive scanner (Haiku, ~$0.001 per scan, debounced 10s idle) reads the canvas state and identifies named patterns in use:

- **Write-through cache** = cache between client and database with synchronous write edges to both
- **Cache-aside** = cache beside database with conditional read/write
- **Fan-out on write** = message queue between producer and multiple consumer fanout
- **Hexagonal / ports & adapters** = a service surrounded by adapter nodes
- **CQRS** = separate read and write paths with distinct datastores
- **Event sourcing** = append-only event log + projections
- **Circuit breaker** = breaker node between client and unreliable dependency
- **Bulkhead** = isolated resource pools per tenant or feature

Detected patterns appear as a passive tag row in a corner ("Pattern: cache-aside + circuit breaker + fan-out"). Click a tag → concept page opens in a side drawer.

#### 14.1.2 Anti-pattern warnings

A complementary scan identifies red flags:

- **Single point of failure** · a critical node with no replication
- **Synchronous chain too deep** · 5+ synchronous hops in a request path
- **Missing rate limiter** · public endpoint with no throttle
- **Missing retry** · cross-region call with no retry semantics
- **Missing idempotency** · payment-like node without idempotency key
- **Cache without invalidation** · cache that is written but never invalidated
- **God service** · a service with >15 dependencies
- **Circular dependency** · A → B → A
- **Shared database across services** · tight coupling
- **No observability** · no monitor node in the design

Warnings appear as subtle amber pulses on implicated nodes. Hover → explanation. Dismissible per-warning per-diagram (user might know they're building an anti-pattern on purpose for pedagogy).

#### 14.1.3 AI node suggestions

Type `/` anywhere on canvas → autocomplete-style suggestions appear ghostly. Each suggestion shows what Sonnet thinks is missing: "Add rate limiter", "Add auth gateway", "Add replication to this DB", "Add queue between these services". Ghost-preview the placement. Accept with Tab; reject with Escape. Cost: ~$0.01 per session.

#### 14.1.4 Complexity score

A rolling 0-100 gauge in the status bar. Formula:

```
complexity = (0.2 × nodeCount) + (0.3 × edgeCount) + (8 × cycleCount) + (12 × syncChainDepth)
```

Capped at 100. Above 60 = "heavy" (amber gauge), above 80 = "over-engineered" (red gauge). This guards against the common interview failure mode: drawing every possible subsystem for a problem that needs 5 boxes.

#### 14.1.5 Constraint solver

User writes a constraint in the Chat tab: *"p99 < 200ms at 10k QPS, cost under $1000/month, must survive single-region failure"*. Sonnet reads the current canvas + the constraint, and returns:

1. Does the current canvas meet the constraint? (Yes/no/partial with which specific axis fails)
2. Suggested edits ranked by (impact, cost)
3. "Show me the Pareto" → opens Compare A/B with 2-3 candidate redesigns

Bounded: Sonnet will not redraw the whole canvas. It edits a bounded number of nodes/edges and leaves the rest alone.

#### 14.1.6 Reverse engineering from text

User pastes a free-form description into the Chat tab:

> *"We have a web app that serves 10M DAU. Users post tweets which are fanned out to follower timelines. Timelines are cached in Redis. Background workers write to Postgres for durability. We use Kafka for fan-out. CDN fronts the static assets."*

Sonnet generates a candidate canvas. Ghost-preview. User accepts or refines. ~$0.05 per generation. The reverse engineer is the on-ramp for team members who come with prose, not diagrams.

#### 14.1.7 Reference components (drag-in)

Enumerated in §7.4. These are pre-built, Opus-reviewed sub-architectures:

- **Netflix CDN stack** · 8 nodes: origin shield, regional caches, edge caches, client SDKs, analytics feed
- **Uber dispatch core** · 12 nodes: driver index, rider matcher, dispatch coordinator, event log
- **Stripe idempotency layer** · 6 nodes: idempotency store, dedup, webhook replay, status reconciler
- **Twitter timeline fan-out** · 10 nodes
- **Discord voice edge** · 7 nodes
- **Slack real-time presence** · 5 nodes
- **Dropbox block storage** · 8 nodes
- **Kafka cluster with exactly-once** · 6 nodes

~20 at launch, ~50 within a year as content team produces them. Each is a curated teaching asset.

#### 14.1.8 Auto-layout presets

Five one-click presets:
- **Dagre LR** (default for architecture)
- **Dagre TB** (top-bottom, for pipelines)
- **Elk layered** (cleaner for large diagrams)
- **Elk mrtree** (for hierarchical node family)
- **Force-directed** (for service mesh or network topology)

Undo is always available after auto-layout (Dagre sometimes moves things in surprising ways).

### 14.2 Implementation notes

- Pattern detection & anti-pattern detection: Haiku calls with 1-hour IndexedDB cache keyed by `topology-signature.ts` output. Detects whether any topological change has occurred before spending tokens.
- Constraint solver & reverse-engineer: Sonnet (higher quality needed).
- Complexity score: client-side, no LLM needed.
- Auto-layout: existing Dagre/Elk integration in `dagre-layout.ts`.

### 14.3 Auto-generated artifacts (Q52)

Eight one-click artifact generators. All produce editable Markdown or JSON that can be exported.

| Artifact | What it is | Generator |
|---|---|---|
| **ADR** (Architecture Decision Record) | Standard ADR format: Context · Decision · Consequences · Alternatives | Sonnet + canvas state |
| **Runbook** | On-call procedures: symptoms, pages, first-response steps | Sonnet + chaos-event map |
| **RFC write-up** | Formal design proposal doc | Sonnet + canvas state + problem context |
| **IaC starter** | Terraform / CDK / Pulumi (user picks) | Template-based with canvas config filled in; imperfect but a starting point |
| **Capacity Plan** | Per-component load, utilization, headroom, growth runway | Calculated from canvas + simulation output |
| **Postmortem** | Filled from a completed chaos-drill narrative stream | Takes the margin narrative as raw, formats per-company template |
| **Exec One-Pager** | 1-page non-technical summary with diagram and 3 key tradeoffs | Sonnet, audience tag "executive" |
| **Interview Cheat-Sheet** | 1-page bullet summary for recall | Sonnet, recall-optimized |

Each artifact can be exported as Markdown, PDF, or pushed to GitHub / Notion / Obsidian (Q44).

---

## 15. AI Integration

> "The AI is not the teacher. It is the reader's more-experienced sibling in the next chair."

### 15.1 Principles

- **Haiku for fast / contextual / passive.** Pattern detection, anti-pattern warnings, whisper coach, per-metric coaching, card grading. Keeps cost low.
- **Sonnet for deep / generative / creative.** Postmortems, rubrics, reverse engineering, constraint solving, interviewer-persona turns, scenario generation.
- **Opus offline for content.** All 40 concepts + 30 problems + 73 narratives + 40 scenarios authored via Opus at content-ops time.
- **No AI-only experiences.** The AI augments; it never stands alone. Every AI output is explainable, citable, and reproducible.
- **Progress-aware context (Q40).** Every AI call carries a structured user-state object — which concepts Mastered, which problems attempted, recent rubric scores, current mode. The AI speaks to *this* user, not a generic user.

### 15.2 Claude infrastructure (existing)

Same as LLD §12:

- Singleton client with concurrency queue (max 3 parallel)
- IndexedDB response cache (1h TTL)
- Per-user rate limit (30/hour free, 100/hour pro) via `aiUsage` table
- Graceful fallback when `ANTHROPIC_API_KEY` missing (heuristic-based for detection, "unavailable" banner for generative)
- Cost tracking (Haiku $0.80/$4.00, Sonnet $3/$15 per 1M tokens)

### 15.3 The AI features · complete catalog

Fifteen SD-specific AI features across the 5 modes, in addition to the 9 that LLD already has (some shared).

#### 15.3.1 Learn mode

- **L1 · Contextual Ask-the-Architect** (§6.6, three surfaces) · Sonnet · ~$0.015/session
- **L2 · Elaborative interrogation grader** · Haiku · grades free-text "why?" answers 1-5 · ~$0.001 per grading
- **L3 · Concept explainer** · Sonnet · user selects a paragraph in a concept page and says "explain this differently" · ~$0.01

#### 15.3.2 Build mode

- **B1 · Pattern detection** (§14.1.1) · Haiku · passive · ~$0.001/scan
- **B2 · Anti-pattern warnings** (§14.1.2) · Haiku · passive · ~$0.001/scan
- **B3 · AI node suggestions** (§14.1.3) · Haiku · on `/` · ~$0.01
- **B4 · Constraint solver** (§14.1.5) · Sonnet · ~$0.05
- **B5 · Reverse engineer from text** (§14.1.6) · Sonnet · ~$0.05
- **B6 · Build-inline Chat** (canvas-aware Q&A) · Sonnet · ~$0.02 per turn

#### 15.3.3 Simulate mode

- **S1 · Whisper coach** (§8.8) · Haiku · max 3 interventions per 5-min sim · ~$0.003 per intervention
- **S2 · Post-run summarizer** · Sonnet · writes the results card's narrative and triple-loop recommendations (Q10) · ~$0.02 per run
- **S3 · Red-team AI chaos** (§12.4 mode 6) · Sonnet · fires adversarial events · ~$0.04 per run

#### 15.3.4 Drill mode

- **D1 · Interviewer persona turns** (§9.5) · Sonnet · the live voice of the 8 personas · ~$0.03-0.08 per drill
- **D2 · Rubric grader** (§9.9) · Sonnet · structured 6-axis rubric generation · ~$0.04 per drill
- **D3 · AI postmortem** (§9.8) · Sonnet · 200-400 word essay · ~$0.04 per drill
- **D4 · Verbal transcript grader** (Verbal mode) · Sonnet · reads Whisper transcript, grades communication · ~$0.02 per drill

#### 15.3.5 Review mode

- **R1 · Card generator** (lazy) · Haiku · generates 3-5 FSRS cards from any concept/problem the user has completed · ~$0.005 per generation
- **R2 · Auto-grade open-ended cards** · Haiku · grades short-answer and cloze-ish cards · ~$0.001 per grade

#### 15.3.6 Cross-module

- **X1 · Dashboard Recommended** (Q39) · Sonnet · daily personalized recommendation · ~$0.01/day/user
- **X2 · Study plan generator** (Q45 Crunch Mode) · Sonnet · 7-day schedule · ~$0.04 per generation
- **X3 · Weekly digest email** (Q46) · Sonnet · per-user personalization · ~$0.01/week/user

### 15.4 Total token budget estimate

Per active user (3 sessions/week average):
- Passive scans: ~100/week = $0.10
- Interactive calls: ~25/week = $0.50-1.00
- Drill-heavy users: ~30 drills/week = $2-4
- Crunch Mode users: up to $10/week for 1 week

Blended average: ~$0.50-1.50 per active user per week. Pro tier ($19/month) covers unlimited usage at this scale. Free tier caps at 30 AI calls / hour, sufficient for casual use.

### 15.5 Interviewer persona system prompts

Each of the 8 personas has a system prompt maintained by the content team. Rough shape:

```
You are {persona_name}, a {role} at {company_or_generic}. You are conducting
a system-design interview for a {seniority} role.

Voice rules:
- {specific voice traits}
- {what this persona pushes on}
- {what they do NOT care about}

Grading rubric emphasis:
- Requirements & scope: {weight}
- ...

Rules of engagement:
- Stay in persona throughout.
- Speak in 1-3 sentence turns.
- Ask follow-up questions. Do not lecture.
- When the candidate asks a clarifying question, answer briefly and return
  the conversational thread.
- Never break character. You are not an AI assistant. You are the interviewer.
```

Each company-preset persona additionally includes company-specific evaluation criteria (e.g. Amazon: 16 leadership principles, with Simplicity and Bias for Action especially weighted for system design).

### 15.6 Progress-aware context payload (Q40)

Every non-trivial AI call ships with a structured user-state object:

```typescript
interface UserContext {
  userId: string
  personaGuess: "rookie" | "journeyman" | "architect"
  masteredConcepts: string[]       // slugs
  completedProblems: string[]
  recentRubrics: Array<{ problem: string, axes: number[], ts: string }>
  currentMode: SDMode
  currentDesign?: CanvasSnapshot
  currentProblem?: string
  crunchMode?: { onsiteDate: string, company: string, daysRemaining: number }
  preferences: {
    voice: "eli5" | "standard" | "eli-senior"
    coachQuiet: boolean
  }
}
```

The AI's output style calibrates on this. A Rookie asking about consistent hashing gets warmer prose and an analogy first. An Architect gets crisp technical depth and assumes context.

### 15.7 Safety & abuse

- Prompt injection defense: user-supplied text is always surrounded by a structured delimiter in system prompts. The canvas state is expressed as JSON.
- Token-cost ceilings per user per day ($2 free, $10 pro). Grace limit 20% before hard-cap.
- No PII in prompts: user id is hashed; user names and emails never enter Claude.
- Transcript storage: AI conversations are retained for 30 days in an encrypted store, user-deletable.
- Cost transparency: a `/settings/ai-usage` page shows token spend per week.

---

## 16. Pedagogical Formats

> "A problem should not be presented the same way twice."

### 16.1 Eight pedagogical formats (Q51)

The same library of 30 problems can be presented in 8 distinct pedagogical framings. Each framing targets a different learning goal and engages a different part of the brain. Users select a framing from a problem page's top bar.

#### 16.1.1 Build-Along

**Goal:** learn by following a narrated construction.

**Shape:** the problem page plays a guided build sequence. Step 1: "Start with a client and a single backend service." Step 2: "Now, under 1k QPS, we hit a database bottleneck. Add a cache. Here's why." Each step has a prose explanation, a canvas animation showing the change, and a checkpoint the user answers before the next step unlocks.

**Best for:** Rookies. First problem they ever attempt should be in Build-Along format.

#### 16.1.2 Debug-This

**Goal:** find the bug in a broken design.

**Shape:** user sees a diagram claimed to work at 1M DAU. They hit Simulate. Something fails. The user must identify the cause and fix it. Time-limited.

**Best for:** training code-review / diagnostic skills. 5-10 min sessions.

#### 16.1.3 Inherit-This-Mess

**Goal:** grapple with a legacy design.

**Shape:** user opens a design that is an honest tangle — 30+ nodes, 3 database flavors in use for no clear reason, deep sync chains, missing observability. Narrative intro: "You joined this team yesterday. The previous architect left. You have 2 weeks to improve reliability." User must identify priorities, propose 3 refactors, execute the top 1.

**Best for:** experienced engineers; trains prioritization under constraint.

#### 16.1.4 Scale-This-Up

**Goal:** evolve a design from 10k DAU to 10M to 1B.

**Shape:** start with a simple design that works at 10k DAU. Use the scale slider to ramp to 1M. Something breaks. Fix it. Ramp to 10M. Break. Fix. Ramp to 100M. Break. Fix. User learns that "works at scale X" does not mean "works at scale 10X."

**Best for:** building scale intuition. The most requested framing in brainstorm user interviews.

#### 16.1.5 CTO Interview

**Goal:** explain a design to a non-technical executive.

**Shape:** the canvas is done. Now the user must write a 1-page exec summary (Q52 Exec One-Pager). An AI exec reads it and pushes back: "What's the business value of cross-region replication?" "How does this tradeoff affect our time-to-market?" User must defend verbally.

**Best for:** Staff+ engineers who need stakeholder-communication skills.

#### 16.1.6 Guided Derivation

**Goal:** derive the design from first principles, step-by-step.

**Shape:** the user is prompted: "Consider: we have 200B tweets and 500M users. What must our write path look like? Think. [reveal hint]." Each derivation step is a checkpoint. The user builds the design by answering the prompts, in the order a principal engineer would derive it. Unlike Build-Along, this is Socratic — the user does the thinking.

**Best for:** Journeymen-Architects seeking interview depth.

#### 16.1.7 Compare-Two-Companies

**Goal:** understand why two designs for the "same" problem differ.

**Shape:** user opens side-by-side Instagram's feed architecture vs. Mastodon's. Or Stripe's idempotency vs. PayPal's. The user identifies the specific design decisions each made, and the consequences. Uses the Compare A/B Simulate activity for the dynamic parts.

**Best for:** deep understanding. Advanced users.

#### 16.1.8 Evolving-Design Campaign

**Goal:** design a system that evolves over 2-3 years.

**Shape:** user designs for Year 0. Time passes (narrative). The company grows. Year 1: "Revenue hits $100M, now you need fraud detection." Add. Year 2: "Europe launches; GDPR now applies." Add. Year 3: "Competitor launches; need a search feature." Add.

**Best for:** Principal-level. Multi-session campaigns, 4-8 hours total.

### 16.2 Selecting a format

Problem pages default to the **6-pane format** (§5.5) — the reference encyclopedia shape. Above the 6-pane, a bar offers 8 pedagogical format buttons. Selecting one rewrites the page to that format. The same canonical content is reused across formats; the framing changes.

Default recommendation engine:
- R (Rookie) default: Build-Along
- J (Journeyman) default: Guided Derivation or Debug-This
- A (Architect) default: Scale-This-Up or Evolving-Design Campaign
- In Crunch Mode: Drill format directly (bypass to §9)

### 16.3 Cognitive science mapping (reused from LLD)

Each pedagogical format implements one or more cognitive science mechanisms already cited in LLD §9:

- Build-Along — worked examples with fading (CS5)
- Debug-This — productive failure (CS4)
- Inherit-This-Mess — elaborative interrogation (CS3) + retrieval
- Scale-This-Up — interleaved practice (CS2) — mixing scale levels forces discrimination
- CTO Interview — teach-back (CS7) + design debate (CS9)
- Guided Derivation — elaborative interrogation (CS3) + Socratic questioning
- Compare-Two-Companies — cold recall (CS6) + interleaved practice (CS2)
- Evolving-Design Campaign — spaced retrieval over sessions

This grounds the whole pedagogy stack in published research. The product is not gamification-first; it is *learning-science-first*, styled cinematically.

---

## 17. Cross-Module Seamlessness

> "One profile. One streak. One palette. One muscle memory. Four modules, one Architex."

### 17.1 The knowledge graph (Q5, Q35)

See §4.4 for the full graph definition. Restated briefly for this section:

- Every concept / problem / pattern / chaos event is a node
- Edges encode prerequisite, uses, related, cross-module bridge
- Navigation: (1) permanent neighbor sidebar on every page · (2) end-of-page link cards · (3) graph view (⌘G)

### 17.2 Bridge cards (Q32, Q35)

A **cross-module bridge card** is one of the 8 canonical content formats. It appears end-of-page and as a floating recommendation in the neighbor sidebar.

Example bridge cards on the SD Twitter problem page:
- → **LLD: Observer pattern** · "How does the fan-out queue notify follower timelines? The Observer pattern gives you the object model."
- → **LLD: Pub-Sub pattern** · "Observer + a queue = Pub-Sub. Same primitive, different abstraction level."
- → **Algorithms: Consistent Hashing** · "When you shard timelines by user id, you'll want this."
- → **OS&DB: Write-ahead logs** · "The durability layer under your writes."

Each bridge has a 1-2 sentence *relevance* caption, not a dry "related link". Users understand *why* to click.

### 17.3 Unified profile (Q36)

Single profile, multiple module lenses.

- **One streak** · shared across all modules. Any activity in any module counts toward the streak (Review card, Learn scroll, Build save, Simulate run, Drill attempt, Algorithms kata).
- **One FSRS queue** · mixes cards from SD, LLD, Algorithms, OS&DB. Today's queue might be 5 SD cards + 2 LLD cards + 3 Algorithms. FSRS schedules cards agnostic of module.
- **Per-module lenses** · the profile page has tabs: Overview · SD · LLD · Algorithms · OS&DB. Each tab shows module-specific progress rings, rubric history, mastered-concepts list.
- **Overall progress visualization** · a unified radar chart shows "Distributed Systems · Object Design · Algorithmic Thinking · Operating Systems" on 4 axes. This is the persona-identifier. Architects want all four axes high.

### 17.4 Universal shortcuts (Q37 · all 8)

| Shortcut | Action |
|---|---|
| **⌘K** | Universal command palette (cmdk). Fuzzy search across modules. Jumps to any concept, problem, pattern, saved diagram. |
| **⌘,** | Profile + settings. Quick switch between module lenses. |
| **⌘⇧M** | Module switcher overlay. Shows 4 modules + Review + Profile as a grid. Jump anywhere in 1 second. |
| **⌘G** | Graph view. Zoomable 2D knowledge map. Overlays current page. |
| **⌘R** | Review. Opens today's FSRS queue immediately. |
| **⌘?** | Shortcuts sheet. Context-aware: shows universal + mode-specific. |
| **NL queries** | Type free text into ⌘K: "show me problems that use consistent hashing" → Sonnet query parsed into graph query. ~$0.01 per query. |
| **⌘[** / **⌘]** | Jump back / forward through recent pages (same as browser history). |

Shortcuts are identical across modules. Learning them once in LLD applies in SD. This is the **muscle-memory invariant** (Q29).

### 17.5 DB-first persistent state (Q38)

Already touched in §4 and §7. Summarized here.

- Every mutation writes through to Postgres within 10 seconds.
- localStorage is read-through cache only.
- On login on a new device, the user resumes exactly where they left off: same mode, same scroll, same mid-drill timer, same canvas state.
- Conflict resolution: last-write-wins per field; per-diagram, the newer `updatedAt` wins; for FSRS records, union with max of `reps` and `lapses`.

### 17.6 Daily dashboard (Q39)

See §4.5. Restated with cross-module emphasis:

- **Streak pill** · unified across modules
- **FSRS queue** · mixed card types
- **Resume** · any module, any mode
- **AI recommended** · Sonnet's pick across modules, based on unified progress

The dashboard is the same dashboard for SD / LLD / Algorithms / OS&DB. The module switcher above the cards lets a user filter if they want — but the default is everything.

### 17.7 Progress-aware AI context (Q40)

Every AI call (see §15.6) carries the full `UserContext` including other modules' progress. The SD whisper coach knows a user has Mastered LLD's Observer pattern, and can phrase a suggestion as "This is a fan-out, similar to LLD Observer. Consider a queue + async workers." The coach speaks to a *whole* engineer.

### 17.8 Cross-module bridges by design (not bolted on)

A non-negotiable: **every concept, problem, and pattern is co-written with at least 2 cross-module bridges**. Opus writes the bridge text as part of authoring the primary content. No "related articles" scraper; all bridges are hand-made. A concept without bridges fails QA and doesn't ship.

---

## 18. UI & Visual Language

> "One color changes. Everything else stays."

### 18.1 The accent shift (Q29)

The single visual change between LLD and SD is the accent color.

- **LLD accent**: warm amber (`#F59E0B` + warm yellow glow on highlight)
- **SD accent**: cool cobalt blue (`#2563EB` + cool cyan glow on highlight)

Every other surface — layout, type, motion, shadow, iconography, sound — is identical to LLD. The cobalt is used in:
- Active mode-pill highlight
- Selected node / edge stroke
- Progress ring fill
- Active link underline in prose
- Button hover states
- Blueprint-mode background tint
- Cascade-trace glow in Simulate

Choice of cobalt: it reads as **wind, water, altitude, sky** — the atmospheric feel of systems at scale. Amber (LLD) reads as **paper, lamplight, book** — the feel of a designer's desk. Both are warm, both are dignified; the shift matters because it tells the user, without words, *you are in a different room*.

### 18.2 Typography (unchanged from LLD §10)

- **IBM Plex Serif** for long-form lesson prose, cinematic chaos narration, canvas labels, hook headlines
- **Geist Sans** for UI chrome, buttons, status text
- **Geist Mono** for code, timestamps, metrics, technical values

Three text scales:
- `--text-editorial-display` · 28px Serif · hooks
- `--text-editorial-body` · 14px Serif · lesson prose
- `--text-editorial-quote` · 14px Serif italic · pull quotes

Ten standard UI text scales unchanged from existing `design-tokens.ts`.

### 18.3 Layout system — collapsible docked panels (Q30)

Three-column baseline across all modes except Review. Left and right panes are collapsible with `[` and `]`. Default widths per mode:

| Mode | Left | Right | Bottom |
|---|---|---|---|
| Learn | 200px | 420px | — |
| Build | 260px | 360px | 240px |
| Simulate | 220px | 380px | 120px (timeline) |
| Drill | 240px | 300px | 80px (submit bar) |
| Review | — | — | — |

Panels are drag-resizable. Widths persist per-mode per-user (user_preferences JSONB). Collapse state is session-only.

### 18.4 The left icon rail (Q31)

Universal navigation. Vertical rail, always visible on desktop. 46px wide.

```
┌──┐
│📐│ LLD (amber highlight when active)
│🌪│ SD  (cobalt highlight when active)
│🎲│ Algorithms (violet highlight when active)
│💾│ OS&DB (emerald highlight when active)
│──│ divider
│🔁│ Review
│👤│ Profile
└──┘
```

Tooltip on hover names the module. The left rail is identical in SD and LLD; only the active-highlight color changes.

Within SD, the mode icons appear at the top of the main canvas area (the mode pill). ⌘1-5 shortcuts apply as specified in §3.

### 18.5 Motion (Q33)

- Baseline duration: **550ms** for standard transitions (same as LLD)
- Chaos ribbon: **900ms** total choreography
- Mode switch: **300ms** content slide
- Scrub: real-time (bound to user drag)
- Reduced-motion: all >300ms animations collapse to 150ms or instant; no parallax

All motion lives in the existing `motion.ts`. SD-specific additions:
- Chaos ribbon keyframes (§8.9)
- Particle-flow easing curves
- Node-breathing oscillator
- Cascade-glow ease-out

### 18.6 The 90-second guided onboarding (Q34)

First-visit SD experience:

- **00:00-00:05** — cold open full-screen: *"Welcome to the wind tunnel."* (one phrase, serif, cobalt glow on the word *wind*)
- **00:05-00:20** — dimmed mask with a single spotlight on the **Learn** mode pill. Caption: *"Learn teaches the 40 primitives of distributed systems. Start here."*
- **00:20-00:35** — spotlight moves to **Build**. *"Build is the drafting hall. Sketch any design you want."*
- **00:35-00:55** — spotlight moves to **Simulate**. *"Simulate runs your design. Traffic, cost, chaos. This is the wind tunnel."*
- **00:55-01:10** — spotlight moves to **Drill**. *"Drill is the examination room. 45 minutes, 5 stages, under the clock."*
- **01:10-01:20** — spotlight moves to **Review**. *"Review is daily retention. 2 minutes per day."*
- **01:20-01:30** — final caption: *"Five modes. One studio. Let's begin."* — with a "Begin" button.

Skippable at any point with Escape. After first completion, never shown again.

### 18.7 Content formats (Q32 · all 8, enumerated)

1. **8-section concept page** (§5.4)
2. **6-pane problem page** (§5.5)
3. **Scaling numbers strip** · "Redis: 100k ops/sec · sub-ms p99 · $0.11/hr" — inline visual token
4. **Decision tree** · when to use X vs Y vs Z, branching visual
5. **Engineering blog deep-link cards** · "Netflix engineering, 2019 · 11-min read" — link cards with meta
6. **Ask-AI inline** · a callout that opens the AI side drawer with a pre-seeded prompt
7. **Try-it button** · "Open this in Build mode" or "Simulate this design" — action-oriented cards
8. **Cross-module bridge card** (§17.2)

All 8 are reusable components. Every concept/problem page is a composition of these 8 blocks.

### 18.8 Rendering modes (Q53) · restated

Enumerated in §11.6. Users toggle between:
- Default (serif + particles + context icons)
- Blueprint paper
- Hand-drawn
- Plus on/off for: particle flow, breathing, ambient sound, failure cinema

Per-diagram setting, persisted in DB.

### 18.9 Color themes (Q46 · 3 themes)

User-selectable in settings:

1. **Midnight (default)** · dark UI, cobalt accent (SD) or amber (LLD)
2. **Parchment** · sepia-warm light theme, cobalt deepens to navy on parchment
3. **Earth** · muted earth-palette alternate (supersedes a straight "bright" for dignity)

All three pass WCAG AA for contrast. Midnight is the shipping default based on brainstorm feedback ("feels cinematic, matches the studio metaphor").

### 18.10 Micro-delights

Reused from LLD §11 — the Architex-wide micro-delight set:
- Skeleton loaders shaped like content (UML → canvas skeletons for SD)
- Empty states with character ("Your wind tunnel is calm. Press ▶ to test a design.")
- Typewriter streaming for AI responses
- Toast stack choreography
- Hover lift (2px) + press depth
- Loading messages that evolve
- Haptic-style visual feedback (ripples, shakes, bounces)

### 18.11 Accessibility

- Color is never the only signal. Metric bands use color + text + shape.
- All animations honor `prefers-reduced-motion`.
- All interactive elements reachable by keyboard.
- Screen reader pass for canvas: each node has an aria-label derived from its family, name, and config.
- High-contrast color theme toggle.
- Font size scales with browser zoom.

### 18.12 Sound (Q53 · optional, off by default)

- Chaos bass thump (§8.9)
- Subtle category ambience: the wind tunnel during Simulate (low-frequency noise), the drafting hall in Build (paper rustle and distant ruler-taps), the reading nook in Learn (very soft page-turn and wood-creak)
- Correct-checkpoint soft pop
- Wrong-checkpoint gentle negative tone

All generated via WebAudio (no file download). Off by default. Toggle in settings.

---


















