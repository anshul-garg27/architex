'use client';

import React, { memo } from 'react';
import { Zap } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const SERVERLESS_FUNCTION_DEFAULTS = {
  memoryMB: 256,
  timeoutMs: 30000,
  coldStartMs: 200,
} as const;

const ServerlessFunctionNode = memo(function ServerlessFunctionNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<Zap size={20} />}
    />
  );
});

ServerlessFunctionNode.displayName = 'ServerlessFunctionNode';

export default ServerlessFunctionNode;
