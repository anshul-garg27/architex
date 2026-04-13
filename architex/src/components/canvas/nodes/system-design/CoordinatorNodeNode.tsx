'use client';

import React, { memo } from 'react';
import { Radar } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const COORDINATOR_NODE_DEFAULTS = {
  quorumSize: 3,
  electionTimeoutMs: 5000,
} as const;

const CoordinatorNodeNode = memo(function CoordinatorNodeNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<Radar size={20} />}
    />
  );
});

CoordinatorNodeNode.displayName = 'CoordinatorNodeNode';

export default CoordinatorNodeNode;
