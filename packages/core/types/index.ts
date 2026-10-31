export interface Vec2 { x: number; y: number }
export interface Vec3 { x: number; y: number; z: number }
export interface Vec4 { x: number; y: number; z: number; w: number }
export interface Quat { x: number; y: number; z: number; w: number }
export interface Mat3 { elements: Float32Array }
export interface Mat4 { elements: Float32Array }
export interface Euler { x: number; y: number; z: number; order: 'XYZ' | 'YXZ' | 'ZXY' | 'ZYX' | 'YZX' | 'XZY' }
export interface Box3 { min: Vec3; max: Vec3 }
export interface Sphere { center: Vec3; radius: number }
export interface Plane { normal: Vec3; constant: number }
export interface Ray { origin: Vec3; direction: Vec3 }
export interface Triangle { a: Vec3; b: Vec3; c: Vec3 }

export type ColorRepresentation = number | string | Vec3 | Vec4;
export type TextureMapping = 'UV' | 'Cube' | 'Equirectangular' | 'Spherical';
export type WrappingMode = 'ClampToEdge' | 'Repeat' | 'MirroredRepeat';
export type FilterMode = 'Nearest' | 'Linear' | 'NearestMipmapNearest' | 'LinearMipmapNearest' | 'NearestMipmapLinear' | 'LinearMipmapLinear';

export interface Transform {
  position: Vec3;
  rotation: Quat;
  scale: Vec3;
}

export interface BoundingBox {
  min: Vec3;
  max: Vec3;
  center: Vec3;
  size: Vec3;
}

export interface MeshGeometry {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  indices: Uint32Array | Uint16Array;
  groups: MeshGroup[];
  boundingBox: BoundingBox;
  boundingSphere: Sphere;
}

export interface MeshGroup {
  start: number;
  count: number;
  materialIndex: number;
}

export interface MaterialDefinition {
  id: string;
  name: string;
  type: 'pbr' | 'unlit' | 'subsurface' | 'transmission' | 'custom';
  properties: MaterialProperties;
  textures: MaterialTextures;
  shaderNodeGraph?: NodeGraph;
}

export interface MaterialProperties {
  baseColor: Vec4;
  metallic: number;
  roughness: number;
  emissive: Vec3;
  emissiveIntensity: number;
  normalScale: number;
  occlusionStrength: number;
  clearcoat: number;
  clearcoatRoughness: number;
  sheen: number;
  sheenColor: Vec3;
  anisotropy: number;
  anisotropyRotation: number;
  iridescence: number;
  iridescenceIOR: number;
  iridescenceThickness: number;
  transmission: number;
  thickness: number;
  attenuationDistance: number;
  attenuationColor: Vec3;
  specularColor: Vec3;
  specularIntensity: number;
}

export interface MaterialTextures {
  baseColor: TextureSlot | null;
  metallicRoughness: TextureSlot | null;
  normal: TextureSlot | null;
  occlusion: TextureSlot | null;
  emissive: TextureSlot | null;
  clearcoat: TextureSlot | null;
  clearcoatRoughness: TextureSlot | null;
  clearcoatNormal: TextureSlot | null;
  sheen: TextureSlot | null;
  sheenColor: TextureSlot | null;
  anisotropy: TextureSlot | null;
  iridescence: TextureSlot | null;
  transmission: TextureSlot | null;
  thickness: TextureSlot | null;
  specular: TextureSlot | null;
}

export interface TextureSlot {
  textureId: string;
  texCoord: number;
  scale: Vec2;
  offset: Vec2;
  rotation: number;
}

export interface NodeGraph {
  nodes: ShaderNode[];
  edges: ShaderEdge[];
  outputs: ShaderOutput[];
}

export interface ShaderNode {
  id: string;
  type: string;
  position: Vec2;
  data: Record<string, unknown>;
  inputs: NodePort[];
  outputs: NodePort[];
}

export interface ShaderEdge {
  id: string;
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
}

export interface ShaderOutput {
  nodeId: string;
  outputName: string;
  target: 'fragment' | 'vertex' | 'compute';
}

export interface NodePort {
  name: string;
  type: 'float' | 'vec2' | 'vec3' | 'vec4' | 'mat3' | 'mat4' | 'texture' | 'sampler' | 'bool' | 'int';
  defaultValue?: unknown;
}

export interface CameraState {
  position: Vec3;
  target: Vec3;
  up: Vec3;
  fov: number;
  near: number;
  far: number;
  aspect: number;
  type: 'perspective' | 'orthographic';
  zoom: number;
}

