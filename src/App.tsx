import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { Suspense } from 'react';
import { CameraController } from './components/CameraController';
import { InfiniteWall } from './components/InfiniteWall';
import './index.css';

function Scene() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight 
        castShadow 
        position={[2, 5, 5]} 
        intensity={0.8} 
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      
      {/* Background Plane for deep shadows */}
      <mesh receiveShadow position={[0, 0, -2]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#e0e0e0" roughness={1} />
      </mesh>

      <InfiniteWall />
    </>
  );
}

function App() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 0, 8], fov: 40 }}
      style={{ width: '100vw', height: '100vh' }}
    >
      <CameraController />
      <color attach="background" args={['#fafafa']} />
      <Suspense fallback={null}>
        <Scene />
        <Environment preset="city" environmentIntensity={0.5} />
      </Suspense>
    </Canvas>
  );
}

export default App;
