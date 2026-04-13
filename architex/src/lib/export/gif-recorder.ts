// ─────────────────────────────────────────────────────────────
// Canvas GIF / Video Recorder
//
// Records the content of an HTML element by repeatedly capturing
// frames from a canvas. Prefers MediaRecorder (WebM) when available,
// falling back to a frame-sequence capture that can be downloaded
// as individual PNGs (since native GIF encoding is non-trivial
// without external libraries).
// ─────────────────────────────────────────────────────────────

/** Recording options. */
export interface RecorderOptions {
  /** Frames per second (default 10). */
  fps?: number;
  /** Maximum recording duration in seconds (default 30, max 30). */
  maxDurationSec?: number;
  /** Video MIME type for MediaRecorder (default 'video/webm'). */
  mimeType?: string;
  /** Optional scale factor for the capture canvas (default 1). */
  scale?: number;
}

export type RecorderState = 'idle' | 'recording' | 'paused' | 'processing';

/** Event types emitted by the recorder. */
export type RecorderEvent =
  | { type: 'stateChange'; state: RecorderState }
  | { type: 'tick'; elapsed: number }
  | { type: 'complete'; blob: Blob }
  | { type: 'error'; message: string };

type RecorderListener = (event: RecorderEvent) => void;

// ── Constants ────────────────────────────────────────────────

const DEFAULT_FPS = 10;
const MAX_DURATION_SEC = 30;
const DEFAULT_MIME = 'video/webm';

// ── GifRecorder Class ────────────────────────────────────────

/**
 * Records the visual content of an HTML element as a video.
 *
 * Uses the browser's MediaRecorder API when available (outputs WebM).
 * Falls back to a frame-by-frame canvas capture approach.
 */
export class GifRecorder {
  private state: RecorderState = 'idle';
  private listeners: Set<RecorderListener> = new Set();

  // Recording configuration
  private fps: number = DEFAULT_FPS;
  private maxDurationMs: number = MAX_DURATION_SEC * 1000;
  private mimeType: string = DEFAULT_MIME;
  private scale: number = 1;

  // Recording state
  private element: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private frameIntervalId: ReturnType<typeof setInterval> | null = null;
  private durationTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private startTime: number = 0;
  private pauseTime: number = 0;
  private totalPausedMs: number = 0;
  private tickIntervalId: ReturnType<typeof setInterval> | null = null;

  // Fallback: frame sequence
  private frames: string[] = [];
  private useMediaRecorder: boolean = false;

  // ── Lifecycle ────────────────────────────────────────────

  /**
   * Begin recording the given HTML element.
   */
  start(element: HTMLElement, options?: RecorderOptions): void {
    if (this.state !== 'idle') {
      this.emit({ type: 'error', message: 'Recorder is already active.' });
      return;
    }

    this.element = element;
    this.fps = options?.fps ?? DEFAULT_FPS;
    this.maxDurationMs =
      Math.min(options?.maxDurationSec ?? MAX_DURATION_SEC, MAX_DURATION_SEC) *
      1000;
    this.mimeType = options?.mimeType ?? DEFAULT_MIME;
    this.scale = options?.scale ?? 1;

    // Reset buffers
    this.chunks = [];
    this.frames = [];
    this.totalPausedMs = 0;

    // Create an offscreen canvas for rendering frames
    this.canvas = document.createElement('canvas');
    const rect = element.getBoundingClientRect();
    this.canvas.width = Math.round(rect.width * this.scale);
    this.canvas.height = Math.round(rect.height * this.scale);
    this.ctx = this.canvas.getContext('2d');

    if (!this.ctx) {
      this.emit({ type: 'error', message: 'Failed to create canvas context.' });
      return;
    }

    // Determine strategy
    this.useMediaRecorder = this.supportsMediaRecorder();

    if (this.useMediaRecorder) {
      this.startMediaRecorder();
    } else {
      this.startFrameCapture();
    }

    // Duration limit
    this.durationTimeoutId = setTimeout(() => {
      this.stop();
    }, this.maxDurationMs);

    // Tick every 100ms for elapsed time updates
    this.startTime = performance.now();
    this.tickIntervalId = setInterval(() => {
      const elapsed = performance.now() - this.startTime - this.totalPausedMs;
      this.emit({ type: 'tick', elapsed: Math.round(elapsed) });
    }, 100);

    this.setState('recording');
  }

  /**
   * Stop recording and produce the final Blob.
   */
  async stop(): Promise<Blob | null> {
    if (this.state !== 'recording' && this.state !== 'paused') {
      return null;
    }

    this.setState('processing');
    this.clearTimers();

    if (this.useMediaRecorder && this.mediaRecorder) {
      return this.stopMediaRecorder();
    }
    return this.stopFrameCapture();
  }

  /**
   * Pause recording. Frames stop being captured.
   */
  pause(): void {
    if (this.state !== 'recording') return;

    this.pauseTime = performance.now();
    if (this.frameIntervalId != null) {
      clearInterval(this.frameIntervalId);
      this.frameIntervalId = null;
    }
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.pause();
    }

