"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/* ── Trend arrow SVG ── */
function TrendArrow({ direction }: { direction: "up" | "down" | "flat" }) {
  if (direction === "flat") {
    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        className="shrink-0"
        aria-hidden="true"
      >
        <path
          d="M2 6h8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  const isUp = direction === "up";
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className={cn("shrink-0", !isUp && "rotate-180")}
      aria-hidden="true"
    >
      <path
        d="M6 9.5V2.5m0 0L2.5 6m3.5-3.5L9.5 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Delta badge variants ── */
const deltaBadgeVariants = cva(
  "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium",
  {
    variants: {
      trend: {
        positive: "bg-success-bg text-success-text",
        negative: "bg-error-bg text-error-text",
        neutral: "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      trend: "neutral",
    },
  },
);

/* ── Main component ── */
export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Human-readable metric label */
  label: string;
  /** Primary display value (e.g. "99.9%", "1,234") */
  value: string;
  /** Change description (e.g. "+12%", "-3ms") */
  delta?: string;
  /** Trend direction controls arrow and color */
  trend?: "positive" | "negative" | "neutral";
  /** Optional icon rendered before the label */
  icon?: React.ReactNode;
}

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({ className, label, value, delta, trend = "neutral", icon, ...props }, ref) => {
    const trendDirection: "up" | "down" | "flat" =
      trend === "positive" ? "up" : trend === "negative" ? "down" : "flat";

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col gap-1 rounded-lg border border-border bg-card p-4",
          className,
        )}
        {...props}
      >
        {/* Label row */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {icon && (
            <span className="[&_svg]:size-3.5 [&_svg]:shrink-0">{icon}</span>
          )}
          <span>{label}</span>
        </div>

        {/* Value row */}
        <div className="flex items-end gap-2">
          <span className="text-2xl font-semibold leading-none tracking-tight text-foreground">
            {value}
          </span>

          {delta && (
            <span className={cn(deltaBadgeVariants({ trend }))}>
              <TrendArrow direction={trendDirection} />
              {delta}
            </span>
          )}
        </div>
      </div>
    );
  },
);
MetricCard.displayName = "MetricCard";

export { MetricCard, deltaBadgeVariants };
