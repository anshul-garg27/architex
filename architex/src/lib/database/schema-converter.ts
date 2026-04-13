/**
 * Schema Converter (DBL-012)
 *
 * Converts ER entities and relationships into:
 * 1. SQL CREATE TABLE statements (erToSQL)
 * 2. MongoDB-style document schemas (erToNoSQL)
 *
 * Cardinality-aware:
 * - 1:1 -> FK with UNIQUE on one side / embed in NoSQL
 * - 1:N -> FK on the N-side / embed array or reference
 * - M:N -> junction table in SQL / array of references in NoSQL
 */

import type { EREntity, ERAttribute, ERRelationship } from "./types";

// ── Data Type Mapping ──────────────────────────────────────

const SQL_TYPE_MAP: Record<string, string> = {
  INT: "INTEGER",
  INTEGER: "INTEGER",
  BIGINT: "BIGINT",
  SMALLINT: "SMALLINT",
  SERIAL: "SERIAL",
  VARCHAR: "VARCHAR(255)",
  TEXT: "TEXT",
  CHAR: "CHAR(1)",
  BOOLEAN: "BOOLEAN",
  BOOL: "BOOLEAN",
  DATE: "DATE",
  TIMESTAMP: "TIMESTAMP",
  DATETIME: "TIMESTAMP",
  FLOAT: "FLOAT",
  DOUBLE: "DOUBLE PRECISION",
  DECIMAL: "DECIMAL(10,2)",
  NUMERIC: "NUMERIC(10,2)",
  UUID: "UUID",
  JSON: "JSONB",
  JSONB: "JSONB",
  BLOB: "BYTEA",
};

const MONGO_TYPE_MAP: Record<string, string> = {
  INT: "Number",
  INTEGER: "Number",
  BIGINT: "Number",
  SMALLINT: "Number",
  SERIAL: "ObjectId",
  VARCHAR: "String",
  TEXT: "String",
  CHAR: "String",
  BOOLEAN: "Boolean",
  BOOL: "Boolean",
  DATE: "Date",
  TIMESTAMP: "Date",
  DATETIME: "Date",
  FLOAT: "Number",
  DOUBLE: "Number",
  DECIMAL: "Decimal128",
  NUMERIC: "Decimal128",
  UUID: "String",
  JSON: "Object",
  JSONB: "Object",
  BLOB: "Buffer",
};

function mapSQLType(rawType: string): string {
  const upper = rawType.trim().toUpperCase();
  return SQL_TYPE_MAP[upper] ?? upper;
}

function mapMongoType(rawType: string): string {
  const upper = rawType.trim().toUpperCase();
  return MONGO_TYPE_MAP[upper] ?? "String";
}

// ── SQL Identifier Helpers ─────────────────────────────────

function toSnake(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/\s+/g, "_")
    .toLowerCase();
}

function indent(line: string, level = 1): string {
  return "  ".repeat(level) + line;
}

// ── ER to SQL ──────────────────────────────────────────────

export interface SQLResult {
  sql: string;
  tables: string[];
  junctionTables: string[];
}

