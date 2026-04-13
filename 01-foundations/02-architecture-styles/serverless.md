# Serverless / FaaS Architecture

## What Is Serverless?

Serverless is an execution model where the **cloud provider manages the server
infrastructure entirely**. You write functions, upload them, and the provider
handles provisioning, scaling, and billing. You pay only when your code runs.

Two forms of serverless:
- **FaaS (Functions as a Service):** AWS Lambda, Google Cloud Functions, Azure Functions
- **BaaS (Backend as a Service):** Firebase, Auth0, Algolia (managed services replacing custom backend code)

### Core Properties

| Property                 | Detail                                             |
|--------------------------|----------------------------------------------------|
| **No server management**     | Zero provisioning, patching, or capacity planning  |
| **Pay-per-execution**        | Billed per invocation + duration (GB-seconds)      |
| **Auto-scale to zero**       | No traffic = no cost, no running instances          |
| **Auto-scale to infinity**   | 1,000 concurrent requests? Provider handles it      |
| **Stateless by default**     | Each invocation starts fresh (no shared memory)     |
| **Event-driven**             | Functions are triggered by events, not long-running  |
| **Short-lived**              | Execution time limits (AWS Lambda: 15 min max)       |

---

## How It Works: Lifecycle of an Invocation

```
  EVENT TRIGGER           COLD START              EXECUTE              SCALE DOWN
  ─────────────────────────────────────────────────────────────────────────────────

  HTTP Request  ─┐
  S3 Upload     ─┤      ┌─────────────────┐     ┌──────────────┐
  Queue Message ─┼─────>│ Provision        │────>│ Run function │──── Return
  Cron Schedule ─┤      │ container /      │     │ code (your   │    response
  DB Change     ─┘      │ microVM,         │     │ handler)     │
                         │ load code,       │     └──────────────┘
                         │ initialize       │            │
                         │ runtime          │            v
                         └─────────────────┘     ┌──────────────┐
                           (100ms - 10s)         │ If idle for  │
                                                 │ ~5-15 min:   │
                         "WARM" invocations      │ destroy      │
                         reuse the container     │ container    │
                         (no cold start)         └──────────────┘
```

**Cold start:** The time to provision a new execution environment.
- Python/Node.js: ~100-300ms
- Java/.NET: ~1-10 seconds (JVM/CLR startup)
- VPC-attached functions: add ~1-2 seconds (ENI creation)
- Provisioned concurrency can eliminate cold starts (at cost)

---

## Architecture Diagram: Typical Serverless Backend

```
                    ┌──────────────────┐
  Mobile/Web  ─────>│   API Gateway    │
  Clients           │  (AWS API GW /   │
                    │   Cloudflare)    │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              v              v              v
     ┌────────────┐ ┌────────────┐ ┌────────────────┐
     │  Lambda:   │ │  Lambda:   │ │   Lambda:      │
     │  GET /users│ │  POST      │ │   Process      │
     │            │ │  /orders   │ │   Payment      │
     └─────┬──────┘ └─────┬──────┘ └───────┬────────┘
           │              │                │
           v              v                v
     ┌──────────┐  ┌───────────┐    ┌───────────┐
     │ DynamoDB │  │ DynamoDB  │    │  Stripe   │
     │ (users)  │  │ (orders)  │    │  API      │
     └──────────┘  └─────┬─────┘    └───────────┘
                         │
                         v
                  ┌─────────────┐
                  │  SQS Queue  │
                  └──────┬──────┘
                         │
                         v
                  ┌─────────────┐      ┌──────────────┐
                  │  Lambda:    │─────>│    SES       │
                  │  Send Email │      │ (Email Send) │
                  └─────────────┘      └──────────────┘

  ALSO COMMON:
  - S3 upload ──triggers──> Lambda (image resize)
  - CloudWatch Event (cron) ──triggers──> Lambda (daily report)
  - DynamoDB Stream ──triggers──> Lambda (sync to search index)
```

---

## Pros

| Advantage                    | Detail                                          |
|------------------------------|-------------------------------------------------|
| **Zero operational overhead**    | No servers to manage, patch, or monitor         |
| **Auto-scaling**                 | Handles 0 to 10,000 concurrent requests         |
| **Cost at low traffic**          | Idle = $0 (great for MVPs, side projects)       |
| **Rapid development**            | Focus on business logic, not infrastructure     |
| **Built-in high availability**   | Provider runs across multiple AZs automatically |
| **Fine-grained billing**         | Pay for exact compute used (ms granularity)     |
| **Fast iteration**               | Deploy a single function in seconds             |

