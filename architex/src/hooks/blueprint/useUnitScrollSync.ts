"use client";

import { useEffect, useState } from "react";

/**
 * IntersectionObserver-based scroll syncer for the Unit Renderer.
 *
 * Watches every DOM node matching `[data-blueprint-section]` inside
 * the container. As sections enter the viewport above 50% visible,
 * the hook:
 *   - updates the active section state
 *   - replaces the URL hash with `#section-<id>` (non-push)
 *   - calls `onReadScrollDeep(sectionId)` when a `read` section
 *     reaches ≥90% visible (auto-completion signal)
 */
export function useUnitScrollSync(
  containerRef: React.RefObject<HTMLElement | null>,
  {
    onReadScrollDeep,
  }: {
    onReadScrollDeep?: (sectionId: string) => void;
  },
): {
  activeSectionId: string | null;
} {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const sections = Array.from(
      container.querySelectorAll<HTMLElement>("[data-blueprint-section]"),
    );
    if (sections.length === 0) return;

    const seen = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.getAttribute("data-blueprint-section");
          if (!id) continue;

          if (entry.intersectionRatio >= 0.5) {
            setActiveSectionId(id);
            if (typeof window !== "undefined") {
              const next = `#section-${id}`;
              if (window.location.hash !== next) {
                window.history.replaceState(
                  null,
                  "",
                  window.location.pathname + window.location.search + next,
                );
              }
            }
          }

          if (entry.intersectionRatio >= 0.9 && !seen.has(id)) {
            const type = entry.target.getAttribute("data-section-type");
            if (type === "read") {
              seen.add(id);
              onReadScrollDeep?.(id);
            }
          }
        }
      },
      {
        root: container,
        threshold: [0, 0.25, 0.5, 0.75, 0.9, 1],
      },
    );

    for (const s of sections) observer.observe(s);
    return () => observer.disconnect();
  }, [containerRef, onReadScrollDeep]);

  return { activeSectionId };
}
