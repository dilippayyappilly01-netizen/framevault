'use client';

/**
 * Asset 19 — 3D Interactive Cursor-Repelled Bubble Sphere
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Asset19Props {
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
.fv-assets-asset-19 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-assets-asset-19 *, .fv-assets-asset-19 *::before, .fv-assets-asset-19 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-assets-asset-19 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000000;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-assets-asset-19 canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: grab;
  }

  .fv-assets-asset-19 canvas:active {
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
function initAsset19Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl2', { antialias: true }) ||
               canvas.getContext('webgl', { antialias: true });
    if (!gl) return;
  
    // Each of the 820 3D bubbles is rendered as an analytical raycasted sphere sprite with
    // real 3D Z-sorted depth, translucent glass/pearl rim shading, right-to-left size & color
    // gradient (icy sky-blue on right -> cobalt/violet/emerald micro-spheres dispersing on left),
    // and spring-damped 3D cursor repulsion that parts the bubbles under the cursor!
  
    const vsSource = `
      attribute vec3 aPos;
      attribute float aRadius;
      attribute vec3 aColor;
  
      uniform vec2 uResolution;
  
      varying vec3 vColor;
      varying float vDepth;
  
      void main() {
        float fov = 3.2;
        float persp = fov / (fov - aPos.z * 0.52);
  
        float aspect = uResolution.x / max(uResolution.y, 1.0);
        float scale = 0.68;
  
        gl_Position = vec4(
          (aPos.x * scale * persp) / aspect,
          aPos.y * scale * persp,
          0.0,
          1.0
        );
  
        gl_PointSize = aRadius * uResolution.y * 0.82 * persp;
        vColor = aColor;
        vDepth = smoothstep(-1.15, 1.05, aPos.z);
      }
    `;
  
    const fsSource = `
      precision highp float;
      varying vec3 vColor;
      varying float vDepth;
  
      void main() {
        vec2 p = (gl_PointCoord - 0.5) * 2.0;
        p.y = -p.y;
        float r2 = dot(p, p);
        if (r2 > 1.0) discard;
  
        // Analytical 3D sphere normal on each bubble
        float z = sqrt(max(0.0, 1.0 - r2));
        vec3 n = vec3(p, z);
  
        vec3 lightDir = normalize(vec3(0.45, 0.55, 0.70));
        float diff = max(0.0, dot(n, lightDir));
        float fresnel = pow(1.0 - z, 1.9);
        float spec = pow(max(0.0, dot(reflect(-lightDir, n), vec3(0.0, 0.0, 1.0))), 26.0);
  
        // Crisp pearlescent / ceramic-coated micro-spheres matching Asset 19 video
        vec3 base = vColor * (0.36 + 0.68 * diff);
        vec3 rim  = mix(vColor * 1.25, vec3(0.88, 0.96, 1.0), 0.50) * fresnel * 0.72;
        vec3 col  = (base + rim + vec3(0.92, 0.98, 1.0) * spec * 0.62) * mix(0.28, 1.08, vDepth);
  
        float edgeAA = 1.0 - smoothstep(0.86, 1.0, r2);
        float alpha = 0.96 * edgeAA;
  
        gl_FragColor = vec4(col, alpha);
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
  
    // Generate 820 bubbles on a Fibonacci sphere with the signature right-to-left size & dispersion gradient
    const COUNT = 820;
    const GOLDEN_ANGLE = Math.PI * (3.0 - Math.sqrt(5.0));
    const bubbles = new Array(COUNT);
  
    for (let i = 0; i < COUNT; i++) {
      const y = 1.0 - (i / (COUNT - 1)) * 2.0;
      const r = Math.sqrt(Math.max(0.0, 1.0 - y * y));
      const theta = GOLDEN_ANGLE * i;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
  
      // Horizontal factor uX in [0 = left dispersing tail (-X), 1 = right dense head (+X)]
      const uX = clampVal((x + 1.0) * 0.5, 0.0, 1.0);
  
      // Left tail (-X) scatters outward slightly & shrinks to tiny micro-spheres
      const scatter = Math.pow(1.0 - uX, 2.2) * 0.28;
      const bx = x - scatter * (0.3 + Math.random() * 0.9);
      const by = y * (1.0 + (Math.random() - 0.5) * scatter * 0.45);
      const bz = z * (1.0 + (Math.random() - 0.5) * scatter * 0.45);
  
      // Bubble radius: ~0.055 on right hemisphere, shrinking down to ~0.008 on left tail
      const baseRadius = 0.007 + Math.pow(uX, 0.85) * 0.046 * (0.82 + Math.random() * 0.32);
  
      // Color palette matching Asset 19/20 recording:
      // Right (+X): icy sky-blue, powder blue, aqua-cyan (#7ce8ff, #42a5ff, #b5f4ff)
      // Top-left / Mid: periwinkle & violet-indigo (#5248f5, #6c5ce7)
      // Left / Inner: deep cobalt blue & emerald-teal accents (#1e38d8, #1db896)
      let cr, cg, cb;
      const rnd = Math.random();
      if (uX > 0.58) {
        if (rnd < 0.45)      { cr = 0.48; cg = 0.86; cb = 1.00; }
        else if (rnd < 0.80) { cr = 0.24; cg = 0.66; cb = 0.98; }
        else                 { cr = 0.68; cg = 0.92; cb = 1.00; }
      } else {
        if (rnd < 0.16)      { cr = 0.12; cg = 0.74; cb = 0.62; } // Emerald-teal accent bubbles
        else if (y > 0.15)   { cr = 0.38; cg = 0.34; cb = 0.94; } // Violet-periwinkle upper-left
        else                 { cr = 0.14; cg = 0.32; cb = 0.88; } // Deep cobalt lower-left
      }
  
      bubbles[i] = {
        bx, by, bz,
        cx: bx, cy: by, cz: bz,
        vx: 0, vy: 0, vz: 0,
        radius: baseRadius,
        cr, cg, cb,
        phase: Math.random() * Math.PI * 2
      };
    }
  
    function clampVal(x: any, a: any, b?: any) {
      return Math.max(a, Math.min(b, x));
    }
  
    const posArray = new Float32Array(COUNT * 3);
    const radArray = new Float32Array(COUNT);
    const colArray = new Float32Array(COUNT * 3);
  
    const posBuf = gl.createBuffer();
    const radBuf = gl.createBuffer();
    const colBuf = gl.createBuffer();
  
    const aPosLoc = gl.getAttribLocation(prog, 'aPos');
    const aRadLoc = gl.getAttribLocation(prog, 'aRadius');
    const aColLoc = gl.getAttribLocation(prog, 'aColor');
    const uResLoc = gl.getUniformLocation(prog, 'uResolution');
  
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();
  
    let ptrX = -999;
    let ptrY = -999;
    let ptrActive = false;
  
    window.addEventListener('pointermove', (e: any) => {
      const vw = Math.max(window.innerWidth, 1);
      const vh = Math.max(window.innerHeight, 1);
      const aspect = vw / vh;
      const ndcX = ((e.clientX / vw) * 2 - 1) * aspect;
      const ndcY = 1 - (e.clientY / vh) * 2;
  
      // Map screen coordinate into sphere object space (scale = 0.68)
      ptrX = ndcX / 0.68;
      ptrY = ndcY / 0.68;
      ptrActive = true;
    });
  
    window.addEventListener('pointerleave', () => {
      ptrActive = false;
    });
  
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
  
    const sortedIndices = Array.from({ length: COUNT }, (_: any, i: any) => i);
  
    function render(now?: any) {
      const t = now * 0.001;
  
      // Subtle global breathing rotation
      const rotY = Math.sin(t * 0.45) * 0.14;
      const rotX = Math.cos(t * 0.38) * 0.08;
      const cy = Math.cos(rotY), sy = Math.sin(rotY);
      const cx = Math.cos(rotX), sx = Math.sin(rotX);
  
      // Step spring-damped 3D cursor repulsion physics for every bubble
      for (let i = 0; i < COUNT; i++) {
        const b = bubbles[i];
  
        // Target rest position with subtle organic float
        const rx1 = b.bx * cy - b.bz * sy;
        const rz1 = b.bx * sy + b.bz * cy;
        const ry2 = b.by * cx - rz1 * sx;
        const rz2 = b.by * sx + rz1 * cx;
  
        const tx = rx1 + Math.sin(t * 1.4 + b.phase) * 0.008;
        const ty = ry2 + Math.cos(t * 1.2 + b.phase) * 0.008;
        const tz = rz2;
  
        // Spring force toward rest position
        let fx = (tx - b.cx) * 0.085;
        let fy = (ty - b.cy) * 0.085;
        let fz = (tz - b.cz) * 0.085;
  
        // 3D radial cursor repulsion when hovering over the sphere (matching 00:01-00:13 of Asset 19/20)
        if (ptrActive && b.cz > -0.35) {
          const dx = b.cx - ptrX;
          const dy = b.cy - ptrY;
          const dist2D = Math.hypot(dx, dy);
          const repelRadius = 0.44;
          if (dist2D < repelRadius && dist2D > 0.001) {
            const force = Math.pow(1.0 - dist2D / repelRadius, 2.0) * 0.068;
            fx += (dx / dist2D) * force;
            fy += (dy / dist2D) * force;
            fz -= force * 0.25;
          }
        }
  
        b.vx = (b.vx + fx) * 0.82;
        b.vy = (b.vy + fy) * 0.82;
        b.vz = (b.vz + fz) * 0.82;
  
        b.cx += b.vx;
        b.cy += b.vy;
        b.cz += b.vz;
      }
  
      // Sort back-to-front by Z for clean translucent bubble layering
      sortedIndices.sort((a: any, b: any) => bubbles[a].cz - bubbles[b].cz);
  
      for (let i = 0; i < COUNT; i++) {
        const b = bubbles[sortedIndices[i]];
        posArray[i * 3]     = b.cx;
        posArray[i * 3 + 1] = b.cy;
        posArray[i * 3 + 2] = b.cz;
        radArray[i]         = b.radius;
        colArray[i * 3]     = b.cr;
        colArray[i * 3 + 1] = b.cg;
        colArray[i * 3 + 2] = b.cb;
      }
  
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uResLoc, canvas.width, canvas.height);
  
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.bufferData(gl.ARRAY_BUFFER, posArray, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(aPosLoc);
      gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 0, 0);
  
      gl.bindBuffer(gl.ARRAY_BUFFER, radBuf);
      gl.bufferData(gl.ARRAY_BUFFER, radArray, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(aRadLoc);
      gl.vertexAttribPointer(aRadLoc, 1, gl.FLOAT, false, 0, 0);
  
      gl.bindBuffer(gl.ARRAY_BUFFER, colBuf);
      gl.bufferData(gl.ARRAY_BUFFER, colArray, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(aColLoc);
      gl.vertexAttribPointer(aColLoc, 3, gl.FLOAT, false, 0, 0);
  
      gl.drawArrays(gl.POINTS, 0, COUNT);
      requestAnimationFrame(render);
    }
  
    requestAnimationFrame(render);
  })();
}
/* eslint-enable */

export function Asset19({ className, style, width = '100%', height = '100%' }: Asset19Props) {
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

    initAsset19Runtime({
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
      className={className ? `fv-assets-asset-19 ${className}` : 'fv-assets-asset-19'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="glCanvas"></canvas>
    </div>
  );
}

export default Asset19;
