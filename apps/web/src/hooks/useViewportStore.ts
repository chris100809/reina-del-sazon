import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { ViewportShading, ViewportOverlay, GizmoState, CameraState } from '@reina/core/types';

interface ViewportState {
  shading: ViewportShading['mode'];
  overlays: ViewportOverlay[];
  gizmo: GizmoState;
  activeCamera: string | null;
  cameras: Map<string, CameraState>;
  renderStats: {
    fps: number;
    triangles: number;
    drawCalls: number;
    geometries: number;
    textures: number;
    memory: number;
  };

  // Shading
  setShading: (mode: ViewportShading['mode']) => void;
  toggleOverlay: (type: ViewportOverlay['type']) => void;
  setOverlayEnabled: (type: ViewportOverlay['type'], enabled: boolean) => void;
  updateOverlay: (type: ViewportOverlay['type'], updates: Partial<ViewportOverlay>) => void;

  // Gizmo
  setGizmoMode: (mode: GizmoState['mode']) => void;
  setGizmoSpace: (space: GizmoState['space']) => void;
  setGizmoPivot: (pivot: GizmoState['pivot']) => void;
  setGizmoSnap: (snap: boolean) => void;
  setGizmoSnapIncrement: (increment: number) => void;
  setGizmoAxisLock: (axis: GizmoState['axisLock']) => void;

  // Camera
  setActiveCamera: (id: string | null) => void;
  addCamera: (id: string, camera: CameraState) => void;
  updateCamera: (id: string, camera: Partial<CameraState>) => void;

  // Render stats
  updateRenderStats: (stats: Partial<ViewportState['renderStats']>) => void;

  // Viewport actions
  frameAll: () => void;
  frameSelected: () => void;
  toggleFullscreen: () => void;
  screenshot: () => Promise<Blob>;
}

const defaultGizmo: GizmoState = {
  mode: 'translate',
  space: 'world',
  pivot: 'center',
  snap: false,
  snapIncrement: 1,
  axisLock: null,
};

const defaultOverlays: ViewportOverlay[] = [
  { type: 'grid', enabled: true, color: { x: 0.16, y: 0.18, z: 0.22, w: 1 } },
  { type: 'axes', enabled: true },
  { type: 'bounds', enabled: false },
  { type: 'normals', enabled: false },
  { type: 'uv', enabled: false },
  { type: 'curvature', enabled: false },
  { type: 'wireframe', enabled: false },
];

export const useViewportStore = create<ViewportState>()(
  subscribeWithSelector((set, get) => ({
    shading: 'solid',
    overlays: defaultOverlays,
    gizmo: defaultGizmo,
    activeCamera: 'perspective',
    cameras: new Map(),
    renderStats: {
      fps: 0,
      triangles: 0,
      drawCalls: 0,
      geometries: 0,
      textures: 0,
      memory: 0,
    },

    setShading: (mode) => set({ shading: mode }),

    toggleOverlay: (type) => set((state) => ({
      overlays: state.overlays.map(o => o.type === type ? { ...o, enabled: !o.enabled } : o),
    })),

    setOverlayEnabled: (type, enabled) => set((state) => ({
      overlays: state.overlays.map(o => o.type === type ? { ...o, enabled } : o),
    })),

    updateOverlay: (type, updates) => set((state) => ({
      overlays: state.overlays.map(o => o.type === type ? { ...o, ...updates } : o),
    })),

    setGizmoMode: (mode) => set((state) => ({ gizmo: { ...state.gizmo, mode } })),
    setGizmoSpace: (space) => set((state) => ({ gizmo: { ...state.gizmo, space } })),
    setGizmoPivot: (pivot) => set((state) => ({ gizmo: { ...state.gizmo, pivot } })),
    setGizmoSnap: (snap) => set((state) => ({ gizmo: { ...state.gizmo, snap } })),
    setGizmoSnapIncrement: (increment) => set((state) => ({ gizmo: { ...state.gizmo, snapIncrement: increment } })),
    setGizmoAxisLock: (axisLock) => set((state) => ({ gizmo: { ...state.gizmo, axisLock } })),

    setActiveCamera: (id) => set({ activeCamera: id }),

    addCamera: (id, camera) => set((state) => {
      const newCameras = new Map(state.cameras);
      newCameras.set(id, camera);
      return { cameras: newCameras };
    }),

    updateCamera: (id, camera) => set((state) => {
      const newCameras = new Map(state.cameras);
      const existing = newCameras.get(id);
      if (existing) {
        newCameras.set(id, { ...existing, ...camera });
      }
      return { cameras: newCameras };
    }),

    updateRenderStats: (stats) => set((state) => ({
      renderStats: { ...state.renderStats, ...stats },
    })),

    frameAll: () => {
      // Implementation would frame all objects in scene
      console.log('Frame all');
    },

    frameSelected: () => {
      // Implementation would frame selected objects
      console.log('Frame selected');
    },

    toggleFullscreen: () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    },

    screenshot: async () => {
      const { gl } = require('@react-three/fiber').useThree();
      return new Promise<Blob>((resolve) => {
        gl.domElement.toBlob((blob) => resolve(blob!), 'image/png');
      });
    },
  }))
);

export const useShading = () => useViewportStore(state => state.shading);
export const useOverlays = () => useViewportStore(state => state.overlays);
export const useGizmo = () => useViewportStore(state => state.gizmo);
export const useActiveCamera = () => useViewportStore(state => state.activeCamera);
export const useRenderStats = () => useViewportStore(state => state.renderStats);