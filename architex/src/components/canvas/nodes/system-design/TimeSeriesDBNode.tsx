'use client';

import React, { memo } from 'react';
import { TrendingUp } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const TIMESERIES_DB_DEFAULTS = {
  retentionDays: 30,
  aggregationInterval: 60,
} as const;

const TimeSeriesDBNode = memo(function TimeSeriesDBNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<TrendingUp size={20} />}
    />
  );
});

TimeSeriesDBNode.displayName = 'TimeSeriesDBNode';

export default TimeSeriesDBNode;
