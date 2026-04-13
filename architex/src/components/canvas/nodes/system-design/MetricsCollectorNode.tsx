'use client';

import React, { memo } from 'react';
import { BarChart3 } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const METRICS_COLLECTOR_DEFAULTS = {
  scrapeIntervalSeconds: 15,
} as const;

const MetricsCollectorNode = memo(function MetricsCollectorNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<BarChart3 size={20} />}
    />
  );
});

MetricsCollectorNode.displayName = 'MetricsCollectorNode';

export default MetricsCollectorNode;
