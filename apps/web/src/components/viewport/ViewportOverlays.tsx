'use client';

import { useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useViewportStore } from '@/hooks/useViewportStore';

export function ViewportOverlays({ overlays }: { overlays: ViewportOverlay[] }) {
  const { scene, camera, gl } = useThree();
  const { overlays: storeOverlays } = useViewportStore();
  const activeOverlays = useMemo(() => [...overlays, ...storeOverlays].filter(o => o.enabled), [overlays, storeOverlays]);

  const gridRef = useRef<THREE.GridHelper | null>(null);
  const axesRef = useRef<THREE.AxesHelper | null>(null);
  const boundsRef = useRef<THREE.Box3Helper | null>(null);
  const normalsRef = useRef<THREE.ArrowHelper[]>([]);
  const wireframeRef = useRef<THREE.WireframeGeometry | null>(null);

  useFrame(() => {
    activeOverlays.forEach(overlay => {
      switch (overlay.type) {
        case 'grid':
          if (!gridRef.current) {
            gridRef.current = new THREE.GridHelper(100, 100, overlay.color ? new THREE.Color(overlay.color.x, overlay.color.y, overlay.color.z) : 0x2A2E39, 0x1A1D24);
            scene.add(gridRef.current);
          }
          break;
        case 'axes':
          if (!axesRef.current) {
            axesRef.current = new THREE.AxesHelper(5);
            scene.add(axesRef.current);
          }
          break;
        case 'bounds':
          if (!boundsRef.current) {
            const box = new THREE.Box3().setFromObject(scene);
            boundsRef.current = new THREE.Box3Helper(box, overlay.color ? new THREE.Color(overlay.color.x, overlay.color.y, overlay.color.z) : 0x00F0FF);
            scene.add(boundsRef.current);
          }
          break;
        case 'wireframe':
          if (!wireframeRef.current) {
            const wireframe = new THREE.WireframeGeometry();
            wireframeRef.current = wireframe;
          }
          break;
      }
    });

    const disabledTypes = activeOverlays.map(o => o.type);
    if (!disabledTypes.includes('grid') && gridRef.current) {
      scene.remove(gridRef.current);
      gridRef.current.dispose();
      gridRef.current = null;
    }
    if (!disabledTypes.includes('axes') && axesRef.current) {
      scene.remove(axesRef.current);
      axesRef.current.dispose();
      axesRef.current = null;
    }
    if (!disabledTypes.includes('bounds') && boundsRef.current) {
      scene.remove(boundsRef.current);
      boundsRef.current.dispose();
      boundsRef.current = null;
    }
  });

  return null;
}

import { useRef } from 'react';