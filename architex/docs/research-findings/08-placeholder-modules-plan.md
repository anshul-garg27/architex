# Placeholder Modules Implementation Plan

> Source: MEGA_PROMPT PART 6 (Data Structure Explorer), PART 7 (LLD Studio), PART 8 (Database Design Lab), PART 13 (Security & Cryptography), PART 14 (ML System Design)
> Date: 2026-04-11

These 5 modules are currently served by a single `PlaceholderModule.tsx` component. Each requires a complete implementation with visualization engines, interaction logic, and educational content. This document details the full implementation plan for each module.

---

## Module A: Data Structure Explorer

**Spec reference:** MEGA_PROMPT PART 6 | Wireframe Screen 6

### Scope
- 45 data structures across 4 categories
- Insert, Delete, Search, and structure-specific operations for each
- Step-by-step animated visualization with playback controls
- Compare mode (side-by-side DS comparison)
- Operation log with replay
- Complexity info panel

### Component Files (22 files)

```
src/components/modules/DataStructureModule.tsx          -- Module wrapper, DS selector, routing
src/components/data-structures/DSTopBar.tsx              -- DS selector segmented control, Compare toggle, Reset
src/components/data-structures/DSOperationControls.tsx   -- Value input, operation buttons (vary by DS)
src/components/data-structures/DSVisualizationCanvas.tsx -- Canvas container, renders per-DS visualizer
src/components/data-structures/DSOperationLog.tsx        -- Scrollable log, replay on click
src/components/data-structures/DSInfoPanel.tsx           -- Complexity table, use cases, comparison notes
src/components/data-structures/DSStepControls.tsx        -- Playback controls (reuse pattern from AlgorithmPanel)
src/components/data-structures/visualizers/ArrayVisualizer.tsx         -- Horizontal cells with index labels
src/components/data-structures/visualizers/LinkedListVisualizer.tsx    -- Chain of nodes with arrows
src/components/data-structures/visualizers/StackVisualizer.tsx         -- Vertical stack, push/pop animation
src/components/data-structures/visualizers/QueueVisualizer.tsx         -- Horizontal, enqueue/dequeue animation
src/components/data-structures/visualizers/HashTableVisualizer.tsx     -- Bucket grid, hash function viz
src/components/data-structures/visualizers/BSTVisualizer.tsx           -- Top-down tree, rotation animations
src/components/data-structures/visualizers/AVLTreeVisualizer.tsx       -- BST + balance factors
src/components/data-structures/visualizers/RedBlackTreeVisualizer.tsx  -- BST + red/black coloring
src/components/data-structures/visualizers/HeapVisualizer.tsx          -- Dual view: tree + array
src/components/data-structures/visualizers/TrieVisualizer.tsx          -- Multi-way tree, character edges
src/components/data-structures/visualizers/BTreeVisualizer.tsx         -- Multi-element nodes, splitting
src/components/data-structures/visualizers/GraphVisualizer.tsx         -- Force-directed layout, draggable
src/components/data-structures/visualizers/SkipListVisualizer.tsx      -- Multi-level linked list
src/components/data-structures/visualizers/BloomFilterVisualizer.tsx   -- Bit array + hash functions + FP rate
src/components/data-structures/visualizers/LSMTreeVisualizer.tsx       -- Memtable -> SSTable compaction pipeline
```

### Library Files (16 files)

