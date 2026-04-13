'use client';

import React, { memo } from 'react';
import { Monitor } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const CLIENT_DEFAULTS = {
  concurrentUsers: 1000,
  requestsPerSecond: 100,
} as const;

const ClientNode = memo(function ClientNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<Monitor size={20} />}
    />
  );
});

ClientNode.displayName = 'ClientNode';

export default ClientNode;
