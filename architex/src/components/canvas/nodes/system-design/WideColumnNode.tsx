'use client';

import React, { memo } from 'react';
import { Table2 } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const WIDE_COLUMN_DEFAULTS = {
  replicationFactor: 3,
  consistencyLevel: 'QUORUM',
} as const;

const WideColumnNode = memo(function WideColumnNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<Table2 size={20} />}
    />
  );
});

WideColumnNode.displayName = 'WideColumnNode';

export default WideColumnNode;
