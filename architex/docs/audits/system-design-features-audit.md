# System Design Module — Features & Systems Audit (Layers 6-10)

**Date:** 2026-04-12
**Module:** System Design (Architex)
**Focus:** Retention, Community, Operations, Discovery, Innovation wrapper systems

---

## LAYER SCORES

| Layer | Score | Target | Biggest Gap |
|-------|:-----:|:------:|-------------|
| 6. Retention | **7/10** | 8 | Missing: weekly recap, personalized "next up", streak freeze/repair |
| 7. Community | **6/10** | 7 | Missing: social proof, public collections, social sharing buttons |
| 8. Operations | **5/10** | 8 | Missing: content CLI, validation tool, QA checklist, author guide |
| 9. Discovery | **8/10** | 9 | Missing: embeddable widgets, social share buttons, concept-specific OG images |
| 10. Innovation | **7/10** | 9 | Covered in prior audits (Innovation, Practice) |

---

## LAYER 6: RETENTION — Score 7/10

### What Already Exists (Impressive)
- SRS with FSRS algorithm (srs.ts) — ✅ Production-grade
- Streak counter + micro-challenges (streak-protector.ts) — ✅
- Progress tracking (progress-store.ts, module-progress.ts) — ✅
- Achievements/badges (25+, achievements.ts) — ✅
- Skill tree (5 tracks, 40+ nodes) — ✅
- Daily challenge system — ✅
- Leaderboard with Elo — ✅
- Difficulty adaptation (Bayesian, difficulty-adaptation.ts) — ✅
- Frustration detection — ✅

### What's Missing
1. **Streak Freeze + Repair** — Duolingo's most impactful retention mechanic. Reduced churn by 21%.
2. **Weekly Learning Recap** — "You designed 3 systems, mastered 2 concepts, your streak is 12 days"
3. **Personalized "Next Up"** — Dynamic recommendation based on skill gaps (not just static paths)
4. **Bookmark/favorite templates** — Save designs for later review
5. **Knowledge Decay Dashboard** — Show concepts dropping below retention threshold

---

## LAYER 7: COMMUNITY — Score 6/10

### What Already Exists
- Share designs via URL (LZ-string compression, to-url.ts) — ✅
- User profiles (profile/[username]/page.tsx, mock data) — ✅ (needs backend)
- Comments system (threaded, localStorage-backed) — ✅
- Collaboration infrastructure (collaboration-manager.ts, store) — ✅ Foundation
- Follow mode (viewport sync for guided navigation) — ✅
- Design battles (Elo-rated competitive mode) — ✅
- Weekly community challenges (voting, leaderboard) — ✅
- oEmbed provider for Slack/Notion/Discord — ✅

### What's Missing
1. **Social sharing buttons** — No "Share on Twitter/LinkedIn" buttons on any page
2. **Social proof** — No "42,000 students learned this" counters
3. **Public design collections** — No shareable playlists of designs
4. **Teaching/mentor mode** — Follow mode exists but no full teaching control delegation

---

## LAYER 8: OPERATIONS — Score 5/10

### What Works Well
- **1 JSON file per template** — Extremely low friction for adding content
- **Comprehensive type schema** (types.ts) — DiagramTemplate interface covers all fields
- **55 existing templates** — Large content library to reference
- **CONTRIBUTING.md** — Basic documentation exists

### What's Missing
1. **Content CLI tool** — No `pnpm content:new [template-name]` generator
2. **Template validation** — No JSON schema validator for new templates
3. **Quality checklist** — No automated or manual QA gates
4. **Detailed author guide** — CONTRIBUTING.md has 10 lines on templates
5. **Content completeness scoring** — No dashboard showing which templates have all fields populated
6. **LLM-assisted content generation** — No pipeline to draft content from bullet points

---

## LAYER 9: DISCOVERY — Score 8/10

### What Exists (Excellent)
- Individual routes per problem, concept, pattern, interview — ✅ Excellent
- Open Graph + Twitter Card meta tags (dynamic per page) — ✅ Excellent
- JSON-LD structured data (Course, LearningResource) — ✅ Good
- Sitemap with 50+ routes, priorities, changeFrequency — ✅ Excellent
- robots.txt — ✅
- OG image generation (Edge runtime, 7 content types) — ✅ Excellent
- GIF recorder, PNG/SVG/PDF export — ✅ Excellent
- oEmbed provider — ✅
- PostHog analytics infrastructure (ready, awaiting key) — ✅

### What's Missing
1. **Social sharing buttons** — No "Share" buttons on content pages
2. **Embeddable widget** — No iframe embed endpoint for external sites
3. **Concept-specific OG images** — OG route generates branded cards, not visualization previews
4. **`teaches`/`assesses`/`timeRequired` in JSON-LD** — Missing key educational schema properties
5. **FAQ schema** — `generateFAQJsonLd()` exists but may not be wired to concept pages
6. **Individual visualization pages** — Visualizations are inside the canvas tool, not individually indexed

---

## SUMMARY

### Top 5 "Ship This Week" Features

| # | Feature | Layer | Effort | Impact |
|---|---------|:-----:|:------:|:------:|
| 1 | Add social share buttons (Twitter/LinkedIn/Copy Link) to all content pages | Discovery | S | HIGH — zero-cost distribution |
| 2 | Add `teaches`/`assesses`/`timeRequired` to JSON-LD | Discovery | S | HIGH — SEO ranking signal |
| 3 | Add bookmark/favorite feature for templates | Retention | S | MEDIUM — convenience |
| 4 | Add concept-specific OG preview images | Discovery | S | HIGH — 40-60% CTR lift on social |
| 5 | Add streak freeze system (1 free freeze/week) | Retention | S | HIGH — 21% churn reduction (Duolingo data) |

### Top 5 "Ship This Month" Features

| # | Feature | Layer | Effort | Impact |
|---|---------|:-----:|:------:|:------:|
| 1 | Weekly learning recap email with behavioral segmentation | Retention | M | HIGH — re-engagement driver |
| 2 | Embeddable widget endpoint + embed code generator | Discovery | M | HIGH — organic backlink growth |
| 3 | Content creation CLI + template scaffolding tool | Operations | M | HIGH — scales content 5x |
| 4 | Knowledge Decay dashboard ("fading concepts") | Retention | M | MEDIUM — urgency driver |
| 5 | Personalized "next up" recommendation engine | Retention | M | HIGH — engagement driver |

### Top 3 "First In The World" Features

(From Innovation audit — included here for completeness)
1. **Prediction Mode** — "Where will the bottleneck appear?" before simulation (no competitor has this)
2. **"You ARE the Load Balancer"** manual tracing mode (transform passive → active)
3. **Architecture Linter with live anti-pattern detection** (red squiggles as you build)

### The ONE Feature That Changes Everything

**Prediction Mode (SDS-257).** It transforms the simulation from a passive demo into an active learning experience. The student predicts, the simulation reveals, the gap between prediction and reality triggers surprise-driven encoding (g=0.74 testing effect). It builds on the existing simulation infrastructure, requires no backend, and addresses the fundamental gap in the module: the difference between "watching a system run" and "proving you understand why it runs that way."
