'use client';

import React, { memo } from 'react';
import { RefreshCw } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const CDC_SERVICE_DEFAULTS = {
  pollIntervalMs: 100,
  batchSize: 500,
  snapshotEnabled: true,
} as const;

const CDCServiceNode = memo(function CDCServiceNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<RefreshCw size={20} />}
    />
  );
});

CDCServiceNode.displayName = 'CDCServiceNode';

export default CDCServiceNode;
