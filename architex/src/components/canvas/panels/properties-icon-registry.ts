/**
 * Lucide icon lookup for canvas node data (`data.icon` carries the icon
 * name as a string). Mirrors the registries used by ComponentPalette and
 * DragGhostPreview so the Properties panel renders the same glyph the
 * palette and canvas use.
 */

import type { ComponentType } from "react";
import {
  Activity,
  AtSign,
  BarChart3,
  Box,
  Brain,
  ClipboardList,
  Cog,
  Database,
  ExternalLink,
  FileJson,
  Gauge,
  GitBranch,
  GitFork,
  Globe,
  Globe2,
  HardDrive,
  KeyRound,
  ListOrdered,
  Lock,
  Megaphone,
  Monitor,
  Radio,
  Route,
  ScrollText,
  Search,
  Server,
  Shield,
  ShieldAlert,
  Smartphone,
  Table2,
  TrendingUp,
  Workflow,
  Zap,
} from "lucide-react";

const ICON_REGISTRY: Record<string, ComponentType<{ className?: string }>> = {
  Activity,
  AtSign,
  BarChart3,
  Box,
  Brain,
  ClipboardList,
  Cog,
  Database,
  ExternalLink,
  FileJson,
  Gauge,
  GitBranch,
  GitFork,
  Globe,
  Globe2,
  HardDrive,
  KeyRound,
  ListOrdered,
  Lock,
  Megaphone,
  Monitor,
  Radio,
  Route,
  ScrollText,
  Search,
  Server,
  Shield,
  ShieldAlert,
  Smartphone,
  Table2,
  TrendingUp,
  Workflow,
  Zap,
};

/** Resolve a lucide icon component by name, falling back to a generic box. */
export function getNodeIcon(iconName: string): ComponentType<{ className?: string }> {
  return ICON_REGISTRY[iconName] ?? Box;
}
