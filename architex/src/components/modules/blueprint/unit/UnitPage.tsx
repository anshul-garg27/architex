"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useUnit } from "@/hooks/blueprint/useUnit";
import { useUnitProgress } from "@/hooks/blueprint/useUnitProgress";
import { useUnitScrollSync } from "@/hooks/blueprint/useUnitScrollSync";
import { useBlueprintAnalytics } from "@/hooks/blueprint/useBlueprintAnalytics";
import {
  blueprintSectionOpened,
  blueprintUnitOpened,
} from "@/lib/analytics/blueprint-events";
import { SectionRouter } from "./SectionRouter";
import { UnitTOC } from "./UnitTOC";
import { UnitProgressBar } from "./UnitProgressBar";
import { UnitErrorState } from "./UnitErrorState";
import type { BlueprintSectionType } from "@/db/schema";

interface Props {
  unitSlug: string;
}

/**
 * Top-level unit page. Owns:
 *   - Unit + progress fetches
 *   - Scroll sync + section-opened analytics
 *   - Progress writes per section completion
 */
export function UnitPage({ unitSlug }: Props) {
  const router = useRouter();
  const { data: unit, isLoading, error } = useUnit(unitSlug);
  const {
    progress,
    completedSectionIds,
    markSectionCompleted,
  } = useUnitProgress(unitSlug);
  const { track } = useBlueprintAnalytics();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const openedRef = useRef(false);
  const openedSectionsRef = useRef<Set<string>>(new Set());

  const onReadScrollDeep = useCallback(
    (sectionId: string) => {
      if (completedSectionIds.has(sectionId)) return;
      markSectionCompleted(sectionId);
    },
    [completedSectionIds, markSectionCompleted],
  );

  const { activeSectionId } = useUnitScrollSync(containerRef, {
    onReadScrollDeep,
  });

  const sections = useMemo(
    () => unit?.recipeJson?.sections ?? [],
    [unit],
  );
  const activeIdx = useMemo(() => {
    if (!activeSectionId) return 0;
    return Math.max(
      0,
      sections.findIndex((s) => s.id === activeSectionId),
    );
  }, [activeSectionId, sections]);

  // Fire unit_opened once per mount.
  useEffect(() => {
    if (openedRef.current || !unit) return;
    openedRef.current = true;
    track(
      blueprintUnitOpened({
        unitSlug,
        entry: "map",
      }),
    );
  }, [unit, unitSlug, track]);

  // Fire section_opened once per section entering view.
  useEffect(() => {
    if (!activeSectionId) return;
    if (openedSectionsRef.current.has(activeSectionId)) return;
    openedSectionsRef.current.add(activeSectionId);
    const sec = sections.find((s) => s.id === activeSectionId);
    if (sec) {
      track(
        blueprintSectionOpened({
          unitSlug,
          sectionId: sec.id,
          sectionType: sec.type as BlueprintSectionType,
        }),
      );
    }
  }, [activeSectionId, sections, track, unitSlug]);

  // Auto-route to the completion screen once every section is complete.
  useEffect(() => {
    if (!unit) return;
    if (sections.length === 0) return;
    const allDone = sections.every((s) => completedSectionIds.has(s.id));
    if (allDone && progress?.state !== "completed") {
      router.push(`/modules/blueprint/unit/${unitSlug}/complete`);
    }
  }, [unit, sections, completedSectionIds, progress, router, unitSlug]);

  const scrollToSection = useCallback((id: string) => {
    const container = containerRef.current;
    if (!container) return;
    const target = container.querySelector(
      `[data-blueprint-section="${id}"]`,
    ) as HTMLElement | null;
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  // Initial scroll to URL-hashed section, if present.
  useEffect(() => {
    if (!unit || sections.length === 0) return;
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const match = hash.startsWith("#section-") ? hash.slice("#section-".length) : null;
    if (match) {
      const t = setTimeout(() => scrollToSection(match), 50);
      return () => clearTimeout(t);
    }
  }, [unit, sections, scrollToSection]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[720px] px-6 py-16">
        <div className="h-6 w-40 animate-pulse rounded bg-foreground/5" />
        <div className="mt-4 h-4 w-full animate-pulse rounded bg-foreground/5" />
        <div className="mt-2 h-4 w-11/12 animate-pulse rounded bg-foreground/5" />
        <div className="mt-2 h-4 w-10/12 animate-pulse rounded bg-foreground/5" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <p className="text-sm text-red-700 dark:text-red-300">
          {String(error)}
        </p>
      </div>
    );
  }

  if (!unit) {
    return <UnitErrorState kind="not-found" />;
  }

  if (sections.length === 0) {
    return <UnitErrorState kind="empty-recipe" />;
  }

  const remainingReadSecs = sections
    .filter((s) => s.type === "read" && !completedSectionIds.has(s.id))
    .reduce((sum, s) => {
      const params = s.params as { estimatedSeconds?: number };
      return sum + (params.estimatedSeconds ?? 90);
    }, 0);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Sticky unit header */}
      <div className="shrink-0 border-b border-border/30 bg-background/60 px-4 py-3">
        <div className="mx-auto flex w-full max-w-[1040px] items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-500">
              Unit {unit.ordinal} · {unit.tags[0] ?? "blueprint"}
            </p>
            <h1 className="mt-0.5 font-serif text-xl font-semibold italic text-foreground">
              {unit.title}
            </h1>
          </div>
          <Link
            href="/modules/blueprint"
            className="shrink-0 text-xs text-foreground-muted hover:text-foreground"
          >
            ← Curriculum
          </Link>
        </div>
      </div>

      <UnitProgressBar
        completed={completedSectionIds.size}
        total={sections.length}
        activeIdx={activeIdx}
        estimatedSecondsLeft={remainingReadSecs}
      />

      {/* Two-column body */}
      <div className="flex flex-1 min-h-0">
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto scroll-smooth"
          data-blueprint-unit-scroll
        >
          {sections.map((section) => (
            <SectionRouter
              key={section.id}
              unitSlug={unit.slug}
              section={section}
              isCompleted={completedSectionIds.has(section.id)}
              onInteractResult={(score) =>
                markSectionCompleted(section.id, { score })
              }
              onRetainScheduled={() => markSectionCompleted(section.id)}
              onReflectSaved={() => markSectionCompleted(section.id)}
              onApplyMarkedDone={() => markSectionCompleted(section.id)}
              onPracticeFinished={() => markSectionCompleted(section.id)}
              onCheckpointPassed={(score) =>
                markSectionCompleted(section.id, { score })
              }
            />
          ))}

          {/* Inline "Finish →" nudge after the last section */}
          <div className="mx-auto my-10 max-w-[720px] px-6">
            <Link
              href={`/modules/blueprint/unit/${unit.slug}/complete`}
              className="group flex items-center justify-between gap-4 rounded-xl border border-indigo-400/40 bg-gradient-to-br from-indigo-500/5 to-sky-500/5 px-5 py-4 transition-colors hover:border-indigo-400/80"
            >
              <div>
                <p className="text-xs uppercase tracking-wider text-indigo-500">
                  When you&apos;re ready
                </p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">
                  Finish the unit →
                </p>
                <p className="text-xs text-foreground-muted">
                  Celebrate the work and pick up the next one.
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-indigo-500 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        <div className="hidden xl:block">
          <UnitTOC
            sections={sections}
            activeSectionId={activeSectionId}
            completedSectionIds={completedSectionIds}
            onJump={scrollToSection}
          />
        </div>
      </div>
    </div>
  );
}
