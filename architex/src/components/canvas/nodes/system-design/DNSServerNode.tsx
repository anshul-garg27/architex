'use client';

import React, { memo } from 'react';
import { AtSign } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const DNS_SERVER_DEFAULTS = {
  ttlSeconds: 300,
  zones: 10,
} as const;

const DNSServerNode = memo(function DNSServerNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<AtSign size={20} />}
    />
  );
});

DNSServerNode.displayName = 'DNSServerNode';

export default DNSServerNode;
