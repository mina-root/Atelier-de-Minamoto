import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import { forwardRef } from 'react';

const PaperShaderMaterialImpl = shaderMaterial(
  {
    uColor: new THREE.Color('#ffffff'),
    opacity: 1.0,
    uTime: 0,
    uResolution: new THREE.Vector2(),
    uGrainScale: 40.0,
    uGrainIntensity: 0.15,
    uRoughness: 0.5,
    uLightPos: new THREE.Vector3(0, 0, 10),
    uLightIntensity: 1.0,
    uAmbientIntensity: 0.5,
    uDirectLightIntensity: 0.8,
    uDirectLightPos: new THREE.Vector3(2, 5, 5),
    uEnvironmentIntensity: 0.4,
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      
      vec4 mvPosition = viewMatrix * worldPosition;
      vViewPosition = -mvPosition.xyz;
      
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  // Fragment Shader
  `
    uniform vec3 uColor;
    uniform float opacity;
    uniform float uTime;
    uniform float uGrainScale;
    uniform float uGrainIntensity;
    uniform float uRoughness;
    uniform vec3 uLightPos;
    uniform float uLightIntensity;
    uniform float uAmbientIntensity;
    uniform float uDirectLightIntensity;
    uniform vec3 uDirectLightPos;
    uniform float uEnvironmentIntensity;
    
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    // Fast noise
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    // Fractal Brownian Motion for more natural detail
    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      vec2 shift = vec2(100.0);
      // Rotation to reduce axis-aligned artifacts
      mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
      for (int i = 0; i < 4; ++i) {
        v += a * noise(p);
        p = rot * p * 2.0 + shift;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      // Scale coordinates for paper texture
      vec2 paperUv = vWorldPosition.xy * uGrainScale;
      
      // Fractal Detail layers
      float n1 = fbm(paperUv);
      float n2 = fbm(paperUv * 2.31 + vec2(n1 * 0.4)); // warping the second layer slightly
      float grain = (n1 * 0.7 + n2 * 0.3);
      
      // Fine fibers (random dark streaks)
      float fibers = step(0.988, hash(paperUv * 15.0 + n1 * 1.5)) * 0.12;
      
      // Heightmap effect / Normal perturbation using FBM derivative (approximation)
      float eps = 0.03;
      float nx = fbm(paperUv + vec2(eps, 0.0)) - fbm(paperUv - vec2(eps, 0.0));
      float ny = fbm(paperUv + vec2(0.0, eps)) - fbm(paperUv - vec2(0.0, eps));
      vec3 bumpNormal = normalize(vNormal + vec3(nx, ny, 0.0) * (uGrainIntensity * 2.5));
      
      // Lighting
      // 1. Camera Point Light (uLightPos is camera position)
      vec3 pointLightDir = normalize(uLightPos - vWorldPosition);
      float dist = length(uLightPos - vWorldPosition);
      float pointAtten = 1.0 / (1.0 + 0.1 * dist + 0.02 * dist * dist);
      float pointDiff = max(dot(bumpNormal, pointLightDir), 0.0);
      
      // 2. Scene Directional Light
      vec3 directLightDir = normalize(uDirectLightPos);
      float directDiff = max(dot(bumpNormal, directLightDir), 0.0);
      
      // 3. Environment Light (Simulate as a constant addition scaled by normal.z)
      float environment = uEnvironmentIntensity * (bumpNormal.z * 0.5 + 0.5);
      
      // Color Variation (slightly more contrast in fractal peaks)
      float colorVar = 1.0 - (grain * uGrainIntensity * 0.6) - fibers;
      vec3 baseColor = uColor * colorVar;
      
      // Apply Shading
      vec3 finalLighting = vec3(0.0);
      finalLighting += vec3(uAmbientIntensity); // Ambient
      finalLighting += vec3(pointDiff * pointAtten * uLightIntensity); // Camera Point Light
      finalLighting += vec3(directDiff * uDirectLightIntensity); // Scene Directional Light
      finalLighting += vec3(environment); // Simulated Environment
      
      vec3 finalColor = baseColor * finalLighting;
      
      // Subtle Specular Highlight (Point Light)
      float shininess = mix(128.0, 8.0, uRoughness);
      vec3 viewDir = normalize(vViewPosition);
      vec3 halfWay = normalize(pointLightDir + viewDir);
      float spec = pow(max(dot(bumpNormal, halfWay), 0.0), shininess);
      finalColor += spec * pointAtten * uLightIntensity * (1.0 - uRoughness) * 0.12;
      
      gl_FragColor = vec4(finalColor, opacity);
    }
  `
);

extend({ PaperShaderMaterialImpl });

export const PaperMaterial = forwardRef((props: any, ref) => {
  const { color, ...otherProps } = props;
  return (
    <paperShaderMaterialImpl 
      ref={ref}
      uColor={new THREE.Color(color)} 
      {...otherProps} 
    />
  );
});

declare module '@react-three/fiber' {
  interface ThreeElements {
    paperShaderMaterialImpl: any;
  }
}
