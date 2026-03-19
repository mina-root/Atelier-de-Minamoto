import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function CameraController() {
  const { camera, gl } = useThree();
  const targetPosition = useRef(new THREE.Vector3(0, 0, 8)); // Match initial App.tsx camera
  
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      targetPosition.current.y -= e.deltaY * 0.01;
      targetPosition.current.x += e.deltaX * 0.01;
    };

    const handlePointerDown = (e: PointerEvent) => {
      // Don't drag if clicking on a UI element or interactive mesh
      // We will handle that internally, but for canvas bg:
      isDragging.current = true;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
      gl.domElement.style.cursor = 'grabbing';
    };

    const handlePointerUp = () => {
      isDragging.current = false;
      gl.domElement.style.cursor = 'grab';
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      
      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;
      
      targetPosition.current.x -= deltaX * 0.02;
      targetPosition.current.y += deltaY * 0.02;
      
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const domElement = gl.domElement;
    domElement.addEventListener('wheel', handleWheel, { passive: true });
    domElement.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointermove', handlePointerMove);

    domElement.style.cursor = 'grab';

    return () => {
      domElement.removeEventListener('wheel', handleWheel);
      domElement.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [gl]);

  useFrame((_, delta) => {
    // Smooth damp camera position towards target
    camera.position.lerp(targetPosition.current, 5 * delta);
  });

  return null;
}
