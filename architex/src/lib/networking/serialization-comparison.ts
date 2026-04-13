// ─────────────────────────────────────────────────────────────
// Architex — Serialization Format Comparison
// ─────────────────────────────────────────────────────────────
//
// Side-by-side comparison of JSON, Protocol Buffers, MessagePack,
// and Avro for the same data object. Demonstrates key trade-offs:
//
// - **JSON**: Human-readable, self-describing, universally supported.
//   Largest payload, no schema required for decoding.
// - **Protocol Buffers (protobuf)**: Binary, schema-required,
//   smallest payload for complex nested data. Google-developed.
// - **MessagePack**: Binary JSON — compact, no schema required,
//   faster than JSON, good middle ground.
// - **Avro**: Binary with embedded schema. Schema evolution
//   friendly. Popular in Kafka / data pipelines.
//
// compareSerializationFormats() returns results for each format
// with size, speed, and feature indicators.
// ─────────────────────────────────────────────────────────────

/**
 * A single serialization result for one format.
 */
export interface SerializationResult {
  /** Serialization format identifier. */
  format: 'json' | 'protobuf' | 'msgpack' | 'avro';
  /** Display name for the format. */
  displayName: string;
  /** The original data being serialized. */
  originalData: object;
  /** Hex or readable representation of the serialized output. */
  serialized: string;
  /** Size of serialized output in bytes. */
  sizeBytes: number;
  /** Time to serialize in milliseconds. */
  serializeTimeMs: number;
  /** Time to deserialize in milliseconds. */
  deserializeTimeMs: number;
  /** Whether the serialized form is human-readable. */
  humanReadable: boolean;
  /** Whether a schema definition is required. */
  schemaRequired: boolean;
  /** Color for visualization. */
  color: string;
  /** Description of the format and how it handles this data. */
  description: string;
  /** The schema definition (if applicable). */
  schemaDefinition?: string;
}

/**
 * Sample data: a User with a nested Address.
 * This is the default sample used for comparisons.
 */
export const SAMPLE_USER_DATA = {
  id: 12345,
  name: "Alice Johnson",
  email: "alice@example.com",
  age: 29,
  active: true,
  roles: ["admin", "editor"],
  address: {
    street: "742 Evergreen Terrace",
    city: "Springfield",
    state: "IL",
    zip: "62704",
    country: "US",
  },
  metadata: {
    createdAt: "2024-01-15T10:30:00Z",
    lastLogin: "2025-04-10T14:22:33Z",
    loginCount: 847,
  },
};

// ── Constants ────────────────────────────────────────────────

/**
 * Simulated JSON serialized output for the sample data.
 * We compute the real JSON size from JSON.stringify, and simulate
 * the binary formats based on known compression ratios.
 */

/** Protobuf is typically 30-60% smaller than JSON for structured data. */
const PROTOBUF_SIZE_RATIO = 0.42;

/** MessagePack is typically 15-30% smaller than JSON. */
const MSGPACK_SIZE_RATIO = 0.72;

/** Avro with schema is typically 25-45% smaller than JSON. */
const AVRO_SIZE_RATIO = 0.55;

/** JSON serialize speed baseline (ms per KB). */
const JSON_SERIALIZE_MS_PER_KB = 0.8;
const JSON_DESERIALIZE_MS_PER_KB = 1.0;

/** Protobuf is ~5-10x faster than JSON for serialization. */
const PROTOBUF_SERIALIZE_MS_PER_KB = 0.12;
const PROTOBUF_DESERIALIZE_MS_PER_KB = 0.10;

/** MessagePack is ~2-4x faster than JSON. */
const MSGPACK_SERIALIZE_MS_PER_KB = 0.30;
const MSGPACK_DESERIALIZE_MS_PER_KB = 0.28;

/** Avro is ~3-6x faster than JSON. */
const AVRO_SERIALIZE_MS_PER_KB = 0.18;
const AVRO_DESERIALIZE_MS_PER_KB = 0.15;

// ── Schema Definitions ──────────────────────────────────────

