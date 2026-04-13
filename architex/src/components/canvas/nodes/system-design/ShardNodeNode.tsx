'use client';

import React, { memo } from 'react';
import { Layers } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const SHARD_NODE_DEFAULTS = {
  storageGB: 500,
  maxConnections: 1000,
} as const;

const ShardNodeNode = memo(function ShardNodeNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<Layers size={20} />}
    />
  );
});

ShardNodeNode.displayName = 'ShardNodeNode';

export default ShardNodeNode;
