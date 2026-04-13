'use client';

import React, { memo } from 'react';
import { AtSign } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const DNS_DEFAULTS = {
  ttlSeconds: 300,
} as const;

const DNSNode = memo(function DNSNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<AtSign size={20} />}
    />
  );
});

DNSNode.displayName = 'DNSNode';

export default DNSNode;
