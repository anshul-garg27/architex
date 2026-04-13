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
    ...mapToRows(MODULE_ID, "tls13-message", TLS13_HANDSHAKE_MESSAGES as unknown as unknown[], {
      slugField: "type",
      nameField: "type",
      summaryField: "type",
      tagsFn: () => ["tls", "handshake"],
    }),
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
