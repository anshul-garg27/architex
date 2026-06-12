# Codemap 08 — Public Surfaces, SEO, PWA, Mobile, Build Infra

> **AUDIT NOTE (2026-05-07):** This doc was authored before the SPA routing model was empirically verified. Specific corrections are inline below as `> CORRECTION:` blockquotes. The routing-model truth lives in `09-ui-tour.md` (v2) and `18-other-modules.md`. Where this doc and v2 disagree, **v2 wins**.

Module owner: public-facing entry points (landing, pricing, blog, gallery, embed, interviews, problems index), shareability surfaces (OG/oEmbed), the PWA shell, mobile UX scaffolding, analytics + consent, and build/CI/CD configuration.

---

## 1. Purpose

This module is the seam where Architex meets the outside world. Two distinct surfaces are bundled here:

- **Public surfaces** — pages designed to be reached cold (organic search, social share, email link, embed in another article). They target SEO discovery (`/landing`, `/pricing`, `/blog`, `/interviews`, `/problems`, `/gallery`), shareability (`/api/og`, `/api/oembed`), iframe consumers (`/embed/*`), and degraded-network fallbacks (`/offline`, `public/offline.html`, service worker).
- **Ops + build surface** — `next.config.ts` (`src/app/layout.tsx:1-99`), `vercel.json`, `Dockerfile`, GitHub workflows under `.github/workflows/`, `.size-limit.json`, `playwright.config.ts`, `vitest.config.ts`, `.storybook/`. This is what ships the bits.

The interactive learning canvases (`/`, `/modules`, `/dashboard`, etc.) are covered by other codemaps; this one limits its scope to public marketing/SEO, mobile/PWA shell components, and infrastructure.

> **CORRECTION (2026-05-07):** Among the parenthetical "interactive learning canvases", only `/` is actually an interactive canvas/SPA shell. `/modules` is a static catalog grid of cards (`src/app/modules/page.tsx`) that all link to `/`; it is not a workspace shell. `/dashboard` is a per-user dashboard page (not a module canvas). Active module type is held in Zustand `useUIStore.activeModule`, not in any path. Source: `09-ui-tour.md` v2 §1A and `18-other-modules.md` §2.3.

---

## 2. Marketing routes

### 2.1 `/landing` — `src/app/landing/page.tsx`

Server component (`src/app/landing/page.tsx:1-77`):

- Exports `metadata` with full `openGraph`, `twitter`, OG image at `https://architex.dev/api/og?title=Architex&type=landing` (`src/app/landing/page.tsx:10-37`).
- Constructs three JSON-LD blocks at module scope: 13 `Course` records (one per module — `src/app/landing/page.tsx:41-55`), 6 `LearningResource` records for marquee topics like CAP theorem and Raft (`src/app/landing/page.tsx:57-64`), and an `Organization` record (`src/app/landing/page.tsx:66-68`). Renders them through `<JsonLd data={[orgJsonLd, ...courseJsonLd, ...resourceJsonLd]} />`.
- Renders the client component `<LandingPage />` (`src/components/landing/LandingPage.tsx`).

`src/app/landing/layout.tsx:1-11` wraps children in a single `<div className="h-full overflow-y-auto scroll-smooth">` — the only place in the app where the root `<body>`'s `overflow-hidden` (`src/app/layout.tsx:77`) is escaped so the marketing page can scroll.

### 2.2 `<LandingPage />` — `src/components/landing/LandingPage.tsx`

Client component, motion-heavy. Section walk:

- **Mobile/desktop nav** — `MobileNav` (`src/components/landing/LandingPage.tsx:300-395`): hamburger on mobile, inline links (`#features`, `#how-it-works`, `#pricing`) on `md+`, plus `Sign In` and `Get Started → /dashboard` CTAs.
- **Hero** — `useScroll`-driven opacity/scale fade (`src/components/landing/LandingPage.tsx:402-553`). Layered backgrounds: `<GradientMeshBackground />`, radial blur glow, and a faint grid pattern (`src/components/landing/LandingPage.tsx:425-433`). Headline uses `<GradientText>`, subheadline animated with motion's `initial/animate`, `<TypewriterText>` for a CLI snippet, and embeds `<MiniSimulator />` as a live demo at `id="demo"`.
- **Social proof** — `src/components/landing/LandingPage.tsx:556-587`: hardcoded company word-marks (`Google, Meta, Amazon, Microsoft, Stripe, Uber`) and three testimonials in a `sm:grid-cols-3` grid.
- **Problem statement** — `src/components/landing/LandingPage.tsx:590-603`: "System design interviews are broken" + supporting `<FadeUpText>` paragraph.
- **How it works** — `src/components/landing/LandingPage.tsx:606-652`: 3-step grid driven by the `steps` constant (`src/components/landing/LandingPage.tsx:233-255`).
- **Modules grid** — `src/components/landing/LandingPage.tsx:655-703`: 13 module cards, data hardcoded in the `modules` constant (`src/components/landing/LandingPage.tsx:109-227`). Layout is `xl:grid-cols-4`.
- **Stats bar** — `src/components/landing/LandingPage.tsx:706-723`: 4 `<CountUpNumber>` tiles. Numbers (`13`, `34`, `33+`, `38`) live in the `stats` constant (`src/components/landing/LandingPage.tsx:261-266`).
- **Competitor comparison** — `src/components/landing/LandingPage.tsx:726-790`: 8-row table comparing Architex against `PaperDraw`, `Excalidraw`, and `Static Diagrams`. Cell values are tuples of `boolean | string` rendered as `Check`, `Minus`, or text.
- **Pricing block** — `src/components/landing/LandingPage.tsx:793-893`: re-renders the `PRICING_TIERS` constant (imported from `@/lib/constants/pricing`, the same source `/pricing` consumes — `src/components/landing/LandingPage.tsx:38`). Adds tier-specific trust signals at `:867-870` and a row of generic trust badges (30-day money-back, SOC 2, 99.9% uptime) at `:877-891`.
- **Final CTA** — `src/components/landing/LandingPage.tsx:896-920`.
- **Footer** — `src/components/landing/LandingPage.tsx:923-1007`: 4-column link grid driven by `footerLinks` (`src/components/landing/LandingPage.tsx:277-294`), brand SVGs `IconGitHub` / `IconTwitter` / `IconLinkedIn` (`:51-73`), copyright. Hashed and external links branched at `:974-989`.

### 2.3 Landing animation primitives — `src/components/landing/`

Each is a self-contained client component:

- `AnimatedText.tsx` — exports `GradientText` (`:79-100`), `TypewriterText` (`:141-189`), `FadeUpText` (`:203-232`), `CountUpNumber` (`:249-291`). All four respect `useReducedMotion()` (e.g. `src/components/landing/AnimatedText.tsx:84,148,210,256`). Inline `<style dangerouslySetInnerHTML>` is used to declare `@property` custom-property animations because Tailwind v4 doesn't expose them (`:88, :180`). Each `<style>` tag's `__html` is a hardcoded constant — explicit security note at `src/components/landing/AnimatedText.tsx:18-19`.
- `GradientMeshBackground.tsx` — animated 3-layer radial gradient on `@property` hue + position custom properties (`src/components/landing/GradientMeshBackground.tsx:21-199`). Static fallback class `.gradient-mesh-bg--static` for browsers without `@property` and for `prefers-reduced-motion`.
- `MiniSimulator.tsx` — embedded SVG demo of `Client → API Gateway → Service → Database` (`src/components/landing/MiniSimulator.tsx:38-86`). Auto-plays a "service" failure 3 s after scroll-into-view, recovers after 3 s (`src/components/landing/MiniSimulator.tsx:213-229`). Click toggles failure state per-node; `isAffectedByFailure` propagates downstream (`:97-108`). Animated dots travel along edges via `<motion.circle>` keyframe `cx/cy` arrays (`:144-162`). Includes a status bar at the bottom showing `N node(s) degraded` or `All systems operational` (`:471-487`).
- `ScrollReveal.tsx` — generic stagger/non-stagger reveal wrapper (`src/components/landing/ScrollReveal.tsx:54-130`); supports `direction`, `delay`, `once`, `amount`, `stagger`, `staggerDelay`, `as`. Uses `whileInView` (Intersection Observer under the hood).

### 2.4 `/pricing` — `src/app/pricing/page.tsx`

- Server component sets metadata (`src/app/pricing/page.tsx:7-34`); OG image `https://architex.dev/api/og?title=Pricing&type=pricing` (`:21`).
- Renders `<PricingContent />` from `src/app/pricing/PricingContent.tsx` (client component).

`src/app/pricing/PricingContent.tsx`:

