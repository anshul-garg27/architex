'use client';

import React, { memo } from 'react';
import { Settings } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const CONFIG_SERVICE_DEFAULTS = {
  refreshIntervalMs: 30000,
  versionHistory: 50,
} as const;

const ConfigServiceNode = memo(function ConfigServiceNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<Settings size={20} />}
    />
  );
});

ConfigServiceNode.displayName = 'ConfigServiceNode';

export default ConfigServiceNode;
