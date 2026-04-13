'use client';

import React, { memo } from 'react';
import { Bot } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const AGENT_ORCHESTRATOR_DEFAULTS = {
  maxAgents: 10,
  autoScale: true,
  timeoutMs: 120000,
} as const;

const AgentOrchestratorNode = memo(function AgentOrchestratorNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<Bot size={20} />}
    />
  );
});

AgentOrchestratorNode.displayName = 'AgentOrchestratorNode';

export default AgentOrchestratorNode;
