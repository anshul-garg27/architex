'use client';

import React, { memo } from 'react';
import { KeyRound } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const SECRETS_MANAGER_V2_DEFAULTS = {
  rotationDays: 30,
  encryptionType: 'AES-256',
} as const;

const SecretsManagerV2Node = memo(function SecretsManagerV2Node(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<KeyRound size={20} />}
    />
  );
});

SecretsManagerV2Node.displayName = 'SecretsManagerV2Node';

export default SecretsManagerV2Node;
