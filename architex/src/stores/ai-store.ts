// ── AI-008: AI Feature Store ─────────────────────────────────────────
//
// Zustand store managing AI feature state: API key, per-feature
// toggles, cost tracking, and budget management.
//
// Persists API key (obfuscated) and settings to localStorage.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ClaudeClient } from '@/lib/ai/claude-client';
import { AIResponseCache } from '@/lib/ai/indexeddb-cache';

// ── Types ───────────────────────────────────────────────────────────

export type AIFeature = 'hints' | 'review' | 'generation' | 'scoring' | 'topology';

interface FeatureState {
  enabled: boolean;
  callCount: number;
  cost: number;
}

interface AIState {
  // Key management
  apiKey: string | null;
  isConfigured: boolean;

  // Per-feature state
  perFeatureState: Record<AIFeature, FeatureState>;

  // Cost tracking
  totalCost: number;
  budgetLimit: number; // $ max per month

  // Connection test
  connectionStatus: 'untested' | 'testing' | 'connected' | 'failed';

  // Actions
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  setBudgetLimit: (limit: number) => void;
  toggleFeature: (feature: AIFeature) => void;
  recordUsage: (feature: AIFeature, cost: number) => void;
  isBudgetExceeded: () => boolean;
  isFeatureEnabled: (feature: AIFeature) => boolean;
  testConnection: () => Promise<boolean>;
  clearCache: () => Promise<void>;
  resetCosts: () => void;
  setConnectionStatus: (status: AIState['connectionStatus']) => void;
}

// ── Simple key obfuscation (NOT encryption — defense in depth) ──────

function obfuscate(key: string): string {
  return btoa(key.split('').reverse().join(''));
}

function deobfuscate(encoded: string): string {
  try {
    return atob(encoded).split('').reverse().join('');
  } catch {
    return '';
  }
}

// ── Default per-feature state ───────────────────────────────────────

function defaultFeatureState(): Record<AIFeature, FeatureState> {
  return {
    hints: { enabled: true, callCount: 0, cost: 0 },
    review: { enabled: true, callCount: 0, cost: 0 },
    generation: { enabled: true, callCount: 0, cost: 0 },
    scoring: { enabled: true, callCount: 0, cost: 0 },
    topology: { enabled: true, callCount: 0, cost: 0 },
  };
}

// ── Store ───────────────────────────────────────────────────────────

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      apiKey: null,
      isConfigured: false,
      perFeatureState: defaultFeatureState(),
      totalCost: 0,
      budgetLimit: 10,
      connectionStatus: 'untested',

      setApiKey: (key: string) => {
        const client = ClaudeClient.getInstance();
        client.setApiKey(key);
        set({
          apiKey: obfuscate(key),
          isConfigured: true,
          connectionStatus: 'untested',
        });
      },

      clearApiKey: () => {
        const client = ClaudeClient.getInstance();
        client.clearApiKey();
        set({
          apiKey: null,
          isConfigured: false,
          connectionStatus: 'untested',
        });
      },

      setBudgetLimit: (limit: number) => {
        set({ budgetLimit: limit });
      },

      toggleFeature: (feature: AIFeature) => {
        const state = get();
        const current = state.perFeatureState[feature];
        set({
          perFeatureState: {
            ...state.perFeatureState,
            [feature]: { ...current, enabled: !current.enabled },
          },
        });
      },

      recordUsage: (feature: AIFeature, cost: number) => {
        const state = get();
        const current = state.perFeatureState[feature];
        set({
          totalCost: state.totalCost + cost,
          perFeatureState: {
            ...state.perFeatureState,
            [feature]: {
              ...current,
              callCount: current.callCount + 1,
              cost: current.cost + cost,
            },
          },
        });
      },

      isBudgetExceeded: () => {
        const state = get();
        return state.totalCost >= state.budgetLimit;
      },

      isFeatureEnabled: (feature: AIFeature) => {
        const state = get();
        return state.isConfigured && state.perFeatureState[feature].enabled && !state.isBudgetExceeded();
      },

      testConnection: async () => {
        const state = get();
        if (!state.isConfigured || !state.apiKey) return false;

        set({ connectionStatus: 'testing' });

        try {
          const client = ClaudeClient.getInstance();
          // Ensure client has the key from persisted state
          if (!client.isConfigured()) {
            client.setApiKey(deobfuscate(state.apiKey));
          }

          await client.call({
            model: 'claude-haiku-4-5',
            systemPrompt: 'Reply with exactly: ok',
            userMessage: 'ping',
            maxTokens: 5,
          });

          set({ connectionStatus: 'connected' });
          return true;
        } catch {
          set({ connectionStatus: 'failed' });
          return false;
        }
      },

      clearCache: async () => {
        const cache = new AIResponseCache();
        await cache.clear();
      },

      resetCosts: () => {
        const client = ClaudeClient.getInstance();
        client.resetCosts();
        set({
          totalCost: 0,
          perFeatureState: defaultFeatureState(),
        });
      },

      setConnectionStatus: (status) => {
        set({ connectionStatus: status });
      },
    }),
    {
      name: 'architex-ai-settings',
      // Rehydrate: restore the API key to the ClaudeClient on load
      onRehydrateStorage: () => (state) => {
        if (state?.apiKey && state.isConfigured) {
          const key = deobfuscate(state.apiKey);
          if (key) {
            const client = ClaudeClient.getInstance();
            client.setApiKey(key);
          }
        }
      },
    },
  ),
);
