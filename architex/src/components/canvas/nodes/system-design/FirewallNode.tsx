'use client';

import React, { memo } from 'react';
import { ShieldAlert } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const FIREWALL_DEFAULTS = {
  rules: 50,
  rateLimitRps: 100000,
} as const;

const FirewallNode = memo(function FirewallNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<ShieldAlert size={20} />}
    />
  );
});

FirewallNode.displayName = 'FirewallNode';

export default FirewallNode;
