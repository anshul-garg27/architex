/**
 * Queuing Theory Models for Realistic Simulation
 *
 * Implements standard queuing theory (M/M/1, M/M/c, Little's Law) used to
 * model request processing through system components. These formulas predict
 * queue lengths, wait times, and utilization based on arrival rates and
 * service rates.
 *
 * Terminology:
 *   lambda (arrival rate) — average requests arriving per unit time
 *   mu     (service rate) — average requests one server can process per unit time
 *   rho    (utilization)  — fraction of time the server is busy = lambda / mu
 *   c      — number of parallel servers (M/M/c)
 *
 * All time values are in MILLISECONDS unless otherwise noted.
 */

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

/** Simulation output for a single queuing node. */
export interface NodeSimulationResult {
  /** Server utilization, 0..1 (fraction of capacity used). */
  utilization: number;
  /** Average number of requests waiting in the queue (not being served). */
  avgQueueLength: number;
  /** Average time a request spends waiting before service begins (ms). */
  avgWaitTime: number;
  /** Average total time in the system: wait + service (ms). */
  avgSystemTime: number;
  /** Estimated p95 latency (ms), derived from the exponential distribution. */
  p95Latency: number;
  /** Estimated p99 latency (ms), derived from the exponential distribution. */
  p99Latency: number;
}

// ---------------------------------------------------------------------------
// M/M/1 Queue — single server, Poisson arrivals, exponential service
// ---------------------------------------------------------------------------

/**
 * Server utilization for an M/M/1 queue.
 *
 * rho = lambda / mu
 *
 * @param lambda - Arrival rate (requests per ms)
 * @param mu     - Service rate of one server (requests per ms)
 * @returns Utilization factor (0..1). Values >= 1 mean the queue is unstable.
 */
export function mm1Utilization(lambda: number, mu: number): number {
  if (mu <= 0) throw new RangeError('Service rate mu must be positive');
  return lambda / mu;
}

/**
 * Average number of requests waiting in the queue (not including the one in service)
 * for an M/M/1 queue.
 *
 * Lq = rho^2 / (1 - rho)
 *
 * @param lambda - Arrival rate (requests per ms)
 * @param mu     - Service rate (requests per ms)
 * @returns Average queue length. Returns Infinity when rho >= 1 (unstable).
 */
export function mm1AvgQueueLength(lambda: number, mu: number): number {
  const rho = mm1Utilization(lambda, mu);
  if (rho >= 1) return Infinity;
  return (rho * rho) / (1 - rho);
}

/**
 * Average time a request waits in the queue before service begins (M/M/1).
 *
 * Wq = rho / (mu - lambda)
 *
 * @param lambda - Arrival rate (requests per ms)
 * @param mu     - Service rate (requests per ms)
 * @returns Average wait time in ms. Returns Infinity when rho >= 1.
 */
export function mm1AvgWaitTime(lambda: number, mu: number): number {
  const rho = mm1Utilization(lambda, mu);
  if (rho >= 1) return Infinity;
  return rho / (mu - lambda);
}

/**
 * Average total time a request spends in the system: waiting + being served (M/M/1).
 *
 * W = 1 / (mu - lambda)
 *
 * @param lambda - Arrival rate (requests per ms)
 * @param mu     - Service rate (requests per ms)
 * @returns Average system time in ms. Returns Infinity when rho >= 1.
 */
export function mm1AvgSystemTime(lambda: number, mu: number): number {
  if (lambda >= mu) return Infinity;
  return 1 / (mu - lambda);
}

// ---------------------------------------------------------------------------
// M/M/c Queue — multiple identical servers (Erlang-C)
// ---------------------------------------------------------------------------

/**
 * Compute the factorial of n. For small n used in Erlang-C calculations.
 * Uses iterative approach to avoid stack overflow.
 */
