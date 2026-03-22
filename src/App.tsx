import { Canvas, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useState } from 'react';
import * as THREE from 'three';
import { CameraController } from './components/CameraController';
import { InfiniteWall } from './components/InfiniteWall';
import { type IllustrationItem } from './data';
import { THEME } from './theme';
import './index.css';

function ResponsiveCamera() {
  const { camera, size } = useThree();
  useEffect(() => {
    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const pCam = camera as THREE.PerspectiveCamera;
      
      // We want to maintain a constant "Pixels per Unit" at the Z=0 plane.
      // At THEME.camera.fov (40) and THEME.camera.initialZ (8), 
      // the visible vertical height in units is:
      // staticHeightUnits = 2 * initialZ * Math.tan( (40 * Math.PI) / 360 )
      // = 16 * 0.3639 = 5.82 units.
      // If we assume this was tailored for a standard window height (e.g., 800px),
      // then 5.82 units = 800 pixels -> ~137 pixels per unit.
      
      const referenceHeight = 800; // Reference window height for the intended look
      const vFovBaselineRad = (THEME.camera.fov * Math.PI) / 180;
      const unitsAtZ0 = 2 * THEME.camera.initialZ * Math.tan(vFovBaselineRad / 2);
      const pixelsPerUnit = referenceHeight / unitsAtZ0;

      // Now we calculate the FOV for the CURRENT window size to keep pixelsPerUnit constant
      // tan(fov/2) = (size.height / pixelsPerUnit) / (2 * camera.position.z)
      const currentHeightUnits = size.height / pixelsPerUnit;
      const newVFovRad = 2 * Math.atan(currentHeightUnits / (2 * THEME.camera.initialZ));
      const newVFovDeg = (newVFovRad * 180) / Math.PI;

      pCam.fov = newVFovDeg;
      pCam.updateProjectionMatrix();
    }
  }, [size, camera]);
  return null;
}

function Scene({ 
  onIllustrationClick, 
  onTextClick,
  isModalOpen 
}: { 
  onIllustrationClick: (item: IllustrationItem) => void, 
  onTextClick: (title: string, content: string) => void,
  isModalOpen: boolean 
}) {
  return (
    <>
      <ambientLight intensity={1.2} />
      <directionalLight 
        position={[2, 5, 5]} 
        intensity={THEME.colors.directLight} 
      />
      
      {/* Background Plane */}
      <mesh position={[0, 0, -2]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color={THEME.colors.scenePlane} roughness={1} />
      </mesh>

      <InfiniteWall 
        onIllustrationClick={onIllustrationClick} 
        onTextClick={onTextClick}
        isModalOpen={isModalOpen} 
      />
    </>
  );
}

function App() {
  const [selectedIllustration, setSelectedIllustration] = useState<IllustrationItem | null>(null);
  const [selectedText, setSelectedText] = useState<{ title: string, content: string } | null>(null);

  const closeModal = () => {
    setSelectedIllustration(null);
    setSelectedText(null);
  };

  const isModalOpen = !!selectedIllustration || !!selectedText;

  return (
    <div 
      className={isModalOpen ? 'modal-is-open' : ''}
      style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}
    >
      <Canvas
        gl={{ toneMappingExposure: 1.2, antialias: false }}
        camera={{ position: [0, 0, THEME.camera.initialZ], fov: THEME.camera.fov }}
        style={{ width: '100%', height: '100%' }}
        dpr={[1, 1.5]}
      >
        <ResponsiveCamera />
        <CameraController />
        <color attach="background" args={[THEME.colors.background]} />
        <Suspense fallback={null}>
          <Scene 
            onIllustrationClick={setSelectedIllustration} 
            onTextClick={(title, content) => setSelectedText({ title, content })}
            isModalOpen={isModalOpen}
          />
        </Suspense>
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
            zIndex: 2147483647,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out',
            animation: 'fadeIn 0.3s ease-out'
          }}
          onClick={closeModal}
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

      {/* Text Content Modal */}
      {selectedText && (
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0,
            width: '100vw', height: '100vh',
            background: THEME.colors.modalBackground,
            backdropFilter: 'blur(12px)',
            zIndex: 2147483647,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out',
            animation: 'fadeIn 0.3s ease-out'
          }}
          onClick={closeModal}
        >
          <div 
            style={{
              position: 'relative',
              maxWidth: '800px',
              width: '90%',
              maxHeight: '80vh',
              background: 'rgba(20, 20, 20, 0.8)',
              borderRadius: THEME.block.borderRadius,
              padding: '40px',
              color: 'white',
              boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.1)',
              cursor: 'auto',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ 
              fontSize: '32px', 
              margin: '0 0 24px 0', 
              letterSpacing: '0.05em',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              paddingBottom: '16px'
            }}>
              {selectedText.title}
            </h2>
            <div style={{ 
              fontSize: '16px', 
              lineHeight: '1.8', 
              whiteSpace: 'pre-wrap',
              color: THEME.colors.textMuted
            }}>
              {selectedText.content}
            </div>
            
            <button 
              onClick={closeModal}
              style={{
                marginTop: '40px',
                padding: '12px 24px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                borderRadius: '4px',
                cursor: 'pointer',
                alignSelf: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              閉じる
            </button>
          </div>

          <div style={{
            position: 'absolute',
            top: '40px', right: '40px',
            color: 'rgba(255,255,255,0.4)',
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.2em'
          }}>
            Click anywhere outside to close
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
