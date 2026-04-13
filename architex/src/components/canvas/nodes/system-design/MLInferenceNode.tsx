'use client';

import React, { memo } from 'react';
import { Brain } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const ML_INFERENCE_DEFAULTS = {
  modelSizeMB: 500,
  batchSize: 32,
  latencyTargetMs: 100,
} as const;

const MLInferenceNode = memo(function MLInferenceNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<Brain size={20} />}
    />
  );
});

MLInferenceNode.displayName = 'MLInferenceNode';

export default MLInferenceNode;
