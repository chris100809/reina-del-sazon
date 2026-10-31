import * as v from 'valibot';
import type {
  Vec2, Vec3, Vec4, Quat, Mat3, Mat4, Euler, Box3, Sphere, Plane, Ray, Triangle,
  Transform, BoundingBox, MeshGeometry, MeshGroup, MaterialDefinition, MaterialProperties,
  MaterialTextures, TextureSlot, NodeGraph, ShaderNode, ShaderEdge, ShaderOutput, NodePort,
  CameraState, ViewportShading, ViewportOverlay, GizmoState, SceneObject, Scene, TextureData,
  LightDefinition, PhysicsBody, CollisionShape, PhysicsScene, PhysicsJoint,
  ReconstructionInput, ReconstructionOptions, ReconstructionResult, UVMap, UVChart,
  ReconstructionMetadata, ExportOptions, ProjectFile, UserSettings, PanelLayout
} from '../types';

const vec2Schema = v.object({ x: v.number(), y: v.number() });
const vec3Schema = v.object({ x: v.number(), y: v.number(), z: v.number() });
const vec4Schema = v.object({ x: v.number(), y: v.number(), z: v.number(), w: v.number() });
const quatSchema = v.object({ x: v.number(), y: v.number(), z: v.number(), w: v.number() });
const mat3Schema = v.object({ elements: v.instanceof(Float32Array) });
const mat4Schema = v.object({ elements: v.instanceof(Float32Array) });
const eulerSchema = v.object({ x: v.number(), y: v.number(), z: v.number(), order: v.union([v.literal('XYZ'), v.literal('YXZ'), v.literal('ZXY'), v.literal('ZYX'), v.literal('YZX'), v.literal('XZY')]) });
const box3Schema = v.object({ min: vec3Schema, max: vec3Schema });
const sphereSchema = v.object({ center: vec3Schema, radius: v.number() });
const planeSchema = v.object({ normal: vec3Schema, constant: v.number() });
const raySchema = v.object({ origin: vec3Schema, direction: vec3Schema });
const triangleSchema = v.object({ a: vec3Schema, b: vec3Schema, c: vec3Schema });

const transformSchema = v.object({ position: vec3Schema, rotation: quatSchema, scale: vec3Schema });
const boundingBoxSchema = v.object({ min: vec3Schema, max: vec3Schema, center: vec3Schema, size: vec3Schema });

const meshGroupSchema = v.object({ start: v.number(), count: v.number(), materialIndex: v.number() });
const meshGeometrySchema = v.object({
  positions: v.instanceof(Float32Array),
  normals: v.instanceof(Float32Array),
  uvs: v.instanceof(Float32Array),
  indices: v.union([v.instanceof(Uint32Array), v.instanceof(Uint16Array)]),
  groups: v.array(meshGroupSchema),
  boundingBox: boundingBoxSchema,
  boundingSphere: sphereSchema,
});

const textureSlotSchema = v.object({ textureId: v.string(), texCoord: v.number(), scale: vec2Schema, offset: vec2Schema, rotation: v.number() });
const materialTexturesSchema = v.object({
  baseColor: v.nullable(textureSlotSchema),
  metallicRoughness: v.nullable(textureSlotSchema),
  normal: v.nullable(textureSlotSchema),
  occlusion: v.nullable(textureSlotSchema),
  emissive: v.nullable(textureSlotSchema),
  clearcoat: v.nullable(textureSlotSchema),
  clearcoatRoughness: v.nullable(textureSlotSchema),
  clearcoatNormal: v.nullable(textureSlotSchema),
  sheen: v.nullable(textureSlotSchema),
  sheenColor: v.nullable(textureSlotSchema),
  anisotropy: v.nullable(textureSlotSchema),
  iridescence: v.nullable(textureSlotSchema),
  transmission: v.nullable(textureSlotSchema),
  thickness: v.nullable(textureSlotSchema),
  specular: v.nullable(textureSlotSchema),
});
const materialPropertiesSchema = v.object({
  baseColor: vec4Schema, metallic: v.number(), roughness: v.number(), emissive: vec3Schema, emissiveIntensity: v.number(),
  normalScale: v.number(), occlusionStrength: v.number(), clearcoat: v.number(), clearcoatRoughness: v.number(),
  sheen: v.number(), sheenColor: vec3Schema, anisotropy: v.number(), anisotropyRotation: v.number(),
  iridescence: v.number(), iridescenceIOR: v.number(), iridescenceThickness: v.number(),
  transmission: v.number(), thickness: v.number(), attenuationDistance: v.number(), attenuationColor: vec3Schema,
  specularColor: vec3Schema, specularIntensity: v.number(),
});

