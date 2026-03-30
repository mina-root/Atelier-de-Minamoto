import { forwardRef, useMemo } from 'react';

export const MetalMaterial = forwardRef((props: any, ref) => {
  const { 
    color = '#99eaff', 
    uGrainScale = 100.0, 
    uGrainIntensity = 0.4, 
    uRoughness = 0.4,
    uMetalness = 0.9,
    ...otherProps 
  } = props;

  const uniforms = useMemo(() => ({
    uGrainScale: { value: uGrainScale },
    uGrainIntensity: { value: uGrainIntensity },
  }), []);

  uniforms.uGrainScale.value = uGrainScale;
  uniforms.uGrainIntensity.value = uGrainIntensity;

  const onBeforeCompile = (shader: any) => {
    shader.uniforms.uGrainScale = uniforms.uGrainScale;
    shader.uniforms.uGrainIntensity = uniforms.uGrainIntensity;

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
        for (int i = 0; i < 3; ++i) {
          v += a * noise(p);
          p = p * 2.0 + vec2(10.0);
          a *= 0.5;
        }
        return v;
      }

      ${shader.fragmentShader}
    `.replace(
      '#include <map_fragment>',
      `
      #include <map_fragment>
      vec2 metalUv = vWorldPosition.xy * uGrainScale;
      float n = fbm(metalUv);
      diffuseColor.rgb *= (0.95 + n * 0.1);
      `
    ).replace(
      '#include <normal_fragment_begin>',
      `
      #include <normal_fragment_begin>
      vec2 metalUvNorm = vWorldPosition.xy * uGrainScale;
      float eps = 0.01;
      float nx = noise(metalUvNorm + vec2(eps, 0.0)) - noise(metalUvNorm - vec2(eps, 0.0));
      float ny = noise(metalUvNorm + vec2(0.0, eps)) - noise(metalUvNorm - vec2(0.0, eps));
      normal = normalize(normal + vec3(nx, ny, 0.0) * uGrainIntensity);
      `
    );
  };

  return (
    <meshPhysicalMaterial 
      ref={ref}
      color={color}
      roughness={uRoughness}
      metalness={uMetalness}
      onBeforeCompile={onBeforeCompile}
      {...otherProps}
    />
  );
});
