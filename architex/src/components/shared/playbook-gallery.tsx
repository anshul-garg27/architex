'use client';

import React, { memo, useState, useMemo, useCallback } from 'react';
import {
  PLAYBOOKS,
  getPlaybookCategories,
  type ArchitecturePlaybook,
} from '@/lib/patterns/playbook';

// ── Category badge colours ────────────────────────────────────

const CATEGORY_STYLES: Record<string, { bg: string; text: string }> = {
  Caching: { bg: 'rgba(99, 102, 241, 0.15)', text: 'rgb(129, 140, 248)' },
  Resilience: { bg: 'rgba(244, 63, 94, 0.15)', text: 'rgb(244, 63, 94)' },
  Architecture: { bg: 'rgba(52, 211, 153, 0.15)', text: 'rgb(52, 211, 153)' },
  'Distributed Transactions': {
    bg: 'rgba(251, 146, 60, 0.15)',
    text: 'rgb(251, 146, 60)',
  },
  Infrastructure: {
    bg: 'rgba(168, 85, 247, 0.15)',
    text: 'rgb(168, 85, 247)',
  },
  Processing: { bg: 'rgba(56, 189, 248, 0.15)', text: 'rgb(56, 189, 248)' },
};

const DEFAULT_STYLE = { bg: 'rgba(161, 161, 170, 0.15)', text: 'rgb(161, 161, 170)' };

function getCategoryStyle(category: string) {
  return CATEGORY_STYLES[category] ?? DEFAULT_STYLE;
}

// ── Detail Panel ──────────────────────────────────────────────

interface DetailPanelProps {
  playbook: ArchitecturePlaybook;
  onClose: () => void;
  onLoad: (playbook: ArchitecturePlaybook) => void;
}

const DetailPanel = memo(function DetailPanel({
  playbook,
  onClose,
  onLoad,
}: DetailPanelProps) {
  const catStyle = getCategoryStyle(playbook.category);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs font-medium transition-colors"
          style={{ color: 'var(--foreground-muted)' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 12L6 8l4-4" />
          </svg>
          Back
        </button>
        <button
          type="button"
          onClick={() => onLoad(playbook)}
          className="rounded-md px-3 py-1.5 text-xs font-semibold transition-colors"
          style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          Load onto Canvas
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Title + badge */}
        <div className="mb-2 flex items-start gap-2">
          <h2 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>
            {playbook.name}
          </h2>
          <span
            className="mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ backgroundColor: catStyle.bg, color: catStyle.text }}
          >
            {playbook.category}
          </span>
        </div>

        {/* Description */}
        <p className="mb-5 text-sm leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>
          {playbook.description}
        </p>

        {/* When to Use */}
        <Section title="When to Use">
          <ul className="list-disc space-y-1 pl-4">
            {playbook.whenToUse.map((item, i) => (
              <li key={i} className="text-xs leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>
                {item}
              </li>
            ))}
          </ul>
        </Section>

        {/* When NOT to Use */}
        <Section title="When NOT to Use">
          <ul className="list-disc space-y-1 pl-4">
            {playbook.whenNotToUse.map((item, i) => (
              <li key={i} className="text-xs leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>
                {item}
              </li>
            ))}
          </ul>
        </Section>

        {/* Failure Modes */}
        <Section title="Failure Modes">
          <ul className="space-y-1.5">
            {playbook.failureModes.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>
                <span className="mt-0.5 shrink-0 text-[10px]" style={{ color: 'rgb(244, 63, 94)' }}>&#9888;</span>
                {item}
              </li>
            ))}
          </ul>
        </Section>

        {/* Theory */}
        <Section title="Underlying Theory">
          <p className="text-xs leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>
            {playbook.theory}
          </p>
        </Section>

        {/* Stats */}
        <div className="mt-4 flex gap-4">
          <Stat label="Nodes" value={playbook.nodes.length} />
          <Stat label="Edges" value={playbook.edges.length} />
        </div>
      </div>
    </div>
  );
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--foreground-subtle)' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-lg font-bold" style={{ color: 'var(--primary)' }}>{value}</span>
      <span className="text-[10px] font-medium" style={{ color: 'var(--foreground-subtle)' }}>{label}</span>
    </div>
  );
}

// ── Playbook Card ─────────────────────────────────────────────

interface PlaybookCardProps {
  playbook: ArchitecturePlaybook;
  onSelect: (playbook: ArchitecturePlaybook) => void;
  onLoad: (playbook: ArchitecturePlaybook) => void;
}

