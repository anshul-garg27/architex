# PHASE 9: LANDING PAGE, SEO, CONTENT & LAUNCH

> **Goal:** Build the landing page, generate 270+ programmatic SEO pages, create the onboarding flow, documentation site, blog with seed articles, newsletter system, and execute the launch strategy across Product Hunt and Hacker News. Open source the core under AGPL-3.0.

---

## WHAT YOU ARE BUILDING

This phase is the go-to-market engine. A high-converting landing page (targeting 8%+ signup rate), 270+ SEO pages that rank for every system design keyword, an onboarding flow that gets users to their first "aha" moment in 90 seconds, and coordinated launches on Product Hunt and Hacker News. This phase transforms Architex from a product into a brand.

---

## 1. LANDING PAGE

### Design Direction

From research/22-landing-page-design.md: **"Linear-style dark theme + Stripe-level animation polish + Excalidraw's product-as-hero philosophy"**

### Color System

```css
/* Landing page specific tokens (extends main design system) */
:root {
  --landing-bg:          #0A0A0F;
  --landing-surface:     #141419;
  --landing-border:      #1E1E2A;
  --landing-text:        #F4F4F5;
  --landing-text-muted:  #94A3B8;
  --landing-accent:      #6366F1;
  --landing-accent-glow: linear-gradient(135deg, #6366F1, #8B5CF6, #A78BFA);
  --landing-success:     #22C55E;
  --landing-warning:     #F59E0B;
}
```

### Typography

```css
/* Headlines: Plus Jakarta Sans or Inter Display */
.landing-hero-title {
  font-family: 'Inter Display', 'Plus Jakarta Sans', sans-serif;
  font-size: clamp(36px, 5vw, 72px);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #F4F4F5 0%, #94A3B8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Body: Inter 16-18px */
.landing-body {
  font-family: 'Inter', sans-serif;
  font-size: clamp(16px, 1.2vw, 18px);
  line-height: 1.6;
  color: var(--landing-text-muted);
}

/* Code: JetBrains Mono 14-16px */
.landing-code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
}
```

### Section 1: Sticky Navigation (Frosted Glass)

```typescript
// app/(marketing)/components/Navbar.tsx
function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav className={cn(
      "fixed top-0 w-full z-50 transition-all duration-300",
      scrolled
        ? "bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-[#1E1E2A]"
        : "bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Logo />
        <div className="hidden md:flex items-center gap-8">
          <NavLink href="#product">Product</NavLink>
          <NavLink href="#features">Features</NavLink>
          <NavLink href="#pricing">Pricing</NavLink>
          <NavLink href="/docs">Docs</NavLink>
          <NavLink href="/blog">Blog</NavLink>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600" asChild>
            <Link href="/sign-up">Start Free</Link>
          </Button>
        </div>
        {/* Mobile: hamburger menu */}
        <MobileMenu className="md:hidden" />
      </div>
    </nav>
  );
}
```

### Section 2: Hero

```typescript
// app/(marketing)/components/Hero.tsx
function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Animated gradient mesh background (WebGL) */}
      <GradientMeshBackground />

      {/* Headline */}
      <h1 className="landing-hero-title text-center max-w-4xl">
        Design Systems. Visualize Algorithms. Ace Interviews.
      </h1>

      {/* Subheadline */}
      <p className="landing-body text-center max-w-2xl mt-6">
        The interactive simulator where you build, break, and master
        distributed systems — not just read about them.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-4 mt-10">
        <Button
          size="lg"
          className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-8 py-4 text-lg rounded-xl hover:scale-[1.02] transition-transform"
          asChild
        >
          <Link href="/sign-up">Start Practicing Free</Link>
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="border-[#2E2F35] text-[#F4F4F5] px-8 py-4 text-lg rounded-xl"
          asChild
        >
          <Link href="#demo">Watch Demo</Link>
        </Button>
      </div>

      {/* Live mini-simulator (product IS the hero) */}
      <div className="mt-16 w-full max-w-5xl rounded-2xl border border-[#1E1E2A] overflow-hidden shadow-2xl">
        <MiniSimulator />
        {/* Embedded interactive demo:
            - Pre-loaded URL shortener diagram
            - Nodes appearing with entrance animation
            - Data flow particles moving along edges
            - Responsive: scales to container width
            - Lazy loaded: IntersectionObserver triggers */}
      </div>
    </section>
  );
}

// Gradient mesh background (Stripe-style WebGL)
// - <10KB JavaScript
// - 60fps smooth gradient animation
// - Uses a simplified WebGL shader or canvas gradient animation
// - Colors: indigo -> purple -> blue, subtle movement
// - Falls back to CSS gradient on low-power devices
```

### Section 3: Trust Bar

