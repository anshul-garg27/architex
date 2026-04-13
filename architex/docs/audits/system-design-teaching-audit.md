# System Design Module — Teaching Quality Audit

**Date:** 2026-04-12
**Module:** System Design (Architex)
**Framework:** Bloom's Taxonomy + Cognitive Load Theory + Mayer's Multimedia Principles + 3Blue1Brown approach
**Sources:** Best-in-class comparisons from AlgoMaster, HelloInterview, ByteByteGo, Smudge.ai, Confluent, 3Blue1Brown, Brilliant.org

---

## CRITICAL PATTERN DISCOVERED

After reading ALL 55 templates, a clear and consistent pattern emerges across the entire module:

**Every template follows the SAME structure:**
1. Description: 1-2 sentences defining scope (textbook-style)
2. LearnSteps: 4 steps, each explaining one architectural component/pattern
3. Each step: technical deep-dive into HOW the component works

**What is CONSISTENTLY MISSING across ALL templates:**
- **No hooks** — Zero templates open with "why should I care?" or a problem scenario
- **No intuition** — Every template starts with architecture, never with analogy or concrete example
- **No "why" in steps** — Steps explain WHAT each component does but rarely WHY that approach was chosen over alternatives
- **No edge cases** — Steps never say "what happens if this fails?" as a teaching moment
- **No comparisons** — No template says "we chose Kafka over RabbitMQ because..."
- **No common mistakes** — Zero templates warn about what students get wrong
- **No self-test** — No "predict what happens next" prompts
- **No memorable summary** — No concise takeaway at the end

**This is a SYSTEMIC content issue, not individual template problems.** The entire content generation approach needs a new template/style guide.

---

## PHASE 2: SCORING ALL 55 TEMPLATES

### Scoring Key
- T1: Hook (why care?) | T2: Intuition before formalism | T3: Visual metaphor | T4: Step "why" | T5: Complexity intuition | T6: Edge cases | T7: Comparison | T8: Mistakes | T9: Real-world | T10: Progressive | T11: Self-test | T12: Summary

### Tier 1: Templates with learnSteps + Simulation (Best Content — 15 templates)

| Template | T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | Total | Grade |
|----------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:---:|:---:|:---:|:-----:|:-----:|
| URL Shortener | 1 | 1 | 2 | 2 | 1 | 1 | 0 | 0 | 1 | 2 | 0 | 0 | **11** | **F** |
| Twitter/X Timeline | 1 | 1 | 2 | 2 | 1 | 0 | 1 | 0 | 1 | 2 | 0 | 0 | **11** | **F** |
| Chat System (WhatsApp) | 1 | 1 | 2 | 2 | 1 | 1 | 0 | 0 | 1 | 2 | 0 | 0 | **11** | **F** |
| Web Crawler | 1 | 1 | 2 | 2 | 1 | 0 | 0 | 0 | 1 | 2 | 0 | 0 | **10** | **F** |
| Rate Limiter | 1 | 1 | 2 | 1 | 1 | 0 | 1 | 0 | 0 | 1 | 0 | 0 | **8** | **F** |
| API Rate Limiter | 1 | 1 | 2 | 2 | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | **8** | **F** |
| Typeahead | 1 | 1 | 2 | 2 | 1 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | **9** | **F** |
| Feature Flags | 1 | 1 | 2 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | **6** | **F** |
| CI/CD Pipeline | 1 | 1 | 2 | 2 | 0 | 0 | 0 | 0 | 1 | 2 | 0 | 0 | **9** | **F** |
| Email Service | 1 | 1 | 2 | 2 | 1 | 0 | 0 | 0 | 1 | 2 | 0 | 0 | **10** | **F** |
| Hotel Reservation | 1 | 1 | 2 | 2 | 1 | 1 | 0 | 0 | 0 | 2 | 0 | 0 | **10** | **F** |
| Logging System | 1 | 1 | 2 | 2 | 1 | 0 | 0 | 0 | 1 | 2 | 0 | 0 | **10** | **F** |
| Metrics & Monitoring | 1 | 1 | 2 | 2 | 0 | 0 | 0 | 0 | 1 | 2 | 0 | 0 | **9** | **F** |
| Search Engine (Simplified) | 1 | 1 | 2 | 2 | 1 | 0 | 0 | 0 | 1 | 2 | 0 | 0 | **10** | **F** |

### Tier 2: Templates with learnSteps but NO simulation (36 templates)