const PlaybookCard = memo(function PlaybookCard({
  playbook,
  onSelect,
  onLoad,
}: PlaybookCardProps) {
  const catStyle = getCategoryStyle(playbook.category);

  return (
    <div
      className="group flex w-full flex-col gap-2 rounded-lg border p-4 text-left transition-all duration-200"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)',
        color: 'var(--foreground)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--primary)';
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          '0 0 12px 2px color-mix(in srgb, var(--primary) 20%, transparent)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-tight">{playbook.name}</h3>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{ backgroundColor: catStyle.bg, color: catStyle.text }}
        >
          {playbook.category}
        </span>
      </div>

      {/* Description */}
      <p
        className="line-clamp-2 text-xs leading-relaxed"
        style={{ color: 'var(--foreground-muted)' }}
      >
        {playbook.description}
      </p>

      {/* Footer row */}
      <div className="flex items-center justify-between pt-1">
        <span
          className="text-[10px] font-medium"
          style={{ color: 'var(--foreground-subtle)' }}
        >
          {playbook.nodes.length} nodes &middot; {playbook.edges.length} edges
        </span>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(playbook);
            }}
            className="rounded px-2 py-1 text-[10px] font-medium transition-colors"
            style={{ backgroundColor: 'var(--muted)', color: 'var(--foreground-muted)' }}
          >
            Learn More
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLoad(playbook);
            }}
            className="rounded px-2 py-1 text-[10px] font-semibold transition-colors"
            style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            Load
          </button>
        </div>
      </div>
    </div>
  );
});

PlaybookCard.displayName = 'PlaybookCard';

// ── PlaybookGallery ───────────────────────────────────────────

export interface PlaybookGalleryProps {
  /** Called when the user clicks "Load" or "Load onto Canvas". */
  onLoadPlaybook: (playbook: ArchitecturePlaybook) => void;
}

const PlaybookGallery = memo(function PlaybookGallery({
  onLoadPlaybook,
}: PlaybookGalleryProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [detail, setDetail] = useState<ArchitecturePlaybook | null>(null);

  const categories = useMemo(() => getPlaybookCategories(), []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return PLAYBOOKS.filter((p) => {
      if (q) {
        const haystack =
          `${p.name} ${p.description} ${p.category} ${p.whenToUse.join(' ')}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (category && p.category !== category) return false;
      return true;
    });
  }, [search, category]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value),
    [],
  );

  // ── Detail view ──
  if (detail) {
    return (
      <DetailPanel
        playbook={detail}
        onClose={() => setDetail(null)}
        onLoad={onLoadPlaybook}
      />
    );
  }

  // ── Gallery view ──
  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      {/* Search input */}
      <div className="shrink-0 px-1">
        <input
          type="text"
          placeholder="Search playbooks..."
          value={search}
          onChange={handleSearchChange}
          aria-label="Search playbooks"
          className="w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--primary)]"
          style={{
            backgroundColor: 'var(--muted)',
            borderColor: 'var(--border)',
            color: 'var(--foreground)',
          }}
        />
      </div>

      {/* Category filter */}
      <div className="flex shrink-0 flex-wrap items-center gap-1.5 px-1">
        <span
          className="text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--foreground-subtle)' }}
        >
          Category
        </span>
        <button
          type="button"
          onClick={() => setCategory('')}
          className="rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors"
          style={{
            backgroundColor: category === '' ? 'var(--primary)' : 'var(--muted)',
            color: category === '' ? 'var(--primary-foreground)' : 'var(--foreground-muted)',
          }}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className="rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors"
            style={{
              backgroundColor: category === cat ? 'var(--primary)' : 'var(--muted)',
              color: category === cat ? 'var(--primary-foreground)' : 'var(--foreground-muted)',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="shrink-0 px-1">
        <span
          className="text-[11px]"
          style={{ color: 'var(--foreground-subtle)' }}
        >
          {filtered.length} playbook{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-1 pb-4">
        {filtered.length === 0 ? (
          <div
            className="flex h-32 items-center justify-center text-sm"
            style={{ color: 'var(--foreground-muted)' }}
          >
            No playbooks match your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filtered.map((p) => (
              <PlaybookCard
                key={p.id}
                playbook={p}
                onSelect={setDetail}
                onLoad={onLoadPlaybook}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

PlaybookGallery.displayName = 'PlaybookGallery';

export default PlaybookGallery;
