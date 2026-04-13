'use client';

import React, { memo } from 'react';
import { FileCode } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const SCHEMA_REGISTRY_DEFAULTS = {
  schemaCount: 200,
  compatibilityMode: 'backward',
} as const;

const SchemaRegistryNode = memo(function SchemaRegistryNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<FileCode size={20} />}
    />
  );
});

SchemaRegistryNode.displayName = 'SchemaRegistryNode';

export default SchemaRegistryNode;
