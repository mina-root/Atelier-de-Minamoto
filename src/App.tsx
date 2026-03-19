import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { Suspense } from 'react';
import { CameraController } from './components/CameraController';
import { InfiniteWall } from './components/InfiniteWall';
import { useState } from 'react';
import { type IllustrationItem } from './data';
import './index.css';

function Scene({ onIllustrationClick }: { onIllustrationClick: (item: IllustrationItem) => void }) {
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

      <InfiniteWall onIllustrationClick={onIllustrationClick} />
    </>
  );
}

function App() {
  const [selectedIllustration, setSelectedIllustration] = useState<IllustrationItem | null>(null);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Canvas
        shadows
        camera={{ position: [0, 0, 8], fov: 40 }}
        style={{ width: '100%', height: '100%' }}
      >
        <CameraController />
        <color attach="background" args={['#fafafa']} />
        <Suspense fallback={null}>
          <Scene onIllustrationClick={setSelectedIllustration} />
          <Environment preset="city" environmentIntensity={0.5} />
        </Suspense>
      </Canvas>

      {/* Standard HTML Illustration Modal */}
      {selectedIllustration && (
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0,
            width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(12px)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out',
            animation: 'fadeIn 0.3s ease-out'
          }}
          onClick={() => setSelectedIllustration(null)}
        >
          <div style={{
            position: 'relative',
            maxWidth: '90%',
            maxHeight: '80%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <img 
              src={selectedIllustration.src} 
              alt={selectedIllustration.title}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: '12px',
                boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            />
            <div style={{
              marginTop: '24px',
              textAlign: 'center',
              color: 'white',
            }}>
              <h2 style={{ fontSize: '32px', margin: '0 0 12px 0', letterSpacing: '0.05em' }}>
                {selectedIllustration.title}
              </h2>
              <p style={{ fontSize: '16px', color: '#aaaaaa', margin: 0, maxWidth: '600px', lineHeight: '1.6' }}>
                {selectedIllustration.caption}
              </p>
            </div>
          </div>
          
          <div style={{
            position: 'absolute',
            top: '40px', right: '40px',
            color: 'rgba(255,255,255,0.4)',
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.2em'
          }}>
            Click anywhere to close
          </div>

          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          `}} />
        </div>
      )}
    </div>
  );
}

export default App;
