import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState, Suspense, useEffect } from 'react';
import * as THREE from 'three';
import { Html, Image as DreiImage } from '@react-three/drei';
import { aboutData, contentPoolData, requestTextDataArray, termsTextDataArray, type GridItemData, type IllustrationItem } from '../data';
import { THEME } from '../theme';
import { PaperMaterial } from './PaperMaterial';
import { MetalMaterial } from './MetalMaterial';

// --- Types & Constants ---
interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  dataIndex: number;
  depthOffset: number;
  isContentEligible: boolean;
}

const TILE_W = THEME.layout.tileWidth;
const TILE_H = THEME.layout.tileHeight;
const MIN_BLOCK_SIZE = THEME.layout.minBlockSize;

function intersects(r1: any, r2: any) {
  return !(r2.x >= r1.x + r1.w || r2.x + r2.w <= r1.x || r2.y >= r1.y + r1.h || r2.y + r2.h <= r1.y);
}

// --- Layout Logic ---
function generateMondrianLayout(width: number, height: number, isMobile: boolean): Rect[] {
  const rects: Rect[] = [];
  const prePlaced: Rect[] = [];
  const about = isMobile ? THEME.aboutMobile : THEME.aboutDesktop;

  // Indices mapping:
  // 0,1,2 = About
  // 20-49 = Content slots
  // 50-79 = Desc slots
  // 80-89 = Request Texts
  // 90-99 = Terms Texts
  // 100+ = Fillers

  prePlaced.push({ x: about.icon.x, y: about.icon.y, w: about.icon.w, h: about.icon.h, dataIndex: 1, depthOffset: about.icon.depth, isContentEligible: false });
  prePlaced.push({ x: about.name.x, y: about.name.y, w: about.name.w, h: about.name.h, dataIndex: 0, depthOffset: about.name.depth, isContentEligible: false });
  prePlaced.push({ x: about.text.x, y: about.text.y, w: about.text.w, h: about.text.h, dataIndex: 2, depthOffset: about.text.depth, isContentEligible: false });

  const akkeyRes = isMobile 
    ? { x: -2.0, y: -3.2, w: 4.0, h: 1.2 } 
    : { x: -2.3, y: -3.0, w: 4.6, h: 1.4 };

  if (!isMobile) {
    const desktopAbout = THEME.aboutDesktop;
    if (desktopAbout.filler) {
      prePlaced.push({ x: desktopAbout.filler.x, y: desktopAbout.filler.y, w: desktopAbout.filler.w, h: desktopAbout.filler.h, dataIndex: 3, depthOffset: desktopAbout.filler.depth, isContentEligible: false });
    }
    
    // Fixed placement for new trigger blocks
    const reqItem = requestTextDataArray[0];
    prePlaced.push({ 
      x: 4.5 + Math.random() * 0.5, 
      y: -1.0, 
      w: reqItem.width, 
      h: reqItem.height, 
      dataIndex: 80, 
      depthOffset: 0.2, 
      isContentEligible: false 
    });

    const termsItem = termsTextDataArray[0];
    prePlaced.push({ 
      x: -8.5 + Math.random() * 0.5, 
      y: -1.0, 
      w: termsItem.width, 
      h: termsItem.height, 
      dataIndex: 90, 
      depthOffset: 0.2, 
      isContentEligible: false 
    });

  } else {
    // Mobile placement
    const reqItem = requestTextDataArray[0];
    prePlaced.push({ 
      x: -reqItem.width / 2, 
      y: -4.0, 
      w: reqItem.width, 
      h: reqItem.height, 
      dataIndex: 80, 
      depthOffset: 0.2, 
      isContentEligible: false 
    });

    const termsItem = termsTextDataArray[0];
    prePlaced.push({ 
      x: -termsItem.width / 2, 
      y: -6.5, 
      w: termsItem.width, 
      h: termsItem.height, 
      dataIndex: 90, 
      depthOffset: 0.2, 
      isContentEligible: false 
    });
  }

  // 3. Content + Desc Pairs
  const scale = isMobile ? 1 : 1.3;
  const contentDefs = contentPoolData.map((d, i) => ({
    w: Math.max(1.0, d.content.width * scale), h: Math.max(1.0, d.content.height * scale),
    dw: d.desc ? Math.max(1.0, d.desc.width * scale) : 0, dh: d.desc ? Math.max(1.0, d.desc.height * scale) : 0,
    type: d.content.width >= d.content.height ? 'h' : 'v',
    dataIndex: 20 + i,
    descIndex: 50 + i
  }));

  const snap = (v: number) => Math.round(v / 0.2) * 0.2;

  for (let i = 0; i < contentDefs.length; i++) {
    const def = contentDefs[i];
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 2000) {
      attempts++;
      const cx = snap((Math.random() - 0.5) * width);
      const cy = snap((Math.random() - 0.5) * height);
      
      let dx = cx, dy = cy;
      if (def.dw > 0 && def.dh > 0) {
        if (def.type === 'h') {
          dy = snap(cy - def.dh - 0.2); // Below content
          dx = snap(cx + (def.w - def.dw) * Math.random()); // Within content width
        } else {
          dx = snap(Math.random() > 0.5 ? cx + def.w + 0.2 : cx - def.dw - 0.2); // Right or left
          dy = snap(cy + (def.h - def.dh) * Math.random()); // Within content height
        }
      }

      const cRect = { x: cx, y: cy, w: def.w, h: def.h, dataIndex: def.dataIndex, depthOffset: Math.random() * 0.3, isContentEligible: false };
      const combined = [cRect];
      let dRect;
      if (def.dw > 0 && def.dh > 0) {
        dRect = { x: dx, y: dy, w: def.dw, h: def.dh, dataIndex: def.descIndex, depthOffset: Math.random() * 0.3, isContentEligible: false };
        combined.push(dRect);
      }

      let overlap = false;
      const groupPad = 0.2; 
      
      const checkWrap = (r: Rect, p: Rect) => {
        const rW = { x: r.x - groupPad, y: r.y - groupPad, w: r.w + groupPad * 2, h: r.h + groupPad * 2 };
        for (const ox of [-width, 0, width]) {
          for (const oy of [-height, 0, height]) {
            const rWrap = { ...rW, x: rW.x + ox, y: rW.y + oy };
            if (intersects(rWrap, p)) return true;
          }
        }
        return false;
      };

      for (const p of prePlaced) {
        if (combined.some(r => checkWrap(r, p))) {
          overlap = true;
          break;
        }
      }
      if (!overlap && combined.some(r => checkWrap(r, akkeyRes as Rect))) {
        overlap = true;
      }

      if (!overlap) {
        prePlaced.push(cRect);
        if (dRect) prePlaced.push(dRect);
        placed = true;
      }
    }
  }

  rects.push(...prePlaced);

  // 4. Grid Fill
  const allPlaced = prePlaced.flatMap(p => {
    const clones = [];
    for (const ox of [-width, 0, width]) {
      for (const oy of [-height, 0, height]) {
        if (p.x + ox < width/2 && p.x + ox + p.w > -width/2 &&
            p.y + oy < height/2 && p.y + oy + p.h > -height/2) {
          clones.push({ ...p, x: p.x + ox, y: p.y + oy });
        }
      }
    }
    return clones;
  });

  const rawXs = [-width / 2, width / 2];
  const rawYs = [-height / 2, height / 2];
  allPlaced.forEach(p => {
    rawXs.push(Math.max(-width / 2, Math.min(width / 2, p.x)));
    rawXs.push(Math.max(-width / 2, Math.min(width / 2, p.x + p.w)));
    rawYs.push(Math.max(-height / 2, Math.min(height / 2, p.y)));
    rawYs.push(Math.max(-height / 2, Math.min(height / 2, p.y + p.h)));
  });

  const EPS = 0.01;
  const xs = rawXs.sort((a, b) => a - b).filter((v, i, a) => i === 0 || Math.abs(v - a[i - 1]) > EPS);
  const ys = rawYs.sort((a, b) => a - b).filter((v, i, a) => i === 0 || Math.abs(v - a[i - 1]) > EPS);

  const gridW = xs.length - 1;
  const gridH = ys.length - 1;
  const occupied = Array.from({ length: gridW }, () => new Array(gridH).fill(false));

  for (let i = 0; i < gridW; i++) {
    for (let j = 0; j < gridH; j++) {
      const cx = xs[i] + (xs[i + 1] - xs[i]) / 2;
      const cy = ys[j] + (ys[j + 1] - ys[j]) / 2;
      for (const p of allPlaced) {
        if (cx >= p.x && cx <= p.x + p.w && cy >= p.y && cy <= p.y + p.h) {
          occupied[i][j] = true;
          break;
        }
      }
    }
  }

  let emptyIndex = 100;
  function splitEmpty(x: number, y: number, w: number, h: number) {
    if (w <= 0 || h <= 0) return;
    if (w <= MIN_BLOCK_SIZE * 1.5 && h <= MIN_BLOCK_SIZE * 1.5) {
      rects.push({ x, y, w, h, dataIndex: emptyIndex++, depthOffset: Math.random() * 0.3, isContentEligible: true });
      return;
    }
    // Force subdivision if block is too large to avoid huge voids
    const tooLarge = w > 5 || h > 5;
    if (!isMobile && w * h > 6 && !tooLarge && Math.random() < 0.2) {
      rects.push({ x, y, w, h, dataIndex: emptyIndex++, depthOffset: Math.random() * 0.3, isContentEligible: true });
      return;
    }

    let splitHorizontally = Math.random() > 0.5;
    if (w / h > 6) splitHorizontally = false;
    else if (h / w > 6) splitHorizontally = true;

    if (splitHorizontally) {
      const ratio = 0.2 + Math.random() * 0.6;
      const sh = h * ratio;
      if (sh < MIN_BLOCK_SIZE || h - sh < MIN_BLOCK_SIZE) {
        rects.push({ x, y, w, h, dataIndex: emptyIndex++, depthOffset: Math.random() * 0.3, isContentEligible: true });
      } else {
        splitEmpty(x, y, w, sh);
        splitEmpty(x, y + sh, w, h - sh);
      }
    } else {
      const ratio = 0.2 + Math.random() * 0.6;
      const sw = w * ratio;
      if (sw < MIN_BLOCK_SIZE || w - sw < MIN_BLOCK_SIZE) {
        rects.push({ x, y, w, h, dataIndex: emptyIndex++, depthOffset: Math.random() * 0.3, isContentEligible: true });
      } else {
        splitEmpty(x, y, sw, h);
        splitEmpty(x + sw, y, w - sw, h);
      }
    }
  }

  for (let j = 0; j < gridH; j++) {
    for (let i = 0; i < gridW; i++) {
      if (!occupied[i][j]) {
        let wCount = 1;
        while (i + wCount < gridW && !occupied[i + wCount][j]) wCount++;
        let hCount = 1;
        let canExpand = true;
        while (j + hCount < gridH && canExpand) {
          for (let k = 0; k < wCount; k++) if (occupied[i + k][j + hCount]) { canExpand = false; break; }
          if (canExpand) hCount++;
        }
        for (let dj = 0; dj < hCount; dj++) for (let di = 0; di < wCount; di++) occupied[i + di][j + dj] = true;
        splitEmpty(xs[i], ys[j], xs[i + wCount] - xs[i], ys[j + hCount] - ys[j]);
      }
    }
  }

  return rects;
}

