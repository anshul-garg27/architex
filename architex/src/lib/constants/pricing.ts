// ---------------------------------------------------------------------------
// Single source of truth for pricing data across the entire app.
// Both LandingPage and PricingContent import from here.
// ---------------------------------------------------------------------------

/** A single pricing tier displayed on the pricing page and landing page. */
export type PricingTier = {
  /** Machine-readable tier identifier (e.g. 'free', 'pro', 'team'). */
  id: string;
  /** Display name shown in cards and comparison table. */
  name: string;
  /** Short tagline describing the tier value proposition. */
  description: string;
  /** Price in USD billed monthly. 0 for the free tier. */
  monthlyPrice: number;
  /** When true, price is per seat (used for Team tier). */
  perSeat?: boolean;
  /** When true, renders a "Most Popular" badge on the card. */
  popular?: boolean;
  /** Call-to-action button label. */
  cta: string;
  /** Destination URL when the CTA button is clicked. */
  ctaHref: string;
  /** List of feature bullet points displayed on the pricing card. */
  features: string[];
};

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "free",
    name: "Free",
    description: "Get started with system design fundamentals.",
    monthlyPrice: 0,
    cta: "Get Started",
    ctaHref: "/dashboard",
    features: [
      "5 simulations per day",
      "10 starter templates",
      "Community support",
      "Core algorithm visualizations",
      "Basic data structure explorer",
    ],
  },
  {
    id: "student",
    name: "Student",
    description: "Full Pro access free with a .edu email.",
    monthlyPrice: 0,
    cta: "Verify .edu Email",
    ctaHref: "/dashboard?verify=student",
    features: [
      "All Pro features at $0",
      "Unlimited simulations",
      "All 40+ templates",
      "AI-powered hints & evaluation",
      "Export to PDF & Terraform",
      "Requires .edu email verification",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "Unlock the full learning experience.",
    monthlyPrice: 12,
    popular: true,
    cta: "Upgrade to Pro",
    ctaHref: "/dashboard?upgrade=pro",
    features: [
      "Unlimited simulations",
      "All 40+ templates",
      "AI-powered hints & evaluation",
      "Priority support",
      "Export to PDF & Terraform",
      "Advanced chaos engineering",
      "Custom node definitions",
      "Performance analytics",
    ],
  },
  {
    id: "team",
    name: "Team",
    description: "Collaborative learning for engineering teams.",
    monthlyPrice: 29,
    perSeat: true,
    cta: "Contact Sales",
    ctaHref: "mailto:team@architex.dev",
    features: [
      "Everything in Pro",
      "Real-time collaboration",
      "Shared workspaces",
      "Team analytics & reporting",
      "Admin dashboard",
      "SSO / SAML integration",
      "Dedicated support",
    ],
  },
];

/** Returns a human-readable price string, e.g. "Free" or "$12". */
export function formatPrice(tier: PricingTier): string {
  if (tier.monthlyPrice === 0) return "Free";
  return `$${tier.monthlyPrice}`;
}

/** Returns the billing period suffix, e.g. "forever", "/month", or "/seat/month". */
export function formatPeriod(tier: PricingTier): string {
  if (tier.monthlyPrice === 0) return "forever";
  return tier.perSeat ? "/seat/month" : "/month";
}