export interface ViewportShading {
  mode: 'wireframe' | 'solid' | 'material' | 'rendered' | 'matcap' | 'custom';
  matcapTexture?: string;
  overlays: ViewportOverlay[];
}

export interface ViewportOverlay {
  type: 'grid' | 'axes' | 'bounds' | 'normals' | 'uv' | 'curvature' | 'wireframe' | 'custom';
  enabled: boolean;
  color?: Vec4;
  scale?: number;
}

export interface GizmoState {
  mode: 'translate' | 'rotate' | 'scale' | 'none';
  space: 'world' | 'local' | 'view';
  pivot: 'center' | 'cursor' | 'active' | 'median';
  snap: boolean;
  snapIncrement: number;
  axisLock: 'X' | 'Y' | 'Z' | null;
}

export interface SceneObject {
  id: string;
  name: string;
  type: 'mesh' | 'camera' | 'light' | 'empty' | 'group' | 'armature' | 'curve' | 'surface' | 'metaball' | 'font' | 'volume';
  transform: Transform;
  visible: boolean;
  selectable: boolean;
  locked: boolean;
  parentId: string | null;
  childrenIds: string[];
  geometryId: string | null;
  materialIds: string[];
  physicsBodyId: string | null;
  customProperties: Record<string, unknown>;
}

export interface Scene {
  id: string;
  name: string;
  objects: Map<string, SceneObject>;
  geometries: Map<string, MeshGeometry>;
  materials: Map<string, MaterialDefinition>;
  textures: Map<string, TextureData>;
  physicsBodies: Map<string, PhysicsBody>;
  cameras: Map<string, CameraState>;
  lights: Map<string, LightDefinition>;
  rootObjectIds: string[];
  activeCameraId: string | null;
  activeObjectId: string | null;
  selection: Set<string>;
  gizmo: GizmoState;
  viewport: ViewportShading;
  units: 'metric' | 'imperial';
  upAxis: 'Y' | 'Z';
  gridSize: number;
  gridSubdivisions: number;
}

export interface TextureData {
  id: string;
  name: string;
  width: number;
  height: number;
  format: 'rgba8' | 'rgba16f' | 'rgba32f' | 'r8' | 'r16f' | 'r32f' | 'rg8' | 'rg16f' | 'rg32f';
  data: ArrayBufferView | null;
  url: string | null;
  mipmaps: boolean;
  anisotropy: number;
  wrapS: WrappingMode;
  wrapT: WrappingMode;
  magFilter: FilterMode;
  minFilter: FilterMode;
  colorSpace: 'srgb' | 'linear' | 'hdr';
}

export interface LightDefinition {
  id: string;
  name: string;
  type: 'ambient' | 'directional' | 'point' | 'spot' | 'rect' | 'hemisphere' | 'probe';
  color: Vec3;
  intensity: number;
  distance: number;
  decay: number;
  angle: number;
  penumbra: number;
  target: Vec3;
  castShadow: boolean;
  shadowMapSize: number;
  shadowBias: number;
  shadowNormalBias: number;
  shadowRadius: number;
  contactShadows: boolean;
  volumetric: boolean;
}

export interface PhysicsBody {
  id: string;
  type: 'rigid' | 'soft' | 'kinematic' | 'static';
  mass: number;
  friction: number;
  restitution: number;
  linearDamping: number;
  angularDamping: number;
  gravityScale: number;
  collisionShape: CollisionShape;
  position: Vec3;
  rotation: Quat;
  linearVelocity: Vec3;
  angularVelocity: Vec3;
  force: Vec3;
  torque: Vec3;
  sleepThreshold: number;
  ccdEnabled: boolean;
  groups: number;
  mask: number;
}

export interface CollisionShape {
  type: 'box' | 'sphere' | 'capsule' | 'cylinder' | 'cone' | 'convex' | 'trimesh' | 'heightfield';
  halfExtents?: Vec3;
  radius?: number;
  height?: number;
  vertices?: Float32Array;
  indices?: Uint32Array;
}

export interface PhysicsScene {
  gravity: Vec3;
  timeStep: number;
  subSteps: number;
  bodies: Map<string, PhysicsBody>;
  joints: Map<string, PhysicsJoint>;
  broadPhase: 'sap' | 'mpr' | 'brute';
  narrowPhase: 'gjk' | 'sat';
  ccdEnabled: boolean;
  sleepEnabled: boolean;
}