- Pulls `PRICING_TIERS` from `@/lib/constants/pricing` (`:16`) — single source of truth shared with the `/landing` block.
- Enriches with per-tier icon + `currentPlan` flag in `TIER_ENRICHMENTS` (`:29-34`).
- `COMPARISON` constant is a 22-row, 4-tier `FeatureRow[]` matrix (`:55-78`).
- `COMPETITIVE_COMPARISON` is a 12-row Architex-vs-PaperDraw table with `advantage: "architex" | "paperdraw" | "tie"` (`:91-104`).
- `FAQS` array of 8 Q&A objects (`:112-145`).
- `BillingToggle` (monthly/annual switch with `Save 20%` badge) at `:194-242`. `formatPrice` applies a 20% annual discount and `Math.round(monthly * 12 * 0.8) / 12` (`:151-155`).
- `PricingCard` (`:244-374`) renders 4-tier grid: free, student (`.edu Required` badge), pro (`Most Popular` badge), team. Empty `Current Plan` ribbon if `tier.currentPlan` is set.
- Page composition at `:534-633`: back link → header → toggle → 4 pricing cards (`lg:grid-cols-4`) → comparison → competitive comparison → FAQ → CTA.
- Note: no JSON-LD on `/pricing` (the landing page absorbs the structured data).

### 2.5 No A/B testing surface

There is no A/B framework wiring; `featureFlag()` exists in `src/lib/analytics/posthog.ts:141-153` but returns `false` until a real PostHog client is plumbed in.

---

## 3. Gallery

### 3.1 `/gallery` route — `src/app/gallery/page.tsx`

Client component (`"use client"`) backed by mock data:

- `MOCK_GALLERY: GalleryEntry[]` is hardcoded (12 entries) at `src/app/gallery/page.tsx:46-191`. Each entry has `{id, title, author, category, upvotes, nodeCount, createdAt, description, thumbnailGradient, tags}`.
- `CATEGORIES` (`:193-201`) — 7 values including `"All"`. `SORT_OPTIONS` (`:203-207`) — `recent | popular | trending`.
- Trending score formula `upvotes / Math.pow(ageHours + 2, 1.5)` at `src/app/gallery/page.tsx:227-230`.
- `DesignCard` (`:234-330`) renders thumbnail using `<MiniArchitectureSVG entryId={entry.id}/>`, node-count chip, tags, upvote (`Heart`) and fork (`GitFork`) buttons. Toast notifications fire on upvote/fork (`:357-373`). Fork is currently a UI-only stub — the comment at `:373` says "In a full implementation, this would navigate to / with forked design loaded".
- Filter pipeline at `:377-414`: category → search (matches `title | author | description | tags`) → sort.

`src/app/gallery/layout.tsx:1-15` injects metadata only.

`src/app/gallery/loading.tsx:1-90` is a server-component skeleton shaped to match the gallery toolbar + 8-card grid (`sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`).

### 3.2 `<MiniArchitectureSVG />` — `src/components/gallery/MiniArchitectureSVG.tsx`

Lightweight thumbnail diagrams (no React Flow). Twelve hardcoded layouts (`cdn`, `chat`, `event-driven`, `social-feed`, `data-pipeline`, `infrastructure`, `ride-matching`, `rate-limiter`, `notification`, `payment`, `ml-pipeline`, `analytics` — `src/components/gallery/MiniArchitectureSVG.tsx:28-316`). `ID_TO_LAYOUT` map (`:319-332`) ties gallery entry ids `g-001`…`g-012` to a layout key. Renders nodes as `circle | rect | diamond` (`:338-376`) with colors driven by CSS variables (`var(--node-client)`, `--node-storage`, etc., `:31-50`).

### 3.3 Database schema for real submissions — `src/db/schema/gallery.ts`

Drizzle tables for the production version of the gallery:

- `gallerySubmissions` (`src/db/schema/gallery.ts:22-44`): UUID primary key, FK to `diagrams.id` (`onDelete: cascade`, unique index on `diagram_id` so each diagram surfaces at most once), title varchar, optional description text, `upvotes` int default 0, `authorId` FK to `users.id`. Indexes: `gallery_author_id_idx`, `gallery_upvotes_idx`.
- `galleryUpvotes` (`:49-69`): per-user upvote rows for one-vote-per-user enforcement via `uniqueIndex("gallery_upvotes_user_submission_idx").on(userId, submissionId)`.

The `/gallery` UI does not yet read from these tables — the live surface is mock-only. The schema + indexes are wired but unconsumed by the route.

---

## 4. Embed

### 4.1 `/embed/algorithms/[slug]` — `src/app/embed/algorithms/[slug]/page.tsx`

- Async server component; flattens 7 algorithm category arrays (`SORTING_ALGORITHMS`, `GRAPH_ALGORITHMS`, etc., `src/app/embed/algorithms/[slug]/page.tsx:2-20`) and `find`s by id.
- Renders a placeholder `<div>Embedded visualization for {algo.name}.</div>` with an "Open in Architex" outbound link (`:38`). The actual interactive visualizer is intentionally not loaded — this is a stub container for iframe contexts.

### 4.2 `/embed/lld/*` — UML class diagrams

`src/app/embed/lld/layout.tsx:1-29` is the embed-only layout: no activity bar, no status bar, sets `metadata.robots = { index: false, follow: false }` (`:11`), `viewport: { width: "device-width", initialScale: 1 }`. Container fills the viewport with `h-screen w-screen overflow-hidden`.

Three concrete embed routes share `<EmbedUMLCanvas />`:

- `src/app/embed/lld/pattern/[id]/page.tsx:1-65` — design patterns. `generateStaticParams` tries DB first via `getSEOContent("lld", "pattern")`, falls back to the static `DESIGN_PATTERNS` array (`:16-23`). ISR `export const revalidate = 86400` (`:26`).
- `src/app/embed/lld/problem/[id]/page.tsx:1-49` — LLD problems. Same DB-first → static fallback pattern. Category label is `Difficulty {n}/5`.
- `src/app/embed/lld/solid/[id]/page.tsx:1-49` — SOLID demos. Title prepends `${principle} — `.

`<EmbedUMLCanvas />` (`src/app/embed/lld/_components/EmbedUMLCanvas.tsx:97-365`) is a server-rendered SVG UML class diagram:

- Layout is a 3-column grid (`COLS = 3`, `src/app/embed/lld/_components/EmbedUMLCanvas.tsx:20`); each class has fixed `CLASS_WIDTH = 220` and dynamic height computed by `classHeight()` from attribute + method counts (`:37-41`).
- Six relationship arrow markers (`inheritance`, `realization`, `composition`, `aggregation`, `association`, `dependency`) with hardcoded marker paths (`:78-85`).
- Rendering: edges first (under classes), then class boxes with header (`#2a2a45`), divider, attributes (mono, `#a1a1aa`), methods (mono, `#d4d4d8`). Stereotype labels (`«interface»`, `«abstract»`, `«enumeration»`) printed in italic violet (`:267-280`).
- Header bar shows title + category badge + "Open in Architex ↗" outbound link (`:121-138`); footer reads `Powered by Architex` (`:352-362`).

### 4.3 `/api/oembed` — `src/app/api/oembed/route.ts`

oEmbed provider for shareable design URLs:

- Validates `url` parameter belongs to `architex.app`, `www.architex.app`, or `localhost` (`src/app/api/oembed/route.ts:75-87`); returns 400 otherwise.
- Reads `format` (only `json` supported, returns 501 for any other value, `:50-55`), `maxwidth` (clamped to 800), `maxheight` (clamped to 450).
- Builds an iframe HTML payload pointing to `${PROVIDER_URL}/embed?d=${designData}` or `${PROVIDER_URL}/embed?url=${url}` (`:103-118`). `sandbox="allow-scripts allow-same-origin"`.
- Thumbnail uses the OG endpoint: `${PROVIDER_URL}/api/og?title=${title}&type=concept` (`:121`).
- Response is `OEmbedRichResponse` typed at `:20-33`. Cache headers: `public, max-age=86400, s-maxage=604800`. CORS: `Access-Control-Allow-Origin: *` (`:139-143`).
- Note discrepancy: `PROVIDER_URL = 'https://architex.app'` (`:15`), while the rest of the codebase uses `architex.dev`.

---

## 5. Blog

### 5.1 Source of posts

Posts live in TypeScript, not MDX or DB — `src/lib/blog/posts.ts:13-50` defines the `BlogPost` interface (`{slug, title, excerpt, date, readingTime, tags, content}`) with `content` as raw markdown string. Three posts are inlined (`how-consistent-hashing-works`, `system-design-interview-framework`, `understanding-cap-theorem`); additional posts are spread in from `BLOG_POST_DATA` in `src/lib/seo/blog-data.ts` (`src/lib/blog/posts.ts:42-49`).