```typescript
// app/(marketing)/components/TrustBar.tsx
function TrustBar() {
  return (
    <section className="py-12 border-y border-[#1E1E2A]">
      <p className="text-center text-sm text-[#64748B] mb-8">
        Engineers from these companies practice on Architex
      </p>
      <div className="overflow-hidden">
        {/* Auto-scrolling logos: CSS animation, no JS */}
        <div className="flex animate-scroll gap-16 items-center">
          {COMPANY_LOGOS.map(logo => (
            <img
              key={logo.name}
              src={logo.src}
              alt={logo.name}
              className="h-8 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all"
            />
          ))}
          {/* Duplicate for seamless loop */}
          {COMPANY_LOGOS.map(logo => (
            <img key={`dup-${logo.name}`} src={logo.src} alt="" className="h-8 opacity-40 grayscale" aria-hidden />
          ))}
        </div>
      </div>
    </section>
  );
}

// Companies: Google, Meta, Amazon, Microsoft, Netflix, Stripe, Uber, Airbnb
// CSS: @keyframes scroll { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
// animation: scroll 30s linear infinite
```

### Section 4: Product Showcase (3 Tabs)

```typescript
// app/(marketing)/components/ProductShowcase.tsx
function ProductShowcase() {
  const [activeTab, setActiveTab] = useState<'system-design' | 'algorithm' | 'interview'>('system-design');

  return (
    <section id="product" className="py-24 px-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-4 text-[#F4F4F5]">
        One Platform. Every Concept.
      </h2>
      <p className="text-center text-[#94A3B8] mb-12 max-w-xl mx-auto">
        From distributed systems to algorithms to interview prep — practice everything in one place.
      </p>

      {/* Tab bar */}
      <div className="flex justify-center gap-2 mb-12">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-6 py-3 rounded-full text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                : "text-[#64748B] hover:text-[#94A3B8]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content: Bento grid layout */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-2 md:grid-cols-3 gap-4"
      >
        {/* Bento tiles with hover elevation */}
        {TAB_CONTENT[activeTab].tiles.map(tile => (
          <BentoTile key={tile.id} {...tile} />
        ))}
      </motion.div>
    </section>
  );
}

// Tab 1: System Design Simulator - Interactive diagram, data flow animation
// Tab 2: Algorithm Visualizer - Sorting bars, step controls, code panel
// Tab 3: Interview Practice - Mock interview screen, timer, AI scoring
```

### Section 5: Feature Deep-Dive (Chess Layout)

```typescript
// app/(marketing)/components/FeatureDeepDive.tsx
// Alternating left/right layout with scroll-triggered animations

const FEATURES = [
  {
    title: "Interactive System Design Canvas",
    description: "Drag, drop, and connect components on a real-time canvas. See data flow, estimate QPS, and simulate failures.",
    visual: <CanvasDemo />,    // embedded interactive mini-demo
    align: 'left',
  },
  {
    title: "Step-by-Step Algorithm Playback",
    description: "Watch algorithms execute one step at a time. Control speed, set breakpoints, and understand every decision.",
    visual: <AlgorithmDemo />,
    align: 'right',
  },
  {
    title: "AI-Powered Feedback",
    description: "Get instant feedback from an AI tutor that evaluates your design across 6 dimensions -- just like a real interviewer.",
    visual: <FeedbackDemo />,
    align: 'left',
  },
  {
    title: "Spaced Repetition & Progress Tracking",
    description: "Never forget what you learned. Our FSRS-based system schedules reviews at the optimal time for long-term retention.",
    visual: <SRSDemo />,
    align: 'right',
  },
  {
    title: "Company-Tagged Problems",
    description: "Practice problems actually asked at Google, Meta, Amazon, and 50+ companies. Filter by company, role, and difficulty.",
    visual: <CompanyDemo />,
    align: 'left',
  },
];

// Each feature section:
// - Uses IntersectionObserver for scroll-triggered entrance
// - Left-aligned: text on left, visual on right (reversed for right-aligned)
// - Animation: fade in + slide from left/right (200ms, ease-out)
// - Visual component: embedded interactive mini-demo or animated illustration
```

### Section 6: How It Works (3 Steps)

```typescript
// app/(marketing)/components/HowItWorks.tsx
const STEPS = [
  { number: 1, title: "Pick a Challenge", description: "Choose from 200+ problems across 12 modules, tagged by company and difficulty.", icon: <Target /> },
  { number: 2, title: "Build & Visualize", description: "Design your system on the interactive canvas. Drag components, connect services, configure scaling.", icon: <Layers /> },
  { number: 3, title: "Get Feedback & Level Up", description: "Receive AI-powered scoring across 6 dimensions. Track your progress and climb the leaderboard.", icon: <TrendingUp /> },
];

// Layout: horizontal 3-column with connecting line/arrow between steps
// Mobile: vertical stack with vertical connector
// Each step: number badge + icon + title + description
// Scroll-triggered stagger animation (150ms between steps)
```

### Section 7: Social Proof Wall

```typescript
// app/(marketing)/components/SocialProofWall.tsx
// Masonry grid of testimonial cards (Tailwind "Wall of Love" style)

interface Testimonial {
  name: string;
  avatar: string;
  company: string;
  role: string;
  quote: string;
  outcome: string;     // "Landed L5 at Google" or "Aced 3/3 system design rounds"
}

// Layout: 3-column masonry grid (css columns or masonry-layout)
// Each card: avatar + name + company + quote + outcome badge
// Stagger entrance animation on scroll
// Bottom: playful button "Okay, I get the point" (scrolls to pricing)
```

