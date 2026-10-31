'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree, useLoader, extend } from '@react-three/fiber';
import {
  OrbitControls,
  TransformControls,
  Grid,
  Axis,
  Box,
  Sphere,
  Cylinder,
  Plane,
  RoundedBox,
  Torus,
  Cone,
  Text,
  Html,
  ContactShadows,
  Environment,
  Stage,
  Effects,
  AccumulativeShadows,
  SpotLight,
  PerspectiveCamera,
  OrthographicCamera,
} from '@react-three/drei';
import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { gsap } from 'gsap';
import { cn } from '@/lib/utils';
import { useStudioStore } from '@/hooks/useStudioStore';
import { useViewportStore } from '@/hooks/useViewportStore';
import { GizmoHelper } from './GizmoHelper';
import { ViewportOverlays } from './ViewportOverlays';
import { ViewportShadingMenu } from './ViewportShadingMenu';
import { CameraControls } from './CameraControls';

extend({
  CSS2DRenderer,
  CSS2DObject,
});

interface Viewport3DProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Viewport3D({ className, style }: Viewport3DProps) {
  const { scene, camera, gl, size, viewport, setSize, setCamera, setDefaultCamera } = useThree();
  const { shading, overlays, gizmo, activeCamera, setActiveCamera } = useViewportStore();
  const { scene: studioScene, selection, addObject, removeObject, selectObject } = useStudioStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const css2dRendererRef = useRef<CSS2DRenderer | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const css2dRenderer = new CSS2DRenderer();
    css2dRenderer.setSize(size.width, size.height);
    css2dRenderer.domElement.style.position = 'absolute';
    css2dRenderer.domElement.style.top = '0';
    css2dRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(css2dRenderer.domElement);
    css2dRendererRef.current = css2dRenderer;