The MDX dependencies (`@mdx-js/mdx`, `@mdx-js/react`, `remark-gfm`, `gray-matter`) listed in `package.json:39-77` are not currently used by `/blog` — they appear to be available for other content surfaces (LLD content compiler at `scripts/compile-lld-lessons.ts`).

### 5.2 `/blog` route

`src/app/blog/page.tsx`:

- Metadata (`:9-41`) with RSS alternate at `application/rss+xml: https://architex.dev/blog/feed.xml`.
- Builds unique categories via `Array.from(new Set(BLOG_POSTS.flatMap((p) => p.tags))).sort()` (`:46-48`).
- Renders client child `<BlogPostFilters posts={...} categories={...}/>` (`:79-89`).

`src/app/blog/BlogPostFilters.tsx`:

- `useState` for `activeCategory`, `useMemo` for filtered list (`:163-168`).
- Hardcoded `TAG_COLORS` map for `distributed-systems`, `system-design`, `interview`, `database` (`:9-14`); falls back to elevated/muted styles for unknown tags.
- `FeaturedPostCard` (`:89-157`) renders the first post full-width with a gradient thumbnail; `PostCard` (`:42-84`) renders the remainder in a 2-column grid.

`src/app/blog/loading.tsx:1-49` is a 6-card skeleton (`sm:grid-cols-2 lg:grid-cols-3`) — note its layout differs from `BlogPostFilters` (`sm:grid-cols-2`).

### 5.3 `/blog/[slug]` — `src/app/blog/[slug]/page.tsx`

- `generateStaticParams` returns `getAllBlogSlugs().map((slug) => ({ slug }))` (`:14-16`).
- `generateMetadata` (`:23-53`) builds title `${post.title} | Architex Blog`, description via `blogMetaDescription(post.title, post.tags)` from `@/lib/seo/meta-templates`, OG image at `/api/og?title=...&type=blog`. Sets `openGraph.type = "article"`, includes `publishedTime` and `tags`.
- `renderMarkdown` is a hand-rolled mini-renderer (`:58-134`) — line-based, supports `# / ## / ###` headings and inline `[text](url)` links via regex (`linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g`, `:98`). No code blocks, lists, bold, italic, or images. Wraps paragraphs in `<p>` with `text-foreground-muted leading-relaxed`.
- `getRelatedPosts(slug)` from `@/lib/blog/posts` (`:158`); shown in `sm:grid-cols-2`.
- Article shell: tags chip row → h1 → date + reading time → markdown body → "Try it in Architex" CTA card → related posts.

### 5.4 `/blog/feed.xml` — `src/app/blog/feed.xml/route.ts`

- Hand-rolled RSS 2.0 generator. `escapeXml` covers `&<>"'`. (`:3-10`).
- Items include `title`, `link`, `guid`, `description`, `pubDate` (`new Date(post.date).toUTCString()`), `category` per tag (`:15-24`).
- Channel meta hardcoded to title `Architex Blog`, link `https://architex.dev/blog`, language `en-us` (`:28-32`).
- Headers: `Content-Type: application/rss+xml; charset=utf-8`, `Cache-Control: s-maxage=3600, stale-while-revalidate` (`:40-43`).

---

## 6. Interviews

### 6.1 `/interviews` index — `src/app/interviews/page.tsx`

- Metadata (`:12-30`); no OG image override (relies on root layout default).
- Pulls 15 companies from `@/lib/seo/company-data` (`COMPANIES` and `InterviewDifficulty` types — `:2-6`).
- `DIFFICULTY_BADGE` maps `medium | hard | very-hard` → `{label, className}` styling (`:35-39`).
- Body uses `<Breadcrumb>` (`src/components/shared/Breadcrumb.tsx`) and `<SearchableGrid>` (`src/components/seo/SearchableGrid.tsx`) — no custom layout. Items are `{slug, title, description, href: /interviews/${slug}, badges: [DIFFICULTY_BADGE[c.difficulty]]}` (`:45-51`).

`src/app/interviews/loading.tsx:1-43` skeleton: header + search + 9-card grid (`sm:grid-cols-2 lg:grid-cols-3`).

### 6.2 `/interviews/[company]` — `src/app/interviews/[company]/page.tsx`

- `generateStaticParams` from all 15 `COMPANIES` (`:20-22`).
- Dynamic metadata builds OG image `/api/og?title=${name}+Interview+Prep&type=interview&difficulty=${difficulty}` (`:37`); description via `companyMetaDescription(name, focusAreas)`.
- JSON-LD: three structures rendered through `<JsonLd>` (`:111-141`):
  - `BreadcrumbList` (Home → Interviews → Company)
  - `LearningResource` keyed off `data.difficulty` (Intermediate vs Advanced)
  - `FAQPage` synthesized from `data.sampleQuestions` — answer is `"This is a common ${name} system design interview question. ${q.hint}"` (`:137-141`).
- Page sections (`:147-407`): hero with logo emoji + difficulty badge + average duration → interview style → numbered interview rounds → focus area pills → common topics 2-col grid → sample questions in `<details>` accordions → tips → related concepts (links to `/concepts/[slug]`) → CTA `Practice ${name} Interview Questions` linking to `/problems`.

### 6.3 Interview client components — `src/components/interview/`

Used inside the canvas/learning surfaces, not on the public `/interviews/*` routes. They are listed here because the directory falls in the documented scope. Sizes (lines, from `wc -l`):

| Component | LOC | Role |
|---|---|---|
| `ChallengeOverlay.tsx` | 1008 | Mock-interview overlay; requirement/checklist matchers re-exported via `checkRequirement`, `checkChecklistItem` |
| `SRSReviewSession.tsx` | 639 | Spaced-repetition review flow |
| `LearnMode.tsx` | 612 | Walkthrough framework with `WalkthroughAction`/`WalkthroughStep` |
| `AchievementGallery.tsx` | 483 | Achievement grid with rarity, category filters |
| `ProgressDashboard.tsx` | 478 | Per-user XP/streak + dimension bar charts |
| `LearningPathView.tsx` | 460 | Suggested learning sequence |
| `SRSDashboard.tsx` | 425 | SRS deck overview |
| `MockInterviewMode.tsx` | 385 | Interview with `<CountdownTimer>` (green/yellow/red/overtime, `src/components/interview/MockInterviewMode.tsx:24-43`); embeds `<DesignCanvas>` via `<ReactFlowProvider>` |
| `EstimationPad.tsx` | 339 | Back-of-envelope calculator |
| `DailyChallengeCard.tsx` | 313 | Daily challenge surface |
| `LeaderboardPanel.tsx` | 282 | Leaderboard list |
| `AchievementGrid.tsx` | 261 | Compact achievement grid |
| `AchievementToast.tsx` | 255 | Unlock toast |
| `SimulationScorePanel.tsx` | 215 | Per-simulation scoring breakdown |
| `ScoreDisplay.tsx` | 203 | Score readout |
| `ChallengeCard.tsx` | 194 | Challenge browse card |
| `StreakBadge.tsx` | 104 | Streak ribbon |
| `XPDisplay.tsx` | 87 | XP counter |

---

## 7. HLD problems index

### 7.1 `/problems` — `src/app/problems/page.tsx`

- Metadata at `:13-31`; declares "Practice 51 Interview Challenges"; no OG image override.
- Server-renders header + back-link + `<ProblemsListClient challenges={CHALLENGES}/>` (`:36-65`); `CHALLENGES` and `ALL_CATEGORIES` come from `@/lib/interview/challenges`.
- Header copy is dynamic: `${CHALLENGES.length} interview challenges across ${ALL_CATEGORIES.length} categories` (`:54-57`).

`src/app/problems/problems-list-client.tsx`:

- 5 categories: `classic | modern | infrastructure | advanced | lld` (`:10-16`); difficulties 1–5 (`:18`).
- Filter pipeline (`:34-57`): category exact match → difficulty exact match → text search across `title | description | concepts | companies`.
- Header has search input, category pill row, and 1–5 difficulty buttons.
- `ChallengeCard` (`:167-212`) shows category pill, 1–5 star rating, title, 2-line clamped description, time estimate, first 2 concept tags. Card links to `/problems/${challenge.id}`.

### 7.2 Other problem entry points

`/problems/[slug]` exists at `src/app/problems/[slug]/page.tsx` (the actual problem detail/canvas) but the LLD canvas behind it is documented in another codemap. The catalog browsing surface ends at the list above.