// --- Constants for materials ---
const BOX_GEO = new THREE.BoxGeometry(1, 1, 1);
const LIGHT_POS_V = new THREE.Vector3(...THEME.colors.directLightPos);

// --- Deterministic Float Utility ---
function getBlockFloat(idx: number, clock: number) {
  const seed = (idx * 555.555) % 1;
  const speed = 0.4 + seed * 0.8;
  const phase = seed * Math.PI * 2;
  const offset = 0.1 + seed * 0.2;
  return {
    z: Math.sin(clock * speed + phase) * 0.1,
    offset
  };
}

function EmptyBlock({ rect }: { rect: Rect }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<any>(null);
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;

  useFrame(({ camera }) => {
    if (matRef.current?.uniforms) {
      matRef.current.uniforms.uLightPos.value.copy(camera.position);
    }
  });

  const color = (rect.dataIndex % 4 === 0) ? (THEME.colors as any).blockEmptyAccent : THEME.colors.blockEmpty;

  return (
    <mesh 
      ref={meshRef}
      position={[cx, cy, -rect.depthOffset - 1.1]} // Adjusted center for 3.0 thickness (front stays at -rect.depthOffset + 0.4)
      scale={[rect.w, rect.h, 3.0]}
      geometry={BOX_GEO}
      castShadow
      receiveShadow
    >
      <PaperMaterial 
        ref={matRef} 
        color={color} 
        uGrainScale={THEME.materials.paper.grainScale} 
        uGrainIntensity={THEME.materials.paper.grainIntensity} 
        uRoughness={THEME.materials.paper.roughness}
        uLightIntensity={THEME.colors.cameraPointLightIntensity} 
        uAmbientIntensity={THEME.colors.ambientLight}
        uDirectLightIntensity={THEME.colors.directLight}
        uDirectLightPos={LIGHT_POS_V}
        uEnvironmentIntensity={THEME.colors.environmentIntensity}
      />
    </mesh>
  );
}

