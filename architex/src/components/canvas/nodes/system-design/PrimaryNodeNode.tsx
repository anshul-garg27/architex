'use client';

import React, { memo } from 'react';
import { Crown } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const PRIMARY_NODE_DEFAULTS = {
  walEnabled: true,
  syncReplication: true,
  maxConnections: 500,
} as const;

const PrimaryNodeNode = memo(function PrimaryNodeNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<Crown size={20} />}
    />
  );
});

PrimaryNodeNode.displayName = 'PrimaryNodeNode';

export default PrimaryNodeNode;
