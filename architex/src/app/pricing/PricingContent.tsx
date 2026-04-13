"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  X,
  Sparkles,
  Users,
  Zap,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PRICING_TIERS, type PricingTier } from "@/lib/constants/pricing";
import { FEATURE_GATES, FEATURE_LABELS, FEATURE_MATRIX } from "@/lib/billing/feature-gates";
import { duration, easing } from "@/lib/constants/motion";

// ---------------------------------------------------------------------------
// Constants -- local enrichments on top of the shared pricing data
// ---------------------------------------------------------------------------

type TierEnrichment = {
  icon: React.ReactNode;
  currentPlan?: boolean;
};

const TIER_ENRICHMENTS: Record<string, TierEnrichment> = {
  free: { icon: <Zap className="h-5 w-5" />, currentPlan: true },
  student: { icon: <GraduationCap className="h-5 w-5" /> },
  pro: { icon: <Sparkles className="h-5 w-5" /> },
  team: { icon: <Users className="h-5 w-5" /> },
};

type Tier = PricingTier & TierEnrichment;

const TIERS: Tier[] = PRICING_TIERS.map((tier) => ({
  ...tier,
  ...TIER_ENRICHMENTS[tier.id],
}));

// ---------------------------------------------------------------------------
// Feature comparison table data -- 4-column (all tiers)
// ---------------------------------------------------------------------------

type FeatureRow = {
  label: string;
  free: string | boolean;
  student: string | boolean;
  pro: string | boolean;
  team: string | boolean;
};

const COMPARISON: FeatureRow[] = [
  { label: "Simulations / month",       free: "5",     student: "Unlimited", pro: "Unlimited", team: "Unlimited" },
  { label: "Templates",                 free: "10",    student: "All 40+",   pro: "All 40+",   team: "All 40+" },
  { label: "AI hints",                  free: false,   student: true,        pro: true,        team: true },
  { label: "AI review & scoring",       free: false,   student: true,        pro: true,        team: true },
  { label: "AI generation",             free: false,   student: true,        pro: true,        team: true },
  { label: "Priority support",          free: false,   student: true,        pro: true,        team: true },
  { label: "Export to PDF",             free: false,   student: true,        pro: true,        team: true },
  { label: "Export to Terraform / K8s", free: false,   student: true,        pro: true,        team: true },
  { label: "Chaos engineering",         free: false,   student: true,        pro: true,        team: true },
  { label: "Custom node definitions",   free: false,   student: true,        pro: true,        team: true },
  { label: "Simulation recording",      free: false,   student: true,        pro: true,        team: true },
  { label: "Gallery publishing",        free: false,   student: true,        pro: true,        team: true },
  { label: "Custom templates",          free: false,   student: true,        pro: true,        team: true },
  { label: "Import from Terraform",     free: false,   student: true,        pro: true,        team: true },
  { label: "Performance analytics",     free: "Basic", student: "Advanced",  pro: "Advanced",  team: "Advanced + Team" },
  { label: "Real-time collaboration",   free: false,   student: false,       pro: false,       team: true },
  { label: "Shared workspaces",         free: false,   student: false,       pro: false,       team: true },
  { label: "Team dashboard",            free: false,   student: false,       pro: false,       team: true },
  { label: "Admin dashboard",           free: false,   student: false,       pro: false,       team: true },
  { label: "SSO / SAML",                free: false,   student: false,       pro: false,       team: true },
  { label: "API access",                free: false,   student: false,       pro: false,       team: true },
  { label: "Enterprise SLA",            free: false,   student: false,       pro: false,       team: true },
];

// ---------------------------------------------------------------------------
// Competitive comparison: Architex vs PaperDraw
// ---------------------------------------------------------------------------

type CompetitiveRow = {
  feature: string;
  architex: string;
  paperDraw: string;
  advantage: "architex" | "paperdraw" | "tie";
};