// --- Component: WallBlock ---
interface WallBlockProps {
  uid: string;
  rect: Rect;
  data: GridItemData;
  onClick: (uid: string) => void;
  illustrationItem?: IllustrationItem;
  onIllustrationClick: (item: IllustrationItem) => void;
  onTextClick?: (title: string, content: string) => void;
  isModalOpen?: boolean;
}

function WallBlock({ uid, rect, data, onClick, illustrationItem, onIllustrationClick, onTextClick, isModalOpen }: WallBlockProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<any>(null);
  const overlaysRef = useRef<THREE.Group>(null);
  const pointerDownPos = useRef<{ x: number, y: number } | null>(null);
  const [hovered, setHovered] = useState(false);
  const opacityRef = useRef(0);

  const isProfileAbout = data.id?.startsWith('about-');
  const isContentHost = illustrationItem || data.type !== 'empty';
  const isInteractive = data.type !== 'empty';
  const isLargeText = data.id?.startsWith('text-request') || data.id?.startsWith('text-terms');

  let targetScaleZ = 1;

  if (isContentHost && !isProfileAbout) {
    targetScaleZ = 1.15;
    if (hovered && isInteractive && !isModalOpen) targetScaleZ += 0.1; // adding some feel
  } else if (hovered && isInteractive && !isModalOpen) {
    targetScaleZ = 1.3;
  }

  const isThemedAbout = isProfileAbout || isLargeText; 
  const showContent = isContentHost;
  const targetOpacity = showContent ? 1 : 0;

  useFrame(({ camera, clock }) => {
    if (!meshRef.current) return;
    const fPos = 0.1, fSca = 0.15, fOpa = 0.2;

    const finalTargetScaleZ = 3.0 * targetScaleZ;
    meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, finalTargetScaleZ, fSca);

    let zFloating = 0;
    const { z: fZ, offset: fOff } = getBlockFloat(rect.dataIndex, clock.elapsedTime);
    if (isContentHost && !isProfileAbout && !hovered && !isModalOpen) {
      zFloating = fZ;
    }
    const zOff = (isContentHost && !isProfileAbout) ? fOff : (hovered ? 0.2 : 0);

    const thickness = meshRef.current.scale.z;
    // Position adjusted so front face remains consistent while block extends deep into background
    const targetZ = -rect.depthOffset + zOff + zFloating + 0.4 - (thickness / 2);
    meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetZ, fPos);

    opacityRef.current = THREE.MathUtils.lerp(opacityRef.current, targetOpacity, fOpa);
    if (matRef.current) {
      if (matRef.current.uniforms) {
        matRef.current.uniforms.uLightPos.value.copy(camera.position);
      }
      matRef.current.opacity = opacityRef.current;
      matRef.current.transparent = true;
    }

    if (overlaysRef.current) {
      overlaysRef.current.traverse((c) => {
        if ((c as any).material) {
          (c as any).material.transparent = true;
          (c as any).material.opacity = opacityRef.current;
          if ((c as any).fillOpacity !== undefined) (c as any).fillOpacity = opacityRef.current;
        }
      });
    }
  });

  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;

  return (
    <mesh
      ref={meshRef}
      position={[cx, cy, 0]}
      scale={[rect.w, rect.h, 0.4]} 
      geometry={BOX_GEO}
      castShadow
      receiveShadow
      onPointerDown={(e) => {
        if (!isInteractive || isModalOpen) return;
        pointerDownPos.current = { x: e.clientX, y: e.clientY };
      }}
      onClick={(e) => {
        if (!isInteractive || isModalOpen) return;
        
        // Threshold check: prevent click if cursor moved significantly
        if (pointerDownPos.current) {
          const dx = e.clientX - pointerDownPos.current.x;
          const dy = e.clientY - pointerDownPos.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 10) return;
        }

        e.stopPropagation();

        if (illustrationItem && (illustrationItem.type === 'image' || !illustrationItem.type)) {
          onIllustrationClick(illustrationItem);
        } else if (isLargeText && onTextClick && data.title && data.description) {
          onTextClick(data.title, data.description);
        } else {
          onClick(uid);
        }
      }}
      onPointerOver={(e) => { 
        if (isInteractive && !isModalOpen) { 
          e.stopPropagation(); 
          setHovered(true); 
          document.body.style.cursor = 'pointer'; 
        } 
      }}
      onPointerOut={() => { 
        setHovered(false); 
        document.body.style.cursor = 'auto'; 
      }}
    >
      <MetalMaterial
        ref={matRef}
        color={showContent ? (isThemedAbout ? THEME.colors.blockAbout : THEME.colors.blockDefault) : THEME.colors.blockEmpty}
        uGrainScale={showContent ? THEME.materials.metal.grainScale : THEME.materials.metalEmpty.grainScale}
        uGrainIntensity={showContent ? THEME.materials.metal.grainIntensity : THEME.materials.metalEmpty.grainIntensity}
        uRoughness={showContent ? THEME.materials.metal.roughness : THEME.materials.metalEmpty.roughness}
        uMetalness={showContent ? THEME.materials.metal.metalness : THEME.materials.metalEmpty.metalness}
        uLightIntensity={THEME.colors.cameraPointLightIntensity}
        uAmbientIntensity={THEME.colors.ambientLight}
        uDirectLightIntensity={THEME.colors.directLight}
        uDirectLightPos={LIGHT_POS_V}
        uEnvironmentIntensity={THEME.colors.environmentIntensity}
        transparent
      />
      <group ref={overlaysRef} scale={[1/rect.w, 1/rect.h, 1]}>
        {/* Only render 3D Image (Texture-based) in tiles. Heavy Html removed. */}
        {illustrationItem && (illustrationItem.type === 'image' || !illustrationItem.type) && (
          <Suspense fallback={null}>
            <DreiImage 
              url={illustrationItem.src} 
              scale={[rect.w, rect.h]} 
              position={[0, 0, 0.505]} 
              transparent 
              opacity={0} 
              toneMapped={false}
            />
          </Suspense>
        )}
        {data.type === 'about_icon' && (
          <AboutIcon />
        )}
      </group>
    </mesh>
  );
}

