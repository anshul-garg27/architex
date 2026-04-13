// ── AI-001: Claude Client Singleton ──────────────────────────────────
//
// Singleton wrapper around the Anthropic SDK with:
// - Request queuing (max 3 concurrent, exponential backoff on 429)
// - Cost tracking (input/output tokens, per-model pricing)
// - IndexedDB cache integration (check cache before calling API)
// - Graceful degradation when no API key is configured

import Anthropic from '@anthropic-ai/sdk';
import { AIResponseCache } from './indexeddb-cache';

// ── Types ───────────────────────────────────────────────────────────

export type ClaudeModel = 'claude-haiku-4-5' | 'claude-sonnet-4-20250514';

export interface ClaudeRequest {
  model: ClaudeModel;
  systemPrompt: string;
  userMessage: string;
  maxTokens: number;
  cacheKey?: string;
  cacheTtlMs?: number;
}

export interface ClaudeResponse {
  text: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  cached: boolean;
}

interface CostSnapshot {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  requestCount: number;
}

// ── Pricing (per 1M tokens) ─────────────────────────────────────────

const MODEL_PRICING: Record<ClaudeModel, { inputPerMillion: number; outputPerMillion: number }> = {
  'claude-haiku-4-5':        { inputPerMillion: 0.80,  outputPerMillion: 4.00 },
  'claude-sonnet-4-20250514': { inputPerMillion: 3.00, outputPerMillion: 15.00 },
};

function computeCost(model: ClaudeModel, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model];
  return (inputTokens / 1_000_000) * pricing.inputPerMillion +
         (outputTokens / 1_000_000) * pricing.outputPerMillion;
}

// ── Queue implementation ─────────────────────────────────────────────

interface QueueItem {
  execute: () => Promise<void>;
}

class ConcurrencyQueue {
  private readonly maxConcurrent: number;
  private running = 0;
  private queue: QueueItem[] = [];

  constructor(maxConcurrent: number) {
    this.maxConcurrent = maxConcurrent;
  }

  enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const execute = async () => {
        this.running++;
        try {
          const result = await fn();
          resolve(result);
        } catch (err) {
          reject(err);
        } finally {
          this.running--;
          this.processNext();
        }
      };

      if (this.running < this.maxConcurrent) {
        execute();
      } else {
        this.queue.push({ execute });
      }
    });
  }

  private processNext(): void {
    if (this.queue.length > 0 && this.running < this.maxConcurrent) {
      const next = this.queue.shift();
      next?.execute();
    }
  }
}

// ── ClaudeClient ────────────────────────────────────────────────────

const MAX_CONCURRENT = 3;
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 1000;

export class ClaudeClient {
  private static instance: ClaudeClient;

  private apiKey: string | null = null;
  private client: Anthropic | null = null;
  private readonly requestQueue = new ConcurrencyQueue(MAX_CONCURRENT);
  private readonly cache = new AIResponseCache();
  private readonly costTracker: CostSnapshot = {
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCost: 0,
    requestCount: 0,
  };

  // Singleton access
  static getInstance(): ClaudeClient {
    if (!ClaudeClient.instance) {
      ClaudeClient.instance = new ClaudeClient();
    }
    return ClaudeClient.instance;
  }

  // ── Configuration ────────────────────────────────────────────

  /** Returns true when an API key has been set. */
  isConfigured(): boolean {
    return this.apiKey !== null && this.apiKey.length > 0;
  }

  /** Set (or update) the API key. Creates a new Anthropic client instance. */
  setApiKey(key: string): void {
    this.apiKey = key;
    this.client = new Anthropic({
      apiKey: key,
      dangerouslyAllowBrowser: true,
    });
  }

  /** Clear the API key and destroy the client. */
  clearApiKey(): void {
    this.apiKey = null;
    this.client = null;
  }

  // ── Cost tracking ────────────────────────────────────────────

  getCostSnapshot(): Readonly<CostSnapshot> {
    return { ...this.costTracker };
  }

  resetCosts(): void {
    this.costTracker.totalInputTokens = 0;
    this.costTracker.totalOutputTokens = 0;
    this.costTracker.totalCost = 0;
    this.costTracker.requestCount = 0;
  }

  // ── Cache access ─────────────────────────────────────────────

  getCache(): AIResponseCache {
    return this.cache;
  }

  // ── Main call method ─────────────────────────────────────────

  /**
   * Send a request to Claude. Checks IndexedDB cache first, then
   * queues the API call with concurrency limiting and retry logic.
   *
   * Throws if no API key is configured.
   */
  async call(request: ClaudeRequest): Promise<ClaudeResponse> {
    // 1. Check cache
    if (request.cacheKey) {
      const cached = await this.cache.get<ClaudeResponse>(request.cacheKey);
      if (cached) {
        return { ...cached, cached: true };
      }
    }

    // 2. Ensure API is configured
    if (!this.isConfigured() || !this.client) {
      throw new Error(
        'Claude API key not configured. Set it in Settings > AI to enable AI features.',
      );
    }

    // 3. Enqueue the request with retry logic
    const response = await this.requestQueue.enqueue(() =>
      this.executeWithRetry(request),
    );

    // 4. Cache the response
    if (request.cacheKey) {
      const ttl = request.cacheTtlMs ?? 3_600_000; // 1 hour default
      await this.cache.set(request.cacheKey, response, ttl);
    }

    return response;
  }

  // ── Internal ─────────────────────────────────────────────────

  private async executeWithRetry(
    request: ClaudeRequest,
    attempt = 0,
  ): Promise<ClaudeResponse> {
    try {
      return await this.executeApiCall(request);
    } catch (error: unknown) {
      const isRateLimit =
        error instanceof Anthropic.RateLimitError ||
        (error instanceof Anthropic.APIError && error.status === 429);

      if (isRateLimit && attempt < MAX_RETRIES) {
        const delay = BASE_BACKOFF_MS * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.executeWithRetry(request, attempt + 1);
      }

      throw error;
    }
  }

  private async executeApiCall(request: ClaudeRequest): Promise<ClaudeResponse> {
    const client = this.client!;

    const message = await client.messages.create({
      model: request.model,
      max_tokens: request.maxTokens,
      system: request.systemPrompt,
      messages: [{ role: 'user', content: request.userMessage }],
    });

    // Extract text from the response
    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    const inputTokens = message.usage.input_tokens;
    const outputTokens = message.usage.output_tokens;
    const cost = computeCost(request.model, inputTokens, outputTokens);

    // Track costs
    this.costTracker.totalInputTokens += inputTokens;
    this.costTracker.totalOutputTokens += outputTokens;
    this.costTracker.totalCost += cost;
    this.costTracker.requestCount++;

    return {
      text,
      inputTokens,
      outputTokens,
      cost,
      cached: false,
    };
  }
}
