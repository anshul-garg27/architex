'use client';

import React, { memo } from 'react';
import { Layers } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const CACHE_DEFAULTS = {
  type: 'redis',
  memoryGB: 8,
  evictionPolicy: 'lru',
  ttlSeconds: 3600,
} as const;

const CacheNode = memo(function CacheNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<Layers size={20} />}
    />
  );
});

CacheNode.displayName = 'CacheNode';

export default CacheNode;
