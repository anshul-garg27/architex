'use client';

import React, { memo } from 'react';
import { ListOrdered } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const MESSAGE_QUEUE_DEFAULTS = {
  type: 'kafka',
  partitions: 3,
  replicationFactor: 3,
  retentionHours: 168,
} as const;

const MessageQueueNode = memo(function MessageQueueNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<ListOrdered size={20} />}
    />
  );
});

MessageQueueNode.displayName = 'MessageQueueNode';

export default MessageQueueNode;