const nodePortSchema = v.object({ name: v.string(), type: v.union([v.literal('float'), v.literal('vec2'), v.literal('vec3'), v.literal('vec4'), v.literal('mat3'), v.literal('mat4'), v.literal('texture'), v.literal('sampler'), v.literal('bool'), v.literal('int')]), defaultValue: v.optional(v.unknown()) });
const shaderNodeSchema = v.object({ id: v.string(), type: v.string(), position: vec2Schema, data: v.record(v.string(), v.unknown()), inputs: v.array(nodePortSchema), outputs: v.array(nodePortSchema) });
const shaderEdgeSchema = v.object({ id: v.string(), source: v.string(), sourceHandle: v.string(), target: v.string(), targetHandle: v.string() });
const shaderOutputSchema = v.object({ nodeId: v.string(), outputName: v.string(), target: v.union([v.literal('fragment'), v.literal('vertex'), v.literal('compute')]) });
const nodeGraphSchema = v.object({ nodes: v.array(shaderNodeSchema), edges: v.array(shaderEdgeSchema), outputs: v.array(shaderOutputSchema) });

const materialDefinitionSchema = v.object({ id: v.string(), name: v.string(), type: v.union([v.literal('pbr'), v.literal('unlit'), v.literal('subsurface'), v.literal('transmission'), v.literal('custom')]), properties: materialPropertiesSchema, textures: materialTexturesSchema, shaderNodeGraph: v.optional(nodeGraphSchema) });

const cameraStateSchema = v.object({ position: vec3Schema, target: vec3Schema, up: vec3Schema, fov: v.number(), near: v.number(), far: v.number(), aspect: v.number(), type: v.union([v.literal('perspective'), v.literal('orthographic')]), zoom: v.number() });

const viewportOverlaySchema = v.object({ type: v.union([v.literal('grid'), v.literal('axes'), v.literal('bounds'), v.literal('normals'), v.literal('uv'), v.literal('curvature'), v.literal('wireframe'), v.literal('custom')]), enabled: v.boolean(), color: v.optional(vec4Schema), scale: v.optional(v.number()) });
const viewportShadingSchema = v.object({ mode: v.union([v.literal('wireframe'), v.literal('solid'), v.literal('material'), v.literal('rendered'), v.literal('matcap'), v.literal('custom')]), matcapTexture: v.optional(v.string()), overlays: v.array(viewportOverlaySchema) });

const gizmoStateSchema = v.object({ mode: v.union([v.literal('translate'), v.literal('rotate'), v.literal('scale'), v.literal('none')]), space: v.union([v.literal('world'), v.literal('local'), v.literal('view')]), pivot: v.union([v.literal('center'), v.literal('cursor'), v.literal('active'), v.literal('median')]), snap: v.boolean(), snapIncrement: v.number(), axisLock: v.nullable(v.union([v.literal('X'), v.literal('Y'), v.literal('Z')])) });

