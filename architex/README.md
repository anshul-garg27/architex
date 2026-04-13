# Architex

**Interactive Engineering Laboratory**

Design systems. Visualize algorithms. Ace interviews.

---

<!-- Screenshot placeholder: replace with actual screenshot -->
> ![Architex Screenshot](docs/screenshot-placeholder.png)

---

## Quick Start

```bash
git clone https://github.com/your-org/architex.git
cd architex
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). No environment variables required for local development.

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| UI Library | React 19 |
| Styling | Tailwind CSS v4, shadcn/ui, Radix UI |
| Canvas | React Flow (@xyflow/react v12) |
| State Management | Zustand v5 + zundo (undo/redo) |
| Animation | motion (Framer Motion) |
| Storage | Dexie (IndexedDB) for local persistence |
| Testing | Vitest, Testing Library |
| Component Dev | Storybook |
| Icons | Lucide React |
| Layout | react-resizable-panels |
| Compression | lz-string |

---

## Project Structure

```
src/
  app/                    Next.js App Router pages
  components/
    canvas/               React Flow canvas: nodes, edges, panels, overlays
      nodes/
        system-design/    30+ system design node components (BaseNode pattern)
      edges/              Custom edge renderers
      panels/             Inspector, palette, minimap panels
      overlays/           Canvas overlay components
    modules/              Module components (Algorithm, Distributed, OS, etc.)
    ui/                   shadcn/ui component library
    shared/               Layout shell, command palette, activity bar
  lib/
    algorithms/           Sorting, graph, tree, DP, string algorithm engines
    concurrency/          Thread and synchronization simulations
    database/             Normalization, ER diagram logic
    distributed/          Raft, consistent hashing, vector clocks
    interview/            Challenge definitions and scoring
    lld/                  Low-level design pattern definitions
    ml-design/            Neural network training logic
    networking/           TCP, TLS, DNS, HTTP, WebSocket simulations
    os/                   CPU scheduling, page replacement, deadlock
    security/             OAuth, JWT, cryptography simulations
    simulation/           Traffic sim, queuing theory, chaos engine
    templates/            Pre-built architecture templates
    export/               Diagram export utilities
    visualization/        Shared visualization helpers
    constants/            Latency numbers, motion design tokens
    utils/                General utilities
  stores/                 Zustand stores (canvas, editor, UI, simulation, interview, viewport)
  hooks/                  Keyboard shortcuts and custom hooks
  workers/                Web Workers for off-thread computation
  styles/                 Global styles
```

---

## Modules

Architex ships 13 interactive learning modules:

| # | Module | Description |
|---|---|---|
| 1 | **System Design Simulator** | Drag-and-drop architecture builder with live traffic simulation, chaos engineering, and real-time metrics across 30+ component types |
| 2 | **Algorithm Visualizer** | 26+ algorithms (sorting, graph, tree, DP, string) with step-by-step animation and playback controls |
| 3 | **Data Structure Explorer** | Interactive visualization of arrays, linked lists, hash tables, BSTs, bloom filters |
| 4 | **Distributed Systems** | Raft consensus, consistent hashing, vector clocks, gossip protocol, CRDTs, CAP theorem |
| 5 | **Networking and Protocols** | TCP, TLS 1.3, DNS resolution, HTTP/1-2-3 comparison, WebSocket, CORS |
| 6 | **Operating Systems** | CPU scheduling (6 algorithms), page replacement, deadlock detection, virtual memory |
| 7 | **Security and Cryptography** | OAuth 2.0 PKCE, JWT lifecycle, Diffie-Hellman key exchange |
| 8 | **ML System Design** | Neural network trainer with live decision boundary visualization |
| 9 | **Database Design** | Normalization, ER diagrams, indexing strategies, query optimization |
| 10 | **LLD Patterns** | Low-level design patterns with interactive class diagrams |
| 11 | **Concurrency** | Thread scheduling, race conditions, mutex and semaphore demonstrations |
| 12 | **Interview Engine** | 20+ challenges with timer, scoring, and auto-requirement detection |
| 13 | **Design System** | Shared UI component library with Storybook documentation |

---

## Development Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm test` | Run tests in watch mode (Vitest) |
| `pnpm test:run` | Run tests once |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm lint` | Lint with ESLint |
| `pnpm format` | Format code with Prettier |
| `pnpm format:check` | Check formatting |
| `pnpm storybook` | Launch Storybook on port 6006 |
| `pnpm analyze` | Build with bundle analyzer |

---

## Contributing

1. Fork the repository and create a feature branch.
2. Follow the existing code style -- run `pnpm format` and `pnpm lint` before committing.
3. Add tests for new functionality. Run `pnpm test:run` to verify.
4. Run `pnpm typecheck` to ensure no type errors.
5. Submit a pull request with a clear description of the changes.

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed development setup and coding guidelines.

---

## License

AGPL-3.0 -- See [LICENSE](LICENSE)
