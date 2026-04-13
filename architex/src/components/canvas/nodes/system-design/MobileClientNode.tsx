'use client';

import React, { memo } from 'react';
import { Smartphone } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const MOBILE_CLIENT_DEFAULTS = {
  requestsPerSecond: 50,
} as const;

const MobileClientNode = memo(function MobileClientNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<Smartphone size={20} />}
    />
  );
});

MobileClientNode.displayName = 'MobileClientNode';

export default MobileClientNode;
