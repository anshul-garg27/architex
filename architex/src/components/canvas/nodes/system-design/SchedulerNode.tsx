'use client';

import React, { memo } from 'react';
import { Clock } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const SCHEDULER_DEFAULTS = {
  maxConcurrentJobs: 50,
  pollIntervalMs: 1000,
} as const;

const SchedulerNode = memo(function SchedulerNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<Clock size={20} />}
    />
  );
});

SchedulerNode.displayName = 'SchedulerNode';

export default SchedulerNode;