---

## 8. SEO

### 8.1 `<JsonLd />` — `src/components/seo/JsonLd.tsx`

Renders one or many `<script type="application/ld+json">` tags via `dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}` (`src/components/seo/JsonLd.tsx:31-39`). Comment at `:13-19` justifies the use of `dangerouslySetInnerHTML`: all data is server-side trusted. Keys are `jsonld-${@type}-${index}` (`:33`).

### 8.2 Generators — `src/lib/seo/json-ld.ts`

Site constants `SITE_URL = "https://architex.dev"`, `SITE_NAME = "Architex"` (`:3-4`). Generators:

- `generateCourseJsonLd` (`:48-63`) — `@type: Course`, `isAccessibleForFree: true`, `inLanguage: "en"`, provider org block.
- `generateLearningResourceJsonLd` (`:68-90`) — `@type: LearningResource`, defaults `educationalLevel: Intermediate`, `learningResourceType: Concept Explanation`. Optionally appends `keywords`, `datePublished`, `dateModified`.
- `generateBreadcrumbJsonLd` (`:95-108`) — `@type: BreadcrumbList` with `ListItem` rows.
- `generateFAQJsonLd` (`:113-126`) — `@type: FAQPage` mapping each `{question, answer}` to a `Question` + `Answer`.
- `generateDSJsonLd` (`:143-163`) — DS-specific `LearningResource`; `timeRequired: "PT15M"`, includes `teaches` field.
- `generateOrganizationJsonLd` (`:168-179`) — single Organization record; logo is `${SITE_URL}/logo.png` (note: this asset is not present in `public/`).

Output type `JsonLdObject` extends `{ "@context": "https://schema.org", "@type": string }` (`:37-41`).

### 8.3 Meta description templates — `src/lib/seo/meta-templates.ts`

All return strings truncated to `MAX_LENGTH = 160` via `truncate()` that ends at a word boundary (`:8-15`). Functions:

- `conceptMetaDescription(title, category, difficulty)` — `:20-29`
- `problemMetaDescription(title, companies)` — `:34-46`; "Asked at" only when companies array non-empty.
- `patternMetaDescription(title, category)` — `:51-59`
- `blogMetaDescription(title, tags)` — `:64-74`
- `companyMetaDescription(companyName, focusAreas)` — `:79-91`
- `lldProblemMetaDescription(title, keyPatterns)` — `:96-108`

### 8.4 Sitemap — `src/app/sitemap.ts`

Exports default `MetadataRoute.Sitemap` function (Next 16 file convention, `src/app/sitemap.ts:26-188`):

- Static fixtures at top (homepage `priority: 1.0`, then `/problems`, `/blog`, `/concepts`, `/lld-problems`, `/patterns`, `/interviews`, `/os`, `/algorithms` at `priority: 0.9`).

> **CORRECTION (2026-05-07):** Two of the static fixtures listed in the sitemap are dead (404) routes: **`/algorithms` (bare)** and **`/database` (bare)**. The Next.js `app/` directory only ships `/algorithms/[category]/[slug]/page.tsx` and `/database/[mode]/page.tsx` — there is no `app/algorithms/page.tsx` or `app/database/page.tsx`. The sitemap entry at `src/app/sitemap.ts:172-177` (`/algorithms`) thus advertises a 404 to crawlers. (Note: the doc as written is faithful to the sitemap source — this is not a doc bug, but is worth flagging here because the doc lists `/algorithms` without flagging that it 404s. Bare `/database` is not in the sitemap; bare `/os` IS in the sitemap and IS a real route via `src/app/os/page.tsx`.) Also note that `/ds/[slug]` entries are server-side redirects to `/#<slug>` rather than indexable pages — these are listed in the sitemap at priority 0.7 (`src/app/sitemap.ts:116-121`) but redirect on first hit. Source: file listing of `src/app/**/page.tsx` and `09-ui-tour.md` v2 §1A.
- Dynamic entries built from imported lists:
  - `CHALLENGES` → `/problems/${id}` (`priority: 0.8`, weekly)
  - `BLOG_POSTS` → `/blog/${slug}` (lastModified from `post.date`, `priority: 0.7`, monthly)
  - `CONCEPTS` → `/concepts/${slug}`, `LLD_PROBLEMS`, `DESIGN_PATTERNS`, `COMPANIES`
  - Hardcoded `osConcepts` array of 6 OS slugs (`:69-82`)
  - 13 algorithm category arrays flattened into `allAlgorithms` (`:93-114`); URL pattern `/algorithms/${categorySlug}/${id}`. `CATEGORY_SLUGS` map at `:83-91`.
  - `DS_CATALOG` → `/ds/${id}` (`:116-121`)

### 8.5 Robots — `src/app/robots.ts`

`disallow: ["/api/", "/dashboard", "/sign-in", "/sign-up", "/offline", "/team"]` (`:8`); sitemap pointer to `https://architex.dev/sitemap.xml` (`:10`).

### 8.6 OG image generation — `src/app/api/og/`

`src/app/api/og/route.tsx` is the universal OG generator (`runtime = "edge"`, `:11`):

- Eight content types — `concept | problem | pattern | blog | landing | pricing | interview | data-structure` (`TYPE_CONFIG`, `:17-26`).
- Five difficulty mappings (`DIFFICULTY_CONFIG`, `:28-35`); aliases `easy/intermediate/medium/advanced/hard` to color + label.
- DS-specific: 6 `DS_CATEGORY_COLORS` (`:42-49`), `complexity` query param parsed as `"Op:Val,Op:Val"` (`:78-86`) and rendered as up to 4 stat cards (`:381-428`).
- SSRF check on optional `avatar` param via `validateURL()` from `@/lib/security/ssrf` (`:65-72`); silently drops unsafe URLs.
- Truncates titles `> 80` chars to `slice(0, 77) + "..."` (`:88-89`); font sizes step down (`52 → 42 px`) when title `> 50` chars (`:260`).
- Output: 1200×630, `Cache-Control: public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400` (`:475-480`).
- Visual: gradient bg `linear-gradient(135deg, #1e1033 0%, #0f1729 40%, #0c1220 100%)` with grid overlay + two corner radial glows.

`src/app/api/og/database/route.tsx` is a database-mode-specific variant (`:1-287`):

- Pulls metadata from `getDatabaseModeBySlug(mode)` in `@/lib/seo/database-meta` (`:48-49`).
- Per-mode emoji + accent: `er-diagram | normalization | transaction-isolation | btree-index | hash-index | query-plans | lsm-tree` (`:17-42`).
- Same gradient/grid background pattern; emoji rendered via `emoji: "twemoji"` option (`:280`).
- URL footer reads `architex.dev/database/${mode}` (`:271`).

### 8.7 Page-level metadata patterns

Most public pages export a `metadata` object containing `title`, `description`, `openGraph` block (with OG image URL), and `twitter` card. Examples:

- `src/app/landing/page.tsx:10-37`
- `src/app/pricing/page.tsx:7-34`
- `src/app/blog/page.tsx:9-41` (adds `alternates.types` RSS pointer at `:36-40`)
- `src/app/blog/[slug]/page.tsx` — uses `generateMetadata` for dynamic per-post values
- `src/app/interviews/page.tsx:12-30`
- `src/app/interviews/[company]/page.tsx:29-57` — `generateMetadata` async
- `src/app/gallery/layout.tsx:3-10`
- `src/app/problems/page.tsx:13-31`
- `src/app/embed/lld/layout.tsx:9-12` — sets `robots: { index: false, follow: false }`

Root-level metadata in `src/app/layout.tsx:26-55`:

- `metadataBase` `process.env.NEXT_PUBLIC_APP_URL ?? "https://architex.dev"` (`:27`).
- Manifest pointer `/manifest.json` (`:30`).
- Apple Web App config: `capable: true`, `statusBarStyle: "black-translucent"`, `title: "Architex"` (`:35-39`).
- Default OG `/api/og?title=Architex` (`:47`).
- Viewport at `:57-62`: `viewportFit: "cover"`, `themeColor: "#6E56CF"`.

---

## 9. PWA

### 9.1 Manifest — `public/manifest.json`

```
name: "Architex — Interactive Engineering Laboratory"
short_name: "Architex"
start_url: "/"
display: "standalone"
background_color: "#0f1015"
theme_color: "#6E56CF"
icons: icon.svg (any), icon-192.png, icon-512.png, icon-maskable.png (purpose: maskable)
categories: ["education", "developer-tools"]
```

The PNG icons referenced (`icon-192.png`, `icon-512.png`, `icon-maskable.png`) are not present in `public/icons/` — only `icon.svg` exists. This will trigger 404s on install on browsers that prefer raster icons.