const COMPETITIVE_COMPARISON: CompetitiveRow[] = [
  { feature: "System design simulator",      architex: "Full interactive canvas with live simulation",   paperDraw: "Static diagrams only",                    advantage: "architex" },
  { feature: "Chaos engineering",            architex: "Built-in fault injection & failure scenarios",   paperDraw: "Not available",                           advantage: "architex" },
  { feature: "AI-powered evaluation",        architex: "Scores designs & provides actionable feedback",  paperDraw: "Basic AI topology rules (741 rules)",     advantage: "architex" },
  { feature: "Algorithm visualizer",         architex: "13 algorithms with step-by-step animation",      paperDraw: "Not available",                           advantage: "architex" },
  { feature: "Data structure explorer",      architex: "Interactive visualizations for 8+ structures",   paperDraw: "Not available",                           advantage: "architex" },
  { feature: "Interview preparation",        architex: "Timed challenges with scoring",                  paperDraw: "Not available",                           advantage: "architex" },
  { feature: "Export to Terraform / K8s",    architex: "One-click export to IaC formats",                paperDraw: "SVG/PNG export only",                     advantage: "architex" },
  { feature: "Real-time collaboration",      architex: "Team plan with shared workspaces",               paperDraw: "Basic real-time sharing",                 advantage: "tie" },
  { feature: "Drawing components",           architex: "35+ system design components",                   paperDraw: "107 general-purpose components",          advantage: "paperdraw" },
  { feature: "Free tier",                    architex: "5 sims/day, 10 templates",                       paperDraw: "Unlimited basic diagrams",                advantage: "paperdraw" },
  { feature: "Student pricing",              architex: "Free with .edu verification",                    paperDraw: "No student program",                      advantage: "architex" },
  { feature: "Learning progression",         architex: "XP, streaks, leaderboards, bridges",             paperDraw: "Not available",                           advantage: "architex" },
];

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

type FAQ = { q: string; a: string };

