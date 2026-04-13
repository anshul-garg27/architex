# Concurrency, ML System Design & DevOps Tools

---

## CONCURRENCY & PARALLELISM

### Thread Visualization
- **Java VisualVM / JConsole:** Real-time thread monitoring, state timeline, deadlock detection
- **Visual Studio Concurrency Visualizer:** Thread-to-core mapping, blocking analysis

### Race Condition Detection
- **ThreadSanitizer (Google):** Compile-time instrumentation for C/C++/Go. `go test -race`
- **rr (Mozilla):** Deterministic record/replay debugger. Reverse debugging.

### Async/Await Visualization
- **Loupe (Philip Roberts):** THE BEST event loop visualization ever. Call stack + Web APIs + callback queue.
- **GAP:** Loupe is stuck in callback era. NO modern async/await + Promise visualizer exists.

### Go Goroutines
- **go tool trace:** Built-in goroutine scheduling timeline. Browser-based visualization.

### Classic Problems (Animated)
- Producer-Consumer, Dining Philosophers: Various university tools (fragmented, dated)
- **GAP:** No polished, unified concurrency concept visualizer exists. This is the BIGGEST gap.

---

## ML SYSTEM DESIGN

### ML Pipeline Visualization
- **Kubeflow Pipelines:** DAG visualization, experiment tracking, artifact lineage
- **MLflow:** Experiment comparison, model registry, parallel coordinate plots
- **ZenML:** Stack abstraction, pipeline DAG visualizer

### TensorFlow Playground (playground.tensorflow.org) — GOLD STANDARD
- Interactive neural network: layers (1-6), neurons (1-8), activation functions
- 4 datasets, real-time decision boundary, neuron heatmaps, loss curve
- **Missing:** Only classification, only 2D, only dense layers, no CNN/RNN/Transformer

### Model Architecture Visualization
- **Netron:** Universal model viewer (ONNX, TF, PyTorch, 20+ formats)
- **NN-SVG:** Publication-quality architecture diagrams

### A/B Testing
- **GAP:** NO dedicated interactive A/B testing system design tool exists

### Feature Store
- **Feast:** Open-source feature store with web UI for feature discovery
- **GAP:** No interactive feature store architecture designer

---

## DEVOPS & CI/CD

### Pipeline Visualization
- **GitLab CI/CD:** Best built-in pipeline DAG viz with editor preview
- **GitHub Actions:** Clean job/step visualization with matrix expansion
- **Jenkins Blue Ocean:** Visual pipeline editor (deprecated)

### Kubernetes
- **Lens:** Best K8s desktop IDE. Real-time cluster dashboard.
- **Weave Scope:** Auto-generated topology map (archived — Weaveworks shut down 2024)
- **Portainer:** Simplest container management UI

### Deployment Strategies
- **Argo Rollouts:** Live canary progression dashboard (% traffic, analysis, promote/abort)
- **GAP:** NO educational tool for visualizing blue-green vs canary vs rolling. All static diagrams.

### GitOps
- **Argo CD:** Best GitOps state viz (resource tree, diff view, sync status)
- **Flux CD:** Modular but minimal built-in UI

### Infrastructure Diagrams
- **draw.io:** Most comprehensive free tool (10,000+ shapes)
- **Cloudcraft:** 3D AWS diagrams, auto-import from live AWS
- **Brainboard:** Visual Terraform designer (diagram ↔ Terraform code)
- **Diagrams (Python):** Infrastructure-as-code diagrams

---

## BIGGEST GAPS

1. **No interactive concurrency concept visualizer** — university tools are dead (Java applets)
2. **No modern async/await visualizer** — Loupe is brilliant but stuck in callback era
3. **No deployment strategy visualizer** with traffic flow animation
4. **No ML system architecture designer** for feature stores, serving, A/B testing
5. **No A/B testing system design tool** despite being fundamental to ML systems
