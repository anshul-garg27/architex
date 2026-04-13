# The Twelve-Factor App (and Beyond)

## What Is the Twelve-Factor Methodology?

A set of **12 principles** for building modern, cloud-native applications that are portable,
scalable, and maintainable. Originally published by Heroku co-founder Adam Wiggins in 2011,
these principles remain the foundational contract between an application and the platform it
runs on.

**Core philosophy:** Applications should be **disposable**, **stateless**, **environment-agnostic**
units that can be deployed anywhere with zero manual intervention.

```mermaid
graph LR
    subgraph "12-Factor App Lifecycle"
        A[Codebase] --> B[Dependencies]
        B --> C[Config]
        C --> D[Backing Services]
        D --> E[Build/Release/Run]
        E --> F[Processes]
        F --> G[Port Binding]
        G --> H[Concurrency]
        H --> I[Disposability]
        I --> J[Dev/Prod Parity]
        J --> K[Logs]
        K --> L[Admin Processes]
    end
```

---

## Factor 1: Codebase — One Codebase, Many Deploys

### What It Says

There is exactly **one codebase** tracked in version control, and it produces **many deploys**
(staging, production, developer environments). Multiple apps sharing code should extract that
code into libraries included via dependency management.

### Why It Matters

- Single source of truth prevents drift between what teams think is deployed
- Every deploy traces back to a specific commit -- full auditability
- No "which version is on production?" confusion

### Violation Example

```
# WRONG: separate repos for "prod" and "dev" versions
repos/
  myapp-prod/       # manually copied code
  myapp-staging/    # different branch structure
  myapp-dev/        # developer's personal fork used in production
```

Team manually copies files between repos. Hotfixes applied to prod never make it back to dev.

### Correct Example

```
# RIGHT: one repo, multiple deploys via branches/tags
myapp/
  .git/
  src/
  Dockerfile
  
# Deploys:
#   commit abc123 -> staging
#   tag v2.4.1   -> production
#   branch feat/x -> dev environment
```

### How Modern Apps Implement It

- **Monorepos** (Nx, Turborepo) with clear package boundaries
- **Git tags** trigger production deploys; branches trigger preview environments
- **CI/CD pipelines** that deploy the same artifact to multiple environments
- Docker images built once, promoted across environments (same SHA)

---

## Factor 2: Dependencies — Explicitly Declare and Isolate

### What It Says

An app **never relies on implicit system-wide packages**. It declares all dependencies
completely via a dependency manifest and uses isolation tooling to ensure no system
dependencies leak in.

### Why It Matters

- New developers can set up the project from a clean checkout
- No "works on my machine" because a system library happened to be installed
- Reproducible builds across CI, staging, and production

### Violation Example

```bash
# WRONG: script assumes ImageMagick is installed globally
# No mention in package.json or requirements.txt
import subprocess
subprocess.call(["convert", "input.png", "output.jpg"])  # silently fails on fresh machine
```

### Correct Example

```dockerfile
# RIGHT: Dockerfile explicitly installs every dependency
FROM python:3.12-slim

# System dependency declared explicitly
RUN apt-get update && apt-get install -y imagemagick

# App dependencies declared in manifest
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
CMD ["python", "app.py"]
```

```
# requirements.txt -- every dependency pinned
flask==3.0.2
redis==5.0.1
Wand==0.6.13   # Python binding for ImageMagick
```

### How Modern Apps Implement It

- **Lock files**: `package-lock.json`, `poetry.lock`, `go.sum` pin exact versions
- **Containers**: Docker isolates the entire dependency tree including OS packages
- **Virtual environments**: Python venv, Node node_modules, Ruby bundler
- **Multi-stage builds**: build dependencies stay out of the runtime image

---

## Factor 3: Config — Store in the Environment, Not in Code

### What It Says

Configuration that varies between deploys (database URLs, API keys, feature flags) must
be stored in **environment variables**, not in code or config files checked into the repo.

**Litmus test:** Could you open-source the codebase right now without exposing any credentials?

### Why It Matters

- Credentials never end up in Git history
- Same artifact deploys to dev, staging, and production -- only env vars change
- Config changes do not require code changes, builds, or redeployments

