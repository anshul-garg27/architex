/**
 * Networking module seed: SRS cards + TLS1.3 messages + CDN scenarios.
 */

import type { Database } from "@/db";
import { mapToRows, batchUpsert } from "./seed-helpers";

const MODULE_ID = "networking";

export async function seed(db: Database) {
  const { NETWORKING_SRS_CARDS } = await import("@/lib/networking/srs-bridge");
  const { TLS13_HANDSHAKE_MESSAGES } = await import("@/lib/networking/tls13-handshake");
  const { CDN_SCENARIOS } = await import("@/lib/networking/cdn-flow");

  const rows = [
    ...mapToRows(MODULE_ID, "srs-card", NETWORKING_SRS_CARDS, {
      slugField: "protocolId",
      nameField: "protocolName",
      summaryField: "question",
      tagsFn: (item) => ["srs", String(item.protocolId ?? "")],
    }),
    ...(TLS13_HANDSHAKE_MESSAGES as unknown as Array<Record<string, unknown>>).map((msg, i) => ({
      moduleId: MODULE_ID,
      contentType: "tls13-message" as const,
      slug: `${String(msg.type ?? "msg")}-${msg.tick ?? i}`,
      name: String(msg.type ?? `TLS Message ${i}`),
      category: null,
      difficulty: null,
      sortOrder: i,
      summary: String(msg.description ?? msg.type ?? "").slice(0, 300),
      tags: ["tls", "handshake"],
      content: JSON.parse(JSON.stringify(msg)) as Record<string, unknown>,
    })),
    ...mapToRows(MODULE_ID, "cdn-scenario", CDN_SCENARIOS, {
      slugField: "id",
      nameField: "name",
      summaryField: "description",
      tagsFn: () => ["cdn", "caching"],
    }),
  ];

  console.log(`    Upserting ${rows.length} networking content rows...`);
  await batchUpsert(db, rows);
  console.log(`    ✓ ${rows.length} rows upserted`);
}
