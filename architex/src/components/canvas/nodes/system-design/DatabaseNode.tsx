'use client';

import React, { memo } from 'react';
import { Database } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const DATABASE_DEFAULTS = {
  type: 'postgresql',
  replicas: 1,
  maxConnections: 100,
  storageGB: 100,
} as const;

const DatabaseNode = memo(function DatabaseNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<Database size={20} />}
    />
  );
});

DatabaseNode.displayName = 'DatabaseNode';

export default DatabaseNode;