### Violation Example

```python
# WRONG: hardcoded credentials in source code
DATABASE_URL = "postgres://admin:s3cret@prod-db.internal:5432/myapp"
STRIPE_KEY = "sk_live_abc123"
```

### Correct Example

```python
# RIGHT: read from environment
import os

DATABASE_URL = os.environ["DATABASE_URL"]
STRIPE_KEY = os.environ["STRIPE_KEY"]
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")
```

```yaml
# Kubernetes deployment -- config injected as env vars
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: myapp
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        - name: LOG_LEVEL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: log_level
```

### How Modern Apps Implement It

- **Kubernetes Secrets / ConfigMaps** mounted as env vars
- **AWS Parameter Store / Secrets Manager** with SDK lookups at startup
- **HashiCorp Vault** for dynamic secrets with automatic rotation
- **`.env` files** for local development only (always in `.gitignore`)

---

## Factor 4: Backing Services — Treat as Attached Resources

### What It Says

Backing services (databases, message queues, caches, SMTP servers, third-party APIs) are
**attached resources** accessed via a URL or locator stored in config. The app makes no
distinction between local and third-party services.

### Why It Matters

- Swap a local PostgreSQL for Amazon RDS by changing one environment variable
- No code change required to switch from self-hosted Redis to ElastiCache
- Services can be attached and detached at will during incidents

### Violation Example

```python
# WRONG: hardcoded connection assumes local MySQL on default port
import mysql.connector
db = mysql.connector.connect(host="localhost", database="myapp")
```

### Correct Example

```python
# RIGHT: backing service is an attached resource via URL
import os
from sqlalchemy import create_engine

engine = create_engine(os.environ["DATABASE_URL"])
# DATABASE_URL=postgres://user:pass@rds-instance.amazonaws.com:5432/myapp
```

```mermaid
graph LR
    App[Application] -->|DATABASE_URL| DB[(PostgreSQL)]
    App -->|REDIS_URL| Cache[(Redis)]
    App -->|SMTP_URL| Email[SendGrid API]
    App -->|S3_BUCKET| Storage[S3]
    
    style App fill:#4a90d9,color:#fff
    style DB fill:#336791,color:#fff
    style Cache fill:#d92b2b,color:#fff
```

### How Modern Apps Implement It

- **Connection strings** in environment variables
- **Service meshes** (Istio) abstract service discovery
- **Kubernetes Services** provide stable DNS names regardless of backing implementation
- **Cloud-managed services** (RDS, ElastiCache, CloudAMQP) swapped via config

---

## Factor 5: Build, Release, Run — Strictly Separate Stages

### What It Says

The delivery pipeline has three distinct stages:
1. **Build**: compile code, install dependencies, produce an artifact
2. **Release**: combine build artifact with deploy-specific config
3. **Run**: execute the release in the target environment

Every release has a unique ID. Releases are **append-only** -- you roll forward or roll back,
never mutate a running release.

### Why It Matters

- You can always answer "what exactly is running in production?"
- Rollback is instant -- redeploy the previous release
- Build once, deploy many times -- no re-compilation per environment

### Violation Example

```bash
# WRONG: SSH into server, git pull, npm install, restart
ssh prod-server
cd /var/www/myapp
git pull origin main
npm install
pm2 restart myapp
```

### Correct Example

```mermaid
graph LR
    A[Source Code] -->|Build| B[Docker Image<br/>myapp:abc123]
    B -->|Release| C[Image + Config<br/>release-42]
    C -->|Run| D[Container<br/>in Production]
    
    B -->|Release| E[Image + Config<br/>release-42-staging]
    E -->|Run| F[Container<br/>in Staging]
```

```yaml
# CI pipeline -- strict separation
stages:
  - build:
      script:
        - docker build -t myapp:${GIT_SHA} .
        - docker push registry.io/myapp:${GIT_SHA}
  - release-staging:
      script:
        - helm upgrade myapp chart/ --set image.tag=${GIT_SHA} -f values-staging.yaml
  - release-production:
      script:
        - helm upgrade myapp chart/ --set image.tag=${GIT_SHA} -f values-prod.yaml
      when: manual
```