```
src/lib/data-structures/types.ts                -- DSType enum, DSOperation, DSStep, DSState
src/lib/data-structures/array.ts                -- Array operations engine
src/lib/data-structures/linked-list.ts          -- Singly/doubly/circular LL
src/lib/data-structures/stack.ts                -- Array + LL implementations
src/lib/data-structures/queue.ts                -- Array + LL + circular buffer
src/lib/data-structures/hash-table.ts           -- Separate chaining + open addressing
src/lib/data-structures/bst.ts                  -- BST insert/delete/search/traverse
src/lib/data-structures/avl-tree.ts             -- AVL with rotation tracking
src/lib/data-structures/red-black-tree.ts       -- RB with recolor/rotation steps
src/lib/data-structures/heap.ts                 -- Min/max heap with heapify
src/lib/data-structures/trie.ts                 -- Insert/search/delete with prefix matching
src/lib/data-structures/b-tree.ts               -- B-Tree with split/merge
src/lib/data-structures/graph.ts                -- Adjacency list, BFS, DFS
src/lib/data-structures/skip-list.ts            -- Probabilistic skip list
src/lib/data-structures/bloom-filter.ts         -- Bloom filter with FP rate tracking
src/lib/data-structures/lsm-tree.ts             -- Memtable, immutable, SSTable, compaction
src/lib/data-structures/index.ts                -- Barrel export
```

### Store File
```
src/stores/data-structure-store.ts  -- Current DS, current state, operation history, step index, playback state
```

### Task Count: ~30 tasks

### Key Challenges
1. **Tree layout algorithm** -- Computing x/y positions for balanced/unbalanced trees requires a tree layout algorithm (Reingold-Tilford or similar). This is needed for BST, AVL, RB, B-Tree, Trie.
2. **Animation orchestration** -- Each operation generates a sequence of steps. Each step must highlight specific elements, move elements, change colors, and show annotations. The animation system must support pause/resume/step/speed-change mid-animation.
3. **45 data structures** -- Building all 45 is a massive scope. Recommend phasing: Phase 1 (15 basic), Phase 2 (12 trees), Phase 3 (12 advanced), Phase 4 (6 system design DS).
4. **Compare mode** -- Rendering two DS side-by-side with synchronized operations requires careful layout management.

### Dependencies
- motion/react (Framer Motion successor) for animations
- d3-hierarchy or custom tree layout for tree structures
- Playback controller pattern from existing `playback-controller.ts`

---

## Module B: Low-Level Design Studio

**Spec reference:** MEGA_PROMPT PART 7 | Wireframe Screen 7

### Scope
- 4 diagram types: Class, Sequence, State Machine, Component
- 23 GoF design patterns + 10 modern patterns (33 total) with interactive templates
- Bidirectional code generation (Diagram to Code and Code to Diagram)
- SOLID principles interactive explorer (5 demonstrations)
- LLD problem library (20+ problems)

### Component Files (24 files)

```
src/components/modules/LLDModule.tsx                    -- Module wrapper
src/components/lld/LLDTopToolbar.tsx                     -- Diagram type selector, AI Review, Generate Code
src/components/lld/LLDPatternLibrary.tsx                 -- Left panel (240px), pattern accordion, search
src/components/lld/LLDPatternDetail.tsx                  -- Pattern detail popover (description, UML, code, use cases)
src/components/lld/LLDCanvas.tsx                         -- Canvas container, switches renderer by diagram type
src/components/lld/LLDPropertiesPanel.tsx                -- Right panel (320px), Properties + Code Gen tabs
src/components/lld/LLDCodeGenPanel.tsx                   -- Language selector, syntax-highlighted output, Copy/Download
src/components/lld/diagrams/ClassDiagramCanvas.tsx       -- UML class boxes, relationships, inline editing
src/components/lld/diagrams/ClassBox.tsx                 -- Single class node (name, attributes, methods compartments)
src/components/lld/diagrams/RelationshipEdge.tsx         -- Inheritance, composition, aggregation, etc.
src/components/lld/diagrams/SequenceDiagramCanvas.tsx    -- Lifelines, messages, activation boxes
src/components/lld/diagrams/SequenceLifeline.tsx         -- Individual lifeline with activation bars
src/components/lld/diagrams/SequenceMessage.tsx          -- Sync/async/return message arrows
src/components/lld/diagrams/StateDiagramCanvas.tsx       -- States, transitions, composite states
src/components/lld/diagrams/StateNode.tsx                -- State with entry/exit/do activities
src/components/lld/diagrams/TransitionEdge.tsx           -- Transition arrow with guard/action label
src/components/lld/diagrams/ComponentDiagramCanvas.tsx   -- Component boxes and interfaces
src/components/lld/solid/SOLIDExplorer.tsx               -- 5 interactive SOLID demos
src/components/lld/solid/SRPDemo.tsx                     -- Single Responsibility before/after
src/components/lld/solid/OCPDemo.tsx                     -- Open/Closed extension demo
src/components/lld/solid/LSPDemo.tsx                     -- Liskov substitution checker
src/components/lld/solid/ISPDemo.tsx                     -- Interface segregation splitting
src/components/lld/solid/DIPDemo.tsx                     -- Dependency inversion flip
src/components/lld/LLDProblemLibrary.tsx                 -- 20+ LLD problems with solution templates
```

