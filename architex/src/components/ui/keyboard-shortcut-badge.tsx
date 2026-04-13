"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const kbdVariants = cva(
  "inline-flex items-center justify-center font-mono leading-none select-none",
  {
    variants: {
      variant: {
        default:
          "rounded border border-border-strong bg-muted text-muted-foreground shadow-sm",
        subtle:
          "rounded bg-muted/60 text-muted-foreground",
        outline:
          "rounded border border-border text-foreground-muted",
      },
      size: {
        default: "min-w-[20px] px-1.5 py-0.5 text-[11px]",
        sm: "min-w-[16px] px-1 py-px text-[10px]",
        lg: "min-w-[24px] px-2 py-1 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface KeyboardShortcutBadgeProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof kbdVariants> {
  /**
   * Keyboard shortcut string. Use `+` to separate keys.
   * Example: "Cmd+K", "Ctrl+Shift+P"
   * Special tokens are auto-mapped to symbols: Cmd, Ctrl, Shift, Alt, Option, Enter, Delete, Backspace, Tab, Esc
   */
  keys: string;
}

/** Map common key names to symbols */
const KEY_SYMBOLS: Record<string, string> = {
  cmd: "\u2318",
  command: "\u2318",
  ctrl: "\u2303",
  control: "\u2303",
  shift: "\u21E7",
  alt: "\u2325",
  option: "\u2325",
  enter: "\u23CE",
  return: "\u23CE",
  delete: "\u232B",
  backspace: "\u232B",
  tab: "\u21E5",
  esc: "\u238B",
  escape: "\u238B",
  space: "\u2423",
  up: "\u2191",
  down: "\u2193",
  left: "\u2190",
  right: "\u2192",
};

function resolveKeySymbol(key: string): string {
  return KEY_SYMBOLS[key.toLowerCase()] ?? key;
}

const KeyboardShortcutBadge = React.forwardRef<
  HTMLElement,
  KeyboardShortcutBadgeProps
>(({ className, keys, variant, size, ...props }, ref) => {
  const parts = keys.split("+").map((k) => k.trim());

  return (
    <kbd
      ref={ref}
      className={cn(kbdVariants({ variant, size }), "gap-0.5", className)}
      {...props}
    >
      {parts.map((key, i) => (
        <span key={i} className="inline-block">
          {resolveKeySymbol(key)}
        </span>
      ))}
    </kbd>
  );
});
KeyboardShortcutBadge.displayName = "KeyboardShortcutBadge";

export { KeyboardShortcutBadge, kbdVariants };
