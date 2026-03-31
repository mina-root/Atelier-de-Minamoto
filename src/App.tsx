import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { Suspense, useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { CameraController } from './components/CameraController';
import { CameraPointLight } from './components/CameraPointLight';
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
  onReportClick,
  isModalOpen 
}: { 
  onIllustrationClick: (item: IllustrationItem) => void, 
  onTextClick: (title: string, content: string) => void,
  onReportClick: (url: string) => void,
  isModalOpen: boolean 
}) {
  const { camera, viewport } = useThree();
  const lightRef = useRef<THREE.DirectionalLight>(null);

  // Calculate visible area in world units at depth=0 to optimize shadow map resolution
  const vWidth = viewport.width;
  const vHeight = viewport.height;
  const shadowMargin = 2; // Extra units around the edge to avoid shadow clipping

  useFrame(() => {
    if (lightRef.current) {
      // Light follows camera on XY to maintain shadow coverage on the infinite wall
      lightRef.current.position.set(
        camera.position.x + THEME.colors.directLightPos[0],
        camera.position.y + THEME.colors.directLightPos[1],
        THEME.colors.directLightPos[2]
      );
      lightRef.current.target.position.set(camera.position.x, camera.position.y, 0);
      lightRef.current.target.updateMatrixWorld();

      // Dynamically sync shadow camera bounds to current viewport
      const halfW = vWidth / 2 + shadowMargin;
      const halfH = vHeight / 2 + shadowMargin;
      const sCam = lightRef.current.shadow.camera;
      if (sCam.left !== -halfW || sCam.right !== halfW || sCam.top !== halfH || sCam.bottom !== -halfH) {
        sCam.left = -halfW;
        sCam.right = halfW;
        sCam.top = halfH;
        sCam.bottom = -halfH;
        sCam.updateProjectionMatrix();
      }
    }
  });

  return (
    <>
      <ambientLight intensity={THEME.colors.ambientLight} />
      <directionalLight 
        ref={lightRef}
        castShadow
        position={THEME.colors.directLightPos} 
        intensity={THEME.colors.directLight} 
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.1}
        shadow-camera-far={100}
        shadow-bias={-0.00005}
        shadow-normalBias={0.05}
      />
      <CameraPointLight />
      <Environment preset="sunset" environmentIntensity={THEME.colors.environmentIntensity} />

      
      {/* Background Plane */}
      <mesh position={[0, 0, -2]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color={THEME.colors.scenePlane} roughness={1} />
      </mesh>

      <InfiniteWall 
        onIllustrationClick={onIllustrationClick} 
        onTextClick={onTextClick}
        onReportClick={onReportClick}
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
      style={{ 
        width: '100%', 
        height: '100dvh', 
        position: 'relative', 
        overflow: 'hidden'
      }}
    >
      <Canvas
        shadows
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
            onReportClick={(url) => window.open(url, '_blank')}
            isModalOpen={isModalOpen}
          />
        </Suspense>
      </Canvas>

      {/* Standard HTML Illustration Modal */}
      {selectedIllustration && (
        <div 
          className="modal-backdrop"
          style={{
            position: 'fixed',
            top: 0, left: 0,
            width: '100%', height: '100dvh',
            background: THEME.colors.modalBackground,
            backdropFilter: 'blur(12px)',
            zIndex: 2147483647,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.3s ease-out'
          }}
          onClick={closeModal}
        >
          <div className="modal-content" style={{
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
          className="modal-backdrop"
          style={{
            position: 'fixed',
            top: 0, left: 0,
            width: '100%', height: '100dvh',
            background: THEME.colors.modalBackground,
            backdropFilter: 'blur(12px)',
            zIndex: 2147483647,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.3s ease-out'
          }}
          onClick={closeModal}
        >
          <div 
            className="modal-content"
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
