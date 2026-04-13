"use client";

import React, { memo, useState, useCallback, useRef, type DragEvent } from "react";
import {
  Search,
  LayoutTemplate,
  Download,
  Upload,
  Globe,
  Server,
  Zap,
  Database,
  GitBranch,
  Shield,
  Globe2,
  Monitor,
  HardDrive,
  Cog,
  FileJson,
  Table2,
  GripVertical,
  GitFork,
  TrendingUp,
  ListOrdered,
  Megaphone,
  Route,
  AtSign,
  Radio,
  ShieldAlert,
  ClipboardList,
  Workflow,
  Brain,
  Smartphone,
  ExternalLink,
  BarChart3,
  ScrollText,
  Activity,
  KeyRound,
  Gauge,
  Lock,
  Box,
} from "lucide-react";
import {
  PALETTE_ITEMS,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  groupByCategory,
  type PaletteItem,
  type NodeCategory,
} from "@/lib/palette-items";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { useCanvasStore } from "@/stores/canvas-store";

const ICON_REGISTRY: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe, Server, Zap, Database, GitBranch, Shield, Globe2, Monitor, HardDrive, Cog, FileJson, Table2, Search, GitFork, TrendingUp, ListOrdered, Megaphone, Route, AtSign, Radio, ShieldAlert, ClipboardList, Workflow, Brain, Smartphone, ExternalLink, BarChart3, ScrollText, Activity, KeyRound, Gauge, Lock, Box,
};

function getIcon(iconName: string) {
  return ICON_REGISTRY[iconName] ?? Box;
}

interface PaletteItemCardProps {
  item: PaletteItem;
  isSelected: boolean;
  onSelect: () => void;
  itemRef: (el: HTMLDivElement | null) => void;
}

function PaletteItemCard({ item, isSelected, onSelect, itemRef }: PaletteItemCardProps) {
  const Icon = getIcon(item.icon);
  const categoryColor = CATEGORY_COLORS[item.category];

  const onDragStart = useCallback(
    (e: DragEvent) => {
      e.dataTransfer.setData(
        "application/architex-node",
        JSON.stringify({
          type: item.type,
          label: item.label,
          category: item.category,
          icon: item.icon,
          config: item.defaultConfig,
        }),
      );
      e.dataTransfer.effectAllowed = "move";
    },
    [item],
  );

  return (
    <div
      ref={itemRef}
      role="option"
      aria-selected={isSelected}
      tabIndex={isSelected ? 0 : -1}
      draggable
      onDragStart={onDragStart}
      onClick={onSelect}
      className={cn(
        "group flex cursor-grab items-center gap-2.5 rounded-lg border px-2.5 py-2 transition-colors active:cursor-grabbing",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        isSelected
          ? "border-primary/50 bg-elevated"
          : "border-transparent hover:border-border hover:bg-elevated",
      )}
      title={item.description}
    >
      <GripVertical
        className="h-4 w-4 shrink-0 text-foreground-muted/50 opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden="true"
      />
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

export const ComponentPalette = memo(function ComponentPalette() {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const announcerRef = useRef<HTMLDivElement>(null);

  const filtered = search
    ? PALETTE_ITEMS.filter(
        (item) =>
          item.label.toLowerCase().includes(search.toLowerCase()) ||
          item.description.toLowerCase().includes(search.toLowerCase()) ||
          item.category.toLowerCase().includes(search.toLowerCase()),
      )
    : PALETTE_ITEMS;

  const grouped = groupByCategory(filtered);

  // Build a flat ordered list that mirrors render order for keyboard nav
  const flatItems: PaletteItem[] = [];
  for (const items of Object.values(grouped)) {
    flatItems.push(...items);
  }

  const addNodeAtCenter = useCallback(
    (item: PaletteItem) => {
      const { addNode } = useCanvasStore.getState();
      addNode({
        id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: item.type,
        position: { x: 500, y: 350 },
        data: {
          label: item.label,
          category: item.category,
          componentType: item.type,
          icon: item.icon,
          config: { ...item.defaultConfig },
          metrics: {},
          state: "idle",
        },
      });
      if (announcerRef.current) {
        announcerRef.current.textContent = `${item.label} added to canvas`;
      }
    },
    [],
  );

  const handlePaletteKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const count = flatItems.length;
      if (count === 0) return;

      let nextIndex = selectedIndex;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          nextIndex = selectedIndex < count - 1 ? selectedIndex + 1 : 0;
          break;
        case "ArrowUp":
          e.preventDefault();
          nextIndex = selectedIndex > 0 ? selectedIndex - 1 : count - 1;
          break;
        case "Home":
          e.preventDefault();
          nextIndex = 0;
          break;
        case "End":
          e.preventDefault();
          nextIndex = count - 1;
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < count) {
            addNodeAtCenter(flatItems[selectedIndex]);
          }
          return;
        default:
          return;
      }

      setSelectedIndex(nextIndex);
      itemRefs.current[nextIndex]?.focus();
      if (announcerRef.current) {
        announcerRef.current.textContent = `${flatItems[nextIndex].label}, ${flatItems[nextIndex].description}`;
      }
    },
    [selectedIndex, flatItems, addNodeAtCenter],
  );

  // Reset selection when search changes
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setSelectedIndex(-1);
  }, []);

  // Track flat index across grouped render
  let flatIndex = -1;

  return (
    <div className="flex h-full flex-col">
      {/* SR announcer */}
      <div
        ref={announcerRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Header */}
      <div className="border-b border-sidebar-border px-3 py-3">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Components
        </h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted" />
          <input
            type="text"
            placeholder="Search components..."
            value={search}
            onChange={handleSearchChange}
            aria-label="Search components"
            className="h-8 w-full rounded-md border border-border bg-background pl-8 pr-3 text-sm text-foreground outline-none placeholder:text-foreground-subtle focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Component list */}
      <div
        role="listbox"
        aria-label="Component palette"
        className="flex-1 overflow-y-auto px-2 py-2"
        onKeyDown={handlePaletteKeyDown}
      >
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="mb-3">
            <div className="mb-1 flex items-center gap-2 px-2.5 py-1">
              <div
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: CATEGORY_COLORS[category as NodeCategory] }}
              />
              <span className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
                {CATEGORY_LABELS[category as NodeCategory]}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              {items.map((item) => {
                flatIndex++;
                const idx = flatIndex;
                return (
                  <PaletteItemCard
                    key={item.type}
                    item={item}
                    isSelected={selectedIndex === idx}
                    onSelect={() => setSelectedIndex(idx)}
                    itemRef={(el) => { itemRefs.current[idx] = el; }}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-8 text-center text-sm text-foreground-muted">
            No components match &ldquo;{search}&rdquo;
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-3 py-2 flex items-center gap-2">
        <button
          onClick={() => useUIStore.getState().setTemplateGalleryOpen(true)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
            "text-foreground-muted hover:bg-accent hover:text-foreground",
          )}
        >
          <LayoutTemplate className="h-3.5 w-3.5" />
          Templates
        </button>
        <button
          onClick={() => useUIStore.getState().setExportDialogOpen(true)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
            "text-foreground-muted hover:bg-accent hover:text-foreground",
          )}
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </button>
        <button
          onClick={() => useUIStore.getState().setImportDialogOpen(true)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
            "text-foreground-muted hover:bg-accent hover:text-foreground",
          )}
        >
          <Upload className="h-3.5 w-3.5" />
          Import
        </button>
      </div>
    </div>
  );
});
