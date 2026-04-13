'use client';

import React, { memo } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const FRAUD_DETECTION_DEFAULTS = {
  modelVersion: 'v3',
  thresholdScore: 0.85,
  latencyTargetMs: 50,
} as const;

const FraudDetectionNode = memo(function FraudDetectionNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<AlertTriangle size={20} />}
    />
  );
});

FraudDetectionNode.displayName = 'FraudDetectionNode';

export default FraudDetectionNode;
