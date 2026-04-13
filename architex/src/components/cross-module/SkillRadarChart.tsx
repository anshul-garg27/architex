"use client";

// ─────────────────────────────────────────────────────────────
// Architex — Skill Radar Chart (CROSS-008)
// 13-axis SVG radar chart for mastery visualization.
// ─────────────────────────────────────────────────────────────

import { memo, useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";

// ── Props ─────────────────────────────────────────────────────

interface RadarDataPoint {
  module: string;
  label?: string;
  theory: number;
  practice: number;
}

interface SkillRadarChartProps {
  data: RadarDataPoint[];
  size?: number;
  className?: string;
}

// ── Constants ─────────────────────────────────────────────────

const GRID_LEVELS = [25, 50, 75, 100];
const THEORY_COLOR = "#6366F1";
const PRACTICE_COLOR = "#22C55E";
const LABEL_OFFSET = 18;

// ── Geometry helpers ──────────────────────────────────────────

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleRad: number,
): { x: number; y: number } {
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

function getAngle(index: number, total: number): number {
  // Start from top (-PI/2) and go clockwise
  return (2 * Math.PI * index) / total - Math.PI / 2;
}

function buildPolygonPoints(
  values: number[],
  cx: number,
  cy: number,
  maxRadius: number,
): string {
  return values
    .map((val, i) => {
      const angle = getAngle(i, values.length);
      const r = (val / 100) * maxRadius;
      const { x, y } = polarToCartesian(cx, cy, r, angle);
      return `${x},${y}`;
    })
    .join(" ");
}

// ── Component ─────────────────────────────────────────────────

export const SkillRadarChart = memo(function SkillRadarChart({
  data,
  size = 320,
  className,
}: SkillRadarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size / 2 - 40; // Leave room for labels

  const theoryValues = useMemo(() => data.map((d) => d.theory), [data]);
  const practiceValues = useMemo(() => data.map((d) => d.practice), [data]);

  const theoryPoints = useMemo(
    () => buildPolygonPoints(theoryValues, cx, cy, maxRadius),
    [theoryValues, cx, cy, maxRadius],
  );
  const practicePoints = useMemo(
    () => buildPolygonPoints(practiceValues, cx, cy, maxRadius),
    [practiceValues, cx, cy, maxRadius],
  );

  const handleMouseEnter = useCallback((index: number) => {
    setHoveredIndex(index);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  return (
    <div className={cn("relative inline-block", className)}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className="overflow-visible"
      >
        {/* Grid circles */}
        {GRID_LEVELS.map((level) => {
          const r = (level / 100) * maxRadius;
          return (
            <circle
              key={level}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="var(--border-primary, #333)"
              strokeWidth={0.5}
              strokeDasharray={level === 100 ? "none" : "2 2"}
              opacity={0.4}
            />
          );
        })}

        {/* Grid level labels */}
        {GRID_LEVELS.map((level) => {
          const r = (level / 100) * maxRadius;
          return (
            <text
              key={`label-${level}`}
              x={cx + 3}
              y={cy - r - 2}
              fontSize={8}
              fill="var(--text-tertiary, #666)"
              textAnchor="start"
            >
              {level}%
            </text>
          );
        })}

        {/* Axis lines */}
        {data.map((_, i) => {
          const angle = getAngle(i, data.length);
          const end = polarToCartesian(cx, cy, maxRadius, angle);
          return (
            <line
              key={`axis-${i}`}
              x1={cx}
              y1={cy}
              x2={end.x}
              y2={end.y}
              stroke="var(--border-primary, #333)"
              strokeWidth={0.5}
              opacity={0.3}
            />
          );
        })}

        {/* Theory polygon (inner, semi-transparent) */}
        <polygon
          points={theoryPoints}
          fill={THEORY_COLOR}
          fillOpacity={0.15}
          stroke={THEORY_COLOR}
          strokeWidth={1.5}
          strokeOpacity={0.8}
        />

        {/* Practice polygon (outer, more solid) */}
        <polygon
          points={practicePoints}
          fill={PRACTICE_COLOR}
          fillOpacity={0.15}
          stroke={PRACTICE_COLOR}
          strokeWidth={1.5}
          strokeOpacity={0.8}
        />

        {/* Data points on axes */}
        {data.map((d, i) => {
          const angle = getAngle(i, data.length);
          const theoryR = (d.theory / 100) * maxRadius;
          const practiceR = (d.practice / 100) * maxRadius;
          const tPt = polarToCartesian(cx, cy, theoryR, angle);
          const pPt = polarToCartesian(cx, cy, practiceR, angle);
          return (
            <g key={`points-${i}`}>
              <circle cx={tPt.x} cy={tPt.y} r={2.5} fill={THEORY_COLOR} />
              <circle cx={pPt.x} cy={pPt.y} r={2.5} fill={PRACTICE_COLOR} />
            </g>
          );
        })}

        {/* Axis labels */}
        {data.map((d, i) => {
          const angle = getAngle(i, data.length);
          const labelR = maxRadius + LABEL_OFFSET;
          const { x, y } = polarToCartesian(cx, cy, labelR, angle);

          // Determine text anchor based on position
          let anchor: "start" | "middle" | "end" = "middle";
          if (x < cx - 5) anchor = "end";
          else if (x > cx + 5) anchor = "start";

          const displayLabel = d.label ?? d.module;
          // Truncate long labels
          const truncated =
            displayLabel.length > 12
              ? displayLabel.slice(0, 11) + "\u2026"
              : displayLabel;

          return (
            <text
              key={`label-${i}`}
              x={x}
              y={y}
              fontSize={9}
              fontWeight={hoveredIndex === i ? 600 : 400}
              fill={
                hoveredIndex === i
                  ? "var(--text-primary, #fff)"
                  : "var(--text-secondary, #aaa)"
              }
              textAnchor={anchor}
              dominantBaseline="central"
              className="cursor-pointer select-none"
              onMouseEnter={() => handleMouseEnter(i)}
              onMouseLeave={handleMouseLeave}
            >
              {truncated}
            </text>
          );
        })}

        {/* Hover hitboxes for tooltips */}
        {data.map((_, i) => {
          const angle = getAngle(i, data.length);
          const hitR = maxRadius + LABEL_OFFSET + 10;
          const { x, y } = polarToCartesian(cx, cy, hitR, angle);
          return (
            <circle
              key={`hit-${i}`}
              cx={x}
              cy={y}
              r={14}
              fill="transparent"
              onMouseEnter={() => handleMouseEnter(i)}
              onMouseLeave={handleMouseLeave}
              className="cursor-pointer"
            />
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredIndex !== null && (
        <div
          className={cn(
            "pointer-events-none absolute z-10 rounded-md",
            "border border-[var(--border-primary)] bg-[var(--bg-primary)] px-2.5 py-1.5 shadow-lg",
          )}
          style={{
            left: size / 2,
            top: size / 2 - 50,
            transform: "translate(-50%, -100%)",
          }}
        >
          <p className="text-xs font-semibold text-[var(--text-primary)]">
            {data[hoveredIndex].label ?? data[hoveredIndex].module}
          </p>
          <div className="mt-1 flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: THEORY_COLOR }}
              />
              Theory: {data[hoveredIndex].theory}%
            </span>
            <span className="flex items-center gap-1">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: PRACTICE_COLOR }}
              />
              Practice: {data[hoveredIndex].practice}%
            </span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-2 flex items-center justify-center gap-4 text-[10px] text-[var(--text-tertiary)]">
        <span className="flex items-center gap-1">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: THEORY_COLOR }}
          />
          Theory
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: PRACTICE_COLOR }}
          />
          Practice
        </span>
      </div>
    </div>
  );
});
