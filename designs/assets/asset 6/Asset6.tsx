'use client';

/**
 * Asset 06 — Photorealistic 3D Interactive Tracking Eyeball
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Asset6Props {
  /** Additional CSS class names for the root container */
  className?: string;
  /** Inline styles applied to the root container */
  style?: React.CSSProperties;
  /** Container width (default: '100%') */
  width?: number | string;
  /** Container height (default: '100%') */
  height?: number | string;
}

const SCOPED_STYLES = `
.fv-assets-asset-6 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-assets-asset-6 *, .fv-assets-asset-6 *::before, .fv-assets-asset-6 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-assets-asset-6 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000000;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-assets-asset-6 canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: crosshair;
  }
`;

// Scoped DOM/Window runtime adapter so WebGL/Canvas/DOM3D logic runs strictly inside this
// component's container and cleans up all RAF loops & event listeners on React unmount.
interface ScopedRuntimeContext {
  root: HTMLDivElement;
  document: Document;
  window: Window;
  requestAnimationFrame: (cb: FrameRequestCallback) => number;
  cancelAnimationFrame: (id: number) => void;
}

/* eslint-disable */
function initAsset6Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl2', { antialias: true }) ||
               canvas.getContext('webgl', { antialias: true });
    if (!gl) return;
  
    const vsSource = `
      attribute vec2 aPos;
      varying vec2 vUv;
      void main() {
        vUv = aPos;
        gl_Position = vec4(aPos, 0.0, 1.0);
      }
    `;
  
    // Photorealistic 3D Raycasted Human Eyeball Shader
    // Replicating the pinkish-ivory sclera, branching subsurface capillaries, multi-layered radial
    // amber/copper-hazel iris stroma fibers, dark limbal ring, corneal refraction, and wet studio reflections!
    const fsSource = `
      precision highp float;
      varying vec2 vUv;
  
      uniform vec2 uResolution;
      uniform float uTime;
      uniform mat3 uEyeRot;
  
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }
  
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), f.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
          f.y
        );
      }
  
      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 4; i++) {
          v += a * noise(p);
          p *= 2.03;
          a *= 0.5;
        }
        return v;
      }
  
      // Delicate organic branching sclera blood capillaries (rotation matrix eliminates grid lattice contours)
      float veinPattern(vec2 p) {
        mat2 rot = mat2(0.80, -0.60, 0.60, 0.80);
        vec2 q = rot * (p * 3.8);
        q += 0.18 * vec2(fbm(q * 2.1), fbm(q * 2.1 + 7.4));
        float v1 = 1.0 - smoothstep(0.0, 0.022, abs(fbm(q * 3.4) - 0.5));
        q = rot * (q * 1.45 + vec2(3.1, 1.7));
        float v2 = 1.0 - smoothstep(0.0, 0.016, abs(fbm(q * 5.2) - 0.5));
        return clamp(v1 * 0.55 + v2 * 0.45, 0.0, 1.0);
      }
  
      // Detailed straight-radial fibrous copper/amber-hazel iris shader matching Asset 6 video
      vec3 renderIris(vec2 irisXY, float rNorm, float pupilR) {
        float angle = atan(irisXY.y, irisXY.x);
  
        // Normalized radial position within the iris annulus [0 = pupil edge, 1 = outer limbal ring]
        float u = clamp((rNorm - pupilR) / (1.0 - pupilR), 0.0, 1.0);
  
        // Crisp micro-fibers fanning radially outward with subtle organic jitter
        float jitter = (noise(vec2(cos(angle) * 14.0, sin(angle) * 14.0)) - 0.5) * 0.024
                     + (noise(vec2(angle * 22.0, u * 4.5)) - 0.5) * 0.014;
        float radialA = angle + jitter;
  
        float f1 = sin(radialA * 136.0) * 0.5 + 0.5;
        float f2 = sin(radialA * 244.0 + u * 3.2) * 0.5 + 0.5;
        float f3 = noise(vec2(radialA * 48.0, u * 5.0));
        float f4 = noise(vec2(radialA * 96.0 + 4.1, u * 9.0));
  
        float fibers = f1 * 0.30 + f2 * 0.24 + f3 * 0.28 + f4 * 0.18;
        float brightStrands = pow(clamp(sin(radialA * 72.0 + f3 * 2.6) * 0.5 + 0.5, 0.0, 1.0), 3.4);
        float darkCrypts    = pow(clamp(cos(radialA * 54.0 - f4 * 3.0) * 0.5 + 0.5, 0.0, 1.0), 4.2);
  
        // Warm amber collarette crown near inner iris (u ~ 0.24)
        float collarette = exp(-pow((u - 0.24 + 0.025 * sin(angle * 19.0)) / 0.10, 2.0));
  
        // Authentic rich copper / warm walnut / golden-amber iris palette from Asset 6 video
        vec3 deepMahogany = vec3(0.14, 0.04, 0.02);
        vec3 richCopper   = vec3(0.56, 0.22, 0.09);
        vec3 warmAmber    = vec3(0.86, 0.48, 0.22);
        vec3 paleGold     = vec3(0.98, 0.80, 0.56);
  
        vec3 col = mix(deepMahogany, richCopper, clamp(fibers * 1.25, 0.0, 1.0));
        col = mix(col, warmAmber, clamp(pow(fibers, 1.35) + collarette * 0.52, 0.0, 1.0));
        col = mix(col, paleGold,  clamp(brightStrands * (0.48 + 0.52 * (1.0 - abs(u - 0.42))), 0.0, 1.0) * 0.80);
        col *= (1.0 - darkCrypts * 0.48);
  
        // Subtle inner pupillary ruff darkening & deep outer limbal ring
        float pupilFringe = smoothstep(0.0, 0.06, u);
        col *= mix(0.22, 1.0, pupilFringe);
  
        float limbal = 1.0 - smoothstep(0.80, 1.0, u);
        col *= mix(0.10, 1.0, limbal);
  
        return col;
      }
  
      void main() {
        vec2 uv = vUv;
        uv.x *= uResolution.x / max(uResolution.y, 1.0);
  
        float R = 0.78;
        float r2d = length(uv);
        if (r2d > R + 0.004) {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
          return;
        }
  
        // Surface normal on the eyeball sphere in world/camera space
        vec2 p2 = uv / R;
        float rNorm2D = min(1.0, length(p2));
        float zWorld = sqrt(max(0.0, 1.0 - rNorm2D * rNorm2D));
        vec3 nWorld = normalize(vec3(p2, zWorld));
  
        // Transform surface point into local eye space (rotated toward mouse cursor)
        vec3 pEye = uEyeRot * nWorld;
  
        // Iris angular radius on the eyeball (sin(theta_iris) ~ 0.495 matching the large expressive iris in Asset 6)
        float irisRadius = 0.495;
        float distFromGaze = length(pEye.xy);
  
        // Studio lighting & flesh-toned subsurface scattering on the sclera
        vec3 keyLight  = normalize(vec3(0.32, 0.48, 0.82));
        vec3 fillLight = normalize(vec3(-0.58, 0.18, 0.79));
        float diffKey  = max(0.0, dot(nWorld, keyLight));
        float diffFill = max(0.0, dot(nWorld, fillLight));
  
        // Warm pinkish-ivory sclera with rose subsurface scattering toward the grazing edges
        vec3 scleraCenter = vec3(0.98, 0.90, 0.90);
        vec3 scleraMid    = vec3(0.90, 0.72, 0.74);
        vec3 scleraEdge   = vec3(0.46, 0.25, 0.28);
  
        float rimFactor = 1.0 - zWorld;
        vec3 scleraCol = mix(scleraCenter, scleraMid, smoothstep(0.1, 0.65, rimFactor));
        scleraCol = mix(scleraCol, scleraEdge, smoothstep(0.55, 0.98, rimFactor));
        scleraCol *= (0.58 + 0.44 * diffKey + 0.18 * diffFill);
  
        // Subtle branching red/rose blood vessels in the outer sclera
        float veinMask = smoothstep(irisRadius + 0.04, irisRadius + 0.38, distFromGaze) * (1.0 - smoothstep(0.88, 1.0, rNorm2D));
        float veins = veinPattern(pEye.xy) * veinMask;
        scleraCol = mix(scleraCol, vec3(0.74, 0.34, 0.38) * (0.5 + 0.5 * diffKey), veins * 0.28);
  
        // Soft ambient occlusion halo just outside the limbal ring
        float scleraLimbalShadow = smoothstep(irisRadius - 0.02, irisRadius + 0.045, distFromGaze);
  
        vec3 eyeCol = scleraCol;
  
        if (pEye.z > 0.0 && distFromGaze < irisRadius + 0.015) {
          float irisNorm = distFromGaze / irisRadius;
          float pupilR = 0.24 + 0.015 * sin(uTime * 1.4);
  
          // Concave iris bowl depth shading (caustic illumination opposite the key light)
          vec3 irisCol;
          if (irisNorm < pupilR) {
            // Deep pitch-black pupil
            irisCol = vec3(0.015, 0.01, 0.01);
          } else {
            irisCol = renderIris(pEye.xy / irisRadius, irisNorm, pupilR);
            // Soft pupil edge feathering
            float pupilAA = smoothstep(pupilR - 0.012, pupilR + 0.012, irisNorm);
            irisCol = mix(vec3(0.015, 0.01, 0.01), irisCol, pupilAA);
          }
  
          // Corneal dome lighting over the iris
          float irisBlend = 1.0 - smoothstep(irisRadius - 0.012, irisRadius + 0.012, distFromGaze);
          eyeCol = mix(eyeCol * mix(0.65, 1.0, scleraLimbalShadow), irisCol, irisBlend);
        }
  
        // --- WET TEAR-FILM & STUDIO WINDOW REFLECTIONS (Matching Asset 6 video) ---
        vec3 viewDir = vec3(0.0, 0.0, 1.0);
        vec3 refl = reflect(-viewDir, nWorld);
  
        // 1. Large curved studio window reflection on the left side of the sclera (8-10 o'clock)
        vec2 winPos = vec2(p2.x + 0.56, p2.y - 0.08);
        // Curved window conformity along sphere longitude
        float winArc = length(vec2((rNorm2D - 0.64) * 4.5, (atan(p2.y, -p2.x) - 0.12) * 1.55));
        float leftWindow = (1.0 - smoothstep(0.28, 0.58, winArc)) * smoothstep(0.25, 0.78, rNorm2D) * step(p2.x, -0.15);
  
        // 2. Upper-left secondary highlight arc (10-11 o'clock)
        float topArc = exp(-pow((rNorm2D - 0.66) * 7.5, 2.0)) * exp(-pow((atan(p2.y, -p2.x) + 0.75) * 2.8, 2.0));
  
        // 3. Bright crisp corneal softbox catchlight on upper-right of the iris/cornea (1-2 o'clock)
        // Moves slightly with the corneal dome as the eye tracks the cursor!
        vec3 corneaNormal = normalize(nWorld + vec3(pEye.xy * 0.35, 0.0) * (1.0 - smoothstep(0.0, irisRadius, distFromGaze)));
        vec3 corneaLight = normalize(vec3(0.36, 0.38, 0.85));
        float corneaCatch = pow(max(0.0, dot(corneaNormal, corneaLight)), 38.0);
        float corneaCore  = smoothstep(0.45, 0.92, corneaCatch);
  
        eyeCol += vec3(1.0, 0.98, 0.98) * (leftWindow * 0.28 + topArc * 0.32);
        eyeCol = mix(eyeCol, vec3(1.0, 0.99, 0.98), clamp(corneaCatch * 0.85 + corneaCore * 0.35, 0.0, 0.96));
  
        // Anti-aliased circular silhouette
        float edgeAA = 1.0 - smoothstep(R - 0.003, R + 0.002, r2d);
        gl_FragColor = vec4(eyeCol * edgeAA, 1.0);
      }
    `;
  
    function compile(type: any, src?: any) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }
  
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vsSource));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(prog);
    gl.useProgram(prog);
  
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
  
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  
    const uResolution = gl.getUniformLocation(prog, 'uResolution');
    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uEyeRot = gl.getUniformLocation(prog, 'uEyeRot');
  
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();
  
    // Initial gaze looking slightly right/up as in 00:00 of the Asset 6 recording,
    // and smoothly tracking the cursor anywhere on screen!
    let yaw = 0.28;
    let pitch = -0.04;
    let targetYaw = 0.28;
    let targetPitch = -0.04;
  
    window.addEventListener('pointermove', (e: any) => {
      const nx = (e.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      const ny = 1 - (e.clientY / Math.max(window.innerHeight, 1)) * 2;
      targetYaw = Math.max(-0.62, Math.min(0.62, nx * 0.58));
      targetPitch = Math.max(-0.48, Math.min(0.48, ny * 0.45));
    });
  
    function buildEyeRot(yAngle: any, xAngle?: any) {
      const cy = Math.cos(-yAngle), sy = Math.sin(-yAngle);
      const cx = Math.cos(xAngle),  sx = Math.sin(xAngle);
      return new Float32Array([
        cy,       sx * sy,  -cx * sy,
        0,        cx,        sx,
        sy,      -sx * cy,   cx * cy
      ]);
    }
  
    function render(now?: any) {
      const t = now * 0.001;
  
      yaw += (targetYaw - yaw) * 0.09;
      pitch += (targetPitch - pitch) * 0.09;
  
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.uniformMatrix3fv(uEyeRot, false, buildEyeRot(yaw, pitch));
  
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestAnimationFrame(render);
    }
  
    requestAnimationFrame(render);
  })();
}
/* eslint-enable */

