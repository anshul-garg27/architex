'use client';

/**
 * ER Diagram Palette  (DBL-010)
 *
 * Draggable palette for ER diagram mode. Items can be dragged onto the
 * React Flow canvas. Categories: Entities, Relationships, Attributes.
 */

import React, { memo, useCallback, type DragEvent } from 'react';
import {
  Square,
  Copy,
  Diamond,
  ShieldCheck,
  Circle,
  KeyRound,
  CircleDot,
  GitFork,
  Combine,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Palette Item Type ─────────────────────────────────────────

export type ERPaletteCategory = 'entities' | 'relationships' | 'attributes';

export interface ERPaletteItem {
  id: string;
  label: string;
  description: string;
  category: ERPaletteCategory;
  /** React Flow node type to create on canvas. */
  nodeType: string;
  /** Lucide icon name (resolved to component at render). */
  icon: string;
  /** Default data payload merged into the new node. */
  defaultData: Record<string, unknown>;
}

// ── Category Metadata ─────────────────────────────────────────

const CATEGORY_LABELS: Record<ERPaletteCategory, string> = {
  entities: 'Entities',
  relationships: 'Relationships',
  attributes: 'Attributes',
};

const CATEGORY_COLORS: Record<ERPaletteCategory, string> = {
  entities: 'var(--node-compute)',
  relationships: 'var(--state-success)',
  attributes: 'var(--foreground-muted)',
};

// ── Palette Items ─────────────────────────────────────────────

const ER_PALETTE_ITEMS: ERPaletteItem[] = [
  // Entities
  {
    id: 'er-entity',
    label: 'Strong Entity',
    description: 'Regular entity with single border',
    category: 'entities',
    nodeType: 'er-entity',
    icon: 'Square',
    defaultData: { entityName: 'Entity', attributes: [] },
  },
  {
    id: 'er-weak-entity',
    label: 'Weak Entity',
    description: 'Entity with double border, depends on owner',
    category: 'entities',
    nodeType: 'er-weak-entity',
    icon: 'Copy',
    defaultData: { entityName: 'WeakEntity', attributes: [] },
  },

  // Relationships
  {
    id: 'er-relationship',
    label: 'Relationship',
    description: 'Diamond connecting two entities',
    category: 'relationships',
    nodeType: 'er-relationship',
    icon: 'Diamond',
    defaultData: {
      relationshipName: 'relates',
      cardinality: '1:N' as const,
      isIdentifying: false,
    },
  },
  {
    id: 'er-identifying-relationship',
    label: 'Identifying Relationship',
    description: 'Double diamond for weak entity relationship',
    category: 'relationships',
    nodeType: 'er-relationship',
    icon: 'ShieldCheck',
    defaultData: {
      relationshipName: 'identifies',
      cardinality: '1:N' as const,
      isIdentifying: true,
    },
  },

  // Attributes
  {
    id: 'er-attr-regular',
    label: 'Attribute',
    description: 'Regular attribute (ellipse)',
    category: 'attributes',
    nodeType: 'er-entity',
    icon: 'Circle',
    defaultData: {
      entityName: 'Entity',
      attributes: [
        { id: 'attr-1', name: 'attr', isPK: false, isFK: false, type: 'string' },
      ],
    },
  },
  {
    id: 'er-attr-key',
    label: 'Key Attribute',
    description: 'Primary key attribute (underlined)',
    category: 'attributes',
    nodeType: 'er-entity',
    icon: 'KeyRound',
    defaultData: {
      entityName: 'Entity',
      attributes: [
        { id: 'pk-1', name: 'id', isPK: true, isFK: false, type: 'int' },
      ],
    },
  },
  {
    id: 'er-attr-multivalued',
    label: 'Multivalued Attribute',
    description: 'Double ellipse for multivalued',
    category: 'attributes',
    nodeType: 'er-entity',
    icon: 'CircleDot',
    defaultData: {
      entityName: 'Entity',
      attributes: [
        { id: 'mv-1', name: 'phones', isPK: false, isFK: false, type: 'string', isMultivalued: true },
      ],
    },
  },
  {
    id: 'er-attr-derived',
    label: 'Derived Attribute',
    description: 'Dashed ellipse for derived value',
    category: 'attributes',
    nodeType: 'er-entity',
    icon: 'GitFork',
    defaultData: {
      entityName: 'Entity',
      attributes: [
        { id: 'dv-1', name: 'age', isPK: false, isFK: false, type: 'int', isDerived: true },
      ],
    },
  },
  {
    id: 'er-attr-composite',
    label: 'Composite Attribute',
    description: 'Attribute with sub-attributes',
    category: 'attributes',
    nodeType: 'er-entity',
    icon: 'Combine',
    defaultData: {
      entityName: 'Entity',
      attributes: [
        {
          id: 'comp-1',
          name: 'address',
          isPK: false,
          isFK: false,
          type: 'composite',
          isComposite: true,
          subAttributes: [
            { id: 'sub-1', name: 'street', isPK: false, isFK: false, type: 'string' },
            { id: 'sub-2', name: 'city', isPK: false, isFK: false, type: 'string' },
          ],
        },
      ],
    },
  },
];

// ── Icon Registry ─────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Square,
  Copy,
  Diamond,
  ShieldCheck,
  Circle,
  KeyRound,
  CircleDot,
  GitFork,
  Combine,
};

