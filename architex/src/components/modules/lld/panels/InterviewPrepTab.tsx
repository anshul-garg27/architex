"use client";

/**
 * InterviewPrepTab — interview tips, common mistakes, and Q&A for a pattern.
 * Reads pattern.interviewTips[] and pattern.commonMistakes[] from static data,
 * plus fetches interview-qa content from the DB via useCatalog.
 */

import React, { memo, useState, useMemo } from "react";
import { Lightbulb, AlertTriangle, ChevronDown, ChevronRight, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCatalog } from "@/hooks/use-content";
import type { ContentDetailItem } from "@/hooks/use-content";
import type { DesignPattern } from "@/lib/lld";

// ── Q&A Types ───────────────────────────────────────────────

interface InterviewQuestion {
  question: string;
  answer: string;
  difficulty?: "warmup" | "core" | "deep-dive";
  followUps?: string[];
}

const DIFFICULTY_STYLES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  warmup: { label: "Warmup", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
  core: { label: "Core", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  "deep-dive": { label: "Deep Dive", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" },
};

// ── Expandable Q&A Card ─────────────────────────────────────

const QACard = memo(function QACard({ q }: { q: InterviewQuestion }) {
  const [expanded, setExpanded] = useState(false);
  const style = DIFFICULTY_STYLES[q.difficulty ?? "core"] ?? DIFFICULTY_STYLES.core;

  return (
    <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm overflow-hidden transition-all">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors hover:bg-elevated"
      >
        {expanded ? (
          <ChevronDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground-subtle" />
        ) : (
          <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground-subtle" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium leading-relaxed text-foreground">{q.question}</p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold",
            style.color, style.bg, style.border,
          )}
        >
          {style.label}
        </span>
      </button>
      {expanded && (
        <div className="border-t border-border/20 px-3 py-2.5 space-y-2">
          <p className="text-[11px] leading-relaxed text-foreground-muted pl-5.5">
            {q.answer}
          </p>
          {q.followUps && q.followUps.length > 0 && (
            <div className="pl-5.5 space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle">
                Follow-up Questions
              </p>
              {q.followUps.map((fu, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <MessageSquare className="mt-0.5 h-3 w-3 shrink-0 text-primary/60" />
                  <p className="text-[11px] leading-relaxed text-foreground-subtle">{fu}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// ── Main Component ──────────────────────────────────────────

interface InterviewPrepTabProps {
  pattern: DesignPattern;
}

export const InterviewPrepTab = memo(function InterviewPrepTab({
  pattern,
}: InterviewPrepTabProps) {
  const tips = pattern.interviewTips ?? [];
  const mistakes = pattern.commonMistakes ?? [];
  const deepQA = pattern.interviewDepth ?? [];
  const complexity = pattern.complexityAnalysis;
  const rationale = pattern.designRationale;
  const variations = pattern.commonVariations ?? [];
  const antiPatterns = pattern.antiPatterns ?? [];

  // Fetch interview Q&A from content API
  const { data: qaData, isLoading: qaLoading } = useCatalog("lld", "interview-qa", { full: true });

  const questions: InterviewQuestion[] = useMemo(() => {
    // Merge DB-fetched Q&A with enriched interviewDepth
    const dbQuestions: InterviewQuestion[] = [];
    if (qaData?.items) {
      const item = qaData.items.find(
        (i) => (i as unknown as ContentDetailItem).slug === pattern.id,
      ) as unknown as ContentDetailItem | undefined;
      if (item?.content) {
        dbQuestions.push(...((item.content.questions ?? []) as InterviewQuestion[]));
      }
    }
    // Add deep Q&A from pattern enrichment
    const enrichedQuestions: InterviewQuestion[] = deepQA.map((q) => ({
      question: q.question,
      answer: q.expectedAnswer,
      difficulty: "deep-dive" as const,
      followUps: q.followUp ? [q.followUp] : undefined,
    }));
    return [...dbQuestions, ...enrichedQuestions];
  }, [qaData, pattern.id, deepQA]);

  const hasStaticContent = tips.length > 0 || mistakes.length > 0 || complexity || rationale || variations.length > 0;
  const hasQA = questions.length > 0;

  if (!hasStaticContent && !hasQA && !qaLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-8">
        <p className="text-xs text-foreground-subtle">
          No interview tips available yet for {pattern.name}.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border/30 px-4 py-2">
        <Lightbulb className="h-3.5 w-3.5 text-primary" />
        <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
          Interview Prep: {pattern.name}
        </span>
      </div>
      <div className="flex-1 overflow-auto px-4 py-3 space-y-4">
        {tips.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle">
              Interview Tips
            </h3>
            <div className="grid gap-2">
              {tips.map((tip, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 backdrop-blur-sm p-3"
                >
                  <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <p className="text-xs leading-relaxed text-foreground-muted">
                    {tip}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        {mistakes.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle">
              Common Mistakes
            </h3>
            <div className="grid gap-2">
              {mistakes.map((mistake, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-sm p-3"
                >
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                  <p className="text-xs leading-relaxed text-foreground-muted">
                    {mistake}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interview Q&A from DB */}
        {qaLoading && (
          <div className="flex items-center gap-2 py-2">
            <MessageSquare className="h-3.5 w-3.5 animate-pulse text-primary" />
            <span className="text-[10px] text-foreground-subtle">Loading Q&amp;A...</span>
          </div>
        )}
        {/* Design Rationale */}
        {rationale && (
          <div className="space-y-1.5">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Design Rationale
            </h3>
            <pre className="whitespace-pre-wrap rounded-xl border border-border/30 bg-elevated/30 px-3 py-2 text-[11px] leading-relaxed text-foreground-muted">{rationale}</pre>
          </div>
        )}
        {/* Complexity Analysis */}
        {complexity && (
          <div className="space-y-1.5">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Complexity Analysis
            </h3>
            <pre className="whitespace-pre-wrap rounded-xl border border-border/30 bg-elevated/30 px-3 py-2 text-[11px] leading-relaxed text-foreground-muted font-mono">{complexity}</pre>
          </div>
        )}
        {/* Common Variations */}
        {variations.length > 0 && (
          <div className="space-y-1.5">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle">
              Common Variations
            </h3>
            <ul className="space-y-1 text-[11px] text-foreground-muted">
              {variations.map((v, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="mt-1.5 h-1 w-1 rounded-full bg-primary/60 shrink-0" />
                  {v}
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Anti-Patterns */}
        {antiPatterns.length > 0 && (
          <div className="space-y-1.5">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-red-700 dark:text-red-300">
              Anti-Patterns to Avoid
            </h3>
            <ul className="space-y-1 text-[11px] text-foreground-muted">
              {antiPatterns.map((a, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-red-700 dark:text-red-400" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Interview Q&A */}
        {hasQA && (
          <div className="space-y-2">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle">
              Interview Questions
            </h3>
            <div className="grid gap-2">
              {questions.map((q, i) => (
                <QACard key={i} q={q} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