### How Modern Apps Implement It

- **Docker images** are the build artifact (immutable, tagged by commit SHA)
- **Helm releases** or **Kustomize overlays** combine image + environment config
- **ArgoCD / Flux** manage the release-to-run transition declaratively
- **Container registries** store versioned, immutable artifacts

---

## Factor 6: Processes — Execute the App as Stateless, Share-Nothing Processes

### What It Says

Application processes are **stateless**. Any data that needs to persist must be stored in a
**stateful backing service** (database, object store, cache). Processes should never assume
anything cached in memory or on disk will be available on a future request.

### Why It Matters

- Processes can be killed and restarted without data loss
- Horizontal scaling is trivial -- just add more processes
- Load balancers can route any request to any instance

### Violation Example

```python
# WRONG: storing session data in local memory
sessions = {}

@app.route("/login", methods=["POST"])
def login():
    token = generate_token()
    sessions[token] = {"user_id": request.json["user_id"]}  # lost on restart/scale
    return {"token": token}
```

### Correct Example

```python
# RIGHT: session stored in Redis (backing service)
import redis
r = redis.from_url(os.environ["REDIS_URL"])

@app.route("/login", methods=["POST"])
def login():
    token = generate_token()
    r.setex(f"session:{token}", 3600, json.dumps({"user_id": request.json["user_id"]}))
    return {"token": token}
```

### How Modern Apps Implement It

- **Redis / Memcached** for session and cache data
- **S3 / GCS** for uploaded files (not local disk)
- **JWT tokens** carry state in the token itself (no server-side session)
- **Kubernetes pods** are ephemeral by design -- local disk is tmpfs

---

## Factor 7: Port Binding — Export Services via Port Binding

### What It Says

The app is **completely self-contained**. It exports HTTP (or other protocols) by binding to
a port. There is no reliance on an external web server being injected (no deploying a WAR
into Tomcat).

### Why It Matters

- The app IS the web server -- no external runtime to configure
- One app can become another app's backing service by pointing to its port
- Container orchestrators manage port mapping naturally

### Violation Example

```xml
<!-- WRONG: app deployed as WAR inside external Tomcat -->
<webapp>
  <context-path>/myapp</context-path>
  <!-- requires pre-installed Tomcat server -->
</webapp>
```

### Correct Example

```python
# RIGHT: app binds to a port directly
from flask import Flask
app = Flask(__name__)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)
```

```dockerfile
FROM python:3.12-slim
COPY . .
RUN pip install -r requirements.txt
EXPOSE 8080
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "app:app"]
```

### How Modern Apps Implement It

- **Embedded servers**: Spring Boot (embedded Tomcat), Go (net/http), Node (Express)
- **Containers** expose ports via `EXPOSE` and Kubernetes `containerPort`
- **Service mesh** sidecars handle TLS and routing, but the app still owns its port

---

## Factor 8: Concurrency — Scale Out via the Process Model

### What It Says

Scale by running **more processes**, not by making one process bigger. Different workload
types (web requests, background jobs, scheduled tasks) run as different **process types**.

### Why It Matters

- Horizontal scaling has no ceiling (add processes across machines)
- Each process type scales independently based on its own bottleneck
- Operating systems already excel at managing multiple processes

### Violation Example

```python
# WRONG: one monolith process handles everything via internal threads
class MonolithApp:
    def handle_web_request(self): ...
    def process_background_job(self): ...  # competes for CPU with web requests
    def run_cron_task(self): ...           # blocks during heavy batch processing
```

### Correct Example

```yaml
# RIGHT: Procfile / Kubernetes defines separate process types
# Procfile
web: gunicorn app:app --workers 4
worker: celery -A tasks worker --concurrency 8
scheduler: celery -A tasks beat

# Each scales independently
# kubectl scale deployment web --replicas=10
# kubectl scale deployment worker --replicas=30
```

```mermaid
graph TB
    LB[Load Balancer] --> W1[Web Process 1]
    LB --> W2[Web Process 2]
    LB --> W3[Web Process 3]
    
    Q[(Message Queue)] --> WK1[Worker Process 1]
    Q --> WK2[Worker Process 2]
    Q --> WK3[Worker Process 3]
    Q --> WK4[Worker Process 4]
    
    CRON[Scheduler] --> WK1
```

