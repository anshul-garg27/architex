'use client';

import React, { memo } from 'react';
import { Radio } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const CDN_EDGE_DEFAULTS = {
  cacheHitRate: 0.9,
  ttlSeconds: 86400,
  locations: 200,
} as const;

const CDNEdgeNode = memo(function CDNEdgeNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<Radio size={20} />}
    />
  );
});

CDNEdgeNode.displayName = 'CDNEdgeNode';

export default CDNEdgeNode;
