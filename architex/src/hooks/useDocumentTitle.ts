"use client";

import { useEffect } from "react";
import { useUIStore } from "@/stores/ui-store";

/**
 * Module labels for the document title.
 */
const MODULE_TITLES: Record<string, string> = {
  "system-design": "System Design",
  algorithms: "Algorithms",
  "data-structures": "Data Structures",
  lld: "Low-Level Design",
  database: "Database",
  distributed: "Distributed Systems",
  networking: "Networking",
  os: "OS Concepts",
  concurrency: "Concurrency",
  security: "Security",
  "ml-design": "ML Design",
  interview: "Interview",
  "knowledge-graph": "Knowledge Graph",
};

/**
 * Updates `document.title` whenever the active module changes.
 */
export function useDocumentTitle() {
  const activeModule = useUIStore((s) => s.activeModule);

  useEffect(() => {
    const label = MODULE_TITLES[activeModule] ?? activeModule;
    document.title = `${label} - Architex`;
  }, [activeModule]);
}
