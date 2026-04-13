"use client";

import { useCallback, useState, useEffect } from "react";

const LS_PREFIX = "architex-first-encounter-";

/**
 * useFirstEncounter -- tracks whether a feature has been encountered before.
 * On first use, returns `show: true`. After dismissal, persists to localStorage
 * so the tooltip never appears again for that feature.
 */
export function useFirstEncounter(featureId: string): {
  show: boolean;
  dismiss: () => void;
} {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const key = `${LS_PREFIX}${featureId}`;
      const seen = localStorage.getItem(key);
      if (!seen) {
        setShow(true);
      }
    } catch {
      // localStorage unavailable
    }
  }, [featureId]);

  const dismiss = useCallback(() => {
    setShow(false);
    try {
      localStorage.setItem(`${LS_PREFIX}${featureId}`, "1");
    } catch {
      // localStorage unavailable
    }
  }, [featureId]);

  return { show, dismiss };
}
