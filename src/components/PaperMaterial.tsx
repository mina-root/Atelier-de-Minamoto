import * as THREE from 'three';
import { forwardRef, useMemo } from 'react';

export const PaperMaterial = forwardRef((props: any, ref) => {
  const { 
    color = '#ffffff', 
    uGrainScale = 20.0, 
    uGrainIntensity = 0.15, 
    uRoughness = 0.5,
    uLightIntensity = 1.0,
    uAmbientIntensity = 0.5,
    uDirectLightIntensity = 0.8,
    uDirectLightPos = new THREE.Vector3(2, 5, 5),
    uEnvironmentIntensity = 0.4,
    ...otherProps 
  } = props;

  // Custom uniforms
  const uniforms = useMemo(() => ({
    uGrainScale: { value: uGrainScale },
    uGrainIntensity: { value: uGrainIntensity },
    uLightPos: { value: new THREE.Vector3(0, 0, 10) }, // This is camera pos
  }), []);

  // Sync uniforms
  uniforms.uGrainScale.value = uGrainScale;
  uniforms.uGrainIntensity.value = uGrainIntensity;

  const onBeforeCompile = (shader: any) => {
    shader.uniforms.uGrainScale = uniforms.uGrainScale;
    shader.uniforms.uGrainIntensity = uniforms.uGrainIntensity;
    shader.uniforms.uLightPos = uniforms.uLightPos;

    shader.vertexShader = `
      varying vec3 vWorldPosition;
      ${shader.vertexShader}
    `.replace(
      '#include <worldpos_vertex>',
      `
      #include <worldpos_vertex>
      vWorldPosition = worldPosition.xyz;
      `
    );

    shader.fragmentShader = `
      uniform float uGrainScale;
      uniform float uGrainIntensity;
      uniform vec3 uLightPos;
      varying vec3 vWorldPosition;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }
      float noise(vec2 p) {
        vec2 i = floor(p); vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }
      float fbm(vec2 p) {
        float v = 0.0; float a = 0.5;
        vec2 shift = vec2(100.0);
        mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
        for (int i = 0; i < 4; ++i) {
          v += a * noise(p);
          p = rot * p * 2.0 + shift;
          a *= 0.5;
        }
        return v;
      }

      ${shader.fragmentShader}
    `.replace(
      '#include <map_fragment>',
      `
      #include <map_fragment>
      
      vec2 paperUv = vWorldPosition.xy * uGrainScale;
      float n1 = fbm(paperUv);
      float grain = n1;
      float fibers = step(0.988, hash(paperUv * 15.0 + n1 * 1.5)) * 0.12;
      float colorVar = 1.0 - (grain * uGrainIntensity * 0.6) - fibers;
      
      diffuseColor.rgb *= colorVar;
      `
    ).replace(
      '#include <normal_fragment_begin>',
      `
      #include <normal_fragment_begin>
      vec2 paperUvNorm = vWorldPosition.xy * uGrainScale;
      float eps = 0.03;
      float nx = fbm(paperUvNorm + vec2(eps, 0.0)) - fbm(paperUvNorm - vec2(eps, 0.0));
      float ny = fbm(paperUvNorm + vec2(0.0, eps)) - fbm(paperUvNorm - vec2(0.0, eps));
      normal = normalize(normal + vec3(nx, ny, 0) * (uGrainIntensity * 2.5));
      `
    );
  };

  return (
    <meshPhysicalMaterial 
      ref={ref}
      color={color}
      roughness={uRoughness}
      metalness={0.0}
      onBeforeCompile={onBeforeCompile}
      {...otherProps}
    />
  );
});
