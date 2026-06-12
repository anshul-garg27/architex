// ---------------------------------------------------------------------------
// Incident Replays index — /incidents
// Lists every replay in the registry as a card.
// ---------------------------------------------------------------------------

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { INCIDENTS } from "@/lib/incidents";

export const metadata: Metadata = {
  title: "Incident Replays — Famous Outages, Beat by Beat | Architex",
  description:
    "Replay the internet's most famous outages on an interactive architecture canvas — watch the cascade unfold, then test whether your own design would survive it.",
};

export default function IncidentsIndexPage() {
  const incidents = Object.values(INCIDENTS);

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:py-20">
        <p className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--primary)]">
          Incident replays
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Famous outages, beat by beat
        </h1>
        <p className="mt-4 max-w-2xl text-base text-[var(--foreground-muted)] sm:text-lg">
          Real postmortems replayed on a live architecture canvas. Watch the cascade unfold —
          then find out if your design would survive the same day.
        </p>

        <div className="mt-10 grid gap-4">
          {incidents.map(({ meta, timeline }) => (
            <Link
              key={meta.slug}
              href={`/incidents/${meta.slug}`}
              className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-colors hover:border-[var(--primary)]/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] sm:p-8"
            >
              <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-wider text-[var(--foreground-muted)]">
                <span>{meta.company}</span>
                <span aria-hidden>·</span>
                <span>{meta.date}</span>
                <span aria-hidden>·</span>
                <span>{meta.durationLabel}</span>
              </div>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                {meta.title}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--foreground-muted)]">
                {meta.tagline}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--primary)]">
                Replay the outage ({timeline.length} beats)
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
