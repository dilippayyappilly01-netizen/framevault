'use client';

/**
 * Background 07 — Cybernetic Perspective Horizon Grid
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Background7Props {
  /** Additional CSS class names for the root container */
  className?: string;
  /** Inline styles applied to the root container */
  style?: React.CSSProperties;
  /** Container width (default: '100%') */
  width?: number | string;
  /** Container height (default: '100%') */
  height?: number | string;
  /** Blend mode to composite seamlessly into parent background (e.g. 'screen', 'plus-lighter', 'multiply') */
  blendMode?: React.CSSProperties['mixBlendMode'];
  /** Remove opaque wrapper background so orb/asset blends into parent background */
  transparentBackground?: boolean;
  /** Radial edge feathering (0-100) to softly fade rectangular edges into any background */
  edgeFeather?: number;
}

const SCOPED_STYLES = `
.fv-backgrounds-background-7 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-backgrounds-background-7 *, .fv-backgrounds-background-7 *::before, .fv-backgrounds-background-7 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-backgrounds-background-7 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #05040d;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-backgrounds-background-7 canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: grab;
  }

  .fv-backgrounds-background-7 canvas:active {
    cursor: grabbing;
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
function initBackground7Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    // 3D raymarched cybernetic synth-horizon terrain grid with pointer camera banking, hyperdrive hold, and elevation control
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
  
    const fsSource = `
      precision highp float;
      varying vec2 vUv;
  
      uniform vec2 uResolution;
      uniform float uTime;
      uniform vec2 uLook;
      uniform float uTravel;
      uniform float uRidgeScale;
  
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
  
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
          f.y
        );
      }
  
      // Canyon valley center with sculpted wireframe ridges rising along both flanks
      float terrain(vec2 xz, float ridgeAmp) {
        float valley = smoothstep(0.6, 4.8, abs(xz.x));
        float n1 = noise(xz * 0.32);
        float n2 = noise(xz * 0.78 + 3.7) * 0.45;
        float waves = (n1 + n2) * valley * 2.15 * ridgeAmp;
        float centerRipple = sin(xz.y * 0.85) * 0.05;
        return waves + centerRipple;
      }
  
      void main() {
        float GRID_DENSITY = 1.65;
        float HORIZON_GLOW = 1.15;
  
        float aspect = uResolution.x / max(uResolution.y, 1.0);
        vec2 uv = vec2(vUv.x * aspect, vUv.y);
  
        // Camera banking & pitch controlled by pointer
        float roll = -uLook.x * 0.14;
        float cr = cos(roll), sr = sin(roll);
        vec2 rUv = vec2(uv.x * cr - uv.y * sr, uv.x * sr + uv.y * cr);
  
        vec3 ro = vec3(uLook.x * 0.85, 1.35 + uLook.y * 0.32, uTravel);
        vec3 rd = normalize(vec3(rUv.x, rUv.y - 0.14 + uLook.y * 0.18, 1.45));
  
        vec3 nightSky    = vec3(0.020, 0.016, 0.051);
        vec3 horizonPlum = vec3(0.280, 0.075, 0.480);
        vec3 portalCoral = vec3(0.980, 0.360, 0.560);
        vec3 neonCyan    = vec3(0.120, 0.860, 1.000);
        vec3 electricVio = vec3(0.680, 0.260, 1.000);
  
        // Sky gradient + distant starfield + glowing horizon portal sun
        float skyT = clamp(rd.y * 2.2 + 0.15, 0.0, 1.0);
        vec3 sky = mix(horizonPlum, nightSky, pow(skyT, 0.65));
  
        vec2 sunDelta = vec2(rUv.x - uLook.x * 0.2, rUv.y - (0.14 - uLook.y * 0.12));
        float sunDist = length(sunDelta);
        float sunDisc = smoothstep(0.32, 0.295, sunDist);
        float sunScan = step(0.22, fract(sunDelta.y * 28.0)) + smoothstep(-0.04, 0.10, sunDelta.y);
        sky += portalCoral * sunDisc * clamp(sunScan, 0.0, 1.0) * 0.88;
        sky += mix(portalCoral, electricVio, 0.45) * exp(-sunDist * 3.8) * 0.52 * HORIZON_GLOW;
  
        if (rd.y > 0.02) {
          vec2 starCell = floor(rUv * 95.0);
          float starH = hash(starCell);
          if (starH > 0.982) {
            vec2 f = fract(rUv * 95.0) - 0.5;
            float twinkle = 0.55 + 0.45 * sin(uTime * 3.2 + starH * 60.0);
            sky += vec3(0.85, 0.92, 1.0) * smoothstep(0.18, 0.02, length(f)) * twinkle * skyT;
          }
        }
  
        // Raymarch terrain heightfield below camera
        float tDist = 0.2;
        bool hit = false;
        vec3 hitPos = vec3(0.0);
        const int STEPS = 44;
        for (int i = 0; i < STEPS; i++) {
          vec3 p = ro + rd * tDist;
          float h = terrain(p.xz, uRidgeScale);
          float diff = p.y - h;
          if (diff < 0.015) {
            hit = true;
            hitPos = p;
            break;
          }
          tDist += max(0.14, diff * 0.55) + tDist * 0.025;
          if (tDist > 34.0) break;
        }
  
        vec3 col = sky;
        if (hit) {
          vec2 gCoord = hitPos.xz * GRID_DENSITY;
          vec2 gDist = abs(fract(gCoord - 0.5) - 0.5);
          float aaWidth = clamp(0.012 + tDist * 0.0038, 0.012, 0.16);
          float lineX = 1.0 - smoothstep(aaWidth * 0.45, aaWidth * 1.65, gDist.x);
          float lineZ = 1.0 - smoothstep(aaWidth * 0.45, aaWidth * 1.65, gDist.y);
          float grid = max(lineX, lineZ);
  
          // Energy pulses racing down longitudinal Z tracks
          float pulse = exp(-pow(fract(hitPos.z * 0.12 - uTime * 0.65) - 0.5, 2.0) * 36.0) * lineX;
  
          float elevMix = clamp(hitPos.y * 0.45, 0.0, 1.0);
          vec3 wireCol = mix(neonCyan, electricVio, elevMix);
          wireCol = mix(wireCol, portalCoral, smoothstep(0.65, 1.0, elevMix) * 0.65);
  
          vec3 groundBase = mix(vec3(0.028, 0.018, 0.068), horizonPlum * 0.35, elevMix);
          vec3 surface = groundBase + wireCol * (grid * 0.95 + pulse * 0.85);
  
          float fog = exp(-tDist * 0.082);
          vec3 horizonFog = sky + mix(electricVio, portalCoral, 0.4) * exp(-abs(rd.y) * 10.0) * 0.25;
          col = mix(horizonFog, surface, fog);
        } else {
          col += mix(electricVio, portalCoral, 0.5) * exp(-abs(rd.y) * 14.0) * 0.32 * HORIZON_GLOW;
        }
  
        col = 1.0 - exp(-col * 1.18);
        gl_FragColor = vec4(col, 1.0);
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
    const uLook = gl.getUniformLocation(prog, 'uLook');
    const uTravel = gl.getUniformLocation(prog, 'uTravel');
    const uRidgeScale = gl.getUniformLocation(prog, 'uRidgeScale');
  
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();
  
    let lookX = 0, lookY = 0;
    let targetLookX = 0, targetLookY = 0;
    let hyperBoost = 0, targetBoost = 0;
    let ridgeScale = 1.0, targetRidge = 1.0;
    let travel = 0;
    let prevTime = 0;
  
    window.addEventListener('pointermove', (e: any) => {
      targetLookX = (e.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      targetLookY = 1 - (e.clientY / Math.max(window.innerHeight, 1)) * 2;
    });
  
    window.addEventListener('pointerleave', () => {
      targetLookX = 0;
      targetLookY = 0;
      targetBoost = 0;
    });
  
    window.addEventListener('pointerdown', () => {
      targetBoost = 1.0;
    });
  
    window.addEventListener('pointerup', () => {
      targetBoost = 0.0;
    });
  
    window.addEventListener('wheel', (e: any) => {
      targetRidge = Math.max(0.35, Math.min(2.0, targetRidge - e.deltaY * 0.0006));
    }, { passive: true });
  
    function render(now?: any) {
      const t = now * 0.001;
      const dt = prevTime === 0 ? 0.016 : (t - prevTime);
      prevTime = t;
  
      lookX += (targetLookX - lookX) * 0.065;
      lookY += (targetLookY - lookY) * 0.065;
      hyperBoost += (targetBoost - hyperBoost) * 0.08;
      ridgeScale += (targetRidge - ridgeScale) * 0.08;
  
      travel += dt * (2.8 + hyperBoost * 5.2);
  
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uLook, lookX, lookY);
      gl.uniform1f(uTravel, travel);
      gl.uniform1f(uRidgeScale, ridgeScale);
  
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestAnimationFrame(render);
    }
  
    requestAnimationFrame(render);
  })();
}
/* eslint-enable */

export function Background7({ className, style, width = '100%', height = '100%', blendMode = "normal", transparentBackground = false, edgeFeather = 0 }: Background7Props) {
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

    initBackground7Runtime({
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

  const blendStyle: React.CSSProperties = {};
  if (blendMode && blendMode !== 'normal') {
    blendStyle.mixBlendMode = blendMode;
    blendStyle.background = 'transparent';
  } else if (transparentBackground) {
    blendStyle.background = 'transparent';
  }
  if (edgeFeather > 0) {
    const inner = Math.max(25, Math.round(100 - edgeFeather * 0.65));
    const mask = `radial-gradient(ellipse at center, #000 ${inner}%, transparent 100%)`;
    blendStyle.maskImage = mask;
    blendStyle.WebkitMaskImage = mask;
  }

  return (
    <div
      ref={containerRef}
      className={className ? `fv-backgrounds-background-7 ${className}` : 'fv-backgrounds-background-7'}
      style={{ width, height, ...blendStyle, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="glCanvas"></canvas>
    </div>
  );
}

export default Background7;
