'use client';

import React, { memo } from 'react';
import { BarChart3 } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const ANALYTICS_SERVICE_DEFAULTS = {
  batchSize: 1000,
  flushIntervalMs: 5000,
  retentionDays: 90,
} as const;

const AnalyticsServiceNode = memo(function AnalyticsServiceNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<BarChart3 size={20} />}
    />
  );
});

AnalyticsServiceNode.displayName = 'AnalyticsServiceNode';

export default AnalyticsServiceNode;