const collisionShapeSchema = v.object({ type: v.union([v.literal('box'), v.literal('sphere'), v.literal('capsule'), v.literal('cylinder'), v.literal('cone'), v.literal('convex'), v.literal('trimesh'), v.literal('heightfield')]), halfExtents: v.optional(vec3Schema), radius: v.optional(v.number()), height: v.optional(v.number()), vertices: v.optional(v.instanceof(Float32Array)), indices: v.optional(v.instanceof(Uint32Array)) });
const physicsBodySchema = v.object({ id: v.string(), type: v.union([v.literal('rigid'), v.literal('soft'), v.literal('kinematic'), v.literal('static')]), mass: v.number(), friction: v.number(), restitution: v.number(), linearDamping: v.number(), angularDamping: v.number(), gravityScale: v.number(), collisionShape: collisionShapeSchema, position: vec3Schema, rotation: quatSchema, linearVelocity: vec3Schema, angularVelocity: vec3Schema, force: vec3Schema, torque: vec3Schema, sleepThreshold: v.number(), ccdEnabled: v.boolean(), groups: v.number(), mask: v.number() });
const physicsJointSchema = v.object({ id: v.string(), type: v.union([v.literal('fixed'), v.literal('revolute'), v.literal('prismatic'), v.literal('spherical'), v.literal('distance'), v.literal('spring'), v.literal('motor')]), bodyA: v.string(), bodyB: v.string(), localAnchorA: vec3Schema, localAnchorB: vec3Schema, localAxisA: v.optional(vec3Schema), localAxisB: v.optional(vec3Schema), limits: v.optional(v.object({ min: v.number(), max: v.number() })), motor: v.optional(v.object({ targetVelocity: v.number(), maxForce: v.number() })), spring: v.optional(v.object({ stiffness: v.number(), damping: v.number() })) });
const physicsSceneSchema = v.object({ gravity: vec3Schema, timeStep: v.number(), subSteps: v.number(), bodies: v.record(v.string(), physicsBodySchema), joints: v.record(v.string(), physicsJointSchema), broadPhase: v.union([v.literal('sap'), v.literal('mpr'), v.literal('brute')]), narrowPhase: v.union([v.literal('gjk'), v.literal('sat')]), ccdEnabled: v.boolean(), sleepEnabled: v.boolean() });

const textureDataSchema = v.object({ id: v.string(), name: v.string(), width: v.number(), height: v.number(), format: v.union([v.literal('rgba8'), v.literal('rgba16f'), v.literal('rgba32f'), v.literal('r8'), v.literal('r16f'), v.literal('r32f'), v.literal('rg8'), v.literal('rg16f'), v.literal('rg32f')]), data: v.nullable(v.instanceof(ArrayBufferView)), url: v.nullable(v.string()), mipmaps: v.boolean(), anisotropy: v.number(), wrapS: v.union([v.literal('ClampToEdge'), v.literal('Repeat'), v.literal('MirroredRepeat')]), wrapT: v.union([v.literal('ClampToEdge'), v.literal('Repeat'), v.literal('MirroredRepeat')]), magFilter: v.union([v.literal('Nearest'), v.literal('Linear'), v.literal('NearestMipmapNearest'), v.literal('LinearMipmapNearest'), v.literal('NearestMipmapLinear'), v.literal('LinearMipmapLinear')]), minFilter: v.union([v.literal('Nearest'), v.literal('Linear'), v.literal('NearestMipmapNearest'), v.literal('LinearMipmapNearest'), v.literal('NearestMipmapLinear'), v.literal('LinearMipmapLinear')]), colorSpace: v.union([v.literal('srgb'), v.literal('linear'), v.literal('hdr')]) });

const lightDefinitionSchema = v.object({ id: v.string(), name: v.string(), type: v.union([v.literal('ambient'), v.literal('directional'), v.literal('point'), v.literal('spot'), v.literal('rect'), v.literal('hemisphere'), v.literal('probe')]), color: vec3Schema, intensity: v.number(), distance: v.number(), decay: v.number(), angle: v.number(), penumbra: v.number(), target: vec3Schema, castShadow: v.boolean(), shadowMapSize: v.number(), shadowBias: v.number(), shadowNormalBias: v.number(), shadowRadius: v.number(), contactShadows: v.boolean(), volumetric: v.boolean() });

const sceneObjectSchema = v.object({ id: v.string(), name: v.string(), type: v.union([v.literal('mesh'), v.literal('camera'), v.literal('light'), v.literal('empty'), v.literal('group'), v.literal('armature'), v.literal('curve'), v.literal('surface'), v.literal('metaball'), v.literal('font'), v.literal('volume')]), transform: transformSchema, visible: v.boolean(), selectable: v.boolean(), locked: v.boolean(), parentId: v.nullable(v.string()), childrenIds: v.array(v.string()), geometryId: v.nullable(v.string()), materialIds: v.array(v.string()), physicsBodyId: v.nullable(v.string()), customProperties: v.record(v.string(), v.unknown()) });