const PROTOBUF_SCHEMA = `syntax = "proto3";

message Address {
  string street  = 1;
  string city    = 2;
  string state   = 3;
  string zip     = 4;
  string country = 5;
}

message Metadata {
  string created_at  = 1;
  string last_login  = 2;
  int32  login_count = 3;
}

message User {
  int32    id       = 1;
  string   name     = 2;
  string   email    = 3;
  int32    age      = 4;
  bool     active   = 5;
  repeated string roles = 6;
  Address  address  = 7;
  Metadata metadata = 8;
}`;

const AVRO_SCHEMA = `{
  "type": "record",
  "name": "User",
  "fields": [
    {"name": "id",    "type": "int"},
    {"name": "name",  "type": "string"},
    {"name": "email", "type": "string"},
    {"name": "age",   "type": "int"},
    {"name": "active","type": "boolean"},
    {"name": "roles", "type": {"type":"array","items":"string"}},
    {"name": "address","type": {
      "type": "record", "name": "Address",
      "fields": [
        {"name":"street", "type":"string"},
        {"name":"city",   "type":"string"},
        {"name":"state",  "type":"string"},
        {"name":"zip",    "type":"string"},
        {"name":"country","type":"string"}
      ]
    }},
    {"name": "metadata","type": {
      "type": "record", "name": "Metadata",
      "fields": [
        {"name":"createdAt", "type":"string"},
        {"name":"lastLogin", "type":"string"},
        {"name":"loginCount","type":"int"}
      ]
    }}
  ]
}`;

// ── Hex Simulation Helpers ──────────────────────────────────

/**
 * Generates a simulated hex dump for binary formats.
 * Uses deterministic pseudo-random bytes based on the format name
 * to produce a realistic-looking representation.
 */
function simulateHexDump(format: string, sizeBytes: number): string {
  const bytesPerLine = 16;
  const maxLines = 8;
  const lines: string[] = [];
  let seed = 0;
  for (const ch of format) {
    seed = (seed * 31 + ch.charCodeAt(0)) & 0xffff;
  }

  const totalLines = Math.min(Math.ceil(sizeBytes / bytesPerLine), maxLines);

  for (let line = 0; line < totalLines; line++) {
    const offset = (line * bytesPerLine).toString(16).padStart(4, '0');
    const hexParts: string[] = [];
    const asciiParts: string[] = [];

    const bytesThisLine = Math.min(bytesPerLine, sizeBytes - line * bytesPerLine);
    for (let b = 0; b < bytesThisLine; b++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      const byte = (seed >> 16) & 0xff;
      hexParts.push(byte.toString(16).padStart(2, '0'));
      asciiParts.push(byte >= 32 && byte < 127 ? String.fromCharCode(byte) : '.');
    }

    lines.push(`${offset}: ${hexParts.join(' ').padEnd(bytesPerLine * 3 - 1)}  |${asciiParts.join('')}|`);
  }

  if (sizeBytes > maxLines * bytesPerLine) {
    lines.push(`... (${sizeBytes} bytes total)`);
  }

  return lines.join('\n');
}

// ── Comparison Function ─────────────────────────────────────

/**
 * Compares JSON, Protocol Buffers, MessagePack, and Avro
 * serialization of the same data object.
 *
 * Models realistic size and speed differences based on known
 * benchmarks and encoding characteristics:
 *
 * - **JSON**: Text-based, self-describing. Keys are repeated
 *   verbatim. Numbers stored as text. Universally supported.
 * - **Protobuf**: Binary, field tags instead of key names.
 *   Varint encoding for integers. Requires .proto schema.
 * - **MessagePack**: Binary JSON. Preserves JSON semantics
 *   but uses compact binary encoding. No schema needed.
 * - **Avro**: Binary with schema. Fields identified by position,
 *   not by name or tag. Schema can be embedded or referenced.
 *
 * @param data - The object to serialize for comparison.
 * @returns Array of results, one per format.
 *
 * @example
 * ```ts
 * const results = compareSerializationFormats(SAMPLE_USER_DATA);
 * results.forEach(r => {
 *   console.log(`${r.displayName}: ${r.sizeBytes}B, ser=${r.serializeTimeMs}ms`);
 * });
 * ```
 */
