'use client';

import React, { memo } from 'react';
import { Flag } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const FEATURE_FLAGS_DEFAULTS = {
  flagCount: 100,
  evaluationCacheMs: 5000,
} as const;

const FeatureFlagsNode = memo(function FeatureFlagsNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<Flag size={20} />}
    />
  );
});

FeatureFlagsNode.displayName = 'FeatureFlagsNode';

export default FeatureFlagsNode;
