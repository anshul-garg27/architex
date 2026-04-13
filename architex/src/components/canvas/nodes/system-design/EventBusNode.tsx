'use client';

import React, { memo, useMemo } from 'react';
import { Radio } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';
import { useViewportStore } from '@/stores/viewport-store';

export const EVENT_BUS_DEFAULTS = {
  rules: 10,
  deliveryGuarantee: 'at-least-once',
  topics: 'orders,payments,notifications',
} as const;

type DeliveryGuarantee = 'at-least-once' | 'at-most-once' | 'exactly-once';

const GUARANTEE_COLOR: Record<DeliveryGuarantee, string> = {
  'at-least-once': 'var(--state-active)',
  'at-most-once': 'var(--state-warning)',
  'exactly-once': 'var(--state-success)',
};

const EventBusNode = memo(function EventBusNode(props: NodeProps<SystemDesignNode>) {
  const zoom = useViewportStore((s) => s.zoom);
  const config = props.data.config;

  const deliveryGuarantee = (config.deliveryGuarantee as DeliveryGuarantee | undefined) ?? 'at-least-once';
  const topicsRaw = (config.topics as string | undefined) ?? '';
  const topics = useMemo(
    () => topicsRaw.split(',').map((t) => t.trim()).filter(Boolean),
    [topicsRaw],
  );
  const rules = (config.rules as number | undefined) ?? 10;

  const guaranteeColor = GUARANTEE_COLOR[deliveryGuarantee] ?? 'var(--state-active)';

  // Only show detail panel at full LOD
  const showDetail = zoom > 0.6;

  return (
    <div data-testid="event-bus-node">
      <BaseNode
        id={props.id}
        data={props.data}
        selected={props.selected ?? false}
        icon={<Radio size={20} />}
      />
      {showDetail && (
        <div
          className="mt-0.5 w-[180px] rounded-b-lg border border-t-0 bg-[var(--surface)] px-2 py-1.5 text-[10px]"
          style={{ borderColor: 'var(--node-messaging)' }}
        >
          {/* Delivery guarantee badge */}
          <div className="mb-1 flex items-center gap-1">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: guaranteeColor }}
            />
            <span className="text-[var(--muted-foreground)]">{deliveryGuarantee}</span>
            <span className="ml-auto text-[var(--muted-foreground)]">{rules} rules</span>
          </div>

          {/* Topic list */}
          {topics.length > 0 && (
            <div className="flex flex-wrap gap-0.5">
              {topics.slice(0, 4).map((topic) => (
                <span
                  key={topic}
                  className="inline-block rounded px-1 py-0.5 text-[9px] font-medium"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--node-messaging) 15%, transparent)',
                    color: 'var(--node-messaging)',
                  }}
                >
                  {topic}
                </span>
              ))}
              {topics.length > 4 && (
                <span className="text-[9px] text-[var(--muted-foreground)]">
                  +{topics.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

EventBusNode.displayName = 'EventBusNode';

export default EventBusNode;
