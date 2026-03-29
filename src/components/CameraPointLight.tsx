import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { THEME } from '../theme';

export function CameraPointLight() {
  const { camera } = useThree();
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (lightRef.current) {
      // Point light follows the camera position with an offset
      lightRef.current.position.set(
        camera.position.x + THEME.colors.cameraPointLightOffset[0],
        camera.position.y + THEME.colors.cameraPointLightOffset[1],
        camera.position.z + THEME.colors.cameraPointLightOffset[2]
      );
    }
  });

  return (
    <pointLight
      ref={lightRef}
      intensity={THEME.colors.cameraPointLightIntensity}
      color={THEME.colors.cameraPointLight}
      distance={30}
      decay={1}
    />
  );
}
