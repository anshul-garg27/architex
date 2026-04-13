"use client";

/**
 * LLD Data Context — provides pattern/demo/problem data to all LLD child components.
 *
 * Instead of threading data through 10+ levels of props, this context makes
 * the API-backed data available to any LLD component that needs it.
 *
 * Usage in child components:
 *   const { patterns, solidDemos } = useLLDDataContext();
 */

import { createContext, useContext, type ReactNode } from "react";
import type { DesignPattern, SOLIDDemo, LLDProblem } from "@/lib/lld";

interface LLDDataContextValue {
  patterns: DesignPattern[];
  solidDemos: SOLIDDemo[];
  problems: LLDProblem[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sequenceExamples: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stateMachineExamples: any[];
  isLoading: boolean;
}

const LLDDataContext = createContext<LLDDataContextValue | null>(null);

export function LLDDataProvider({
  value,
  children,
}: {
  value: LLDDataContextValue;
  children: ReactNode;
}) {
  return (
    <LLDDataContext.Provider value={value}>{children}</LLDDataContext.Provider>
  );
}

export function useLLDDataContext(): LLDDataContextValue {
  const ctx = useContext(LLDDataContext);
  if (!ctx) {
    throw new Error("useLLDDataContext must be used within LLDDataProvider");
  }
  return ctx;
}
