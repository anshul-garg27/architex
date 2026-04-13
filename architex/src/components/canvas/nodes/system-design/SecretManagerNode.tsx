'use client';

import React, { memo, useMemo } from 'react';
import { Lock } from 'lucide-react';
import type { NodeProps } from '@xyflow/react';
import BaseNode from './BaseNode';
import type { SystemDesignNode } from '@/lib/types';
import { useViewportStore } from '@/stores/viewport-store';

export const SECRET_MANAGER_DEFAULTS = {
  rotationDays: 90,
  encryptionType: 'AES-256',
  secretCount: 50,
} as const;

type EncryptionType = 'AES-256' | 'AES-128' | 'RSA-2048' | 'RSA-4096';

const SECRET_CATEGORIES = [
  { label: 'API Keys', color: 'var(--node-networking)' },
  { label: 'DB Creds', color: 'var(--node-storage)' },
  { label: 'Tokens', color: 'var(--node-compute)' },
  { label: 'Certs', color: 'var(--node-security)' },
] as const;

const SecretManagerNode = memo(function SecretManagerNode(props: NodeProps<SystemDesignNode>) {
  const zoom = useViewportStore((s) => s.zoom);
  const config = props.data.config;

  const rotationDays = (config.rotationDays as number | undefined) ?? 90;
  const encryptionType = (config.encryptionType as EncryptionType | undefined) ?? 'AES-256';
  const secretCount = (config.secretCount as number | undefined) ?? 50;

  // Rotation status: green if recently rotated, yellow if approaching, red if overdue
  const rotationStatus = useMemo(() => {
    if (rotationDays <= 30) return { label: 'Frequent', color: 'var(--state-success)' };
    if (rotationDays <= 90) return { label: 'Standard', color: 'var(--state-active)' };
    return { label: 'Extended', color: 'var(--state-warning)' };
  }, [rotationDays]);

  const showDetail = zoom > 0.6;

  return (
    <div data-testid="secret-manager-node">
      <BaseNode
        id={props.id}
        data={props.data}
        selected={props.selected ?? false}
        icon={<Lock size={20} />}
      />
      {showDetail && (
        <div
          className="mt-0.5 w-[180px] rounded-b-lg border border-t-0 bg-[var(--surface)] px-2 py-1.5 text-[10px]"
          style={{ borderColor: 'var(--node-security)' }}
        >
          {/* Rotation + encryption header */}
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: rotationStatus.color }}
              />
              <span className="text-[var(--muted-foreground)]">{rotationDays}d rotation</span>
            </div>
            <span
              className="inline-block rounded px-1 py-0.5 text-[9px] font-medium"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--node-security) 15%, transparent)',
                color: 'var(--node-security)',
              }}
            >
              {encryptionType}
            </span>
          </div>

          {/* Secret count */}
          <div className="mb-1 text-[9px] text-[var(--muted-foreground)]">
            {secretCount} secrets managed
          </div>

          {/* Secret categories */}
          <div className="flex flex-wrap gap-0.5">
            {SECRET_CATEGORIES.map((cat) => (
              <span
                key={cat.label}
                className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px]"
                style={{
                  backgroundColor: `color-mix(in srgb, ${cat.color} 10%, transparent)`,
                  color: cat.color,
                }}
              >
                {cat.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

SecretManagerNode.displayName = 'SecretManagerNode';

export default SecretManagerNode;
