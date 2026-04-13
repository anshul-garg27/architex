'use client';

import React, { memo } from 'react';
import { BookOpen } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';

export const LEDGER_SERVICE_DEFAULTS = {
  journalEntries: 1000000,
  consistencyLevel: 'strong',
} as const;

const LedgerServiceNode = memo(function LedgerServiceNode(props: NodeProps<SystemDesignNode>) {
  return (
    <BaseNode
      id={props.id}
      data={props.data}
      selected={props.selected ?? false}
      icon={<BookOpen size={20} />}
    />
  );
});

LedgerServiceNode.displayName = 'LedgerServiceNode';

export default LedgerServiceNode;
