'use client';

import React, { memo } from 'react';
import { ShieldCheck } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const VPN_GATEWAY_DEFAULTS = {
  tunnels: 2,
  bandwidthMbps: 1250,
} as const;

const VPNGatewayNode = memo(function VPNGatewayNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<ShieldCheck size={20} />}
    />
  );
});

VPNGatewayNode.displayName = 'VPNGatewayNode';

export default VPNGatewayNode;