### Library Files (14 files)

```
src/lib/lld/types.ts                        -- DiagramType, ClassDefinition, Relationship, Pattern types
src/lib/lld/patterns/index.ts               -- Pattern registry (33 patterns)
src/lib/lld/patterns/creational.ts          -- 5 creational pattern definitions
src/lib/lld/patterns/structural.ts          -- 7 structural pattern definitions
src/lib/lld/patterns/behavioral.ts          -- 11 behavioral pattern definitions
src/lib/lld/patterns/modern.ts              -- 10 modern pattern definitions
src/lib/lld/codegen/types.ts                -- Code generation types
src/lib/lld/codegen/to-typescript.ts        -- Class diagram -> TypeScript
src/lib/lld/codegen/to-python.ts            -- Class diagram -> Python
src/lib/lld/codegen/to-java.ts              -- Class diagram -> Java
src/lib/lld/codegen/from-code.ts            -- Code -> Class diagram (Tree-sitter parsing)
src/lib/lld/problems/index.ts               -- 20+ LLD problem definitions
src/lib/lld/problems/types.ts               -- Problem, Solution template types
src/lib/lld/uml-layout.ts                   -- Layout algorithms for UML diagrams
```

### Store File
```
src/stores/lld-store.ts  -- Diagram type, classes, relationships, selected element, pattern state, code gen state
```

### Task Count: ~35 tasks

### Key Challenges
1. **Four diagram renderers** -- Class, Sequence, State, and Component diagrams each need their own renderer with unique interaction models. Sequence diagrams are especially complex (vertical lifelines, horizontal messages, activation boxes, combined fragments).
2. **Bidirectional code generation** -- Diagram-to-code is straightforward template generation. Code-to-diagram requires parsing TypeScript/Python/Java ASTs. Tree-sitter WASM bindings are needed for client-side parsing.
3. **33 design patterns** -- Each pattern needs: description, UML template (class structure for drag-to-canvas), code in 3 languages, before/after view, real-world examples. This is significant content authoring.
4. **SOLID principles** -- 5 interactive demonstrations requiring before/after diagrams with animated transitions.
5. **React Flow vs custom renderer** -- Class and State diagrams can use React Flow. Sequence diagrams need a custom renderer (vertical lifelines with horizontal messages are not a node-edge graph).

### Dependencies
- React Flow (for Class and State diagrams)
- Custom SVG renderer (for Sequence diagrams)
- Monaco Editor (for code generation display and code-to-diagram input)
- tree-sitter WASM (for code parsing)

---

## Module C: Database Design Lab

**Spec reference:** MEGA_PROMPT PART 8 | Wireframe Screen 8

