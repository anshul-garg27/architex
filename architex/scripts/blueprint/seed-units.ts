/**
 * scripts/blueprint/seed-units.ts
 *
 * Idempotent seed for the Blueprint course + 12 placeholder units.
 * Uses raw `pg` client (not the drizzle client) so this script runs
 * cleanly under tsx/Node without hitting the ESM-resolution thicket
 * we wrestled with last session on the LLD compile pipeline.
 *
 * Usage:
 *   DATABASE_URL=postgres://... pnpm blueprint:seed-units
 *
 * Exit codes:
 *   0  success — all 12 units upserted
 *   1  DATABASE_URL missing or DB unreachable
 */

import { Client } from "pg";

interface UnitSeed {
  slug: string;
  ordinal: number;
  title: string;
  summary: string;
  durationMinutes: number;
  difficulty: "foundation" | "intermediate" | "advanced";
  prereqUnitSlugs: string[];
  tags: string[];
  entityRefs: { patterns: string[]; problems: string[] };
}

const COURSE_SLUG = "blueprint-core";
const COURSE_TITLE = "The Blueprint Course";
const COURSE_DESCRIPTION =
  "Design patterns, one unit at a time. Twelve units covering foundations, canonical GoF patterns, and applied problems — hand-authored.";

const UNITS: UnitSeed[] = [
  {
    slug: "what-is-a-pattern",
    ordinal: 1,
    title: "What is a design pattern?",
    summary:
      "What GoF patterns are and aren't. When to reach for one. An early look at Strategy.",
    durationMinutes: 45,
    difficulty: "foundation",
    prereqUnitSlugs: [],
    tags: ["foundation"],
    entityRefs: { patterns: ["strategy"], problems: [] },
  },
  {
    slug: "coupling-cohesion",
    ordinal: 2,
    title: "Coupling, cohesion, and the cost of a class",
    summary:
      "High cohesion, low coupling, SRP. Why classes exist. What an interface buys you.",
    durationMinutes: 60,
    difficulty: "foundation",
    prereqUnitSlugs: ["what-is-a-pattern"],
    tags: ["foundation"],
    entityRefs: { patterns: [], problems: [] },
  },
  {
    slug: "open-closed-principle",
    ordinal: 3,
    title: "The open-closed principle and its discontents",
    summary:
      "SOLID with emphasis on OCP. A preview of how patterns deliver extensibility without modification.",
    durationMinutes: 50,
    difficulty: "foundation",
    prereqUnitSlugs: ["coupling-cohesion"],
    tags: ["foundation"],
    entityRefs: { patterns: ["observer"], problems: [] },
  },
  {
    slug: "making-objects",
    ordinal: 4,
    title: "Making objects, but flexibly",
    summary:
      "Factory Method, Abstract Factory, Singleton — three approaches to 'do not new directly'.",
    durationMinutes: 75,
    difficulty: "intermediate",
    prereqUnitSlugs: ["open-closed-principle"],
    tags: ["creational"],
    entityRefs: {
      patterns: ["factory-method", "abstract-factory", "singleton"],
      problems: [],
    },
  },
  {
    slug: "constructors-that-dont-explode",
    ordinal: 5,
    title: "Constructors that don't explode",
    summary: "Builder, Prototype — when constructors get out of hand.",
    durationMinutes: 45,
    difficulty: "intermediate",
    prereqUnitSlugs: ["making-objects"],
    tags: ["creational"],
    entityRefs: { patterns: ["builder", "prototype"], problems: [] },
  },
  {
    slug: "reshaping-interfaces",
    ordinal: 6,
    title: "Reshaping interfaces",
    summary: "Adapter, Facade — make one thing look like another.",
    durationMinutes: 60,
    difficulty: "intermediate",
    prereqUnitSlugs: ["constructors-that-dont-explode"],
    tags: ["structural"],
    entityRefs: { patterns: ["adapter", "facade"], problems: [] },
  },
  {
    slug: "adding-responsibility",
    ordinal: 7,
    title: "Adding responsibility without inheritance",
    summary: "Decorator, Proxy — wrapping behavior.",
    durationMinutes: 55,
    difficulty: "intermediate",
    prereqUnitSlugs: ["reshaping-interfaces"],
    tags: ["structural"],
    entityRefs: { patterns: ["decorator", "proxy"], problems: [] },
  },
  {
    slug: "trees-and-abstractions",
    ordinal: 8,
    title: "Trees, graphs, and the cost of abstraction",
    summary:
      "Composite, Bridge, Flyweight — patterns for structure, not behavior.",
    durationMinutes: 65,
    difficulty: "advanced",
    prereqUnitSlugs: ["adding-responsibility"],
    tags: ["structural"],
    entityRefs: {
      patterns: ["composite", "bridge", "flyweight"],
      problems: [],
    },
  },
  {
    slug: "communicating-without-coupling",
    ordinal: 9,
    title: "Communicating without coupling",
    summary:
      "Observer, Mediator, Chain of Responsibility — how objects talk.",
    durationMinutes: 75,
    difficulty: "advanced",
    prereqUnitSlugs: ["trees-and-abstractions"],
    tags: ["behavioral"],
    entityRefs: {
      patterns: ["observer", "mediator", "chain-of-responsibility"],
      problems: [],
    },
  },
  {
    slug: "algorithms-as-objects",
    ordinal: 10,
    title: "Algorithms as objects",
    summary:
      "Strategy (deepened), Template Method, Command — encapsulating a verb.",
    durationMinutes: 60,
    difficulty: "advanced",
    prereqUnitSlugs: ["communicating-without-coupling"],
    tags: ["behavioral"],
    entityRefs: {
      patterns: ["strategy", "template-method", "command"],
      problems: [],
    },
  },
  {
    slug: "state-memory-traversal",
    ordinal: 11,
    title: "State, memory, and traversal",
    summary:
      "State, Memento, Iterator, Visitor — first-class internal structure.",
    durationMinutes: 70,
    difficulty: "advanced",
    prereqUnitSlugs: ["algorithms-as-objects"],
    tags: ["behavioral"],
    entityRefs: {
      patterns: ["state", "memento", "iterator", "visitor"],
      problems: [],
    },
  },
  {
    slug: "systems-using-patterns",
    ordinal: 12,
    title: "Systems that use patterns together",
    summary:
      "Four applied problems walked end-to-end: Parking Lot, Library Management, LRU Cache, Chess.",
    durationMinutes: 120,
    difficulty: "advanced",
    prereqUnitSlugs: ["state-memory-traversal"],
    tags: ["applied"],
    entityRefs: {
      patterns: [],
      problems: [
        "prob-parking-lot",
        "prob-library",
        "prob-lru-cache",
        "prob-chess",
      ],
    },
  },
];