### 9.2 Service worker — `public/sw.js`

`SW_VERSION = '1.0.0'` (`:5`). Four named caches keyed off the version: `architex-shell-v1.0.0`, `architex-api-v1.0.0`, `architex-fonts-v1.0.0`, `architex-images-v1.0.0` (`:7-12`).

- **Install** (`:26-30`) — precaches `['/', '/offline.html']`.
- **Activate** (`:35-45`) — deletes any cache prefixed `architex-` not in the current `ALL_CACHES` list, then `clients.claim()`.
- **Fetch routing** (`:50-86`) — only handles GET, only http(s):
  - Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`, or any `.woff2?|.ttf|.otf|.eot`) → cache-first (`:124-130`)
  - Images (`.png|.jpe?g|.gif|.webp|.avif|.svg|.ico`) → cache-first with `IMAGE_CACHE_LIMIT = 60` and FIFO trim (`:132-134, :158-171, :213-221`)
  - API (`/api/`) → network-first, cache fallback (`:174-185`)
  - Navigation requests → network-first; on failure return cached `/offline.html` or text "Offline" 503 (`:202-209`)
  - Everything else → stale-while-revalidate (`:188-199`)
- **Push** (`:90-105`) — accepts JSON `{title, body, icon?, url?}`; default icon `/icons/icon-192.png`, vibrate pattern `[100, 50, 100]`, opens `data.url` on click.
- **Notification click** (`:107-111`) — `clients.openWindow(notification.data.url)`.
- **Skip waiting** (`:116-120`) — listens for `{type: "SKIP_WAITING"}` postMessage.

### 9.3 Registration — `src/lib/pwa/register-sw.ts`

`shouldRegister()` requires `'serviceWorker' in navigator` AND (`NODE_ENV === 'production'` OR `NEXT_PUBLIC_SW_ENABLED === 'true'`) (`:15-23`). On register:

- Polls `registration.update()` every 60 minutes (`:50-54`).
- Listens for `updatefound` → tracks `installing` worker state. Differentiates first-install vs update by checking `navigator.serviceWorker.controller` (`:67-78`).
- On `controllerchange`, hard-reloads via `window.location.reload()` (`:40-44`) — this triggers after a new SW takes control following a SKIP_WAITING.

### 9.4 Update toast — `src/components/pwa/UpdateToast.tsx`

Mounted in root layout at `src/app/layout.tsx:88`. Calls `registerServiceWorker({ onUpdate: setWaitingReg })` (`src/components/pwa/UpdateToast.tsx:16-21`); when a waiting registration appears, renders a fixed-bottom toast at `bottom-16` with download icon, "A new version of Architex is available" copy, "Reload" and "Later" buttons (`:35-78`). Reload posts `{type: "SKIP_WAITING"}` (`:25-29`).

### 9.5 Install prompt(s) — two variants

- `src/components/pwa/InstallPrompt.tsx` (mounted in root layout at `src/app/layout.tsx:87`):
  - Skips if `display-mode: standalone` matches (`:28`) or if dismissed-this-session (sessionStorage `architex-install-prompt-dismissed`, `:31`).
  - iOS detection via `/iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window)` (`:34-37`).
  - On non-iOS, listens for `beforeinstallprompt` and stashes the deferred event in a ref (`:45-51`).
  - On iOS, shows manual instructions ("tap Share then Add to Home Screen") with a share icon SVG (`:82-101`); on supporting browsers shows an "Install" button that calls `prompt.prompt()` (`:57-68`).
- `src/components/shared/install-prompt.tsx` is an alternate variant (visit-count gated):
  - Increments `architex-visit-count` localStorage on every mount (`:21-23`); requires `MIN_VISITS = 2` before showing (`:30-33`).
  - Dismissal stored in `architex-install-dismissed` for `DISMISS_DURATION_MS = 7 days` (`:6-8, :60-63`).
  - Not iOS-aware — only listens for `beforeinstallprompt`.
  - Currently not mounted from the root layout (the `pwa/InstallPrompt` is the active one).

### 9.6 Offline fallbacks

- `public/offline.html` (`:1-203`) — fully self-contained HTML+CSS, no JS (apart from a `Retry connection` button calling `window.location.reload()`, `:194`). This is the file the SW serves on navigation failures.
- `src/app/offline/page.tsx:1-12` — minimal Next route that says "You're offline". Excluded from sitemap and disallowed in robots (`src/app/robots.ts:8`).

---

## 10. Mobile

### 10.1 `src/components/mobile/`

All components are `"use client"`.

- `BottomSheet.tsx` (`src/components/mobile/BottomSheet.tsx:51-141`) — drag-to-snap sheet with three points: `collapsed (8%)`, `half (50%)`, `full (92%)` (`:18-22`). `closestSnap()` picks nearest target on drag end (`:26-37`). Velocity flick > 500 px/s on collapsed dismisses (`:88-92`); below half the collapsed threshold also dismisses (`:83-87`). Backdrop is `bg-black/50 backdrop-blur-sm` with click-to-close (`:104-111`). Content area has `pb-[env(safe-area-inset-bottom)]` (`:133`).
- `FloatingActionButton.tsx` (`src/components/mobile/FloatingActionButton.tsx:63-123`) — `fixed bottom-20 right-4 z-40 ... md:hidden` (`:79`). Four actions defined inline in `useFabActions()` (`:25-58`): `Add Node` (toggles sidebar), `Templates` (opens template gallery), `Simulate` (toggles bottom panel), `Export` (opens export dialog). All wired through `useUIStore`. Main FAB rotates 45° when expanded (`:113-115`).
- `LongPressMenu.tsx` (`src/components/mobile/LongPressMenu.tsx:53-198`) — long-press touch handler with `pressDelay = 500ms`. Move > 10 px cancels (`:108-118`). On trigger fires `navigator.vibrate(15)` haptic (`:45-49`), positions menu within viewport with 8 px clamp (`:94-101`). Four `LongPressAction`s: `edit | duplicate | delete | connect`. Click-outside listener attached after 50 ms delay to avoid same-touch close (`:138-141`).
- `MobileAdvisory.tsx` (`src/components/mobile/MobileAdvisory.tsx:15-71`) — top banner shown once on mobile via `useIsMobile()`; localStorage key `architex_mobile_advisory_dismissed` (`:9, :22-29`). Body: "For the best experience, try desktop for complex diagrams". Mounted at `src/components/shared/workspace-layout.tsx:80`.
- `MobileCommandPalette.tsx` (`src/components/mobile/MobileCommandPalette.tsx:28-132`) — full-screen `cmdk` palette using `useUIStore` `commandPaletteOpen` state. Focus-trap via `useFocusTrap` hook (`:37-40`). Group headings rendered via `Command.Group heading={group}`. Touch targets `min-h-[48px]` (`:117`).
- `PropertiesSheet.tsx` (`src/components/mobile/PropertiesSheet.tsx:109-251`) — wraps `<BottomSheet>` showing the selected node's config + metrics. `MobileConfigField` (`:29-100`) renders boolean toggles with `h-7 w-12` switch, `select` with `h-11`, `text/number` inputs with `h-11`. `SELECT_FIELDS` map (`:11-17`) hardcodes options for `algorithm`, `type`, `evictionPolicy`, `consistencyLevel`, `authType`. Mounted at `src/components/shared/workspace-layout.tsx:93`.
- `SafeAreaView.tsx` (`src/components/mobile/SafeAreaView.tsx:29-63`) — wraps children with `env(safe-area-inset-*)` padding through `useSafeAreaInsets()`. `edges` prop accepts `"all" | "top" | "bottom" | "both" | SafeAreaEdge[]` (`:11-25`). Padding only applied when inset > 0.

### 10.2 Viewport handling

`src/app/layout.tsx:57-62`:

```
viewport: {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",  // enables env(safe-area-inset-*)
  themeColor: "#6E56CF",
}
```

Embed layout overrides this with a simpler viewport at `src/app/embed/lld/layout.tsx:14-17` (no `viewportFit`).

### 10.3 Mobile-aware logic outside `mobile/`

- `MobileAdvisory`, `PropertiesSheet`, and `FloatingActionButton` are mounted in `src/components/shared/workspace-layout.tsx:80,93,96` — these are inside the canvas workspace, not on the public marketing surfaces.
- `LandingPage.tsx` has a `MobileNav` component (`src/components/landing/LandingPage.tsx:300-395`) inline; this is its own implementation, not from `components/mobile/`.

---

## 11. Analytics

### 11.1 Provider — `src/components/providers/AnalyticsProvider.tsx`

Mounted in root layout (`src/app/layout.tsx:81-91`). Initializes PostHog through `initPostHog()` from `src/lib/analytics/posthog.ts:66-74`. Currently the call is the no-op fallback unless `NEXT_PUBLIC_POSTHOG_KEY` is set — and even then the actual SDK import at `src/components/providers/AnalyticsProvider.tsx:86-91` is commented out as a TODO. Exposes a context with `track | identify | reset | page | featureFlag | optIn | optOut | hasOptedOut | isReady`.

### 11.2 Analytics abstraction — `src/lib/analytics/`

Two layers:

- `analytics.ts` — provider-pattern abstraction. `AnalyticsProvider` interface (`:31-43`), `PostHogProvider` (`:55-83`, dev-logs only), `NoOpProvider` (`:91-104`), `Analytics` singleton (`:108-143`).
- `posthog.ts` — direct PostHog client wrapper used by `AnalyticsProvider`. Exports `track`, `identify`, `reset`, `page`, `featureFlag`, `getFeatureFlagValue`, `onFeatureFlags`, `optIn`, `optOut`, `hasOptedOut`, `isPostHogReady`. Internal state `_client | _enabled | _optedOut` (`:45-50`). `isDev` dev-time logging uses `console.log('[PostHog:method]', ...)`.

### 11.3 Event catalog

Two enums exist (separate but overlapping):

`AnalyticsEvent` in `src/lib/analytics/analytics.ts:10-24`:
- `module_viewed`, `challenge_started`, `challenge_completed`, `template_loaded`, `simulation_run`, `export_triggered`, `algorithm_played`, `data_structure_explored`, `search_performed`, `theme_changed`, `error_boundary_hit`, `consent_granted`, `consent_revoked`

`PostHogEvent` in `src/lib/analytics/posthog.ts:12-26`:
- `page_view`, `simulation_started`, `simulation_completed`, `chaos_injected`, `template_loaded`, `design_exported`, `ai_feature_used`, `bridge_crossed`, `challenge_attempted`, `challenge_completed`, `upgrade_prompted`, `upgrade_clicked`

Per-domain catalog in `src/lib/analytics/lld-events.ts` (referenced via tests at `src/lib/analytics/__tests__/lld-events-drill.test.ts`).

### 11.4 Web vitals — `src/lib/analytics/web-vitals.ts`

- `WebVitalName = 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB'` (`:12`).
- `WEB_VITAL_THRESHOLDS` table (`:33-42`):
  - LCP: good 2000 ms, poor 4000 ms
  - INP: good 150 ms, poor 500 ms
  - CLS: good 0.05, poor 0.25
  - FCP: good 1800 ms, poor 3000 ms
  - TTFB: good 800 ms, poor 1800 ms
