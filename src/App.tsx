import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { Suspense } from 'react';
import { CameraController } from './components/CameraController';
import { InfiniteWall } from './components/InfiniteWall';
import { useState } from 'react';
import { type IllustrationItem } from './data';
import { THEME } from './theme';
import './index.css';

 function Scene({ onIllustrationClick }: { onIllustrationClick: (item: IllustrationItem) => void }) {
  return (
    <>
      <ambientLight intensity={THEME.colors.ambientLight} />
      <directionalLight 
        castShadow 
        position={[2, 5, 5]} 
        intensity={THEME.colors.directLight} 
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      
      {/* Background Plane for deep shadows */}
      <mesh receiveShadow position={[0, 0, -2]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color={THEME.colors.scenePlane} roughness={1} />
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
        camera={{ position: [0, 0, THEME.camera.initialZ], fov: THEME.camera.fov }}
        style={{ width: '100%', height: '100%' }}
      >
        <CameraController />
        <color attach="background" args={[THEME.colors.background]} />
        <Suspense fallback={null}>
          <Scene onIllustrationClick={setSelectedIllustration} />
          <Environment preset="city" environmentIntensity={THEME.colors.environmentIntensity} />
        </ Suspense>
      </Canvas>

      {/* Standard HTML Illustration Modal */}
      {selectedIllustration && (
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0,
            width: '100vw', height: '100vh',
            background: THEME.colors.modalBackground,
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
            <div style={{
              width: '100%',
              aspectRatio: selectedIllustration.aspectRatio || (selectedIllustration.type === 'youtube' ? 1.7778 : 1),
              maxWidth: '1200px',
              maxHeight: '70vh',
              position: 'relative',
              borderRadius: THEME.block.borderRadius,
              overflow: 'hidden',
              boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              {selectedIllustration.type === 'youtube' ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${selectedIllustration.videoId}?autoplay=1`}
                  title={selectedIllustration.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  style={{ border: 'none' }}
                />
              ) : selectedIllustration.type === 'soundcloud' ? (
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="no"
                  scrolling="no"
                  allow="autoplay"
                  src={`https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${selectedIllustration.trackId}&color=%23ff5500&auto_play=true&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`}
                  style={{ border: 'none' }}
                />
              ) : (
                <img 
                  src={selectedIllustration.src} 
                  alt={selectedIllustration.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                />
              )}
            </div>
            <div style={{
              marginTop: '24px',
              textAlign: 'center',
              color: 'white',
            }}>
              <h2 style={{ fontSize: '32px', margin: '0 0 12px 0', letterSpacing: '0.05em' }}>
                {selectedIllustration.title}
              </h2>
              <p style={{ fontSize: '16px', color: THEME.colors.textMuted, margin: 0, maxWidth: '600px', lineHeight: '1.6' }}>
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
