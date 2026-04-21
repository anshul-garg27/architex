"use client";

import { VARIANT_CONFIG, type DrillVariant } from "@/lib/lld/drill-variants";
import { cn } from "@/lib/utils";

export function DrillVariantPicker({
  current,
  onSelect,
}: {
  current: DrillVariant;
  onSelect: (v: DrillVariant) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {(
        Object.entries(VARIANT_CONFIG) as Array<
          [DrillVariant, (typeof VARIANT_CONFIG)[DrillVariant]]
        >
      ).map(([variant, cfg]) => (
        <button
          key={variant}
          onClick={() => onSelect(variant)}
          className={cn(
            "rounded-xl border p-4 text-left transition",
            current === variant
              ? "border-violet-400 bg-violet-500/15"
              : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700",
          )}
        >
          <div className="text-sm font-semibold text-zinc-100">{cfg.label}</div>
          <div className="mt-1 text-xs text-zinc-400">{cfg.description}</div>
        </button>
      ))}
    </div>
  );
}