- `rateMetric()` (`:52-60`) returns `'good' | 'needs-improvement' | 'poor'`.
- `reportWebVitals()` (`:75-95`) routes through `analytics.track(AnalyticsEvent.SIMULATION_RUN, { metric_name, metric_value, metric_rating, metric_id, navigation_type, category: 'web_vitals' })`. Note the misuse of `SIMULATION_RUN` for web-vitals events — this is the only way to surface them given the current event enum. Dev mode `console.warn`s for any non-`good` rating.
- `observeWebVitals()` (`:107-179`) is a no-deps `PerformanceObserver` wrapper covering FCP, LCP, and TTFB only. INP and CLS require the `web-vitals` npm package, which is not installed; the comment at `:101-105` flags this.

### 11.5 Consent — `src/lib/analytics/consent.ts`

- `ConsentPreferences` `{essential: true, analytics: boolean, preferences: boolean}` (`:10-19`); essential is always true.
- Storage key `architex_consent` (`:21`); `getStoredConsent()`, `storeConsent()`, `clearConsent()` (`:52-96`).
- DNT detection in `isDNTEnabled()` (`:34-44`): checks `navigator.doNotTrack`, then legacy `window.doNotTrack`. Returns true on `'1'` or `'yes'`.
- `hasAnalyticsConsent()` (`:114-118`) — DNT short-circuits to `false` regardless of stored preference.
- `acceptAll()`/`declineAll()` (`:101-108`).

### 11.6 Consent banner — `src/components/analytics/ConsentBanner.tsx`

Bottom-pinned `role="dialog"` (`:88-94`); fixed inset-x-0 bottom-0, z-50, backdrop-blur. On mount checks `getStoredConsent()`; if present, applies it silently — only shows on first visit (`:39-49`).

`applyConsent` (`:52-58`) gates analytics: only `analytics.init(new PostHogProvider())` if `consent.analytics && !isDNTEnabled()`; otherwise `NoOpProvider`. Three CTAs: `Decline`, `Manage Preferences`, `Accept`. Manage panel has Essential (forced on/disabled), Analytics, Preferences toggles + a `Save Preferences` confirm button.

The `ConsentBanner` is not mounted in the root layout — `src/app/layout.tsx` does not import it. It is exported but not wired in. (Search for `ConsentBanner` returns only its own file and one comment in `consent.ts`.)

### 11.7 Other analytics helpers

- `src/lib/analytics/error-tracking.ts` — error reporter (referenced by `ErrorBoundary` in `src/components/shared/ErrorBoundary.tsx`).
- `src/lib/analytics/lld-events.ts` — LLD-specific event catalog.
- `src/lib/analytics/__tests__/` — three Vitest files: `consent.test.ts`, `lld-events-drill.test.ts`, `pii-scrubbing.test.ts`.

---

## 12. Build configuration

### 12.1 `next.config.ts`

`src/Users/.../next.config.ts:1-37` (root path: `next.config.ts`):

- `output: "standalone"` (`:5`) — produces `.next/standalone/server.js` for the Docker runner.
- `headers()` (`:6-29`) injects security headers on every route:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- Bundle analyzer wraps the config: `withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" })` (`:32-36`). Toggled via `pnpm analyze` script.
- No custom redirects, no MDX plugin (despite MDX deps in package.json), no image config block, no experimental flags.

### 12.2 `tsconfig.json`

`tsconfig.json:1-47`:

- `target: ES2017`, `lib: dom, dom.iterable, esnext` (`:3-9`).
- `strict: true`, `noEmit: true`, `module: esnext`, `moduleResolution: "bundler"`, `allowImportingTsExtensions: true`, `isolatedModules: true`, `jsx: "react-jsx"`, `incremental: true`.
- Next plugin: `plugins: [{ name: "next" }]` (`:21-25`).
- Path alias: `"@/*": ["./src/*"]` (`:26-30`).
- `include` covers `**/*.ts`, `**/*.tsx`, `.next/types/**/*.ts`, `.next/dev/types/**/*.ts`, `**/*.mts`, `.next/dev/dev/types/**/*.ts` (`:32-39`).
- `exclude` strips `e2e`, `playwright.config.ts`, `**/*.stories.tsx` (`:41-46`) — the e2e suite type-checks under Playwright's own config.

### 12.3 `eslint.config.mjs`

Flat config (`:1-19`); composes `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`. Overrides default ignores so only `.next/`, `out/`, `build/`, and `next-env.d.ts` are skipped (`:8-15`).

### 12.4 `postcss.config.mjs`

Tailwind v4 — only plugin is `@tailwindcss/postcss` (`:1-7`). No autoprefixer (Tailwind v4 includes it).

### 12.5 `vitest.config.ts`

`:1-15`:
- `globals: true`, `environment: 'jsdom'`
- `setupFiles: ['./src/__tests__/setup.ts']`
- `include: ['src/**/*.test.{ts,tsx}']` — confined to `src/`
- Path alias `@` → `./src` (`:11-13`).

### 12.6 `playwright.config.ts`

`:1-9`:
- `testDir: './e2e'`
- `fullyParallel: true`, `retries: 1`
- `baseURL: http://localhost:3000`, `trace: 'on-first-retry'`
- `webServer: { command: 'pnpm dev', port: 3000, reuseExistingServer: true }` — reuses an already-running dev server when present.

### 12.7 `.size-limit.json`

`:1-21` — three bundle budgets, all gzipped:
- `Main bundle` (`.next/static/chunks/main-*.js`) — 250 KB
- `Framework bundle` (`.next/static/chunks/framework-*.js`) — 250 KB
- `Page chunks` (`.next/static/chunks/app/**/page-*.js`) — 100 KB

### 12.8 Tailwind v4 config

There is no `tailwind.config.{js,ts}`. Tailwind v4 uses CSS-first config: tokens declared in `src/app/globals.css` (referenced by `.storybook/preview.ts:1`).

---

## 13. CI/CD

### 13.1 `vercel.json`

