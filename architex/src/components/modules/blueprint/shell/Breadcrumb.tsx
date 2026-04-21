"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useBlueprintRoute } from "@/hooks/blueprint/useBlueprintRoute";

function humanize(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

interface Crumb {
  label: string;
  href?: string;
}

/**
 * Breadcrumb reads the current URL and synthesizes an up-the-tree
 * trail. Every intermediate segment is clickable; the leaf is text.
 */
export function Breadcrumb() {
  const view = useBlueprintRoute();

  const crumbs: Crumb[] = [
    { label: "Blueprint", href: "/modules/blueprint" },
  ];

  if (view.surface === "journey" && view.unitSlug) {
    crumbs.push({
      label: `Unit · ${humanize(view.unitSlug)}`,
      href: `/modules/blueprint/unit/${view.unitSlug}`,
    });
    if (view.pageSegment === "complete") {
      crumbs.push({ label: "Complete" });
    }
  } else if (view.surface === "toolkit") {
    crumbs.push({
      label: "Toolkit",
      href: "/modules/blueprint/toolkit",
    });
    if (view.tool) {
      crumbs.push({
        label: humanize(view.tool),
        href: `/modules/blueprint/toolkit/${view.tool}`,
      });
      if (view.entityId) {
        crumbs.push({ label: humanize(view.entityId) });
      }
    }
  } else if (view.surface === "progress") {
    crumbs.push({
      label: "Progress",
      href: "/modules/blueprint/progress",
    });
    if (view.pageSegment) {
      crumbs.push({ label: humanize(view.pageSegment) });
    }
  }

  return (
    <nav
      className="flex items-center gap-1 text-xs text-foreground-muted"
      aria-label="Breadcrumb"
    >
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && (
            <ChevronRight className="h-3 w-3 opacity-50" aria-hidden />
          )}
          {c.href ? (
            <Link
              href={c.href}
              className="hover:text-foreground hover:underline underline-offset-2"
            >
              {c.label}
            </Link>
          ) : (
            <span className="text-foreground">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
