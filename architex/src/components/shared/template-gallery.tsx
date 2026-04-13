'use client';

import React, { memo, useState, useMemo, useCallback, useRef } from 'react';
import {
  SYSTEM_DESIGN_TEMPLATES,
  type DiagramTemplate,
} from '@/lib/templates';
import { useIsMobile, useIsTablet } from '@/hooks/use-media-query';

// ── Category badge colours ─────────────────────────────────

const CATEGORY_STYLES: Record<
  DiagramTemplate['category'],
  { bg: string; text: string }
> = {
  classic: { bg: 'bg-node-networking/15', text: 'text-node-networking' },
  modern: { bg: 'bg-node-storage/15', text: 'text-node-storage' },
  infrastructure: { bg: 'bg-node-messaging/15', text: 'text-node-messaging' },
  advanced: { bg: 'bg-node-security/15', text: 'text-node-security' },
};

// ── Difficulty stars ───────────────────────────────────────

function DifficultyStars({ level }: { level: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`Difficulty ${level} of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className="text-[10px]"
          style={{
            color:
              i < level
                ? 'var(--primary)'
                : 'var(--foreground-subtle)',
          }}
        >
          &#9733;
        </span>
      ))}
    </span>
  );
}

// ── Template Card ──────────────────────────────────────────

interface TemplateCardProps {
  template: DiagramTemplate;
  onSelect: (template: DiagramTemplate) => void;
}

const TemplateCard = memo(function TemplateCard({
  template,
  onSelect,
}: TemplateCardProps) {
  const catStyle = CATEGORY_STYLES[template.category];
  const isMobile = useIsMobile();

  const handleClick = useCallback(() => {
    onSelect(template);
  }, [onSelect, template]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`group flex w-full flex-col gap-2 rounded-lg border border-border bg-surface text-foreground text-left transition-all duration-200 hover:scale-[1.01] hover:border-primary hover:shadow-[0_0_12px_2px_color-mix(in_srgb,var(--primary)_20%,transparent)] ${
        isMobile ? 'p-5 min-h-[88px]' : 'p-4'
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-tight">
          {template.name}
        </h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${catStyle.bg} ${catStyle.text}`}
        >
          {template.category}
        </span>
      </div>

      {/* Description */}
      <p className="line-clamp-2 text-xs leading-relaxed text-foreground-muted">
        {template.description}
      </p>

      {/* Footer row */}
      <div className="flex items-center justify-between pt-1">
        <DifficultyStars level={template.difficulty} />
        <span className="text-[10px] font-medium text-foreground-subtle">
          {template.nodes.length} nodes &middot; {template.edges.length} edges
        </span>
      </div>
    </button>
  );
});

TemplateCard.displayName = 'TemplateCard';

// ── Filter Bar ─────────────────────────────────────────────

const DIFFICULTY_OPTIONS = [
  { label: 'All', value: 0 },
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4', value: 4 },
  { label: '5', value: 5 },
] as const;

const CATEGORY_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Classic', value: 'classic' },
  { label: 'Modern', value: 'modern' },
  { label: 'Infrastructure', value: 'infrastructure' },
  { label: 'Advanced', value: 'advanced' },
] as const;

// ── TemplateGallery ────────────────────────────────────────

export interface TemplateGalleryProps {
  /** Called when the user clicks a template card. */
  onSelectTemplate: (template: DiagramTemplate) => void;
}

const TemplateGallery = memo(function TemplateGallery({
  onSelectTemplate,
}: TemplateGalleryProps) {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState(0);
  const [category, setCategory] = useState('');
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return SYSTEM_DESIGN_TEMPLATES.filter((t) => {
      if (q) {
        const haystack = `${t.name} ${t.description} ${t.tags.join(' ')}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (difficulty > 0 && t.difficulty !== difficulty) return false;
      if (category && t.category !== category) return false;
      return true;
    });
  }, [search, difficulty, category]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value),
    [],
  );

  // Responsive grid class: 1-col mobile, 2-col tablet, 3-col desktop
  const gridClass = isMobile
    ? 'grid grid-cols-1 gap-3'
    : isTablet
      ? 'grid grid-cols-2 gap-3'
      : 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      {/* Search input — full-width on mobile */}
      <div className={isMobile ? 'shrink-0 px-0' : 'shrink-0 px-1'}>
        <input
          type="text"
          placeholder="Search templates..."
          value={search}
          onChange={handleSearchChange}
          aria-label="Search templates"
          className={`w-full rounded-md border outline-none transition-colors focus:border-[var(--primary)] ${
            isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2 text-sm'
          }`}
          style={{
            backgroundColor: 'var(--muted)',
            borderColor: 'var(--border)',
            color: 'var(--foreground)',
          }}
        />
      </div>

      {/* Filter row — horizontally scrollable on mobile */}
      <div
        className={
          isMobile
            ? 'flex shrink-0 gap-3 overflow-x-auto px-0 pb-1 scrollbar-none'
            : 'flex shrink-0 flex-wrap items-center gap-3 px-1'
        }
      >
        {/* Difficulty filter */}
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--foreground-subtle)' }}
          >
            Difficulty
          </span>
          <div className="flex gap-0.5">
            {DIFFICULTY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDifficulty(opt.value)}
                className={`rounded font-medium transition-colors ${
                  isMobile ? 'px-2.5 py-1.5 text-xs' : 'px-1.5 py-0.5 text-[11px]'
                }`}
                style={{
                  backgroundColor:
                    difficulty === opt.value
                      ? 'var(--primary)'
                      : 'var(--muted)',
                  color:
                    difficulty === opt.value
                      ? 'var(--primary-foreground)'
                      : 'var(--foreground-muted)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category filter */}
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--foreground-subtle)' }}
          >
            Category
          </span>
          <div className="flex gap-0.5">
            {CATEGORY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCategory(opt.value)}
                className={`rounded font-medium transition-colors ${
                  isMobile ? 'px-2.5 py-1.5 text-xs' : 'px-1.5 py-0.5 text-[11px]'
                }`}
                style={{
                  backgroundColor:
                    category === opt.value
                      ? 'var(--primary)'
                      : 'var(--muted)',
                  color:
                    category === opt.value
                      ? 'var(--primary-foreground)'
                      : 'var(--foreground-muted)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className={isMobile ? 'shrink-0 px-0' : 'shrink-0 px-1'}>
        <span
          className="text-[11px]"
          style={{ color: 'var(--foreground-subtle)' }}
        >
          {filtered.length} template{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Grid — responsive columns, swipeable on mobile */}
      <div
        ref={scrollRef}
        className={
          isMobile
            ? 'flex-1 overflow-y-auto px-0 pb-4'
            : 'flex-1 overflow-y-auto px-1 pb-4'
        }
      >
        {filtered.length === 0 ? (
          <div
            className="flex h-32 items-center justify-center text-sm"
            style={{ color: 'var(--foreground-muted)' }}
          >
            No templates match your filters.
          </div>
        ) : isMobile ? (
          /* Mobile: horizontal carousel swipe or vertical list */
          <div className={gridClass}>
            {filtered.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                onSelect={onSelectTemplate}
              />
            ))}
          </div>
        ) : (
          <div className={gridClass}>
            {filtered.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                onSelect={onSelectTemplate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

TemplateGallery.displayName = 'TemplateGallery';

export default TemplateGallery;
