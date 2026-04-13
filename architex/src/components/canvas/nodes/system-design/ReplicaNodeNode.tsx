'use client';

import React, { memo } from 'react';
import { Copy } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const REPLICA_NODE_DEFAULTS = {
  replicationLagMs: 100,
  readOnly: true,
  maxConnections: 1000,
} as const;

const ReplicaNodeNode = memo(function ReplicaNodeNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<Copy size={20} />}
    />
  );
});

ReplicaNodeNode.displayName = 'ReplicaNodeNode';

export default ReplicaNodeNode;