### How Modern Apps Implement It

- **Kubernetes HPA** scales each Deployment independently
- **KEDA** scales workers based on queue depth
- **Serverless** (Lambda) takes this to the extreme -- each invocation is a process
- **Microservices** naturally separate process types into different services

---

## Factor 9: Disposability — Fast Startup, Graceful Shutdown

### What It Says

Processes start **fast** and shut down **gracefully**. On SIGTERM, a process should stop
accepting new work, finish in-flight requests, then exit. Processes should be robust against
sudden death (crash-only design).

### Why It Matters

- Fast startup enables rapid scaling and deployment
- Graceful shutdown prevents dropped requests during deploys
- Crash resilience means the system recovers from any failure mode

### Violation Example

```python
# WRONG: 60-second startup loading entire dataset into memory
class App:
    def __init__(self):
        self.model = load_giant_ml_model()  # 45 seconds
        self.cache = preload_entire_database()  # 15 seconds
    # No signal handling -- SIGTERM kills in-flight requests
```

### Correct Example

```python
# RIGHT: fast startup, graceful shutdown
import signal
import sys

app = Flask(__name__)
server = None

def graceful_shutdown(signum, frame):
    print("Received SIGTERM, draining connections...")
    if server:
        server.shutdown()  # stop accepting new requests
    # in-flight requests complete naturally
    sys.exit(0)

signal.signal(signal.SIGTERM, graceful_shutdown)

# Lazy-load heavy resources
_model = None
def get_model():
    global _model
    if _model is None:
        _model = load_model()  # loaded on first request, not startup
    return _model
```

### How Modern Apps Implement It

- **Kubernetes `terminationGracePeriodSeconds`** gives pods time to drain
- **preStop hooks** in pod spec to delay SIGTERM until load balancer updates
- **Health checks** remove pods from service before shutdown
- **Startup probes** prevent traffic until the app is actually ready

---

## Factor 10: Dev/Prod Parity — Keep Environments Similar

### What It Says

Keep development, staging, and production as similar as possible across three gaps:
- **Time gap**: deploy hours after coding, not weeks
- **Personnel gap**: developers who write code also deploy it
- **Tools gap**: use the same backing services in all environments

### Why It Matters

- Bugs caught earlier are cheaper to fix
- "Works in staging" actually means "will work in production"
- Eliminates entire classes of environment-specific bugs

### Violation Example

```
# WRONG: completely different technology stacks per environment
Development:  SQLite,   in-memory cache,  local file storage
Staging:      MySQL,    Memcached,        NFS mount
Production:   Postgres, Redis Cluster,    S3
```

### Correct Example

```yaml
# RIGHT: docker-compose.yml gives developers production-like services
services:
  app:
    build: .
    environment:
      DATABASE_URL: postgres://dev:dev@db:5432/myapp
      REDIS_URL: redis://cache:6379
  db:
    image: postgres:16   # same engine as production
  cache:
    image: redis:7       # same engine as production
  queue:
    image: rabbitmq:3    # same engine as production
```

### How Modern Apps Implement It

- **Docker Compose** replicates production topology locally
- **Testcontainers** spin up real databases in integration tests
- **Infrastructure as Code** ensures staging mirrors production
- **Feature flags** (LaunchDarkly) instead of environment-specific code paths

---

## Factor 11: Logs — Treat as Event Streams

### What It Says

An app should **never** concern itself with routing or storing its log output. It writes
unbuffered to **stdout**. The execution environment captures, collects, and routes logs.

### Why It Matters

- Apps remain simple -- no log rotation, file management, or transport logic
- Centralized logging works across all services uniformly
- Log routing can change without code changes

### Violation Example

```python
# WRONG: app manages its own log files
import logging
handler = logging.FileHandler("/var/log/myapp/app.log")
handler.setLevel(logging.INFO)
# Now you need logrotate, disk monitoring, file permissions...
```

### Correct Example