const sceneSchema = v.object({ id: v.string(), name: v.string(), objects: v.record(v.string(), sceneObjectSchema), geometries: v.record(v.string(), meshGeometrySchema), materials: v.record(v.string(), materialDefinitionSchema), textures: v.record(v.string(), textureDataSchema), physicsBodies: v.record(v.string(), physicsBodySchema), cameras: v.record(v.string(), cameraStateSchema), lights: v.record(v.string(), lightDefinitionSchema), rootObjectIds: v.array(v.string()), activeCameraId: v.nullable(v.string()), activeObjectId: v.nullable(v.string()), selection: v.set(v.string()), gizmo: gizmoStateSchema, viewport: viewportShadingSchema, units: v.union([v.literal('metric'), v.literal('imperial')]), upAxis: v.union([v.literal('Y'), v.literal('Z')]), gridSize: v.number(), gridSubdivisions: v.number() });

const reconstructionOptionsSchema = v.object({ depthModel: v.string(), meshMethod: v.union([v.literal('poisson'), v.literal('marching_cubes'), v.literal('delaunay'), v.literal('tetrahedral')]), meshDepth: v.number(), samples: v.number(), generateInterior: v.boolean(), interiorType: v.union([v.literal('vehicle'), v.literal('architectural'), v.literal('product'), v.literal('organic')]), enhancePredictive: v.boolean(), enhanceTypes: v.array(v.union([v.literal('aerodynamic'), v.literal('ergonomic'), v.literal('aesthetic'), v.literal('structural')])), uvUnwrap: v.boolean(), uvAtlasSize: v.number(), targetPolycount: v.number(), simplify: v.boolean(), watermark: v.boolean() });

const uvChartSchema = v.object({ id: v.number(), faces: v.instanceof(Uint32Array), bounds: v.object({ min: vec2Schema, max: vec2Schema }), area: v.number() });
const uvMapSchema = v.object({ name: v.string(), uvs: v.instanceof(Float32Array), atlasSize: v.number(), charts: v.array(uvChartSchema) });

const reconstructionMetadataSchema = v.object({ inputWidth: v.number(), inputHeight: v.number(), processingTime: v.number(), depthModel: v.string(), meshMethod: v.string(), vertexCount: v.number(), faceCount: v.number(), materialCount: v.number(), textureCount: v.number(), interiorGenerated: v.boolean(), enhancementsApplied: v.array(v.string()), warnings: v.array(v.string()) });
const reconstructionResultSchema = v.object({ mesh: meshGeometrySchema, interior: v.nullable(meshGeometrySchema), materials: v.array(materialDefinitionSchema), textures: v.array(textureDataSchema), uvMaps: v.array(uvMapSchema), depthMap: v.instanceof(Float32Array), confidenceMap: v.instanceof(Float32Array), normalsMap: v.instanceof(Float32Array), metadata: reconstructionMetadataSchema });

const exportOptionsSchema = v.object({ format: v.union([v.literal('gltf'), v.literal('glb'), v.literal('usdz'), v.literal('obj'), v.literal('stl'), v.literal('3mf'), v.literal('ply'), v.literal('fbx'), v.literal('dae')]), includeMaterials: v.boolean(), includeTextures: v.boolean(), includeAnimations: v.boolean(), includeCameras: v.boolean(), includeLights: v.boolean(), binary: v.boolean(), dracoCompression: v.boolean(), meshoptCompression: v.boolean(), textureFormat: v.union([v.literal('png'), v.literal('jpg'), v.literal('webp'), v.literal('ktx2'), v.literal('basis')]), textureQuality: v.number(), maxTextureSize: v.number(), embedBuffers: v.boolean(), upAxis: v.union([v.literal('Y'), v.literal('Z')]), units: v.union([v.literal('metric'), v.literal('imperial')]) });

