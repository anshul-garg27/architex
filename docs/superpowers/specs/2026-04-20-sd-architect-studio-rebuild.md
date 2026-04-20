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







