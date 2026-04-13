'use client';

import React, { memo, useMemo } from 'react';
import { Gauge } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';
import { useViewportStore } from '@/stores/viewport-store';

export const RATE_LIMITER_DEFAULTS = {
  algorithm: 'token-bucket',
  limitRps: 1000,
  burstSize: 100,
  windowSeconds: 60,
} as const;

type RateLimitAlgorithm = 'token-bucket' | 'sliding-window' | 'fixed-window' | 'leaky-bucket';

const ALGORITHM_LABELS: Record<RateLimitAlgorithm, string> = {
  'token-bucket': 'Token Bucket',
  'sliding-window': 'Sliding Window',
  'fixed-window': 'Fixed Window',
  'leaky-bucket': 'Leaky Bucket',
};

const RateLimiterNode = memo(function RateLimiterNode(props: NodeProps<SystemDesignNode>) {
  const zoom = useViewportStore((s) => s.zoom);
  const config = props.data.config;

  const algorithm = (config.algorithm as RateLimitAlgorithm | undefined) ?? 'token-bucket';
  const limitRps = (config.limitRps as number | undefined) ?? 1000;
  const burstSize = (config.burstSize as number | undefined) ?? 100;
  const windowSeconds = (config.windowSeconds as number | undefined) ?? 60;

  const currentThroughput = props.data.metrics?.throughput ?? 0;

  // Calculate gauge fill ratio (capped at 1)
  const fillRatio = useMemo(
    () => Math.min(currentThroughput / Math.max(limitRps, 1), 1),
    [currentThroughput, limitRps],
  );

  // Colour the gauge based on utilization
  const gaugeColor = useMemo(() => {
    if (fillRatio > 0.9) return 'var(--state-error)';
    if (fillRatio > 0.7) return 'var(--state-warning)';
    return 'var(--state-success)';
  }, [fillRatio]);

  const algoLabel = ALGORITHM_LABELS[algorithm] ?? algorithm;

  const showDetail = zoom > 0.6;

  return (
    <div data-testid="rate-limiter-node">
      <BaseNode
        id={props.id}
        data={props.data}
        selected={props.selected ?? false}
        icon={<Gauge size={20} />}
      />
      {showDetail && (
        <div
          className="mt-0.5 w-[180px] rounded-b-lg border border-t-0 bg-[var(--surface)] px-2 py-1.5 text-[10px]"
          style={{ borderColor: 'var(--node-security)' }}
        >
          {/* Algorithm badge */}
          <div className="mb-1 flex items-center justify-between">
            <span
              className="inline-block rounded px-1 py-0.5 text-[9px] font-medium"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--node-security) 15%, transparent)',
                color: 'var(--node-security)',
              }}
            >
              {algoLabel}
            </span>
            <span className="text-[var(--muted-foreground)]">{windowSeconds}s window</span>
          </div>

          {/* Gauge bar */}
          <div className="mb-1">
            <div className="flex items-center justify-between text-[9px] text-[var(--muted-foreground)]">
              <span>{currentThroughput} rps</span>
              <span>/ {limitRps} rps</span>
            </div>
            <div
              className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full"
              style={{ backgroundColor: 'color-mix(in srgb, var(--node-security) 12%, transparent)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.max(fillRatio * 100, 2)}%`,
                  backgroundColor: gaugeColor,
                }}
              />
            </div>
          </div>

          {/* Burst size */}
          <div className="flex items-center justify-between text-[9px] text-[var(--muted-foreground)]">
            <span>Burst: {burstSize}</span>
          </div>
        </div>
      )}
    </div>
  );
});

RateLimiterNode.displayName = 'RateLimiterNode';

export default RateLimiterNode;