async function main(): Promise<void> {
  const conn =
    process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "";
  if (!conn) {
    console.error(
      "[blueprint-seed] DATABASE_URL or DATABASE_URL_UNPOOLED must be set",
    );
    process.exit(1);
  }

  const client = new Client({ connectionString: conn });
  await client.connect();

  try {
    const courseResult = await client.query<{ id: string }>(
      `INSERT INTO blueprint_courses (slug, title, description, version, published_at)
       VALUES ($1, $2, $3, 'v1.0.0', now())
       ON CONFLICT (slug) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         updated_at = now()
       RETURNING id`,
      [COURSE_SLUG, COURSE_TITLE, COURSE_DESCRIPTION],
    );
    const courseId = courseResult.rows[0].id;

    for (const u of UNITS) {
      await client.query(
        `INSERT INTO blueprint_units (
           course_id, slug, ordinal, title, summary,
           duration_minutes, difficulty, prereq_unit_slugs, tags,
           entity_refs, recipe_json, published_at
         ) VALUES (
           $1, $2, $3, $4, $5,
           $6, $7, $8::text[], $9::text[],
           $10::jsonb, $11::jsonb, now()
         )
         ON CONFLICT (course_id, slug) DO UPDATE SET
           ordinal = EXCLUDED.ordinal,
           title = EXCLUDED.title,
           summary = EXCLUDED.summary,
           duration_minutes = EXCLUDED.duration_minutes,
           difficulty = EXCLUDED.difficulty,
           prereq_unit_slugs = EXCLUDED.prereq_unit_slugs,
           tags = EXCLUDED.tags,
           entity_refs = EXCLUDED.entity_refs,
           updated_at = now()`,
        [
          courseId,
          u.slug,
          u.ordinal,
          u.title,
          u.summary,
          u.durationMinutes,
          u.difficulty,
          u.prereqUnitSlugs,
          u.tags,
          JSON.stringify(u.entityRefs),
          JSON.stringify({ version: 1, sections: [] }),
        ],
      );
    }

    console.log(
      `[blueprint-seed] upserted course "${COURSE_SLUG}" + ${UNITS.length} units`,
    );
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("[blueprint-seed] failed:", err);
  process.exit(1);
});