export function Asset6({ className, style, width = '100%', height = '100%' }: Asset6Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    let disposed = false;
    const rafIds = new Set<number>();
    const cleanups: Array<() => void> = [];
    const resizeCallbacks = new Set<() => void>();

    const scopedRaf = (cb: FrameRequestCallback): number => {
      if (disposed) return 0;
      const id = window.requestAnimationFrame((ts: number) => {
        rafIds.delete(id);
        if (!disposed) cb(ts);
      });
      rafIds.add(id);
      return id;
    };

    const scopedCaf = (id: number): void => {
      rafIds.delete(id);
      window.cancelAnimationFrame(id);
    };

    const scopedDoc = new Proxy(document, {
      get(target, prop) {
        if (prop === 'body' || prop === 'documentElement') return root;
        if (prop === 'getElementById') {
          return (id: string) =>
            root.querySelector(`#${CSS.escape(id)}`) || target.getElementById(id);
        }
        if (prop === 'querySelector') {
          return (sel: string) => root.querySelector(sel);
        }
        if (prop === 'querySelectorAll') {
          return (sel: string) => root.querySelectorAll(sel);
        }
        if (prop === 'addEventListener') {
          return (type: string, listener: EventListenerOrEventListenerObject, opts?: boolean | AddEventListenerOptions) => {
            target.addEventListener(type, listener, opts);
            cleanups.push(() => target.removeEventListener(type, listener, opts));
          };
        }
        const val = Reflect.get(target, prop);
        return typeof val === 'function' ? val.bind(target) : val;
      }
    }) as Document;

    const scopedWin = new Proxy(window, {
      get(target, prop) {
        if (prop === 'innerWidth') return root.clientWidth || target.innerWidth;
        if (prop === 'innerHeight') return root.clientHeight || target.innerHeight;
        if (prop === 'requestAnimationFrame') return scopedRaf;
        if (prop === 'cancelAnimationFrame') return scopedCaf;
        if (prop === 'addEventListener') {
          return (type: string, listener: EventListenerOrEventListenerObject, opts?: boolean | AddEventListenerOptions) => {
            if (type === 'resize' && typeof listener === 'function') {
              resizeCallbacks.add(listener as () => void);
            }
            const host: EventTarget =
              type === 'pointerdown' || type === 'mousedown' || type === 'touchstart' || type === 'wheel'
                ? root
                : target;
            host.addEventListener(type, listener, opts);
            cleanups.push(() => host.removeEventListener(type, listener, opts));
          };
        }
        const val = Reflect.get(target, prop);
        return typeof val === 'function' ? val.bind(target) : val;
      }
    }) as Window;

    const ro = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => {
          if (disposed) return;
          resizeCallbacks.forEach(fn => {
            try { fn(); } catch { /* ignore */ }
          });
        })
      : null;
    ro?.observe(root);

    // If mounted inside an unsized (0px) parent (e.g. default Vite/Bolt #root), expand to viewport so canvas never renders 0x0
    if (root.clientHeight < 2) {
      root.style.height = '100vh';
    }
    if (root.clientWidth < 2) {
      root.style.width = '100vw';
    }

    initAsset6Runtime({
      root,
      document: scopedDoc,
      window: scopedWin,
      requestAnimationFrame: scopedRaf,
      cancelAnimationFrame: scopedCaf
    });

    return () => {
      disposed = true;
      ro?.disconnect();
      resizeCallbacks.clear();
      rafIds.forEach(id => window.cancelAnimationFrame(id));
      rafIds.clear();
      cleanups.forEach(fn => {
        try { fn(); } catch { /* ignore */ }
      });
      cleanups.length = 0;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className ? `fv-assets-asset-6 ${className}` : 'fv-assets-asset-6'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="glCanvas"></canvas>
    </div>
  );
}

export default Asset6;
