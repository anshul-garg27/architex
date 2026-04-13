// ─────────────────────────────────────────────────────────────
// FND-039 — IndexedDB Wrapper
// Thin wrapper around the browser IndexedDB API.
// No external dependencies (no Dexie, no idb).
// ─────────────────────────────────────────────────────────────

export interface IDBSchema {
  /** Object-store name -> key path (string field used as primary key). */
  stores: Record<string, string>;
}

/** Opened database handle returned by `openDB`. */
export interface IDBHandle {
  db: IDBDatabase;
  close: () => void;
}

// ── Helpers ────────────────────────────────────────────────────

function wrapRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function wrapTransaction(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new DOMException("Transaction aborted"));
  });
}

// ── Public API ─────────────────────────────────────────────────

/**
 * Open (or create / upgrade) an IndexedDB database.
 *
 * On version upgrade the stores listed in `schema.stores` are created if they
 * do not already exist.  Existing stores that are NOT in the schema are left
 * untouched so that data is never silently dropped.
 */
export function openDB(
  name: string,
  version: number,
  schema: IDBSchema,
): Promise<IDBHandle> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);

    request.onupgradeneeded = () => {
      const db = request.result;
      for (const [storeName, keyPath] of Object.entries(schema.stores)) {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath });
        }
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      resolve({ db, close: () => db.close() });
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Write a record into the given object store.
 * The `value` object **must** contain the key field declared in the schema.
 */
export async function put(
  handle: IDBHandle,
  storeName: string,
  value: unknown,
): Promise<void> {
  const tx = handle.db.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);
  store.put(value);
  await wrapTransaction(tx);
}

/** Read a single record by its primary key. Returns `undefined` when absent. */
export async function get<T = unknown>(
  handle: IDBHandle,
  storeName: string,
  key: IDBValidKey,
): Promise<T | undefined> {
  const tx = handle.db.transaction(storeName, "readonly");
  const store = tx.objectStore(storeName);
  const result = await wrapRequest(store.get(key));
  return result as T | undefined;
}

/** Delete a record by primary key. No-op if the key does not exist. */
export async function del(
  handle: IDBHandle,
  storeName: string,
  key: IDBValidKey,
): Promise<void> {
  const tx = handle.db.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);
  store.delete(key);
  await wrapTransaction(tx);
}

/** Return every record in the given object store. */
export async function getAll<T = unknown>(
  handle: IDBHandle,
  storeName: string,
): Promise<T[]> {
  const tx = handle.db.transaction(storeName, "readonly");
  const store = tx.objectStore(storeName);
  const result = await wrapRequest(store.getAll());
  return result as T[];
}

// ── Default DB ─────────────────────────────────────────────────

/** Canonical Architex database name. */
export const ARCHITEX_DB_NAME = "architex-db";
/** Current schema version — bump when adding stores. */
export const ARCHITEX_DB_VERSION = 1;

/** Standard schema used by the Architex persistence layer. */
export const ARCHITEX_SCHEMA: IDBSchema = {
  stores: {
    projects: "projectId",
    settings: "settingName",
  },
};

let _defaultHandle: IDBHandle | null = null;

/**
 * Lazily open the default Architex database and cache the handle for the
 * lifetime of the page.
 */
export async function getDefaultDB(): Promise<IDBHandle> {
  if (_defaultHandle) return _defaultHandle;
  _defaultHandle = await openDB(
    ARCHITEX_DB_NAME,
    ARCHITEX_DB_VERSION,
    ARCHITEX_SCHEMA,
  );
  return _defaultHandle;
}