`vercel.json:1-46`:
- `buildCommand: "pnpm build"`, `outputDirectory: ".next"`, `framework: "nextjs"`, `installCommand: "pnpm install --frozen-lockfile"`.
- Auto-deploy enabled for `main` and preview deploys (`:7-12`).
- Header overrides at the edge:
  - `/fonts/(.*)` → `Cache-Control: public, max-age=31536000, immutable` (`:14-22`)
  - `/(.*)` repeats `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy` (duplicates of `next.config.ts` headers — defense-in-depth).
- Note: `Strict-Transport-Security` and `Permissions-Policy` are NOT in `vercel.json`; only present from `next.config.ts`.

### 13.2 GitHub workflows — `.github/workflows/`

`ci.yml` (`:1-112`):
- Triggers: push to `main`, PR to `main`. Concurrency cancels in-progress runs (`:9-11`).
- Three jobs, all on `ubuntu-latest`, matrix `node-version: [20, 22]`:
  - `quality`: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck` (`:14-44`).
  - `test`: depends on `quality`; `pnpm test:run` (`:46-76`).
  - `build`: depends on `quality`; `pnpm build` with `NEXT_TELEMETRY_DISABLED=1` (`:78-111`).
- pnpm store cached via `pnpm store path` keyed by `node-version` and `pnpm-lock.yaml` hash.

`bundle-size.yml` (`:1-26`):
- Runs on PRs to `main`. Builds, then `andresz1/size-limit-action@v1` with `skip_step: build`.

`dependency-audit.yml` (`:1-69`):
- Cron `0 2 * * 0` (Sunday 02:00 UTC) + `workflow_dispatch`.
- `pnpm audit --audit-level=high`; on non-zero exit creates an issue titled `🔒 Dependency audit: high-severity vulnerabilities found ({date})` with the audit body fenced and labels `security, dependencies`.

`lighthouse-ci.yml` (`:1-97`):
- Runs on PRs to `main`. Builds, starts `pnpm start` in background, retries `/api/health` until ready (`:30-33`).
- `treosh/lighthouse-ci-action@v12` with assertions: `performance >= 0.9`, `accessibility >= 0.95`, `best-practices >= 0.9`, `seo >= 0.9` (`:43-55`).
- Posts a comment on the PR with a 4-row score table (`🟢/🟠/🔴` based on >= 0.9 / >= 0.5) and a link to the public storage report (`:65-96`). Artifacts retained 14 days.

### 13.3 Other `.github/` config

- `branch-protection.md` — documentation, not enforced; describes recommended protection rules and required checks (`quality`, `test`, `build`).
- `PULL_REQUEST_TEMPLATE.md` — checklist with `pnpm typecheck`, `pnpm lint`, no `console.log`.
- `ISSUE_TEMPLATE/` — five issue forms: `bug_report.yml`, `feature_request.yml`, `new_algorithm.yml`, `new_data_structure.yml`, `new_template.yml`.

### 13.4 Dockerfile — `Dockerfile`

Multi-stage build (`:1-40`):

- Stage 1 `deps` (`:1-6`): `node:22-alpine`, enables corepack, `pnpm install --frozen-lockfile`.
- Stage 2 `build` (`:9-15`): copies `node_modules` from `deps`, copies source, `NEXT_TELEMETRY_DISABLED=1`, `pnpm build`.
- Stage 3 `runner` (`:18-40`): `node:22-alpine`. `NODE_ENV=production`, `PORT=3000`, `HOSTNAME=0.0.0.0`. Creates `nextjs:nodejs` system user (uid/gid 1001). Copies `public/`, `.next/standalone`, `.next/static`. Runs as `nextjs`. `EXPOSE 3000`. `HEALTHCHECK --interval=30s --timeout=10s` against `/api/health`. `CMD ["node", "server.js"]` (the standalone output).

### 13.5 docker-compose.yml

Local dev profile (`:1-49`):
- `app` service builds `target: deps` (no full build), runs `corepack enable && pnpm dev`. Mounts `.:/app` with a `node_modules` volume override (`:10-12`). Reads `.env.local`, hardcodes `DATABASE_URL=postgresql://architex:architex@postgres:5432/architex` (`:18`).
- `postgres` service: `postgres:16-alpine`, exposes 5432. User/password/db all `architex` (`:25-32`). Healthcheck `pg_isready -U architex -d architex`. Persists to `pgdata` named volume (`:43-44`).
- Network `architex` (`:46-49`).

### 13.6 `.dockerignore`

`:1-13` — excludes `node_modules`, `.next`, `.git`, env files except `.env.example`, all `*.md`, `.storybook`, `e2e`, `coverage`, `.lighthouseci`, `.DS_Store`.

---

## 14. E2E suite

`e2e/` has 6 specs, all using `@playwright/test` against `baseURL: http://localhost:3000`:

- `algorithm-run.spec.ts` (`:1-35`) — switches to Algorithms module, selects Bubble Sort, generates random data, clicks Run, asserts SVG bars or `[class*="rounded-t"]` are visible within 5 s.
- `command-palette.spec.ts` (`:1-27`) — opens with `Cmd+K`, filters to `export`, asserts "Export Diagram" item visible, closes with `Escape`.
- `keyboard-shortcuts.spec.ts` (`:1-38`) — two tests: `Cmd+B` toggles `aside[aria-label="Component palette"]` visibility; `?` opens the keyboard shortcuts dialog showing "Open command palette" / "Toggle sidebar" rows.
- `lld-drill-mode.spec.ts` (`:1-36`) — Phase 4 drill-mode smoke. Restricted to chromium for CI time. Two placeholder cases that just assert `/drill mode/i` text appears at `/modules/lld?mode=drill`. Comment notes `window.__testDropClass / __testConnect` helpers are unimplemented (`:11-13`).

> **CORRECTION (2026-05-07):** This e2e spec navigates to `/modules/lld?mode=drill`, but **that route does not exist**. `src/app/modules/` only contains `page.tsx` (the catalog grid), `layout.tsx`, and `loading.tsx` — there is no `[id]` segment under `/modules/`, so `/modules/lld` is a Next.js 404. The spec is currently passing only because the empty-state placeholder text "drill mode" matches the regex `/drill mode/i` somewhere on the 404 fallback or the SPA at `/` post-Clerk-redirect — it is not actually exercising the LLD drill-mode workflow. The correct deep-link to LLD drill mode today is `/?lld=problem:<id>&mode=drill` (per `09-ui-tour.md` v2 §1B and `useLLDModuleImpl.tsx:265` + `useLLDModeSync.ts`). The spec needs to be rewritten against the real URL contract. Source: file listing of `src/app/modules/` and `09-ui-tour.md` v2 §1B.
- `module-switching.spec.ts` (`:1-27`) — parameterized across 5 modules (System Design, Algorithms, Data Structures, Low-Level Design, Database); clicks each activity-bar button and asserts the status-bar text updates.
- `template-load.spec.ts` (`:1-27`) — opens template gallery with `Cmd+T`, clicks first template card (`button.group`), asserts the gallery closes and the status bar no longer reports `0 nodes`.

The suite has no auth fixtures and no test database — it relies on the dev server's keyless mode (`src/app/layout.tsx:14-24` makes Clerk optional based on `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`).

---

## 15. Storybook

### 15.1 Config

`.storybook/main.ts:1-8`:
- `stories: ['../src/**/*.stories.@(ts|tsx)']`
- `addons: ['@storybook/addon-essentials', '@storybook/addon-interactions']`
- `framework: { name: '@storybook/nextjs', options: {} }`
- `staticDirs: ['../public']` — so the manifest, icons, and SW are reachable.

`.storybook/preview.ts:1-7`:
- Imports `../src/app/globals.css` (Tailwind v4 + design tokens).
- Default background dark `#0f1015`.

### 15.2 Catalogued stories

Five stories total, all under `src/components/`:

- `src/components/canvas/nodes/system-design/BaseNode.stories.tsx` — system design canvas node states.
- `src/components/shared/activity-bar.stories.tsx` — left sidebar activity bar.
- `src/components/ui/badge.stories.tsx` — shadcn-style badge variants (`badge.tsx` uses `cva` with `border-transparent bg-primary text-primary-foreground` defaults).
- `src/components/ui/button.stories.tsx` — button variants (`button.tsx` uses `cva` + Radix `<Slot>` for `asChild` support).
- `src/components/ui/toast.stories.tsx` — toast variants.

The bulk of the design system (interview, mobile, gallery, landing, modules subtrees) is not Storybook-catalogued.

---

## 16. Quirks

