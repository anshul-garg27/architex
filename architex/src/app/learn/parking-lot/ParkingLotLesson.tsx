"use client";

import { useState, useMemo } from "react";
import { Trophy, Clock, Target, BookOpen, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  HeroParkingGrid,
  RelationshipsCanvas,
  SequenceCanvas,
  ExitSequenceCanvas,
  ScalingDiagram,
} from "./LessonDiagrams";

import {
  ReadingProgressBar,
  LessonHeader,
  ChapterMasthead,
  SpineToc,
  Section,
  ActBreak,
  Lead,
  Mark,
  Callout,
  GlossaryTerm,
  GlossaryProvider,
  CodeBlock,
  UmlPrimer,
  BeginnerNote,
  SeniorShortcut,
  SECTIONS,
} from "./_Primitives";

import { DifficultyProvider } from "./_DifficultyContext";
import { DifficultyOnboarding } from "./_DifficultySelector";

import {
  PredictBeforeReveal,
  RetrievalCheck,
  PatternFitJudge,
  AntiPatternMuseum,
  EdgeCasesList,
  StateMachineWidget,
  RETRIEVAL_CARDS,
} from "./_Widgets";

import {
  FUNCTIONAL,
  NON_FUNCTIONAL,
  VEHICLE_TYPES,
  SPOT_TYPES,
  PATTERNS,
  TRANSFERS,
} from "./_data";

// ─────────────────────────────────────────────────────────────────────────────
//  Hero (chapter masthead + ambient grid + CTAs)
// ─────────────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="pt-2">
      <ChapterMasthead />
      <div className="mt-6 flex items-center gap-3">
        <Button size="lg" asChild>
          <a href="#hook">
            Start lesson <ArrowRight aria-hidden className="size-4" />
          </a>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <a href="#transfer">Skip to challenge</a>
        </Button>
      </div>
      <div className="relative mt-12">
        <HeroParkingGrid />
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Section 1 — Hook
// ─────────────────────────────────────────────────────────────────────────────

