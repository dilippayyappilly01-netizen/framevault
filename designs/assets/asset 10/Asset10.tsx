'use client';

/**
 * Asset 10 — 3D Tilted Ringed Spiral Star-Cluster Galaxy
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Asset10Props {
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
.fv-assets-asset-10 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-assets-asset-10 *, .fv-assets-asset-10 *::before, .fv-assets-asset-10 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-assets-asset-10 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000000;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-assets-asset-10 canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: grab;
  }

  .fv-assets-asset-10 canvas:active {
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
function initAsset10Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl2', { antialias: true }) ||
               canvas.getContext('webgl', { antialias: true });
    if (!gl) return;
  
    const vsSource = `
      attribute vec3 aPos;
      attribute float aRadius;
      attribute float aSize;
      attribute float aTint;
  
      uniform float uTime;
      uniform vec2 uResolution;
      uniform mat3 uRot;
  
      varying vec3 vColor;
      varying float vAlpha;
  
      void main() {
        // Differential galactic rotation around local Y axis
        float spinSpeed = 0.18 / (0.35 + aRadius * 0.85);
        float angle = -uTime * spinSpeed;
        float ca = cos(angle);
        float sa = sin(angle);
  
        vec3 spun = vec3(
          aPos.x * ca - aPos.z * sa,
          aPos.y,
          aPos.x * sa + aPos.z * ca
        );
  
        vec3 worldPos = uRot * spun;
  
        // Perspective camera matching Asset 10 recording
        float fov = 2.8;
        float persp = fov / (fov - worldPos.z * 0.45);
  
        float aspect = uResolution.x / max(uResolution.y, 1.0);
        float scale = 0.88;
        vec2 screenPos = vec2(
          (worldPos.x * scale * persp) / aspect,
          worldPos.y * scale * persp
        );
  
        gl_Position = vec4(screenPos, 0.0, 1.0);
  
        float dpr = min(2.0, uResolution.y / 900.0);
        gl_PointSize = aSize * persp * max(0.85, dpr * 0.95);
  
        // Crisp white, silver-blue, and subtle pale-lavender star palette from Asset 10 video
        vec3 pureWhite  = vec3(0.96, 0.98, 1.00);
        vec3 silverBlue = vec3(0.72, 0.82, 1.00);
        vec3 softLilac  = vec3(0.82, 0.75, 0.98);
  
        vec3 col = mix(pureWhite, silverBlue, clamp(aTint * 1.4, 0.0, 1.0));
        col = mix(col, softLilac, smoothstep(0.65, 1.0, aTint) * 0.55);
  
        float coreHole = smoothstep(0.05, 0.22, aRadius);
        float depthFade = mix(0.45, 1.0, smoothstep(-1.1, 1.1, worldPos.z));
        vColor = col;
        vAlpha = (0.28 + 0.54 * (1.0 - smoothstep(0.45, 1.35, aRadius))) * depthFade * (0.35 + 0.65 * coreHole);
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
        float core = 1.0 - smoothstep(0.2, 1.0, r2);
        gl_FragColor = vec4(vColor, vAlpha * core);
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
  
    // Generate 24,000 star particles matching the exact structure of Asset 10 recording:
    // 1) Central diffuse core cluster + bar/bridge (r < 0.26)
    // 2) Dark cleared inner Cassini-like division gap (r ~ 0.26..0.40)
    // 3) Dense, bright main star ring & tightly wound spiral arms (r ~ 0.40..0.68)
    // 4) Secondary outer ring & scattered galactic halo (r ~ 0.72..1.38)
    const COUNT = 24000;
    const positions = new Float32Array(COUNT * 3);
    const radii = new Float32Array(COUNT);
    const sizes = new Float32Array(COUNT);
    const tints = new Float32Array(COUNT);
  
    function gauss() {
      let u = 0, v = 0;
      while (u === 0) u = Math.random();
      while (v === 0) v = Math.random();
      return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }
  
    for (let i = 0; i < COUNT; i++) {
      let r: any, theta: any, yThickness: any;
      const p = Math.random();
  
      if (p < 0.14) {
        // 1) Central core cluster & asymmetric inner bar
        r = Math.abs(gauss()) * 0.14;
        theta = Math.random() * Math.PI * 2;
        // Slight bar elongation toward bottom-left of core as seen in Asset 10
        if (Math.random() < 0.55) {
          theta = -2.2 + gauss() * 0.55;
          r = 0.08 + Math.random() * 0.28;
        }
        yThickness = gauss() * 0.038;
      } else if (p < 0.74) {
        // 2) Dense bright main ring (r ~ 0.42..0.66) with 2 tightly wound spiral density arms
        const arm = i % 2;
        const armOffset = arm * Math.PI + gauss() * 0.65;
        r = 0.52 + gauss() * 0.075;
        r = Math.max(0.37, Math.min(0.74, r));
        theta = armOffset - r * 4.2 + Math.random() * Math.PI * 2 * 0.35;
        yThickness = gauss() * 0.028;
      } else {
        // 3) Outer diffuse ring & scattered halo stars (r ~ 0.74..1.42)
        r = 0.76 + Math.pow(Math.random(), 1.35) * 0.68;
        theta = Math.random() * Math.PI * 2;
        yThickness = gauss() * (0.035 + r * 0.03);
      }
  
      positions[i * 3]     = Math.cos(theta) * r;
      positions[i * 3 + 1] = yThickness;
      positions[i * 3 + 2] = Math.sin(theta) * r;
  
      radii[i] = r;
      sizes[i] = 1.05 + Math.pow(Math.random(), 2.4) * 1.45;
      tints[i] = Math.random();
    }
  
    function bindAttr(name: any, data: any, size?: any) {
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    }
  
    bindAttr('aPos', positions, 3);
    bindAttr('aRadius', radii, 1);
    bindAttr('aSize', sizes, 1);
    bindAttr('aTint', tints, 1);
  
    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uResolution = gl.getUniformLocation(prog, 'uResolution');
    const uRot = gl.getUniformLocation(prog, 'uRot');
  
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();
  
    // Initial 3D tilt & diagonal roll matching 00:00 of the Asset 10 recording
    // Pitch ~ 56 deg, diagonal roll ~ +28 deg (bottom-left to top-right major axis)
    let rotX = 0.96;
    let rotZ = 0.48;
    let rotY = 0.0;
    let targetRotX = 0.96;
    let targetRotZ = 0.48;
    let targetRotY = 0.0;
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
  
    window.addEventListener('pointerdown', (e: any) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    });
  
    window.addEventListener('pointermove', (e: any) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      targetRotY += dx * 0.007;
      targetRotX = Math.max(-1.45, Math.min(1.45, targetRotX + dy * 0.007));
    });
  
    window.addEventListener('pointerup', () => {
      isDragging = false;
    });
  
    function mat3FromEuler(rx: any, ry: any, rz?: any) {
      const cx = Math.cos(rx), sx = Math.sin(rx);
      const cy = Math.cos(ry), sy = Math.sin(ry);
      const cz = Math.cos(rz), sz = Math.sin(rz);
  
      return new Float32Array([
        cz * cy - sz * sx * sy, -sz * cx, cz * sy + sz * sx * cy,
        sz * cy + cz * sx * sy,  cz * cx, sz * sy - cz * sx * cy,
       -cx * sy,                 sx,      cx * cy
      ]);
    }
  
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
  
    function render(now?: any) {
      const t = now * 0.001;
  
      rotX += (targetRotX - rotX) * 0.08;
      rotY += (targetRotY - rotY) * 0.08;
      rotZ += (targetRotZ - rotZ) * 0.08;
  
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniformMatrix3fv(uRot, false, mat3FromEuler(rotX, rotY, rotZ));
  
      gl.drawArrays(gl.POINTS, 0, COUNT);
      requestAnimationFrame(render);
    }
  
    requestAnimationFrame(render);
  })();
}
/* eslint-enable */

export function Asset10({ className, style, width = '100%', height = '100%' }: Asset10Props) {
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

    initAsset10Runtime({
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
      className={className ? `fv-assets-asset-10 ${className}` : 'fv-assets-asset-10'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="glCanvas"></canvas>
    </div>
  );
}

export default Asset10;
