'use client';

// ── AI-008: AI Settings Section ──────────────────────────────────────
//
// Standalone settings panel for AI configuration. Includes:
// - API key input with show/hide toggle
// - Connection test button
// - Per-feature toggles (hints, review, generation, scoring, topology)
// - Cost display with budget slider
// - Clear cache button

import { useState, useCallback } from 'react';
import { useAIStore } from '@/stores/ai-store';
import type { AIFeature } from '@/stores/ai-store';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ── Feature labels ──────────────────────────────────────────────────

const FEATURE_LABELS: Record<AIFeature, { label: string; description: string }> = {
  hints: { label: 'AI Hints', description: 'Context-aware hints using Claude' },
  review: { label: 'Design Review', description: 'AI-powered architectural analysis' },
  generation: { label: 'Architecture Generation', description: 'Generate designs from descriptions' },
  scoring: { label: 'Interview Scoring', description: '8-dimension AI scoring' },
  topology: { label: 'Topology Rules', description: 'AI-generated simulation rules' },
};

const ALL_FEATURES: AIFeature[] = ['hints', 'review', 'generation', 'scoring', 'topology'];

// ── Component ───────────────────────────────────────────────────────

export function AISettingsSection() {
  const isConfigured = useAIStore((s) => s.isConfigured);
  const totalCost = useAIStore((s) => s.totalCost);
  const budgetLimit = useAIStore((s) => s.budgetLimit);
  const connectionStatus = useAIStore((s) => s.connectionStatus);
  const perFeatureState = useAIStore((s) => s.perFeatureState);

  const setApiKey = useAIStore((s) => s.setApiKey);
  const clearApiKey = useAIStore((s) => s.clearApiKey);
  const setBudgetLimit = useAIStore((s) => s.setBudgetLimit);
  const toggleFeature = useAIStore((s) => s.toggleFeature);
  const testConnection = useAIStore((s) => s.testConnection);
  const clearCache = useAIStore((s) => s.clearCache);
  const resetCosts = useAIStore((s) => s.resetCosts);

  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleSaveKey = useCallback(() => {
    if (keyInput.trim()) {
      setApiKey(keyInput.trim());
      setKeyInput('');
    }
  }, [keyInput, setApiKey]);

  const handleClearCache = useCallback(async () => {
    setClearing(true);
    await clearCache();
    setClearing(false);
  }, [clearCache]);

  const budgetPercent = budgetLimit > 0 ? Math.min(100, (totalCost / budgetLimit) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">AI Integration</h3>
        <p className="text-sm text-muted-foreground">
          Connect your Anthropic API key to enable AI-powered features.
        </p>
      </div>

      {/* API Key Input */}
      <div className="space-y-3">
        <Label htmlFor="ai-api-key">API Key</Label>
        {isConfigured ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
              sk-ant-***configured***
            </div>
            <Button variant="outline" size="sm" onClick={clearApiKey}>
              Remove
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Input
              id="ai-api-key"
              type={showKey ? 'text' : 'password'}
              placeholder="sk-ant-..."
              value={keyInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKeyInput(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSaveKey()}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowKey((v) => !v)}
              aria-label={showKey ? 'Hide key' : 'Show key'}
            >
              {showKey ? 'Hide' : 'Show'}
            </Button>
            <Button size="sm" onClick={handleSaveKey} disabled={!keyInput.trim()}>
              Save
            </Button>
          </div>
        )}
      </div>

      {/* Connection Test */}
      {isConfigured && (
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => void testConnection()}>
            Test Connection
          </Button>
          <span className="text-sm">
            {connectionStatus === 'connected' && (
              <span className="text-green-500">Connected</span>
            )}
            {connectionStatus === 'failed' && (
              <span className="text-red-500">Failed</span>
            )}
            {connectionStatus === 'testing' && (
              <span className="text-muted-foreground">Testing...</span>
            )}
            {connectionStatus === 'untested' && (
              <span className="text-muted-foreground">Not tested</span>
            )}
          </span>
        </div>
      )}

      {/* Per-Feature Toggles */}
      <div className="space-y-3">
        <Label>Feature Toggles</Label>
        <div className="space-y-2">
          {ALL_FEATURES.map((feature) => {
            const info = FEATURE_LABELS[feature];
            const state = perFeatureState[feature];
            return (
              <div key={feature} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">{info.label}</p>
                  <p className="text-xs text-muted-foreground">{info.description}</p>
                  {state.callCount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {state.callCount} calls | ${state.cost.toFixed(4)}
                    </p>
                  )}
                </div>
                <Switch
                  checked={state.enabled}
                  onCheckedChange={() => toggleFeature(feature)}
                  disabled={!isConfigured}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Cost & Budget */}
      <div className="space-y-3">
        <Label>Budget</Label>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Total spent: ${totalCost.toFixed(4)}</span>
            <span>Limit: ${budgetLimit.toFixed(2)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${budgetPercent}%`,
                backgroundColor:
                  budgetPercent >= 90
                    ? 'var(--destructive, #ef4444)'
                    : budgetPercent >= 75
                      ? 'var(--warning, #f59e0b)'
                      : 'var(--primary, #6366f1)',
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="budget-slider" className="shrink-0 text-xs">
              Monthly limit ($)
            </Label>
            <input
              id="budget-slider"
              type="range"
              min={1}
              max={100}
              step={1}
              value={budgetLimit}
              onChange={(e) => setBudgetLimit(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <span className="w-10 text-right text-xs">${budgetLimit}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => void handleClearCache()} disabled={clearing}>
          {clearing ? 'Clearing...' : 'Clear AI Cache'}
        </Button>
        <Button variant="outline" size="sm" onClick={resetCosts}>
          Reset Cost Tracking
        </Button>
      </div>
    </div>
  );
}