function HookSection({ registerActive }: { registerActive: (id: string) => void }) {
  return (
    <Section id="hook" num={1} title="Every parking lot is software" kicker="The world" registerActive={registerActive}>
      <Lead>
        The barrier that lifts when you tap your card. The display board flashing
        AVAILABLE 47 / 240. The receipt printed at the exit. The algorithm choosing which
        slot to suggest. Behind every concrete lot is a system that someone — probably
        under interview pressure — had to design from scratch.
      </Lead>
      <p>
        Today, that someone is you. By the end of this page you will have designed a
        production-grade parking lot system end to end — not because parking lots are
        interesting, but because <Mark>every system you build for the rest of your career
        is some variation of this same problem</Mark>. Reservations, slot allocation, state
        machines, pricing strategies, concurrent access. You learn the parking lot, you
        learn the architecture pattern that powers Airbnb, OpenTable, hotel valet, hospital
        beds, conference rooms, and chess tournaments.
      </p>
      <Callout tone="insight" title="Why this problem is THE LLD problem">
        It tests every layer of OOP simultaneously: <GlossaryTerm term="invariant">entity invariants</GlossaryTerm>,
        inheritance vs composition, relationship topology, state lifecycles, and
        <GlossaryTerm term="race condition"> concurrency</GlossaryTerm>. Most candidates can
        name patterns; few can place them at the right seam in a real system. This page
        builds the judgment, not just the knowledge.
      </Callout>
      <BeginnerNote title="Reading-mode primer">
        You picked the <strong className="text-[hsl(140_60%_70%)]">New to LLD</strong> track. Every jargon term has a{" "}
        <span aria-hidden>ⓘ</span> badge — hover or focus it for a one-line definition.
        We&apos;ll also pause at hard moments with green cards like this one. You don&apos;t
        need to memorize anything; you need to build a mental picture. Take your time.
      </BeginnerNote>
      <SeniorShortcut to="#concurrency" label="Skip to §7">
        Hook + brief + entity discovery is rote at your level. The real meat starts with{" "}
        <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[12px]">SELECT FOR UPDATE SKIP LOCKED</code>.
      </SeniorShortcut>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Section 2 — Requirements
// ─────────────────────────────────────────────────────────────────────────────

function RequirementsSection({ registerActive }: { registerActive: (id: string) => void }) {
  return (
    <Section id="requirements" num={2} title="The brief — write requirements first" kicker="The brief" registerActive={registerActive}>
      <p>
        Before you write a single class, you write the brief. A parking lot's requirements
        split cleanly into two families: <Mark>functional</Mark> (what it does) and{" "}
        <Mark>non-functional</Mark> (how well it does it under stress).
      </p>
      <p>
        The functional ones are obvious — anyone who has been in a parking lot can name
        them. The non-functional ones are where engineers separate from architects. <GlossaryTerm term="p99 latency" />?
        <GlossaryTerm term="ACID"> ACID</GlossaryTerm> payments? You don't see those in the lot itself, but they're what break your design at scale.
      </p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface/40 p-5">
          <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[hsl(258_85%_76%)]">
            <span className="inline-block size-1.5 rounded-full bg-[hsl(258_78%_64%)]" />
            Functional
          </div>
          <ul className="space-y-2">
            {FUNCTIONAL.map((r) => (
              <li key={r.label} className="rounded-md bg-elevated/40 px-3 py-2 transition-colors hover:bg-elevated">
                <p className="text-sm text-foreground">{r.label}</p>
                <p className="font-mono text-[11px] text-muted-foreground">{r.hint}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 p-5">
          <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[hsl(35_90%_70%)]">
            <span className="inline-block size-1.5 rounded-full bg-[hsl(35_90%_55%)]" />
            Non-functional
          </div>
          <ul className="space-y-2">
            {NON_FUNCTIONAL.map((r) => (
              <li key={r.label} className="rounded-md bg-elevated/40 px-3 py-2 transition-colors hover:bg-elevated">
                <p className="text-sm text-foreground">
                  {r.term ? <GlossaryTerm term={r.term}>{r.label}</GlossaryTerm> : r.label}
                </p>
                <p className="font-mono text-[11px] text-muted-foreground">{r.hint}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Section 3 — Entities (real predict-first)
// ─────────────────────────────────────────────────────────────────────────────

function EntitiesSection({ registerActive }: { registerActive: (id: string) => void }) {
  const card = RETRIEVAL_CARDS.find((c) => c.afterSection === "entities");
  return (
    <Section id="entities" num={3} title="What objects exist in this system?" kicker="Discovery" registerActive={registerActive}>
      <Lead>
        Stop. Don't read on yet. Spend 30 seconds and list every object you'd put in a
        parking-lot system. Then submit it below — we'll grade it against the canonical set.
      </Lead>
      <PredictBeforeReveal />
      <Callout tone="insight" title="What's NOT here">
        No <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[12px]">User</code>.
        No <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[12px]">Login</code>.
        No <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[12px]">Authentication</code>.
        The parking lot tracks license plates and money — not identities.{" "}
        <Mark>The minimum viable entity set captures the system's invariants, not the real world.</Mark>{" "}
        Notice <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[12px]">Reservation</code>{" "}
        as the 9th — it's the future-tense claim on a spot, distinct from{" "}
        <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[12px]">Ticket</code>{" "}
        (active occupancy). On arrival, the Reservation is converted into a Ticket — same
        spot, new entity, foreign-key preserved for audit. Conflating them is the most common
        modeling error in this problem.
      </Callout>
      {card ? <RetrievalCheck card={card} /> : null}
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Section 4 — Hierarchies
// ─────────────────────────────────────────────────────────────────────────────

function InheritanceTree({
  parent,
  children: childList,
}: {
  parent: string;
  children: ReadonlyArray<{ name: string; icon: React.ComponentType<{ className?: string }>; attr: string }>;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface/40 p-6">
      <div className="mx-auto mb-1 flex w-full justify-center">
        <div className="rounded-lg border border-[hsl(258_78%_64%)]/30 bg-[hsl(258_78%_64%)]/5 px-4 py-2.5 text-center">
          <p className="font-mono text-[10px] italic text-[hsl(258_85%_76%)]">
            <GlossaryTerm term="abstract class">abstract</GlossaryTerm>
          </p>
          <p className="font-semibold text-foreground">{parent}</p>
        </div>
      </div>
      <div className="my-3 flex h-6 justify-center">
        <div className="h-full w-px bg-border" />
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        {childList.map((c) => (
          <div key={c.name} className="rounded-lg border border-border bg-elevated/40 p-3 text-center transition-colors hover:border-[hsl(258_78%_64%)]/40">
            <c.icon aria-hidden className="mx-auto mb-1.5 size-4 text-[hsl(258_85%_76%)]/70" />
            <p className="text-xs font-medium text-foreground">{c.name}</p>
            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{c.attr}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function HierarchiesSection({ registerActive }: { registerActive: (id: string) => void }) {
  return (
    <Section id="hierarchies" num={4} title="What gets a class hierarchy, what doesn't" kicker="Inheritance vs composition" registerActive={registerActive}>
      <p>
        Vehicles have types — Car, Bike, Truck, EV. Slots have types — Compact, Large,
        Handicap, EV-Charging. The temptation, if you're new to OOP, is to put a{" "}
        <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[12px]">type: string</code>{" "}
        field on each. <Mark>This is the bug factory.</Mark> Every time you read that
        string, you have to handle every case. Add a new type? Audit every place that
        branches on it.
      </p>
      <p>The fix: a hierarchy. The compiler now enforces your design.</p>
      <BeginnerNote title="What's an abstract class, in 30 seconds?">
        Think of <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[12px]">abstract class Vehicle</code> as a
        <em> blueprint that cannot be built directly.</em> You can&apos;t write{" "}
        <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[12px]">new Vehicle()</code> — the compiler refuses.
        Only its concrete subclasses (Car, Bike, Truck, EV) can be instantiated. The blueprint
        defines the <em>shape</em> every Vehicle must have; each subclass fills in the details.
        In Python this is{" "}
        <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[12px]">ABC</code>; in TypeScript and Java it&apos;s the{" "}
        <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[12px]">abstract</code> keyword.
      </BeginnerNote>
      <div className="grid gap-6 lg:grid-cols-2">
        <InheritanceTree parent="Vehicle" children={VEHICLE_TYPES} />
        <InheritanceTree parent="ParkingSpot" children={SPOT_TYPES} />
      </div>
      <Callout tone="warn" title="Why doesn't Ticket get a hierarchy?">
        Because all tickets behave the same way. The shape{" "}
        <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[12px]">entryTime + amount + status</code>{" "}
        covers every case. <Mark>Hierarchies cost — they add inheritance complexity. Use
        them when subtypes have different behavior, not just different data.</Mark>
      </Callout>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Section 5 — Relationships (with UML primer)
// ─────────────────────────────────────────────────────────────────────────────

function RelationshipsSection({ registerActive }: { registerActive: (id: string) => void }) {
  return (
    <Section id="relationships" num={5} title="How the pieces connect" kicker="Topology" registerActive={registerActive}>
      <UmlPrimer />
      <p>
        Now the topology. Every entity touches at least one other through a labeled
        relationship with a specific <GlossaryTerm term="cardinality" />. Cardinality is
        where designs fail — the difference between{" "}
        <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[12px]">[0..1]</code>{" "}
        and <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[12px]">[1..*]</code>{" "}
        is the difference between a working system and a bug that compiles.
      </p>
      <RelationshipsCanvas />
      <Callout tone="insight" title="Cardinality encodes invariants">
        <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[12px]">Vehicle USES-A ParkingSpot [0..1]</code>{" "}
        means a Vehicle is in zero or one spot at a time. A{" "}
        <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[12px]">[1..*]</code>{" "}
        would let one vehicle occupy multiple slots — a state your system should reject
        at compile time, not at runtime.
      </Callout>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Section 6 — Sequence (with ParkingLotManager intro)
// ─────────────────────────────────────────────────────────────────────────────

function SequenceSection({ registerActive }: { registerActive: (id: string) => void }) {
  return (
    <Section id="sequence" num={6} title="What happens when a car arrives" kicker="Sequence" registerActive={registerActive}>
      <p>
        Static structure isn't enough. Watch the messages flow when a car arrives at the
        gate. Notice the Vehicle <em>doesn't</em> directly tell the Spot &quot;I'm parking
        here&quot; — it goes through the Gate, which goes through the{" "}
        <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[12px]">ParkingLotManager</code>.
      </p>
      <Callout tone="info" title="A new entity arrives — ParkingLotManager">
        We're introducing a software-only object that wasn't in the canonical 9 entities
        — it's a <Mark>seam</Mark>, not a real-world thing. ParkingLotManager owns the
        invariant <em>only one Vehicle can occupy a Spot</em>. Every entry/exit goes
        through it. Bypass it and you get the concurrent-entry race we'll fix in §7.
      </Callout>
      <SequenceCanvas />
      <p>
        The <em>exit</em> path is symmetric but adds money. Same coordinator, plus a
        Payment service with strict <GlossaryTerm term="idempotency"/> guarantees.
      </p>
      <ExitSequenceCanvas />
      <Callout tone="warn" title="Idempotency contract — never optimistic-open the gate">
        The gate kiosk generates a <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[12px]">paymentIntentId</code> UUID
        <em> before</em> calling charge. Payment service stores
        <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[12px]">(paymentIntentId, ticketId, status, amount)</code>
        with the intent id as a unique key. Retries reuse the same id; the second call
        returns the first call's result. Exit gate opens <Mark>only</Mark> on{" "}
        <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[12px]">status='CAPTURED'</code>.
        Open optimistically and you create the gate-opened-charge-failed disaster — car
        gone, money never settled.
      </Callout>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Section 7 — Concurrency primitives (NEW)
// ─────────────────────────────────────────────────────────────────────────────

const CONCURRENCY_SQL = [
  "-- Allocation: atomic 'find + claim' with SKIP LOCKED",
  "BEGIN;",
  "",
  "SELECT spot_id FROM spots",
  "  WHERE lot_id = $1 AND type = $2 AND state = 'VACANT'",
  "  ORDER BY spot_id LIMIT 1",
  "  FOR UPDATE SKIP LOCKED;",
  "",
  "UPDATE spots",
  "  SET state='OCCUPIED', vehicle_id=$3, version=version+1",
  "  WHERE spot_id = $4;",
  "",
  "INSERT INTO tickets (id, vehicle_id, spot_id, entry_time)",
  "  VALUES ($5, $3, $4, NOW());",
  "",
  "COMMIT;",
];

function ConcurrencySection({ registerActive }: { registerActive: (id: string) => void }) {
  return (
    <Section id="concurrency" num={7} title="The race nobody warns you about" kicker="Concurrency primitives" registerActive={registerActive}>
      <Lead>
        Two cars hit two gates at the same instant. Both gates ask the manager for the
        last available spot. Both get spot 47. Both park. <Mark>You just double-booked the
        same physical concrete.</Mark>
      </Lead>
      <p>
        The naive fix — <GlossaryTerm term="optimistic lock"/> with a version counter — works
        for <em>updates</em> but doesn't help here. The real bug is{" "}
        <em>find-then-claim</em>: between the read and the write, another transaction can
        sneak in. You need an atomic primitive that <Mark>does both at once</Mark>.
      </p>
      <p>
        Postgres has it. The single most-tested SQL clause in any LLD interview:
      </p>
      <CodeBlock language="sql" lines={CONCURRENCY_SQL} highlightAdded={[7]} />
      <Callout tone="insight" title="SKIP LOCKED — the whole story">
        <GlossaryTerm term="SKIP LOCKED"/> is what separates a system that handles 100 cars/sec
        from one that deadlocks at 10. When two transactions race for the same spot, the
        loser <em>doesn't wait</em> — it skips past the locked row and grabs the next
        available. Optimistic versioning is the cross-process fallback; the row lock is
        the single-DB primitive.
      </Callout>
      <p>
        At enterprise scale (10M+ cars/day), this primitive moves to a per-lot Postgres
        shard. Cross-region <GlossaryTerm term="two-phase commit">two-phase commit</GlossaryTerm> is
        avoided — the slot invariant lives at the lot boundary, not globally. We'll revisit
        this in §13.
      </p>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Section 8 — State machine
// ─────────────────────────────────────────────────────────────────────────────

function StateSection({ registerActive }: { registerActive: (id: string) => void }) {
  const card = RETRIEVAL_CARDS.find((c) => c.afterSection === "state");
  return (
    <Section id="state" num={8} title="The slot has a lifecycle" kicker="State machine" registerActive={registerActive}>
      <p>
        VACANT → OCCUPIED when a car parks. OCCUPIED → VACANT when it leaves. But also:
        VACANT → MAINTENANCE when there's a flat tire on the spot, MAINTENANCE → VACANT
        when fixed, OCCUPIED → MAINTENANCE if there's an incident with a parked car.
      </p>
      <p>
        <Mark>Click a transition below.</Mark> Notice the system rejects invalid moves —
        you can&apos;t go from MAINTENANCE directly to OCCUPIED without first becoming
        VACANT. That&apos;s a state machine doing its job.
      </p>
      <StateMachineWidget />
      {card ? <RetrievalCheck card={card} /> : null}
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Section 9 — Patterns (with judge widget)
// ─────────────────────────────────────────────────────────────────────────────

function PatternsSection({ registerActive }: { registerActive: (id: string) => void }) {
  return (
    <Section id="patterns" num={9} title="Five patterns appear at point of need" kicker="GoF in context" registerActive={registerActive}>
      <p>
        You've now built the system. As you did, five <GlossaryTerm term="GoF"/> patterns
        naturally appeared — not because a textbook said so, but because the design
        started hurting in specific places and these were the cleanest ways to relieve
        the pressure.
      </p>
      <SeniorShortcut to="#anti-patterns" label="Skip to §11">
        Pattern names are not the bottleneck for you. The judgment about{" "}
        <em>when not to apply them</em> is. The Anti-Pattern Museum is where it gets sharp.
      </SeniorShortcut>
      <div className="grid gap-3 sm:grid-cols-2">
        {PATTERNS.map((p) => (
          <div key={p.name} className="rounded-lg border border-border bg-surface/40 p-4 transition-colors hover:border-[hsl(258_78%_64%)]/40">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">{p.name}</h3>
              <Badge variant="outline" className="border-[hsl(258_78%_64%)]/30 bg-[hsl(258_78%_64%)]/5 font-mono text-[10px] text-[hsl(258_85%_76%)]">
                {p.what}
              </Badge>
            </div>
            <p className="text-[12px] italic text-[hsl(258_85%_76%)]/80">{p.oneLine}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{p.why}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-xl border border-[hsl(258_78%_64%)]/25 bg-[hsl(258_78%_64%)]/[0.025] p-5">
        <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-[hsl(258_85%_76%)]">
          Pattern fit · judge yourself
        </div>
        <h3 className="mb-1 text-base font-semibold text-foreground">
          Six situations. One pattern fits each. Pick the right one.
        </h3>
        <p className="mb-5 text-[13px] text-muted-foreground">
          The wrong-but-tempting options reveal the trap most candidates fall into.
        </p>
        <PatternFitJudge />
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Section 10 — Pricing (NEW Money seam)
// ─────────────────────────────────────────────────────────────────────────────

const PRICING_CODE = [
  "interface PricingPolicy {",
  "  fareFor(ticket: Ticket, exit: Date): Money;",
  "}",
  "",
  "class TieredHourlyPolicy implements PricingPolicy {",
  "  constructor(",
  "    private graceMin: number,",
  "    private firstHour: Money,",
  "    private perQuarterHour: Money,",
  "    private dailyCap: Money,",
  "  ) {}",
  "",
  "  fareFor(t: Ticket, exit: Date): Money {",
  "    const mins = Math.max(0, diffMin(exit, t.entryTime) - this.graceMin);",
  "    if (mins === 0) return Money.zero();",
  "    const extras = Math.ceil(Math.max(0, mins - 60) / 15);",
  "    return Money.min(",
  "      this.dailyCap,",
  "      this.firstHour.plus(this.perQuarterHour.times(extras)),",
  "    );",
  "  }",
  "}",
];

function PricingSection({ registerActive }: { registerActive: (id: string) => void }) {
  return (
    <Section id="pricing" num={10} title="The most-tested Strategy seam — money math" kicker="Pricing" registerActive={registerActive}>
      <p>
        Strategy is named in §9 but never shown computing money. That's exactly where
        L5+ interviewers land: <em>&quot;charge $X for first hour, $Y/15min after, cap
        at daily max, with a 10-min grace period.&quot;</em> If your design can't answer
        that cleanly, the candidate has not really applied Strategy — they've just named it.
      </p>
      <CodeBlock language="ts" lines={PRICING_CODE} />
      <Callout tone="danger" title="Never use number for money">
        JavaScript's <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[12px]">number</code>{" "}
        is a 64-bit float. <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[12px]">0.1 + 0.2 !== 0.3</code>.{" "}
        Use a <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[12px]">Money</code>{" "}
        value object backed by integer minor units (cents, paise). Arithmetic, comparison,
        and serialization go through it. <Mark>Every senior engineer has been bitten by this
        once. The lesson is to never get bitten twice.</Mark>
      </Callout>
      <p>
        Adding a new pricing model — event surge, monthly subscription, lost-ticket flat
        fee — means writing a new class implementing the same interface. Ticket never
        changes. That's the Strategy seam, and it's what makes pricing surveys not break
        the rest of the system.
      </p>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Section 11 — Anti-patterns (side-by-side diff)
// ─────────────────────────────────────────────────────────────────────────────

function AntiPatternsSection({ registerActive }: { registerActive: (id: string) => void }) {
  const card = RETRIEVAL_CARDS.find((c) => c.afterSection === "anti-patterns");
  return (
    <Section id="anti-patterns" num={11} title="What NOT to do" kicker="Anti-pattern museum" registerActive={registerActive}>
      <p>
        Most courses only show good designs. We show failures because{" "}
        <Mark>judgment is the gap</Mark> between someone who can recite patterns and
        someone who can architect a system. Each row below shows the smell on the left and
        the fix on the right — the bug isn't behind a toggle, it's right next to its
        correction.
      </p>
      <AntiPatternMuseum />
      {card ? <RetrievalCheck card={card} /> : null}
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Section 12 — Edge cases
// ─────────────────────────────────────────────────────────────────────────────

function EdgeCasesSection({ registerActive }: { registerActive: (id: string) => void }) {
  return (
    <Section id="edge-cases" num={12} title="What breaks the happy path" kicker="Edge cases" registerActive={registerActive}>
      <p>
        Your design works for the happy path. Now stress it. <Mark>The edge cases are
        where the design either holds or shatters.</Mark> Each row below is a real
        failure mode you must answer for in any LLD interview.
      </p>
      <EdgeCasesList />
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Section 13 — Scaling
// ─────────────────────────────────────────────────────────────────────────────

function ScalingSection({ registerActive }: { registerActive: (id: string) => void }) {
  return (
    <Section id="scaling" num={13} title="Same design, different constraints" kicker="Scaling" registerActive={registerActive}>
      <p>
        Your design works for one lot with 240 slots. Now make it work for a chain of
        100 lots. Now for 10,000 lots distributed across continents. <Mark>The classes
        don't change. The infrastructure around them does.</Mark>
      </p>
      <ScalingDiagram />
      <Callout tone="insight" title="The split that catches L5+ candidates">
        At enterprise scale you cannot have eventual consistency on slot{" "}
        <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[12px]">state</code>{" "}
        — two cars cannot both park in spot 47 because Redis hasn't replicated yet.
        <Mark> Partition the consistency model:</Mark> allocation <em>writes</em> stay
        strongly consistent within a single lot's shard (one Postgres primary per lot,{" "}
        <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[12px]">FOR UPDATE SKIP LOCKED</code>).
        Availability <em>reads</em> (display boards, mobile app &quot;find a lot near me&quot;) fan out
        from a Redis edge cache populated by Kafka events with a 1-5s staleness budget.
        The slot invariant lives at the lot boundary; the global view is an
        eventually-consistent projection. Shard by{" "}
        <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[12px]">lotId</code>, never by{" "}
        <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-[12px]">spotId</code>.
      </Callout>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Section 14 — Transfer challenge
// ─────────────────────────────────────────────────────────────────────────────

function TransferSection({ registerActive }: { registerActive: (id: string) => void }) {
  return (
    <Section id="transfer" num={14} title="Apply what you learned" kicker="Transfer challenge" registerActive={registerActive}>
      <p>
        You've designed a parking lot. The patterns you used — Strategy, State, Singleton,
        Observer, Factory — transfer cleanly to other domains. <Mark>Pick one. Design it
        in 10 minutes.</Mark> Same patterns. Different surface.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        {TRANSFERS.map((t) => (
          <div key={t.name} className="group flex flex-col gap-3 rounded-xl border border-border bg-surface/40 p-5 transition-all hover:-translate-y-0.5 hover:border-[hsl(258_78%_64%)]/40 hover:shadow-[0_0_40px_-10px_hsl(258_78%_64%/0.4)]">
            <div className="flex items-start justify-between gap-2">
              <Target aria-hidden className="size-4 text-[hsl(258_85%_76%)]" />
              <Badge variant="outline" className="border-border/60 bg-elevated/40 text-[10px] text-muted-foreground">
                10 min
              </Badge>
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">{t.name}</h3>
              <p className="mt-1 text-[13px] text-muted-foreground">{t.domain}</p>
            </div>
            <ul className="mt-auto space-y-1">
              {t.patterns.map((p) => (
                <li key={p} className="font-mono text-[11px] text-foreground/70">· {p}</li>
              ))}
            </ul>
            <Button size="sm" variant="outline" className="mt-2 w-full">
              Start <ArrowRight aria-hidden className="size-3" />
            </Button>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Completion
// ─────────────────────────────────────────────────────────────────────────────

function Completion() {
  return (
    <section className="relative my-16 overflow-hidden rounded-2xl border border-[hsl(258_78%_64%)]/30 bg-gradient-to-br from-[hsl(258_78%_64%)]/10 via-surface to-background p-10 text-center">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, hsl(258 78% 64% / 0.15), transparent 40%), radial-gradient(circle at 80% 50%, hsl(35 90% 55% / 0.10), transparent 40%)",
        }}
        aria-hidden
      />
      <div className="relative">
        <Trophy aria-hidden className="mx-auto size-8 text-[hsl(258_85%_76%)]" />
        <h2 className="mt-4 text-3xl font-semibold tracking-tight">
          Parking Lot —{" "}
          <span className="text-[hsl(258_85%_76%)] [text-shadow:0_0_24px_hsl(258_78%_64%/0.45)]">
            mastered
          </span>
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          14 sections complete · 6 edge cases reviewed · 5 patterns judged · 3 retrieval cards
        </p>
        <div className="mx-auto mt-6 inline-flex items-center gap-1 rounded-full border border-border bg-surface/60 p-1 text-xs">
          {[
            { label: "Introduced", active: true },
            { label: "Completed", active: true },
            { label: "Mastered", active: true, current: true },
          ].map((m) => (
            <span
              key={m.label}
              className={cn(
                "rounded-full px-3 py-1 transition-colors",
                m.current
                  ? "bg-[hsl(258_78%_64%)] text-primary-foreground shadow-[0_0_24px_hsl(258_78%_64%/0.6)]"
                  : m.active
                    ? "bg-elevated text-foreground"
                    : "text-muted-foreground",
              )}
            >
              {m.label}
            </span>
          ))}
        </div>
        <p className="mt-4 font-mono text-[11px] text-muted-foreground">
          next <GlossaryTerm term="FSRS"/> review in 1 day
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <a href="#transfer">
              <Target aria-hidden className="size-4" />
              Try transfer challenge
            </a>
          </Button>
          <Button variant="outline">
            <Clock aria-hidden className="size-4" />
            Schedule review
          </Button>
          <Button variant="ghost">
            <BookOpen aria-hidden className="size-4" />
            Next pattern
          </Button>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Page composition
// ─────────────────────────────────────────────────────────────────────────────

export default function ParkingLotLesson() {
  const [activeId, setActiveId] = useState<string>("hook");
  const completedIds = useMemo<Set<string>>(() => {
    const idx = SECTIONS.findIndex((s) => s.id === activeId);
    return new Set(SECTIONS.slice(0, Math.max(0, idx)).map((s) => s.id));
  }, [activeId]);

  return (
    <DifficultyProvider>
      <GlossaryProvider>
        <DifficultyOnboarding />
        <div className="min-h-screen bg-background text-foreground">
          <ReadingProgressBar />
          <LessonHeader activeId={activeId} />

          <div className="mx-auto max-w-7xl px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-12">
            <main className="min-w-0">
              <Hero />

              {/* ACT I — Setup */}
              <HookSection registerActive={setActiveId} />
              <RequirementsSection registerActive={setActiveId} />

              <ActBreak act={2} />

              {/* ACT II — Build */}
              <EntitiesSection registerActive={setActiveId} />
              <HierarchiesSection registerActive={setActiveId} />
              <RelationshipsSection registerActive={setActiveId} />
              <SequenceSection registerActive={setActiveId} />
              <ConcurrencySection registerActive={setActiveId} />
              <StateSection registerActive={setActiveId} />

              <ActBreak act={3} />

              {/* ACT III — Stress */}
              <PatternsSection registerActive={setActiveId} />
              <PricingSection registerActive={setActiveId} />
              <AntiPatternsSection registerActive={setActiveId} />
              <EdgeCasesSection registerActive={setActiveId} />

              <ActBreak act={4} />

              {/* ACT IV — Apply */}
              <ScalingSection registerActive={setActiveId} />
              <TransferSection registerActive={setActiveId} />

              <Completion />
            </main>

            <SpineToc activeId={activeId} completedIds={completedIds} />
          </div>
        </div>
      </GlossaryProvider>
    </DifficultyProvider>
  );
}
