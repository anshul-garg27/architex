"use client";

import { memo, useMemo, useCallback, type ReactNode } from "react";
import {
  Panel,
  Group,
  Separator,
} from "react-resizable-panels";
import { useUIStore } from "@/stores/ui-store";
import { useIsMobile } from "@/hooks/use-media-query";
import { ActivityBar } from "./activity-bar";
import { StatusBar } from "./status-bar";
import { Breadcrumb, type BreadcrumbItem } from "./Breadcrumb";
import { MODULE_LABELS } from "@/lib/cross-module/bridge-types";
import { BottomSheet } from "@/components/mobile/BottomSheet";
import { FloatingActionButton } from "@/components/mobile/FloatingActionButton";
import { MobileAdvisory } from "@/components/mobile/MobileAdvisory";
import { PropertiesSheet } from "@/components/mobile/PropertiesSheet";
import { useCanvasStore } from "@/stores/canvas-store";

interface WorkspaceLayoutProps {
  sidebar: ReactNode;
  canvas: ReactNode;
  properties: ReactNode;
  bottomPanel: ReactNode;
  /** Optional breadcrumb context supplied by the active module. */
  breadcrumb?: { section?: string; topic?: string };
}

function ResizeHandle({
  orientation = "vertical",
}: {
  orientation?: "vertical" | "horizontal";
}) {
  return (
    <Separator
      className={
        orientation === "vertical"
          ? "group relative w-px bg-border transition-colors data-[resize-handle-active]:bg-primary hover:bg-primary/50"
          : "group relative h-px bg-border transition-colors data-[resize-handle-active]:bg-primary hover:bg-primary/50"
      }
    >
      <div
        className={
          orientation === "vertical"
            ? "absolute inset-y-0 -left-1 -right-1 z-10"
            : "absolute inset-x-0 -top-1 -bottom-1 z-10"
        }
      />
    </Separator>
  );
}

// ── Mobile Layout ────────────────────────────────────────────────
// Canvas takes full width; sidebar & properties hidden by default;
// activity bar renders as a horizontal bottom nav.

const MobileWorkspaceLayout = memo(function MobileWorkspaceLayout({
  canvas,
  sidebar,
}: Pick<WorkspaceLayoutProps, "canvas" | "sidebar">) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const selectedNodeIds = useCanvasStore((s) => s.selectedNodeIds);

  // Properties sheet opens automatically when exactly one node is selected
  const propertiesSheetOpen = selectedNodeIds.length === 1;

  const handleSheetClose = useCallback(() => {
    if (sidebarOpen) toggleSidebar();
  }, [sidebarOpen, toggleSidebar]);

  const handlePropertiesClose = useCallback(() => {
    useCanvasStore.getState().clearSelection();
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
      {/* Mobile advisory (shown once) */}
      <MobileAdvisory />

      {/* Full-width canvas */}
      <main aria-label="Canvas" data-onboarding="canvas" className="flex-1 overflow-hidden">
        {canvas}
      </main>

      {/* Sidebar content in bottom sheet */}
      <BottomSheet open={sidebarOpen} onClose={handleSheetClose} defaultSnap="half">
        {sidebar}
      </BottomSheet>

      {/* Properties sheet — auto-opens when a node is selected */}
      <PropertiesSheet open={propertiesSheetOpen} onClose={handlePropertiesClose} />

      {/* FAB for quick actions */}
      <FloatingActionButton />

      {/* Bottom navigation (activity bar) */}
      <ActivityBar />
    </div>
  );
});

// ── Desktop Layout ───────────────────────────────────────────────