export interface PhysicsJoint {
  id: string;
  type: 'fixed' | 'revolute' | 'prismatic' | 'spherical' | 'distance' | 'spring' | 'motor';
  bodyA: string;
  bodyB: string;
  localAnchorA: Vec3;
  localAnchorB: Vec3;
  localAxisA?: Vec3;
  localAxisB?: Vec3;
  limits?: { min: number; max: number };
  motor?: { targetVelocity: number; maxForce: number };
  spring?: { stiffness: number; damping: number };
}

export interface ReconstructionInput {
  image: HTMLImageElement | ImageBitmap | ArrayBuffer | string;
  options: ReconstructionOptions;
}

export interface ReconstructionOptions {
  depthModel: string;
  meshMethod: 'poisson' | 'marching_cubes' | 'delaunay' | 'tetrahedral';
  meshDepth: number;
  samples: number;
  generateInterior: boolean;
  interiorType: 'vehicle' | 'architectural' | 'product' | 'organic';
  enhancePredictive: boolean;
  enhanceTypes: ('aerodynamic' | 'ergonomic' | 'aesthetic' | 'structural')[];
  uvUnwrap: boolean;
  uvAtlasSize: number;
  targetPolycount: number;
  simplify: boolean;
  watermark: boolean;
}

export interface ReconstructionResult {
  mesh: MeshGeometry;
  interior: MeshGeometry | null;
  materials: MaterialDefinition[];
  textures: TextureData[];
  uvMaps: UVMap[];
  depthMap: Float32Array;
  confidenceMap: Float32Array;
  normalsMap: Float32Array;
  metadata: ReconstructionMetadata;
}

export interface UVMap {
  name: string;
  uvs: Float32Array;
  atlasSize: number;
  charts: UVChart[];
}

export interface UVChart {
  id: number;
  faces: Uint32Array;
  bounds: { min: Vec2; max: Vec2 };
  area: number;
}

export interface ReconstructionMetadata {
  inputWidth: number;
  inputHeight: number;
  processingTime: number;
  depthModel: string;
  meshMethod: string;
  vertexCount: number;
  faceCount: number;
  materialCount: number;
  textureCount: number;
  interiorGenerated: boolean;
  enhancementsApplied: string[];
  warnings: string[];
}

export interface ExportOptions {
  format: 'gltf' | 'glb' | 'usdz' | 'obj' | 'stl' | '3mf' | 'ply' | 'fbx' | 'dae';
  includeMaterials: boolean;
  includeTextures: boolean;
  includeAnimations: boolean;
  includeCameras: boolean;
  includeLights: boolean;
  binary: boolean;
  dracoCompression: boolean;
  meshoptCompression: boolean;
  textureFormat: 'png' | 'jpg' | 'webp' | 'ktx2' | 'basis';
  textureQuality: number;
  maxTextureSize: number;
  embedBuffers: boolean;
  upAxis: 'Y' | 'Z';
  units: 'metric' | 'imperial';
}

export interface ProjectFile {
  version: string;
  scene: Scene;
  reconstructionHistory: ReconstructionResult[];
  settings: UserSettings;
  createdAt: string;
  updatedAt: string;
  author: string;
}

export interface UserSettings {
  theme: 'dark' | 'light' | 'system';
  language: string;
  units: 'metric' | 'imperial';
  upAxis: 'Y' | 'Z';
  gridSize: number;
  gridSubdivisions: number;
  autoSave: boolean;
  autoSaveInterval: number;
  viewport: {
    defaultShading: ViewportShading['mode'];
    showGrid: boolean;
    showAxes: boolean;
    showBounds: boolean;
    showWireframe: boolean;
    matcap: string;
  };
  gizmo: {
    defaultMode: GizmoState['mode'];
    defaultSpace: GizmoState['space'];
    defaultPivot: GizmoState['pivot'];
    snapEnabled: boolean;
    snapIncrement: number;
  };
  performance: {
    maxFPS: number;
    shadows: boolean;
    ssao: boolean;
    ssr: boolean;
    taa: boolean;
    fxaa: boolean;
    bloom: boolean;
    dof: boolean;
    motionBlur: boolean;
  };
  shortcuts: Record<string, string>;
  panels: PanelLayout[];
}

export interface PanelLayout {
  id: string;
  type: 'viewport' | 'outliner' | 'properties' | 'nodes' | 'console' | 'timeline' | 'assetBrowser' | 'shaderEditor';
  position: { x: number; y: number; width: number; height: number };
  tabIndex: number;
  visible: boolean;
  collapsed: boolean;
}