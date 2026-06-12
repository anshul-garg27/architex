"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

export type Difficulty = "beginner" | "intermediate" | "senior";

const STORAGE_KEY = "architex:difficulty";

interface DifficultyContextValue {
  tier: Difficulty;
  setTier: (t: Difficulty) => void;
  hasChosen: boolean;
  ready: boolean;
}

const DifficultyContext = createContext<DifficultyContextValue>({
  tier: "intermediate",
  setTier: () => {},
  hasChosen: false,
  ready: false,
});

export function DifficultyProvider({ children }: { children: ReactNode }) {
  const [tier, setTierState] = useState<Difficulty>("intermediate");
  const [hasChosen, setHasChosen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "beginner" || stored === "intermediate" || stored === "senior") {
        setTierState(stored);
        setHasChosen(true);
      }
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  const setTier = useCallback((t: Difficulty) => {
    setTierState(t);
    setHasChosen(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, t);
    } catch {
      // ignore
    }
  }, []);

  return (
    <DifficultyContext.Provider value={{ tier, setTier, hasChosen, ready }}>
      {children}
    </DifficultyContext.Provider>
  );
}

export function useDifficulty(): DifficultyContextValue {
  return useContext(DifficultyContext);
}
