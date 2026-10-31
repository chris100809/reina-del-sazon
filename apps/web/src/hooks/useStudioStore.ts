import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Scene, SceneObject, MeshGeometry, MaterialDefinition, TextureData, PhysicsBody, CameraState, LightDefinition, Transform, ReconstructionResult } from '@reina/core/types';
import { vec3, quat, mat4 } from '@reina/core/math';

interface StudioState {
  scene: Scene;
  reconstructionHistory: ReconstructionResult[];
  activeTool: 'select' | 'translate' | 'rotate' | 'scale' | 'camera' | 'measure' | 'annotate';
  clipboard: SceneObject[];
  undoStack: Scene[];
  redoStack: Scene[];
  maxHistory: number;

  // Scene operations
  setScene: (scene: Scene) => void;
  addObject: (object: SceneObject) => void;
  removeObject: (id: string) => void;
  updateObject: (id: string, updates: Partial<SceneObject>) => void;
  selectObject: (id: string, multi?: boolean) => void;
  selectObjects: (ids: string[]) => void;
  clearSelection: () => void;
  duplicateObject: (id: string) => void;
  deleteSelected: () => void;

  // Geometry operations
  addGeometry: (id: string, geometry: MeshGeometry) => void;
  removeGeometry: (id: string) => void;
  updateGeometry: (id: string, geometry: MeshGeometry) => void;

  // Material operations
  addMaterial: (id: string, material: MaterialDefinition) => void;
  removeMaterial: (id: string) => void;
  updateMaterial: (id: string, material: MaterialDefinition) => void;

  // Texture operations
  addTexture: (id: string, texture: TextureData) => void;
  removeTexture: (id: string) => void;

  // Physics operations
  addPhysicsBody: (id: string, body: PhysicsBody) => void;
  removePhysicsBody: (id: string) => void;
  updatePhysicsBody: (id: string, body: PhysicsBody) => void;

  // Camera operations
  addCamera: (id: string, camera: CameraState) => void;
  setActiveCamera: (id: string | null) => void;

  // Light operations
  addLight: (id: string, light: LightDefinition) => void;
  removeLight: (id: string) => void;
  updateLight: (id: string, light: LightDefinition) => void;

  // Reconstruction
  addReconstructionResult: (result: ReconstructionResult) => void;

  // History
  pushHistory: (scene: Scene) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Tools
  setActiveTool: (tool: StudioState['activeTool']) => void;

  // Clipboard
  copy: () => void;
  paste: () => void;
  cut: () => void;

  // Import/Export
  importScene: (scene: Scene) => void;
  exportScene: () => Scene;
}

const createDefaultScene = (): Scene => ({
  id: `scene-${Date.now()}`,
  name: 'Untitled Scene',
  objects: new Map(),
  geometries: new Map(),
  materials: new Map(),
  textures: new Map(),
  physicsBodies: new Map(),
  cameras: new Map(),
  lights: new Map(),
  rootObjectIds: [],
  activeCameraId: null,
  activeObjectId: null,
  selection: new Set(),
  gizmo: {
    mode: 'translate',
    space: 'world',
    pivot: 'center',
    snap: false,
    snapIncrement: 1,
    axisLock: null,
  },
  viewport: {
    mode: 'solid',
    overlays: [
      { type: 'grid', enabled: true, color: { x: 0.16, y: 0.18, z: 0.22, w: 1 } },
      { type: 'axes', enabled: true },
    ],
  },
  units: 'metric',
  upAxis: 'Y',
  gridSize: 1,
  gridSubdivisions: 10,
});

const defaultCamera: CameraState = {
  position: { x: 10, y: 10, z: 10 },
  target: { x: 0, y: 0, z: 0 },
  up: { x: 0, y: 1, z: 0 },
  fov: 50,
  near: 0.1,
  far: 1000,
  aspect: 1,
  type: 'perspective',
  zoom: 1,
};

