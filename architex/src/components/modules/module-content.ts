import type React from "react";

export interface ModuleContent {
  sidebar: React.ReactNode;
  canvas: React.ReactNode;
  properties: React.ReactNode;
  bottomPanel: React.ReactNode;
  mockOverlay?: React.ReactNode | null;
  /** Optional confirm dialog rendered at root level for destructive action gates. */
  confirmDialog?: React.ReactNode | null;
  /** Optional breadcrumb context for the workspace header trail. */
  breadcrumb?: { section?: string; topic?: string };
}
