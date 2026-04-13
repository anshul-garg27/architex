'use client';

import React, { memo } from 'react';
import { UserCheck } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const AUTH_SERVICE_V2_DEFAULTS = {
  authType: 'oauth2',
  tokenTtlMinutes: 60,
  mfaEnabled: true,
} as const;

const AuthServiceV2Node = memo(function AuthServiceV2Node(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<UserCheck size={20} />}
    />
  );
});

AuthServiceV2Node.displayName = 'AuthServiceV2Node';

export default AuthServiceV2Node;
