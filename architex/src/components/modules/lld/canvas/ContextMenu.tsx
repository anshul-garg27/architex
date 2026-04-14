"use client";

/**
 * ContextMenu -- Right-click context menu for the LLD Canvas.
 *
 * Provides contextual actions for classes, relationships, and empty canvas.
 * Styled with a VS Code-like dark theme using Tailwind.
 */

import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import type { UMLRelationshipType, UMLClass } from "@/lib/lld";

// ── Types ───────────────────────────────────────────────────

export interface ContextMenuProps {
  x: number;
  y: number;
  targetClassId: string | null;
  targetRelId: string | null;
  onClose: () => void;
  onDeleteClass: (id: string) => void;
  onDuplicateClass: (id: string) => void;
  onChangeStereotype: (id: string, stereotype: UMLClass["stereotype"]) => void;
  onDeleteRelationship: (id: string) => void;
  onAddClass: (x: number, y: number) => void;
  onSelectAll: () => void;
}

// ── Submenu Data ────────────────────────────────────────────

const STEREOTYPE_OPTIONS: { value: UMLClass["stereotype"]; label: string }[] = [
  { value: "class", label: "Class" },
  { value: "interface", label: "Interface" },
  { value: "abstract", label: "Abstract" },
  { value: "enum", label: "Enum" },
];

const RELATIONSHIP_TYPE_OPTIONS: { value: UMLRelationshipType; label: string }[] = [
  { value: "inheritance", label: "Inheritance" },
  { value: "realization", label: "Realization" },
  { value: "composition", label: "Composition" },
  { value: "aggregation", label: "Aggregation" },
  { value: "association", label: "Association" },
  { value: "dependency", label: "Dependency" },
];

// ── Menu Item Component ─────────────────────────────────────

interface MenuItemProps {
  label: string;
  onClick?: () => void;
  danger?: boolean;
  submenu?: React.ReactNode;
  disabled?: boolean;
  shortcut?: string;
}

function MenuItem({ label, onClick, danger, submenu, disabled, shortcut }: MenuItemProps) {
  const [showSub, setShowSub] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={itemRef}
      className="relative"
      onMouseEnter={() => submenu && setShowSub(true)}
      onMouseLeave={() => submenu && setShowSub(false)}
    >
      <button
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        className={`flex w-full items-center justify-between gap-6 rounded-md px-3 py-1.5 text-left text-[11px] transition-colors ${
          disabled
            ? "cursor-not-allowed text-foreground-subtle/40"
            : danger
              ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
              : "text-foreground-muted hover:bg-accent hover:text-foreground"
        }`}
      >
        <span className="font-medium">{label}</span>
        <span className="flex items-center gap-1">
          {shortcut && (
            <span className="text-[9px] text-foreground-subtle/50">{shortcut}</span>
          )}
          {submenu && (
            <svg className="h-3 w-3 text-foreground-subtle/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </span>
      </button>
      {submenu && showSub && (
        <div className="absolute left-full top-0 z-[60] ml-0.5 min-w-[140px] rounded-lg border border-border/30 bg-[#1e1e2e]/95 p-1 shadow-2xl backdrop-blur-xl">
          {submenu}
        </div>
      )}
    </div>
  );
}

function MenuDivider() {
  return <div className="my-1 h-px bg-border/20" />;
}

// ── Context Menu ────────────────────────────────────────────

export const CanvasContextMenu = memo(function CanvasContextMenu({
  x,
  y,
  targetClassId,
  targetRelId,
  onClose,
  onDeleteClass,
  onDuplicateClass,
  onChangeStereotype,
  onDeleteRelationship,
  onAddClass,
  onSelectAll,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Use a rAF to avoid closing immediately from the contextmenu event itself
    requestAnimationFrame(() => {
      document.addEventListener("mousedown", handleClickOutside);
    });
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // Adjust position to stay within viewport
  const adjustedStyle: React.CSSProperties = {
    position: "absolute",
    left: x,
    top: y,
    zIndex: 55,
  };

  // ── Class context menu ──
  if (targetClassId) {
    return (
      <div ref={menuRef} style={adjustedStyle} className="min-w-[180px] rounded-lg border border-border/30 bg-[#1e1e2e]/95 p-1 shadow-2xl backdrop-blur-xl">
        <MenuItem
          label="Duplicate"
          shortcut={navigator.platform.includes("Mac") ? "\u2318D" : "Ctrl+D"}
          onClick={() => { onDuplicateClass(targetClassId); onClose(); }}
        />
        <MenuItem
          label="Change Stereotype"
          submenu={
            <>
              {STEREOTYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { onChangeStereotype(targetClassId, opt.value); onClose(); }}
                  className="flex w-full items-center rounded-md px-3 py-1.5 text-left text-[11px] font-medium text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
                >
                  {opt.label}
                </button>
              ))}
            </>
          }
        />
        <MenuDivider />
        <MenuItem
          label="Delete"
          shortcut="Del"
          danger
          onClick={() => { onDeleteClass(targetClassId); onClose(); }}
        />
      </div>
    );
  }

  // ── Relationship context menu ──
  if (targetRelId) {
    return (
      <div ref={menuRef} style={adjustedStyle} className="min-w-[180px] rounded-lg border border-border/30 bg-[#1e1e2e]/95 p-1 shadow-2xl backdrop-blur-xl">
        <MenuItem
          label="Delete Relationship"
          danger
          onClick={() => { onDeleteRelationship(targetRelId); onClose(); }}
        />
      </div>
    );
  }

  // ── Empty canvas context menu ──
  return (
    <div ref={menuRef} style={adjustedStyle} className="min-w-[180px] rounded-lg border border-border/30 bg-[#1e1e2e]/95 p-1 shadow-2xl backdrop-blur-xl">
      <MenuItem
        label="Add New Class"
        onClick={() => { onAddClass(x, y); onClose(); }}
      />
      <MenuDivider />
      <MenuItem
        label="Select All"
        shortcut={navigator.platform.includes("Mac") ? "\u2318A" : "Ctrl+A"}
        onClick={() => { onSelectAll(); onClose(); }}
      />
    </div>
  );
});
