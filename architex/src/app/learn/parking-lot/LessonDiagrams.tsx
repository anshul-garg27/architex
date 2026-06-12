"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Database, Server, Cloud, Network, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SCALING_TIERS } from "./_data";

// ─────────────────────────────────────────────────────────────────────────────
//  Hero parking grid — ambient slot flips every 4-8s, counter ticks
// ─────────────────────────────────────────────────────────────────────────────

const ROWS = 6;
const COLS = 14;
const TOTAL = ROWS * COLS;
const INITIAL_OCCUPIED = new Set<number>([
  1, 3, 5, 7, 11, 12, 17, 18, 22, 25, 28, 30, 31,
  35, 38, 41, 42, 45, 48, 51, 53, 56, 57, 60, 62,
  65, 67, 71, 73, 75, 78, 80, 81,
]);

export function HeroParkingGrid() {
  const [occupied, setOccupied] = useState<Set<number>>(() => new Set(INITIAL_OCCUPIED));
  const [flippedCell, setFlippedCell] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setOccupied((prev) => {
        const next = new Set(prev);
        const flipOut = Math.random() > 0.5;
        if (flipOut && next.size > 5) {
          const arr = Array.from(next);
          const target = arr[Math.floor(Math.random() * arr.length)];
          next.delete(target);
          setFlippedCell(target);
        } else {
          let target: number;
          let tries = 0;
          do {
            target = Math.floor(Math.random() * TOTAL);
            tries++;
          } while (next.has(target) && tries < 50);
          if (!next.has(target)) {
            next.add(target);
            setFlippedCell(target);
          }
        }
        setTimeout(() => setFlippedCell(null), 600);
        return next;
      });
    }, 5000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, []);

  const available = TOTAL * 3 - occupied.size; // synthetic global counter

  return (
    <div
      role="img"
      aria-label="Live parking-lot dashboard: a grid of spots with about half occupied, with two display boards showing available count and current level"
      className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-border bg-[hsl(225_8%_5%)]"
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, hsl(220 5% 25%) 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 70% at 30% 55%, hsl(258 78% 30% / 0.18), transparent 70%)",
        }}
        aria-hidden
      />

      <div className="absolute left-8 top-6 flex gap-3 font-mono text-[10px] sm:text-[12px]">
        <div className="rounded-md border border-[hsl(258_78%_64%)]/40 bg-surface/80 px-3 py-1.5 tracking-wider text-[hsl(258_85%_76%)] shadow-[0_0_24px_hsl(258_78%_64%/0.25)]">
          AVAILABLE <span className="tabular-nums">{available.toString().padStart(3, " ")}</span> / 240
        </div>
        <div className="rounded-md border border-[hsl(258_78%_64%)]/30 bg-surface/80 px-3 py-1.5 tracking-wider text-[hsl(258_85%_76%)]/80">
          LEVEL 2
        </div>
      </div>

      <div
        className="absolute inset-x-8 top-20 grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
        aria-hidden
      >
        {Array.from({ length: TOTAL }).map((_, i) => {
          const isOcc = occupied.has(i);
          const isFlipped = flippedCell === i;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.005, duration: 0.4 }}
              className={cn(
                "aspect-[5/4] rounded-sm transition-all duration-500",
                isOcc
                  ? "border border-[hsl(258_78%_64%)]/70 bg-[hsl(258_78%_64%)]/35 shadow-[inset_0_0_8px_hsl(258_78%_64%/0.4),0_0_8px_hsl(258_78%_64%/0.5)]"
                  : "border border-border/40 bg-[hsl(225_8%_8%)]",
                isFlipped && "shadow-[0_0_18px_hsl(258_78%_64%/0.85),inset_0_0_12px_hsl(258_78%_64%/0.6)]",
              )}
            />
          );
        })}
      </div>

      <div className="absolute left-2 top-1/2 -translate-y-1/2 rotate-[-90deg] font-mono text-[9px] tracking-widest text-muted-foreground">
        ENTRY
      </div>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 font-mono text-[9px] tracking-widest text-muted-foreground">
        EXIT
      </div>

      <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-[hsl(225_8%_5%)] via-[hsl(225_8%_5%)]/60 to-transparent" />

      <p className="sr-only">
        Live counter currently shows {available} available spots out of 240 across all levels.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Relationships canvas — accessible SVG with sr-only fallback list
// ─────────────────────────────────────────────────────────────────────────────

interface OrbitNode {
  id: string;
  label: string;
  angle: number;
  cardinality: string;
  verb: string;
}

