'use client';

import React, { memo } from 'react';
import { Sparkles } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const LLM_GATEWAY_DEFAULTS = {
  maxTokens: 4096,
  processingTimeMs: 500,
  costPerHour: 1.5,
  models: 3,
} as const;

const LLMGatewayNode = memo(function LLMGatewayNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<Sparkles size={20} />}
    />
  );
});

LLMGatewayNode.displayName = 'LLMGatewayNode';

export default LLMGatewayNode;
