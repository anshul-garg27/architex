'use client';

import { useCallback } from 'react';

import { useCanvasStore } from '@/stores/canvas-store';
import { useSimulationStore } from '@/stores/simulation-store';
import { usePredictionStore } from '@/stores/prediction-store';

/** Fresh runs on architectures this size or larger ask for a prediction first. */
const PREDICTION_MIN_NODES = 3;

/**
 * Shared "run / pause" entry point for the simulation.
 *
 * Single source of truth for the toolbar play button and any other
 * "Run simulation" affordance (e.g. the Metrics tab empty state):
 * - running        → pause
 * - paused         → resume directly
 * - fresh run with >= 3 nodes → open the PredictionModal first
 *   (the modal's own buttons call play())
 * - otherwise      → play directly
 */
export function useRunSimulation(): () => void {
  const simStatus = useSimulationStore((s) => s.status);
  const play = useSimulationStore((s) => s.play);
  const pause = useSimulationStore((s) => s.pause);
  const nodeCount = useCanvasStore((s) => s.nodes.length);
  const openPredictionModal = usePredictionStore((s) => s.openModal);

  return useCallback(() => {
    if (simStatus === 'running') {
      pause();
      return;
    }
    // Fresh run on a real architecture: capture a falsifiable prediction first.
    if (simStatus !== 'paused' && nodeCount >= PREDICTION_MIN_NODES) {
      openPredictionModal();
      return;
    }
    play();
  }, [simStatus, play, pause, nodeCount, openPredictionModal]);
}