### Cost Comparison Example

```
  Scenario: API with 1M requests/month, avg 200ms execution, 256MB memory

  AWS Lambda:
    1M requests x $0.20/1M             = $0.20
    1M x 0.2s x 256MB / 1024 x $0.0000166667 = $0.83
    Total: ~$1.03/month

  EC2 t3.micro (always on):
    $0.0104/hr x 730 hrs              = $7.59/month

  At LOW traffic, serverless wins by 7x.
  At HIGH traffic (100M+ requests), EC2 becomes cheaper.
```

---

## Cons

| Disadvantage                  | Detail                                          |
|-------------------------------|-------------------------------------------------|
| **Cold starts**                   | 100ms-10s latency spike on first invocation     |
| **Vendor lock-in**                | AWS Lambda code tightly couples to AWS services |
| **Execution time limits**         | AWS Lambda: 15 min max; not for long tasks      |
| **Stateless constraint**          | No local state between invocations              |
| **Limited compute resources**     | Lambda: max 10GB RAM, 6 vCPUs                  |
| **Debugging difficulty**          | Cannot SSH into a running function              |
| **Testing locally is awkward**    | Need SAM/Serverless Framework to simulate       |
| **Cost at high traffic**          | Per-invocation pricing adds up at massive scale |
| **Concurrency limits**            | Default 1,000 concurrent executions per region  |

---

## Cold Start Deep Dive

```
  Factor               Impact on Cold Start
  ──────────────────────────────────────────────────
  Language Runtime      Node.js/Python: ~100ms
                        Java/C#: ~1-5 seconds
                        Rust/Go: ~10-50ms

  Package Size          < 10MB: minimal impact
                        > 50MB: noticeable delay
                        250MB (with layers): significant

  VPC Attachment        Adds ~1 second (ENI setup)

  Provisioned           Eliminates cold starts
  Concurrency           (but costs money even at zero traffic)
```

**Mitigation strategies:**
1. Use lightweight runtimes (Node.js, Python, Go)
2. Minimize deployment package size
3. Use provisioned concurrency for latency-sensitive paths
4. Keep functions warm with scheduled pings (hack, not recommended)
5. Use SnapStart (Java on Lambda) for JVM snapshot restore

---

## Anti-Patterns: When NOT to Use Serverless

### 1. Long-Running Tasks
```
  BAD:  Video transcoding job (takes 45 minutes)
  WHY:  Lambda max is 15 minutes.
  FIX:  Use AWS Fargate, ECS, or Step Functions to chain.
```

### 2. Stateful Workflows
```
  BAD:  WebSocket server maintaining persistent connections
  WHY:  Functions are stateless, connections drop between invocations.
  FIX:  Use API Gateway WebSocket API or a dedicated server.
```

### 3. Heavy Computation
```
  BAD:  ML model training requiring GPUs for hours
  WHY:  Limited compute, limited time, no GPU support.
  FIX:  Use SageMaker, EC2 GPU instances, or GKE with GPUs.
```

### 4. High-Throughput Steady Traffic
```
  BAD:  100M requests/day at steady rate
  WHY:  Per-invocation cost exceeds reserved EC2 instances.
  FIX:  Use containers (ECS/Kubernetes) for predictable workloads.
```

---

## When to Use Serverless

```
  GREAT FIT:                             POOR FIT:

  [x] Event-driven processing            [ ] Long-running processes (>15 min)
  [x] Variable / spiky traffic            [ ] Steady high-throughput workloads
  [x] API backends (REST/GraphQL)         [ ] Stateful applications
  [x] Scheduled jobs (cron tasks)         [ ] Latency-critical (no cold starts)
  [x] File processing (upload triggers)   [ ] GPU / heavy compute workloads
  [x] MVPs and prototypes                 [ ] Complex local development needs
  [x] Webhooks and integrations           [ ] Vendor independence is critical
  [x] Low-traffic applications
```

---

## The Serverless Ecosystem (AWS)