export function erToSQL(
  entities: EREntity[],
  relationships: ERRelationship[],
): SQLResult {
  const entityById = new Map(entities.map((e) => [e.id, e]));
  const statements: string[] = [];
  const tableNames: string[] = [];
  const junctionNames: string[] = [];

  // Track FK additions from relationships
  const fkAdditions = new Map<
    string,
    { col: string; refTable: string; refCol: string; unique: boolean }[]
  >();

  // ── Process Relationships ──────────────────────────────
  const junctionStatements: string[] = [];

  for (const rel of relationships) {
    const e1 = entityById.get(rel.entity1Id);
    const e2 = entityById.get(rel.entity2Id);
    if (!e1 || !e2) continue;

    const e1Table = toSnake(e1.name);
    const e2Table = toSnake(e2.name);
    const e1PK = e1.attributes.find((a) => a.isPK);
    const e2PK = e2.attributes.find((a) => a.isPK);

    if (!e1PK || !e2PK) continue;

    if (rel.cardinality === "M:N") {
      // Junction table
      const junctionName = `${e1Table}_${e2Table}`;
      const fk1Col = `${e1Table}_${toSnake(e1PK.name)}`;
      const fk2Col = `${e2Table}_${toSnake(e2PK.name)}`;
      const lines: string[] = [];
      lines.push(indent(`${fk1Col} ${mapSQLType(e1PK.type)} NOT NULL,`));
      lines.push(indent(`${fk2Col} ${mapSQLType(e2PK.type)} NOT NULL,`));
      lines.push(indent(`PRIMARY KEY (${fk1Col}, ${fk2Col}),`));
      lines.push(
        indent(
          `FOREIGN KEY (${fk1Col}) REFERENCES ${e1Table}(${toSnake(e1PK.name)}),`,
        ),
      );
      lines.push(
        indent(
          `FOREIGN KEY (${fk2Col}) REFERENCES ${e2Table}(${toSnake(e2PK.name)})`,
        ),
      );

      junctionStatements.push(
        `CREATE TABLE ${junctionName} (\n${lines.join("\n")}\n);`,
      );
      junctionNames.push(junctionName);
    } else if (rel.cardinality === "1:N") {
      // FK on the N side (entity2)
      const fkCol = `${e1Table}_${toSnake(e1PK.name)}`;
      const additions = fkAdditions.get(rel.entity2Id) ?? [];
      additions.push({
        col: fkCol,
        refTable: e1Table,
        refCol: toSnake(e1PK.name),
        unique: false,
      });
      fkAdditions.set(rel.entity2Id, additions);
    } else if (rel.cardinality === "1:1") {
      // FK on entity2 with UNIQUE
      const fkCol = `${e1Table}_${toSnake(e1PK.name)}`;
      const additions = fkAdditions.get(rel.entity2Id) ?? [];
      additions.push({
        col: fkCol,
        refTable: e1Table,
        refCol: toSnake(e1PK.name),
        unique: true,
      });
      fkAdditions.set(rel.entity2Id, additions);
    }
  }

  // ── Generate Entity Tables ────────────────────────────
  for (const entity of entities) {
    const tableName = toSnake(entity.name);
    tableNames.push(tableName);
    const columnLines: string[] = [];
    const pkCols: string[] = [];
    const fkLines: string[] = [];

    // Regular attributes (skip multivalued and derived for SQL)
    for (const attr of entity.attributes) {
      if (attr.isDerived) continue; // derived attributes are computed, not stored

      const colName = toSnake(attr.name);
      const colType = mapSQLType(attr.type);
      const nullable = attr.isPK ? " NOT NULL" : "";
      columnLines.push(indent(`${colName} ${colType}${nullable}`));

      if (attr.isPK || attr.isPartialKey) {
        pkCols.push(colName);
      }
    }

    // Add FK columns from relationships (1:N, 1:1)
    const extraFKs = fkAdditions.get(entity.id) ?? [];
    for (const fk of extraFKs) {
      const alreadyHas = entity.attributes.some(
        (a) => toSnake(a.name) === fk.col,
      );
      if (!alreadyHas) {
        columnLines.push(indent(`${fk.col} INTEGER NOT NULL`));
      }
      fkLines.push(
        indent(
          `FOREIGN KEY (${fk.col}) REFERENCES ${fk.refTable}(${fk.refCol})`,
        ),
      );
      if (fk.unique) {
        fkLines.push(indent(`UNIQUE (${fk.col})`));
      }
    }

    // Assemble
    const allLines: string[] = [...columnLines];
    if (pkCols.length > 0) {
      allLines.push(indent(`PRIMARY KEY (${pkCols.join(", ")})`));
    }
    allLines.push(...fkLines);

    const body = allLines.join(",\n");
    statements.push(`CREATE TABLE ${tableName} (\n${body}\n);`);
  }

  // Junction tables go after entity tables
  statements.push(...junctionStatements);

  const sql =
    "-- Generated SQL from ER Diagram\n\n" +
    statements.join("\n\n") +
    "\n";

  return { sql, tables: tableNames, junctionTables: junctionNames };
}

