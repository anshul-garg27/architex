'use client';

import React, { memo } from 'react';
import { ArrowDownToLine } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const INPUT_NODE_DEFAULTS = {
  batchSize: 1000,
  parallelism: 4,
} as const;

const InputNodeNode = memo(function InputNodeNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<ArrowDownToLine size={20} />}
    />
  );
});

InputNodeNode.displayName = 'InputNodeNode';

export default InputNodeNode;
