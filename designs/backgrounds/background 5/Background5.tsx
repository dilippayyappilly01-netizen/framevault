'use client';

/**
 * Background 05 — Bioluminescent Starlight Nebula Flow
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Background5Props {
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
.fv-backgrounds-background-5 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-backgrounds-background-5 *, .fv-backgrounds-background-5 *::before, .fv-backgrounds-background-5 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-backgrounds-background-5 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #020308;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-backgrounds-background-5 canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: grab;
  }

  .fv-backgrounds-background-5 canvas:active {
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
function initBackground5Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    // 80,000-particle 3D WebGL nebula flow field with pointer orbital parallax, fluid cursor vortex, and warp boost
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
      uniform float uDepthZoom;
  
      varying vec3 vColor;
      varying float vAlpha;
  
      void main() {
        float FLOW_RATE = 0.22;
        float CURL_AMP = 0.42;
        float STAR_SCALE = 1.35;
  
        float t = uTime * (FLOW_RATE + uWarp * 0.28);
  
        // Continuous looping stream along cosmic ribbon filaments
        vec3 p = aBasePos;
        float stream = fract(p.x * 0.25 + 0.5 + t * (0.18 + aBand * 0.07)) * 4.0 - 2.0;
        p.x = stream;
  
        // Multi-axis 3D curl-like undulation creating braided nebula currents
        float wave1 = sin(p.x * 2.1 + t * 1.4 + aBand * 2.1) * CURL_AMP;
        float wave2 = cos(p.x * 1.5 - t * 1.1 + aSeed * 6.2831) * (CURL_AMP * 0.55);
        float spiral = p.x * 0.85 + t * 0.65 + aBand * 1.57;
  
        float radial = p.y * (0.55 + 0.35 * sin(p.x * 1.4 + t));
        vec3 pos3 = vec3(
          p.x * 1.55,
          radial * cos(spiral) + wave1 + wave2 * 0.35,
          radial * sin(spiral) + p.z * 0.65 + cos(p.x * 1.8 + t * 0.9) * 0.28
        );
  
        // Interactive 3D orbital tilt from pointer position
        float ry = uTilt.x * 0.48;
        float rx = uTilt.y * 0.36;
        float cy = cos(ry), sy = sin(ry);
        float cx = cos(rx), sx = sin(rx);
  
        vec3 r1 = vec3(pos3.x * cy - pos3.z * sy, pos3.y, pos3.x * sy + pos3.z * cy);
        vec3 r2 = vec3(r1.x, r1.y * cx - r1.z * sx, r1.y * sx + r1.z * cx);
  
        float aspect = uResolution.x / max(uResolution.y, 1.0);
        float camZ = r2.z + 2.55 * uDepthZoom;
        float invZ = 1.38 / max(0.35, camZ);
        vec2 screenPos = r2.xy * invZ;
  
        // Localized cursor swirl & repulsion in screen-world space
        vec2 ptrWorld = vec2(uPointer.x * aspect, uPointer.y);
        vec2 curWorld = vec2(screenPos.x, screenPos.y);
        vec2 toPtr = curWorld - ptrWorld;
        float dPtr = length(toPtr);
        float push = exp(-dPtr * dPtr * 4.2) * (0.14 + uWarp * 0.12);
        vec2 tangent = vec2(-toPtr.y, toPtr.x);
        curWorld += (normalize(toPtr + vec2(1e-4)) + normalize(tangent + vec2(1e-4)) * 0.65) * push;
  
        gl_Position = vec4(curWorld.x / aspect, curWorld.y, 0.0, 1.0);
  
        float dpr = clamp(uResolution.y / 800.0, 1.0, 2.0);
        float twinkle = 0.68 + 0.32 * sin(uTime * 3.4 + aSeed * 50.0);
        float highlight = step(0.94, aSeed);
        gl_PointSize = (1.35 + aSeed * 1.55 + highlight * 2.1) * STAR_SCALE * dpr * clamp(invZ * 0.95, 0.5, 2.2);
  
        vec3 deepSapphire = vec3(0.080, 0.260, 0.880);
        vec3 biolumTeal   = vec3(0.090, 0.860, 0.780);
        vec3 coralGold    = vec3(0.990, 0.560, 0.320);
        vec3 starWhite    = vec3(0.940, 0.980, 1.000);
  
        vec3 ribbonCol = mix(deepSapphire, biolumTeal, smoothstep(0.0, 1.0, aBand * 0.5 + 0.5 * sin(p.x + t * 0.4)));
        ribbonCol = mix(ribbonCol, coralGold, smoothstep(0.62, 0.98, fract(aSeed * 3.7 + aBand * 0.35)) * 0.78);
        ribbonCol = mix(ribbonCol, starWhite, highlight * 0.82 + push * 2.2);
  
        float edgeFade = smoothstep(2.0, 1.35, abs(stream));
        float depthFade = smoothstep(4.6, 1.1, camZ);
  
        vColor = ribbonCol;
        vAlpha = (0.28 + 0.54 * twinkle) * edgeFade * depthFade;
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
  
    const COUNT = 80000;
    const basePos = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT);
    const bands = new Float32Array(COUNT);
  
    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      basePos[i3] = (Math.random() * 2 - 1) * 2.0;
      // Concentrated core filament + outer stardust halo
      const r = Math.pow(Math.random(), 1.65) * 1.15;
      basePos[i3 + 1] = (Math.random() < 0.5 ? -1 : 1) * r;
      basePos[i3 + 2] = (Math.random() * 2 - 1) * 0.95;
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
    const uDepthZoom = gl.getUniformLocation(prog, 'uDepthZoom');
  
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
    let depthZoom = 1.0, targetDepthZoom = 1.0;
  
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
  
    window.addEventListener('pointerdown', () => {
      targetWarp = 1.0;
    });
  
    window.addEventListener('pointerup', () => {
      targetWarp = 0.0;
    });
  
    window.addEventListener('wheel', (e: any) => {
      targetDepthZoom = Math.max(0.65, Math.min(1.6, targetDepthZoom + e.deltaY * 0.0005));
    }, { passive: true });
  
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.clearColor(0.008, 0.012, 0.031, 1.0);
  
    function render(now?: any) {
      const t = now * 0.001;
      tiltX += (targetTiltX - tiltX) * 0.06;
      tiltY += (targetTiltY - tiltY) * 0.06;
      warp += (targetWarp - warp) * 0.07;
      depthZoom += (targetDepthZoom - depthZoom) * 0.08;
  
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform2f(uTilt, tiltX, tiltY);
      gl.uniform2f(uPointer, ptrX, ptrY);
      gl.uniform1f(uWarp, warp);
      gl.uniform1f(uDepthZoom, depthZoom);
  
      gl.drawArrays(gl.POINTS, 0, COUNT);
      requestAnimationFrame(render);
    }
  
    requestAnimationFrame(render);
  })();
}
/* eslint-enable */

export function Background5({ className, style, width = '100%', height = '100%' }: Background5Props) {
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

    initBackground5Runtime({
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
      className={className ? `fv-backgrounds-background-5 ${className}` : 'fv-backgrounds-background-5'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="glCanvas"></canvas>
    </div>
  );
}

export default Background5;
