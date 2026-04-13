'use client';

import React, { memo } from 'react';
import { Activity } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const DISTRIBUTED_TRACER_DEFAULTS = {
  sampleRate: 0.1,
} as const;

const DistributedTracerNode = memo(function DistributedTracerNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<Activity size={20} />}
    />
  );
});

DistributedTracerNode.displayName = 'DistributedTracerNode';

export default DistributedTracerNode;
