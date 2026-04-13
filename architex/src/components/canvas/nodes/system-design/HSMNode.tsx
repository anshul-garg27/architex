'use client';

import React, { memo } from 'react';
import { Fingerprint } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const HSM_DEFAULTS = {
  encryptionAtRest: true,
  encryptionInTransit: true,
  keyRotationDays: 30,
} as const;

const HSMNode = memo(function HSMNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<Fingerprint size={20} />}
    />
  );
});

HSMNode.displayName = 'HSMNode';

export default HSMNode;