### Section 8: Comparison Table

```typescript
// app/(marketing)/components/ComparisonTable.tsx
const COMPARISON = [
  { feature: "System Design", architex: "Interactive simulator", traditional: "Read-only diagrams" },
  { feature: "Algorithms", architex: "Visual step-through", traditional: "Text solutions" },
  { feature: "Feedback", architex: "AI-powered instant", traditional: "Self-assessed" },
  { feature: "Spaced Repetition", architex: "Built-in FSRS", traditional: "Manual flashcards" },
  { feature: "Collaboration", architex: "Real-time multiplayer", traditional: "Solo only" },
  { feature: "Price", architex: "Free tier + $12/mo Pro", traditional: "$149-349/yr" },
  { feature: "Open Source", architex: "Yes (AGPL-3.0)", traditional: "No" },
];

// Architex column highlighted with accent border
// Checkmarks/X marks with color coding
```

### Section 9: Pricing (3 Tiers)

```typescript
// app/(marketing)/components/Pricing.tsx
const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started with system design basics",
    features: [
      "All Foundations content",
      "5 simulations/month",
      "Basic algorithm visualizations",
      "Community access",
    ],
    cta: "Start Free",
    ctaVariant: "outline",
  },
  {
    name: "Pro",
    price: "$12",
    period: "/mo (billed annually)",
    annualPrice: "$144/yr",
    monthlyPrice: "$19/mo",
    badge: "Most Popular",               // +22% conversion
    description: "Everything you need to ace interviews",
    features: [
      "Unlimited simulations (200+ problems)",
      "Advanced visualizations",
      "AI feedback & tutoring",
      "Interview mode",
      "Spaced repetition",
      "Offline access",
      "All future modules",
    ],
    cta: "Start 7-Day Free Trial",
    ctaVariant: "gradient",
    highlighted: true,
  },
  {
    name: "Team",
    price: "$9",
    period: "/user/mo (min 3 users)",
    description: "Level up your engineering team",
    features: [
      "Everything in Pro",
      "Shared workspaces",
      "Team dashboards",
      "Mock interview pairing",
      "Custom learning paths",
      "SSO for 10+ users",
    ],
    cta: "Start Team Trial",
    ctaVariant: "outline",
  },
];

// Annual toggle default with "Save 20%" badge
// "Most Popular" badge on Pro tier (border glow)
// Transparent pricing -- no "Contact Sales" on visible tiers
// Enterprise: "Need custom? Talk to us" link below
```

### Section 10: Final CTA

```typescript
// app/(marketing)/components/FinalCTA.tsx
function FinalCTA() {
  return (
    <section className="py-24 px-6 bg-gradient-to-b from-[#0A0A0F] to-indigo-950/20">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-4xl font-bold text-[#F4F4F5] mb-4">
          Your next system design interview is closer than you think.
        </h2>
        <p className="text-lg text-[#94A3B8] mb-8">
          Join 10,000+ engineers who are practicing smarter, not harder.
        </p>
        <Button
          size="lg"
          className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-10 py-5 text-lg rounded-xl"
          asChild
        >
          <Link href="/sign-up">Start Practicing Free -- No Credit Card Required</Link>
        </Button>
      </div>
    </section>
  );
}
```

### Mobile Responsiveness (<768px)

```
- Single column layout throughout
- Hamburger nav with full-screen overlay
- Full-width CTAs (no side-by-side buttons)
- Product showcase: single tab visible, horizontal scroll for tiles
- Feature deep-dive: stacked (visual above text, always)
- Comparison table: horizontal scroll or stacked cards
- Pricing: vertical stack, Pro card on top
- Trust bar: smaller logos, faster scroll speed
- Hero simulator: simplified view (screenshot instead of interactive)
```

---

## 2. PROGRAMMATIC SEO PAGES (270+)

### Problem Pages (/problems/[slug])