```python
# RIGHT: log to stdout, let the platform handle it
import logging
import sys

logging.basicConfig(
    stream=sys.stdout,
    level=logging.INFO,
    format='{"time":"%(asctime)s","level":"%(levelname)s","msg":"%(message)s"}'
)
logger = logging.getLogger(__name__)
logger.info("Order processed", extra={"order_id": "12345"})
```

```mermaid
graph LR
    App1[App Pod 1] -->|stdout| Agent1[Fluent Bit]
    App2[App Pod 2] -->|stdout| Agent2[Fluent Bit]
    App3[App Pod 3] -->|stdout| Agent3[Fluent Bit]
    
    Agent1 --> Agg[Log Aggregator]
    Agent2 --> Agg
    Agent3 --> Agg
    
    Agg --> ES[(Elasticsearch)]
    Agg --> S3[(S3 Archive)]
    
    ES --> Kibana[Kibana Dashboard]
```

### How Modern Apps Implement It

- **Structured JSON logging** to stdout for machine parsing
- **Fluent Bit / Fluentd** as DaemonSets on Kubernetes collect container logs
- **ELK Stack** or **Datadog / Grafana Loki** for aggregation and search
- **Correlation IDs** propagated across services for distributed tracing

---

## Factor 12: Admin Processes — Run as One-Off Processes

### What It Says

Administrative tasks (database migrations, REPL sessions, one-time scripts) run as
**one-off processes** in an identical environment to the app's regular long-running processes.
They use the same codebase and config.

### Why It Matters

- Admin tasks run against the correct database with correct credentials
- No environment drift between the admin task and the running app
- Audit trail -- admin processes are versioned and logged

### Violation Example

```bash
# WRONG: SSH into production, run ad-hoc SQL
ssh prod-server
psql -U postgres myapp_db
> UPDATE users SET role='admin' WHERE email='ceo@company.com';
# No audit trail, wrong credentials, ran against wrong DB once...
```

### Correct Example

```yaml
# RIGHT: Kubernetes Job for database migration
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migrate-v42
spec:
  template:
    spec:
      containers:
      - name: migrate
        image: myapp:abc123          # same image as the running app
        command: ["python", "manage.py", "migrate"]
        envFrom:
        - secretRef:
            name: db-credentials     # same config as the running app
      restartPolicy: Never
```

### How Modern Apps Implement It

- **Kubernetes Jobs** for one-off tasks (migrations, data fixes)
- **`kubectl exec`** for rare interactive debugging (not routine admin)
- **CI/CD pipelines** run migrations as a step before deployment
- **Init containers** run migrations before the main app container starts

---

## Beyond 12-Factor: The 15-Factor App

The original 12 factors were published in 2011. Modern cloud-native development has
surfaced three additional critical factors:

### Factor 13: API First

Design the API contract **before** building the implementation. Services communicate through
well-defined, versioned APIs.

```yaml
# OpenAPI spec written before code
openapi: 3.0.0
info:
  title: Order Service
  version: 2.1.0
paths:
  /orders:
    post:
      summary: Create an order
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateOrderRequest'
```

**Why it matters:** Enables parallel development across teams. Frontend and backend teams
work against the contract simultaneously.

### Factor 14: Telemetry

Every application must emit **three pillars of observability**: metrics, logs, and traces.
This is not optional -- it is a first-class requirement.

```python
# Metrics: Prometheus client
from prometheus_client import Counter, Histogram

request_count = Counter("http_requests_total", "Total HTTP requests", ["method", "path", "status"])
request_latency = Histogram("http_request_duration_seconds", "Request latency", ["method", "path"])

# Traces: OpenTelemetry
from opentelemetry import trace
tracer = trace.get_tracer(__name__)

with tracer.start_as_current_span("process-order") as span:
    span.set_attribute("order.id", order_id)
    process(order)
```

### Factor 15: Authentication and Authorization

Security is not an afterthought. Every service must handle **authn/authz** as a core concern,
typically via centralized identity providers and token-based auth.

```python
# JWT validation middleware -- every service enforces auth
from functools import wraps
import jwt

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        payload = jwt.decode(token, os.environ["JWT_PUBLIC_KEY"], algorithms=["RS256"])
        request.user = payload
        return f(*args, **kwargs)
    return decorated
```

---

