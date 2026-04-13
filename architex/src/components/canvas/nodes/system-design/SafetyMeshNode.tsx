'use client';

import React, { memo } from 'react';
import { ShieldAlert } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const SAFETY_MESH_DEFAULTS = {
  rules: 100,
  blockThreshold: 0.9,
  latencyBudgetMs: 50,
} as const;

const SafetyMeshNode = memo(function SafetyMeshNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<ShieldAlert size={20} />}
    />
  );
});

SafetyMeshNode.displayName = 'SafetyMeshNode';

export default SafetyMeshNode;
