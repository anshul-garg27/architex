import { create } from "zustand";

interface ViewportState {
  x: number;
  y: number;
  zoom: number;

  setViewport: (viewport: { x: number; y: number; zoom: number }) => void;
  setZoom: (zoom: number) => void;
  resetViewport: () => void;
}

export const useViewportStore = create<ViewportState>()((set) => ({
  x: 0,
  y: 0,
  zoom: 1,

  setViewport: ({ x, y, zoom }) => set({ x, y, zoom }),
  setZoom: (zoom) => set({ zoom }),
  resetViewport: () => set({ x: 0, y: 0, zoom: 1 }),
}));
