"use client";

/**
 * ClassPopover — floating card anchored next to a clicked class on the
 * canvas. Shows the class's role, responsibility, and jump links to the
 * sections that discuss it (Anatomy and Mechanism).
 *
 * Input data comes from LessonPayload.sections.anatomy.classes plus the
 * computed list of sections that reference the classId.
 */

import * as React from "react";
import { X } from "lucide-react";

export interface ClassPopoverInfo {
  classId: string;
  role: string;
  responsibility: string;
  keyMethod?: string;
  referencingSections: ReadonlyArray<{ id: string; label: string }>;
}

interface ClassPopoverProps {
  info: ClassPopoverInfo | null;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onJump: (sectionId: string) => void;
}

export function ClassPopover({
  info,
  anchorEl,
  onClose,
  onJump,
}: ClassPopoverProps) {
  const [rect, setRect] = React.useState<DOMRect | null>(null);

  React.useEffect(() => {
    if (!anchorEl) {
      setRect(null);
      return;
    }
    const update = () => setRect(anchorEl.getBoundingClientRect());
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [anchorEl]);

  React.useEffect(() => {
    if (!info) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [info, onClose]);

  if (!info || !rect) return null;

  const style: React.CSSProperties = {
    position: "fixed",
    left: Math.min(rect.right + 8, window.innerWidth - 280),
    top: Math.max(rect.top, 16),
    zIndex: 60,
    width: 272,
  };

  return (
    <div
      role="dialog"
      aria-label={`${info.classId} details`}
      style={style}
      className="rounded-lg border border-neutral-200 bg-white p-4 shadow-lg dark:border-neutral-800 dark:bg-neutral-950"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-neutral-500">
            {info.role}
          </p>
          <h4 className="mt-1 font-mono text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            {info.classId}
          </h4>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close class details"
          className="rounded p-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <X size={14} />
        </button>
      </div>
      <p className="mt-3 text-sm text-neutral-700 dark:text-neutral-300">
        {info.responsibility}
      </p>
      {info.keyMethod ? (
        <p className="mt-2 font-mono text-xs text-neutral-500">
          key method: {info.keyMethod}
        </p>
      ) : null}
      {info.referencingSections.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            Jump to
          </p>
          <ul className="mt-2 flex flex-wrap gap-1">
            {info.referencingSections.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onJump(s.id)}
                  className="rounded border border-neutral-200 px-2 py-0.5 text-xs text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-500"
                >
                  {s.label} →
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
