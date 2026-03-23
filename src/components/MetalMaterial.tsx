import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import { forwardRef } from 'react';

const MetalShaderMaterialImpl = shaderMaterial(
  {
    uColor: new THREE.Color('#99eaff'),
    opacity: 1.0,
    uTime: 0,
    uGrainScale: 100.0,
    uGrainIntensity: 0.4,
    uRoughness: 0.4,
    uMetalness: 0.9,
    uLightPos: new THREE.Vector3(0, 0, 10),
    uLightIntensity: 1.0,
    uAmbientIntensity: 0.2,
    uDirectLightIntensity: 0.65,
    uDirectLightPos: new THREE.Vector3(2, 5, 5),
    uEnvironmentIntensity: 0.2,
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
    uniform float uMetalness;
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

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 3; ++i) {
        v += a * noise(p);
        p = p * 2.0 + vec2(10.0);
        a *= 0.5;
      }
      return v;
    }

    void main() {
      // Sandblasted texture: higher frequency noise
      vec2 metalUv = vWorldPosition.xy * uGrainScale;
      float n = fbm(metalUv);
      
      // Bump normal calculation for the "blasted" surface
      float eps = 0.01;
      float nx = noise(metalUv + vec2(eps, 0.0)) - noise(metalUv - vec2(eps, 0.0));
      float ny = noise(metalUv + vec2(0.0, eps)) - noise(metalUv - vec2(0.0, eps));
      vec3 bumpNormal = normalize(vNormal + vec3(nx, ny, 0.0) * uGrainIntensity);
      
      // Directions
      vec3 viewDir = normalize(vViewPosition);
      vec3 pointLightDir = normalize(uLightPos - vWorldPosition);
      vec3 directLightDir = normalize(uDirectLightPos);
      
      // Lighting
      // Point Light
      float pointDiff = max(dot(bumpNormal, pointLightDir), 0.0);
      vec3 pointHalf = normalize(pointLightDir + viewDir);
      float pointSpec = pow(max(dot(bumpNormal, pointHalf), 0.0), mix(128.0, 4.0, uRoughness));
      
      // Direct Light
      float directDiff = max(dot(bumpNormal, directLightDir), 0.0);
      vec3 directHalf = normalize(directLightDir + viewDir);
      float directSpec = pow(max(dot(bumpNormal, directHalf), 0.0), mix(128.0, 4.0, uRoughness));

      // Metal logic: specular color is tinted by base color
      // To prevent it from becoming too dark, we ensure a minimum diffuse contribution
      float metalFactor = uMetalness * 0.95; // Leave a tiny bit of diffuse even at max metalness
      vec3 diffuseColor = uColor * (1.0 - metalFactor);
      vec3 specColor = mix(vec3(1.0), uColor, metalFactor);
      
      // Ambient summation (Ambient light shouldn't be fully killed by metalness)
      vec3 ambient = uColor * uAmbientIntensity;
      
      // Total Lighting
      vec3 diffuse = (pointDiff * uLightIntensity + directDiff * uDirectLightIntensity) * diffuseColor;
      
      // Environment simulates general reflection from the sky/surroundings
      float envContribution = uEnvironmentIntensity * (bumpNormal.z * 0.5 + 0.5);
      vec3 specular = (pointSpec * uLightIntensity + directSpec * uDirectLightIntensity + envContribution) * specColor;
      
      // Adjust specular by roughness - instead of multiplying by (1-roughness), 
      // we use it to scale the "energy" slightly more naturally
      specular *= mix(1.0, 0.5, uRoughness);
      
      vec3 finalColor = ambient + diffuse + specular;
      
      // Grain variation for sandblast look
      finalColor *= (0.95 + n * 0.1);

      gl_FragColor = vec4(finalColor, opacity);
    }
  `
);

extend({ MetalShaderMaterialImpl });

export const MetalMaterial = forwardRef((props: any, ref) => {
  const { color, ...otherProps } = props;
  return (
    <metalShaderMaterialImpl 
      ref={ref}
      uColor={new THREE.Color(color)} 
      {...otherProps} 
    />
  );
});

declare module '@react-three/fiber' {
  interface ThreeElements {
    metalShaderMaterialImpl: any;
  }
}
