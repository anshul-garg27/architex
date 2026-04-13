# SEO, Content Marketing & Growth Strategy

---

## TARGET KEYWORDS

### Tier 1 — High Intent (Conversion)
| Keyword | Est. Volume | Competition |
|---|---|---|
| "system design interview prep" | 8-12K/mo | High |
| "system design interview tool" | 1.5-3K/mo | Medium |
| "system design simulator" | 500-1.2K/mo | Low |
| "system design practice platform" | 1-2.5K/mo | Medium |

### Tier 2 — Informational (Top of Funnel)
| Keyword | Est. Volume | Competition |
|---|---|---|
| "algorithm visualizer" | 15-25K/mo | High |
| "data structure visualization" | 5-10K/mo | Medium |
| "how to design [X]" (per problem) | 2-8K each | Medium-Hard |

### Tier 3 — Programmatic (Scale)
- 75+ HLD problems × unique keyword = 50K+ combined monthly volume
- "[company] system design interview questions" = 30K+ combined
- "[concept] explained for system design" = 20K+ combined

---

## PROGRAMMATIC SEO (Highest ROI Tactic)

75 HLD + 65 LLD + 50 patterns + 80 concepts = **270+ indexable pages**

### Problem Page Template
```
URL: /problems/design-url-shortener
Title: "Design a URL Shortener (TinyURL) - System Design | Architex"

1. Problem statement + requirements (free, indexable)
2. Interactive architecture diagram (Mermaid→SVG for crawlers)
3. Key concepts (linked to concept pages)
4. Back-of-envelope estimation (partial free)
5. API design (partial free)
6. Deep dive (gated behind free signup)
7. Related problems sidebar
8. FAQ section (targets "People Also Ask")
```

**At 50-200 visits/page/month → 13,500-54,000 organic visits from programmatic pages alone.**

---

## NEXT.JS SEO IMPLEMENTATION

### Metadata API
```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  return {
    title: `${problem.title} - System Design | Architex`,
    openGraph: { images: [`/api/og?problem=${params.slug}`] }, // Dynamic OG images
    alternates: { canonical: `https://architex.dev/problems/${params.slug}` },
  };
}
```

### Structured Data (JSON-LD)
- Problem pages: `Course` + `LearningResource` schema
- Blog: `TechArticle` schema  
- Site: `WebApplication` + `SoftwareApplication`

### Sitemap + robots.txt
Auto-generated via Next.js App Router `sitemap.ts` and `robots.ts`.

---

## CONTENT PILLARS

### Pillar 1: "System Design Explained" (Top of Funnel)
2K-3K word deep dives. 2/week.
"Consistent Hashing: The Complete Visual Guide", "How Netflix Handles 200M Subscribers"

### Pillar 2: "Interview Prep Guides" (Mid Funnel)
Structured walkthroughs. 1/week.
"System Design at Meta: What to Expect 2026", "The 15 Problems You'll Actually Be Asked"

### Pillar 3: "Engineering Deep Dives" (Authority)
Technical depth. 1 every 2 weeks.
"Building a Rate Limiter at 1M RPS", "Why Uber Migrated Postgres→MySQL"

### Pillar 4: "Interactive Concept Guides" (Differentiation)
Embedded interactive visualizations. 2/month.
"Watch How a Load Balancer Routes Requests" (live Architex sim embed)

---

## YOUTUBE STRATEGY

"System Design, Visualized" — screen recordings of Architex tool itself.

| Series | Length | Frequency |
|---|---|---|
| "Design in 10" | 8-12 min | 2/week |
| "Deep Dive" | 30-45 min | 1/week |
| "Concept Visualized" | 5-8 min | 1/week |
| "Mock Interviews" | 45-60 min | 2/month |
| "Shorts" | 30-60 sec | 5/week |

Every video ends with "Practice at architex.dev/[problem]" + QR code.

---

## TWITTER/X STRATEGY (2-3 tweets/day)

1. Visual concept threads (1-2/week) — 7-tweet threads with Mermaid diagrams
2. System design "hot takes" (2-3/week) — opinionated, discussion-generating
3. Interview tips (daily) — quick, actionable
4. Building in public (2-3/week) — development progress
5. Active engagement — reply to system design tweets with genuine value

---

## CONTENT DISTRIBUTION

| Platform | What to Post | Canonical to Architex? |
|---|---|---|
| Dev.to | Pillar 1 & 2 | Yes |
| Hashnode | Pillar 3 (deep dives) | Yes |
| Medium (Better Programming) | Pillar 2 (interview) | Yes |
| freeCodeCamp | Pillar 1 (tutorials) | Yes |

Always set `canonical_url` to architex.dev to prevent duplicate content penalties.

---

## NEWSLETTER: "The Architect's Digest"

Weekly, Tuesday morning:
1. One concept explained (2-3 paragraphs + diagram)
2. Problem of the week (link to practice)
3. One curated engineering blog link
4. One quick interview tip

Signup incentive: "System Design Interview Cheat Sheet" PDF.
Target: 10K subs in 6 months, 50K in 12 months.

---

## LAUNCH CHANNELS

### Product Hunt
- Tuesday/Wednesday launch at 12:01 AM PT
- 300+ pre-launch subscribers
- 90-second demo video
- Target: Top 5 Product of the Day

### Hacker News
- "Show HN: Architex — Interactive system design interview practice"
- Post 7-9 AM Eastern weekday
- Detailed first comment explaining technical architecture
- Answer every question thoroughly

### Reddit (Authentic Participation)
- r/cscareerquestions (900K), r/systemdesign (100K), r/leetcode (400K)
- Never post direct promotions
- Post valuable content that lives on architex.dev
- Personal account, not branded

### GitHub Repo: `architex/system-design-resources`
- Curated list of problems with links to interactive practice
- Target: 5,000 stars in year 1

---

## REFERRAL PROGRAM

"Give a friend 1 month free, get 1 month free"
- 3 referrals: 1 month free
- 10 referrals: 3 months free
- 25 referrals: Lifetime free + Ambassador badge

---

## GROWTH TIMELINE

| Month | Organic Visits | Newsletter | GitHub Stars | Discord |
|---|---|---|---|---|
| 3 | 5,000/mo | 2,000 | 1,000 | 500 |
| 6 | 25,000/mo | 10,000 | 3,000 | 2,000 |
| 12 | 100,000/mo | 50,000 | 10,000 | 10,000 |

---

## COMPETITIVE POSITIONING

"The only platform where you practice system design interactively with live architecture diagrams, real-time capacity estimation, and guided walkthroughs — not just read about it."

| vs Competitor | Architex Advantage |
|---|---|
| ByteByteGo | Interactive practice (they're passive reading) |
| Educative/Grokking | Better visualizations, modern UX |
| System Design Primer (GitHub) | Interactive tool vs static markdown |
| NeetCode | Deeper system design (they lean algorithm-heavy) |
| Excalidraw | Purpose-built for system design, not generic |
