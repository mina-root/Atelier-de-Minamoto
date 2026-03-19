import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState, Suspense, useEffect } from 'react';
import * as THREE from 'three';
import { Html, Image as DreiImage, useTexture, Text } from '@react-three/drei';
import { portfolioData, type GridItemData, type IllustrationItem, illustrationsData } from '../data';

// --- Layout Generation (Binary Space Partitioning) ---
interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  dataIndex: number;
  depthOffset: number;
  isContentEligible: boolean;
}

const TILE_W = 20;
const TILE_H = 15;
const MIN_BLOCK_SIZE = 0.7; // Finer grid

function generateMondrianLayout(width: number, height: number): Rect[] {
  const rects: Rect[] = [];
  let index = 0;

  function split(rect: {x: number, y: number, w: number, h: number}) {
    // If block is small enough, stop splitting
    if (rect.w <= MIN_BLOCK_SIZE * 1.5 && rect.h <= MIN_BLOCK_SIZE * 1.5) {
      rects.push({ 
        ...rect, 
        dataIndex: index++, 
        depthOffset: Math.random() * 0.3,
        isContentEligible: rect.w >= 1.2 && rect.h >= 1.2 // Content only in decent-sized blocks
      });
      return;
    }

    let splitHorizontally = Math.random() > 0.5;
    if (rect.w / rect.h > 1.5) splitHorizontally = false;
    else if (rect.h / rect.w > 1.5) splitHorizontally = true;

    // Additional randomization to create some very small and some larger blocks
    const minSplitSize = MIN_BLOCK_SIZE * 2;
    if (splitHorizontally && rect.h < minSplitSize) {
      rects.push({ ...rect, dataIndex: index++, depthOffset: Math.random() * 0.3, isContentEligible: rect.w >= 1.2 && rect.h >= 1.2 });
      return;
    }
    if (!splitHorizontally && rect.w < minSplitSize) {
      rects.push({ ...rect, dataIndex: index++, depthOffset: Math.random() * 0.3, isContentEligible: rect.w >= 1.2 && rect.h >= 1.2 });
      return;
    }

    const ratio = 0.3 + Math.random() * 0.4;

    if (splitHorizontally) {
      const splitH = rect.h * ratio;
      if (splitH < MIN_BLOCK_SIZE || rect.h - splitH < MIN_BLOCK_SIZE) {
         rects.push({ ...rect, dataIndex: index++, depthOffset: Math.random() * 0.3, isContentEligible: rect.w >= 1.2 && rect.h >= 1.2 });
         return;
      }
      split({ x: rect.x, y: rect.y, w: rect.w, h: splitH });
      split({ x: rect.x, y: rect.y + splitH, w: rect.w, h: rect.h - splitH });
    } else {
      const splitW = rect.w * ratio;
      if (splitW < MIN_BLOCK_SIZE || rect.w - splitW < MIN_BLOCK_SIZE) {
         rects.push({ ...rect, dataIndex: index++, depthOffset: Math.random() * 0.3, isContentEligible: rect.w >= 1.2 && rect.h >= 1.2 });
         return;
      }
      split({ x: rect.x, y: rect.y, w: splitW, h: rect.h });
      split({ x: rect.x + splitW, y: rect.y, w: rect.w - splitW, h: rect.h });
    }
  }

  split({ x: -width / 2, y: -height / 2, w: width, h: height });
  return rects;
}

// --- Components ---

interface WallBlockProps {
  uid: string;
  rect: Rect;
  data: GridItemData;
  isActive: boolean;
  onClick: (uid: string, data: GridItemData) => void;
  onPointerMissed: () => void;
  isIllustrating?: boolean;
  illustrationItem?: IllustrationItem;
  onIllustrationClick: (item: IllustrationItem) => void;
}

