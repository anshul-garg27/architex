'use client';

import React, { memo } from 'react';
import { GitBranch } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const LOAD_BALANCER_DEFAULTS = {
  algorithm: 'round-robin',
  healthCheckInterval: 10,
  maxConnections: 50000,
} as const;

const LoadBalancerNode = memo(function LoadBalancerNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<GitBranch size={20} />}
    />
  );
});

LoadBalancerNode.displayName = 'LoadBalancerNode';

export default LoadBalancerNode;