These follow the identical pattern to Tier 1. The content structure is the same: definition-first description, 4 technical steps, no hooks/intuition/comparison/mistakes/self-test/summary.

| Template | T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | Total | Grade |
|----------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:---:|:---:|:---:|:-----:|:-----:|
| Distributed Cache | 1 | 1 | 2 | 2 | 1 | 0 | 0 | 0 | 1 | 2 | 0 | 0 | **10** | **F** |
| Event Sourcing | 1 | 1 | 2 | 2 | 1 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | **9** | **F** |
| Netflix CDN | 1 | 1 | 2 | 2 | 1 | 0 | 0 | 0 | 2 | 2 | 0 | 0 | **11** | **F** |
| Distributed KV Store | 1 | 1 | 2 | 2 | 1 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | **9** | **F** |
| Collaborative Editor | 1 | 1 | 2 | 2 | 0 | 0 | 0 | 0 | 1 | 2 | 0 | 0 | **9** | **F** |
| ML Pipeline | 1 | 1 | 2 | 2 | 0 | 0 | 0 | 0 | 1 | 2 | 0 | 0 | **9** | **F** |
| Food Delivery | 1 | 1 | 2 | 2 | 1 | 0 | 0 | 0 | 1 | 2 | 0 | 0 | **10** | **F** |
| Uber Dispatch | 1 | 1 | 2 | 2 | 1 | 0 | 0 | 0 | 1 | 2 | 0 | 0 | **10** | **F** |
| YouTube | 1 | 1 | 2 | 2 | 0 | 0 | 0 | 0 | 1 | 2 | 0 | 0 | **9** | **F** |
| Spotify | 1 | 1 | 2 | 2 | 0 | 0 | 0 | 0 | 1 | 2 | 0 | 0 | **9** | **F** |
| Discord | 1 | 1 | 2 | 2 | 1 | 0 | 0 | 0 | 2 | 2 | 0 | 0 | **11** | **F** |
| Recommendation Engine | 1 | 1 | 2 | 2 | 0 | 0 | 0 | 0 | 1 | 2 | 0 | 0 | **9** | **F** |
| Social Feed | 1 | 1 | 2 | 2 | 1 | 0 | 1 | 0 | 1 | 2 | 0 | 0 | **11** | **F** |
| Stock Exchange | 1 | 1 | 2 | 2 | 1 | 0 | 0 | 0 | 1 | 2 | 0 | 0 | **10** | **F** |
| Ride Sharing | 1 | 1 | 2 | 2 | 1 | 0 | 0 | 0 | 1 | 2 | 0 | 0 | **10** | **F** |
| (all remaining) | 1 | 1 | 2 | 1-2 | 0-1 | 0 | 0 | 0 | 0-1 | 2 | 0 | 0 | **8-11** | **F** |

### Tier 3: Templates with ZERO learnSteps (4 templates — no teaching at all)

| Template | T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 | T11 | T12 | Total | Grade |
|----------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:---:|:---:|:---:|:-----:|:-----:|
| **Payment System** | 1 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **3** | **F** |
| **Instagram** | 1 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **3** | **F** |
| **Notification System** | 1 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **3** | **F** |
| **Search Engine (Simple)** | 1 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **3** | **F** |

---

## PHASE 2 SUMMARY

**Every single template scores F (0-11 out of 36).**

This is not because the architecture is wrong — the architectures are well-designed and technically accurate. It's because the TEACHING APPROACH is uniformly missing 8 of 12 dimensions:

| Dimension | Average Score | Maximum Possible | Gap |
|-----------|:------------:|:----------------:|:---:|
| T1: Hook | 1.0/3 | 3 | Generic descriptions, no problem-first hooks |
| T2: Intuition | 0.9/3 | 3 | No analogies, no concrete examples before architecture |
| T3: Visual metaphor | 2.0/3 | 3 | Architecture diagrams exist but don't explain logic |
| T4: Step "why" | 1.7/3 | 3 | Steps explain WHAT, sometimes HOW, rarely WHY |
| T5: Complexity intuition | 0.6/3 | 3 | Numbers mentioned but not explained intuitively |
| T6: Edge cases | 0.1/3 | 3 | Almost completely absent |
| T7: Comparison | 0.1/3 | 3 | Almost completely absent |
| T8: Common mistakes | 0.0/3 | 3 | **Completely absent across ALL 55 templates** |
| T9: Real-world | 0.7/3 | 3 | Occasionally mentions a company but rarely explains WHY |
| T10: Progressive | 1.8/3 | 3 | Steps are progressive within a template — one strength |
| T11: Self-test | 0.0/3 | 3 | **Completely absent across ALL 55 templates** |
| T12: Summary | 0.0/3 | 3 | **Completely absent across ALL 55 templates** |
| **TOTAL** | **9.0/36** | | **Module Average: F** |

