'use client';

import React, { memo } from 'react';
import { LogIn } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const INGRESS_CONTROLLER_DEFAULTS = {
  maxConnections: 50000,
  sslTermination: true,
} as const;

const IngressControllerNode = memo(function IngressControllerNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<LogIn size={20} />}
    />
  );
});

IngressControllerNode.displayName = 'IngressControllerNode';

export default IngressControllerNode;
