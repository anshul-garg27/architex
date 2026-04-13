'use client';

import React, { memo } from 'react';
import { Shield } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const API_GATEWAY_DEFAULTS = {
  rateLimitRps: 10000,
  authType: 'jwt',
  timeout: 30,
} as const;

const APIGatewayNode = memo(function APIGatewayNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<Shield size={20} />}
    />
  );
});

APIGatewayNode.displayName = 'APIGatewayNode';

export default APIGatewayNode;