// --- Component: IndependentEmbed (Global Iframe Layer) ---
function IndependentEmbed({ rect, data, illustrationItem }: { rect: Rect, data: GridItemData, illustrationItem?: IllustrationItem }) {
  const ref = useRef<THREE.Group>(null);
  const isProfileAbout = data.id?.startsWith('about-');
  const isLargeText = data.id?.startsWith('text-request') || data.id?.startsWith('text-terms');

  useFrame(({ camera, clock }) => {
    if (!ref.current) return;
    
    // Calculate closest loop position relative to camera
    const nx = Math.round((camera.position.x - rect.x) / TILE_W);
    const ny = Math.round((camera.position.y - rect.y) / TILE_H);
    const targetWX = TILE_W * nx + (rect.x + rect.w/2);
    const targetWY = TILE_H * ny + (rect.y + rect.h/2);

    // Get floating Z (Syncing with deterministic brick float)
    const { z: fZ, offset: fOff } = getBlockFloat(rect.dataIndex, clock.elapsedTime);
    const zHost = (data.type !== 'empty' && !isProfileAbout) ? fOff : 0;
    
    // We match the Z of WallBlock (CENTER + zHost + fZ) and add the surface offset.
    // Ensure visibility even when block is at max thickness (hovered = 1.3 * 0.4 = 0.52 thk total, face at 0.26).
    const targetWZ = (-rect.depthOffset) + zHost + fZ + 0.451; 

    ref.current.position.x = targetWX;
    ref.current.position.y = targetWY;
    ref.current.position.z = THREE.MathUtils.lerp(ref.current.position.z, targetWZ, 0.1);
  });

  return (
    <group ref={ref}>
      {illustrationItem?.type === 'youtube' && (
        <Html transform scale={0.3} className="wall-html-content" style={{ width: `${rect.w * 133}px`, height: `${rect.h * 133}px`, pointerEvents: 'auto' }}>
          <div style={{ width: '100%', height: '100%', overflow: 'hidden', background: '#000' }}>
            <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${illustrationItem.videoId}?controls=1&rel=0&modestbranding=1`} title={illustrationItem.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" style={{ border: 'none', width: '100%', height: '100%' }} />
          </div>
        </Html>
      )}
      {illustrationItem?.type === 'soundcloud' && (
        <Html transform scale={0.4} className="wall-html-content" style={{ width: `${rect.w * 100}px`, height: `${rect.h * 100}px`, pointerEvents: 'auto' }}>
          <div style={{ width: '100%', height: '100%', overflow: 'hidden', background: '#000' }}>
            <iframe width="100%" height="100%" frameBorder="no" scrolling="no" allow="autoplay" src={`https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${illustrationItem.trackId}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&visual=true`} style={{ border: 'none', width: '100%', height: '100%' }} />
          </div>
        </Html>
      )}
      {data.type === 'about_name' && (
        <Html transform position={[0, 0, 0]} distanceFactor={1.5} pointerEvents="none" className="wall-html-content">
          <div style={{ textAlign: 'center', color: '#111', width: '600px', userSelect: 'none' }}>
            <h1 style={{ fontSize: '64px', fontWeight: 900, letterSpacing: '0.2em' }}>ミナモト</h1>
          </div>
        </Html>
      )}
      {data.type === 'about_text' && (
        <Html transform position={[0, 0, 0]} scale={isProfileAbout ? 1 : 0.2} distanceFactor={isProfileAbout ? 1.2 : undefined} pointerEvents="none" className="wall-html-content">
          <div style={{ 
            color: '#111', textAlign: (isProfileAbout || isLargeText) ? 'center' : 'left', fontWeight: isLargeText ? 700 : 400,
            fontSize: isProfileAbout ? '20px' : (isLargeText ? '32px' : '26px'), 
            fontFamily: isProfileAbout ? 'inherit' : "'DotGothic16', sans-serif",
            width: isProfileAbout ? '400px' : `${rect.w * 200}px`, height: isProfileAbout ? 'auto' : `${rect.h * 200}px`,
            whiteSpace: 'pre-wrap', lineHeight: 1.6, overflowY: 'hidden', padding: isProfileAbout ? '0' : '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box'
          }}>
            {isLargeText ? data.title : data.description}
          </div>
        </Html>
      )}
    </group>
  );
}

const OCTA_GEO_SMALL = new THREE.OctahedronGeometry(0.5);
const OCTA_GEO_LARGE = new THREE.OctahedronGeometry(0.55);

function AboutIcon() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (ref.current) { ref.current.rotation.y = clock.elapsedTime; ref.current.rotation.z = clock.elapsedTime * 0.5; } });
  return (
    <group ref={ref} position={[0, 0, 0.6]} castShadow receiveShadow>
      <mesh geometry={OCTA_GEO_SMALL} castShadow receiveShadow><meshStandardMaterial color={THEME.colors.accent} roughness={0.1} metalness={0.8} /></mesh>
      <mesh geometry={OCTA_GEO_LARGE}><meshBasicMaterial wireframe color="white" transparent opacity={0.2} /></mesh>
    </group>
  );
}

 function AcrylicKeyHolder({ position, iconUrl, logoUrl, linkUrl, iconSize = [0.8, 0.8], timeOffset = 0 }: { position: [number, number, number], iconUrl: string, logoUrl?: string, linkUrl: string, iconSize?: [number, number], timeOffset?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const logoGroupRef = useRef<THREE.Group>(null);
  const pointerDownPos = useRef<{ x: number, y: number } | null>(null);
  
  const iconTex = useMemo(() => new THREE.TextureLoader().load(iconUrl), [iconUrl]);
  const logoTex = useMemo(() => logoUrl ? new THREE.TextureLoader().load(logoUrl) : null, [logoUrl]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + timeOffset;
    if (groupRef.current) {
      // Main sway - side-to-side and depth
      groupRef.current.rotation.z = Math.sin(t * 1.5) * 0.15;
      groupRef.current.rotation.x = Math.sin(t * 0.8) * 0.12; // Increased depth sway
    }
    if (logoGroupRef.current) {
      // Secondary sway for the logo part
      logoGroupRef.current.rotation.z = Math.sin(t * 2.2) * 0.12;
      logoGroupRef.current.rotation.x = Math.sin(t * 1.2) * 0.08;
    }
  });

  const acrylicMat = (tex: THREE.Texture) => (
    <meshPhysicalMaterial 
      map={tex}
      transparent
      alphaTest={0.1}
      side={THREE.DoubleSide}
      roughness={0.02}
      metalness={0.1} // Slightly more reflective
      transmission={0.95}
      thickness={0.05}
      ior={1.49}
      clearcoat={1.0}
      clearcoatRoughness={0.0}
      envMapIntensity={2.0} // Increased luster
    />
  );

  return (
    <group 
      position={position}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      onPointerDown={(e) => {
        pointerDownPos.current = { x: e.clientX, y: e.clientY };
      }}
      onClick={(e) => { 
        if (pointerDownPos.current) {
          const dx = e.clientX - pointerDownPos.current.x;
          const dy = e.clientY - pointerDownPos.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 10) return;
        }
        e.stopPropagation(); 
        window.open(linkUrl, '_blank'); 
      }}
    >
      <group scale={0.48}> {/* Smaller scale as requested */}
        {/* Wall Hook (Protrusion) - Deep cylinder to prevent gaps */}
        <mesh position={[0, 0, -2.0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.05, 0.05, 4.0, 16]} />
          <meshStandardMaterial color="#b3f0ff" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Main swinging group (pivoted at top) */}
        <group ref={groupRef} position={[0, -0.1, 0]}>
          {/* Top Ring */}
          <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
            <torusGeometry args={[0.08, 0.015, 16, 32]} />
            <meshStandardMaterial color="#ccc" metalness={0.9} roughness={0.1} />
          </mesh>

          {/* Icon Block */}
          <mesh position={[0, -iconSize[1] / 2 - 0.1, 0]} castShadow receiveShadow>
            <planeGeometry args={[iconSize[0], iconSize[1]]} />
            {acrylicMat(iconTex)}
          </mesh>

          {logoTex && (
            <group position={[0, -iconSize[1] - 0.1, 0]}>
              <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
                <torusGeometry args={[0.06, 0.012, 16, 32]} />
                <meshStandardMaterial color="#ccc" metalness={0.9} roughness={0.1} />
              </mesh>

              {/* Logo swinging group */}
              <group ref={logoGroupRef} position={[0, -0.1, 0]}>
                {/* Logo Block */}
                <mesh position={[0, -0.4, 0]} castShadow receiveShadow>
                  <planeGeometry args={[1.2, 0.45]} />
                  {acrylicMat(logoTex)}
                </mesh>
              </group>
            </group>
          )}
        </group>
      </group>
    </group>
  );
}

// --- Main Component: InfiniteWall ---
export function InfiniteWall({ 
  onIllustrationClick, 
  onTextClick,
  isModalOpen 
}: { 
  onIllustrationClick: (item: IllustrationItem) => void, 
  onTextClick: (title: string, content: string) => void,
  isModalOpen: boolean 
}) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < THEME.layout.mobileThreshold);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < THEME.layout.mobileThreshold);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const layout = useMemo(() => generateMondrianLayout(TILE_W, TILE_H, isMobile), [isMobile]);
  const tilesRef = useRef<THREE.Group[]>([]);

  useFrame(({ camera }) => {
    const cx = Math.round(camera.position.x / TILE_W) * TILE_W;
    const cy = Math.round(camera.position.y / TILE_H) * TILE_H;
    tilesRef.current.forEach((g, i) => {
      if (!g) return;
      const ox = (i % 3) - 1, oy = Math.floor(i / 3) - 1;
      g.position.set(cx + ox * TILE_W, cy + oy * TILE_H, 0);
    });
  });

   const handleBlockClick = (_uid: string) => {
    // console.log('Block clicked:', _uid);
  };

  const renderTile = (idx: number) => {
    return (
      <group key={idx} ref={(el) => (tilesRef.current[idx] = el as THREE.Group)}>
        {layout.map((rect) => {
          let dataItem: GridItemData | null = null;
          let illustItem: IllustrationItem | undefined;

          if (rect.dataIndex >= 80 && rect.dataIndex < 80 + requestTextDataArray.length) {
            dataItem = requestTextDataArray[rect.dataIndex - 80];
          } else if (rect.dataIndex >= 90 && rect.dataIndex < 90 + termsTextDataArray.length) {
            dataItem = termsTextDataArray[rect.dataIndex - 90];
          } else if (rect.dataIndex < 10) {
            dataItem = aboutData[rect.dataIndex] || { type: 'empty' };
          } else if (rect.dataIndex >= 20 && rect.dataIndex < 20 + contentPoolData.length) {
            dataItem = contentPoolData[rect.dataIndex - 20].content;
            illustItem = dataItem?.illustrationItems?.[0]; 
          } else if (rect.dataIndex >= 50 && rect.dataIndex < 50 + contentPoolData.length) {
            dataItem = contentPoolData[rect.dataIndex - 50].desc || null;
          } else if (rect.dataIndex >= 100) {
            dataItem = { type: 'empty', id: `fill-${rect.dataIndex}`, width: rect.w, height: rect.h, depthOffset: rect.depthOffset };
          }

          if (!dataItem) dataItem = { type: 'empty', id: 'unknown', width: rect.w, height: rect.h, depthOffset: rect.depthOffset };
          const uid = `tile-${idx}-rect-${rect.dataIndex}`;

          // Use lightweight EmptyBlock for filler rects (no useFrame overhead)
          if (rect.dataIndex >= 100) {
            return <EmptyBlock key={uid} rect={rect} />;
          }

          return (
             <WallBlock
              key={uid} uid={uid} rect={rect} data={dataItem}
              onClick={handleBlockClick}
              illustrationItem={illustItem}
              onIllustrationClick={onIllustrationClick}
              onTextClick={onTextClick}
              isModalOpen={isModalOpen}
            />
          );
        })}
        {/* Static decorative elements - displayed once per tile but they loop with the wall */}
        <AcrylicKeyHolder 
          position={isMobile ? [-1.0, -2.2, 1.1] : [0.0, -1.8, 1.2]} 
          iconUrl="/x_logo.png" 
          linkUrl="https://x.com/mina_Root" 
          timeOffset={0}
        />
        <AcrylicKeyHolder 
          position={isMobile ? [0.0, -2.2, 0.9] : [1.0, -1.8, 1.0]} 
          iconUrl="/pixiv_icon.png" 
          logoUrl="/pixiv_logo.png" 
          linkUrl="https://www.pixiv.net/users/87371443" 
          timeOffset={0.5}
        />
        <AcrylicKeyHolder 
          position={isMobile ? [1.0, -2.2, 1.3] : [2.0, -1.8, 0.8]} 
          iconUrl="/skeb.svg" 
          linkUrl="https://skeb.jp/@mina_Root" 
          iconSize={[2.66, 0.8]}
          timeOffset={1.0}
        />
      </group>
    );

  };

  return (
    <group>
      {Array.from({ length: 9 }).map((_, i) => renderTile(i))}
      {/* Global Embed Layer: each content block appears only ONCE globally */}
      {layout.map((rect) => {
        let dataItem: GridItemData | null = null;
        let illustItem: IllustrationItem | undefined;

        if (rect.dataIndex >= 80 && rect.dataIndex < 80 + requestTextDataArray.length) {
          dataItem = requestTextDataArray[rect.dataIndex - 80];
        } else if (rect.dataIndex >= 90 && rect.dataIndex < 90 + termsTextDataArray.length) {
          dataItem = termsTextDataArray[rect.dataIndex - 90];
        } else if (rect.dataIndex < 10) {
          dataItem = aboutData[rect.dataIndex] || null;
        } else if (rect.dataIndex >= 20 && rect.dataIndex < 20 + contentPoolData.length) {
          dataItem = contentPoolData[rect.dataIndex - 20].content;
          illustItem = dataItem?.illustrationItems?.[0]; 
        } else if (rect.dataIndex >= 50 && rect.dataIndex < 50 + contentPoolData.length) {
          dataItem = contentPoolData[rect.dataIndex - 50].desc || null;
        }

        if (!dataItem) return null;
        const needsHtml = illustItem?.type === 'youtube' || illustItem?.type === 'soundcloud' || dataItem.type === 'about_name' || dataItem.type === 'about_text';
        if (!needsHtml) return null;

        return <IndependentEmbed key={`global-${rect.dataIndex}`} rect={rect} data={dataItem} illustrationItem={illustItem} />;
      })}
    </group>
  );
}
