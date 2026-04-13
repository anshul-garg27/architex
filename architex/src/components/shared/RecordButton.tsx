'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Circle, Square, Pause, Play, Download, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  GifRecorder,
  downloadRecording,
  type RecorderState,
} from '@/lib/export/gif-recorder';

// ─────────────────────────────────────────────────────────────
// RecordButton — Floating canvas recording UI
// ─────────────────────────────────────────────────────────────

type UIState = 'idle' | 'recording' | 'paused' | 'processing' | 'preview';

interface RecordButtonProps {
  /** CSS selector or ref callback to get the element to record. */
  targetSelector?: string;
  /** Direct ref to the target element (takes precedence over selector). */
  targetRef?: React.RefObject<HTMLElement | null>;
  /** Additional CSS class for the floating container. */
  className?: string;
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export const RecordButton = memo(function RecordButton({
  targetSelector = '.react-flow',
  targetRef,
  className,
}: RecordButtonProps) {
  const recorderRef = useRef<GifRecorder | null>(null);
  const [uiState, setUiState] = useState<UIState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const getTargetElement = useCallback((): HTMLElement | null => {
    if (targetRef?.current) return targetRef.current;
    if (targetSelector) {
      return document.querySelector<HTMLElement>(targetSelector);
    }
    return null;
  }, [targetSelector, targetRef]);

  // ── Start recording ─────────────────────────────────────

  const handleStart = useCallback(() => {
    const target = getTargetElement();
    if (!target) return;

    const recorder = new GifRecorder();
    recorderRef.current = recorder;

    recorder.on((event) => {
      switch (event.type) {
        case 'stateChange': {
          const map: Record<RecorderState, UIState> = {
            idle: 'idle',
            recording: 'recording',
            paused: 'paused',
            processing: 'processing',
          };
          setUiState(map[event.state]);
          break;
        }
        case 'tick':
          setElapsed(event.elapsed);
          break;
        case 'complete':
          setBlob(event.blob);
          if (event.blob.type.includes('webm')) {
            setPreviewUrl(URL.createObjectURL(event.blob));
          }
          setUiState('preview');
          break;
        case 'error':
          setUiState('idle');
          break;
      }
    });

    recorder.start(target, { fps: 10, maxDurationSec: 30 });
  }, [getTargetElement]);

  // ── Stop recording ──────────────────────────────────────

  const handleStop = useCallback(async () => {
    await recorderRef.current?.stop();
  }, []);

  // ── Pause / Resume ──────────────────────────────────────

  const handlePause = useCallback(() => {
    recorderRef.current?.pause();
  }, []);

  const handleResume = useCallback(() => {
    recorderRef.current?.resume();
  }, []);

  // ── Download ────────────────────────────────────────────

  const handleDownload = useCallback(() => {
    if (!blob) return;
    downloadRecording(blob);
  }, [blob]);

  // ── Dismiss preview ─────────────────────────────────────

  const handleDismiss = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setBlob(null);
    setElapsed(0);
    setUiState('idle');
    recorderRef.current = null;
  }, [previewUrl]);

  // ── Render ──────────────────────────────────────────────

  // Idle state: show record button
  if (uiState === 'idle') {
    return (
      <button
        onClick={handleStart}
        className={cn(
          'group flex h-10 w-10 items-center justify-center rounded-full',
          'bg-red-600 text-white shadow-lg transition-all',
          'hover:bg-red-500 hover:scale-110',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          className,
        )}
        aria-label="Start recording"
        title="Record canvas"
      >
        <Circle className="h-4 w-4 fill-current" />
      </button>
    );
  }

  // Processing state
  if (uiState === 'processing') {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-full bg-popover/95 px-4 py-2 shadow-lg backdrop-blur-sm border border-border',
          className,
        )}
      >
        <div className="h-3 w-3 animate-spin rounded-full border-2 border-foreground-muted border-t-primary" />
        <span className="text-xs font-medium text-foreground-muted">
          Processing...
        </span>
      </div>
    );
  }

  // Preview state
  if (uiState === 'preview') {
    return (
      <div
        className={cn(
          'flex flex-col gap-3 rounded-xl bg-popover/95 p-4 shadow-lg backdrop-blur-sm border border-border',
          'w-72',
          className,
        )}
      >
        {/* Preview area */}
        {previewUrl && (
          <video
            src={previewUrl}
            className="w-full rounded-lg border border-border"
            controls
            autoPlay
            loop
            muted
          />
        )}
        {!previewUrl && (
          <div className="flex h-20 items-center justify-center rounded-lg border border-border bg-accent/50">
            <span className="text-xs text-foreground-muted">
              Recording complete ({formatDuration(elapsed)})
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </button>
          <button
            onClick={handleDismiss}
            className="flex items-center justify-center rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Recording / Paused state
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-full bg-popover/95 px-3 py-1.5 shadow-lg backdrop-blur-sm border border-border',
        className,
      )}
    >
      {/* Recording indicator */}
      <div
        className={cn(
          'h-2.5 w-2.5 rounded-full',
          uiState === 'recording'
            ? 'animate-pulse bg-red-500'
            : 'bg-yellow-500',
        )}
      />

      {/* Timer */}
      <span className="min-w-[3.5rem] text-center font-mono text-xs font-medium text-foreground">
        {formatDuration(elapsed)}
      </span>

      {/* Pause / Resume */}
      {uiState === 'recording' ? (
        <button
          onClick={handlePause}
          className="flex h-7 w-7 items-center justify-center rounded-full text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Pause recording"
        >
          <Pause className="h-3.5 w-3.5" />
        </button>
      ) : (
        <button
          onClick={handleResume}
          className="flex h-7 w-7 items-center justify-center rounded-full text-foreground-muted transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Resume recording"
        >
          <Play className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Stop */}
      <button
        onClick={handleStop}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white transition-colors hover:bg-red-500"
        aria-label="Stop recording"
      >
        <Square className="h-3 w-3 fill-current" />
      </button>
    </div>
  );
});