```typescript
// app/problems/[slug]/page.tsx
import { Metadata } from 'next';

// Generate for every challenge (200+):
// /problems/design-url-shortener
// /problems/design-twitter-feed
// /problems/design-uber
// etc.

export async function generateStaticParams() {
  const challenges = await getAllChallenges();
  return challenges.map(c => ({ slug: c.id }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const challenge = await getChallengeById(params.slug);
  return {
    title: `${challenge.title} | System Design Problem | Architex`,
    description: `Practice ${challenge.title} with an interactive simulator. ${challenge.requirements.functional.length} requirements, Level ${challenge.difficulty}, asked at ${challenge.companies.slice(0, 3).join(', ')}.`,
    openGraph: {
      title: challenge.title,
      description: `Interactive system design problem: ${challenge.title}`,
      images: [`/api/og/challenge/${challenge.id}`],
    },
  };
}

export default async function ProblemPage({ params }: { params: { slug: string } }) {
  const challenge = await getChallengeById(params.slug);

  return (
    <article className="max-w-4xl mx-auto px-6 py-16">
      {/* Title + metadata */}
      <h1 className="text-3xl font-bold">{challenge.title}</h1>
      <div className="flex gap-3 mt-4">
        <DifficultyBadge level={challenge.difficulty} />
        <TimeBadge minutes={challenge.timeLimit / 60} />
        {challenge.companies.map(c => <CompanyBadge key={c} company={c} />)}
      </div>

      {/* Problem statement */}
      <section className="mt-8 prose prose-invert">
        <h2>Problem Statement</h2>
        <p>{challenge.description}</p>
      </section>

      {/* Interactive diagram preview (Mermaid rendered to SVG) */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Architecture Overview</h2>
        <MermaidDiagram code={challenge.mermaidPreview} />
        {/* Renders as SVG -- no client-side JS needed for SEO */}
      </section>

      {/* Key concepts */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Key Concepts</h2>
        <ul className="space-y-2">
          {challenge.relatedConcepts.map(concept => (
            <li key={concept.id}>
              <Link href={`/concepts/${concept.id}`} className="text-indigo-400 hover:underline">
                {concept.title}
              </Link>
              <span className="text-[#64748B] ml-2">-- {concept.summary}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Estimation exercises */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Back-of-Envelope Estimation</h2>
        {challenge.requirements.estimations.map(est => (
          <EstimationCard key={est.prompt} prompt={est.prompt} expected={est.expected} />
        ))}
      </section>

      {/* API Design (preview) */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">API Design</h2>
        <p className="text-[#94A3B8]">Key endpoints for this system:</p>
        <APIPreview endpoints={challenge.apiDesign} />
      </section>

      {/* Deep dive (gated -- sign up to access) */}
      <section className="mt-12 p-6 rounded-xl bg-[#141419] border border-[#1E1E2A]">
        <h2 className="text-xl font-semibold mb-2">Ready to Build It?</h2>
        <p className="text-[#94A3B8] mb-4">
          Open the interactive simulator to design this system, get AI feedback, and track your progress.
        </p>
        <Button className="bg-gradient-to-r from-indigo-500 to-purple-500" asChild>
          <Link href={`/challenge/${challenge.id}`}>Start Challenge</Link>
        </Button>
      </section>

      {/* Related problems */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Related Problems</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {challenge.relatedProblems.map(rp => (
            <ProblemCard key={rp.id} problem={rp} />
          ))}
        </div>
      </section>

      {/* FAQ (for SEO) */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
        <FAQAccordion items={challenge.faq} />
      </section>

      {/* Structured Data (JSON-LD) -- safe because content is server-controlled */}
      <StructuredData
        type="TechArticle"
        data={{
          headline: challenge.title,
          description: challenge.description,
          author: { type: "Organization", name: "Architex" },
          datePublished: challenge.createdAt,
          proficiencyLevel: ["Beginner", "Intermediate", "Advanced", "Expert", "Master"][challenge.difficulty - 1],
        }}
      />
    </article>
  );
}
```

### Concept Pages (/concepts/[slug])

```typescript
// app/concepts/[slug]/page.tsx
// Generate for every concept (70+):
// /concepts/consistent-hashing
// /concepts/cap-theorem
// /concepts/database-sharding
// etc.

export default async function ConceptPage({ params }: { params: { slug: string } }) {
  const concept = await getConceptById(params.slug);

  return (
    <article className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold">{concept.title}</h1>

      {/* Interactive visualization */}
      <section className="mt-8">
        <InteractiveVisualization conceptId={concept.id} />
        {/* Lazy-loaded, renders server-side fallback (static SVG) for SEO */}
      </section>

      {/* Explanation */}
      <section className="mt-8 prose prose-invert">
        <MDXContent content={concept.content} />
      </section>

      {/* Where it's used */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Where It's Used</h2>
        <ul>
          {concept.usedIn.map(system => (
            <li key={system.id}>
              <Link href={`/problems/${system.id}`}>{system.title}</Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Interview questions */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Common Interview Questions</h2>
        {concept.interviewQuestions.map(q => (
          <QuestionCard key={q.id} question={q} />
        ))}
      </section>

      {/* Structured data */}
      <StructuredData
        type="TechArticle"
        data={{
          headline: concept.title,
          about: { type: "Thing", name: concept.title },
        }}
      />
    </article>
  );
}
```

### Dynamic OG Images

```typescript
// app/api/og/challenge/[id]/route.tsx
// Same pattern as Phase 7 OG generation but with challenge-specific data:
// - Challenge title
// - Difficulty badge (color-coded)
// - Company logos
// - Node count
// - Time limit
// - "Practice on Architex" CTA

import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const challenge = await getChallengeById(params.id);
  if (!challenge) return new Response('Not found', { status: 404 });

  return new ImageResponse(
    (
      <div style={{
        width: 1200, height: 630, display: 'flex', flexDirection: 'column',
        backgroundColor: '#0A0A0F', padding: 60, fontFamily: 'Inter',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: '#6366F1', fontSize: 28, fontWeight: 700 }}>Architex</div>
          <div style={{
            backgroundColor: getDifficultyColor(challenge.difficulty),
            color: 'white', padding: '6px 16px', borderRadius: 20, fontSize: 18, fontWeight: 600,
          }}>
            Level {challenge.difficulty}
          </div>
        </div>
        <div style={{ color: '#F4F4F5', fontSize: 48, fontWeight: 800, marginTop: 40, lineHeight: 1.2 }}>
          {challenge.title}
        </div>
        <div style={{ color: '#94A3B8', fontSize: 24, marginTop: 20, lineHeight: 1.5 }}>
          {challenge.companies.slice(0, 4).join(' | ')} | {challenge.timeLimit / 60} min
        </div>
        <div style={{ display: 'flex', marginTop: 'auto', color: '#64748B', fontSize: 20 }}>
          Practice on architex.dev
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

function getDifficultyColor(level: number): string {
  const colors: Record<number, string> = { 1: '#22C55E', 2: '#3B82F6', 3: '#F59E0B', 4: '#EF4444', 5: '#A855F7' };
  return colors[level] || '#6B7280';
}
```

