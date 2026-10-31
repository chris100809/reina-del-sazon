'use client';

import { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useViewportStore } from '@/hooks/useViewportStore';

export function GizmoHelper({ gizmo }: { gizmo: GizmoState }) {
  const { scene, camera } = useThree();
  const { gizmo: storeGizmo } = useViewportStore();
  const activeGizmo = gizmo || storeGizmo;

  const translateGizmoRef = useRef<THREE.TransformControls | null>(null);
  const rotateGizmoRef = useRef<THREE.TransformControls | null>(null);
  const scaleGizmoRef = useRef<THREE.TransformControls | null>(null);

  useEffect(() => {
    const createGizmo = (mode: 'translate' | 'rotate' | 'scale') => {
      const gizmo = new THREE.TransformControls(camera, gl.domElement);
      gizmo.setMode(mode);
      gizmo.setSpace(activeGizmo.space);
      gizmo.setTranslationSnap(activeGizmo.snap ? activeGizmo.snapIncrement : null);
      gizmo.setRotationSnap(activeGizmo.snap ? THREE.MathUtils.degToRad(15) : null);
      gizmo.setScaleSnap(activeGizmo.snap ? activeGizmo.snapIncrement : null);
      gizmo.addEventListener('change', () => {
        if (gizmo.object) {
          const obj = gizmo.object as THREE.Object3D;
          obj.updateMatrixWorld();
        }
      });
      return gizmo;
    };

    translateGizmoRef.current = createGizmo('translate');
    rotateGizmoRef.current = createGizmo('rotate');
    scaleGizmoRef.current = createGizmo('scale');

    scene.add(translateGizmoRef.current);
    scene.add(rotateGizmoRef.current);
    scene.add(scaleGizmoRef.current);

    return () => {
      scene.remove(translateGizmoRef.current!);
      scene.remove(rotateGizmoRef.current!);
      scene.remove(scaleGizmoRef.current!);
      translateGizmoRef.current?.dispose();
      rotateGizmoRef.current?.dispose();
      scaleGizmoRef.current?.dispose();
    };
  }, [scene, camera]);

  useFrame(() => {
    const active = activeGizmo.mode === 'translate' ? translateGizmoRef.current :
                   activeGizmo.mode === 'rotate' ? rotateGizmoRef.current :
                   scaleGizmoRef.current;

    [translateGizmoRef.current, rotateGizmoRef.current, scaleGizmoRef.current].forEach(g => {
      if (g && g !== active) {
        g.detach();
        g.visible = false;
      }
    });

    if (active) {
      active.setSpace(activeGizmo.space);
      active.setTranslationSnap(activeGizmo.snap ? activeGizmo.snapIncrement : null);
      active.setRotationSnap(activeGizmo.snap ? THREE.MathUtils.degToRad(15) : null);
      active.setScaleSnap(activeGizmo.snap ? activeGizmo.snapIncrement : null);
      active.visible = true;
    }
  });

  return null;
}

import { useRef, useEffect, useFrame } from 'react';
const { gl } = useThree();