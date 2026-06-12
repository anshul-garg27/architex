"use client";

import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Briefcase, Target, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { useDifficulty, type Difficulty } from "./_DifficultyContext";

interface TierMeta {
  key: Difficulty;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
}

const TIERS: ReadonlyArray<TierMeta> = [
  {
    key: "beginner",
    label: "New to LLD",
    shortLabel: "Beginner",
    description: "OOP-familiar; first time learning design patterns. Glossary stays open.",
    icon: Sparkles,
  },
  {
    key: "intermediate",
    label: "Placement prep",
    shortLabel: "Placement",
    description: "1–3 yr / final-year student cracking your first big-company offer. The default.",
    icon: Briefcase,
  },
  {
    key: "senior",
    label: "Senior · skip basics",
    shortLabel: "Senior",
    description: "3+ yr. You want depth and tradeoffs, not primers. We hide the scaffolding.",
    icon: Target,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  Inline segmented selector (sticky header pill)
// ─────────────────────────────────────────────────────────────────────────────

export function DifficultyBadge() {
  const { tier, setTier } = useDifficulty();
  return (
    <div
      role="radiogroup"
      aria-label="Reading difficulty"
      className="flex items-center gap-0.5 rounded-full border border-border bg-surface/60 p-0.5"
    >
      {TIERS.map((t) => {
        const isActive = tier === t.key;
        return (
          <button
            key={t.key}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => setTier(t.key)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[10.5px] font-medium tracking-wider uppercase transition-colors min-h-[24px]",
              isActive
                ? "bg-[hsl(258_78%_64%)] text-primary-foreground shadow-[0_0_12px_hsl(258_78%_64%/0.4)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.shortLabel}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  First-visit onboarding modal — pick your track
// ─────────────────────────────────────────────────────────────────────────────

export function DifficultyOnboarding() {
  const { setTier, hasChosen, ready } = useDifficulty();
  if (!ready || hasChosen) return null;
  return (
    <AnimatePresence>
      <motion.div
        key="onb"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-background/85 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onb-title"
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mx-4 w-full max-w-lg rounded-2xl border border-border bg-elevated p-7 shadow-2xl"
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[hsl(258_85%_76%)]">
            Pick your track
          </p>
          <h2 id="onb-title" className="mt-2 text-2xl font-semibold tracking-tight">
            How much LLD do you already know?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We&apos;ll adapt scaffolding, glossary, and pacing. You can switch any time.
          </p>
          <div className="mt-5 space-y-2">
            {TIERS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTier(t.key)}
                className="group flex w-full items-start gap-3 rounded-xl border border-border bg-surface/60 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[hsl(258_78%_64%)]/50 hover:bg-surface hover:shadow-[0_0_24px_-6px_hsl(258_78%_64%/0.4)]"
              >
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-[hsl(258_78%_64%)]/30 bg-[hsl(258_78%_64%)]/10 text-[hsl(258_85%_76%)]">
                  <t.icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{t.label}</p>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
                    {t.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
          <p className="mt-5 text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            stored locally · change anytime in the header
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Full TIERS export for callers who need labels
// ─────────────────────────────────────────────────────────────────────────────

export { TIERS };
