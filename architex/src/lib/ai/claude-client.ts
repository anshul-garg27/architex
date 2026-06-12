// ── AI-001: Claude Client Singleton ──────────────────────────────────
//
// Singleton wrapper around the Anthropic SDK with:
// - Request queuing (max 3 concurrent, exponential backoff on 429)
// - Cost tracking (input/output tokens, per-model pricing)
// - IndexedDB cache integration (check cache before calling API)
// - Graceful degradation when no API key is configured
//
// Runs in both environments:
// - Browser: key set via Settings > AI (ai-store), IndexedDB caching on
// - Server: auto-configured from process.env.ANTHROPIC_API_KEY; the
//   IndexedDB cache is skipped (no `window`). The key never reaches the
//   client — it is read only where `window` is undefined and is not
//   NEXT_PUBLIC-prefixed, so Next.js never inlines it into bundles.

import Anthropic from '@anthropic-ai/sdk';
import { AIResponseCache } from './indexeddb-cache';

// ── Types ───────────────────────────────────────────────────────────

export type ClaudeModel = 'claude-haiku-4-5' | 'claude-sonnet-4-20250514';

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeRequest {
  model: ClaudeModel;
  systemPrompt: string;
  userMessage: string;
  maxTokens: number;
  cacheKey?: string;
  cacheTtlMs?: number;
}

export interface ClaudeMessagesRequest {
  model: ClaudeModel;
  systemPrompt: string;
  messages: ClaudeMessage[];
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

  constructor() {
    // Server-side: auto-configure from the environment so API routes get
    // a real client. Browser bundles never see this key — the branch only
    // runs where `window` is undefined, and ANTHROPIC_API_KEY is not
    // NEXT_PUBLIC-prefixed so Next.js never inlines it client-side.
    if (typeof window === 'undefined' && process.env.ANTHROPIC_API_KEY) {
      this.apiKey = process.env.ANTHROPIC_API_KEY;
      this.client = new Anthropic({ apiKey: this.apiKey });
    }
  }

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
   * Send a single-turn request to Claude. Checks IndexedDB cache first,
   * then queues the API call with concurrency limiting and retry logic.
   *
   * Throws if no API key is configured.
   */
  async call(request: ClaudeRequest): Promise<ClaudeResponse> {
    return this.callWithMessages({
      model: request.model,
      systemPrompt: request.systemPrompt,
      messages: [{ role: 'user', content: request.userMessage }],
      maxTokens: request.maxTokens,
      cacheKey: request.cacheKey,
      cacheTtlMs: request.cacheTtlMs,
    });
  }

  /**
   * Send a multi-turn conversation (full messages array + system prompt)
   * to Claude. Same cache/queue/retry semantics as `call()`.
   */
  async callWithMessages(
    request: ClaudeMessagesRequest,
  ): Promise<ClaudeResponse> {
    // 1. Check cache (browser only — IndexedDB does not exist server-side)
    if (request.cacheKey && this.canUseCache()) {
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
    if (request.cacheKey && this.canUseCache()) {
      const ttl = request.cacheTtlMs ?? 3_600_000; // 1 hour default
      await this.cache.set(request.cacheKey, response, ttl);
    }

    return response;
  }

  // ── Internal ─────────────────────────────────────────────────

  /** The IndexedDB cache is a browser-only path — no-op on the server. */
  private canUseCache(): boolean {
    return typeof window !== 'undefined';
  }

  private async executeWithRetry(
    request: ClaudeMessagesRequest,
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

  private async executeApiCall(
    request: ClaudeMessagesRequest,
  ): Promise<ClaudeResponse> {
    const client = this.client!;

    const message = await client.messages.create({
      model: request.model,
      max_tokens: request.maxTokens,
      system: request.systemPrompt,
      messages: request.messages,
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