const FAQS: FAQ[] = [
  {
    q: "Can I switch plans at any time?",
    a: "Yes. Upgrade or downgrade whenever you like. When upgrading, you only pay the prorated difference for the remainder of your billing cycle.",
  },
  {
    q: "What counts as a simulation?",
    a: "Each time you run a system design scenario (load balancer routing, consensus algorithm, etc.) counts as one simulation. Viewing templates and reading content does not count.",
  },
  {
    q: "How does the Student tier work?",
    a: "Verify a .edu (or equivalent academic) email address to unlock all Pro features at no cost. Verification lasts one year, then you re-verify to continue.",
  },
  {
    q: "What .edu domains are accepted?",
    a: "We accept .edu, .ac.uk, .ac.nz, .edu.au, and 25+ other international academic TLDs. If your institution uses a non-standard domain, contact support and we'll add it.",
  },
  {
    q: "What happens when my free simulations run out?",
    a: "You can still browse templates and content. Simulations reset on the first of each month, or you can upgrade to Pro or verify a .edu email for unlimited access.",
  },
  {
    q: "How does Team billing work?",
    a: "Team pricing is per seat per month. You only pay for active seats. Add or remove team members at any time from the admin dashboard.",
  },
  {
    q: "Do you offer refunds?",
    a: "We offer a 14-day money-back guarantee on all paid plans. No questions asked.",
  },
  {
    q: "How is Architex different from PaperDraw / Excalidraw?",
    a: "Architex is a learning platform, not just a drawing tool. We offer live simulations, chaos engineering, AI evaluation, algorithm visualization, and structured interview prep -- features purpose-built for system design mastery.",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(monthly: number, annual: boolean): string {
  if (monthly === 0) return "$0";
  const price = annual ? Math.round(monthly * 12 * 0.8) / 12 : monthly;
  return `$${price % 1 === 0 ? price : price.toFixed(1)}`;
}

function CellValue({ value }: { value: string | boolean }) {
  if (typeof value === "string") {
    return <span className="text-sm text-[var(--foreground)]">{value}</span>;
  }
  return value ? (
    <Check className="mx-auto h-4 w-4 text-[var(--state-success)]" aria-label="Included" />
  ) : (
    <X className="mx-auto h-4 w-4 text-[var(--foreground-subtle)]" aria-label="Not included" />
  );
}

function AdvantageBadge({ advantage }: { advantage: CompetitiveRow["advantage"] }) {
  if (advantage === "architex") {
    return (
      <span className="inline-flex items-center rounded-full bg-[var(--state-success)]/15 px-2 py-0.5 text-xs font-medium text-[var(--state-success)]">
        Architex
      </span>
    );
  }
  if (advantage === "paperdraw") {
    return (
      <span className="inline-flex items-center rounded-full bg-[var(--foreground-subtle)]/15 px-2 py-0.5 text-xs font-medium text-[var(--foreground-muted)]">
        PaperDraw
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-[var(--foreground-subtle)]/10 px-2 py-0.5 text-xs font-medium text-[var(--foreground-subtle)]">
      Tie
    </span>
  );
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function BillingToggle({
  annual,
  onToggle,
}: {
  annual: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span
        className={cn(
          "text-sm font-medium transition-colors",
          !annual ? "text-[var(--foreground)]" : "text-[var(--foreground-muted)]",
        )}
      >
        Monthly
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={annual}
        aria-label="Toggle annual billing"
        onClick={onToggle}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
          annual ? "bg-[var(--primary)]" : "bg-[var(--muted)]",
        )}
      >
        <span
          className={cn(
            "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform",
            annual ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
      <span
        className={cn(
          "text-sm font-medium transition-colors",
          annual ? "text-[var(--foreground)]" : "text-[var(--foreground-muted)]",
        )}
      >
        Annual
      </span>
      <span className="ml-1 rounded-full bg-[var(--state-success)]/15 px-2.5 py-0.5 text-xs font-semibold text-[var(--state-success)]">
        Save 20%
      </span>
    </div>
  );
}

function PricingCard({
  tier,
  annual,
}: {
  tier: Tier;
  annual: boolean;
}) {
  const isPopular = tier.popular;
  const isStudent = tier.id === "student";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.moderate, ease: easing.out }}
      className={cn(
        "relative flex flex-col rounded-2xl border p-6 transition-colors",
        isPopular
          ? "border-[var(--primary)] bg-[var(--surface)] shadow-lg shadow-[var(--primary)]/10"
          : isStudent
            ? "border-emerald-500/50 bg-[var(--surface)]"
            : "border-[var(--border)] bg-[var(--surface)]",
      )}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--primary)] px-3 py-0.5 text-xs font-semibold text-white">
          Most Popular
        </div>
      )}

      {isStudent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-0.5 text-xs font-semibold text-white">
          .edu Required
        </div>
      )}

      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            isPopular
              ? "bg-[var(--primary)]/15 text-[var(--primary)]"
              : isStudent
                ? "bg-emerald-500/15 text-emerald-500"
                : "bg-[var(--elevated)] text-[var(--foreground-muted)]",
          )}
        >
          {tier.icon}
        </div>
        <h3 className="text-lg font-semibold text-[var(--foreground)]">
          {tier.name}
        </h3>
      </div>

      <p className="mb-6 text-sm text-[var(--foreground-muted)]">
        {tier.description}
      </p>

      {/* Price */}
      <div className="mb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={annual ? "annual" : "monthly"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: duration.normal }}
            className="flex items-baseline gap-1"
          >
            <span className="text-4xl font-bold text-[var(--foreground)]">
              {formatPrice(tier.monthlyPrice, annual)}
            </span>
            {tier.monthlyPrice > 0 && (
              <span className="text-sm text-[var(--foreground-muted)]">
                /mo{tier.perSeat ? " per seat" : ""}
              </span>
            )}
          </motion.div>
        </AnimatePresence>
        {tier.monthlyPrice > 0 && annual && (
          <p className="mt-1 text-xs text-[var(--foreground-subtle)]">
            Billed ${Math.round(tier.monthlyPrice * 12 * 0.8)}/year
            {tier.perSeat ? " per seat" : ""}
          </p>
        )}
        {tier.monthlyPrice === 0 && !isStudent && (
          <p className="mt-1 text-xs text-[var(--foreground-subtle)]">
            Free forever
          </p>
        )}
        {isStudent && (
          <p className="mt-1 text-xs text-emerald-500">
            Free with verified .edu email
          </p>
        )}
      </div>

      {/* CTA */}
      {tier.currentPlan ? (
        <div className="mb-6 flex h-10 items-center justify-center rounded-md border border-[var(--border)] text-sm font-medium text-[var(--foreground-muted)]">
          Current Plan
        </div>
      ) : (
        <Link
          href={tier.ctaHref}
          className={cn(
            "mb-6 flex h-10 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
            isPopular
              ? "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
              : isStudent
                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                : "border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--elevated)]",
          )}
        >
          {tier.cta}
        </Link>
      )}

      {/* Features */}
      <ul className="flex-1 space-y-3">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--state-success)]" />
            <span className="text-[var(--foreground-muted)]">{feature}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function ComparisonTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-left">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th className="pb-3 pr-4 text-sm font-semibold text-[var(--foreground)]">
              Feature
            </th>
            <th className="pb-3 px-4 text-center text-sm font-semibold text-[var(--foreground)]">
              Free
            </th>
            <th className="pb-3 px-4 text-center text-sm font-semibold text-emerald-500">
              Student
            </th>
            <th className="pb-3 px-4 text-center text-sm font-semibold text-[var(--primary)]">
              Pro
            </th>
            <th className="pb-3 pl-4 text-center text-sm font-semibold text-[var(--foreground)]">
              Team
            </th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON.map((row) => (
            <tr key={row.label} className="border-b border-[var(--border)]/50">
              <td className="py-3 pr-4 text-sm text-[var(--foreground-muted)]">
                {row.label}
              </td>
              <td className="py-3 px-4 text-center">
                <CellValue value={row.free} />
              </td>
              <td className="py-3 px-4 text-center">
                <CellValue value={row.student} />
              </td>
              <td className="py-3 px-4 text-center">
                <CellValue value={row.pro} />
              </td>
              <td className="py-3 pl-4 text-center">
                <CellValue value={row.team} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CompetitiveComparison() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-left">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th className="pb-3 pr-4 text-sm font-semibold text-[var(--foreground)]">
              Feature
            </th>
            <th className="pb-3 px-4 text-sm font-semibold text-[var(--primary)]">
              Architex
            </th>
            <th className="pb-3 px-4 text-sm font-semibold text-[var(--foreground-muted)]">
              PaperDraw
            </th>
            <th className="pb-3 pl-4 text-center text-sm font-semibold text-[var(--foreground)]">
              Advantage
            </th>
          </tr>
        </thead>
        <tbody>
          {COMPETITIVE_COMPARISON.map((row) => (
            <tr key={row.feature} className="border-b border-[var(--border)]/50">
              <td className="py-3 pr-4 text-sm font-medium text-[var(--foreground)]">
                {row.feature}
              </td>
              <td className="py-3 px-4 text-sm text-[var(--foreground-muted)]">
                {row.architex}
              </td>
              <td className="py-3 px-4 text-sm text-[var(--foreground-subtle)]">
                {row.paperDraw}
              </td>
              <td className="py-3 pl-4 text-center">
                <AdvantageBadge advantage={row.advantage} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 text-center text-xs text-[var(--foreground-subtle)]">
        Comparison based on publicly available feature lists as of April 2026.
      </p>
    </div>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-2xl space-y-2">
      {FAQS.map((faq, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={faq.q}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)]"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 p-4 text-left text-sm font-medium text-[var(--foreground)] transition-colors hover:text-[var(--primary)]"
              aria-expanded={isOpen}
            >
              {faq.q}
              <svg
                className={cn(
                  "h-4 w-4 shrink-0 text-[var(--foreground-muted)] transition-transform",
                  isOpen && "rotate-180",
                )}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                />
              </svg>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: duration.normal, ease: easing.inOut }}
                  className="overflow-hidden"
                >
                  <p className="px-4 pb-4 text-sm leading-relaxed text-[var(--foreground-muted)]">
                    {faq.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function PricingContent() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/landing"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-[var(--foreground-muted)] transition-colors hover:text-[var(--primary)]"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
          Home
        </Link>

        {/* Header */}
        <header className="mb-10 text-center">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Plans for Every Engineer
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[var(--foreground-muted)]">
            Start free and scale as your skills grow. Students get full Pro
            access free with a .edu email. Upgrade anytime for unlimited
            simulations, AI hints, and team collaboration.
          </p>
        </header>

        {/* Billing toggle */}
        <div className="mb-10">
          <BillingToggle annual={annual} onToggle={() => setAnnual((a) => !a)} />
        </div>

        {/* Pricing cards -- 4 columns on large screens */}
        <div className="mb-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier) => (
            <PricingCard key={tier.id} tier={tier} annual={annual} />
          ))}
        </div>

        {/* Feature comparison table */}
        <section className="mb-20">
          <h2 className="mb-6 text-center text-2xl font-bold tracking-tight">
            Feature Comparison
          </h2>
          <p className="mx-auto mb-8 max-w-lg text-center text-sm text-[var(--foreground-muted)]">
            {FEATURE_GATES.length} features across all tiers. Student tier includes
            all Pro features at no cost.
          </p>
          <ComparisonTable />
        </section>

        {/* Competitive comparison vs PaperDraw */}
        <section className="mb-20">
          <h2 className="mb-6 text-center text-2xl font-bold tracking-tight">
            Architex vs PaperDraw
          </h2>
          <p className="mx-auto mb-8 max-w-lg text-center text-sm text-[var(--foreground-muted)]">
            Architex is a learning platform, not just a diagramming tool.
            See how we stack up feature by feature.
          </p>
          <CompetitiveComparison />
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="mb-6 text-center text-2xl font-bold tracking-tight">
            Frequently Asked Questions
          </h2>
          <FAQSection />
        </section>

        {/* Bottom CTA */}
        <section className="mb-8 text-center">
          <p className="mb-4 text-[var(--foreground-muted)]">
            Ready to build like a senior engineer?
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}
