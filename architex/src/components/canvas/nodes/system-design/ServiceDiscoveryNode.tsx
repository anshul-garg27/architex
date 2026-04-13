'use client';

import React, { memo } from 'react';
import { Compass } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const SERVICE_DISCOVERY_DEFAULTS = {
  ttlSeconds: 30,
  healthCheckIntervalMs: 5000,
} as const;

const ServiceDiscoveryNode = memo(function ServiceDiscoveryNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<Compass size={20} />}
    />
  );
});

ServiceDiscoveryNode.displayName = 'ServiceDiscoveryNode';

export default ServiceDiscoveryNode;
