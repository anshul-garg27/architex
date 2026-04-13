# System Design Module — Onboarding & Help System Audit

**Date:** 2026-04-12
**Module:** System Design (Architex)
**Score:** 8/10

---

## SURPRISING FINDING: The Onboarding System is Excellent

Unlike the teaching content (F) and content completeness (D+), the onboarding and help system is **comprehensive and well-designed**. Multiple layers work together:

| Layer | Component | Quality |
|-------|-----------|:-------:|
| 1. Guided tour | OnboardingOverlay (5 steps, spotlight, keyboard nav) | 9/10 |
| 2. First-encounter tooltips | ContextualTooltip (4 tracked features, auto-dismiss) | 9/10 |
| 3. Alt+hover explanations | ExplanationTooltip (node/edge deep explanations) | 9/10 |
| 4. Keyboard shortcuts | KeyboardShortcutsDialog (3 categories, searchable) | 9/10 |
| 5. Progressive hints | HintPanel (3-tier: Nudge/Guided/Full, 15-credit budget) | 9/10 |
| 6. Frustration detection | FrustrationDetector (behavioral scoring, 4 levels) | 9/10 |
| 7. Empty states | EmptyState + PropertiesPanel empty | 7/10 |
| 8. Module discovery | Welcome notifications per first module visit | 8/10 |
| 9. Anti-pattern detection | AntiPatternAutoDetector (SPOF, no cache, no LB) | 8/10 |
| 10. Progressive disclosure | Simulation UI hidden until play; features contextual | 8/10 |

---

## First 60 Seconds Assessment

### CS Student (knows system design)

| Time | What Happens | Score |
|:----:|-------------|:-----:|
| 0s | Onboarding overlay appears with spotlight | ✅ Clear |
| 10s | 5-step tour: components, canvas, simulation, modules | ✅ Helpful |
| 25s | Tour complete, empty state shows "Browse Templates" | ✅ Actionable |
| 35s | Clicks "Browse Templates", gallery opens with 55 templates | ✅ Rich |
| 45s | Clicks "URL Shortener", canvas loads with 6 nodes | ✅ Impressive |
| 55s | Clicks Play, simulation runs with particles and dashboard | ✅ "Wow!" |

**Score: 8/10** — Smooth path to first success. Gap: no teaching content after template loads (learnSteps not rendered).

### Complete Beginner

| Time | What Happens | Score |
|:----:|-------------|:-----:|
| 0s | Onboarding overlay appears | ✅ Welcoming |
| 10s | Tour explains "drag components" — but beginner doesn't know what a "Load Balancer" IS | ⚠️ No concept explanation |
| 25s | Tour ends, empty state says "Drag components or Browse Templates" | ⚠️ What are "components"? |
| 35s | Clicks "Browse Templates", sees 55 templates but doesn't know which to pick | ⚠️ No "Start Here" indicator |
| 45s | Picks URL Shortener (difficulty 2), sees architecture | ⚠️ What do the boxes mean? |
| 55s | Clicks Play, sees particles flowing but doesn't understand metrics | ⚠️ Numbers without context |

**Score: 5/10** — Can reach first success (see animation) but doesn't UNDERSTAND what they're seeing. The onboarding teaches HOW to use the tool but not WHAT the concepts mean.

### Mobile User

| Time | What Happens | Score |
|:----:|-------------|:-----:|
| 0s | Page loads | ✅ |
| 5s | Onboarding may trigger but sidebar covers canvas (P0 bug from visual audit) | ❌ Broken |
| 15s | Can't see canvas, can't interact | ❌ |

**Score: 2/10** — Mobile is broken (SDS-196).

---

## Gaps Found (Despite Strong Foundation)

### Gap 1: Frustration Detector NOT Wired to Help UI

`frustration-detector.ts` tracks behavior beautifully (rapid undo, long pauses, failed attempts) and computes frustration levels (calm → mild → frustrated → very-frustrated). But it's **not connected to any UI trigger**. The levels change but nothing happens.

**Fix:** When frustration reaches "frustrated" (level 3), show a non-intrusive toast: "Stuck? Try browsing templates for inspiration (Cmd+T)" or "Need help? Open the hint panel."

### Gap 2: No "What Does This Mean?" for Simulation Metrics

When simulation runs, the dashboard shows RPS, P99 Latency, Error Rate — but a beginner doesn't know if "200ms P99" is good or bad. No tooltips on metric pills explain what the numbers mean.

**Fix:** Add info tooltips on each metric pill: "P99 Latency: 99% of requests complete in under this time. Under 200ms is good for most APIs."

### Gap 3: Heatmap and Time-Travel Lack Discovery Labels

Heatmap toggle is just a flame icon. Time-travel scrubber appears after simulation without introduction. These powerful features are undiscoverable for new users.

**Fix:** Add first-encounter contextual tooltip for heatmap toggle and time-travel scrubber (same pattern as existing 4 tracked features).

### Gap 4: No "Replay Tour" in Settings

Onboarding overlay can be skipped but cannot be replayed. A user who skipped and later wants guidance has no way to see it again.

**Fix:** Add "Replay Onboarding Tour" button in Settings panel.

### Gap 5: Empty State Could Be More Inspiring

Current empty state is functional ("Browse Templates" button) but not inspiring. No preview, no "see what's possible" teaser, no micro-animation.

**Fix:** Add a small animated preview GIF or looping canvas snippet showing a simulation in action. Text: "Design systems like Netflix and Uber — then watch them run under load."

### Gap 6: No "Start Here" in Template Gallery for Beginners

55 templates shown alphabetically/by difficulty but no "Recommended First Template" badge or "Start Here" section.

**Fix:** Add a "Start Here" badge on URL Shortener (difficulty 2) in the gallery. Or a pinned "Beginner's Path" section at the top showing 3 recommended first templates.

---

## Summary

### Onboarding Score: 8/10

The system is genuinely well-designed with 10 interconnected help layers. The main gaps are:
- Frustration detector exists but isn't wired to UI (wastes excellent infrastructure)
- Metric explanations missing (beginners see numbers without context)
- Advanced features undiscoverable (heatmap, time-travel need first-encounter tooltips)
- Mobile onboarding broken (blocked by SDS-196)

### Time to First Success

| User Type | Current | Target | Blocker |
|-----------|:-------:|:------:|---------|
| CS student | ~55s | <30s | No teaching content after template load |
| Complete beginner | ~90s+ | <60s | Doesn't understand what the visualization shows |
| Mobile user | ❌ broken | <45s | SDS-196 must be fixed first |

### The Single Biggest Onboarding Fix

**Wire the frustration detector to the UI.** The infrastructure is already world-class (behavioral scoring, 4 levels, sliding window). Connecting it to a simple toast/nudge system would transform a passive analytics tool into an active help system that intervenes when the user is struggling. This is the Duolingo-style "smart nudge" that most educational platforms dream of but don't build — and Architex already has the engine, just needs the wiring.