```
  ┌────────────────────────────────────────────────────┐
  │              SERVERLESS BUILDING BLOCKS             │
  │                                                    │
  │  COMPUTE        STORAGE         MESSAGING          │
  │  ┌──────────┐  ┌──────────┐   ┌──────────────┐    │
  │  │ Lambda   │  │ S3       │   │ SQS          │    │
  │  │ Fargate  │  │ DynamoDB │   │ SNS          │    │
  │  │ Step Fn  │  │ Aurora   │   │ EventBridge  │    │
  │  └──────────┘  │ Serverless│  │ Kinesis      │    │
  │                └──────────┘   └──────────────┘    │
  │                                                    │
  │  API            AUTH           ORCHESTRATION        │
  │  ┌──────────┐  ┌──────────┐   ┌──────────────┐    │
  │  │ API GW   │  │ Cognito  │   │ Step         │    │
  │  │ AppSync  │  │          │   │ Functions    │    │
  │  │ (GraphQL)│  │          │   │              │    │
  │  └──────────┘  └──────────┘   └──────────────┘    │
  └────────────────────────────────────────────────────┘
```

---

## Real-World Examples

### Coca-Cola Vending Machines
- Vending machines send purchase events to AWS Lambda
- Lambda processes transactions, updates inventory, triggers restocking
- Traffic is extremely variable (zero at 3 AM, spikes at lunch)
- Serverless perfect fit: pay nothing during low-traffic hours

### iRobot (Roomba)
- Millions of Roomba vacuums send telemetry data
- Lambda processes events from IoT devices at massive scale
- Traffic spikes when everyone comes home from work (6 PM)
- Handles 0 to millions of events without capacity planning

### Nordstrom
- Rebuilt their event-driven architecture on serverless
- "Hello Retail" reference architecture: fully serverless e-commerce
- Product catalog, user activity, recommendations all on Lambda + DynamoDB

### A]Serverless Framework
- 70%+ of Lambda deployments use Serverless Framework or AWS SAM
- Abstracts CloudFormation, simplifies deployment configuration

---

## Serverless vs. Containers: Decision Guide

```
  Criteria              Serverless         Containers (K8s/ECS)
  ─────────────────────────────────────────────────────────────
  Operational effort    Very low           Medium-high
  Cold starts           Yes (100ms-10s)    No (always running)
  Max execution time    15 minutes         Unlimited
  Scaling speed         Instant (seconds)  Slower (minutes)
  Cost at low traffic   Near zero          Fixed baseline cost
  Cost at high traffic  Can be expensive   More predictable
  Vendor lock-in        High               Lower (K8s portable)
  Debugging             Hard               Easier (SSH, logs)
  State management      External only      In-memory possible
  GPU support           No                 Yes
```

---

## Interview Tips

**Q: "How do you handle cold starts in production?"**
A: (1) Choose lightweight runtimes (Node.js, Go). (2) Minimize package size.
(3) Use provisioned concurrency for user-facing APIs. (4) Architect so that
cold starts happen on non-critical paths (async processing can tolerate them).

**Q: "When does serverless become more expensive than containers?"**
A: Roughly when you have sustained traffic exceeding ~1M invocations/day at
200ms avg duration. At that point, a reserved container running 24/7 is cheaper.
The crossover depends on memory allocation and execution duration.

**Q: "How do you avoid vendor lock-in with serverless?"**
A: (1) Keep business logic in plain functions, isolated from cloud SDK calls.
(2) Use an abstraction layer (hexagonal architecture) around cloud services.
(3) Use Serverless Framework which supports multiple providers.
(4) Accept that some lock-in is the price of reduced operational burden.

**Q: "How do you test serverless applications?"**
A: (1) Unit test business logic as pure functions (no cloud dependencies).
(2) Use LocalStack or SAM CLI for local integration testing.
(3) Deploy to a staging environment for end-to-end tests.
(4) Use contract testing between functions and their event sources.

---

## Key Takeaways

```
  1. Serverless = pay per use + auto scale + zero ops.
  2. Cold starts are the primary technical trade-off.
  3. Best for event-driven, variable traffic, and low-traffic workloads.
  4. NOT for long-running, stateful, or high-throughput steady workloads.
  5. Vendor lock-in is real but manageable with clean architecture.
  6. Cost advantage disappears at high, sustained traffic volumes.
  7. The future is hybrid: serverless for spiky paths, containers for steady.
```
