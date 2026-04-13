'use client';

import React, { memo } from 'react';
import { HardDrive } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const STORAGE_DEFAULTS = {
  type: 's3',
  storageTB: 10,
  replication: 3,
} as const;

const StorageNode = memo(function StorageNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<HardDrive size={20} />}
    />
  );
});

StorageNode.displayName = 'StorageNode';

export default StorageNode;
