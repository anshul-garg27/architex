'use client';

import React, { memo } from 'react';
import { Globe2 } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const CDN_DEFAULTS = {
  cacheHitRate: 0.85,
  ttlSeconds: 86400,
  edgeLocations: 50,
} as const;

const CDNNode = memo(function CDNNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<Globe2 size={20} />}
    />
  );
});

CDNNode.displayName = 'CDNNode';

export default CDNNode;
