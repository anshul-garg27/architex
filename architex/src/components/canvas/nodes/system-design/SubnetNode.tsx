'use client';

import React, { memo } from 'react';
import { Network } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const SUBNET_DEFAULTS = {
  cidrBlock: '10.0.1.0/24',
  isPublic: false,
} as const;

const SubnetNode = memo(function SubnetNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<Network size={20} />}
    />
  );
});

SubnetNode.displayName = 'SubnetNode';

export default SubnetNode;
