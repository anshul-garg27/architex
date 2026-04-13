'use client';

import React, { memo } from 'react';
import { ClipboardList } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const BATCH_PROCESSOR_DEFAULTS = {
  batchSize: 1000,
  scheduleMinutes: 60,
} as const;

const BatchProcessorNode = memo(function BatchProcessorNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<ClipboardList size={20} />}
    />
  );
});

BatchProcessorNode.displayName = 'BatchProcessorNode';

export default BatchProcessorNode;
