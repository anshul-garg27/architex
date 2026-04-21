"use client";

import { useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  useBlueprintStore,
  type BlueprintSurface,
  type BlueprintToolkitTool,
} from "@/stores/blueprint-store";

export interface BlueprintRouteView {
  surface: BlueprintSurface;
  unitSlug: string | null;
  sectionId: string | null;
  tool: BlueprintToolkitTool | null;
  entityId: string | null;
  subMode: string | null;
  /** Last segment after entityId — "compare" | "drill" | "complete" | null */
  pageSegment: string | null;
}

export interface NavigateTarget {
  surface: BlueprintSurface;
  unitSlug?: string | null;
  sectionId?: string | null;
  tool?: BlueprintToolkitTool | null;
  entityId?: string | null;
  subMode?: string | null;
  pageSegment?: string | null;
}

const BASE = "/modules/blueprint";
const VALID_TOOLS: BlueprintToolkitTool[] = [
  "patterns",
  "problems",
  "review",
];

function emptyView(): BlueprintRouteView {
  return {
    surface: "journey",
    unitSlug: null,
    sectionId: null,
    tool: null,
    entityId: null,
    subMode: null,
    pageSegment: null,
  };
}

export function parseBlueprintPath(pathname: string): BlueprintRouteView {
  if (!pathname.startsWith(BASE)) return emptyView();
  const rest = pathname.slice(BASE.length).replace(/^\//, "");
  const segments = rest.split("/").filter(Boolean);

  if (segments.length === 0) return { ...emptyView(), surface: "journey" };

  if (segments[0] === "welcome") {
    return { ...emptyView(), surface: "journey", pageSegment: "welcome" };
  }

  if (segments[0] === "unit" && segments[1]) {
    return {
      surface: "journey",
      unitSlug: segments[1],
      sectionId: null,
      tool: null,
      entityId: null,
      subMode: null,
      pageSegment: segments[2] ?? null,
    };
  }

  if (segments[0] === "toolkit") {
    const candidate = segments[1] ?? null;
    const tool = VALID_TOOLS.includes(candidate as BlueprintToolkitTool)
      ? (candidate as BlueprintToolkitTool)
      : null;
    return {
      surface: "toolkit",
      unitSlug: null,
      sectionId: null,
      tool,
      entityId: segments[2] ?? null,
      subMode: null,
      pageSegment: segments[3] ?? null,
    };
  }

  if (segments[0] === "progress") {
    return {
      ...emptyView(),
      surface: "progress",
      pageSegment: segments[1] ?? null,
    };
  }

  return emptyView();
}

export function buildBlueprintPath(t: NavigateTarget): string {
  if (t.surface === "journey") {
    if (t.unitSlug) {
      const root = `${BASE}/unit/${t.unitSlug}`;
      if (t.pageSegment === "complete") return `${root}/complete`;
      return t.sectionId ? `${root}#section-${t.sectionId}` : root;
    }
    if (t.pageSegment === "welcome") return `${BASE}/welcome`;
    return BASE;
  }

  if (t.surface === "toolkit") {
    let path = `${BASE}/toolkit`;
    if (t.tool) path += `/${t.tool}`;
    if (t.entityId) path += `/${t.entityId}`;
    if (t.pageSegment) path += `/${t.pageSegment}`;
    return path;
  }

  if (t.surface === "progress") {
    return t.pageSegment
      ? `${BASE}/progress/${t.pageSegment}`
      : `${BASE}/progress`;
  }

  return BASE;
}

/**
 * Read-only view of the current URL plus a `navigate` helper.
 * URL is the single source of truth; the store is a cache that
 * this hook keeps consistent on every pathname change.
 */
export function useBlueprintRoute(): BlueprintRouteView & {
  navigate: (target: NavigateTarget) => void;
} {
  const pathname = usePathname() ?? BASE;
  const router = useRouter();

  const view = useMemo(() => parseBlueprintPath(pathname), [pathname]);

  const setSurface = useBlueprintStore((s) => s.setSurface);
  const setCurrentUnit = useBlueprintStore((s) => s.setCurrentUnit);
  const openTool = useBlueprintStore((s) => s.openTool);
  const closeTool = useBlueprintStore((s) => s.closeTool);

  // URL → store sync on every pathname change.
  useEffect(() => {
    setSurface(view.surface);
    if (view.surface === "journey") {
      setCurrentUnit(view.unitSlug, view.sectionId);
      closeTool();
    } else if (view.surface === "toolkit") {
      if (view.tool) {
        openTool(view.tool, view.entityId, view.subMode);
      } else {
        closeTool();
      }
    } else {
      closeTool();
    }
  }, [
    view.surface,
    view.unitSlug,
    view.sectionId,
    view.tool,
    view.entityId,
    view.subMode,
    setSurface,
    setCurrentUnit,
    openTool,
    closeTool,
  ]);

  const navigate = useCallback(
    (target: NavigateTarget) => {
      const url = buildBlueprintPath(target);
      router.push(url);
      // Optimistic store update — avoid UI flicker while Next.js
      // transitions the URL.
      setSurface(target.surface);
      if (target.surface === "journey") {
        setCurrentUnit(target.unitSlug ?? null, target.sectionId ?? null);
      }
      if (target.surface === "toolkit") {
        if (target.tool) {
          openTool(target.tool, target.entityId, target.subMode);
        } else {
          closeTool();
        }
      }
    },
    [router, setSurface, setCurrentUnit, openTool, closeTool],
  );

  return { ...view, navigate };
}
