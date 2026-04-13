'use client';

import React, { memo } from 'react';
import { Search } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const SEARCH_ENGINE_DEFAULTS = {
  shards: 5,
  replicas: 1,
} as const;

const SearchEngineNode = memo(function SearchEngineNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<Search size={20} />}
    />
  );
});

SearchEngineNode.displayName = 'SearchEngineNode';

export default SearchEngineNode;
