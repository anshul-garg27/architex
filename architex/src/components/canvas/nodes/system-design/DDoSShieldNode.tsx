'use client';

import React, { memo } from 'react';
import { ShieldOff } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const DDOS_SHIELD_DEFAULTS = {
  rateLimitRps: 100000,
  rules: 100,
} as const;

const DDoSShieldNode = memo(function DDoSShieldNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<ShieldOff size={20} />}
    />
  );
});

DDoSShieldNode.displayName = 'DDoSShieldNode';

export default DDoSShieldNode;
