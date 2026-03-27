import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { THEME } from '../theme';

export function CameraController() {
  const { camera, gl } = useThree();
  const targetPosition = useRef(new THREE.Vector3(0, 0, THEME.camera.initialZ)); // Match initial App.tsx camera
  
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      targetPosition.current.y -= e.deltaY * THEME.camera.wheelSensitivity;
      targetPosition.current.x += e.deltaX * THEME.camera.wheelSensitivity;
    };

    const handlePointerDown = (e: PointerEvent) => {
      isDragging.current = true;
      document.body.classList.add('is-dragging');
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = () => {
      isDragging.current = false;
      document.body.classList.remove('is-dragging');
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      
      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;
      
      targetPosition.current.x -= deltaX * THEME.camera.dragSensitivity;
      targetPosition.current.y += deltaY * THEME.camera.dragSensitivity;
      
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const domElement = gl.domElement;
    domElement.addEventListener('wheel', handleWheel, { passive: true });
    domElement.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    window.addEventListener('pointermove', handlePointerMove);

    return () => {
      domElement.removeEventListener('wheel', handleWheel);
      domElement.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [gl]);

  useFrame((_, delta) => {
    // Smooth damp camera position towards target
    camera.position.lerp(targetPosition.current, THEME.animation.cameraLerp * delta);
  });

  return null;
}
