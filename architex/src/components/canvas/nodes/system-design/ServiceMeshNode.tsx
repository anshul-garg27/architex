'use client';

import React, { memo } from 'react';
import { GitGraph } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const SERVICE_MESH_DEFAULTS = {
  mtlsEnabled: true,
  retryAttempts: 3,
  timeoutMs: 5000,
} as const;

const ServiceMeshNode = memo(function ServiceMeshNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<GitGraph size={20} />}
    />
  );
});

ServiceMeshNode.displayName = 'ServiceMeshNode';

export default ServiceMeshNode;