## How Docker + Kubernetes Enforce 12-Factor Naturally

Containers and Kubernetes are not just compatible with 12-factor -- they **enforce** it by
making violations difficult or impossible.

| Factor | How Docker/K8s Enforces It |
|--------|---------------------------|
| **1. Codebase** | Dockerfile lives in the repo; image tagged by commit SHA |
| **2. Dependencies** | Dockerfile declares every dependency; image is self-contained |
| **3. Config** | K8s ConfigMaps and Secrets inject env vars; code has no config |
| **4. Backing Services** | K8s Services provide DNS names; connection via env vars |
| **5. Build/Release/Run** | Image is the build; Helm release combines image+config; `kubectl` runs it |
| **6. Processes** | Pods are ephemeral by default; no persistent local state |
| **7. Port Binding** | Container `EXPOSE` + K8s `containerPort`; app owns its server |
| **8. Concurrency** | `kubectl scale` adds pods; HPA does it automatically |
| **9. Disposability** | K8s sends SIGTERM + grace period; liveness probes restart unhealthy pods |
| **10. Dev/Prod Parity** | Same Docker image runs everywhere; only config differs |
| **11. Logs** | K8s captures stdout/stderr automatically; `kubectl logs` to view |
| **12. Admin** | `kubectl exec` for debugging; K8s Jobs for migrations |

```mermaid
graph TB
    subgraph "12-Factor Enforcement"
        direction TB
        
        subgraph "Build Time"
            Dockerfile["Dockerfile<br/>(Factors 1,2)"]
            CI["CI Pipeline<br/>(Factor 5 - Build)"]
        end
        
        subgraph "Release Time"
            Helm["Helm Chart<br/>(Factor 5 - Release)"]
            ConfigMap["ConfigMap/Secret<br/>(Factor 3)"]
        end
        
        subgraph "Run Time"
            Pod["Pod<br/>(Factors 6,7,9)"]
            HPA["HPA<br/>(Factor 8)"]
            Service["K8s Service<br/>(Factor 4)"]
            Logs["stdout → Fluent Bit<br/>(Factor 11)"]
            Job["K8s Job<br/>(Factor 12)"]
        end
    end
    
    Dockerfile --> CI
    CI --> Helm
    ConfigMap --> Helm
    Helm --> Pod
    Pod --> HPA
    Pod --> Service
    Pod --> Logs
    Helm --> Job
```

---

## Quick Reference: 12-Factor Checklist

Use this as a code review / architecture review checklist:

```
[ ] 1.  Single Git repo, multiple deploy targets
[ ] 2.  All dependencies in manifest + lock file; no implicit system deps
[ ] 3.  Zero credentials or env-specific config in source code
[ ] 4.  All external services accessed via URL from environment
[ ] 5.  Immutable build artifact promoted across environments
[ ] 6.  No local state: no sticky sessions, no local file uploads
[ ] 7.  App starts its own HTTP server, binds to $PORT
[ ] 8.  Web and worker processes defined and scaled separately
[ ] 9.  Startup < 10s, graceful SIGTERM handling, crash-safe
[ ] 10. Docker Compose replicates prod topology locally
[ ] 11. All logs to stdout in structured JSON format
[ ] 12. Migrations and admin tasks run as K8s Jobs, not SSH scripts
[ ] 13. API contract (OpenAPI/gRPC) defined before implementation
[ ] 14. Metrics, traces, and structured logs emitted by default
[ ] 15. Auth enforced at every service boundary
```

---

## Interview Cheat Sheet

**"Why does 12-factor matter?"**
> It creates applications that are **portable** across cloud providers, **scalable** without
> architecture changes, and **resilient** because every process is disposable. Docker and
> Kubernetes were designed around these principles.

**"Which factor do teams violate most?"**
> Factor 6 (Stateless Processes). Teams store session data, file uploads, or caches on local
> disk. When the pod gets rescheduled, everything is lost. The fix is always the same: move
> state to a backing service.

**"How does 12-factor relate to microservices?"**
> 12-factor is about how a **single service** behaves. Microservices is about how **many
> services** interact. You can build a 12-factor monolith. But microservices that violate
> 12-factor create compounding operational problems.
