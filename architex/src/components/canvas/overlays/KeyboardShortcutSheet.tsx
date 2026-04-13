'use client';

import { memo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { springs } from '@/lib/constants/motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────

export interface KeyboardShortcutSheetProps {
  open: boolean;
  onClose: () => void;
}

// ── Shortcut data ───────────────────────────────────────────

interface ShortcutEntry {
  keys: string[];
  description: string;
}

interface ShortcutSection {
  title: string;
  shortcuts: ShortcutEntry[];
}

const SHORTCUT_SECTIONS: ShortcutSection[] = [
  {
    title: 'Playback',
    shortcuts: [
      { keys: ['Space'], description: 'Play / Pause' },
      { keys: ['\u2190'], description: 'Step backward' },
      { keys: ['\u2192'], description: 'Step forward' },
      { keys: ['Shift', '\u2190'], description: 'Previous milestone' },
      { keys: ['Shift', '\u2192'], description: 'Next milestone' },
    ],
  },
  {
    title: 'Speed',
    shortcuts: [
      { keys: ['1'], description: '0.5x speed' },
      { keys: ['2'], description: '1x speed' },
      { keys: ['3'], description: '2x speed' },
      { keys: ['4'], description: '4x speed' },
    ],
  },
  {
    title: 'View',
    shortcuts: [
      { keys: ['V'], description: 'Cycle view mode' },
      { keys: ['S'], description: 'Toggle sound' },
      { keys: ['F'], description: 'Toggle fullscreen' },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['\u2318', 'K'], description: 'Open algorithm picker' },
      { keys: ['?'], description: 'This shortcut sheet' },
      { keys: ['Esc'], description: 'Close panels / exit' },
    ],
  },
];

// ── Key badge ───────────────────────────────────────────────

const KeyBadge = memo(function KeyBadge({ label }: { label: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center justify-center',
        'bg-elevated border border-border/30 rounded-md',
        'px-2 py-0.5 font-mono text-xs text-foreground-muted',
        'min-w-[28px] text-center',
      )}
    >
      {label}
    </kbd>
  );
});

// ── Component ───────────────────────────────────────────────

export const KeyboardShortcutSheet = memo(function KeyboardShortcutSheet({
  open,
  onClose,
}: KeyboardShortcutSheetProps) {
  const shouldReduceMotion = useReducedMotion();

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handleKeyDown]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.15 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard shortcuts"
            className={cn(
              'fixed left-1/2 top-1/2 z-50 w-[420px] max-h-[80vh] overflow-y-auto',
              'bg-background/90 backdrop-blur-2xl',
              'border border-border/30 rounded-2xl shadow-2xl',
              'p-6',
            )}
            initial={
              shouldReduceMotion
                ? { opacity: 1, x: '-50%', y: '-50%' }
                : { opacity: 0, scale: 0.95, x: '-50%', y: '-50%' }
            }
            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
            exit={
              shouldReduceMotion
                ? { opacity: 0, x: '-50%', y: '-50%' }
                : { opacity: 0, scale: 0.95, x: '-50%', y: '-50%' }
            }
            transition={shouldReduceMotion ? { duration: 0 } : springs.snappy}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-foreground">
                Keyboard Shortcuts
              </h2>
              <button
                onClick={onClose}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-md',
                  'text-foreground-muted transition-colors',
                  'hover:bg-accent hover:text-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                )}
                aria-label="Close shortcut sheet"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Sections */}
            {SHORTCUT_SECTIONS.map((section) => (
              <div key={section.title}>
                <h3 className="text-xs uppercase tracking-wider text-foreground-subtle font-semibold mt-4 mb-2">
                  {section.title}
                </h3>

                <div className="space-y-1.5">
                  {section.shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.description}
                      className="flex items-center text-sm"
                    >
                      {/* Key badges */}
                      <div className="flex items-center gap-1 shrink-0">
                        {shortcut.keys.map((key, i) => (
                          <KeyBadge key={`${key}-${i}`} label={key} />
                        ))}
                      </div>

                      {/* Dotted leader */}
                      <div className="border-b border-dotted border-border/30 flex-1 mx-2" />

                      {/* Description */}
                      <span className="text-sm text-foreground shrink-0">
                        {shortcut.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Footer */}
            <p className="mt-6 text-center text-xs text-foreground-subtle">
              Press Esc to close
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});
