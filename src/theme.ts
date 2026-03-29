/**
 * Atelier-de-Minamoto Design & Layout Configuration
 * 
 * すべての主要なデザイン属性（色、サイズ、アニメーション速度、レイアウトの閾値など）
 * をこのファイルで一括管理します。
 */

export const THEME = {
  // --- Layout Settings ---
  layout: {
    tileWidth: 22,
    tileHeight: 16,
    minBlockSize: 0.4,
    mobileThreshold: 768,
    // Macro-tile grid size (3x3 = 9 tiles around camera)
    macroTileCount: 9, 
  },

  // --- Block Appearance ---
  block: {
    // Basic Geometry
    totalThickness: 0.5,     // Total depth of the block geometry
    surfaceOffset: 0.05,      // How much the front face protrudes from the wall base
    randomDepthRange: 0.3,   // Random Z-variation range in the layout grid
    
    borderRadius: '8px',     // For HTML overlays
    
    // Interaction Scales
    contentHostScale: 1.15,  // Scale for blocks that contain images/info
    hoverScaleAdd: 0.1,      // Additional scale when hovering a content block
    interactiveHoverScale: 1.3, // Scale for interactive blocks when hovered
  },

  // --- Animation Factors (Lerp) ---
  // Smaller values = slower/smoother movement
  animation: {
    positionLerp: 0.1,
    scaleLerp: 0.1,
    thicknessLerp: 0.08,
    opacityLerp: 0.05,
    cameraLerp: 5, // Used with delta time
    illustrationFloatSpeed: [0.5, 2.0], // [min, max]
    illustrationFloatAmplitude: 0.1,
  },

  // --- Colors & Aesthetics ---
  colors: {
     background: '#ffffff',
    scenePlane: '#ffffff',
    ambientLight: 0.35,
    directLight: 0.9,
    directLightPos: [2, 5, 5] as [number, number, number],
    environmentIntensity: 0.5,
    
    // Block Materials
    blockDefault: '#9d85ff',
    blockHover: '#b3f0ff',
    blockEmpty: '#f0f0ff',
    blockEmptyAccent: '#e1eaff',
    blockAbout: '#99e0ff29',
    
    // UI & Text
    textPrimary: '#ffffff',
    textSecondary: '#444444',
    textMuted: '#aaaaaa',
    accent: '#1e00ff',
    modalBackground: 'rgba(0,0,0,0.85)',
    overlayBackground: 'rgba(0,0,0,0.7)',
    overlayBorder: 'rgba(255,255,255,0.2)',
    cameraPointLight: '#ddf6ff',
    cameraPointLightIntensity: 0.14,
    cameraPointLightOffset: [4, 4, 1.5] as [number, number, number],
  },

  // --- Material Parameters ---
  materials: {
    paper: {
      grainScale: 20.0,
      grainIntensity: 0.15,
      roughness: 0.1,
    },
    metal: {
      grainScale: 120.0,
      grainIntensity: 0.2,
      roughness: 0.15,
      metalness: 0.9,
    },
    // Background blocks (Empty) use milder metal settings in WallBlock
    metalEmpty: {
      grainScale: 80.0,
      grainIntensity: 0.5,
      roughness: 0.8,
      metalness: 0.15,
    }
  },

  // --- Camera & Interaction ---
  camera: {
    initialZ: 8.5,
    fov: 40,
    wheelSensitivity: 0.01,
    dragSensitivity: 0.02,
  },

  // --- About Section Layout (Desktop) ---
  aboutDesktop: {
    // Outer edges slightly misaligned intentionally
    icon:  { x: -2.3, y: -1.3, w: 2.4, h: 2.5, depth: 0.6 },
    name:  { x: 0.1,  y: 0.2,  w: 3.2, h: 1.1, depth: 0.5 },
    text:  { x: 0.1,  y: -1.6, w: 3.4, h: 1.8, depth: 0.5 },
    filler:{ x: 5.1,  y: -1.6, w: 0.4, h: 1.8, depth: 0.3 },
  },

  // --- About Section Layout (Mobile) ---
  aboutMobile: {
    // Outer edges slightly misaligned
    icon:  { x: -1.6, y: 1.0,  w: 3.1, h: 3.0, depth: 0.6 },
    name:  { x: -1.8, y: -0.1,  w: 3.6, h: 1.1, depth: 0.5 },
    text:  { x: -2.0, y: -1.8, w: 3.0, h: 1.8, depth: 0.5 },
    fillers: { depth: 0.4 },
  },

  // --- Navigation Section Layout (Desktop) ---
  // Positioned below the About section, somewhat adjacent but with misaligned edges
  navDesktop: [
    { id: 'nav-illustration', x: -2.3, y: -3.2, w: 1.4, h: 1.7, depth: 0.4 }, // Illustration
    { id: 'nav-discography',  x: -0.9, y: -3.0, w: 1.5, h: 1.5, depth: 0.5 }, // Discography
    { id: 'nav-products',     x:  0.6, y: -3.3, w: 1.3, h: 1.8, depth: 0.3 }, // Products
    { id: 'nav-contact',      x:  1.9, y: -2.8, w: 1.4, h: 1.4, depth: 0.6 }, // Contact
  ],

  // --- Navigation Section Layout (Mobile) ---
  // Positioned below the About section (y: -1.5 and below) in a 2x2 or stack wrap
  navMobile: [
    { id: 'nav-illustration', x: -1.6, y: -3.3, w: 1.6, h: 1.5, depth: 0.4 },
    { id: 'nav-discography',  x:  0.1, y: -3.1, w: 1.5, h: 1.3, depth: 0.5 },
    { id: 'nav-products',     x: -1.7, y: -4.8, w: 1.5, h: 1.4, depth: 0.3 },
    { id: 'nav-contact',      x: -0.1, y: -4.5, w: 1.7, h: 1.2, depth: 0.6 },
  ]
};