### Scope
- ER diagram builder (Chen + Crow's foot notation)
- Normalization step-through (1NF through BCNF)
- SQL query execution plan visualizer
- Index visualization (B-Tree, B+ Tree, Hash, LSM-Tree)
- Transaction isolation level demos (4 levels)

### Component Files (22 files)

```
src/components/modules/DatabaseModule.tsx               -- Module wrapper with 4-tab structure
src/components/database/DBTopBar.tsx                     -- Tab selector (ER, Normalization, Query Plan, Index Viz)
src/components/database/er/ERCanvas.tsx                  -- ER diagram canvas with crow's foot notation
src/components/database/er/EREntityPalette.tsx           -- Left panel (New Table, enum list, Import SQL)
src/components/database/er/ERTableNode.tsx               -- Table box node (header, column rows, constraint icons)
src/components/database/er/ERRelationshipEdge.tsx        -- Crow's foot notation lines (1:1, 1:N, M:N)
src/components/database/er/ERTableProperties.tsx         -- Right panel (column editor, index editor, SQL preview)
src/components/database/er/ERImportSQL.tsx               -- SQL parser (CREATE TABLE -> table nodes)
src/components/database/normalization/NormalizationExercise.tsx  -- Interactive exercise area
src/components/database/normalization/FDSelector.tsx      -- Click to select functional dependencies
src/components/database/normalization/TableSplitter.tsx   -- Split table by selecting columns
src/components/database/normalization/NormalizationSteps.tsx -- 5-step indicator
src/components/database/normalization/NormalizationReference.tsx -- Reference panel, hint system
src/components/database/query-plan/QueryPlanEditor.tsx   -- SQL input area with syntax highlighting
src/components/database/query-plan/QueryPlanTree.tsx     -- Visual execution plan tree
src/components/database/query-plan/QueryPlanNode.tsx     -- Individual plan node (operation, rows, cost, time)
src/components/database/query-plan/QueryPlanText.tsx     -- Raw EXPLAIN text output
src/components/database/index-viz/IndexVisCanvas.tsx     -- B-Tree/B+Tree visual with animation
src/components/database/index-viz/IndexVisControls.tsx   -- Table/index selector, operation picker, value input
src/components/database/index-viz/BTreeVisualizer.tsx    -- B-Tree index structure with page I/O
src/components/database/index-viz/BPlusTreeVisualizer.tsx -- B+ Tree with leaf-level linked list
src/components/database/index-viz/HashIndexVisualizer.tsx -- Hash function mapping visualization
src/components/database/index-viz/LSMTreeIndexVisualizer.tsx -- Memtable -> SSTable compaction
```

### Library Files (12 files)

```
src/lib/database/types.ts                   -- Table, Column, Constraint, Relationship types
src/lib/database/er-to-sql.ts               -- Generate CREATE TABLE from ER model
src/lib/database/sql-to-er.ts               -- Parse CREATE TABLE statements to ER model
src/lib/database/normalization/engine.ts     -- FD closure, candidate key finder, NF checker
src/lib/database/normalization/decompose.ts  -- Lossless decomposition to 2NF/3NF/BCNF
src/lib/database/normalization/exercises.ts  -- Pre-built normalization exercises
src/lib/database/query-plan/parser.ts        -- Parse PostgreSQL EXPLAIN output
src/lib/database/query-plan/estimator.ts     -- Client-side query cost estimation
src/lib/database/index/b-tree.ts             -- B-Tree operations with step tracking
src/lib/database/index/b-plus-tree.ts        -- B+ Tree with range query support
src/lib/database/index/hash-index.ts         -- Hash index with collision resolution
src/lib/database/index/lsm-tree.ts           -- LSM-Tree compaction simulation
```

### Store File
```
src/stores/database-store.ts  -- Active tab, tables, relationships, selected entity, normalization state, query plan state
```

### Task Count: ~28 tasks

### Key Challenges
1. **ER diagram rendering** -- Tables as complex multi-row nodes in React Flow. Crow's foot notation requires custom edge renderers with specific line endings.
2. **SQL parsing** -- Parsing CREATE TABLE statements client-side for the import feature. Could use a lightweight SQL parser library.
3. **Normalization engine** -- Computing attribute closure, finding candidate keys, and performing lossless decomposition requires implementing relational algebra algorithms. This is algorithmically complex.
4. **Query plan visualization** -- The query plan tree needs to parse EXPLAIN output format and render it as a tree with proportional node widths based on cost. Could be simulated (no actual DB connection) or connected to a real Neon database.
5. **Index visualization** -- B-Tree and B+ Tree visualizations need animated page traversal and split/merge operations. Similar challenges to the Data Structure Explorer tree visualizations.

### Dependencies
- React Flow (for ER diagrams)
- Monaco Editor (for SQL input)
- SQL parser library (e.g., `pgsql-ast-parser` or `node-sql-parser`)
- Tree layout algorithm (shared with Data Structure Explorer)

---

## Module D: Security & Cryptography Explorer

**Spec reference:** MEGA_PROMPT PART 13

### Scope
- OAuth 2.0 / OIDC flow visualizer (3 flows)
- JWT lifecycle (creation, validation, refresh, attacks)
- AES encryption rounds (10-round step-through)
- Diffie-Hellman key exchange (math + analogy)
- CORS flow simulator (cross-linked with Networking module)
- HTTPS full flow (DNS -> TCP -> TLS -> HTTP -> Close)

### Component Files (16 files)

```
src/components/modules/SecurityModule.tsx                -- Module wrapper
src/components/security/SecurityTopBar.tsx                -- Topic selector
src/components/security/oauth/OAuthFlowVisualizer.tsx     -- OAuth flow diagram with step-through
src/components/security/oauth/OAuthConfig.tsx             -- Configure client, scopes, redirect URI
src/components/security/oauth/OAuthRequestResponse.tsx    -- HTTP request/response panel per step
src/components/security/jwt/JWTLifecycle.tsx              -- JWT creation, validation, refresh
src/components/security/jwt/JWTDecoder.tsx                -- Header/Payload/Signature color-coded (jwt.io style)
src/components/security/jwt/JWTAttacks.tsx                -- None algorithm, replay, confusion demos
src/components/security/aes/AESVisualizer.tsx             -- 10-round step-through
src/components/security/aes/AESStateMatrix.tsx            -- 4x4 byte matrix with transformations
src/components/security/aes/AESRoundStep.tsx              -- SubBytes, ShiftRows, MixColumns, AddRoundKey
src/components/security/dh/DiffieHellmanVisualizer.tsx    -- Paint mixing analogy + mathematical computation
src/components/security/dh/DHMathPanel.tsx                -- Step-by-step math (modular exponentiation)
src/components/security/cors/CORSFlowSimulator.tsx        -- Request/response flow with headers
src/components/security/https/HTTPSFullFlow.tsx            -- DNS -> TCP -> TLS -> HTTP end-to-end
src/components/security/SecurityStepControls.tsx           -- Shared playback controls
```

### Library Files (10 files)

```
src/lib/security/types.ts                   -- SecurityTopic, FlowStep, OAuthConfig types
src/lib/security/oauth/flows.ts             -- Auth code + PKCE, Client Credentials, Device Auth
src/lib/security/oauth/token-exchange.ts    -- Token exchange, refresh rotation
src/lib/security/jwt/encoder.ts             -- JWT creation (Header.Payload.Signature)
src/lib/security/jwt/validator.ts           -- Decode, verify signature, check claims
src/lib/security/aes/engine.ts              -- AES-128 round operations (SubBytes, ShiftRows, MixColumns, AddRoundKey)
src/lib/security/aes/sbox.ts                -- S-box lookup table
src/lib/security/dh/engine.ts               -- Diffie-Hellman math (modular exponentiation, shared secret)
src/lib/security/cors/simulator.ts          -- CORS request/response simulation
src/lib/security/https/flow.ts              -- HTTPS full flow step definitions with timing
```

### Store File
```
src/stores/security-store.ts  -- Active topic, flow state, step index, config parameters
```

### Task Count: ~22 tasks

### Key Challenges
1. **AES round visualization** -- Rendering a 4x4 byte matrix transforming through SubBytes (S-box lookup), ShiftRows (row shifting), MixColumns (Galois field math), and AddRoundKey (XOR) for 10 rounds requires careful animation. The math is non-trivial (Galois field multiplication for MixColumns).
2. **OAuth flow fidelity** -- Must accurately represent the real HTTP request/response cycle for each OAuth flow. Users configure client_id, scopes, redirect_uri and see the actual requests that would be made. Needs to show token exchange, refresh rotation, and PKCE challenge/verifier.
3. **JWT attacks** -- Demonstrating the "none" algorithm attack, token replay, and JWT confusion requires building intentionally vulnerable decoders and showing why they fail.
4. **HTTPS full flow** -- End-to-end flow from DNS resolution through TCP handshake, TLS handshake (with certificate exchange), HTTP request/response, and connection close. Each step has timing. Must cross-link with the Networking module's TCP and TLS visualizers.
5. **Cryptographic accuracy** -- All visualizations must be mathematically correct. The DH visualization must use real modular exponentiation with prime numbers. The AES S-box must be the actual AES S-box.

### Dependencies
- SVG-based flow diagrams (not React Flow -- these are protocol flows, not node-edge graphs)
- Math rendering for DH (could use simple HTML/CSS for modular arithmetic)
- Shared step controls pattern
- Cross-module linking to Networking module (CORS, TLS, TCP)

---

## Module E: ML System Design Studio

**Spec reference:** MEGA_PROMPT PART 14

### Scope
- TensorFlow Playground (enhanced neural network trainer)
- ML pipeline builder (drag-and-drop pipeline stages)
- Feature store architecture visualizer
- Model serving patterns (6 patterns)
- A/B testing system design

### Component Files (20 files)

```
src/components/modules/MLModule.tsx                      -- Module wrapper
src/components/ml/MLTopBar.tsx                            -- Topic selector
src/components/ml/playground/NNPlayground.tsx              -- Neural network playground container
src/components/ml/playground/NNCanvas.tsx                  -- Network visualization (layers, neurons, connections)
src/components/ml/playground/NNControls.tsx                -- Layer config, learning rate, activation, regularization
src/components/ml/playground/NNDatasetSelector.tsx         -- Circle, XOR, Gaussian, spiral, custom drawing
src/components/ml/playground/NNTrainingPanel.tsx           -- Training controls, loss chart, accuracy chart
src/components/ml/playground/NNDecisionBoundary.tsx        -- 2D decision boundary visualization
src/components/ml/playground/NNLossLandscape.tsx           -- 3D loss landscape (WebGL)
src/components/ml/pipeline/MLPipelineBuilder.tsx           -- Drag-and-drop pipeline canvas
src/components/ml/pipeline/MLPipelineStage.tsx             -- Individual stage node (Ingestion, Feature Eng, Training, Eval, Serving)
src/components/ml/pipeline/MLPipelineConfig.tsx            -- Stage configuration panel
src/components/ml/pipeline/MLPipelineTemplates.tsx         -- Spotify/TikTok pipeline templates
src/components/ml/feature-store/FeatureStoreVisualizer.tsx -- Online + offline store architecture
src/components/ml/feature-store/FeatureStoreFlow.tsx       -- Data flow between stores
src/components/ml/serving/ModelServingPatterns.tsx          -- 6 serving pattern visualizations
src/components/ml/serving/TrafficSplitVisualizer.tsx       -- A/B testing, canary, shadow traffic
src/components/ml/ab-testing/ABTestDesigner.tsx            -- User assignment, event collection
src/components/ml/ab-testing/ABTestStats.tsx               -- Sample size calculator, significance testing
src/components/ml/ab-testing/ABTestGuardrails.tsx          -- Guardrail metrics visualization
```

### Library Files (12 files)

```
src/lib/ml/types.ts                         -- NeuralNetwork, Layer, Neuron, Pipeline, Pattern types
src/lib/ml/nn/network.ts                    -- Neural network forward/backward pass
src/lib/ml/nn/activations.ts                -- Sigmoid, ReLU, tanh, softmax
src/lib/ml/nn/loss.ts                       -- MSE, cross-entropy loss functions
src/lib/ml/nn/optimizer.ts                  -- SGD, Adam optimizers
src/lib/ml/nn/datasets.ts                   -- Circle, XOR, Gaussian, spiral dataset generators
src/lib/ml/pipeline/types.ts                -- Pipeline stage definitions
src/lib/ml/pipeline/templates.ts            -- Pre-built pipeline templates
src/lib/ml/serving/patterns.ts              -- 6 serving pattern definitions
src/lib/ml/ab-testing/statistics.ts         -- Sample size calculator, z-test, chi-square
src/lib/ml/ab-testing/assignment.ts         -- Consistent hashing for user assignment
src/lib/ml/feature-store/architecture.ts    -- Feature store component definitions
```

### Store File
```
src/stores/ml-store.ts  -- Active topic, network config, training state, pipeline state
```

### Task Count: ~27 tasks

### Key Challenges
1. **Neural network training in browser** -- Forward pass and backward pass (backpropagation) must run in the browser. For small networks (1-8 layers, 1-16 neurons), this is feasible in JavaScript. For larger networks or CNN layers, consider Web Workers.
2. **Decision boundary visualization** -- Sampling a 2D grid of points, running them through the network, and color-coding the output creates the decision boundary. Must update in real-time during training. Consider canvas rendering for performance.
3. **3D loss landscape** -- Rendering a 3D surface requires WebGL (Three.js or deck.gl). This is the most technically demanding visualization in the entire module. Can be deferred to later phase.
4. **CNN layer type** -- The spec enhances TF Playground with 2D convolution. This requires image datasets and convolution kernel visualization. Significant additional complexity.
5. **Statistical testing** -- A/B testing requires implementing z-tests and chi-square tests correctly. Sample size calculators need proper power analysis formulas.

### Dependencies
- Canvas or WebGL for decision boundary rendering
- Three.js (for 3D loss landscape, can be deferred)
- React Flow (for ML pipeline builder)
- Web Workers (for training computation)
- Math library for statistics (or implement from scratch)

---

## Task Summary

| Module | Component Files | Library Files | Store Files | Estimated Tasks |
|--------|----------------|---------------|-------------|-----------------|
| A: Data Structure Explorer | 22 | 16 + index | 1 | ~30 |
| B: LLD Studio | 24 | 14 | 1 | ~35 |
| C: Database Design Lab | 22 | 12 | 1 | ~28 |
| D: Security & Crypto | 16 | 10 | 1 | ~22 |
| E: ML System Design | 20 | 12 | 1 | ~27 |
| **TOTAL** | **104** | **64** | **5** | **~142** |

### Shared Dependencies Across Modules
1. **Tree layout algorithm** -- Used by Data Structure Explorer (BST, AVL, RB, B-Tree, Trie, Heap) and Database Lab (B-Tree index, B+ Tree, Query Plan tree). Build once, share.
2. **Playback controller pattern** -- Already exists in `playback-controller.ts`. Every module needs step-by-step animation with play/pause/speed/scrub. Extend and reuse.
3. **Step controls component** -- The bottom-bar playback UI (jump-start, step-back, play/pause, step-forward, jump-end, speed slider, progress bar) is identical across Data Structure Explorer, Algorithm Visualizer, Security Explorer, and several DB Lab tabs. Build as a shared component.
4. **Canvas/SVG rendering patterns** -- Many visualizations use SVG overlays on canvas (tree structures, flow diagrams, state matrices). Establish shared SVG utility components (Arrow, Node, Edge, Label).
5. **React Flow integration** -- Used by LLD Studio (Class/State diagrams), Database Lab (ER diagrams), ML Pipeline Builder. Shared node/edge base components and interaction patterns.

### Recommended Build Order
1. **Shared infrastructure first**: Tree layout, playback controls component, shared SVG utilities
2. **Module A: Data Structure Explorer** -- Builds on existing Algorithm Visualizer patterns, establishes tree visualization foundation used by DB Lab
3. **Module C: Database Design Lab** -- ER diagram reuses React Flow, index viz reuses tree layout, normalization is self-contained
4. **Module B: LLD Studio** -- Most complex (4 diagram types + code gen + patterns), benefits from all prior canvas/rendering work
5. **Module D: Security & Crypto** -- Mostly SVG flow diagrams, relatively independent, can be parallelized
6. **Module E: ML System Design** -- Most technically demanding (NN training, 3D viz), least dependent on other modules, can be parallelized