    return () => {
      css2dRenderer.domElement.remove();
      css2dRendererRef.current = null;
    };
  }, [size.width, size.height]);

  useFrame((state, delta) => {
    if (css2dRendererRef.current) {
      css2dRendererRef.current.render(state.scene, state.camera);
    }
  }, -1);

  const handleResize = useCallback((width: number, height: number) => {
    setSize(width, height);
    if (css2dRendererRef.current) {
      css2dRendererRef.current.setSize(width, height);
    }
  }, [setSize]);

  useEffect(() => {
    setIsReady(true);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full h-full overflow-hidden bg-studio-bg', className)}
      style={style}
      tabIndex={0}
    >
      <Canvas
        camera={activeCamera}
        gl={gl}
        onCreated={({ gl: renderer }) => {
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
          renderer.shadowMap.enabled = true;
          renderer.shadowMap.type = THREE.PCFSoftShadowMap;
          renderer.toneMapping = THREE.ACESFilmicToneMapping;
          renderer.toneMappingExposure = 1;
          renderer.outputColorSpace = THREE.SRGBColorSpace;
          renderer.physicallyCorrectLights = true;
        }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <ViewportScene
          shading={shading}
          overlays={overlays}
          gizmo={gizmo}
          onResize={handleResize}
        />
      </Canvas>

      <ViewportUI
        shading={shading}
        overlays={overlays}
        gizmo={gizmo}
        activeCamera={activeCamera}
        setActiveCamera={setActiveCamera}
      />
    </div>
  );
}

function ViewportScene({
  shading,
  overlays,
  gizmo,
  onResize,
}: {
  shading: ViewportShading['mode'];
  overlays: ViewportOverlay[];
  gizmo: GizmoState;
  onResize: (w: number, h: number) => void;
}) {
  const { scene, camera, size, gl } = useThree();
  const { selection } = useStudioStore();

  useEffect(() => {
    const handleResize = (e: UIEvent) => {
      const target = e.target as Window;
      onResize(target.innerWidth, target.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [onResize]);

  useEffect(() => {
    scene.background = new THREE.Color(0x0D0E12);
    scene.fog = new THREE.FogExp2(0x0D0E12, 0.0025);
  }, [scene]);

  return (
    <>
      <Environment
        preset="studio"
        background={false}
        ground={false}
        toneMappingExposure={1}
      >
        {(env) => (
          <>
            <SpotLight
              position={[10, 20, 10]}
              angle={0.3}
              penumbra={0.5}
              intensity={50}
              castShadow
              shadowMapSize={2048}
              shadowBias={-0.0001}
            />
            <SpotLight
              position={[-10, 15, -10]}
              angle={0.4}
              penumbra={0.5}
              intensity={30}
              castShadow
              shadowMapSize={1024}
            />
            <Environment
              preset="city"
              background={false}
              ground={false}
            />
          </>
        )}
      </Environment>

      <AccumulativeShadows
        temporal
        frames={100}
        scale={20}
        opacity={0.5}
        color="#000000"
        alphaTest={0.65}
      >
        <Grid
          cellSize={1}
          cellCount={50}
          cellThickness={0.5}
          sectionSize={5}
          sectionThickness={1}
          majorColor="#2A2E39"
          minorColor="#1A1D24"
          opacity={0.5}
          followCamera
          infiniteGridHelper
        />
      </AccumulativeShadows>

      <Axis
        axisColors={['#FF3366', '#00FF88', '#00F0FF']}
        axisLength={2}
        axisHeadLength={0.2}
        position={[-8, -8, -8]}
        scale={0.5}
      />

      <ViewportObjects selection={selection} gizmo={gizmo} />

      <ViewportOverlays overlays={overlays} />

      <GizmoHelper gizmo={gizmo} />

      <Effects
        multisampling={8}
        renderPriority={1}
      />
    </>
  );
}

function ViewportObjects({
  selection,
  gizmo,
}: {
  selection: Set<string>;
  gizmo: GizmoState;
}) {
  const { scene } = useThree();
  const { scene: studioScene } = useStudioStore();

  const objects = useMemo(() => {
    return Array.from(studioScene.objects.values()).filter(obj => obj.visible);
  }, [studioScene.objects]);

  return (
    <>
      {objects.map(obj => (
        <SceneObject
          key={obj.id}
          object={obj}
          isSelected={selection.has(obj.id)}
          gizmo={gizmo}
        />
      ))}
    </>
  );
}

function SceneObject({
  object,
  isSelected,
  gizmo,
}: {
  object: SceneObject;
  isSelected: boolean;
  gizmo: GizmoState;
}) {
  const { scene, geometries, materials } = useThree();
  const { scene: studioScene } = useStudioStore();

  const geometry = object.geometryId ? studioScene.geometries.get(object.geometryId) : null;
  const material = object.materialIds[0] ? studioScene.materials.get(object.materialIds[0]) : null;

  return (
    <group
      position={object.transform.position}
      rotation={object.transform.rotation}
      scale={object.transform.scale}
    >
      {geometry && (
        <mesh
          geometry={geometry}
          material={material}
          castShadow
          receiveShadow
        />
      )}
      {isSelected && (
        <TransformControls
          mode={gizmo.mode}
          space={gizmo.space}
          showX={gizmo.axisLock !== 'Y' && gizmo.axisLock !== 'Z'}
          showY={gizmo.axisLock !== 'X' && gizmo.axisLock !== 'Z'}
          showZ={gizmo.axisLock !== 'X' && gizmo.axisLock !== 'Y'}
        >
          <Box args={[1.1, 1.1, 1.1]} wireframe>
            <meshBasicMaterial color="#00F0FF" transparent opacity={0.3} />
          </Box>
        </TransformControls>
      )}
    </group>
  );
}

function ViewportUI({
  shading,
  overlays,
  gizmo,
  activeCamera,
  setActiveCamera,
}: {
  shading: ViewportShading['mode'];
  overlays: ViewportOverlay[];
  gizmo: GizmoState;
  activeCamera: string | null;
  setActiveCamera: (id: string | null) => void;
}) {
  const { camera, size } = useThree();

  return (
    <>
      <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
        <ViewportShadingMenu shading={shading} />
        <CameraControls activeCamera={activeCamera} setActiveCamera={setActiveCamera} />
      </div>

      <div className="absolute bottom-3 right-3 flex flex-col gap-2 z-10">
        <GizmoControls gizmo={gizmo} />
        <ViewportInfo size={size} />
      </div>

      <div className="absolute bottom-3 left-3 z-10">
        <ViewportLegend overlays={overlays} />
      </div>
    </>
  );
}

function ViewportShadingMenu({ shading }: { shading: ViewportShading['mode'] }) {
  const { setShading } = useViewportStore();
  const modes: ViewportShading['mode'][] = ['wireframe', 'solid', 'material', 'rendered'];

  return (
    <div className="studio-panel-elevated flex items-center gap-1 p-1">
      {modes.map(mode => (
        <button
          key={mode}
          onClick={() => setShading(mode)}
          className={cn(
            'p-2 rounded-md transition-all duration-150',
            shading === mode
              ? 'bg-studio-cyan/20 text-studio-cyan'
              : 'text-studio-text-muted hover:text-studio-text hover:bg-studio-panel-hover'
          )}
          title={mode}
        >
          <ShadingIcon mode={mode} size={16} />
        </button>
      ))}
    </div>
  );
}

function ShadingIcon({ mode, size }: { mode: ViewportShading['mode']; size: number }) {
  switch (mode) {
    case 'wireframe':
      return <WireframeIcon size={size} />;
    case 'solid':
      return <SolidIcon size={size} />;
    case 'material':
      return <MaterialIcon size={size} />;
    case 'rendered':
      return <RenderedIcon size={size} />;
    default:
      return null;
  }
}

function WireframeIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function SolidIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 9h6v6H9z" />
    </svg>
  );
}

function MaterialIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a10 10 0 0 1 10 10" />
      <path d="M12 2a10 10 0 0 0 10 10" />
    </svg>
  );
}

function RenderedIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="2" />
      <path d="M8 12l3 3 7-7" />
    </svg>
  );
}