export function compareSerializationFormats(
  data: object,
): SerializationResult[] {
  // Compute real JSON size
  const jsonStr = JSON.stringify(data, null, 0);
  const jsonBytes = new TextEncoder().encode(jsonStr).length;
  const jsonSizeKB = jsonBytes / 1024;

  // Pretty-print version for display
  const jsonPretty = JSON.stringify(data, null, 2);

  // Compute simulated sizes for binary formats
  const protobufBytes = Math.round(jsonBytes * PROTOBUF_SIZE_RATIO);
  const msgpackBytes = Math.round(jsonBytes * MSGPACK_SIZE_RATIO);
  const avroBytes = Math.round(jsonBytes * AVRO_SIZE_RATIO);

  // Compute simulated speeds based on size
  const round2 = (n: number) => Math.round(n * 100) / 100;

  return [
    {
      format: 'json',
      displayName: 'JSON',
      originalData: data,
      serialized: jsonPretty,
      sizeBytes: jsonBytes,
      serializeTimeMs: round2(jsonSizeKB * JSON_SERIALIZE_MS_PER_KB),
      deserializeTimeMs: round2(jsonSizeKB * JSON_DESERIALIZE_MS_PER_KB),
      humanReadable: true,
      schemaRequired: false,
      color: '#f59e0b',
      description:
        'Text-based, self-describing format. Keys are repeated as full strings in every object. Numbers, booleans, and nulls are encoded as text. Universally supported across all languages and platforms. No schema needed for encoding or decoding.',
    },
    {
      format: 'protobuf',
      displayName: 'Protocol Buffers',
      originalData: data,
      serialized: simulateHexDump('protobuf', protobufBytes),
      sizeBytes: protobufBytes,
      serializeTimeMs: round2(jsonSizeKB * PROTOBUF_SERIALIZE_MS_PER_KB),
      deserializeTimeMs: round2(jsonSizeKB * PROTOBUF_DESERIALIZE_MS_PER_KB),
      humanReadable: false,
      schemaRequired: true,
      color: '#3b82f6',
      description:
        'Binary format developed by Google. Fields identified by numeric tags (1, 2, 3...) instead of string names. Uses varint encoding for integers (small numbers use fewer bytes). Requires a .proto schema file for both serialization and deserialization. Excellent backward/forward compatibility via field numbering.',
      schemaDefinition: PROTOBUF_SCHEMA,
    },
    {
      format: 'msgpack',
      displayName: 'MessagePack',
      originalData: data,
      serialized: simulateHexDump('msgpack', msgpackBytes),
      sizeBytes: msgpackBytes,
      serializeTimeMs: round2(jsonSizeKB * MSGPACK_SERIALIZE_MS_PER_KB),
      deserializeTimeMs: round2(jsonSizeKB * MSGPACK_DESERIALIZE_MS_PER_KB),
      humanReadable: false,
      schemaRequired: false,
      color: '#e535ab',
      description:
        'Binary JSON — preserves the full JSON data model (maps, arrays, strings, numbers, booleans, null) but encodes them compactly in binary. Keys are still stored as strings but use length-prefixed encoding. No schema required. Good middle ground between JSON readability concepts and binary efficiency.',
    },
    {
      format: 'avro',
      displayName: 'Apache Avro',
      originalData: data,
      serialized: simulateHexDump('avro', avroBytes),
      sizeBytes: avroBytes,
      serializeTimeMs: round2(jsonSizeKB * AVRO_SERIALIZE_MS_PER_KB),
      deserializeTimeMs: round2(jsonSizeKB * AVRO_DESERIALIZE_MS_PER_KB),
      humanReadable: false,
      schemaRequired: true,
      color: '#22c55e',
      description:
        'Binary format from Apache. Fields identified purely by position (no tags or names in the wire format). Schema is required and can be embedded in the data file header (common in Kafka). Excellent schema evolution support with reader/writer schema resolution. Popular in data engineering pipelines.',
      schemaDefinition: AVRO_SCHEMA,
    },
  ];
}
