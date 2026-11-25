'use client';

/**
 * Background 065 — Violet Toroidal Energy Vortex
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Background65Props {
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
.fv-backgrounds-background-65 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-backgrounds-background-65 *, .fv-backgrounds-background-65 *::before, .fv-backgrounds-background-65 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-backgrounds-background-65 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #06020f;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-backgrounds-background-65 canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: grab;
  }

  .fv-backgrounds-background-65 canvas:active {
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
function initBackground65Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    // Interactive 55000-particle 3D WebGL torus background with orbital pointer parallax and vortex deflection
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl2', { antialias: true }) ||
               canvas.getContext('webgl', { antialias: true });
    if (!gl) return;
  
    const vsSource = `
      attribute vec3 aBasePos;
      attribute float aSeed;
      attribute float aBand;
  
      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uTilt;
      uniform vec2 uPointer;
      uniform float uWarp;
      uniform float uZoom;
  
      varying vec3 vColor;
      varying float vAlpha;
  
      void main() {
        float FLOW_RATE = 0.75;
        float POINT_SCALE = 1.35;
        float t = uTime * (FLOW_RATE + uWarp * 0.9);
        
        float u = aBasePos.x * 6.2831853 + t * 0.35;
        float v = aBasePos.y * 6.2831853 + t * 0.85 + u * 2.0;
        float R = 0.88;
        float rr = 0.34 + aBasePos.z * 0.14;
        vec3 pos3 = vec3((R + rr * cos(v)) * cos(u), rr * sin(v), (R + rr * cos(v)) * sin(u));
  
        float ry = uTilt.x * 0.55 + uTime * 0.08;
        float rx = uTilt.y * 0.45 + 0.35;
        float cy = cos(ry), sy = sin(ry);
        float cx = cos(rx), sx = sin(rx);
  
        vec3 r1 = vec3(pos3.x * cy - pos3.z * sy, pos3.y, pos3.x * sy + pos3.z * cy);
        vec3 r2 = vec3(r1.x, r1.y * cx - r1.z * sx, r1.y * sx + r1.z * cx);
  
        float aspect = uResolution.x / max(uResolution.y, 1.0);
        float camZ = r2.z + 2.55 * uZoom;
        float invZ = 1.42 / max(0.38, camZ);
        vec2 sp = r2.xy * invZ;
  
        vec2 ptrW = vec2(uPointer.x * aspect, uPointer.y);
        vec2 toPtr = sp - ptrW;
        float dPtr = length(toPtr);
        float push = exp(-dPtr * dPtr * 4.5) * (0.14 + uWarp * 0.12);
        vec2 tang = vec2(-toPtr.y, toPtr.x);
        sp += (normalize(toPtr + vec2(1e-4)) + normalize(tang + vec2(1e-4)) * 0.65) * push;
  
        gl_Position = vec4(sp.x / aspect, sp.y, 0.0, 1.0);
  
        float dpr = clamp(uResolution.y / 800.0, 1.0, 2.0);
        float tw = 0.68 + 0.32 * sin(uTime * 3.5 + aSeed * 55.0);
        float hi = step(0.94, aSeed);
        gl_PointSize = (1.35 + aSeed * 1.45 + hi * 1.9) * POINT_SCALE * dpr * clamp(invZ * 0.95, 0.5, 2.2);
  
        vec3 colPrimary = vec3(0.486, 0.227, 0.929);
        vec3 colSecond  = vec3(0.925, 0.282, 0.600);
        vec3 colPeak    = vec3(0.992, 0.957, 1.000);
  
        vec3 col = mix(colPrimary, colSecond, clamp(aBand * 0.7 + 0.3 * sin(aSeed * 12.0 + t * 0.5), 0.0, 1.0));
        col = mix(col, colPeak, hi * 0.8 + push * 2.0);
  
        vColor = col;
        vAlpha = (0.30 + 0.54 * tw) * smoothstep(4.8, 1.0, camZ);
      }
    `;
  
    const fsSource = `
      precision highp float;
      varying vec3 vColor;
      varying float vAlpha;
  
      void main() {
        vec2 d = gl_PointCoord - 0.5;
        float r2 = dot(d, d) * 4.0;
        if (r2 > 1.0) discard;
        float glow = exp(-r2 * 2.1);
        gl_FragColor = vec4(vColor * glow, vAlpha * glow);
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
  
    const COUNT = 55000;
    const basePos = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT);
    const bands = new Float32Array(COUNT);
  
    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      basePos[i3] = Math.random();
      basePos[i3 + 1] = Math.random();
      basePos[i3 + 2] = (Math.random() * 2 - 1);
      seeds[i] = Math.random();
      bands[i] = (i % 3) * 0.5;
    }
  
    function bindAttr(name: any, data: any, size?: any) {
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    }
  
    bindAttr('aBasePos', basePos, 3);
    bindAttr('aSeed', seeds, 1);
    bindAttr('aBand', bands, 1);
  
    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uResolution = gl.getUniformLocation(prog, 'uResolution');
    const uTilt = gl.getUniformLocation(prog, 'uTilt');
    const uPointer = gl.getUniformLocation(prog, 'uPointer');
    const uWarp = gl.getUniformLocation(prog, 'uWarp');
    const uZoom = gl.getUniformLocation(prog, 'uZoom');
  
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();
  
    let tiltX = 0, tiltY = 0;
    let targetTiltX = 0, targetTiltY = 0;
    let ptrX = 9.0, ptrY = 9.0;
    let warp = 0.0, targetWarp = 0.0;
    let zoom = 1.0, targetZoom = 1.0;
  
    window.addEventListener('pointermove', (e: any) => {
      const nx = (e.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      const ny = 1 - (e.clientY / Math.max(window.innerHeight, 1)) * 2;
      targetTiltX = nx;
      targetTiltY = ny;
      ptrX = nx;
      ptrY = ny;
    });
  
    window.addEventListener('pointerleave', () => {
      targetTiltX = 0;
      targetTiltY = 0;
      ptrX = 9.0;
      ptrY = 9.0;
      targetWarp = 0.0;
    });
  
    window.addEventListener('pointerdown', () => { targetWarp = 1.0; });
    window.addEventListener('pointerup', () => { targetWarp = 0.0; });
    window.addEventListener('wheel', (e: any) => {
      targetZoom = Math.max(0.65, Math.min(1.6, targetZoom + e.deltaY * 0.0005));
    }, { passive: true });
  
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.clearColor(0.024, 0.008, 0.059, 1.0);
  
    function render(now?: any) {
      const t = now * 0.001;
      tiltX += (targetTiltX - tiltX) * 0.06;
      tiltY += (targetTiltY - tiltY) * 0.06;
      warp += (targetWarp - warp) * 0.07;
      zoom += (targetZoom - zoom) * 0.08;
  
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform2f(uTilt, tiltX, tiltY);
      gl.uniform2f(uPointer, ptrX, ptrY);
      gl.uniform1f(uWarp, warp);
      gl.uniform1f(uZoom, zoom);
  
      gl.drawArrays(gl.POINTS, 0, COUNT);
      requestAnimationFrame(render);
    }
  
    requestAnimationFrame(render);
  })();
}
/* eslint-enable */

export function Background65({ className, style, width = '100%', height = '100%' }: Background65Props) {
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

    initBackground65Runtime({
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
      className={className ? `fv-backgrounds-background-65 ${className}` : 'fv-backgrounds-background-65'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="glCanvas"></canvas>
    </div>
  );
}

export default Background65;
