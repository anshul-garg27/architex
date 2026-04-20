// Mock ResizeObserver
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
// Mock IntersectionObserver
global.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
  root = null;
  rootMargin = '';
  thresholds = [];
} as any;

// Node 25+ ships a stubbed `globalThis.localStorage` that shadows jsdom's
// `window.localStorage`. Without --localstorage-file, the stub's getItem /
// setItem / clear are undefined. Install a working in-memory Storage impl
// so the app's `localStorage.getItem(...)` calls work at store-init time.
function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length(): number {
      return store.size;
    },
    clear(): void {
      store.clear();
    },
    getItem(key: string): string | null {
      return store.has(key) ? (store.get(key) as string) : null;
    },
    key(index: number): string | null {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string): void {
      store.delete(key);
    },
    setItem(key: string, value: string): void {
      store.set(key, String(value));
    },
  };
}

function ensureStorage(target: Record<string, unknown>, property: string): void {
  const existing = target[property] as Storage | undefined;
  if (!existing || typeof existing.getItem !== 'function') {
    Object.defineProperty(target, property, {
      value: createMemoryStorage(),
      writable: true,
      configurable: true,
    });
  }
}

// Patch globalThis + window + global to ensure usable localStorage/sessionStorage.
const globals = [globalThis as Record<string, unknown>];
if (typeof window !== 'undefined') {
  globals.push(window as unknown as Record<string, unknown>);
}
if (typeof global !== 'undefined' && global !== globalThis) {
  globals.push(global as unknown as Record<string, unknown>);
}
for (const g of globals) {
  ensureStorage(g, 'localStorage');
  ensureStorage(g, 'sessionStorage');
}
