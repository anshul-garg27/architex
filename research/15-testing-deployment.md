# Testing, CI/CD & Deployment

> Complete testing strategy, GitHub Actions pipeline, and deployment options.

---

## TEST RUNNER: Vitest (over Jest)
- Native ESM, 2-5× faster, first-class TypeScript
- `happy-dom` for speed, `jsdom` for Canvas tests
- Mock ResizeObserver, IntersectionObserver, Canvas context in setup

## TEST PYRAMID
- **Unit (60%):** Zustand stores, algorithm step generators, simulation math, utils
- **Component (25%):** Custom nodes, panels, toolbars (wrapped in ReactFlowProvider)
- **Visual + E2E (15%):** Playwright — full diagram rendering, interactions, export

## KEY PATTERNS

### Zustand Store Testing
Fresh store per test via factory function:
```typescript
const createStore = () => create(...)
let store; beforeEach(() => { store = createStore(); });
```

### React Flow Component Testing
Wrap in ReactFlowProvider with fixed dimensions. Mock ResizeObserver.

### Web Worker Testing
Extract logic into pure functions → test directly. Mock Worker interface for integration.

### WASM Testing
Mock WASM module for unit tests. Load real .wasm for integration tests.

### Visual Regression (Playwright)
```typescript
await expect(page).toHaveScreenshot('default-diagram.png', { maxDiffPixelRatio: 0.01, animations: 'disabled' });
```

### Storybook
`@storybook/react-vite` (NOT webpack — much faster). Interaction tests via play functions. `@storybook/addon-a11y` for accessibility.

---

## CI/CD (GitHub Actions)

```yaml
Jobs (parallelized):
1. lint-and-typecheck
2. unit-tests (vitest --coverage)
3. build-wasm (Rust → wasm-pack)
4. build-next (depends on wasm)
5. e2e-tests (Playwright, depends on build)
6. bundle-size (size-limit, PR only)
```

Bundle size monitoring: `size-limit` with thresholds (350KB JS, 150KB WASM gzipped).

---

## DEPLOYMENT OPTIONS

### Option A: Vercel (recommended for web)
- Zero-config Next.js, preview deploys per PR
- WASM files: `Content-Type: application/wasm`, long cache

### Option B: Docker Self-Hosted
```dockerfile
FROM node:20-alpine AS base
# Stage 1: Build WASM (Rust)
# Stage 2: Build Next.js
# Stage 3: Production runner (standalone output)
```
Requires `output: 'standalone'` in next.config.js.

### Option C: Static Export (offline/air-gapped)
`output: 'export'` — no SSR, no API routes. Pure client-side.

### Option D: PWA
`@ducanh2912/next-pwa` + Workbox. WASM cached with CacheFirst strategy.

### Option E: Desktop — Tauri v2 (NOT Electron)

| Factor | Tauri | Electron |
|---|---|---|
| Binary size | 5-15 MB | 150-300 MB |
| RAM | ~50-80 MB | ~200-500 MB |
| Startup | <1s | 2-5s |
| Backend | Rust | Node.js |
| WebView | System | Bundled Chromium |

---

## MONITORING

### Errors: Sentry (`@sentry/nextjs`)
Session replay, source maps, error tracking.

### Analytics: PostHog (`posthog-js`)
Privacy-friendly, no cookies (`persistence: 'memory'`), explicit events only.
Free tier: 1M events/month.

### Web Vitals: `web-vitals` or Vercel Speed Insights
Target: LCP < 2.5s, INP < 100ms, CLS < 0.1.