function CameraControls({ activeCamera, setActiveCamera }: { activeCamera: string | null; setActiveCamera: (id: string | null) => void }) {
  const { cameras } = useStudioStore();

  return (
    <div className="studio-panel-elevated flex items-center gap-1 p-1">
      <button
        onClick={() => setActiveCamera('perspective')}
        className={cn('p-2 rounded-md transition-all duration-150', activeCamera === 'perspective' ? 'bg-studio-cyan/20 text-studio-cyan' : 'text-studio-text-muted hover:text-studio-text hover:bg-studio-panel-hover')}
        title="Perspective"
      >
        <PerspectiveIcon size={16} />
      </button>
      <button
        onClick={() => setActiveCamera('orthographic')}
        className={cn('p-2 rounded-md transition-all duration-150', activeCamera === 'orthographic' ? 'bg-studio-cyan/20 text-studio-cyan' : 'text-studio-text-muted hover:text-studio-text hover:bg-studio-panel-hover')}
        title="Orthographic"
      >
        <OrthographicIcon size={16} />
      </button>
    </div>
  );
}

function PerspectiveIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      <path d="M21 21l-6-6m-2-2a5 5 0 10-10 0 5 5 0 0010 0z" />
    </svg>
  );
}

function OrthographicIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18M15 3v18" />
    </svg>
  );
}

function GizmoControls({ gizmo }: { gizmo: GizmoState }) {
  const { setGizmoMode, setGizmoSpace, setGizmoPivot, setGizmoSnap, setGizmoSnapIncrement } = useViewportStore();

  return (
    <div className="studio-panel-elevated flex flex-col gap-2 p-2">
      <div className="flex items-center gap-1">
        <span className="text-xs text-studio-text-muted px-2">Mode</span>
        {(['translate', 'rotate', 'scale'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setGizmoMode(mode)}
            className={cn('p-1.5 rounded transition-all duration-150', gizmo.mode === mode ? 'bg-studio-cyan/20 text-studio-cyan' : 'text-studio-text-muted hover:text-studio-text hover:bg-studio-panel-hover')}
            title={mode}
          >
            <GizmoModeIcon mode={mode} size={14} />
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs text-studio-text-muted px-2">Space</span>
        {(['world', 'local', 'view'] as const).map(space => (
          <button
            key={space}
            onClick={() => setGizmoSpace(space)}
            className={cn('p-1.5 rounded transition-all duration-150', gizmo.space === space ? 'bg-studio-cyan/20 text-studio-cyan' : 'text-studio-text-muted hover:text-studio-text hover:bg-studio-panel-hover')}
            title={space}
          >
            <SpaceIcon space={space} size={14} />
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <label className="flex items-center gap-1.5 text-xs text-studio-text-muted cursor-pointer">
          <input
            type="checkbox"
            checked={gizmo.snap}
            onChange={e => setGizmoSnap(e.target.checked)}
            className="w-4 h-4 accent-studio-cyan rounded border-studio-border bg-studio-bg"
          />
          Snap
        </label>
        {gizmo.snap && (
          <input
            type="number"
            value={gizmo.snapIncrement}
            onChange={e => setGizmoSnapIncrement(Number(e.target.value))}
            min={0.01}
            max={10}
            step={0.01}
            className="studio-input w-20 text-xs"
          />
        )}
      </div>
    </div>
  );
}

function GizmoModeIcon({ mode, size }: { mode: 'translate' | 'rotate' | 'scale'; size: number }) {
  switch (mode) {
    case 'translate':
      return <TranslateIcon size={size} />;
    case 'rotate':
      return <RotateIcon size={size} />;
    case 'scale':
      return <ScaleIcon size={size} />;
  }
}

function TranslateIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v20M2 12h20" />
      <path d="M18 6l-6 6-6-6" />
    </svg>
  );
}

function RotateIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83" />
    </svg>
  );
}

function ScaleIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21h18M3 3h18" />
      <path d="M12 3v18M3 12h18" />
    </svg>
  );
}

function SpaceIcon({ space, size }: { space: 'world' | 'local' | 'view'; size: number }) {
  switch (space) {
    case 'world':
      return <WorldIcon size={size} />;
    case 'local':
      return <LocalIcon size={size} />;
    case 'view':
      return <ViewIcon size={size} />;
  }
}

function WorldIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  );
}

function LocalIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 9h6v6H9z" />
    </svg>
  );
}

function ViewIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function ViewportInfo({ size }: { size: { width: number; height: number } }) {
  const { camera } = useThree();
  return (
    <div className="studio-panel-elevated px-3 py-1.5 text-xs text-studio-text-muted font-mono">
      {Math.round(size.width)} × {Math.round(size.height)} • {camera.type === 'PerspectiveCamera' ? 'Persp' : 'Ortho'} • {camera.fov?.toFixed(1) || ''}°
    </div>
  );
}

function ViewportLegend({ overlays }: { overlays: ViewportOverlay[] }) {
  return (
    <div className="studio-panel-elevated px-3 py-2 text-xs text-studio-text-muted flex items-center gap-4">
      {overlays.filter(o => o.enabled).map(overlay => (
        <span key={overlay.type} className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: overlay.color ? `rgba(${overlay.color.x * 255}, ${overlay.color.y * 255}, ${overlay.color.z * 255}, ${overlay.color.w})` : '#00F0FF' }} />
          {overlay.type}
        </span>
      ))}
    </div>
  );
}