### Structured Data (JSON-LD)

```typescript
// lib/seo/structured-data.ts

// StructuredData component renders JSON-LD safely via a script tag.
// All data is server-controlled (not user input), so injection risk is eliminated.

// WebApplication schema (for Google rich results)
export const webApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Architex",
  "url": "https://architex.dev",
  "description": "Interactive system design simulator for engineering interviews",
  "applicationCategory": "EducationalApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
};

// Course schema (for learning content)
export function courseSchema(module: string, lessons: any[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": `${module} -- Architex`,
    "provider": { "@type": "Organization", "name": "Architex" },
    "hasCourseInstance": lessons.map(l => ({
      "@type": "CourseInstance",
      "name": l.title,
      "courseMode": "Online",
    })),
  };
}

// StructuredData component
function StructuredData({ type, data }: { type: string; data: Record<string, unknown> }) {
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": type,
    ...data,
  });

  // Using a script element with type="application/ld+json"
  // Content is server-controlled, so this is safe from XSS
  return <script type="application/ld+json">{jsonLd}</script>;
}
```

### Sitemap + robots.ts

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const challenges = await getAllChallenges();
  const concepts = await getAllConcepts();
  const blogPosts = await getAllBlogPosts();

  return [
    // Static pages
    { url: 'https://architex.dev', lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: 'https://architex.dev/pricing', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://architex.dev/docs', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: 'https://architex.dev/blog', lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },

    // Problem pages (200+)
    ...challenges.map(c => ({
      url: `https://architex.dev/problems/${c.id}`,
      lastModified: c.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),

    // Concept pages (70+)
    ...concepts.map(c => ({
      url: `https://architex.dev/concepts/${c.id}`,
      lastModified: c.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),

    // Blog posts
    ...blogPosts.map(p => ({
      url: `https://architex.dev/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'yearly' as const,
      priority: 0.6,
    })),
  ];
}

// app/robots.ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/embed/', '/dashboard/'],
      },
    ],
    sitemap: 'https://architex.dev/sitemap.xml',
  };
}
```

---

## 3. ONBOARDING FLOW

### 3-Step Interactive Tutorial (90 Seconds)

```typescript
// components/onboarding/OnboardingTutorial.tsx
// "Build a Mini URL Shortener in 90 seconds"

const ONBOARDING_STEPS = [
  {
    step: 1,
    title: "Drag Your First Components",
    instruction: "Drag a Client, API Server, and Database onto the canvas",
    targetNodes: ['client', 'service', 'database'],
    duration: 30, // seconds
    // Ghost placeholders show where to drop
    // Spotlight highlights the component palette
    completion: (nodes: any[]) => nodes.length >= 3,
  },
  {
    step: 2,
    title: "Connect the Dots",
    instruction: "Connect Client -> API -> Database",
    expectedEdges: [['client', 'service'], ['service', 'database']],
    duration: 20,
    // Animated hint arrows show connection points
    completion: (edges: any[]) => edges.length >= 2,
  },
  {
    step: 3,
    title: "Simulate & Watch It Break",
    instruction: "Click 'Simulate' to send 1000 requests. Watch the database bottleneck. Then add a Cache!",
    actions: ['simulate', 'add-cache'],
    duration: 40,
    // 1. Click simulate -> particles flow -> DB turns red (overloaded)
    // 2. Prompt: "Add a Redis Cache between API and DB"
    // 3. User adds cache -> re-simulate -> latency drops from 200ms to 5ms
    // 4. Celebration confetti!
    completion: (state: any) => state.hasCache && state.simulationRun >= 2,
  },
];

// Track completion in IndexedDB (not server -- no auth needed yet)
// If user abandons mid-tutorial, show "Resume Tutorial" banner on return
// Skip button available but tracking shows 73% higher retention when completed

function OnboardingTutorial() {
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    // Check if already completed
    const done = localStorage.getItem('onboarding_complete');
    if (done) setCompleted(true);
  }, []);

  if (completed) return null;

  return (
    <div className="absolute inset-0 z-50">
      {/* Spotlight overlay (dim everything except target area) */}
      <SpotlightOverlay target={ONBOARDING_STEPS[step].targetNodes} />

      {/* Instruction tooltip */}
      <OnboardingTooltip
        step={ONBOARDING_STEPS[step]}
        onComplete={() => {
          if (step < ONBOARDING_STEPS.length - 1) {
            setStep(step + 1);
          } else {
            setCompleted(true);
            localStorage.setItem('onboarding_complete', 'true');
          }
        }}
        onSkip={() => {
          setCompleted(true);
          localStorage.setItem('onboarding_skipped', 'true');
        }}
      />

      {/* Progress indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {ONBOARDING_STEPS.map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              i <= step ? "bg-indigo-500" : "bg-[#2E2F35]"
            )}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## 4. DOCUMENTATION SITE

### Structure

```
docs/
  getting-started/
    installation.mdx
    quick-start.mdx
    first-diagram.mdx
  guides/
    system-design/
      url-shortener.mdx
      twitter-feed.mdx
      ...
    algorithms/
      sorting.mdx
      ...
    data-structures/
      ...
    ... (per module)
  api-reference/
    canvas-api.mdx
    node-types.mdx
    edge-types.mdx
    simulation-api.mdx
    plugin-api.mdx
  templates/
    index.mdx
    ... (template docs)
  contributing/
    development-setup.mdx
    architecture.mdx
    code-style.mdx
    pull-requests.mdx
```

### Implementation

```typescript
// Option A: Next.js built-in MDX with next-intl for i18n
// app/docs/[[...slug]]/page.tsx with MDX content

// Option B: Separate Docusaurus site at docs.architex.dev
// If choosing Docusaurus: @docusaurus/preset-classic with Algolia DocSearch

// Key requirement: Embedded interactive diagrams within documentation
// Use <InteractiveDiagram> component that renders React Flow in read-only mode
// with pre-loaded content, pan/zoom enabled
```

---

## 5. BLOG WITH SEED ARTICLES

### 5 Seed Articles

```typescript
const SEED_ARTICLES = [
  {
    slug: "how-consistent-hashing-works",
    title: "How Consistent Hashing Works (with Interactive Simulation)",
    description: "Visual guide to consistent hashing with an embedded simulator. Add/remove nodes and watch keys redistribute in real-time.",
    category: "concepts",
    tags: ["distributed-systems", "consistent-hashing", "interactive"],
    estimatedReadTime: 12,
    // Embedded interactive: hash ring simulation with drag-to-add nodes
  },
  {
    slug: "why-system-design-interviews-are-broken",
    title: "Why System Design Interviews Are Broken (And How to Fix Them)",
    description: "System design interviews test whiteboard drawing, not actual design skills. Here is what a better approach looks like.",
    category: "opinion",
    tags: ["interviews", "system-design", "hiring"],
    estimatedReadTime: 8,
    // Opinion piece with data from research (conversion angle)
  },
  {
    slug: "design-instagram-feed-2026",
    title: "Design Instagram's Feed in 2026 -- Complete Walkthrough",
    description: "Step-by-step system design of Instagram's feed with interactive diagrams, back-of-envelope math, and trade-off analysis.",
    category: "walkthrough",
    tags: ["system-design", "instagram", "feed", "walkthrough"],
    estimatedReadTime: 20,
    // Embedded diagrams at each step -- the blog IS the tutorial
  },
  {
    slug: "visual-guide-raft-consensus",
    title: "A Visual Guide to Raft Consensus",
    description: "Understand Raft consensus with animated leader election, log replication, and safety proofs. No math required.",
    category: "concepts",
    tags: ["distributed-systems", "raft", "consensus", "animation"],
    estimatedReadTime: 15,
    // Embedded Raft simulation: click to trigger elections, partitions
  },
  {
    slug: "math-behind-load-balancers",
    title: "The Math Behind Load Balancers: From Round-Robin to Consistent Hashing",
    description: "Understand the algorithms powering load balancers with interactive simulations. See how different strategies affect latency and fairness.",
    category: "concepts",
    tags: ["load-balancing", "algorithms", "math", "interactive"],
    estimatedReadTime: 14,
    // Embedded: slider to adjust server count, see load distribution change
  },
];

// Blog implementation:
// app/blog/[slug]/page.tsx
// Content in MDX files with embedded React components
// Each article has: title, date, author, read time, tags, OG image
// Related articles sidebar
// Newsletter signup CTA at bottom
```

---

## 6. NEWSLETTER ("THE ARCHITECT'S DIGEST")

```typescript
// Newsletter system via Resend

// Signup incentive: "System Design Cheat Sheet" PDF (10-page PDF)
// - Key concepts overview
// - Common patterns and when to use them
// - Back-of-envelope numbers cheat sheet
// - Interview rubric breakdown
// Delivered immediately on signup via Inngest

// Weekly newsletter content:
// 1. "Concept of the Week" -- deep dive on one concept with diagram
// 2. "Problem of the Week" -- featured challenge with hints
// 3. "Community Highlight" -- best community design this week
// 4. "Quick Tip" -- one actionable interview tip
// 5. "What's New" -- changelog/feature updates

// Target: 10K subscribers in 6 months
// Growth strategy:
// - Blog articles have newsletter CTA at bottom
// - Onboarding email sequence invites to newsletter
// - SEO pages have newsletter CTA in sidebar
// - Twitter/LinkedIn content drives to landing page
// - Cheat sheet incentive (20%+ conversion vs plain signup)

// Resend implementation:
export const sendNewsletter = inngest.createFunction(
  { id: 'weekly-newsletter' },
  { cron: '0 9 * * 1' },  // Mondays 9 AM UTC
  async ({ step }) => {
    const subscribers = await step.run('get-subscribers', () =>
      db.query.newsletter.findMany({ where: eq(newsletter.active, true) })
    );

    // Batch send via Resend (100 per batch, rate limited)
    const batches = chunk(subscribers, 100);
    for (const batch of batches) {
      await step.run(`send-batch-${batch[0].id}`, async () => {
        await resend.batch.send(batch.map(sub => ({
          from: "The Architect's Digest <digest@architex.dev>",
          to: sub.email,
          subject: getWeeklySubject(),
          react: WeeklyNewsletter({ name: sub.name, ...getWeeklyContent() }),
        })));
      });
      await step.sleep('rate-limit-pause', '2s');
    }
  }
);
```

---

## 7. PRODUCT HUNT LAUNCH

```
Launch checklist:

Timing: 12:01 AM Pacific Time (when PH day resets)
Day: Tuesday or Wednesday (highest traffic)

Assets to prepare:
1. Tagline (60 chars max): "Interactive system design simulator for engineering interviews"
2. Description (260 chars): "Architex lets you build, simulate, and get AI feedback on
   system designs. 200+ challenges, 12 modules, spaced repetition, and real-time
   collaboration. Free and open source."
3. 5-6 screenshots/GIFs:
   - Hero: Full canvas with flowing data particles
   - Challenge mode: Timer + requirements + canvas
   - AI feedback: ScoreCard with dimension bars
   - Algorithm viz: Sorting animation step-through
   - Collaboration: Multiple cursors on shared canvas
   - Mobile: Responsive dashboard view
4. 90-second demo video:
   - 0-15s: Problem statement appears
   - 15-40s: Drag and connect components
   - 40-55s: Click simulate, watch data flow
   - 55-70s: AI evaluation with scores
   - 70-85s: Spaced repetition review
   - 85-90s: CTA + logo
5. Maker comment (first comment): Personal story + what makes it different
6. Offer: "Pro free for 30 days for the Product Hunt community"

Hunter strategy:
- Self-hunt is fine for solo makers
- Or ask a PH influencer with 1000+ followers

Day-of execution:
- Post at 12:01 AM PT
- Be in comments ALL DAY (respond to every comment within 30 min)
- Share on Twitter, LinkedIn, relevant Discord/Slack communities
- Email waitlist: "We're live on Product Hunt!"
- Update badge on landing page: "#1 Product of the Day" (if achieved)
```

---

## 8. HACKER NEWS LAUNCH

```
Title: "Show HN: Architex -- Open-source system design simulator"

Post text:
"I built an open-source, interactive system design simulator. Instead of
reading about how URL shorteners work, you drag components onto a canvas,
connect them, simulate traffic, and watch where bottlenecks appear.

Features:
- 200+ system design, algorithm, and data structure challenges
- AI evaluation across 6 dimensions (functional, scalability, reliability...)
- FSRS-based spaced repetition for long-term retention
- Real-time collaboration with Yjs CRDTs
- Rust to WASM for O(n log n) layout algorithms
- Export to Mermaid, PlantUML, draw.io, Terraform

Stack: Next.js 16, React Flow, Rust to WASM, Zustand, Yjs + PartyKit

Live demo: https://architex.dev (no signup needed for basic features)
GitHub: https://github.com/architex-dev/architex (AGPL-3.0)

I would love feedback on the simulation engine and AI evaluation accuracy."

Rules:
- Zero marketing language
- Technical substance only
- Mention the tech stack (HN loves this)
- Link to live demo AND GitHub
- Be in comments 4-6 hours minimum
- Answer technical questions with depth
- Acknowledge limitations honestly
- Tuesday/Wednesday morning (10-11 AM ET)
```

---

## 9. OPEN SOURCE (AGPL-3.0)

### Repository Structure

```
architex/
  README.md                 -- Hero GIF, quick start, features, architecture
  LICENSE                   -- AGPL-3.0
  CONTRIBUTING.md           -- How to contribute (setup, conventions, PR process)
  CODE_OF_CONDUCT.md        -- Contributor Covenant
  SECURITY.md               -- Security reporting policy
  .github/
    ISSUE_TEMPLATE/
      bug_report.yml
      feature_request.yml
      config.yml
    PULL_REQUEST_TEMPLATE.md
    workflows/
      ci.yml
      release.yml
      security.yml
  ... (source code)
```

### README.md Structure

```
# Architex

[Hero GIF: 3-5 second loop showing drag->connect->simulate->score]

The interactive system design simulator. Build, simulate, and master
distributed systems -- not just read about them.

Live Demo | Documentation | Discord

## Features

- Interactive system design canvas with 200+ challenges
- AI-powered evaluation across 6 dimensions
- Algorithm visualizer with step-through playback
- FSRS-based spaced repetition for long-term retention
- Real-time collaboration with live cursors
- Export to Mermaid, PlantUML, draw.io, Terraform, and more
- Desktop app (Tauri) -- 10MB, instant startup

## Quick Start

[pnpm install, pnpm dev, open localhost:3000]

## Architecture

[Mermaid diagram of system architecture]

## Contributing

See CONTRIBUTING.md for development setup and guidelines.

## License

AGPL-3.0 -- see LICENSE for details.
```

---

## FILES TO CREATE/MODIFY

```
app/
  (marketing)/
    page.tsx                        -- Landing page
    layout.tsx                      -- Marketing layout (no app shell)
    components/
      Navbar.tsx
      Hero.tsx
      GradientMeshBackground.tsx
      MiniSimulator.tsx
      TrustBar.tsx
      ProductShowcase.tsx
      FeatureDeepDive.tsx
      HowItWorks.tsx
      SocialProofWall.tsx
      ComparisonTable.tsx
      Pricing.tsx
      FinalCTA.tsx
      Footer.tsx
      MobileMenu.tsx
  problems/
    [slug]/
      page.tsx                      -- Problem SEO page
      metadata.ts
  concepts/
    [slug]/
      page.tsx                      -- Concept SEO page
  blog/
    page.tsx                        -- Blog index
    [slug]/
      page.tsx                      -- Blog post
  docs/
    [[...slug]]/
      page.tsx                      -- Documentation pages
  sitemap.ts
  robots.ts

components/
  onboarding/
    OnboardingTutorial.tsx          -- 3-step interactive tutorial
    SpotlightOverlay.tsx            -- Dim + spotlight effect
    OnboardingTooltip.tsx           -- Step instruction tooltip
  seo/
    MermaidDiagram.tsx              -- Server-rendered Mermaid to SVG
    StructuredData.tsx              -- JSON-LD injection component
    DynamicOGImage.tsx              -- OG image component

content/
  problems/                         -- MDX for each problem (200+)
  concepts/                         -- MDX for each concept (70+)
  blog/                             -- MDX blog posts

lib/
  seo/
    structured-data.ts              -- JSON-LD generators
    metadata.ts                     -- generateMetadata helpers
  newsletter/
    resend.ts                       -- Newsletter send logic

emails/
  newsletter/
    weekly.tsx                      -- Weekly digest template
    welcome-subscriber.tsx          -- Cheat sheet delivery

public/
  cheat-sheet.pdf                   -- System Design Cheat Sheet incentive

README.md                           -- Open source README
CONTRIBUTING.md
CODE_OF_CONDUCT.md
SECURITY.md
LICENSE                             -- AGPL-3.0

.github/
  ISSUE_TEMPLATE/
    bug_report.yml
    feature_request.yml
  PULL_REQUEST_TEMPLATE.md
```

---

## DEPENDENCIES TO INSTALL

```bash
# Landing page
pnpm add @react-three/fiber @react-three/drei  # Optional: WebGL gradient mesh
# OR use a lightweight canvas gradient alternative

# SEO
pnpm add next-mdx-remote gray-matter            # MDX content
pnpm add mermaid                                 # Mermaid to SVG rendering

# Documentation (if using Docusaurus)
# npx create-docusaurus@latest docs classic
# OR use Next.js built-in MDX

# Newsletter
# Resend already installed from Phase 7
```

---

## ACCEPTANCE CRITERIA

- [ ] Landing page renders all 10 sections with dark theme
- [ ] Sticky nav has frosted glass effect, mobile hamburger menu
- [ ] Hero has animated gradient mesh background (<10KB, 60fps)
- [ ] Mini-simulator is interactive (pan, zoom, see data flow)
- [ ] Trust bar auto-scrolls logos seamlessly
- [ ] Product showcase tabs switch with smooth animation
- [ ] Feature deep-dive sections animate on scroll (IntersectionObserver)
- [ ] Pricing shows 3 tiers with "Most Popular" badge on Pro
- [ ] Mobile layout: single column, full-width CTAs, hamburger nav
- [ ] 200+ problem pages at /problems/[slug] with SSG
- [ ] 70+ concept pages at /concepts/[slug] with SSG
- [ ] Each SEO page has: generateMetadata, OG image, JSON-LD structured data
- [ ] Sitemap.xml includes all pages, auto-generated
- [ ] robots.ts blocks /api/ and /dashboard/ from crawlers
- [ ] Onboarding tutorial: 3 steps, 90 seconds, completion tracked in IndexedDB
- [ ] "Resume tutorial" shows if user abandoned mid-flow
- [ ] Documentation site has Getting Started, Guides, API Reference, Templates
- [ ] 5 blog articles published with embedded interactive diagrams
- [ ] Newsletter signup with cheat sheet incentive
- [ ] Weekly newsletter sends Mondays 9 AM UTC via Resend
- [ ] Product Hunt assets ready: tagline, description, 5-6 screenshots, video
- [ ] Hacker News post drafted with technical substance, no marketing language
- [ ] AGPL-3.0 LICENSE file present
- [ ] README.md has hero GIF, quick start, architecture, contributing
- [ ] CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md present
- [ ] Issue templates for bug reports and feature requests
- [ ] Lighthouse score: 95+ performance, 100 SEO, 100 accessibility
