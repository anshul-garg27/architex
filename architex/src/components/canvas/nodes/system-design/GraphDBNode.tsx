'use client';

import React, { memo } from 'react';
import { GitFork } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const GRAPH_DB_DEFAULTS = {
  nodes: 1000000,
  relationships: 5000000,
} as const;

const GraphDBNode = memo(function GraphDBNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<GitFork size={20} />}
    />
  );
});

GraphDBNode.displayName = 'GraphDBNode';

export default GraphDBNode;