- **OG asset cache divergence** — `vercel.json:14-22` caches `/fonts/*` immutably for one year; OG images (`/api/og*`) carry their own `Cache-Control` from the route handler (`max-age=86400, s-maxage=604800, stale-while-revalidate=86400`). RSS feed uses a third pattern: `s-maxage=3600, stale-while-revalidate` (`src/app/blog/feed.xml/route.ts:42`).
- **Two install-prompt implementations** — `src/components/pwa/InstallPrompt.tsx` (active, mounted in root layout) and `src/components/shared/install-prompt.tsx` (orphan, visit-count gated, never imported elsewhere). Risk: duplicate code drift.
- **Two analytics event enums** — `AnalyticsEvent` (`src/lib/analytics/analytics.ts:10-24`) and `PostHogEvent` (`src/lib/analytics/posthog.ts:12-26`). They overlap on `template_loaded`/`TEMPLATE_LOADED` and `challenge_completed`/`CHALLENGE_COMPLETED` but are not aligned. `web-vitals.ts` reuses `AnalyticsEvent.SIMULATION_RUN` for vital reports because there is no `WEB_VITAL_METRIC` event.
- **`ConsentBanner` exported but not mounted** — `src/components/analytics/ConsentBanner.tsx` is fully implemented and tested, but is not imported by `src/app/layout.tsx`. As a result, every visitor implicitly runs the `NoOpProvider` (which is the analytics init default at `src/lib/analytics/analytics.ts:109`).
- **Mock gallery only** — `/gallery` is mock-data-only despite having a complete Drizzle schema (`gallerySubmissions`, `galleryUpvotes`) ready for real submissions.
- **Hand-rolled markdown** — `/blog/[slug]` uses a tiny inline parser (`src/app/blog/[slug]/page.tsx:58-134`) supporting only headings + inline links. Code fences, lists, bold, italic, and images are silently dropped.
- **MDX deps unused** — `@mdx-js/mdx`, `@mdx-js/react`, `remark-gfm`, `gray-matter` are in `package.json:39-77` but no MDX route is wired. They are likely held for `scripts/compile-lld-lessons.ts` and future use.
- **oEmbed origin mismatch** — `src/app/api/oembed/route.ts:15` declares `PROVIDER_URL = 'https://architex.app'`, while every other public surface (sitemap, OG, JSON-LD, Twitter/OG metadata) uses `architex.dev`. This will break oEmbed expansion for any link served from `architex.dev`.
- **Manifest icons missing** — `public/manifest.json:11-18` references `/icons/icon-192.png`, `icon-512.png`, `icon-maskable.png` but `public/icons/` only contains `icon.svg`. PWA install will fall back to the SVG on browsers that accept it.
- **No `apple-touch-icon`** — root layout sets `icons.apple = "/icons/icon.svg"` (`src/app/layout.tsx:33`), but iOS Safari typically requires a 180×180 PNG. The SVG fallback works on newer iOS but degrades on older versions.
- **CSP exists but is report-only** — `src/middleware.ts:166-167` sets `Content-Security-Policy-Report-Only` with `report-uri /api/csp-report` (`src/app/api/csp-report/route.ts`). Production CSP is not enforcing.
- **Embed routes excluded from indexing** — `src/app/embed/lld/layout.tsx:11` sets `robots: { index: false, follow: false }`. Algorithm embed (`src/app/embed/algorithms/[slug]/page.tsx`) does not — it would be indexed unless `/api/` exclusion catches it (it doesn't, since the path is `/embed/...`).
- **Standalone build path coupling** — `Dockerfile:30-31` relies on `output: "standalone"` from `next.config.ts:5` to produce `.next/standalone/server.js` and `.next/static`. Removing `output: standalone` would break the Docker build silently.
- **`tsconfig.json` excludes `.stories.tsx`** but Storybook still type-checks them at runtime via `@storybook/nextjs`.
- **Sitemap omits the `/landing` route** — the homepage entry is `https://architex.dev` (`src/app/sitemap.ts:124-128`); `/landing` is not listed even though it's the primary marketing page. Robots also doesn't disallow it.
- **`ScrollReveal` is unused on the landing page** — `src/components/landing/LandingPage.tsx` uses an inline `Section` wrapper (`:79-103`) with `useInView`/`motion.section` instead of `<ScrollReveal>`. The component is built but not consumed.
- **Lighthouse CI runs `pnpm start`, not the Docker image** — workflow at `.github/workflows/lighthouse-ci.yml:30-33` does `pnpm start &` after `pnpm build`. This tests the Next runtime, not the standalone server that production actually runs.
- **`next.config.ts` headers vs `vercel.json` headers** — there is overlap (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`) and divergence (`Strict-Transport-Security` and `Permissions-Policy` only in `next.config.ts`; cache-control for `/fonts/*` only in `vercel.json`). Any CDN deployment that bypasses `next.config.ts` headers (e.g. static export) loses HSTS.
- **Two sets of `useUIStore` toggles for the FAB** — `FloatingActionButton.tsx` calls `useUIStore.getState().toggleSidebar()` for `add-node` (sidebar = component palette), but template gallery uses the hooked `setTemplateGalleryOpen` selector. Inconsistent access pattern.
- **`SearchableGrid` shared shape** — `src/components/seo/SearchableGrid.tsx` is reused by `/interviews` and could be reused by other catalogue surfaces, but `/problems` (`src/app/problems/problems-list-client.tsx`) re-implements its own filter UI rather than adapting it.
- **`/blog/loading.tsx` grid mismatch** — skeleton uses `lg:grid-cols-3` (`:18`) but `BlogPostFilters` renders `sm:grid-cols-2` (`src/app/blog/BlogPostFilters.tsx:210`). The skeleton looks more dense than the loaded page.
- **`PRICING_TIERS` has `pro.popular = true`** but landing block highlights and pricing card both add their own visual weight; if `popular` flag is duplicated for student tier, both badges will render.
- **Embed page link inconsistency** — `EmbedUMLCanvas` links back to `https://architex.dev${linkHref}` (`src/app/embed/lld/_components/EmbedUMLCanvas.tsx:131`); algorithm embed links to `/algorithms/${category}/${id}` (relative, `src/app/embed/algorithms/[slug]/page.tsx:32`). Inconsistent.

---

## 17. Open questions

1. Is `ConsentBanner` deliberately not mounted, pending GDPR/CCPA scoping, or is it an integration miss? `src/app/layout.tsx` does not import it; analytics defaults to NoOp until something explicitly upgrades the provider.
2. Should `/api/oembed` validate `architex.dev` as well as `architex.app`? Currently only `architex.app | www.architex.app | localhost` are accepted (`src/app/api/oembed/route.ts:75-87`).
3. Are the missing PWA icons (`icon-192.png`, `icon-512.png`, `icon-maskable.png`) meant to be generated from `icon.svg` at build time, or are they expected raster assets that simply have not been committed?
4. The sitemap lists `/algorithms/*` for 13 category arrays, but only 7 categories appear in `CATEGORY_SLUGS` (`src/app/sitemap.ts:83-91`). Algorithms outside those 7 categories will get URL `/algorithms/${algo.category}/${algo.id}` with the raw category — unsure if that matches the routing.
5. `/embed/algorithms/[slug]` does not declare `robots: noindex`. Should it?
6. Is there a planned migration from the inline `MOCK_GALLERY` to the `gallerySubmissions` table? The schema is ready; the UI is not wired.
7. The blog markdown renderer drops code blocks, lists, bold, and italic. Are blog posts deliberately constrained to plain prose + headings + links, or is there a richer renderer planned (perhaps via `remark-gfm` already in deps)?
8. `src/components/shared/install-prompt.tsx` (the visit-count variant) — is it dead code or a planned replacement for `src/components/pwa/InstallPrompt.tsx`?
9. Why is `Strict-Transport-Security` only set in `next.config.ts` and not also in `vercel.json`? On any non-Vercel CDN that serves `.next/standalone` directly, both header sources are the same Node runtime, so it's fine; on edge configurations that pre-set headers via `vercel.json`, HSTS could be missing.
10. `dependencyAudit.yml` runs weekly but only on `--audit-level=high`. Are moderate-severity issues tracked elsewhere or accepted?
11. The Lighthouse CI threshold is `performance >= 0.9` against just the homepage `http://localhost:3000`. Should `/landing`, `/pricing`, `/blog`, and `/interviews/[company]` also be in the URL list to enforce SEO scores on the surfaces that actually face search engines?
12. `src/app/api/og/route.tsx:11` declares `runtime = "edge"` — does this hold on the Docker `node:22-alpine` runner, or is OG generation Vercel-only? (`output: "standalone"` typically downgrades edge routes to Node.)
