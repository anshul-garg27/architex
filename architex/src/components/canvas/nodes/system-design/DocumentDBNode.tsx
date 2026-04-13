'use client';

import React, { memo } from 'react';
import { FileJson } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const DOCUMENT_DB_DEFAULTS = {
  shards: 1,
  replicaSetSize: 3,
} as const;

const DocumentDBNode = memo(function DocumentDBNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<FileJson size={20} />}
    />
  );
});

DocumentDBNode.displayName = 'DocumentDBNode';

export default DocumentDBNode;
