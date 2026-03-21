import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState, Suspense, useEffect } from 'react';
import * as THREE from 'three';
import { Html, Image as DreiImage, Text } from '@react-three/drei';
import { aboutData, navData, contentPoolData, type GridItemData, type IllustrationItem } from '../data';
import { THEME } from '../theme';

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
  // 10-13 = Nav
  // 20-32 = Content slots (13 items)
  // 40-52 = Description slots (13 items paired with content)
  // 100+  = Fillers

  prePlaced.push({ x: about.icon.x, y: about.icon.y, w: about.icon.w, h: about.icon.h, dataIndex: 1, depthOffset: about.icon.depth, isContentEligible: false });
  prePlaced.push({ x: about.name.x, y: about.name.y, w: about.name.w, h: about.name.h, dataIndex: 0, depthOffset: about.name.depth, isContentEligible: false });
  prePlaced.push({ x: about.text.x, y: about.text.y, w: about.text.w, h: about.text.h, dataIndex: 2, depthOffset: about.text.depth, isContentEligible: false });

  if (!isMobile) {
    const desktopAbout = THEME.aboutDesktop;
    if (desktopAbout.filler) {
      prePlaced.push({ x: desktopAbout.filler.x, y: desktopAbout.filler.y, w: desktopAbout.filler.w, h: desktopAbout.filler.h, dataIndex: 3, depthOffset: desktopAbout.filler.depth, isContentEligible: false });
    }
  }

  // 2. Navigation Section
  const navDefs = isMobile ? THEME.navMobile : THEME.navDesktop;
  navDefs.forEach((nav, i) => {
    prePlaced.push({ x: nav.x, y: nav.y, w: nav.w, h: nav.h, dataIndex: 10 + i, depthOffset: nav.depth, isContentEligible: false });
  });

  // 3. Content + Description Pairs (27 sets)
  const scale = isMobile ? 1 : 1.3;
  const baseContentDefs = [
    { w: 3.0, h: 1.0, dw: 1.2, dh: 1.0, type: 'h' },
    { w: 3.0, h: 1.0, dw: 1.2, dh: 1.0, type: 'h' },
    { w: 3.0, h: 1.0, dw: 1.2, dh: 1.0, type: 'h' },
    { w: 3.0, h: 1.0, dw: 1.2, dh: 1.0, type: 'h' },
    { w: 3.0, h: 1.0, dw: 1.2, dh: 1.0, type: 'h' },
    { w: 2.0, h: 1.0, dw: 1.0, dh: 1.0, type: 'h' },
    { w: 2.0, h: 1.0, dw: 1.0, dh: 1.0, type: 'h' },
    { w: 2.4, h: 1.35, dw: 1.2, dh: 1.2, type: 'h' },
    { w: 2.4, h: 1.35, dw: 1.2, dh: 1.2, type: 'h' },
    { w: 2.4, h: 1.35, dw: 1.2, dh: 1.2, type: 'h' },
    { w: 2.4, h: 1.35, dw: 1.2, dh: 1.2, type: 'h' },
    { w: 2.4, h: 1.35, dw: 1.2, dh: 1.2, type: 'h' },
    { w: 2.4, h: 1.35, dw: 1.2, dh: 1.2, type: 'h' },
    { w: 1.414, h: 2.0, dw: 1.1, dh: 1.2, type: 'v' },
    { w: 1.414, h: 2.0, dw: 1.1, dh: 1.2, type: 'v' },
    { w: 1.414, h: 2.0, dw: 1.1, dh: 1.2, type: 'v' },
    { w: 1.414, h: 2.0, dw: 1.1, dh: 1.2, type: 'v' },
    { w: 1.2, h: 2.8, dw: 1.3, dh: 1.2, type: 'v' },
    { w: 1.2, h: 2.8, dw: 1.3, dh: 1.2, type: 'v' },
    { w: 1.2, h: 2.8, dw: 1.3, dh: 1.2, type: 'v' },
    { w: 1.2, h: 2.8, dw: 1.3, dh: 1.2, type: 'v' },
    { w: 1.0, h: 2.0, dw: 1.0, dh: 1.0, type: 'v' },
    { w: 1.0, h: 2.0, dw: 1.0, dh: 1.0, type: 'v' },
    { w: 1.0, h: 2.0, dw: 1.0, dh: 1.0, type: 'v' },
    { w: 2.0, h: 2.0, dw: 1.2, dh: 1.2, type: 'v' },
    { w: 2.0, h: 2.0, dw: 1.2, dh: 1.2, type: 'v' },
    { w: 2.0, h: 2.0, dw: 1.2, dh: 1.2, type: 'v' },
  ];

  const contentDefs = baseContentDefs.map(d => ({
    w: d.w * scale, h: d.h * scale,
    dw: d.dw * scale, dh: d.dh * scale,
    type: d.type
  }));

  const snap = (v: number) => Math.round(v / 0.2) * 0.2;

  for (let i = 0; i < contentDefs.length; i++) {
    const def = contentDefs[i];
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 500) {
      attempts++;
      const cx = snap((Math.random() - 0.5) * (width - 6));
      const cy = snap((Math.random() - 0.5) * (height - 6));
      let dx = cx, dy = cy;

      if (def.type === 'h') {
        dy = snap(cy - def.h - 0.2);
        dx = snap(cx + (Math.random() * (def.w - def.dw)));
      } else {
        dx = snap(Math.random() > 0.5 ? cx + def.w + 0.2 : cx - def.dw - 0.2);
        dy = snap(cy + (Math.random() * (def.h - def.dh)));
      }

      const cRect = { x: cx, y: cy, w: def.w, h: def.h, dataIndex: 20 + i, depthOffset: Math.random() * 0.3, isContentEligible: false };
      const dRect = { x: dx, y: dy, w: def.dw, h: def.dh, dataIndex: 50 + i, depthOffset: Math.random() * 0.3, isContentEligible: false };

      let overlap = false;
      const pad = 0.05;
      const combined = [cRect, dRect];
      for (const p of prePlaced) {
        if (combined.some(r => intersects({ ...r, x: r.x - pad, y: r.y - pad, w: r.w + pad * 2, h: r.h + pad * 2 }, p))) {
          overlap = true;
          break;
        }
      }

      if (!overlap) {
        prePlaced.push(cRect, dRect);
        placed = true;
      }
    }
  }

  rects.push(...prePlaced);

  // 4. Grid Fill
  const rawXs = [-width / 2, width / 2, ...prePlaced.flatMap(p => [p.x, p.x + p.w])];
  const rawYs = [-height / 2, height / 2, ...prePlaced.flatMap(p => [p.y, p.y + p.h])];
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
      for (const p of prePlaced) {
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

// --- Component: WallBlock ---
interface WallBlockProps {
  uid: string;
  rect: Rect;
  data: GridItemData;
  isActive: boolean;
  onClick: (uid: string, data: GridItemData) => void;
  onPointerMissed: () => void;
  isIllustrationMode: boolean;
  illustrationItem?: IllustrationItem;
  onIllustrationClick: (item: IllustrationItem) => void;
}

function WallBlock({ uid, rect, data, isActive, onClick, onPointerMissed, isIllustrationMode, illustrationItem, onIllustrationClick }: WallBlockProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const overlaysRef = useRef<THREE.Group>(null);
  const htmlOverlayRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const opacityRef = useRef(0);

  // Individual block "pushed forward" feel
  const [floatOffset] = useState(() => Math.random() * 0.2 + 0.1);
  const [floatSpeed] = useState(() => Math.random() * 0.8 + 0.4);
  const [floatPhase] = useState(() => Math.random() * Math.PI * 2);

  const isAbout = data.id?.startsWith('about-') || data.type?.startsWith('about_');
  const isPagination = data.type === 'pagination';

  // A block is "active" for content if it's an illustration host or a special block (Nav/About)
  const isContentHost = illustrationItem || data.type !== 'empty';

  // The user wants these blocks to ONLY react when in Illustration mode (if they are illustration blocks)
  // or if they are permanently interactive blocks (Nav/About).
  let isInteractive = false;
  if (isAbout || data.type.startsWith('nav') || data.type === 'illustration_folder') {
    isInteractive = true;
  } else if (isIllustrationMode && isContentHost) {
    isInteractive = true;
  } else if (isActive) {
    isInteractive = true;
  }

  let targetScaleZ = 1;
  let targetZOffset = 0;

  if (isActive) {
    targetScaleZ = 2.5;
    targetZOffset = 1.0;
  } else if (isIllustrationMode && illustrationItem) {
    targetScaleZ = 1.15;
    targetZOffset = floatOffset;
    if (hovered) targetZOffset += 0.1;
  } else if (isIllustrationMode && isContentHost && data.type === 'about_text' && data.description) {
    // This is a description block in illustration mode
    targetScaleZ = 1.05;
    targetZOffset = 0.15;
  } else if (hovered && isInteractive) {
    targetScaleZ = 1.3;
    targetZOffset = 0.2;
  }

  // Determine if it should show the "active" visual state (textured/colored)
  const showContent = isAbout || data.type.startsWith('nav') || data.type === 'illustration_folder' || (isIllustrationMode && isContentHost) || isPagination;
  const targetOpacity = showContent ? 1 : 0;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const fPos = 0.1, fSca = 0.15, fOpa = 0.1;

    meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, isActive ? 1.05 : 1, fSca);
    meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, isActive ? 1.05 : 1, fSca);
    meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, targetScaleZ, fSca);

    let zOff = targetZOffset;
    if (isIllustrationMode && illustrationItem && !hovered && !isActive) {
      zOff += Math.sin(clock.elapsedTime * floatSpeed + floatPhase) * 0.1;
    }

    const thickness = 0.4 * meshRef.current.scale.z;
    const targetZ = -rect.depthOffset + zOff + thickness / 2;
    meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetZ, fPos);

    opacityRef.current = THREE.MathUtils.lerp(opacityRef.current, targetOpacity, fOpa);

    if (overlaysRef.current) {
      overlaysRef.current.traverse((c) => {
        if ((c as any).material) {
          (c as any).material.transparent = true;
          (c as any).material.opacity = opacityRef.current;
          if ((c as any).fillOpacity !== undefined) (c as any).fillOpacity = opacityRef.current;
        }
      });
    }
    if (htmlOverlayRef.current) {
      const alpha = Math.max((opacityRef.current - 0.5) * 2, 0);
      htmlOverlayRef.current.style.opacity = alpha.toString();
      htmlOverlayRef.current.style.visibility = alpha > 0.01 ? 'visible' : 'hidden';
    }
  });

  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;

  return (
    <mesh
      ref={meshRef}
      position={[cx, cy, 0]}
      castShadow receiveShadow
      onClick={(e) => {
        if (!isInteractive) return;
        e.stopPropagation();

        // If it's a youtube/soundcloud item, we toggle "Active" (zoom) instead of opening modal
        // unless it's an image.
        if (isIllustrationMode && illustrationItem) {
          if (!illustrationItem.type || illustrationItem.type === 'image') {
            onIllustrationClick(illustrationItem);
          } else {
            // Do nothing for direct embeds (no zoom)
          }
        } else {
          onClick(uid, data);
        }
      }}
      onPointerOver={(e) => { if (isInteractive) { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; } }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      onPointerMissed={() => { if (isActive) onPointerMissed(); }}
    >
      <boxGeometry args={[rect.w, rect.h, 0.4]} />
      <meshPhysicalMaterial
        color={showContent ? (isAbout ? THEME.colors.blockAbout : THEME.colors.blockDefault) : THEME.colors.blockEmpty}
        roughness={0.2}
        metalness={0.1}
      />
      <group ref={overlaysRef}>
        {/* Content Renderers */}
        {illustrationItem && (
          <Suspense fallback={null}>
            {illustrationItem.type === 'youtube' ? (
              <Html
                transform
                position={[0, 0, 0.201]}
                scale={0.4}
                occlude
                style={{
                  width: `${rect.w * 100}px`,
                  height: `${rect.h * 100}px`,
                  pointerEvents: 'auto',
                }}
              >
                <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#000' }}>
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${illustrationItem.videoId}?controls=1&rel=0&modestbranding=1`}
                    title={illustrationItem.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    style={{ border: 'none', width: '100%', height: '100%', pointerEvents: 'auto' }}
                  />
                </div>
              </Html>
            ) : illustrationItem.type === 'soundcloud' ? (
              <Html
                transform
                position={[0, 0, 0.201]}
                scale={0.4}
                occlude
                style={{
                  width: `${rect.w * 100}px`,
                  height: `${rect.h * 100}px`,
                  pointerEvents: 'auto',
                }}
              >
                <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#000' }}>
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="no"
                    scrolling="no"
                    allow="autoplay"
                    src={`https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${illustrationItem.trackId}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&visual=true`}
                    style={{ border: 'none', width: '100%', height: '100%', pointerEvents: 'auto' }}
                  />
                </div>
              </Html>
            ) : (
              <DreiImage url={illustrationItem.src} scale={[rect.w, rect.h]} position={[0, 0, 0.201]} transparent opacity={0} />
            )}
          </Suspense>
        )}
        {data.type === 'about_icon' && (
          <AboutIcon />
        )}
        {data.type === 'about_name' && (
          <Html transform position={[0, 0, 0.21]} distanceFactor={1.5}>
            <div style={{ textAlign: 'center', color: 'white', width: '600px', userSelect: 'none' }}>
              <h1 style={{ fontSize: '64px', fontWeight: 900, letterSpacing: '0.2em' }}>ミナモト</h1>
            </div>
          </Html>
        )}
        {(data.type === 'about_text' || (isIllustrationMode && data.description)) && (
          <Html transform position={[0, 0, 0.21]} distanceFactor={1.2}>
            <div style={{ color: 'white', textAlign: 'center', fontSize: '20px', width: '400px', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
              {data.description}
            </div>
          </Html>
        )}
        {data.type === 'pagination' && (
          <Html transform position={[0, 0, 0.21]} distanceFactor={1.2}>
            <div ref={htmlOverlayRef} style={{ background: 'rgba(0,0,0,0.8)', padding: '10px 20px', borderRadius: '10px', color: 'white', display: 'flex', gap: '15px', alignItems: 'center' }}>
              <button onClick={(e) => { e.stopPropagation(); data.onPageChange?.(data.currentPage! - 1); }} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '20px' }}>&larr;</button>
              <div style={{ fontSize: '14px' }}>{data.currentPage} / {data.totalPages}</div>
              <button onClick={(e) => { e.stopPropagation(); data.onPageChange?.(data.currentPage! + 1); }} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '20px' }}>&rarr;</button>
            </div>
          </Html>
        )}
        {/* Nav Titles */}
        {(data.type.startsWith('nav') || data.type === 'illustration_folder') && (
          <Text position={[0, 0, 0.21]} fontSize={0.2} color="white" anchorX="center" anchorY="middle">{data.title}</Text>
        )}
      </group>
    </mesh>
  );
}

function AboutIcon() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (ref.current) { ref.current.rotation.y = clock.elapsedTime; ref.current.rotation.z = clock.elapsedTime * 0.5; } });
  return (
    <group ref={ref} position={[0, 0, 0.3]}>
      <mesh><octahedronGeometry args={[0.5]} /><meshStandardMaterial color={THEME.colors.accent} roughness={0.1} metalness={0.8} /></mesh>
      <mesh><octahedronGeometry args={[0.55]} /><meshBasicMaterial wireframe color="white" transparent opacity={0.2} /></mesh>
    </group>
  );
}

// --- Main Component: InfiniteWall ---
export function InfiniteWall({ onIllustrationClick }: { onIllustrationClick: (item: IllustrationItem) => void }) {
  const [activeUid, setActiveUid] = useState<string | null>(null);
  const [illustrationMode, setIllustrationMode] = useState(false);
  const [activeIllustrationItems, setActiveIllustrationItems] = useState<IllustrationItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth < THEME.layout.mobileThreshold);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < THEME.layout.mobileThreshold);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const layout = useMemo(() => generateMondrianLayout(TILE_W, TILE_H, isMobile), [isMobile]);
  const tilesRef = useRef<THREE.Group[]>([]);
  const PAGE_SIZE = 30; // Using a slightly larger buffer for future items


  const illustrationAssignments = useMemo(() => {
    if (!illustrationMode) return { content: new Map<number, IllustrationItem>(), desc: new Map<number, string>() };

    // Get current page items
    const items = activeIllustrationItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    // Find all content candidate blocks in the layout (dataIndex 20-49)
    const contentBlocks = layout
      .filter(r => r.dataIndex >= 20 && r.dataIndex < 50)
      .map(r => ({ dataIndex: r.dataIndex, ratio: r.w / r.h }));

    const contentMap = new Map<number, IllustrationItem>();
    const descMap = new Map<number, string>();
    const usedIndices = new Set<number>();

    if (items.length === 0) return { content: contentMap, desc: descMap };

    // Match each item to the best fitting block (no looping)
    items.forEach((item) => {
      let bestIndex = -1;
      let minDiff = Infinity;

      contentBlocks.forEach((block) => {
        if (usedIndices.has(block.dataIndex)) return;
        const diff = Math.abs(block.ratio - item.aspectRatio);
        if (diff < minDiff) {
          minDiff = diff;
          bestIndex = block.dataIndex;
        }
      });

      if (bestIndex !== -1) {
        contentMap.set(bestIndex, item);
        const descIndex = bestIndex + 30;
        descMap.set(descIndex, item.caption || item.title || "");
        usedIndices.add(bestIndex);
      }
    });

    return { content: contentMap, desc: descMap };
  }, [illustrationMode, activeIllustrationItems, currentPage, layout]);

  const totalPages = Math.ceil(activeIllustrationItems.length / PAGE_SIZE);

  useFrame(({ camera }) => {
    const cx = Math.round(camera.position.x / TILE_W) * TILE_W;
    const cy = Math.round(camera.position.y / TILE_H) * TILE_H;
    tilesRef.current.forEach((g, i) => {
      if (!g) return;
      const ox = (i % 3) - 1, oy = Math.floor(i / 3) - 1;
      g.position.set(cx + ox * TILE_W, cy + oy * TILE_H, 0);
      (g as any).isCenter = ox === 0 && oy === 0;
    });
  });

  const handleBlockClick = (uid: string, data: GridItemData) => {
    setActiveUid(activeUid === uid ? null : uid);
    if (data.type === 'illustration_folder') {
      setIllustrationMode(true);
      setActiveIllustrationItems(data.illustrationItems || []);
      setCurrentPage(1);
    } else if (data.type !== 'empty' && data.type !== 'pagination') {
      // Exit illustration mode when clicking other main navigation or about items
      // but NOT when clicking empty blocks or pagination
      if (!illustrationAssignments.content.has(parseInt(uid.split('rect-')[1]))) {
        // If it's not one of the assigned illustration blocks, exit mode
        setIllustrationMode(false);
      }
    }
  };

  const renderTile = (idx: number) => {
    return (
      <group key={idx} ref={(el) => (tilesRef.current[idx] = el as THREE.Group)}>
        {layout.map((rect) => {
          let dataItem: GridItemData | null = null;
          let illustItem: IllustrationItem | undefined;

          if (rect.dataIndex < 10) dataItem = aboutData[rect.dataIndex] || { type: 'empty' };
          else if (rect.dataIndex >= 10 && rect.dataIndex < 20) dataItem = navData[rect.dataIndex - 10] || { type: 'empty' };
          else if (rect.dataIndex >= 20 && rect.dataIndex < 50) {
            illustItem = illustrationAssignments.content.get(rect.dataIndex);
            dataItem = contentPoolData[rect.dataIndex - 20]?.content || { type: 'empty' };
          } else if (rect.dataIndex >= 50 && rect.dataIndex < 80) {
            const desc = illustrationAssignments.desc.get(rect.dataIndex);
            const base = contentPoolData[rect.dataIndex - 50]?.desc || { type: 'empty' };
            dataItem = { ...base, description: illustrationMode ? (desc || "") : "" };
          } else if (rect.dataIndex >= 100) {
            if (rect.dataIndex === 100 && illustrationMode && totalPages > 1) {
              dataItem = { type: 'pagination', id: 'page-ui', currentPage, totalPages, onPageChange: p => setCurrentPage(Math.max(1, Math.min(totalPages, p))), width: rect.w, height: rect.h, depthOffset: rect.depthOffset };
            } else {
              dataItem = { type: 'empty', id: `fill-${rect.dataIndex}`, width: rect.w, height: rect.h, depthOffset: rect.depthOffset };
            }
          }

          if (!dataItem) dataItem = { type: 'empty', id: 'unknown', width: rect.w, height: rect.h, depthOffset: rect.depthOffset };
          const uid = `tile-${idx}-rect-${rect.dataIndex}`;

          return (
            <WallBlock
              key={uid} uid={uid} rect={rect} data={dataItem}
              isActive={activeUid === uid}
              onClick={handleBlockClick}
              onPointerMissed={() => setActiveUid(null)}
              isIllustrationMode={illustrationMode}
              illustrationItem={illustItem}
              onIllustrationClick={onIllustrationClick}
            />
          );
        })}
      </group>
    );
  };

  return <group>{Array.from({ length: 9 }).map((_, i) => renderTile(i))}</group>;
}
