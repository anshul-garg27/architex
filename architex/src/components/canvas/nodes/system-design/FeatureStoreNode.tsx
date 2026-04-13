'use client';

import React, { memo } from 'react';
import { Database } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const FEATURE_STORE_DEFAULTS = {
  features: 500,
  onlineTtlMs: 60000,
  offlineStorageGB: 100,
} as const;

const FeatureStoreNode = memo(function FeatureStoreNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<Database size={20} />}
    />
  );
});

FeatureStoreNode.displayName = 'FeatureStoreNode';

export default FeatureStoreNode;
