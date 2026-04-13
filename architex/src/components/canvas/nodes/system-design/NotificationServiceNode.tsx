'use client';

import React, { memo } from 'react';
import { Bell } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const NOTIFICATION_SERVICE_DEFAULTS = {
  channelCount: 3,
  batchSize: 100,
  retryAttempts: 3,
} as const;

const NotificationServiceNode = memo(function NotificationServiceNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<Bell size={20} />}
    />
  );
});

NotificationServiceNode.displayName = 'NotificationServiceNode';

export default NotificationServiceNode;
