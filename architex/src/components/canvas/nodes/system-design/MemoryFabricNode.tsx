'use client';

import React, { memo } from 'react';
import { BrainCircuit } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const MEMORY_FABRIC_DEFAULTS = {
  memoryGB: 64,
  vectorDimensions: 1536,
  ttlHours: 720,
} as const;

const MemoryFabricNode = memo(function MemoryFabricNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<BrainCircuit size={20} />}
    />
  );
});

MemoryFabricNode.displayName = 'MemoryFabricNode';

export default MemoryFabricNode;