// ── ER to NoSQL (MongoDB-style) ────────────────────────────

export interface MongoField {
  name: string;
  type: string;
  isArray?: boolean;
  isRef?: boolean;
  refCollection?: string;
  subFields?: MongoField[];
}

export interface MongoCollection {
  name: string;
  fields: MongoField[];
}

export interface NoSQLResult {
  collections: MongoCollection[];
}

export function erToNoSQL(
  entities: EREntity[],
  relationships: ERRelationship[],
): NoSQLResult {
  const entityById = new Map(entities.map((e) => [e.id, e]));
  const collections: MongoCollection[] = [];

  // Track embedded/referenced fields to add per entity
  const extraFields = new Map<string, MongoField[]>();

  // ── Process Relationships ──────────────────────────────
  for (const rel of relationships) {
    const e1 = entityById.get(rel.entity1Id);
    const e2 = entityById.get(rel.entity2Id);
    if (!e1 || !e2) continue;

    if (rel.cardinality === "1:1") {
      // Embed FK reference in entity2
      const fields = extraFields.get(rel.entity2Id) ?? [];
      fields.push({
        name: `${toCamel(e1.name)}Id`,
        type: "ObjectId",
        isRef: true,
        refCollection: toCamel(e1.name),
      });
      extraFields.set(rel.entity2Id, fields);
    } else if (rel.cardinality === "1:N") {
      // Add reference on the N-side (entity2)
      const fields = extraFields.get(rel.entity2Id) ?? [];
      fields.push({
        name: `${toCamel(e1.name)}Id`,
        type: "ObjectId",
        isRef: true,
        refCollection: toCamel(e1.name),
      });
      extraFields.set(rel.entity2Id, fields);
    } else if (rel.cardinality === "M:N") {
      // Array of references on both sides
      const fields1 = extraFields.get(rel.entity1Id) ?? [];
      fields1.push({
        name: `${toCamel(e2.name)}Ids`,
        type: "ObjectId",
        isArray: true,
        isRef: true,
        refCollection: toCamel(e2.name),
      });
      extraFields.set(rel.entity1Id, fields1);

      const fields2 = extraFields.get(rel.entity2Id) ?? [];
      fields2.push({
        name: `${toCamel(e1.name)}Ids`,
        type: "ObjectId",
        isArray: true,
        isRef: true,
        refCollection: toCamel(e1.name),
      });
      extraFields.set(rel.entity2Id, fields2);
    }
  }

  // ── Generate Collections ────────────────────────────────
  for (const entity of entities) {
    const collectionName = toCamel(entity.name);
    const fields: MongoField[] = [];

    for (const attr of entity.attributes) {
      if (attr.isComposite && attr.subAttributes?.length) {
        // Composite -> embedded sub-document
        const subFields: MongoField[] = attr.subAttributes.map((sub) => ({
          name: toCamel(sub.name),
          type: mapMongoType(sub.type),
        }));
        fields.push({
          name: toCamel(attr.name),
          type: "Object",
          subFields,
        });
      } else if (attr.isMultivalued) {
        // Multivalued -> array
        fields.push({
          name: toCamel(attr.name),
          type: mapMongoType(attr.type),
          isArray: true,
        });
      } else if (attr.isDerived) {
        // Skip derived attributes (computed in application layer)
        continue;
      } else {
        fields.push({
          name: attr.isPK ? "_id" : toCamel(attr.name),
          type: attr.isPK ? "ObjectId" : mapMongoType(attr.type),
        });
      }
    }

    // Add relationship fields
    const relFields = extraFields.get(entity.id) ?? [];
    fields.push(...relFields);

    collections.push({ name: collectionName, fields });
  }

  return { collections };
}

// ── Helpers ────────────────────────────────────────────────

function toCamel(name: string): string {
  // Convert to camelCase: "OrderItems" -> "orderItems", "user_id" -> "userId"
  const s = name
    .replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
    .replace(/\s+/g, "");
  return s.charAt(0).toLowerCase() + s.slice(1);
}
