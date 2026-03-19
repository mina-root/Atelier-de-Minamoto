import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Html, Image as DreiImage } from '@react-three/drei';
import { portfolioData, type GridItemData } from '../data';

// --- Layout Generation (Binary Space Partitioning) ---
interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  dataIndex: number;
  depthOffset: number;
}

const TILE_W = 20;
const TILE_H = 15;
const MIN_BLOCK_SIZE = 1.5;

function generateMondrianLayout(width: number, height: number): Rect[] {
  const rects: Rect[] = [];
  let index = 0;

  function split(rect: {x: number, y: number, w: number, h: number}) {
    if (rect.w <= MIN_BLOCK_SIZE * 1.5 && rect.h <= MIN_BLOCK_SIZE * 1.5) {
      rects.push({ ...rect, dataIndex: index++, depthOffset: Math.random() * 0.3 });
      return;
    }

    let splitHorizontally = Math.random() > 0.5;
    if (rect.w / rect.h > 1.5) splitHorizontally = false;
    else if (rect.h / rect.w > 1.5) splitHorizontally = true;

    if (splitHorizontally && rect.h < MIN_BLOCK_SIZE * 2) {
      rects.push({ ...rect, dataIndex: index++, depthOffset: Math.random() * 0.3 });
      return;
    }
    if (!splitHorizontally && rect.w < MIN_BLOCK_SIZE * 2) {
      rects.push({ ...rect, dataIndex: index++, depthOffset: Math.random() * 0.3 });
      return;
    }

    const ratio = 0.3 + Math.random() * 0.4;

    if (splitHorizontally) {
      const splitH = rect.h * ratio;
      if (splitH < MIN_BLOCK_SIZE || rect.h - splitH < MIN_BLOCK_SIZE) {
         rects.push({ ...rect, dataIndex: index++, depthOffset: Math.random() * 0.3 });
         return;
      }
      split({ x: rect.x, y: rect.y, w: rect.w, h: splitH });
      split({ x: rect.x, y: rect.y + splitH, w: rect.w, h: rect.h - splitH });
    } else {
      const splitW = rect.w * ratio;
      if (splitW < MIN_BLOCK_SIZE || rect.w - splitW < MIN_BLOCK_SIZE) {
         rects.push({ ...rect, dataIndex: index++, depthOffset: Math.random() * 0.3 });
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
  onClick: (uid: string) => void;
  onPointerMissed: () => void;
}

function WallBlock({ uid, rect, data, isActive, onClick, onPointerMissed }: WallBlockProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Target values: pop out significantly if active, slightly if hovered
  const isContent = data.type !== 'empty';
  const targetZ = isActive ? 1.5 : (hovered && isContent ? 0.3 : -rect.depthOffset);
  const targetScale = isActive ? 1.05 : 1;

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetZ, 8 * delta);
    meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, 8 * delta);
    meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, targetScale, 8 * delta);
    meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, targetScale, 8 * delta);
  });

  // Calculate center position relative to the macro-tile
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;

  return (
    <mesh 
      ref={meshRef}
      position={[cx, cy, -rect.depthOffset]}
      castShadow 
      receiveShadow
      onClick={(e) => {
        if (!isContent) return;
        e.stopPropagation();
        onClick(uid);
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
        color={!isContent ? '#ffffff' : (hovered ? '#fcfcfc' : '#f4f4f4')} 
        roughness={0.2}
        clearcoat={0.3}
      />

      {/* Overlays */}
      {isActive && data.type === 'image' && data.src && (
         <DreiImage url={data.src} position={[0, 0, 0.21]} scale={[rect.w * 0.9, rect.h * 0.9]} />
      )}
      
      {isActive && data.type === 'youtube' && data.videoId && (
        <Html transform position={[0, 0, 0.21]} distanceFactor={3} zIndexRange={[100, 0]}>
          <iframe 
            width="560" height="315" 
            src={`https://www.youtube.com/embed/${data.videoId}`} 
            title="YouTube player" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope" 
            allowFullScreen
            style={{ borderRadius: '8px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', pointerEvents: 'auto' }}
          ></iframe>
        </Html>
      )}

      {isActive && data.type === 'contact' && (
        <Html transform position={[0, 0, 0.21]} distanceFactor={2} zIndexRange={[100, 0]}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', width: '320px', textAlign: 'center', pointerEvents: 'auto' }}>
            <h2 style={{ margin: '0 0 15px 0', fontSize: '26px' }}>{data.title}</h2>
            <p style={{ whiteSpace: 'pre-wrap', color: '#444' }}>{data.description}</p>
          </div>
        </Html>
      )}
      
      {isActive && data.type === 'project' && (
        <Html transform position={[0, 0, 0.21]} distanceFactor={2} zIndexRange={[100, 0]}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', width: '280px', textAlign: 'center', pointerEvents: 'auto' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '22px' }}>{data.title}</h3>
            <p style={{ color: '#555', marginBottom: '20px' }}>{data.description}</p>
            <a href={data.src} target="_blank" rel="noreferrer" style={{ display: 'inline-block', padding: '10px 20px', background: '#111', color: 'white', textDecoration: 'none', borderRadius: '6px' }}>
              View Project
            </a>
          </div>
        </Html>
      )}
    </mesh>
  );
}

export function InfiniteWall() {
  const [activeUid, setActiveUid] = useState<string | null>(null);
  const layout = useMemo(() => generateMondrianLayout(TILE_W, TILE_H), []);
  const tilesRef = useRef<THREE.Group[]>([]);

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

  const renderTile = (tileIndex: number) => {
    return (
      <group key={`tile-${tileIndex}`} ref={(el) => (tilesRef.current[tileIndex] = el as THREE.Group)}>
        {layout.map((rect, i) => {
          const dataItem = portfolioData[rect.dataIndex % portfolioData.length];
          const uid = `tile-${tileIndex}-rect-${i}`;
          
          return (
            <WallBlock 
              key={uid}
              uid={uid}
              rect={rect}
              data={dataItem}
              isActive={activeUid === uid}
              onClick={setActiveUid}
              onPointerMissed={() => setActiveUid(null)}
            />
          );
        })}
      </group>
    );
  };

  // 9 tiles for seamless rendering around camera
  return <group>{Array.from({ length: 9 }).map((_, i) => renderTile(i))}</group>;
}
