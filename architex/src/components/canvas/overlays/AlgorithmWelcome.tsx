"use client";

import { memo, useCallback } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  BarChart3,
  Share2,
  GitBranch,
  Grid3X3,
  Type,
  Hexagon,
  Play,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { springs } from "@/lib/constants/motion";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────

type AlgorithmCategory =
  | "array"
  | "graph"
  | "tree"
  | "dp"
  | "string"
  | "backtracking"
  | "geometry";

export interface AlgorithmWelcomeProps {
  category: AlgorithmCategory;
  onDemo: (category: string) => void;
}

// ── Per-category content ─────────────────────────────────────

interface WelcomeContent {
  icon: LucideIcon;
  question: string;
  demoLabel: string;
  demoCategory: string;
}

const WELCOME_CONTENT: Record<AlgorithmCategory, WelcomeContent> = {
  array: {
    icon: BarChart3,
    question: "What does Bubble Sort sound like?",
    demoLabel: "Watch Demo \u2014 Bubble Sort",
    demoCategory: "sorting",
  },
  graph: {
    icon: Share2,
    question: "How does Google Maps find the shortest path?",
    demoLabel: "Watch Demo \u2014 BFS Traversal",
    demoCategory: "graph",
  },
  tree: {
    icon: GitBranch,
    question: "How does a database find your data in milliseconds?",
    demoLabel: "Watch Demo \u2014 BST Insert",
    demoCategory: "tree",
  },
  dp: {
    icon: Grid3X3,
    question: "How does spell-check know what you meant?",
    demoLabel: "Watch Demo \u2014 Fibonacci",
    demoCategory: "dp",
  },
  string: {
    icon: Type,
    question: "How does Ctrl+F search a million lines instantly?",
    demoLabel: "Watch Demo \u2014 KMP Search",
    demoCategory: "string",
  },
  backtracking: {
    icon: Grid3X3,
    question: "Can you place 8 queens on a chessboard without conflict?",
    demoLabel: "Watch Demo \u2014 4-Queens",
    demoCategory: "backtracking",
  },
  geometry: {
    icon: Hexagon,
    question: "What shape wraps around a cloud of points?",
    demoLabel: "Watch Demo \u2014 Convex Hull",
    demoCategory: "geometry",
  },
};

// ── Component ────────────────────────────────────────────────

export const AlgorithmWelcome = memo(function AlgorithmWelcome({
  category,
  onDemo,
}: AlgorithmWelcomeProps) {
  const content = WELCOME_CONTENT[category];
  const Icon = content.icon;
  const prefersReducedMotion = useReducedMotion();

  const handleDemo = useCallback(() => {
    onDemo(content.demoCategory);
  }, [onDemo, content.demoCategory]);

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.bouncy}
      className={cn(
        "flex flex-col items-center gap-6 text-center",
        "rounded-2xl border border-border/30 p-8",
        "bg-background/60 backdrop-blur-md",
        "max-w-md",
      )}
    >
      {/* Category icon */}
      <Icon className="h-12 w-12 text-foreground-subtle opacity-30" />

      {/* Engaging question */}
      <h3 className="text-xl font-semibold text-foreground">
        {content.question}
      </h3>

      {/* Demo button */}
      <button
        onClick={handleDemo}
        className={cn(
          "flex items-center gap-2 rounded-lg px-6 py-3",
          "bg-primary text-white",
          "text-sm font-medium",
          "transition-colors hover:bg-primary/90",
        )}
      >
        <Play className="h-4 w-4" />
        {content.demoLabel}
      </button>

      {/* Keyboard hint */}
      <p className="text-xs text-foreground-subtle">
        or press Space to start
      </p>
    </motion.div>
  );
});
