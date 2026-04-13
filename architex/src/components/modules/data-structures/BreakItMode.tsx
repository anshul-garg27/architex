"use client";

import React, { memo, useState, useCallback, useMemo } from "react";
import { Flame, ChevronDown, ChevronRight, Target, Lightbulb, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

import { buildBST } from "@/lib/data-structures/bst-ds";
import type { BSTNode } from "@/lib/data-structures/bst-ds";
import { simpleHash, createHashTable } from "@/lib/data-structures/hash-table";
import {
  createBloomFilter,
  bloomInsert,
  bloomCheck,
} from "@/lib/data-structures/bloom-filter";
import type { BloomFilterState } from "@/lib/data-structures/bloom-filter";

// ── Challenge definitions ─────────────────────────────────────

interface BreakChallenge {
  id: string;
  ds: string;
  title: string;
  description: string;
  target: number;
  metric: string;
  hint: string;
  inputType: "numbers" | "strings";
  inputCount: number;
  placeholder: string;
}

const BREAK_CHALLENGES: BreakChallenge[] = [
  {
    id: "bst-degenerate",
    ds: "bst",
    title: "Degenerate the BST",
    description:
      "Insert 7 values that make the BST as TALL as possible (height = 6)",
    target: 6,
    metric: "height",
    hint: "What happens if you insert values in sorted order?",
    inputType: "numbers",
    inputCount: 7,
    placeholder: "e.g. 1, 2, 3, 4, 5, 6, 7",
  },
  {
    id: "hash-collision",
    ds: "hash-table",
    title: "Maximize Collisions",
    description: "Insert 5 keys that ALL hash to the same bucket (capacity = 8)",
    target: 5,
    metric: "maxChainLength",
    hint: "What keys would produce the same hash(key) % 8? Try keys whose char codes sum to multiples of 8.",
    inputType: "strings",
    inputCount: 5,
    placeholder: "e.g. abc, xyz, hello, world, test",
  },
  {
    id: "bloom-fp",
    ds: "bloom-filter",
    title: "Trigger a False Positive",
    description:
      'Insert 3 items, then find a string NOT inserted that returns "probably yes"',
    target: 1,
    metric: "falsePositives",
    hint: "Insert items that set many bits, then try similar strings. The query string goes last.",
    inputType: "strings",
    inputCount: 4,
    placeholder: "e.g. cat, dog, fish, rat (last one is the query)",
  },
];

// ── Metric computation ────────────────────────────────────────

function bstHeight(node: BSTNode | null): number {
  if (!node) return -1;
  return 1 + Math.max(bstHeight(node.left), bstHeight(node.right));
}

function computeMetric(
  challenge: BreakChallenge,
  rawValues: string[],
): { score: number; detail: string } {
  switch (challenge.id) {
    case "bst-degenerate": {
      const nums = rawValues.map(Number).filter((n) => !Number.isNaN(n));
      if (nums.length !== challenge.inputCount) {
        return { score: 0, detail: `Need exactly ${challenge.inputCount} numbers` };
      }
      const root = buildBST(nums);
      const h = bstHeight(root);
      return {
        score: h,
        detail: `Tree height = ${h}. ${h >= challenge.target ? "Maximum degeneration achieved!" : `Target is ${challenge.target}. Try inserting in sorted order.`}`,
      };
    }
    case "hash-collision": {
      const keys = rawValues.map((s) => s.trim()).filter(Boolean);
      if (keys.length !== challenge.inputCount) {
        return { score: 0, detail: `Need exactly ${challenge.inputCount} keys` };
      }
      const capacity = 8;
      const bucketCounts: Record<number, number> = {};
      for (const key of keys) {
        const idx = simpleHash(key, capacity);
        bucketCounts[idx] = (bucketCounts[idx] || 0) + 1;
      }
      const maxChain = Math.max(...Object.values(bucketCounts));
      const bestBucket = Object.entries(bucketCounts).find(
        ([, v]) => v === maxChain,
      );
      return {
        score: maxChain,
        detail: `Longest chain = ${maxChain} in bucket ${bestBucket?.[0] ?? "?"}. ${maxChain >= challenge.target ? "All keys collide -- perfect!" : `Target is ${challenge.target} in a single bucket.`}`,
      };
    }
    case "bloom-fp": {
      const items = rawValues.map((s) => s.trim()).filter(Boolean);
      if (items.length !== challenge.inputCount) {
        return { score: 0, detail: `Need exactly ${challenge.inputCount} strings (last is the query)` };
      }
      const insertItems = items.slice(0, 3);
      const queryItem = items[3];
      let filter: BloomFilterState = createBloomFilter(32, 3);
      for (const item of insertItems) {
        const result = bloomInsert(filter, item);
        filter = result.snapshot as BloomFilterState;
      }
      const checkResult = bloomCheck(filter, queryItem);
      const lastStep = checkResult.steps[checkResult.steps.length - 1];
      const isFP =
        lastStep.description.includes("PROBABLY") &&
        !insertItems.includes(queryItem);
      return {
        score: isFP ? 1 : 0,
        detail: isFP
          ? `"${queryItem}" triggers a FALSE POSITIVE! The Bloom filter thinks it was inserted, but it was not.`
          : `"${queryItem}" ${insertItems.includes(queryItem) ? "was actually inserted (not a false positive)" : "correctly returned 'not in set'. Try different strings."}`,
      };
    }
    default:
      return { score: 0, detail: "Unknown challenge" };
  }
}

// ── Challenge card ────────────────────────────────────────────

const ChallengeCard = memo(function ChallengeCard({
  challenge,
}: {
  challenge: BreakChallenge;
}) {
  const [input, setInput] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    detail: string;
  } | null>(null);

  const handleTry = useCallback(() => {
    const values = input.split(",").map((s) => s.trim());
    const res = computeMetric(challenge, values);
    setResult(res);
  }, [input, challenge]);

  const handleReset = useCallback(() => {
    setInput("");
    setResult(null);
  }, []);

  const isSuccess = result !== null && result.score >= challenge.target;

  return (
    <div className="rounded-lg border border-border bg-elevated p-3 space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-400">
          {challenge.ds}
        </span>
        <span className="text-sm font-medium text-foreground">
          {challenge.title}
        </span>
        {isSuccess && (
          <span className="ml-auto rounded bg-green-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-green-400">
            Solved
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-foreground-muted leading-relaxed">
        {challenge.description}
      </p>

      {/* Input */}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={challenge.placeholder}
        className="w-full rounded border border-border bg-background px-2.5 py-1.5 font-mono text-xs text-foreground placeholder:text-foreground-subtle focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        onKeyDown={(e) => {
          if (e.key === "Enter") handleTry();
        }}
      />

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                "rounded px-2.5 py-1.5 text-xs",
                isSuccess
                  ? "bg-green-500/10 text-green-400"
                  : "bg-orange-500/10 text-orange-400",
              )}
            >
              <div className="flex items-center gap-2">
                <Target className="h-3 w-3 shrink-0" />
                <span className="font-mono">
                  {challenge.metric}: {result.score} / {challenge.target}
                </span>
              </div>
              <p className="mt-1 text-foreground-muted">{result.detail}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleTry}
          disabled={!input.trim()}
          className="flex items-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/5 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Flame className="h-3 w-3" />
          Break It
        </button>
        {result && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-foreground-muted transition-colors hover:bg-accent/50"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        )}
        <button
          onClick={() => setShowHint((prev) => !prev)}
          className="ml-auto flex items-center gap-1 text-[10px] text-foreground-subtle hover:text-foreground-muted transition-colors"
        >
          <Lightbulb className="h-3 w-3" />
          {showHint ? "Hide Hint" : "Hint"}
          {showHint ? (
            <ChevronDown className="h-2.5 w-2.5" />
          ) : (
            <ChevronRight className="h-2.5 w-2.5" />
          )}
        </button>
      </div>

      {/* Hint */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded bg-yellow-500/5 border border-yellow-500/20 px-2.5 py-1.5 text-xs text-yellow-400/80">
              {challenge.hint}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ── Main component ────────────────────────────────────────────

const BreakItMode = memo(function BreakItMode() {
  const solvedCount = 0; // Could be tracked via localStorage

  return (
    <div className="px-4 py-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-foreground-muted">
          <Flame className="h-3.5 w-3.5 text-red-400" />
          <span className="font-medium">Adversarial Mode</span>
        </div>
        <span className="text-[10px] text-foreground-subtle">
          {BREAK_CHALLENGES.length} challenges
        </span>
      </div>
      <p className="text-[10px] text-foreground-subtle leading-relaxed">
        Find the worst-case inputs that break data structure performance.
        Understanding pathological cases is key to choosing the right DS.
      </p>

      {/* Challenge cards */}
      <div className="space-y-3">
        {BREAK_CHALLENGES.map((challenge) => (
          <ChallengeCard key={challenge.id} challenge={challenge} />
        ))}
      </div>
    </div>
  );
});

export { BreakItMode };