function getIcon(iconName: string): React.ComponentType<{ className?: string }> {
  return ICON_MAP[iconName] ?? Circle;
}

// ── Group helper ──────────────────────────────────────────────

function groupByCategory(
  items: ERPaletteItem[],
): Partial<Record<ERPaletteCategory, ERPaletteItem[]>> {
  const grouped: Partial<Record<ERPaletteCategory, ERPaletteItem[]>> = {};
  for (const item of items) {
    if (!grouped[item.category]) {
      grouped[item.category] = [];
    }
    grouped[item.category]!.push(item);
  }
  return grouped;
}

// ── Palette Item Card ─────────────────────────────────────────

interface ERPaletteItemCardProps {
  item: ERPaletteItem;
}

function ERPaletteItemCard({ item }: ERPaletteItemCardProps) {
  const Icon = getIcon(item.icon);
  const categoryColor = CATEGORY_COLORS[item.category];

  const onDragStart = useCallback(
    (e: DragEvent) => {
      e.dataTransfer.setData(
        'application/architex-er-node',
        JSON.stringify({
          nodeType: item.nodeType,
          label: item.label,
          category: item.category,
          defaultData: item.defaultData,
        }),
      );
      e.dataTransfer.effectAllowed = 'move';
    },
    [item],
  );

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={cn(
        'flex cursor-grab items-center gap-2.5 rounded-lg border px-2.5 py-2 transition-colors active:cursor-grabbing',
        'border-transparent hover:border-border hover:bg-elevated',
      )}
      title={item.description}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
        style={{ backgroundColor: `color-mix(in srgb, ${categoryColor} 15%, transparent)` }}
      >
        <span style={{ color: categoryColor }}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">
          {item.label}
        </div>
        <div className="truncate text-xs text-foreground-muted">
          {item.description}
        </div>
      </div>
    </div>
  );
}

// ── ERPalette Component ───────────────────────────────────────

export const ERPalette = memo(function ERPalette({
  className,
}: {
  className?: string;
}) {
  const grouped = groupByCategory(ER_PALETTE_ITEMS);

  const categoryOrder: ERPaletteCategory[] = ['entities', 'relationships', 'attributes'];

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Header */}
      <div className="border-b border-sidebar-border px-3 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          ER Diagram Elements
        </h2>
      </div>

      {/* Item list */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {categoryOrder.map((category) => {
          const items = grouped[category];
          if (!items || items.length === 0) return null;
          return (
            <div key={category} className="mb-3">
              <div className="mb-1 flex items-center gap-2 px-2.5 py-1">
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[category] }}
                />
                <span className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
                  {CATEGORY_LABELS[category]}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                {items.map((item) => (
                  <ERPaletteItemCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="border-t border-sidebar-border px-3 py-2">
        <p className="text-[10px] text-foreground-subtle">
          Drag items onto the canvas to add them
        </p>
      </div>
    </div>
  );
});

// Re-export items for external use
export { ER_PALETTE_ITEMS };