    this.setState('paused');
  }

  /**
   * Resume a paused recording.
   */
  resume(): void {
    if (this.state !== 'paused') return;

    this.totalPausedMs += performance.now() - this.pauseTime;

    if (this.useMediaRecorder && this.mediaRecorder?.state === 'paused') {
      this.mediaRecorder.resume();
    }

    // Restart frame capture interval
    this.frameIntervalId = setInterval(() => {
      this.captureFrame();
    }, 1000 / this.fps);

    this.setState('recording');
  }

  /**
   * Get the current recorder state.
   */
  getState(): RecorderState {
    return this.state;
  }

  /**
   * Get elapsed recording time in milliseconds (excluding pauses).
   */
  getElapsedMs(): number {
    if (this.state === 'idle') return 0;
    const now =
      this.state === 'paused' ? this.pauseTime : performance.now();
    return Math.round(now - this.startTime - this.totalPausedMs);
  }

  // ── Event system ─────────────────────────────────────────

  on(listener: RecorderListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(event: RecorderEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // Ignore listener errors
      }
    }
  }

  private setState(newState: RecorderState): void {
    this.state = newState;
    this.emit({ type: 'stateChange', state: newState });
  }

  // ── MediaRecorder strategy ───────────────────────────────

  private supportsMediaRecorder(): boolean {
    if (typeof MediaRecorder === 'undefined') return false;
    try {
      return MediaRecorder.isTypeSupported(this.mimeType);
    } catch {
      return false;
    }
  }

  private startMediaRecorder(): void {
    if (!this.canvas) return;

    const stream = this.canvas.captureStream(this.fps);
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: this.mimeType,
    });

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.chunks.push(e.data);
      }
    };

    this.mediaRecorder.start(100); // Collect data every 100ms

    // Start frame capture to keep canvas updated
    this.frameIntervalId = setInterval(() => {
      this.captureFrame();
    }, 1000 / this.fps);
  }

  private stopMediaRecorder(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        const blob = new Blob([], { type: this.mimeType });
        this.finalize(blob);
        resolve(blob);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.mimeType });
        this.finalize(blob);
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  // ── Frame capture fallback ───────────────────────────────

  private startFrameCapture(): void {
    this.frameIntervalId = setInterval(() => {
      this.captureFrame();
      // Store data URL for fallback
      if (this.canvas) {
        this.frames.push(this.canvas.toDataURL('image/png'));
      }
    }, 1000 / this.fps);
  }

  private stopFrameCapture(): Blob {
    // Without MediaRecorder we can't produce WebM natively.
    // We'll output as a multi-frame PNG data URI packaged in a JSON manifest
    // that the UI can use to display as a slideshow or the user can use
    // to reconstruct a GIF with external tooling.
    const manifest = JSON.stringify({
      fps: this.fps,
      frameCount: this.frames.length,
      durationMs: this.getElapsedMs(),
      frames: this.frames,
    });
    const blob = new Blob([manifest], { type: 'application/json' });
    this.finalize(blob);
    return blob;
  }

  // ── Frame rendering ──────────────────────────────────────

  private captureFrame(): void {
    if (!this.element || !this.canvas || !this.ctx) return;

    const rect = this.element.getBoundingClientRect();
    const w = Math.round(rect.width * this.scale);
    const h = Math.round(rect.height * this.scale);

    // Resize canvas if element changed size
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }

    // Draw the element's visual content using SVG foreignObject
    // This is a well-known technique for rendering HTML to canvas.
    const svgData = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml"
               style="width:${rect.width}px;height:${rect.height}px;transform:scale(${this.scale});transform-origin:top left;">
            ${this.element.outerHTML}
          </div>
        </foreignObject>
      </svg>`;

    const img = new Image();
    const svgBlob = new Blob([svgData], {
      type: 'image/svg+xml;charset=utf-8',
    });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      this.ctx?.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  // ── Cleanup ──────────────────────────────────────────────

  private clearTimers(): void {
    if (this.frameIntervalId != null) {
      clearInterval(this.frameIntervalId);
      this.frameIntervalId = null;
    }
    if (this.durationTimeoutId != null) {
      clearTimeout(this.durationTimeoutId);
      this.durationTimeoutId = null;
    }
    if (this.tickIntervalId != null) {
      clearInterval(this.tickIntervalId);
      this.tickIntervalId = null;
    }
  }

  private finalize(blob: Blob): void {
    this.clearTimers();
    this.mediaRecorder = null;
    this.element = null;
    this.canvas = null;
    this.ctx = null;
    this.chunks = [];
    this.frames = [];
    this.setState('idle');
    this.emit({ type: 'complete', blob });
  }
}

// ── Utility ──────────────────────────────────────────────────

/**
 * Trigger a browser download of a recorded blob.
 */
export function downloadRecording(
  blob: Blob,
  filename?: string,
): void {
  const ext = blob.type.includes('webm') ? 'webm' : 'json';
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename ?? `architex-recording.${ext}`;
  document.body.appendChild(anchor);
  anchor.click();

  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
