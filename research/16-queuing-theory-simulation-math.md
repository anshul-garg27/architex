# Queuing Theory & Simulation Math

> The mathematical foundations that make a system design simulator REALISTIC, not toy-like.

---

## 1. QUEUING THEORY — The Heart of the Simulator

Every component (load balancer, server, database, cache, queue) is fundamentally a queue.

### 1.1 Kendall's Notation: A/S/c/K/N/D
- **A** = Arrival process (M=Poisson, D=Deterministic, G=General)
- **S** = Service time distribution
- **c** = Number of servers
- **K** = System capacity (omitted=infinite)

### 1.2 M/M/1 Queue (Single Server)

```
λ = arrival rate (req/s)
μ = service rate (req/s)
ρ = λ / μ  (utilization, MUST be < 1)

Avg queue length:      Lq = ρ² / (1 - ρ)
Avg number in system:  L  = ρ / (1 - ρ)
Avg wait in queue:     Wq = ρ / (μ × (1 - ρ))
Avg response time:     W  = 1 / (μ - λ) = (1/μ) / (1 - ρ)
```

### THE HOCKEY STICK CURVE (most important visualization):

```
Response Time = service_time / (1 - utilization)

ρ = 0.5:   W = 2× baseline
ρ = 0.7:   W = 3.3× baseline     (starting to hurt)
ρ = 0.8:   W = 5× baseline       (CRITICAL THRESHOLD)
ρ = 0.9:   W = 10× baseline      (system in trouble)
ρ = 0.95:  W = 20× baseline      (collapsing)
ρ = 0.99:  W = 100× baseline     (effectively down)
```

**Realistic operating range: 60-70% utilization.** Past 80%, queues grow faster than intuition suggests.

### 1.3 M/M/c Queue (Multi-Server — server pool behind load balancer)

```
ρ = λ / (c × μ)   (per-server utilization)
r = λ / μ          (offered load in Erlangs)

Erlang-C (prob of waiting):
  C(c,r) = [r^c / (c! × (1-ρ))] × P₀

Avg wait: Wq = C(c,r) / (c × μ × (1-ρ))
Avg response: W = Wq + 1/μ
```

### 1.4 M/G/1 Queue (General Service Times — more realistic)

Pollaczek-Khinchine Formula:
```
Lq = (ρ² × (1 + Cs²)) / (2 × (1 - ρ))

Cs = coefficient of variation = σ_s / mean_service_time
```
When Cs=1 (exponential) → M/M/1. When Cs=0 (deterministic) → queue length halved.

### 1.5 Little's Law (Universal, distribution-free)

```
L = λ × W

L = avg items in system
λ = throughput (req/s)  
W = avg time in system
```

Use to: validate simulator outputs, model connection pools (`pool_size = throughput × avg_response`), model queue depth.

---

## 2. PERFORMANCE & SCALABILITY MODELING

### 2.1 Amdahl's Law

```
Speedup(N) = 1 / (σ + (1-σ)/N)

σ = serial fraction (0 to 1)
Max speedup = 1/σ  (regardless of how many servers)
```

If 5% is serial → max 20× speedup no matter how many servers.

### 2.2 Universal Scalability Law (USL) — Neil Gunther

The GOLD STANDARD for realistic scalability modeling:

```
C(N) = N / (1 + σ(N-1) + κ×N×(N-1))

σ = contention (serial fraction, queueing)
κ = coherency (cost of maintaining consistency)
```

Three regimes:
- κ=0, σ=0: Linear scaling (ideal)
- κ=0, σ>0: Amdahl's Law (asymptotic ceiling)  
- κ>0: **RETROGRADE SCALING** — throughput DECREASES past peak

Peak concurrency: `N_max = √((1-σ)/κ)` — beyond this, adding servers makes it SLOWER.

**Typical parameters:**
- Web server cluster: σ~0.02, κ~0.0005
- Database cluster: σ~0.10, κ~0.005
- Strongly consistent system: σ~0.20, κ~0.03

---

## 3. LATENCY DISTRIBUTION MODELING

### 3.1 Real latencies follow LOG-NORMAL distributions (not normal)

```
latency = exp(μ + σ × normal_random())
```

Why: latency is the product of multiplicative factors (network hops, queue waits, GC pauses).

### 3.2 Multimodal (more realistic)

Cache hit (90%): LogNormal(mean=5ms, σ=2ms)
Cache miss (10%): LogNormal(mean=50ms, σ=20ms)

### 3.3 Tail Latency Amplification (Fan-Out)

```
P(any exceeds p99) = 1 - 0.99^N

N=1:   1%
N=10:  9.6%
N=50:  39.5%
N=100: 63.4%
```

A single service's p99 of 50ms becomes effectively p50 when fanning out to 100 services. **The simulator MUST model this.**

---

## 4. FAILURE & CHAOS MODELING

### 4.1 Cascading Failure Model

```
States: HEALTHY → DEGRADED → OVERWHELMED → FAILED

When service FAILS:
  load redistributes to remaining services
  new_load = old_load + failed_load / N_remaining
  Check if any service now exceeds threshold → CASCADE
```

### 4.2 Circuit Breaker Parameters

```
CLOSED → OPEN:    failure_rate > 50% in sliding window of 10 calls
OPEN → HALF-OPEN: after 30s timeout
HALF-OPEN → CLOSED: 3 successful probes
HALF-OPEN → OPEN:   any probe fails (reset timer)
```

### 4.3 Retry Storm Formula

```
Without jitter:  load spike = N × R  (at discrete intervals)
With full jitter: peak ~ N × R / window_size

Retry budget: max_retries/s = capacity × 0.10 (10% budget)
```

### 4.4 Exponential Backoff with Jitter

```
Full jitter (AWS recommended):     delay = random(0, base × 2^attempt)
Equal jitter:                       delay = temp/2 + random(0, temp/2)
Decorrelated jitter (best):         delay = min(max, random(base, prev × 3))
```

---

## 5. CAPACITY PLANNING FORMULAS

```
Servers needed = peak_QPS / QPS_per_server
Storage/year = write_QPS × avg_record_size × 86400 × 365
Bandwidth = QPS × avg_payload_size
Cache size = daily_active_data × 0.20 (80/20 rule)
```

### Erlang-C for Capacity

Given arrival rate, service rate, and target SLA → find minimum servers needed.

---

## 6. WHAT MAKES SIMULATION REALISTIC vs TOY

| Aspect | Toy | Realistic |
|--------|-----|-----------|
| Latency | Fixed 50ms | LogNormal with multimodal |
| Throughput vs latency | Independent | Coupled via hockey stick |
| Scaling | Linear | USL with retrograde region |
| Failures | Binary on/off | Gray failures, cascading |
| Recovery | Instant | Thundering herd, retry storms |
| Load distribution | Uniform | Zipf/power-law (hot keys) |
| Cache | Fixed hit rate | Working set dependent |

### Every Simulated Component Needs:

```
capacity:        max req/s (μ × c)
current_load:    req/s being processed
utilization:     current_load / capacity (ρ)
queue_depth:     items waiting
service_time:    LogNormal(μ_s, σ_s)
failure_prob:    1 - exp(-dt / MTTF)
circuit_breaker: {state, failure_count, thresholds}
health:          HEALTHY | DEGRADED | OVERWHELMED | FAILED
```
