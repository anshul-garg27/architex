"use client";

import React, { useCallback, type DragEvent } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  ArrowRightLeft,
  ArrowUpFromLine,
  AtSign,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Box,
  Brain,
  BrainCircuit,
  ClipboardList,
  Clock,
  Cloud,
  Cog,
  Compass,
  Copy,
  CreditCard,
  Crown,
  Database,
  ExternalLink,
  FileCode,
  FileJson,
  Film,
  Fingerprint,
  Flag,
  Gauge,
  GitBranch,
  GitFork,
  GitGraph,
  Globe,
  Globe2,
  GripVertical,
  HardDrive,
  History,
  KeyRound,
  Layers,
  ListOrdered,
  Lock,
  LogIn,
  Megaphone,
  Monitor,
  Network,
  Radar,
  Radio,
  RefreshCw,
  Route,
  ScanEye,
  ScrollText,
  Search,
  Server,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  Sparkles,
  SplitSquareVertical,
  Table2,
  TrendingUp,
  UserCheck,
  Workflow,
  Wrench,
  Zap,
} from "lucide-react";
import { CATEGORY_COLORS, type PaletteItem } from "@/lib/palette-items";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ICON_REGISTRY: Record<string, React.ComponentType<{ className?: string }>> = {
  Activity, AlertTriangle, ArrowDownToLine, ArrowRightLeft, ArrowUpFromLine, AtSign, BarChart3, Bell, BookOpen, Bot, Box, Brain, BrainCircuit, ClipboardList, Clock, Cloud, Cog, Compass, Copy, CreditCard, Crown, Database, ExternalLink, FileCode, FileJson, Film, Fingerprint, Flag, Gauge, GitBranch, GitFork, GitGraph, Globe, Globe2, HardDrive, KeyRound, Layers, ListOrdered, Lock, LogIn, Megaphone, Monitor, Network, Radar, Radio, RefreshCw, Route, ScanEye, ScrollText, Search, Server, Settings, Shield, ShieldAlert, ShieldCheck, ShieldOff, Smartphone, Sparkles, SplitSquareVertical, Table2, TrendingUp, UserCheck, Workflow, Wrench, Zap,
};

export function getPaletteIcon(iconName: string): React.ComponentType<{ className?: string }> {
  return ICON_REGISTRY[iconName] ?? Box;
}

/**
 * Serializes a palette item onto a drag event.
 * NOTE: the payload shape is a contract with the canvas drop handler — do not change it.
 */
function setNodeDragData(e: DragEvent, item: PaletteItem): void {
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
}

export interface PaletteItemCardProps {
  item: PaletteItem;
  isSelected: boolean;
  onSelect: () => void;
  itemRef: (el: HTMLDivElement | null) => void;
  /** Called from the drag-start handler so the parent can track recently used items. */
  onDragged: (item: PaletteItem) => void;
}

export function PaletteItemCard({ item, isSelected, onSelect, itemRef, onDragged }: PaletteItemCardProps) {
  const Icon = getPaletteIcon(item.icon);
  const categoryColor = CATEGORY_COLORS[item.category];

  const onDragStart = useCallback(
    (e: DragEvent) => {
      setNodeDragData(e, item);
      onDragged(item);
    },
    [item, onDragged],
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
        "group flex cursor-grab items-center gap-1.5 rounded-md border py-1 pl-1 pr-2 transition duration-150 active:translate-y-0 active:cursor-grabbing",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        isSelected
          ? "border-primary/50 bg-elevated"
          : "border-transparent hover:-translate-y-px hover:border-primary/40 hover:bg-elevated",
      )}
      title={item.description}
    >
      <GripVertical
        className="h-3.5 w-3.5 shrink-0 text-foreground-muted/60 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
        aria-hidden="true"
      />
      <div
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded"
        style={{ backgroundColor: `color-mix(in srgb, ${categoryColor} 15%, transparent)` }}
      >
        <span style={{ color: categoryColor }}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium leading-tight text-foreground">
          {item.label}
        </div>
        <div className="truncate text-[11px] leading-tight text-foreground-muted">
          {item.description}
        </div>
      </div>
    </div>
  );
}

export interface PaletteRecentStripProps {
  items: PaletteItem[];
  /** Called from the chip drag-start handler so recency stays fresh. */
  onDragged: (item: PaletteItem) => void;
  /** Click/keyboard fallback — adds the component to the canvas center. */
  onActivate: (item: PaletteItem) => void;
}

export function PaletteRecentStrip({ items, onDragged, onActivate }: PaletteRecentStripProps) {
  if (items.length === 0) return null;

  return (
    <div className="border-b border-sidebar-border px-3 py-2">
      <div className="mb-1.5 flex items-center gap-1.5">
        <History className="h-3 w-3 text-foreground-subtle" aria-hidden="true" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle">
          Recently used
        </span>
      </div>
      <TooltipProvider delayDuration={150}>
        <div className="flex items-center gap-1.5" aria-label="Recently used components">
          {items.map((item) => (
            <RecentChip key={item.type} item={item} onDragged={onDragged} onActivate={onActivate} />
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
}

interface RecentChipProps {
  item: PaletteItem;
  onDragged: (item: PaletteItem) => void;
  onActivate: (item: PaletteItem) => void;
}

function RecentChip({ item, onDragged, onActivate }: RecentChipProps) {
  const Icon = getPaletteIcon(item.icon);
  const categoryColor = CATEGORY_COLORS[item.category];

  const onDragStart = useCallback(
    (e: DragEvent) => {
      setNodeDragData(e, item);
      onDragged(item);
    },
    [item, onDragged],
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          draggable
          onDragStart={onDragStart}
          onClick={() => onActivate(item)}
          aria-label={`${item.label} — drag to canvas or press to add`}
          className={cn(
            "flex h-7 w-7 cursor-grab items-center justify-center rounded-md border border-border transition duration-150",
            "hover:-translate-y-px hover:border-primary/40 active:translate-y-0 active:cursor-grabbing",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          )}
          style={{ backgroundColor: `color-mix(in srgb, ${categoryColor} 10%, transparent)` }}
        >
          <span style={{ color: categoryColor }}>
            <Icon className="h-3.5 w-3.5" />
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{item.label}</TooltipContent>
    </Tooltip>
  );
}
