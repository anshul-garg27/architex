'use client';

import React, { memo } from 'react';
import { ScrollText } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const LOG_AGGREGATOR_DEFAULTS = {
  retentionDays: 30,
} as const;

const LogAggregatorNode = memo(function LogAggregatorNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<ScrollText size={20} />}
    />
  );
});

LogAggregatorNode.displayName = 'LogAggregatorNode';

export default LogAggregatorNode;
