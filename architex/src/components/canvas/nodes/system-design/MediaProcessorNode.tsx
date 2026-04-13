'use client';

import React, { memo } from 'react';
import { Film } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const MEDIA_PROCESSOR_DEFAULTS = {
  concurrency: 4,
  maxFileSizeMB: 5000,
  outputFormats: 3,
} as const;

const MediaProcessorNode = memo(function MediaProcessorNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<Film size={20} />}
    />
  );
});

MediaProcessorNode.displayName = 'MediaProcessorNode';

export default MediaProcessorNode;