---

## PHASE 3: BEST-IN-CLASS COMPARISON

### 1. Consistent Hashing — Best: AlgoMaster blog + selfboot.cn interactive ring

**Best explanation:** Opens with disaster scenario ("add 1 server, 80% cache miss storm"), shows naive mod-N failing with numbers, progressive ring visualization, interactive tool.

**Our content:** Distributed Cache template mentions consistent hashing in Step 2 but: no disaster hook, no mod-N failure demonstration, no interactive ring, no quantified impact.

**Gap:** The best explanation builds understanding through CONTRAST (before/after). Our content just states facts.

### 2. CAP Theorem — Best: Michael Whittaker illustrated proof

**Best explanation:** Sequential comic-strip frames showing impossibility proof. Reframes "pick 2 of 3" into "during partition, choose C or A."

**Our content:** No dedicated CAP theorem template. Mentioned implicitly in some templates. The biggest system design misconception has zero dedicated content.

**Gap:** Missing entirely. Should be a standalone interactive concept explorer.

### 3. Rate Limiting — Best: Smudge.ai interactive + ratelimit.arunavasircar.com

**Best explanation:** Interactive "Hit" button, shows boundary problem visually, progressive algorithm introduction.

**Our content:** Rate Limiter template has 3 steps covering token bucket, sliding window, distributed coordination. Steps explain mechanisms but don't show WHY token bucket fails at boundaries or WHY sliding window exists.

**Gap:** No progressive "algorithm A fails → algorithm B fixes it" narrative. No interactive testing.

### 4. Message Queues / Kafka — Best: DEV Community "Why Kafka?" guide

**Best explanation:** Problem-first ("what developers faced BEFORE Kafka"), component-by-component with animated GIFs, family messaging analogy.

**Our content:** Event Sourcing template covers advanced CQRS but no beginner "why message queues exist" content. Templates use Kafka but never explain it.

**Gap:** No foundational "what is a message queue and why" content. Jumps to advanced usage.

### 5. Database Sharding — Best: HelloInterview with "Taylor Swift problem"

**Best explanation:** Growth narrative hook, good vs bad shard key examples, the hot-shard problem personified.

**Our content:** No dedicated sharding template. Mentioned in some distributed DB templates but never as a standalone concept.

**Gap:** Missing entirely as a standalone teaching experience.

---

## PHASE 4: REWRITE RECOMMENDATIONS

### The ONE Change That Would Improve Everything

**Create a Content Style Guide that REQUIRES every template to have:**
1. A problem-first hook (2-3 sentences: what breaks without this system?)
2. A concrete analogy (1 sentence: real-world metaphor)
3. A "why this approach" section per learnStep (1-2 sentences per step explaining alternative rejected)
4. A "what could go wrong" edge case per learnStep
5. A comparison with alternatives section
6. A "common mistakes" section with 2-3 specific pitfalls
7. A 3-bullet memorable summary

This style guide, applied to ALL 55 templates, would raise every template from F to at least C.

### Specific Rewrites for Top 5 Most Important Templates

#### 1. URL Shortener (most common interview question — must be world-class)

**CURRENT HOOK:** "Design a URL shortener like TinyURL. Covers key generation, caching, redirect flow, and analytics tracking."

**REWRITE HOOK:** "Every time you click a t.co link on Twitter or a bit.ly link in an email, a URL shortener resolves it in under 10 milliseconds. With 500 million clicks per day on just bit.ly alone, this seemingly simple service handles more read traffic than most social media platforms. How would you build one?"

**CURRENT Step 1:** "When a user submits a long URL, the service hashes the URL..." (WHAT)

**REWRITE Step 1 (WHY):** "The hardest part of a URL shortener isn't generating short codes — it's doing it WITHOUT COLLISIONS under high concurrency. If two users submit URLs simultaneously, they can't get the same short code. We use a Key Generation Service (KGS) that pre-generates unique keys in batches. Why pre-generate instead of hash-on-demand? Because hashing creates a race condition: two servers could hash the same URL at the same microsecond and produce the same key. KGS eliminates this by reserving key ranges per server."

