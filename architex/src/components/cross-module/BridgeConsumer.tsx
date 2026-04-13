"use client";

// ─────────────────────────────────────────────────────────────
// Architex — Bridge Consumer Component (CROSS-004)
// Watches for pending bridges and applies them.
// ─────────────────────────────────────────────────────────────

import { memo, useEffect, useState, useCallback } from "react";
import { useCrossModuleStore } from "@/stores/cross-module-store";
import { dispatchBridge } from "@/lib/cross-module/bridge-handlers";
import type { BridgeHandlerResult } from "@/lib/cross-module/bridge-handlers";
import type { BridgePayload } from "@/lib/cross-module/bridge-types";
import { ContextDrawer } from "./ContextDrawer";

export const BridgeConsumer = memo(function BridgeConsumer() {
  const pendingBridge = useCrossModuleStore((s) => s.pendingBridge);
  const activeContext = useCrossModuleStore((s) => s.activeContext);
  const clearBridge = useCrossModuleStore((s) => s.clearBridge);

  const [activeBridge, setActiveBridge] = useState<BridgePayload | null>(null);
  const [handlerResult, setHandlerResult] = useState<BridgeHandlerResult | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Process pending bridge when it arrives
  useEffect(() => {
    if (!pendingBridge) return;

    const result = dispatchBridge(pendingBridge);
    setActiveBridge(pendingBridge);
    setHandlerResult(result);
    setDrawerOpen(true);

    // Clear the pending bridge so it is not re-processed
    clearBridge();
  }, [pendingBridge, clearBridge]);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
    setActiveBridge(null);
    setHandlerResult(null);
  }, []);

  const handleSimulate = useCallback(() => {
    // Simulation trigger is handled by the ContextDrawer internally;
    // this callback can be extended to start a simulation run.
    setDrawerOpen(false);
  }, []);

  if (!drawerOpen || !activeBridge || !handlerResult) return null;

  return (
    <ContextDrawer
      bridge={activeBridge}
      result={handlerResult}
      context={activeContext}
      onSimulate={handleSimulate}
      onGoBack={handleCloseDrawer}
      onClose={handleCloseDrawer}
    />
  );
});