const DesktopWorkspaceLayout = memo(function DesktopWorkspaceLayout({
  sidebar,
  canvas,
  properties,
  bottomPanel,
  breadcrumb,
}: WorkspaceLayoutProps) {
  const activeModule = useUIStore((s) => s.activeModule);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const propertiesPanelOpen = useUIStore((s) => s.propertiesPanelOpen);
  const bottomPanelOpen = useUIStore((s) => s.bottomPanelOpen);

  // Build breadcrumb items from active module + optional section/topic
  const breadcrumbItems = useMemo((): BreadcrumbItem[] | null => {
    const moduleName = MODULE_LABELS[activeModule] ?? activeModule;
    const items: BreadcrumbItem[] = [{ label: moduleName }];
    if (breadcrumb?.section) {
      // Module name becomes a link when there are deeper segments
      items[0] = { label: moduleName, href: "/" };
      items.push({ label: breadcrumb.section });
    }
    if (breadcrumb?.topic) {
      // Section also becomes non-link text, topic is current
      if (items.length === 2) {
        // section exists -- keep it as intermediate text (no href)
      }
      items.push({ label: breadcrumb.topic });
    }
    // Only show breadcrumb when there's more than just the module name
    return items.length > 1 ? items : null;
  }, [activeModule, breadcrumb]);

  // Compute default layouts
  const horizontalLayout = useMemo((): Record<string, number> => {
    if (sidebarOpen && propertiesPanelOpen)
      return { sidebar: 18, center: 62, properties: 20 };
    if (sidebarOpen) return { sidebar: 18, center: 82 };
    if (propertiesPanelOpen) return { center: 80, properties: 20 };
    return { center: 100 };
  }, [sidebarOpen, propertiesPanelOpen]);

  const verticalLayout = useMemo(
    (): Record<string, number> =>
      bottomPanelOpen ? { canvas: 70, bottom: 30 } : { canvas: 100 },
    [bottomPanelOpen],
  );

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
      {/* Breadcrumb trail (only when section/topic context exists) */}
      {breadcrumbItems && (
        <div className="shrink-0 border-b border-border px-4 py-1 [&_nav]:mb-0">
          <Breadcrumb items={breadcrumbItems} />
        </div>
      )}

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar (always visible) */}
        <ActivityBar />

        {/* Horizontal panel group: Sidebar | Canvas + Bottom | Properties */}
        <Group
          key={`h-${sidebarOpen}-${propertiesPanelOpen}`}
          orientation="horizontal"
          className="flex-1"
          defaultLayout={horizontalLayout}
        >
          {/* Sidebar */}
          {sidebarOpen && (
            <>
              <Panel
                id="sidebar"
                defaultSize="260px"
                minSize="180px"
                maxSize="400px"
                collapsible
              >
                <aside aria-label="Component palette" data-onboarding="component-palette" className="h-full overflow-y-auto bg-sidebar">
                  {sidebar}
                </aside>
              </Panel>
              <ResizeHandle orientation="vertical" />
            </>
          )}

          {/* Center: Canvas + Bottom Panel */}
          <Panel id="center" minSize="30%">
            <Group key={`v-${bottomPanelOpen}`} orientation="vertical" defaultLayout={verticalLayout}>
              {/* Main Canvas */}
              <Panel id="canvas" minSize="30%">
                <main id="main-content" aria-label="Canvas" data-onboarding="canvas" className="h-full w-full overflow-hidden">{canvas}</main>
              </Panel>

              {/* Bottom Panel */}
              {bottomPanelOpen && (
                <>
                  <ResizeHandle orientation="horizontal" />
                  <Panel
                    id="bottom"
                    defaultSize="30%"
                    minSize="10%"
                    maxSize="50%"
                    collapsible
                  >
                    <div className="h-full overflow-hidden bg-surface">
                      {bottomPanel}
                    </div>
                  </Panel>
                </>
              )}
            </Group>
          </Panel>

          {/* Properties Panel */}
          {propertiesPanelOpen && (
            <>
              <ResizeHandle orientation="vertical" />
              <Panel
                id="properties"
                defaultSize="280px"
                minSize="200px"
                maxSize="400px"
                collapsible
              >
                <aside aria-label="Properties" className="h-full overflow-y-auto bg-sidebar">
                  {properties}
                </aside>
              </Panel>
            </>
          )}
        </Group>
      </div>

      {/* Status Bar */}
      <StatusBar />
    </div>
  );
});

// ── Exported responsive layout ───────────────────────────────────

export const WorkspaceLayout = memo(function WorkspaceLayout(props: WorkspaceLayoutProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileWorkspaceLayout canvas={props.canvas} sidebar={props.sidebar} />;
  }

  return <DesktopWorkspaceLayout {...props} />;
});
