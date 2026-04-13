/**
 * ER-to-SQL Generator (DBL-011)
 *
 * Thin wrapper around erToSQL from schema-converter.ts.
 * The full implementation lives in schema-converter.ts to avoid
 * code duplication (TYPE_MAP, toSnake, indent were previously
 * duplicated between both files).
 */

import type { EREntity, ERRelationship } from "./types";
import { erToSQL } from "./schema-converter";

export function generateSQL(
  entities: EREntity[],
  relationships: ERRelationship[],
): string {
  return erToSQL(entities, relationships).sql;
}
