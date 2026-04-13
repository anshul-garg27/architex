'use client';

import React, { memo } from 'react';
import { Workflow } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const STREAM_PROCESSOR_DEFAULTS = {
  parallelism: 4,
  windowSeconds: 60,
} as const;

const StreamProcessorNode = memo(function StreamProcessorNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<Workflow size={20} />}
    />
  );
});

StreamProcessorNode.displayName = 'StreamProcessorNode';

export default StreamProcessorNode;
