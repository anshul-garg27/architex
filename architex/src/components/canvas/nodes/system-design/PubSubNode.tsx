'use client';

import React, { memo } from 'react';
import { Megaphone } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const PUB_SUB_DEFAULTS = {
  subscriptions: 5,
} as const;

const PubSubNode = memo(function PubSubNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<Megaphone size={20} />}
    />
  );
});

PubSubNode.displayName = 'PubSubNode';

export default PubSubNode;
