"use client";

import { useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle } from "lucide-react";
import { duration, easing } from "@/lib/constants/motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────

/** Props for the ConfirmDialog component. Used for destructive or important confirmation prompts. */
export interface ConfirmDialogProps {
  /** Controls dialog visibility. */
  open: boolean;
  /** Heading text displayed at the top of the dialog. */
  title: string;
  /** Explanatory body text below the title. */
  description: string;
  /** Label for the primary action button. @default "Confirm" */
  confirmLabel?: string;
  /** Label for the cancel/dismiss button. @default "Cancel" */
  cancelLabel?: string;
  /** Visual style variant. "destructive" adds a red accent and warning icon. @default "default" */
  variant?: "destructive" | "default";
  /** Callback fired when the user clicks the confirm button. */
  onConfirm: () => void;
  /** Callback fired when the user clicks cancel or closes the dialog. */
  onCancel: () => void;
}

// ── ConfirmDialog ─────────────────────────────────────────────

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const handleConfirm = useCallback(() => {
    onConfirm();
  }, [onConfirm]);

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent
        className={cn(
          "sm:max-w-md rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-md shadow-[0_0_30px_rgba(0,0,0,0.3)]",
          variant === "destructive" && "border-l-4 border-l-destructive shadow-[0_0_30px_rgba(239,68,68,0.1)]",
        )}
      >
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: duration.fast, ease: easing.out }}
            >
              <DialogHeader>
                <DialogTitle className={cn(variant === "destructive" && "flex items-center gap-2")}>
                  {variant === "destructive" && (
                    <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
                  )}
                  {title}
                </DialogTitle>
                <DialogDescription>{description}</DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={handleCancel}>
                  {cancelLabel}
                </Button>
                <Button
                  variant={variant === "destructive" ? "destructive" : "default"}
                  onClick={handleConfirm}
                >
                  {confirmLabel}
                </Button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
