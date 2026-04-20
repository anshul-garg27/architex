"use client";

/**
 * useBookmarks — CRUD for the per-pattern bookmarks strip.
 *
 * Optimistic updates for toggle and delete — the UI flips instantly and
 * reconciles with the server response. Failures roll back and surface an
 * error message for a tooltip.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface Bookmark {
  id: string;
  userId?: string;
  patternSlug: string;
  sectionId: string;
  anchorId: string;
  anchorLabel: string;
  note: string | null;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface ToggleRequest {
  patternSlug: string;
  sectionId: string;
  anchorId: string;
  anchorLabel: string;
  note?: string | null;
}

export function useBookmarks(patternSlug: string | null) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inFlight = useRef<Set<string>>(new Set());

  // Fetch on pattern change
  useEffect(() => {
    let cancelled = false;
    setError(null);
    if (!patternSlug) {
      setBookmarks([]);
      return;
    }
    setIsLoading(true);
    fetch(
      `/api/lld/bookmarks?patternSlug=${encodeURIComponent(patternSlug)}`,
    )
      .then((r) => (r.ok ? r.json() : { bookmarks: [] }))
      .then((data) => {
        if (cancelled) return;
        setBookmarks(Array.isArray(data?.bookmarks) ? data.bookmarks : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [patternSlug]);

  const toggle = useCallback(
    async (req: ToggleRequest): Promise<"on" | "off" | null> => {
      const key = `${req.patternSlug}:${req.anchorId}`;
      if (inFlight.current.has(key)) return null;
      inFlight.current.add(key);
      setError(null);

      const existing = bookmarks.find(
        (b) =>
          b.patternSlug === req.patternSlug && b.anchorId === req.anchorId,
      );
      // Optimistic toggle
      if (existing) {
        setBookmarks((bs) => bs.filter((b) => b.id !== existing.id));
      }

      try {
        const res = await fetch("/api/lld/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(req),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data?.toggled === "on" && data.bookmark) {
          setBookmarks((bs) => [data.bookmark as Bookmark, ...bs]);
          return "on";
        }
        return "off";
      } catch (err) {
        // Roll back
        if (existing) setBookmarks((bs) => [existing, ...bs]);
        setError(err instanceof Error ? err.message : String(err));
        return null;
      } finally {
        inFlight.current.delete(key);
      }
    },
    [bookmarks],
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      const prev = bookmarks;
      setBookmarks((bs) => bs.filter((b) => b.id !== id));
      try {
        const res = await fetch(
          `/api/lld/bookmarks/${encodeURIComponent(id)}`,
          { method: "DELETE" },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return true;
      } catch (err) {
        setBookmarks(prev);
        setError(err instanceof Error ? err.message : String(err));
        return false;
      }
    },
    [bookmarks],
  );

  const updateNote = useCallback(
    async (id: string, note: string | null): Promise<boolean> => {
      try {
        const res = await fetch(
          `/api/lld/bookmarks/${encodeURIComponent(id)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ note }),
          },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data?.bookmark) {
          setBookmarks((bs) =>
            bs.map((b) => (b.id === id ? (data.bookmark as Bookmark) : b)),
          );
        }
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        return false;
      }
    },
    [],
  );

  const isBookmarked = useCallback(
    (anchorId: string): boolean => {
      return bookmarks.some((b) => b.anchorId === anchorId);
    },
    [bookmarks],
  );

  const sortedByRecent = useMemo(
    () =>
      [...bookmarks].sort((a, b) => {
        const ta = new Date(a.createdAt).getTime();
        const tb = new Date(b.createdAt).getTime();
        return tb - ta;
      }),
    [bookmarks],
  );

  return {
    bookmarks: sortedByRecent,
    isLoading,
    error,
    toggle,
    remove,
    updateNote,
    isBookmarked,
  };
}
