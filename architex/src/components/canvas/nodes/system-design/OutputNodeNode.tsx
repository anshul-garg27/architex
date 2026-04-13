'use client';

import React, { memo } from 'react';
import { ArrowUpFromLine } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const OUTPUT_NODE_DEFAULTS = {
  batchSize: 1000,
  flushIntervalMs: 5000,
} as const;

const OutputNodeNode = memo(function OutputNodeNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<ArrowUpFromLine size={20} />}
    />
  );
});

OutputNodeNode.displayName = 'OutputNodeNode';

export default OutputNodeNode;
