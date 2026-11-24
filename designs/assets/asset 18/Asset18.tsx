'use client';

/**
 * Asset 18 — 3D Rainbow Gradient Glossy Wet Metaballs
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Asset18Props {
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
.fv-assets-asset-18 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-assets-asset-18 *, .fv-assets-asset-18 *::before, .fv-assets-asset-18 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-assets-asset-18 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000000;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-assets-asset-18 canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: pointer;
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
function initAsset18Runtime(__fvRuntime: ScopedRuntimeContext): void {
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
  
    // Raymarched 3D Rainbow Gradient Glossy Wet Metaballs Cluster Shader
    // Replicating the 16 colliding/merging colorful spheres, smooth-minimum bridges,
    // vibrant spatial rainbow palette (red, orange, yellow, mint-green, cobalt-blue, violet),
    // subtle tactile surface grain, and sharp wet white specular highlight ribbons of Asset 18!
    const fsSource = `
      precision highp float;
      varying vec2 vUv;
  
      uniform vec2 uResolution;
      uniform float uTime;
      uniform vec2 uPointer;
  
      float smin(float a, float b, float k) {
        float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
        return mix(b, a, h) - k * h * (1.0 - h);
      }
  
      float hash(vec3 p) {
        p = fract(p * 0.3183099 + 0.1);
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }
  
      float mapMetaballs(vec3 p) {
        float t = uTime * 0.65;
        float d = 100.0;
  
        // 14 large molten fluid droplets merging seamlessly across the full viewport
        for (int i = 0; i < 14; i++) {
          float fi = float(i);
          vec3 center = vec3(
            sin(t * (0.58 + mod(fi, 5.0) * 0.11) + fi * 1.65) * 1.15,
            cos(t * (0.52 + mod(fi, 4.0) * 0.13) + fi * 2.25) * 0.72,
            sin(t * (0.48 + mod(fi, 3.0) * 0.14) + fi * 3.05) * 0.45
          );
          float radius = 0.28 + 0.26 * fract(sin(fi * 12.9898) * 43758.5453);
          float di = length(p - center) - radius;
          d = smin(d, di, 0.46);
        }
  
        // Interactive pointer metaball
        vec3 ptr = vec3(uPointer.x * 1.15, uPointer.y * 0.75, 0.18);
        d = smin(d, length(p - ptr) - 0.38, 0.42);
  
        return d;
      }
  
      vec3 calcNormal(vec3 p) {
        vec2 e = vec2(0.002, 0.0);
        return normalize(vec3(
          mapMetaballs(p + e.xyy) - mapMetaballs(p - e.xyy),
          mapMetaballs(p + e.yxy) - mapMetaballs(p - e.yxy),
          mapMetaballs(p + e.yyx) - mapMetaballs(p - e.yyx)
        ));
      }
  
      // Vibrant multi-stop rainbow gradient matching Asset 18 video:
      // Crimson Red -> Tangerine Orange -> Sunny Yellow -> Mint/Emerald Green -> Cobalt Blue -> Violet
      vec3 rainbowPalette(float u) {
        float x = fract(u);
        vec3 c0 = vec3(0.92, 0.08, 0.22); // Crimson Red
        vec3 c1 = vec3(0.98, 0.56, 0.05); // Tangerine Orange
        vec3 c2 = vec3(0.98, 0.82, 0.10); // Sunny Yellow
        vec3 c3 = vec3(0.10, 0.84, 0.58); // Mint/Emerald Green
        vec3 c4 = vec3(0.16, 0.34, 0.98); // Cobalt Blue
        vec3 c5 = vec3(0.55, 0.18, 0.88); // Vivid Violet
  
        if (x < 0.166) return mix(c0, c1, x / 0.166);
        if (x < 0.333) return mix(c1, c2, (x - 0.166) / 0.167);
        if (x < 0.500) return mix(c2, c3, (x - 0.333) / 0.167);
        if (x < 0.666) return mix(c3, c4, (x - 0.500) / 0.166);
        if (x < 0.833) return mix(c4, c5, (x - 0.666) / 0.167);
        return mix(c5, c0, (x - 0.833) / 0.167);
      }
  
      void main() {
        vec2 uv = vUv;
        uv.x *= uResolution.x / max(uResolution.y, 1.0);
  
        vec3 ro = vec3(0.0, 0.0, 2.35);
        vec3 rd = normalize(vec3(uv * 0.48, -1.0));
  
        float t = 0.0;
        bool hit = false;
        vec3 p;
  
        for (int i = 0; i < 68; i++) {
          p = ro + rd * t;
          float d = mapMetaballs(p);
          if (d < 0.0014) {
            hit = true;
            break;
          }
          t += d;
          if (t > 5.0) break;
        }
  
        if (!hit) {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
          return;
        }
  
        vec3 n = calcNormal(p);
        vec3 v = -rd;
  
        // Smooth spatial rainbow wave flowing over large liquid droplets
        float colorPhase = (p.x * 0.36 - p.y * 0.44 + p.z * 0.22) - uTime * 0.14 + n.x * 0.10;
        vec3 baseCol = rainbowPalette(colorPhase);
  
        vec3 keyLight  = normalize(vec3(0.42, 0.68, 0.60));
        vec3 fillLight = normalize(vec3(-0.62, -0.30, 0.72));
  
        float diffFill = max(0.0, dot(n, fillLight));
        float wrapDiff = clamp(dot(n, keyLight) * 0.52 + 0.56, 0.24, 1.08);
  
        vec3 col = baseCol * (wrapDiff * 0.90 + diffFill * 0.20);
  
        // Thin, crisp liquid reflection bands (anisotropic grazing glint instead of big white sticker spots)
        vec3 refl = reflect(-v, n);
        float envStreak = smoothstep(0.82, 0.97, sin(refl.x * 3.8 + refl.y * 4.5));
        float fresnel = pow(1.0 - max(0.0, dot(n, v)), 2.6);
        float sharpSpec = pow(max(0.0, dot(refl, keyLight)), 64.0) * 0.75;
  
        col += baseCol * fresnel * 0.38 + vec3(0.96, 0.99, 1.0) * (sharpSpec + envStreak * fresnel * 0.48);
  
        gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
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
    const uPointer = gl.getUniformLocation(prog, 'uPointer');
  
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();
  
    let ptrX = 0.0;
    let ptrY = 0.0;
    let targetX = 0.0;
    let targetY = 0.0;
  
    window.addEventListener('pointermove', (e: any) => {
      targetX = (e.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      targetY = 1 - (e.clientY / Math.max(window.innerHeight, 1)) * 2;
    });
  
    function render(now?: any) {
      const t = now * 0.001;
      ptrX += (targetX - ptrX) * 0.08;
      ptrY += (targetY - ptrY) * 0.08;
  
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uPointer, ptrX, ptrY);
  
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestAnimationFrame(render);
    }
  
    requestAnimationFrame(render);
  })();
}
/* eslint-enable */

export function Asset18({ className, style, width = '100%', height = '100%' }: Asset18Props) {
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

    initAsset18Runtime({
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
      className={className ? `fv-assets-asset-18 ${className}` : 'fv-assets-asset-18'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="glCanvas"></canvas>
    </div>
  );
}

export default Asset18;
