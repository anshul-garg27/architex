/**
 * =============================================================================
 * DATABASE CONNECTION (Neon Serverless Postgres + Drizzle ORM)
 * =============================================================================
 *
 * Three connection modes based on the runtime environment:
 *
 * 1. dbEdge   -- Edge Runtime (Vercel Edge Functions, Middleware)
 *                Uses @neondatabase/serverless HTTP driver.
 *                No TCP, no persistent connections. Stateless.
 *
 * 2. db       -- Serverless Functions (Server Actions, API Routes, RSC)
 *                Uses Neon's WebSocket connection pooler (PgBouncer).
 *                Handles connection reuse across function invocations.
 *
 * 3. dbDirect -- Background Jobs (Inngest workers)
 *                Uses node-postgres with direct TCP connections.
 *                Long-lived connections are fine here (not serverless).
 *
 * Read Replica Strategy (Phase 3: >10K users):
 *   Drizzle's withReplica() routes SELECT queries to the read replica
 *   and all mutations to the primary. Enable by setting DATABASE_REPLICA_URL.
 *
 *   const dbWithReplicas = drizzle(primaryPool, {
 *     schema,
 *     replica: { read: drizzle(replicaPool, { schema }) },
 *   });
 */

import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleHTTP } from "drizzle-orm/neon-http";
import { drizzle as drizzleWS } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "./schema";

// ---------------------------------------------------------------------------
// Edge Runtime (HTTP-based, no persistent connection)
// Use for: Edge Middleware, Edge Functions, lightweight auth checks
// ---------------------------------------------------------------------------
export const dbEdge = drizzleHTTP(neon(process.env.DATABASE_URL!), { schema });

// ---------------------------------------------------------------------------
// Serverless Functions (WebSocket pooled via Neon connection pooler)
// Use for: Server Actions, API Route Handlers, React Server Components
// ---------------------------------------------------------------------------
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzleWS(pool, { schema });

// ---------------------------------------------------------------------------
// Type exports for use in application code
// ---------------------------------------------------------------------------
export type Database = typeof db;
export type DatabaseEdge = typeof dbEdge;
