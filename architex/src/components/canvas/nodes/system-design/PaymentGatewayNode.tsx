'use client';

import React, { memo } from 'react';
import { CreditCard } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const PAYMENT_GATEWAY_DEFAULTS = {
  processingTimeMs: 200,
  retryAttempts: 3,
  fraudCheckEnabled: true,
} as const;

const PaymentGatewayNode = memo(function PaymentGatewayNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<CreditCard size={20} />}
    />
  );
});

PaymentGatewayNode.displayName = 'PaymentGatewayNode';

export default PaymentGatewayNode;