const panelLayoutSchema = v.object({ id: v.string(), type: v.union([v.literal('viewport'), v.literal('outliner'), v.literal('properties'), v.literal('nodes'), v.literal('console'), v.literal('timeline'), v.literal('assetBrowser'), v.literal('shaderEditor')]), position: v.object({ x: v.number(), y: v.number(), width: v.number(), height: v.number() }), tabIndex: v.number(), visible: v.boolean(), collapsed: v.boolean() });

const userSettingsSchema = v.object({ theme: v.union([v.literal('dark'), v.literal('light'), v.literal('system')]), language: v.string(), units: v.union([v.literal('metric'), v.literal('imperial')]), upAxis: v.union([v.literal('Y'), v.literal('Z')]), gridSize: v.number(), gridSubdivisions: v.number(), autoSave: v.boolean(), autoSaveInterval: v.number(), viewport: v.object({ defaultShading: viewportShadingSchema.shape.mode, showGrid: v.boolean(), showAxes: v.boolean(), showBounds: v.boolean(), showWireframe: v.boolean(), matcap: v.string() }), gizmo: v.object({ defaultMode: gizmoStateSchema.shape.mode, defaultSpace: gizmoStateSchema.shape.space, defaultPivot: gizmoStateSchema.shape.pivot, snapEnabled: v.boolean(), snapIncrement: v.number() }), performance: v.object({ maxFPS: v.number(), shadows: v.boolean(), ssao: v.boolean(), ssr: v.boolean(), taa: v.boolean(), fxaa: v.boolean(), bloom: v.boolean(), dof: v.boolean(), motionBlur: v.boolean() }), shortcuts: v.record(v.string(), v.string()), panels: v.array(panelLayoutSchema) });

const projectFileSchema = v.object({ version: v.string(), scene: sceneSchema, reconstructionHistory: v.array(reconstructionResultSchema), settings: userSettingsSchema, createdAt: v.string(), updatedAt: v.string(), author: v.string() });

export const Schemas = {
  vec2: vec2Schema,
  vec3: vec3Schema,
  vec4: vec4Schema,
  quat: quatSchema,
  mat3: mat3Schema,
  mat4: mat4Schema,
  euler: eulerSchema,
  box3: box3Schema,
  sphere: sphereSchema,
  plane: planeSchema,
  ray: raySchema,
  triangle: triangleSchema,
  transform: transformSchema,
  boundingBox: boundingBoxSchema,
  meshGroup: meshGroupSchema,
  meshGeometry: meshGeometrySchema,
  materialDefinition: materialDefinitionSchema,
  materialProperties: materialPropertiesSchema,
  materialTextures: materialTexturesSchema,
  textureSlot: textureSlotSchema,
  nodeGraph: nodeGraphSchema,
  shaderNode: shaderNodeSchema,
  shaderEdge: shaderEdgeSchema,
  shaderOutput: shaderOutputSchema,
  nodePort: nodePortSchema,
  cameraState: cameraStateSchema,
  viewportShading: viewportShadingSchema,
  viewportOverlay: viewportOverlaySchema,
  gizmoState: gizmoStateSchema,
  sceneObject: sceneObjectSchema,
  scene: sceneSchema,
  textureData: textureDataSchema,
  lightDefinition: lightDefinitionSchema,
  physicsBody: physicsBodySchema,
  collisionShape: collisionShapeSchema,
  physicsJoint: physicsJointSchema,
  physicsScene: physicsSceneSchema,
  reconstructionOptions: reconstructionOptionsSchema,
  reconstructionResult: reconstructionResultSchema,
  uvMap: uvMapSchema,
  uvChart: uvChartSchema,
  reconstructionMetadata: reconstructionMetadataSchema,
  exportOptions: exportOptionsSchema,
  projectFile: projectFileSchema,
  userSettings: userSettingsSchema,
  panelLayout: panelLayoutSchema,
};

export type Infer<T> = v.InferOutput<T>;
export const parse = v.parse;
export const safeParse = v.safeParse;
export const validate = v.parse;