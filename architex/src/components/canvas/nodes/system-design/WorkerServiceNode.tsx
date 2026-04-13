'use client';

import React, { memo } from 'react';
import { Cog } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const WORKER_SERVICE_DEFAULTS = {
  concurrency: 10,
  pollIntervalMs: 1000,
} as const;

const WorkerServiceNode = memo(function WorkerServiceNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<Cog size={20} />}
    />
  );
});

WorkerServiceNode.displayName = 'WorkerServiceNode';

export default WorkerServiceNode;
