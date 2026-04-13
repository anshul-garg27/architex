'use client';

import React, { memo } from 'react';
import { Wrench } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const TOOL_REGISTRY_DEFAULTS = {
  toolCount: 50,
  cacheTtlMs: 300000,
} as const;

const ToolRegistryNode = memo(function ToolRegistryNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<Wrench size={20} />}
    />
  );
});

ToolRegistryNode.displayName = 'ToolRegistryNode';

export default ToolRegistryNode;
