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
    baseThickness: 0.4,
    borderRadius: '8px', // For HTML overlays
    
    // Z-axis movement & Scale
    activeScale: 1.05,
    activeThicknessFactor: 4,
    activeZOffset: 1.5,
    
    hoverThicknessFactor: 1.5,
    hoverZOffset: 0.3,
    
    illustratingThicknessFactor: 2.5,
    illustratingZOffsetRange: [0.2, 0.6], // [min, max] random offset
    illustratingHoverZAdd: 0.3,
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
    illustrationFloatAmplitude: 0.15,
  },

  // --- Colors & Aesthetics ---
  colors: {
     background: '#ffffff',
    scenePlane: '#ffffff',
    ambientLight: 0.2,
    directLight: 0.65,
    directLightPos: [2, 5, 5] as [number, number, number],
    environmentIntensity: 0.2,
    
    // Block Materials
    blockDefault: '#99eaff',
    blockHover: '#b3f0ff',
    blockEmpty: '#ffffff',
    blockAbout: '#99eaff',
    
    // UI & Text
    textPrimary: '#ffffff',
    textSecondary: '#444444',
    textMuted: '#aaaaaa',
    accent: '#00aaff',
    modalBackground: 'rgba(0,0,0,0.85)',
    overlayBackground: 'rgba(0,0,0,0.7)',
    overlayBorder: 'rgba(255,255,255,0.2)',
    cameraPointLight: '#ddf6ff',
    cameraPointLightIntensity: 0.2,
  },

  // --- Camera & Interaction ---
  camera: {
    initialZ: 8,
    fov: 40,
    wheelSensitivity: 0.01,
    dragSensitivity: 0.02,
  },

  // --- About Section Layout (Desktop) ---
  aboutDesktop: {
    // Outer edges slightly misaligned intentionally
    icon:  { x: -2.3, y: -1.3, w: 2.4, h: 2.5, depth: 0.6 },
    name:  { x: 0.1,  y: 0.2,  w: 3.2, h: 1.1, depth: 0.5 },
    text:  { x: 0.1,  y: -1.2, w: 2.8, h: 1.4, depth: 0.5 },
    filler:{ x: 2.9,  y: -1.2, w: 0.4, h: 1.4, depth: 0.3 },
  },

  // --- About Section Layout (Mobile) ---
  aboutMobile: {
    // Outer edges slightly misaligned
    icon:  { x: -1.6, y: 1.0,  w: 3.1, h: 3.0, depth: 0.6 },
    name:  { x: -1.8, y: -0.1,  w: 3.6, h: 1.1, depth: 0.5 },
    text:  { x: -1.5, y: -1.5, w: 3.2, h: 1.4, depth: 0.5 },
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