export const useStudioStore = create<StudioState>()(
  subscribeWithSelector((set, get) => ({
    scene: createDefaultScene(),
    reconstructionHistory: [],
    activeTool: 'select',
    clipboard: [],
    undoStack: [],
    redoStack: [],
    maxHistory: 50,

    setScene: (scene) => set({ scene }),

    addObject: (object) => set((state) => {
      const newScene = { ...state.scene };
      newScene.objects = new Map(newScene.objects);
      newScene.objects.set(object.id, object);
      if (!object.parentId) {
        newScene.rootObjectIds = [...newScene.rootObjectIds, object.id];
      } else {
        const parent = newScene.objects.get(object.parentId);
        if (parent) {
          parent.childrenIds = [...parent.childrenIds, object.id];
        }
      }
      return { scene: newScene };
    }),

    removeObject: (id) => set((state) => {
      const newScene = { ...state.scene };
      newScene.objects = new Map(newScene.objects);
      const object = newScene.objects.get(id);
      if (object) {
        if (object.parentId) {
          const parent = newScene.objects.get(object.parentId);
          if (parent) {
            parent.childrenIds = parent.childrenIds.filter(c => c !== id);
          }
        } else {
          newScene.rootObjectIds = newScene.rootObjectIds.filter(o => o !== id);
        }
        object.childrenIds.forEach(childId => {
          get().removeObject(childId);
        });
        newScene.objects.delete(id);
        newScene.selection.delete(id);
      }
      return { scene: newScene };
    }),

    updateObject: (id, updates) => set((state) => {
      const newScene = { ...state.scene };
      newScene.objects = new Map(newScene.objects);
      const object = newScene.objects.get(id);
      if (object) {
        newScene.objects.set(id, { ...object, ...updates });
      }
      return { scene: newScene };
    }),

    selectObject: (id, multi = false) => set((state) => {
      const newScene = { ...state.scene };
      newScene.selection = new Set(newScene.selection);
      if (multi) {
        if (newScene.selection.has(id)) {
          newScene.selection.delete(id);
        } else {
          newScene.selection.add(id);
        }
      } else {
        newScene.selection.clear();
        newScene.selection.add(id);
      }
      newScene.activeObjectId = newScene.selection.size === 1 ? id : null;
      return { scene: newScene };
    }),

    selectObjects: (ids) => set((state) => {
      const newScene = { ...state.scene };
      newScene.selection = new Set(ids);
      newScene.activeObjectId = ids.length === 1 ? ids[0] : null;
      return { scene: newScene };
    }),

    clearSelection: () => set((state) => {
      const newScene = { ...state.scene };
      newScene.selection.clear();
      newScene.activeObjectId = null;
      return { scene: newScene };
    }),

    duplicateObject: (id) => {
      const state = get();
      const object = state.scene.objects.get(id);
      if (!object) return;

      const newObject: SceneObject = {
        ...object,
        id: `${object.id}-copy-${Date.now()}`,
        name: `${object.name} (copy)`,
        transform: { ...object.transform, position: vec3(object.transform.position.x + 1, object.transform.position.y, object.transform.position.z) },
        childrenIds: [],
      };

      get().addObject(newObject);
      get().selectObject(newObject.id);
    },

    deleteSelected: () => {
      const state = get();
      state.scene.selection.forEach(id => state.removeObject(id));
      state.clearSelection();
    },

    addGeometry: (id, geometry) => set((state) => {
      const newScene = { ...state.scene };
      newScene.geometries = new Map(newScene.geometries);
      newScene.geometries.set(id, geometry);
      return { scene: newScene };
    }),

    removeGeometry: (id) => set((state) => {
      const newScene = { ...state.scene };
      newScene.geometries = new Map(newScene.geometries);
      newScene.geometries.delete(id);
      return { scene: newScene };
    }),

    updateGeometry: (id, geometry) => set((state) => {
      const newScene = { ...state.scene };
      newScene.geometries = new Map(newScene.geometries);
      newScene.geometries.set(id, geometry);
      return { scene: newScene };
    }),

    addMaterial: (id, material) => set((state) => {
      const newScene = { ...state.scene };
      newScene.materials = new Map(newScene.materials);
      newScene.materials.set(id, material);
      return { scene: newScene };
    }),

    removeMaterial: (id) => set((state) => {
      const newScene = { ...state.scene };
      newScene.materials = new Map(newScene.materials);
      newScene.materials.delete(id);
      return { scene: newScene };
    }),

    updateMaterial: (id, material) => set((state) => {
      const newScene = { ...state.scene };
      newScene.materials = new Map(newScene.materials);
      newScene.materials.set(id, material);
      return { scene: newScene };
    }),

    addTexture: (id, texture) => set((state) => {
      const newScene = { ...state.scene };
      newScene.textures = new Map(newScene.textures);
      newScene.textures.set(id, texture);
      return { scene: newScene };
    }),

    removeTexture: (id) => set((state) => {
      const newScene = { ...state.scene };
      newScene.textures = new Map(newScene.textures);
      newScene.textures.delete(id);
      return { scene: newScene };
    }),

    addPhysicsBody: (id, body) => set((state) => {
      const newScene = { ...state.scene };
      newScene.physicsBodies = new Map(newScene.physicsBodies);
      newScene.physicsBodies.set(id, body);
      return { scene: newScene };
    }),

    removePhysicsBody: (id) => set((state) => {
      const newScene = { ...state.scene };
      newScene.physicsBodies = new Map(newScene.physicsBodies);
      newScene.physicsBodies.delete(id);
      return { scene: newScene };
    }),

    updatePhysicsBody: (id, body) => set((state) => {
      const newScene = { ...state.scene };
      newScene.physicsBodies = new Map(newScene.physicsBodies);
      newScene.physicsBodies.set(id, body);
      return { scene: newScene };
    }),

    addCamera: (id, camera) => set((state) => {
      const newScene = { ...state.scene };
      newScene.cameras = new Map(newScene.cameras);
      newScene.cameras.set(id, camera);
      return { scene: newScene };
    }),

    setActiveCamera: (id) => set((state) => {
      const newScene = { ...state.scene };
      newScene.activeCameraId = id;
      return { scene: newScene };
    }),

    addLight: (id, light) => set((state) => {
      const newScene = { ...state.scene };
      newScene.lights = new Map(newScene.lights);
      newScene.lights.set(id, light);
      return { scene: newScene };
    }),

    removeLight: (id) => set((state) => {
      const newScene = { ...state.scene };
      newScene.lights = new Map(newScene.lights);
      newScene.lights.delete(id);
      return { scene: newScene };
    }),

    updateLight: (id, light) => set((state) => {
      const newScene = { ...state.scene };
      newScene.lights = new Map(newScene.lights);
      newScene.lights.set(id, light);
      return { scene: newScene };
    }),

    addReconstructionResult: (result) => set((state) => ({
      reconstructionHistory: [...state.reconstructionHistory, result].slice(-20),
    })),

    pushHistory: (scene) => set((state) => {
      const newUndoStack = [...state.undoStack, state.scene].slice(-state.maxHistory);
      return { undoStack: newUndoStack, redoStack: [] };
    }),

    undo: () => set((state) => {
      if (state.undoStack.length === 0) return state;
      const previousScene = state.undoStack[state.undoStack.length - 1];
      const newUndoStack = state.undoStack.slice(0, -1);
      return {
        scene: previousScene,
        undoStack: newUndoStack,
        redoStack: [state.scene, ...state.redoStack].slice(-state.maxHistory),
      };
    }),

    redo: () => set((state) => {
      if (state.redoStack.length === 0) return state;
      const nextScene = state.redoStack[0];
      const newRedoStack = state.redoStack.slice(1);
      return {
        scene: nextScene,
        undoStack: [...state.undoStack, state.scene].slice(-state.maxHistory),
        redoStack: newRedoStack,
      };
    }),

    canUndo: () => get().undoStack.length > 0,
    canRedo: () => get().redoStack.length > 0,

    setActiveTool: (tool) => set({ activeTool: tool }),

    copy: () => {
      const state = get();
      state.clipboard = Array.from(state.scene.selection).map(id => state.scene.objects.get(id)!).filter(Boolean);
    },

    paste: () => {
      const state = get();
      state.clipboard.forEach(obj => {
        const newObj = { ...obj, id: `${obj.id}-paste-${Date.now()}`, name: `${obj.name} (paste)` };
        state.addObject(newObj);
      });
    },

    cut: () => {
      get().copy();
      get().deleteSelected();
    },

    importScene: (scene) => set({ scene }),

    exportScene: () => get().scene,
  }))
);

export const useScene = () => useStudioStore(state => state.scene);
export const useSelection = () => useStudioStore(state => state.scene.selection);
export const useActiveObject = () => useStudioStore(state => state.scene.activeObjectId);
export const useActiveTool = () => useStudioStore(state => state.activeTool);
export const useReconstructionHistory = () => useStudioStore(state => state.reconstructionHistory);