**COMPLEXITY INTUITION:** "This system is read-heavy: for every 1 URL created, it gets redirected 100 times. That 100:1 read-to-write ratio is why we put a cache in front of the database — without it, the database would need to handle 100x more queries."

**EDGE CASE:** "What happens if the cache crashes? All reads fall through to the database. At 500M redirects/day, that's 5,787 reads/second hitting PostgreSQL directly. The simulation's 'cache failure' chaos scenario shows exactly this cascade."

**COMMON MISTAKE:** "Students often use MD5 or SHA-256 to hash the URL and truncate. The problem: truncation increases collision probability exponentially. With 7 characters from a 128-bit hash, you get collisions after ~1 billion URLs (birthday problem). KGS avoids this entirely."

**SUMMARY:** "Three things to remember about URL shorteners: (1) Read-heavy (100:1 ratio) → cache is essential, not optional. (2) Key generation must be collision-free under concurrency → pre-generate, don't hash. (3) 301 vs 302 redirect is a real tradeoff: 301 is faster (browser caches) but hides analytics."

---

## PHASE 6: SUMMARY

### Overall Teaching Quality Score

| Grade | Count | % | Examples |
|-------|:-----:|:-:|---------|
| A (30-36) | 0 | 0% | None |
| B (24-29) | 0 | 0% | None |
| C (18-23) | 0 | 0% | None |
| D (12-17) | 0 | 0% | None |
| **F (0-11)** | **55** | **100%** | All templates |

### Module Teaching Score: 2/10

The architecture quality is 8/10. The teaching quality is 2/10. The templates are correct infrastructure diagrams with technical specifications — they are NOT educational experiences. They read like internal architecture docs, not learning content.

### Weakest Teaching Dimensions

| Dimension | Avg Score | Gap |
|-----------|:---------:|-----|
| T8: Common mistakes | **0.0/3** | Completely absent across all 55 templates |
| T11: Self-test | **0.0/3** | Completely absent — no prediction, no quiz, no "try it" |
| T12: Summary | **0.0/3** | No takeaway, no flashcard content, no memorable bullet |
| T6: Edge cases | 0.1/3 | Almost never discussed |
| T7: Comparison | 0.1/3 | Alternatives almost never mentioned |
| T5: Complexity intuition | 0.6/3 | Numbers without "what does this MEAN" |
| T9: Real-world | 0.7/3 | Companies mentioned but not explained |
| T2: Intuition | 0.9/3 | No analogies or concrete examples |
| T1: Hook | 1.0/3 | Definitions, not motivations |

### Top 5 Concepts Needing Urgent Rewrite

1. **Payment System** (3/36) — Zero learnSteps + architecturally inaccurate. Highest interview frequency × worst content.
2. **Instagram** (3/36) — Zero learnSteps for a difficulty 5 template.
3. **Notification System** (3/36) — Zero learnSteps + broken simulation references.
4. **URL Shortener** (11/36) — The #1 interview warm-up question should be our flagship, not an F.
5. **Rate Limiter** (8/36) — One of the most common interview questions, needs progressive algorithm comparison.

### Top 5 Content Strengths (What Works)

1. **Architecture accuracy** — Node placement, edge types, and data flows are technically correct across all templates
2. **Progressive step structure** — 4 steps per template do build understanding progressively within a template (T10 avg 1.8/3)
3. **Technical depth** — Steps contain specific implementation details (Redis commands, Kafka partitioning, PostgreSQL features)
4. **Visual canvas** — The interactive architecture diagram is inherently more educational than static images
5. **Simulation integration** — The 15 templates with simulation configs allow users to see architectures under load

### The One Change That Would Improve EVERYTHING

**Add a `teachingContent` section to the template JSON schema with required fields:**

```json
"teachingContent": {
  "hook": "2-3 sentences: what breaks without this system? (problem-first, not definition-first)",
  "analogy": "1 sentence: real-world metaphor a non-engineer would understand",
  "whyThisApproach": "1-2 sentences per learnStep: what alternative was rejected and why",
  "edgeCases": ["What happens if X fails?", "What if traffic 10x's?"],
  "commonMistakes": ["Students often think X but actually Y because Z"],
  "comparison": "How does this differ from [related system]? When would you choose one over the other?",
  "summary": ["Bullet 1: most important insight", "Bullet 2: key tradeoff", "Bullet 3: interview tip"]
}
```

Then systematically populate this for all 55 templates. This would raise the module from 2/10 to 7/10 without changing any architecture.
