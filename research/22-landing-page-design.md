# Landing Page Design Blueprint

> Analyzed: Linear, Vercel, Stripe, Figma, Supabase, Excalidraw, Raycast, PlanetScale, Tailwind, Arc.

---

## DESIGN DIRECTION

**"Linear-style dark theme + Stripe-level animation polish + Excalidraw's product-as-hero philosophy"**

### Color System
```
Background:      #0A0A0F (near-black)
Surface:         #141419 (card backgrounds)
Border:          #1E1E2A (subtle dividers)
Text Primary:    #F4F4F5 (near-white)
Text Secondary:  #94A3B8 (muted gray)
Accent Primary:  #6366F1 (indigo)
Accent Success:  #22C55E (green)
Accent Warning:  #F59E0B (amber)
Accent Glow:     linear-gradient(135deg, #6366F1, #8B5CF6, #A78BFA)
```

### Typography
- Headlines: "Plus Jakarta Sans" or "Inter Display" — 48-72px, bold (700-800)
- Body: "Inter" — 16-18px, regular (400)
- Code: "JetBrains Mono" — 14-16px

### Navigation (Sticky, Frosted Glass)
```
[Logo]  [Product]  [Features]  [Pricing]  [Docs]  [Blog]    [Sign In]  [Start Free →]
```
backdrop-filter: blur(12px), transparent-to-solid on scroll.

---

## SECTION-BY-SECTION BLUEPRINT

### 1. HERO
**Headline:** "Design Systems. Visualize Algorithms. Ace Interviews."
**Subheadline:** "The interactive simulator where you build, break, and master distributed systems — not just read about them."
**CTAs:**
- Primary: "Start Practicing Free" (indigo gradient, pulse on hover)
- Secondary: "Watch Demo" (outlined)
**Visual:** Live mini-simulator embedded — nodes appearing, connections forming, data flowing. Product IS the hero (Excalidraw approach).
**Background:** Animated gradient mesh (Stripe-style WebGL, <10kb, 60fps)

### 2. TRUST BAR
"Engineers from these companies practice on Architex"
Auto-scrolling grayscale logos: Google, Meta, Amazon, Microsoft, Netflix, Stripe, Uber

### 3. PRODUCT SHOWCASE (3 Tabs)
**Tab 1: "System Design Simulator"** — Interactive diagram, data flow animation
**Tab 2: "Algorithm Visualizer"** — Sorting bars, step-through controls, code panel
**Tab 3: "Interview Practice"** — Mock interview screen, timer, AI evaluation
Bento grid layout within each tab. Hover elevation on tiles.

### 4. FEATURE DEEP-DIVE (Chess Layout)
Alternating left/right with scroll-triggered fade+slide:
1. Interactive System Design Canvas
2. Step-by-Step Algorithm Playback
3. AI-Powered Feedback
4. Spaced Repetition & Progress Tracking
5. Company-Tagged Problems

### 5. HOW IT WORKS (3 Steps)
```
[1. Pick a Challenge] → [2. Build & Visualize] → [3. Get Feedback & Level Up]
```

### 6. SOCIAL PROOF WALL
Masonry grid of testimonial cards (Tailwind "Wall of Love" style).
Avatar + Name + Company + Quote + Outcome metric.
Playful button: "Okay, I get the point"

### 7. COMPARISON TABLE
| | Architex | Traditional Prep |
|---|---|---|
| System Design | Interactive simulator | Read-only diagrams |
| Algorithms | Visual step-through | Text solutions |
| Feedback | AI-powered instant | Self-assessed |

### 8. PRICING
3 tiers side-by-side. "Most Popular" badge on Pro (+22% conversion).
Annual default with "Save 20%" badge. Transparent, no "Contact Sales."

### 9. FINAL CTA
Dark indigo gradient background.
"Your next system design interview is closer than you think."
"Start Practicing Free — No Credit Card Required"

---

## CONVERSION DATA

| Metric | Data |
|---|---|
| Interactive demo on landing page | +65% trial conversion |
| 5th-grade reading level | 12.9% conversion (vs 2.1% professional) |
| First-person CTAs ("Start My...") | +30-40% over "Start Your..." |
| Single CTA per viewport | 13.5% vs 10.5% for 5+ CTAs |
| Page load 1s vs 5s | 3x conversion difference |
| Bento grid layouts | +47% dwell time, +38% CTR |
| "Most Popular" badge on middle tier | +22% conversion |

---

## ANIMATION SPECS

| Element | Animation | Trigger |
|---|---|---|
| Hero product preview | Continuous gentle | On load |
| Feature sections | Fade + slide (left/right) | Scroll (Intersection Observer) |
| CTA buttons | Subtle pulse glow | Hover |
| Trust logos | Auto-scroll carousel | Continuous |
| Testimonials | Staggered fade-in | Scroll |
| Tab switching | Crossfade 200ms | Click |
| Code snippets | Typewriter effect | Scroll |
| Background | Gradient mesh (WebGL) | Continuous, GPU |

All animations 60fps. CSS transforms only (translate, scale, opacity).

---

## MOBILE (< 768px)
- Single-column stack
- Hamburger → full-screen overlay nav
- Full-width CTAs, 48px min touch target
- Swipeable pricing cards
- 16px minimum body text (prevents iOS zoom)

---

## KEY PRINCIPLES

1. **Product-as-hero** — show the simulator live, not a screenshot
2. **Dark theme is default** — developer-native
3. **Code earns trust** — show snippets, terminal commands early
4. **Specific over generic** — "200+ problems" beats "comprehensive platform"
5. **Transformation over features** — "Ace your interview" beats "AI feedback system"
6. **Interactive before signup** — let devs play before asking for email
7. **60fps everything** — janky animations signal janky product
8. **5th-grade reading level** — simple, direct, no marketing jargon
9. **Max 3 CTAs per viewport** — focus attention
10. **Genuine social proof** — real names, companies, outcomes