function factorial(n: number): number {
  if (n < 0) throw new RangeError('Factorial undefined for negative numbers');
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

/**
 * Erlang-C formula: probability that an arriving request must wait (all c servers busy).
 *
 * P_wait = [ (c*rho)^c / c! * 1/(1-rho) ] / [ sum_{k=0}^{c-1} (c*rho)^k / k! + (c*rho)^c / c! * 1/(1-rho) ]
 *
 * where rho = lambda / (c * mu) is the per-server utilization.
 *
 * @param c   - Number of parallel servers (positive integer)
 * @param rho - Per-server utilization lambda/(c*mu). Must be < 1 for stability.
 * @returns Probability [0..1] that an arriving customer must wait.
 */
export function erlangC(c: number, rho: number): number {
  if (c < 1) throw new RangeError('Server count c must be >= 1');
  if (rho >= 1) return 1; // unstable: all arrivals queue
  if (rho <= 0) return 0; // no traffic

  // Guard: factorial overflows for c > 20; return Infinity to signal instability
  if (c > 20) return Infinity;

  const a = c * rho; // total offered load (Erlang)

  // Numerator: (a^c / c!) * (1 / (1 - rho))
  const numerator = (Math.pow(a, c) / factorial(c)) * (1 / (1 - rho));

  // Denominator: sum of (a^k / k!) for k=0..c-1, plus the numerator term
  let sumTerms = 0;
  for (let k = 0; k < c; k++) {
    sumTerms += Math.pow(a, k) / factorial(k);
  }

  return numerator / (sumTerms + numerator);
}

/**
 * Average number of requests waiting in queue for an M/M/c system.
 *
 * Lq = P_wait * rho / (1 - rho)
 *
 * @param lambda - Arrival rate (requests per ms)
 * @param mu     - Service rate per server (requests per ms)
 * @param c      - Number of servers
 * @returns Average queue length.
 */
export function mmcAvgQueueLength(
  lambda: number,
  mu: number,
  c: number,
): number {
  const rho = lambda / (c * mu);
  if (rho >= 1) return Infinity;
  const pWait = erlangC(c, rho);
  return (pWait * rho) / (1 - rho);
}

/**
 * Average time a request waits in queue for an M/M/c system.
 *
 * Wq = Lq / lambda  (by Little's Law applied to the queue)
 *    = P_wait / (c * mu - lambda)
 *
 * @param lambda - Arrival rate (requests per ms)
 * @param mu     - Service rate per server (requests per ms)
 * @param c      - Number of servers
 * @returns Average wait time in ms.
 */
export function mmcAvgWaitTime(
  lambda: number,
  mu: number,
  c: number,
): number {
  const rho = lambda / (c * mu);
  if (rho >= 1) return Infinity;
  const pWait = erlangC(c, rho);
  return pWait / (c * mu - lambda);
}

/**
 * Average total time in the M/M/c system (wait + service).
 *
 * W = Wq + 1/mu
 *
 * @param lambda - Arrival rate (requests per ms)
 * @param mu     - Service rate per server (requests per ms)
 * @param c      - Number of servers
 * @returns Average system time in ms.
 */
export function mmcAvgSystemTime(
  lambda: number,
  mu: number,
  c: number,
): number {
  return mmcAvgWaitTime(lambda, mu, c) + 1 / mu;
}

// ---------------------------------------------------------------------------
// Little's Law
// ---------------------------------------------------------------------------

/**
 * Little's Law: L = lambda * W
 *
 * Relates the average number of items in a system (L) to the arrival rate (lambda)
 * and the average time each item spends in the system (W). This law holds for any
 * stable queuing system regardless of distribution.
 *
 * @param lambda - Average arrival rate (items per time unit)
 * @param W      - Average time an item spends in the system (same time unit)
 * @returns L, the average number of items in the system.
 */
export function littlesLaw(lambda: number, W: number): number {
  return lambda * W;
}

/**
 * Inverse Little's Law: W = L / lambda
 *
 * Given the average number of items in a system and the arrival rate,
 * computes the average time each item spends in the system.
 *
 * @param L      - Average number of items in the system
 * @param lambda - Average arrival rate
 * @returns W, the average time in the system.
 */
export function littlesLawTime(L: number, lambda: number): number {
  if (lambda <= 0) throw new RangeError('Arrival rate must be positive');
  return L / lambda;
}

// ---------------------------------------------------------------------------
// Percentile estimation
// ---------------------------------------------------------------------------

/**
 * Estimate a latency percentile for an M/M/1 or M/M/c queue.
 *
 * For an M/M/1 queue, the system time follows an exponential distribution
 * with rate (mu - lambda). The p-th percentile of Exp(rate) is:
 *
 *   t_p = -ln(1 - p) / rate
 *
 * For M/M/c, we approximate using the effective service rate seen by a
 * request: the average system time W gives rate = 1/W, then apply the
 * same exponential percentile formula.
 *
 * @param avgSystemTime - Average time in system (ms)
 * @param percentile    - Desired percentile, e.g. 0.95 or 0.99
 * @returns Estimated latency at that percentile in ms.
 */
export function estimatePercentile(
  avgSystemTime: number,
  percentile: number,
): number {
  if (percentile <= 0 || percentile >= 1) {
    throw new RangeError('Percentile must be between 0 and 1 (exclusive)');
  }
  if (!isFinite(avgSystemTime) || avgSystemTime <= 0) return Infinity;
  // Exponential CDF: P(T <= t) = 1 - e^(-t/W)
  // Solving for t: t = -W * ln(1 - p)
  return -avgSystemTime * Math.log(1 - percentile);
}

// ---------------------------------------------------------------------------
// Unified node simulation helper
// ---------------------------------------------------------------------------

/**
 * Simulate a single queuing node and return key performance metrics.
 *
 * Selects M/M/1 or M/M/c model based on serverCount, computes utilization,
 * queue lengths, wait times, and latency percentiles.
 *
 * @param arrivalRate  - Requests arriving per millisecond (lambda)
 * @param serviceRate  - Requests one server handles per millisecond (mu)
 * @param serverCount  - Number of parallel servers (c). Defaults to 1.
 * @returns Full simulation result with utilization, queue metrics, and percentiles.
 *
 * @example
 *   // 50 req/ms arriving, each server handles 20 req/ms, 4 servers
 *   const result = simulateNode(50, 20, 4);
 *   // result.utilization ~= 0.625
 */
export function simulateNode(
  arrivalRate: number,
  serviceRate: number,
  serverCount: number = 1,
): NodeSimulationResult {
  if (arrivalRate < 0) throw new RangeError('Arrival rate must be non-negative');
  if (serviceRate <= 0) throw new RangeError('Service rate must be positive');
  if (serverCount < 1) throw new RangeError('Server count must be >= 1');

  // Edge case: no traffic
  if (arrivalRate === 0) {
    return {
      utilization: 0,
      avgQueueLength: 0,
      avgWaitTime: 0,
      avgSystemTime: 1 / serviceRate,
      p95Latency: 0,
      p99Latency: 0,
    };
  }

  const c = Math.floor(serverCount);

  if (c === 1) {
    // M/M/1
    const utilization = Math.min(mm1Utilization(arrivalRate, serviceRate), 1);
    const rho = arrivalRate / serviceRate;

    if (rho >= 1) {
      return {
        utilization: 1,
        avgQueueLength: Infinity,
        avgWaitTime: Infinity,
        avgSystemTime: Infinity,
        p95Latency: Infinity,
        p99Latency: Infinity,
      };
    }

    const avgQueueLen = mm1AvgQueueLength(arrivalRate, serviceRate);
    const avgWait = mm1AvgWaitTime(arrivalRate, serviceRate);
    const avgSys = mm1AvgSystemTime(arrivalRate, serviceRate);

    return {
      utilization,
      avgQueueLength: avgQueueLen,
      avgWaitTime: avgWait,
      avgSystemTime: avgSys,
      p95Latency: estimatePercentile(avgSys, 0.95),
      p99Latency: estimatePercentile(avgSys, 0.99),
    };
  }

  // M/M/c
  const rho = arrivalRate / (c * serviceRate);
  const utilization = Math.min(rho, 1);

  if (rho >= 1) {
    return {
      utilization: 1,
      avgQueueLength: Infinity,
      avgWaitTime: Infinity,
      avgSystemTime: Infinity,
      p95Latency: Infinity,
      p99Latency: Infinity,
    };
  }

  const avgQueueLen = mmcAvgQueueLength(arrivalRate, serviceRate, c);
  const avgWait = mmcAvgWaitTime(arrivalRate, serviceRate, c);
  const avgSys = mmcAvgSystemTime(arrivalRate, serviceRate, c);

  return {
    utilization,
    avgQueueLength: avgQueueLen,
    avgWaitTime: avgWait,
    avgSystemTime: avgSys,
    p95Latency: estimatePercentile(avgSys, 0.95),
    p99Latency: estimatePercentile(avgSys, 0.99),
  };
}
