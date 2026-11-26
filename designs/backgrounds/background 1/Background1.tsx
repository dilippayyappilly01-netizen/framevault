'use client';

/**
 * Background 01 — Iridescent Silk Aurora Mesh
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Background1Props {
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
.fv-backgrounds-background-1 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-backgrounds-background-1 *, .fv-backgrounds-background-1 *::before, .fv-backgrounds-background-1 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-backgrounds-background-1 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #03040a;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-backgrounds-background-1 canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: grab;
  }

  .fv-backgrounds-background-1 canvas:active {
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
function initBackground1Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    // Interactive iridescent silk aurora background with pointer fluid warp, click ripple bloom, and wheel fold zoom
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl2', { antialias: true }) ||
               canvas.getContext('webgl', { antialias: true });
    if (!gl) return;
  
    const vsSource = `
      attribute vec2 aPos;
      varying vec2 vUv;
      void main() {
        vUv = aPos * 0.5 + 0.5;
        gl_Position = vec4(aPos, 0.0, 1.0);
      }
    `;
  
    const fsSource = `
      precision highp float;
      varying vec2 vUv;
  
      uniform vec2 uResolution;
      uniform float uTime;
      uniform vec2 uPointer;
      uniform vec2 uVelocity;
      uniform vec3 uRipple;
      uniform float uZoom;
  
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }
  
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }
  
      float fbm(vec2 p) {
        float v = 0.0;
        float amp = 0.5;
        mat2 rot = mat2(0.80, -0.60, 0.60, 0.80);
        for (int i = 0; i < 5; i++) {
          v += amp * noise(p);
          p = rot * p * 2.03 + vec2(1.7, 9.2);
          amp *= 0.5;
        }
        return v;
      }
  
      void main() {
        float WAVE_SCALE = 2.15;
        float FLOW_SPEED = 0.24;
        float SILK_CREST = 1.35;
        float GLOW_GAIN = 1.15;
  
        vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
        vec2 p = (vUv - 0.5) * aspect * WAVE_SCALE * uZoom;
        vec2 ptr = (uPointer - 0.5) * aspect * WAVE_SCALE * uZoom;
  
        float t = uTime * FLOW_SPEED;
  
        // Interactive cursor fluid displacement & directional wake
        vec2 toPtr = p - ptr;
        float distPtr = length(toPtr);
        float influence = exp(-distPtr * distPtr * 1.45);
        p -= uVelocity * influence * 1.35;
        p += normalize(toPtr + vec2(1e-4)) * influence * 0.16 * sin(distPtr * 6.0 - uTime * 2.4);
  
        // Click shockwave ripple ring
        vec2 ripCenter = (uRipple.xy - 0.5) * aspect * WAVE_SCALE * uZoom;
        float ripAge = max(0.0, uTime - uRipple.z);
        float ripRadius = ripAge * 1.65;
        float ripDist = length(p - ripCenter);
        float ripWave = exp(-pow(ripDist - ripRadius, 2.0) * 14.0) * exp(-ripAge * 1.35);
        p += normalize(p - ripCenter + vec2(1e-4)) * ripWave * 0.22;
  
        // Dual-stage domain warping for flowing liquid silk ribbons
        vec2 q = vec2(
          fbm(p + vec2(t * 0.85, -t * 0.45)),
          fbm(p + vec2(-t * 0.55, t * 0.70) + vec2(5.2, 1.3))
        );
  
        vec2 r = vec2(
          fbm(p + 2.2 * q + vec2(1.7, 9.2) + t * 0.45),
          fbm(p + 2.2 * q + vec2(8.3, 2.8) - t * 0.38)
        );
  
        float field = fbm(p + 2.1 * r);
  
        // Harmonic silk pleat ridges
        float pleats = 0.5 + 0.5 * sin((p.x * 1.5 + p.y * 1.15 + r.x * 4.2 - r.y * 3.1) * SILK_CREST + t * 1.6);
        float sheen = pow(pleats, 3.2);
        float fineFold = pow(0.5 + 0.5 * cos((q.x - r.y) * 9.5 + t * 2.1), 5.0);
  
        vec3 obsidianBase  = vec3(0.012, 0.016, 0.042);
        vec3 deepCobalt    = vec3(0.075, 0.165, 0.560);
        vec3 luminousCyan  = vec3(0.110, 0.780, 0.920);
        vec3 orchidViolet  = vec3(0.580, 0.210, 0.920);
        vec3 pearlRose     = vec3(0.960, 0.720, 0.940);
  
        vec3 col = mix(obsidianBase, deepCobalt, smoothstep(0.16, 0.68, field));
        col = mix(col, orchidViolet, smoothstep(0.28, 0.85, r.x) * 0.72);
        col += luminousCyan * sheen * (0.42 + 0.55 * r.y) * GLOW_GAIN;
        col += pearlRose * fineFold * sheen * 0.58 * GLOW_GAIN;
        col += mix(luminousCyan, pearlRose, 0.5) * (influence * 0.18 + ripWave * 0.55);
  
        // Subtle filmic vignette and smooth exponential tone mapping
        float vig = 1.0 - dot((vUv - 0.5) * 1.15, (vUv - 0.5) * 1.15) * 0.38;
        col *= clamp(vig, 0.35, 1.0);
        col = 1.0 - exp(-col * 1.22);
  
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
    const uPointer = gl.getUniformLocation(prog, 'uPointer');
    const uVelocity = gl.getUniformLocation(prog, 'uVelocity');
    const uRipple = gl.getUniformLocation(prog, 'uRipple');
    const uZoom = gl.getUniformLocation(prog, 'uZoom');
  
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();
  
    let ptrX = 0.5, ptrY = 0.5;
    let targetPtrX = 0.5, targetPtrY = 0.5;
    let velX = 0.0, velY = 0.0;
    let ripX = 0.5, ripY = 0.5, ripTime = -20.0;
    let zoom = 1.0, targetZoom = 1.0;
    let lastTimeSec = 0.0;
  
    window.addEventListener('pointermove', (e: any) => {
      const nx = e.clientX / Math.max(window.innerWidth, 1);
      const ny = 1.0 - e.clientY / Math.max(window.innerHeight, 1);
      velX += (nx - targetPtrX) * 0.85;
      velY += (ny - targetPtrY) * 0.85;
      targetPtrX = nx;
      targetPtrY = ny;
    });
  
    window.addEventListener('pointerdown', (e: any) => {
      ripX = e.clientX / Math.max(window.innerWidth, 1);
      ripY = 1.0 - e.clientY / Math.max(window.innerHeight, 1);
      ripTime = lastTimeSec;
    });
  
    window.addEventListener('wheel', (e: any) => {
      targetZoom = Math.max(0.6, Math.min(1.75, targetZoom + e.deltaY * 0.0006));
    }, { passive: true });
  
    function render(now?: any) {
      const t = now * 0.001;
      lastTimeSec = t;
  
      ptrX += (targetPtrX - ptrX) * 0.08;
      ptrY += (targetPtrY - ptrY) * 0.08;
      velX *= 0.91;
      velY *= 0.91;
      zoom += (targetZoom - zoom) * 0.08;
  
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uPointer, ptrX, ptrY);
      gl.uniform2f(uVelocity, velX, velY);
      gl.uniform3f(uRipple, ripX, ripY, ripTime);
      gl.uniform1f(uZoom, zoom);
  
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestAnimationFrame(render);
    }
  
    requestAnimationFrame(render);
  })();
}
/* eslint-enable */

export function Background1({ className, style, width = '100%', height = '100%' }: Background1Props) {
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

    initBackground1Runtime({
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
      className={className ? `fv-backgrounds-background-1 ${className}` : 'fv-backgrounds-background-1'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="glCanvas"></canvas>
    </div>
  );
}

export default Background1;
