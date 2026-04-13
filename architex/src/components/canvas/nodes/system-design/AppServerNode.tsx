'use client';

import React, { memo } from 'react';
import { Server } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const APP_SERVER_DEFAULTS = {
  instances: 1,
  threads: 200,
  processingTimeMs: 20,
} as const;

const AppServerNode = memo(function AppServerNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<Server size={20} />}
    />
  );
});

AppServerNode.displayName = 'AppServerNode';

export default AppServerNode;
