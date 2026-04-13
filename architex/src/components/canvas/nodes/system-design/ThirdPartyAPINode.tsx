'use client';

import React, { memo } from 'react';
import { ExternalLink } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const THIRD_PARTY_API_DEFAULTS = {
  rateLimitRps: 100,
  latencyMs: 200,
  errorRate: 0.01,
} as const;

const ThirdPartyAPINode = memo(function ThirdPartyAPINode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<ExternalLink size={20} />}
    />
  );
});

ThirdPartyAPINode.displayName = 'ThirdPartyAPINode';

export default ThirdPartyAPINode;
