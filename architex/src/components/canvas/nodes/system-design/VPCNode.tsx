'use client';

import React, { memo } from 'react';
import { Cloud } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const VPC_DEFAULTS = {
  cidrBlock: '10.0.0.0/16',
  subnets: 4,
} as const;

const VPCNode = memo(function VPCNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<Cloud size={20} />}
    />
  );
});

VPCNode.displayName = 'VPCNode';

export default VPCNode;
