'use client';

import React, { memo } from 'react';
import { SplitSquareVertical } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const PARTITION_NODE_DEFAULTS = {
  retentionHours: 168,
  segmentSizeMB: 1024,
} as const;

const PartitionNodeNode = memo(function PartitionNodeNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<SplitSquareVertical size={20} />}
    />
  );
});

PartitionNodeNode.displayName = 'PartitionNodeNode';

export default PartitionNodeNode;
