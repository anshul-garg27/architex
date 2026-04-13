'use client';

import React, { memo } from 'react';
import { ScanEye } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const SIEM_DEFAULTS = {
  retentionDays: 90,
  alertRules: 50,
} as const;

const SIEMNode = memo(function SIEMNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<ScanEye size={20} />}
    />
  );
});

SIEMNode.displayName = 'SIEMNode';

export default SIEMNode;