const ORBIT_NODES: ReadonlyArray<OrbitNode> = [
  { id: "level", label: "Level", angle: -90, cardinality: "1..*", verb: "HAS-MANY" },
  { id: "spot", label: "ParkingSpot", angle: -45, cardinality: "1..*", verb: "HAS-MANY" },
  { id: "vehicle", label: "Vehicle", angle: 0, cardinality: "0..1", verb: "USES-A" },
  { id: "ticket", label: "Ticket", angle: 45, cardinality: "1..1", verb: "BELONGS-TO" },
  { id: "payment", label: "Payment", angle: 90, cardinality: "1..1", verb: "SETTLES" },
  { id: "reservation", label: "Reservation", angle: 125, cardinality: "0..*", verb: "HOLDS" },
  { id: "gate", label: "Gate", angle: 165, cardinality: "1..*", verb: "MANAGES" },
  { id: "display", label: "DisplayBoard", angle: 215, cardinality: "1..1", verb: "SHOWS" },
];

export function RelationshipsCanvas() {
  const [active, setActive] = useState<string | null>(null);
  const cx = 500;
  const cy = 320;
  const radius = 220;

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-surface/40">
      <svg
        viewBox="0 0 1000 640"
        className="block h-auto w-full"
        role="img"
        aria-labelledby="rel-title rel-desc"
      >
        <title id="rel-title">Parking lot entity relationships</title>
        <desc id="rel-desc">
          ParkingLot is the central coordinator. It HAS-MANY Levels, each HAS-MANY ParkingSpots.
          Vehicle USES-A ParkingSpot zero-or-one. Ticket BELONGS-TO Vehicle. Payment SETTLES Ticket.
          Reservation HOLDS Spots. Gate MANAGES entry. DisplayBoard SHOWS Level availability.
        </desc>
        <defs>
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(258 78% 64%)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(258 78% 64%)" stopOpacity="0" />
          </radialGradient>
          <pattern id="dotgrid" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="11" cy="11" r="0.6" fill="hsl(220 5% 25%)" />
          </pattern>
        </defs>
        <rect width="1000" height="640" fill="url(#dotgrid)" opacity="0.4" />
        <circle cx={cx} cy={cy} r={radius + 60} fill="url(#centerGlow)" />

        {ORBIT_NODES.map((n) => {
          const rad = (n.angle * Math.PI) / 180;
          const x = cx + radius * Math.cos(rad);
          const y = cy + radius * Math.sin(rad);
          const midX = (cx + x) / 2;
          const midY = (cy + y) / 2;
          const isActive = active === n.id;
          return (
            <g key={`edge-${n.id}`}>
              <line
                x1={cx}
                y1={cy}
                x2={x}
                y2={y}
                stroke="hsl(258 78% 64%)"
                strokeOpacity={isActive ? 0.9 : 0.35}
                strokeWidth={isActive ? 2 : 1}
                strokeLinecap="round"
              />
              <g transform={`translate(${midX}, ${midY})`}>
                <rect
                  x={-50}
                  y={-12}
                  width={100}
                  height={24}
                  rx={4}
                  fill="hsl(225 8% 9%)"
                  fillOpacity={isActive ? 1 : 0.85}
                  stroke="hsl(258 78% 64%)"
                  strokeOpacity={isActive ? 0.6 : 0.2}
                />
                <text textAnchor="middle" y={-1} fontSize="10" fontFamily="ui-monospace, monospace" fill="hsl(220 5% 80%)">
                  {n.verb}
                </text>
                <text textAnchor="middle" y={9} fontSize="9" fontFamily="ui-monospace, monospace" fill="hsl(258 85% 78%)">
                  [{n.cardinality}]
                </text>
              </g>
            </g>
          );
        })}

        <g>
          <rect
            x={cx - 95}
            y={cy - 38}
            width={190}
            height={76}
            rx={10}
            fill="hsl(225 8% 11%)"
            stroke="hsl(258 78% 64%)"
            strokeWidth={1.5}
            filter="drop-shadow(0 0 24px hsl(258 78% 64% / 0.5))"
          />
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="600" fill="hsl(220 5% 95%)">
            ParkingLot
          </text>
          <text x={cx} y={cy + 18} textAnchor="middle" fontSize="11" fontFamily="ui-monospace, monospace" fill="hsl(220 5% 60%)">
            the coordinator
          </text>
        </g>

        {ORBIT_NODES.map((n) => {
          const rad = (n.angle * Math.PI) / 180;
          const x = cx + radius * Math.cos(rad);
          const y = cy + radius * Math.sin(rad);
          const isActive = active === n.id;
          return (
            <g
              key={`node-${n.id}`}
              role="button"
              aria-label={`${n.label}: ParkingLot ${n.verb} ${n.label} ${n.cardinality}`}
              tabIndex={0}
              onMouseEnter={() => setActive(n.id)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(n.id)}
              onBlur={() => setActive(null)}
              style={{ cursor: "pointer" }}
            >
              <rect
                x={x - 70}
                y={y - 24}
                width={140}
                height={48}
                rx={8}
                fill={isActive ? "hsl(225 8% 14%)" : "hsl(225 8% 11%)"}
                stroke={isActive ? "hsl(258 78% 64%)" : "hsl(220 5% 30%)"}
                strokeWidth={isActive ? 1.5 : 1}
                filter={isActive ? "drop-shadow(0 0 16px hsl(258 78% 64% / 0.6))" : undefined}
              />
              <text x={x} y={y + 5} textAnchor="middle" fontSize="13" fontWeight="500" fill="hsl(220 5% 90%)">
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>
      <ul className="sr-only">
        {ORBIT_NODES.map((n) => (
          <li key={n.id}>
            ParkingLot {n.verb} {n.label} with cardinality {n.cardinality}
          </li>
        ))}
      </ul>
      <p className="absolute bottom-3 left-4 font-mono text-[10px] text-muted-foreground">
        hover or focus an entity to highlight its relationship
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Sequence diagram canvas — entry flow (with accessible fallback)
// ─────────────────────────────────────────────────────────────────────────────

const ENTRY_ACTORS = ["Vehicle", "Gate", "ParkingLot", "Spot", "TicketSystem", "DisplayBoard"];

interface Message {
  n: number;
  from: number;
  to: number;
  label: string;
  ret?: boolean;
}

const ENTRY_MESSAGES: ReadonlyArray<Message> = [
  { n: 1, from: 0, to: 1, label: "arrives()" },
  { n: 2, from: 1, to: 2, label: "requestEntry()" },
  { n: 3, from: 2, to: 3, label: "findAvailable()" },
  { n: 4, from: 3, to: 2, label: "spotId", ret: true },
  { n: 5, from: 2, to: 4, label: "issueTicket()" },
  { n: 6, from: 4, to: 2, label: "ticketId", ret: true },
  { n: 7, from: 2, to: 1, label: "openGate()" },
  { n: 8, from: 2, to: 5, label: "updateAvailability()" },
  { n: 9, from: 1, to: 0, label: "entry granted" },
];

const EXIT_ACTORS = ["Vehicle", "Gate", "ParkingLot", "PaymentSvc", "Spot"];
const EXIT_MESSAGES: ReadonlyArray<Message> = [
  { n: 1, from: 0, to: 1, label: "presentTicket()" },
  { n: 2, from: 1, to: 2, label: "computeFare()" },
  { n: 3, from: 2, to: 1, label: "fare", ret: true },
  { n: 4, from: 1, to: 3, label: "charge(idemKey)" },
  { n: 5, from: 3, to: 1, label: "CAPTURED", ret: true },
  { n: 6, from: 1, to: 2, label: "releaseSpot()" },
  { n: 7, from: 2, to: 4, label: "state=VACANT" },
  { n: 8, from: 1, to: 0, label: "openGate" },
];

function SequenceSvg({
  actors,
  messages,
  title,
  desc,
}: {
  actors: ReadonlyArray<string>;
  messages: ReadonlyArray<Message>;
  title: string;
  desc: string;
}) {
  const W = 1000;
  const H = 60 + messages.length * 44 + 80;
  const headerY = 56;
  const stepY = 44;
  const colW = W / (actors.length + 1);
  const titleId = title.toLowerCase().replace(/\s+/g, "-") + "-title";
  const descId = title.toLowerCase().replace(/\s+/g, "-") + "-desc";

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block h-auto w-full"
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
    >
      <title id={titleId}>{title}</title>
      <desc id={descId}>{desc}</desc>
      <defs>
        <pattern id={`${titleId}-dots`} width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="11" cy="11" r="0.6" fill="hsl(220 5% 25%)" />
        </pattern>
        <marker id={`${titleId}-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(258 78% 64%)" />
        </marker>
      </defs>
      <rect width={W} height={H} fill={`url(#${titleId}-dots)`} opacity="0.35" />

      {actors.map((a, i) => {
        const x = colW * (i + 1);
        return (
          <g key={a}>
            <rect x={x - 70} y={20} width={140} height={36} rx={6} fill="hsl(225 8% 13%)" stroke="hsl(220 5% 30%)" />
            <text x={x} y={43} textAnchor="middle" fontSize="13" fontWeight="500" fill="hsl(220 5% 90%)">
              {a}
            </text>
            <line x1={x} y1={headerY} x2={x} y2={H - 30} stroke="hsl(258 78% 64%)" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="3 3" />
          </g>
        );
      })}

      {messages.map((m, i) => {
        const y = headerY + 30 + (i + 1) * stepY;
        const x1 = colW * (m.from + 1);
        const x2 = colW * (m.to + 1);
        const labelX = (x1 + x2) / 2;
        return (
          <g key={m.n}>
            <line
              x1={x1}
              y1={y}
              x2={x2}
              y2={y}
              stroke="hsl(258 78% 64%)"
              strokeOpacity={m.ret ? 0.5 : 0.9}
              strokeWidth="1.5"
              strokeDasharray={m.ret ? "5 4" : undefined}
              markerEnd={`url(#${titleId}-arrow)`}
            />
            <text x={labelX} y={y - 6} textAnchor="middle" fontSize="11" fontFamily="ui-monospace, monospace" fill="hsl(220 5% 85%)">
              <tspan fill="hsl(258 85% 78%)">{m.n} </tspan>
              {m.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function SequenceCanvas() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface/40">
      <SequenceSvg
        actors={ENTRY_ACTORS}
        messages={ENTRY_MESSAGES}
        title="Park-a-car entry sequence"
        desc="Vehicle arrives at Gate; Gate requests entry from ParkingLot; ParkingLot finds an available spot, issues a ticket, opens the gate, and updates the display board; Gate grants entry to the Vehicle."
      />
      <ul className="sr-only">
        {ENTRY_MESSAGES.map((m) => (
          <li key={m.n}>
            Step {m.n}: {ENTRY_ACTORS[m.from]} {m.ret ? "returns" : "calls"} {m.label} {m.ret ? "to" : "on"} {ENTRY_ACTORS[m.to]}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ExitSequenceCanvas() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface/40">
      <SequenceSvg
        actors={EXIT_ACTORS}
        messages={EXIT_MESSAGES}
        title="Exit + payment sequence"
        desc="Vehicle presents ticket at Gate; ParkingLot computes fare; PaymentService charges with idempotency key, captures funds; ParkingLot releases the spot back to VACANT; Gate opens only on successful capture."
      />
      <ul className="sr-only">
        {EXIT_MESSAGES.map((m) => (
          <li key={m.n}>
            Step {m.n}: {EXIT_ACTORS[m.from]} {m.ret ? "returns" : "calls"} {m.label} {m.ret ? "to" : "on"} {EXIT_ACTORS[m.to]}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Scaling diagram — three architecture panels with iconified components
// ─────────────────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Server,
  Database,
  Cloud,
  Network,
};

export function ScalingDiagram() {
  return (
    <div className="grid gap-4 rounded-xl border border-border bg-surface/40 p-6 lg:grid-cols-3">
      {SCALING_TIERS.map((tier, idx) => (
        <div key={tier.name} className="relative flex flex-col">
          <div className="mb-3 flex items-baseline justify-between">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[hsl(258_85%_76%)]">
              {tier.name}
            </p>
            <p className="font-mono text-[10px] text-muted-foreground">{tier.caption}</p>
          </div>
          <div className="flex-1 rounded-lg border border-border bg-elevated/40 p-4">
            <div className="space-y-2">
              {tier.components.map((c, i) => {
                const Icon = ICON_MAP[c.iconKey] ?? Server;
                return (
                  <div key={i} className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "flex size-7 items-center justify-center rounded-md border",
                        c.accent
                          ? "border-[hsl(258_78%_64%)]/60 bg-[hsl(258_78%_64%)]/15 text-[hsl(258_85%_76%)] shadow-[0_0_12px_hsl(258_78%_64%/0.4)]"
                          : "border-border/60 bg-surface text-foreground/70",
                      )}
                    >
                      <Icon className="size-3.5" />
                    </div>
                    <span className="text-[12px] text-foreground/80">{c.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">{tier.description}</p>
          {idx < SCALING_TIERS.length - 1 ? (
            <ArrowRight aria-hidden className="absolute -right-3 top-1/2 hidden size-5 -translate-y-1/2 text-[hsl(258_78%_64%)]/60 lg:block" />
          ) : null}
        </div>
      ))}
    </div>
  );
}
