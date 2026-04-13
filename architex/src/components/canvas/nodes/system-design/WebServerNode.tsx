'use client';

import React, { memo } from 'react';
import { Globe } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const WEB_SERVER_DEFAULTS = {
  instances: 1,
  maxConnections: 10000,
  processingTimeMs: 5,
} as const;

const WebServerNode = memo(function WebServerNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<Globe size={20} />}
    />
  );
});

WebServerNode.displayName = 'WebServerNode';

export default WebServerNode;
