'use client';

import React, { memo } from 'react';
import { Workflow } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const ETL_PIPELINE_DEFAULTS = {
  batchSize: 10000,
  scheduleMinutes: 60,
  processingTimeMs: 5000,
} as const;

const ETLPipelineNode = memo(function ETLPipelineNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<Workflow size={20} />}
    />
  );
});

ETLPipelineNode.displayName = 'ETLPipelineNode';

export default ETLPipelineNode;