function WallBlock({ uid, rect, data, isActive, onClick, onPointerMissed, isIllustrating, illustrationItem, onIllustrationClick }: WallBlockProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const overlaysRef = useRef<THREE.Group>(null);
  const htmlOverlayRef = useRef<HTMLDivElement>(null);

  const [hovered, setHovered] = useState(false);
  const opacityRef = useRef(0);

  // Constants for individual block animation
  const [illusOffset] = useState(() => Math.random() * 0.4 + 0.2); 
  const [illusSpeed] = useState(() => Math.random() * 1.5 + 0.5); 
  const [illusPhase] = useState(() => Math.random() * Math.PI * 2);

  const isContent = data.type !== 'empty' || isIllustrating;

  // Target Z and Scale (Thickness)
  // We want the block to "emerge" forward while its back face stays at -rect.depthOffset.
  // Base thickness is 0.4.
  let targetScaleZ = 1;
  let targetZOffset = 0; // Relative to the base back position

  if (isActive) {
    targetScaleZ = 4; // Much thicker
    targetZOffset = 1.5;
  } else if (isIllustrating) {
    targetScaleZ = 2.5; // Double thickness
    targetZOffset = illusOffset;
    if (hovered) targetZOffset += 0.3;
  } else if (hovered && isContent) {
    targetScaleZ = 1.5;
    targetZOffset = 0.3;
  }

  const targetScaleXY = isActive ? 1.05 : 1;
  const targetOpacity = (isIllustrating || isActive) ? 1 : 0;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    
    // Use fixed ratios per frame rather than strict delta time for visual effects. 
    const f8 = 0.1;
    const f6 = 0.08;
    const f4 = 0.05;

    // Smoothly lerp scale and position
    meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, targetScaleXY, f8);
    meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, targetScaleXY, f8);
    meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, targetScaleZ, f6);

    // Dynamic Z offset with sine wave if illustrating
    let finalZOffset = targetZOffset;
    if (isIllustrating && !hovered && !isActive) {
      finalZOffset += Math.sin(clock.elapsedTime * illusSpeed + illusPhase) * 0.15;
    }

    // Pin the back face: pos.z = back_pos + (thickness * scale) / 2
    const currentThickness = 0.4 * meshRef.current.scale.z;
    const targetZ = -rect.depthOffset + finalZOffset + currentThickness / 2;
    meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetZ, f8);

    // Opacity lerp
    opacityRef.current = THREE.MathUtils.lerp(opacityRef.current, targetOpacity, f4);

    // Imperatively apply opacity to children meshes to bypass React's render phase
    if (overlaysRef.current) {
      overlaysRef.current.traverse((child) => {
        if ((child as any).material) {
          const mat = (child as any).material;
          mat.transparent = true;
          // Use name-based opacity for background
          if (child.name === 'captionBg') {
             mat.opacity = opacityRef.current * 0.6;
          } else {
             mat.opacity = opacityRef.current;
          }
          // Fix for Text component SDF opacity
          if ((child as any).hasOwnProperty('fillOpacity')) {
             (child as any).fillOpacity = opacityRef.current;
          }
        }
      });
    }
    
    // Imperatively apply opacity to HTML overlays
    if (htmlOverlayRef.current) {
      const alpha = Math.max((opacityRef.current - 0.5) * 2, 0);
      htmlOverlayRef.current.style.opacity = alpha.toString();
      htmlOverlayRef.current.style.visibility = alpha > 0.01 ? 'visible' : 'hidden'; 
    }
  });

  // Calculate center position relative to the macro-tile
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;

  return (
    <mesh 
      ref={meshRef}
      position={[cx, cy, -rect.depthOffset + 0.2]} // Initial center
      castShadow 
      receiveShadow
      onClick={(e) => {
        if (!isContent) return;
        e.stopPropagation();
        if (isIllustrating && illustrationItem) {
          onIllustrationClick(illustrationItem);
        } else {
          onClick(uid, data);
        }
      }}
      onPointerOver={(e) => {
        if (!isContent) return;
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
      onPointerMissed={(e) => {
        if (isActive && e.type === 'click') {
           onPointerMissed();
        }
      }}
    >
      <boxGeometry args={[rect.w, rect.h, 0.4]} />
      <meshPhysicalMaterial 
        color={!isIllustrating && data.type === 'empty' ? '#ffffff' : (hovered ? '#fcfcfc' : '#f4f4f4')} 
        roughness={0.2}
        clearcoat={0.3}
      />

      {/* Overlays Wrapper (Opacity handled imperatively) 
          Increased Z offsets and added renderOrder to avoid Z-fighting.
      */}
      <group ref={overlaysRef}>
        {isActive && data.type === 'image' && data.src && (
          <Suspense fallback={null}>
            <DreiImage url={data.src} position={[0, 0, 0.205]} scale={[rect.w, rect.h]} transparent opacity={0} renderOrder={1} />
          </Suspense>
        )}
        
        {/* Illustration Folder Initial Title */}
        {!isActive && data.type === 'illustration_folder' && (
           <Html 
             transform 
             position={[0, 0, 0.22]} 
             distanceFactor={4} 
             zIndexRange={[100, 0]}
             style={{ pointerEvents: 'none' }}
           >
             <div style={{
               background: 'rgba(255,255,255,0.9)',
               padding: '4px 10px',
               borderRadius: '4px',
               border: '1px solid #333',
               boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
             }}>
               <h2 style={{ color: '#000', fontSize: '14px', margin: 0, fontWeight: '700', whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>
                 {data.title}
               </h2>
             </div>
           </Html>
        )}

        {/* Illustration Folder Active Overlay */}
        {isActive && data.type === 'illustration_folder' && data.src && (
          <group>
            <Suspense fallback={null}>
              <DreiImage url={data.src} position={[0, 0, 0.205]} scale={[rect.w, rect.h]} transparent opacity={0} renderOrder={1} />
            </Suspense>
            <Html 
              transform 
              position={[0, 0, 0.22]} 
              distanceFactor={4} 
              zIndexRange={[100, 0]}
              style={{ pointerEvents: 'none' }}
            >
              <div ref={htmlOverlayRef} style={{
                 background: 'rgba(0,0,0,0.7)',
                 padding: '8px 16px',
                 borderRadius: '6px',
                 backdropFilter: 'blur(10px)',
                 border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <h2 style={{ color: 'white', textShadow: '0 1px 4px rgba(0,0,0,0.5)', fontSize: '18px', margin: 0, whiteSpace: 'nowrap' }}>
                  {data.title}
                </h2>
              </div>
            </Html>
          </group>
        )}

        {/* Illustration Display (Full Bleed with Fade) */}
        {isIllustrating && illustrationItem && (
          <group>
            {/* Note: DreiImage scale [w, h] makes it fill the block */}
            <Suspense fallback={null}>
              <DreiImage 
                url={illustrationItem.src} 
                position={[0, 0, 0.205]} 
                scale={[rect.w, rect.h]}
                transparent
                opacity={0} 
                renderOrder={1}
              />
            </Suspense>
            
            {/* Caption Overlay via WebGL Text */}
            {(illustrationItem.title || illustrationItem.caption) && (
              <group position={[0, -rect.h * 0.45 + 0.3, 0.21]}>
                <mesh name="captionBg" position={[0, 0, -0.005]} renderOrder={2}>
                  <planeGeometry args={[rect.w * 0.9, 0.5]} />
                  <meshBasicMaterial color="#000000" transparent opacity={0} />
                </mesh>
                {illustrationItem.title && (
                  <Text position={[0, 0.1, 0]} fontSize={0.12} color="#ffffff" anchorX="center" anchorY="middle" material-transparent fillOpacity={0} renderOrder={3}>
                    {illustrationItem.title}
                  </Text>
                )}
                {illustrationItem.caption && (
                  <Text position={[0, -0.1, 0]} fontSize={0.08} color="#dddddd" anchorX="center" anchorY="middle" material-transparent fillOpacity={0} renderOrder={3}>
                    {illustrationItem.caption}
                  </Text>
                )}
              </group>
            )}
          </group>
        )}
        
        {isActive && data.type === 'youtube' && data.videoId && (
          <Html transform position={[0, 0, 0.21]} distanceFactor={3} zIndexRange={[100, 0]}>
            <div ref={htmlOverlayRef}>
              <iframe 
                width="560" height="315" 
                src={`https://www.youtube.com/embed/${data.videoId}`} 
                title="YouTube player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope" 
                allowFullScreen
                style={{ borderRadius: '8px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', pointerEvents: 'auto' }}
              ></iframe>
            </div>
          </Html>
        )}

        {isActive && data.type === 'contact' && (
          <Html transform position={[0, 0, 0.21]} distanceFactor={2} zIndexRange={[100, 0]}>
            <div ref={htmlOverlayRef} style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', width: '320px', textAlign: 'center', pointerEvents: 'auto' }}>
              <h2 style={{ margin: '0 0 15px 0', fontSize: '26px' }}>{data.title}</h2>
              <p style={{ whiteSpace: 'pre-wrap', color: '#444' }}>{data.description}</p>
            </div>
          </Html>
        )}
        
        {isActive && data.type === 'project' && (
          <Html transform position={[0, 0, 0.21]} distanceFactor={2} zIndexRange={[100, 0]}>
            <div ref={htmlOverlayRef} style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', width: '280px', textAlign: 'center', pointerEvents: 'auto' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '22px' }}>{data.title}</h3>
              <p style={{ color: '#555', marginBottom: '20px' }}>{data.description}</p>
              <a href={data.src} target="_blank" rel="noreferrer" style={{ display: 'inline-block', padding: '10px 20px', background: '#111', color: 'white', textDecoration: 'none', borderRadius: '6px' }}>
                View Project
              </a>
            </div>
          </Html>
        )}
      </group>
    </mesh>
  );
}

export function InfiniteWall({ onIllustrationClick }: { onIllustrationClick: (item: IllustrationItem) => void }) {
  const [activeUid, setActiveUid] = useState<string | null>(null);
  const [illustrationMode, setIllustrationMode] = useState(false);
  const [activeIllustrationItems, setActiveIllustrationItems] = useState<IllustrationItem[]>([]);
  
  // Preload textures immediately to stop GPU decoding blocks causing animation jitter
  useEffect(() => {
    useTexture.preload(illustrationsData.map(item => item.src));
  }, []);
  
  const layout = useMemo(() => generateMondrianLayout(TILE_W, TILE_H), []);
  const tilesRef = useRef<THREE.Group[]>([]);

  // Calculate fixed illustration assignments for the layout to ensure consistency and no duplicates
  const illustrationAssignments = useMemo(() => {
    if (!illustrationMode || activeIllustrationItems.length === 0) return new Map<number, IllustrationItem>();
    
    const assignments = new Map<number, IllustrationItem>();
    const eligibleIndices = layout
      .map((rect, i) => ({ rect, i }))
      .filter(({ rect }) => rect.isContentEligible && portfolioData[rect.dataIndex % portfolioData.length].type === 'empty');
    
    // Pick the best match for each illustration based on aspect ratio
    const usedIndices = new Set<number>();
    
    activeIllustrationItems.forEach((item) => {
      let bestIndex = -1;
      let minDiff = Infinity;
      
      eligibleIndices.forEach(({ rect, i }) => {
        if (usedIndices.has(i)) return;
        const rectRatio = rect.w / rect.h;
        const diff = Math.abs(rectRatio - item.aspectRatio);
        if (diff < minDiff) {
          minDiff = diff;
          bestIndex = i;
        }
      });
      
      if (bestIndex !== -1) {
        assignments.set(bestIndex, item);
        usedIndices.add(bestIndex);
      }
    });
    
    return assignments;
  }, [layout, activeIllustrationItems, illustrationMode]);

  // We use 9 macro-tiles in a 3x3 grid around the camera
  useFrame(({ camera }) => {
    const cx = camera.position.x;
    const cy = camera.position.y;
    
    // Nearest tile center point
    const centerX = Math.round(cx / TILE_W) * TILE_W;
    const centerY = Math.round(cy / TILE_H) * TILE_H;

    tilesRef.current.forEach((group, i) => {
      if (!group) return;
      // Map 0-8 to a 3x3 grid (-1 to 1)
      const tx = (i % 3) - 1;
      const ty = Math.floor(i / 3) - 1;
      
      group.position.x = centerX + tx * TILE_W;
      group.position.y = centerY + ty * TILE_H;
    });
  });

  const handleBlockClick = (uid: string, data: GridItemData) => {
    setActiveUid(uid);
    if (data.type === 'illustration_folder') {
      setIllustrationMode(true);
      setActiveIllustrationItems(data.illustrationItems || []);
    } else {
      // NOTE: We don't turn off illustrationMode here if the user clicks other contents
      // but according to the request, they want it to switch ONLY when other items are selected.
      // For now, let's keep it persisting if it's already on, unless we explicitly define a "switch".
      // If the user clicks an 'empty' block (which might be an illustration), we keep it.
      if (data.type !== 'empty' && data.type !== 'illustration_folder') {
        // Maybe switch off illustration mode? User said "はじめて切り替わるように".
        // Let's assume for now that if they pick something else that has its own mode, it switches.
        // But for now, let's just make it persistent against background clicks.
      }
    }
  };

  const handlePointerMissed = () => {
    // Only clear active selection, NOT the mode.
    setActiveUid(null);
  };

  const renderTile = (tileIndex: number) => {
    return (
      <group key={`tile-${tileIndex}`} ref={(el) => (tilesRef.current[tileIndex] = el as THREE.Group)}>
        {layout.map((rect, i) => {
          const baseIndex = rect.dataIndex % portfolioData.length;
          const dataItem = portfolioData[baseIndex];
          const illustrationItem = illustrationAssignments.get(i);
          const uid = `tile-${tileIndex}-rect-${i}`;
          
          return (
            <WallBlock 
              key={uid}
              uid={uid}
              rect={rect}
              data={dataItem}
              isActive={activeUid === uid}
              onClick={handleBlockClick}
              onPointerMissed={handlePointerMissed}
              isIllustrating={!!illustrationItem}
              illustrationItem={illustrationItem}
            onIllustrationClick={onIllustrationClick}
          />
        );
      })}
    </group>
  );
};

// 9 tiles for seamless rendering around camera
return (
  <>
    <group>{Array.from({ length: 9 }).map((_, i) => renderTile(i))}</group>
  </>
);
}
