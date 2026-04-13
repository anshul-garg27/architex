/**
 * Security module seed.
 *
 * Security content is primarily embedded inline in engine files as step
 * descriptions. Only the topic-level metadata is seeded here.
 * The 17 engine functions stay client-side.
 */

import type { Database } from "@/db";
import { mapToRows, batchUpsert } from "./seed-helpers";

const MODULE_ID = "security";

// Security topics defined inline (no separate data file — extracted from SecurityModule.tsx analysis)
const SECURITY_TOPICS = [
  { id: "oauth-pkce", name: "OAuth 2.0 (PKCE)", category: "auth", difficulty: "intermediate", description: "Authorization Code flow with PKCE for public clients — SPAs and mobile apps." },
  { id: "oauth-client-credentials", name: "OAuth 2.0 (Client Credentials)", category: "auth", difficulty: "beginner", description: "Machine-to-machine authentication without user interaction." },
  { id: "oauth-device-auth", name: "OAuth 2.0 (Device Auth)", category: "auth", difficulty: "intermediate", description: "Smart TV and IoT device authorization with polling flow." },
  { id: "jwt-lifecycle", name: "JWT Lifecycle", category: "auth", difficulty: "beginner", description: "JSON Web Token creation, validation, and expiration lifecycle." },
  { id: "jwt-attacks", name: "JWT Attacks", category: "auth", difficulty: "advanced", description: "Common JWT vulnerabilities: algorithm confusion, token replay, key leakage." },
  { id: "diffie-hellman", name: "Diffie-Hellman Key Exchange", category: "crypto", difficulty: "advanced", description: "Secure shared secret generation over insecure channels using modular exponentiation." },
  { id: "aes-128", name: "AES-128 Encryption", category: "crypto", difficulty: "advanced", description: "Symmetric block cipher with SubBytes, ShiftRows, MixColumns, and AddRoundKey." },
  { id: "https-flow", name: "HTTPS Flow", category: "transport", difficulty: "intermediate", description: "Full TLS handshake + encrypted HTTP request lifecycle." },
  { id: "cors", name: "CORS", category: "web", difficulty: "beginner", description: "Cross-Origin Resource Sharing preflight and simple request rules." },
  { id: "certificate-chain", name: "Certificate Chain", category: "transport", difficulty: "intermediate", description: "Root CA → Intermediate CA → Leaf certificate trust verification." },
  { id: "password-hashing", name: "Password Hashing", category: "crypto", difficulty: "beginner", description: "Bcrypt salting and adaptive rounds vs rainbow table attacks." },
  { id: "rate-limiting", name: "Rate Limiting", category: "web", difficulty: "beginner", description: "Token bucket, sliding window, and leaky bucket algorithms." },
  { id: "web-attacks", name: "Web Attacks (XSS/CSRF/SQLi)", category: "web", difficulty: "intermediate", description: "Cross-site scripting, request forgery, and SQL injection attack + defense." },
  { id: "encryption-comparison", name: "Encryption Comparison", category: "crypto", difficulty: "intermediate", description: "Symmetric vs asymmetric vs hybrid encryption tradeoffs." },
  { id: "ddos-simulation", name: "DDoS Simulation", category: "infrastructure", difficulty: "advanced", description: "Distributed denial of service attack simulation with mitigation." },
];

export async function seed(db: Database) {
  const rows = mapToRows(MODULE_ID, "topic", SECURITY_TOPICS, {
    slugField: "id",
    nameField: "name",
    categoryField: "category",
    difficultyField: "difficulty",
    summaryField: "description",
    tagsFn: (item) => ["security", String(item.category ?? "")],
  });

  console.log(`    Upserting ${rows.length} security content rows...`);
  await batchUpsert(db, rows);
  console.log(`    ✓ ${rows.length} rows upserted`);
}
