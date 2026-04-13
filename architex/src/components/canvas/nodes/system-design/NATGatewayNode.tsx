'use client';

import React, { memo } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const NAT_GATEWAY_DEFAULTS = {
  bandwidthGbps: 5,
} as const;

const NATGatewayNode = memo(function NATGatewayNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<ArrowRightLeft size={20} />}
    />
  );
});

NATGatewayNode.displayName = 'NATGatewayNode';

export default NATGatewayNode;
