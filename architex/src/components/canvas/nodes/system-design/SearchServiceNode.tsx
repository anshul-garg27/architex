'use client';

import React, { memo } from 'react';
import { Search } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const SEARCH_SERVICE_DEFAULTS = {
  shards: 5,
  replicas: 1,
  indexCount: 10,
} as const;

const SearchServiceNode = memo(function SearchServiceNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<Search size={20} />}
    />
  );
});

SearchServiceNode.displayName = 'SearchServiceNode';

export default SearchServiceNode;
