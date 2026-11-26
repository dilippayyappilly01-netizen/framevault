'use client';

/**
 * Background 032 — Rose Quartz Mercury Blobs
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Background32Props {
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
.fv-backgrounds-background-32 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-backgrounds-background-32 *, .fv-backgrounds-background-32 *::before, .fv-backgrounds-background-32 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-backgrounds-background-32 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #0e050a;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-backgrounds-background-32 canvas {
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
function initBackground32Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    // Interactive glossy liquid metaball blobs coalescing around the pointer with click burst (Background 032 — Rose Quartz Mercury Blobs)
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
      uniform vec3 uPulse;
      uniform float uPress;
      uniform float uZoom;
  
  
      float smin(float a, float b, float k) {
        float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
        return mix(b, a, h) - k * h * (1.0 - h);
      }
  
      float fieldSDF(vec2 p, float t, vec2 ptr, float press, float spread) {
        float d = 10.0;
        for (int i = 0; i < 6; i++) {
          float fi = float(i) + 12.38;
          vec2 c = vec2(
            sin(t * (0.45 + 0.08 * float(i)) + fi * 1.7) * 0.68,
            cos(t * (0.38 + 0.09 * float(i)) + fi * 2.3) * 0.42
          ) * spread;
          float r = 0.14 + 0.045 * sin(fi * 3.1 + t * 0.7);
          d = smin(d, length(p - c) - r, 0.24);
        }
        float cursorR = 0.18 + press * 0.08;
        d = smin(d, length(p - ptr) - cursorR, 0.28);
        return d;
      }
  
      void main() {
        float BLOB_SCALE = 1.08;
        float GLOSS_POWER = 28.0;
        float RIM_BOOST = 1.25;
  
        float aspect = uResolution.x / max(uResolution.y, 1.0);
        vec2 p = (vUv - 0.5) * vec2(aspect, 1.0) * 1.65 * uZoom / BLOB_SCALE;
        vec2 ptr = (uPointer - 0.5) * vec2(aspect, 1.0) * 1.65 * uZoom / BLOB_SCALE;
  
        vec2 pulsePos = (uPulse.xy - 0.5) * vec2(aspect, 1.0) * 1.65 * uZoom / BLOB_SCALE;
        float age = max(0.0, uTime - uPulse.z);
        float burst = exp(-age * 2.2) * 0.22;
        float spread = 1.0 + burst;
  
        float eps = 0.008;
        float d  = fieldSDF(p, uTime, ptr, uPress, spread);
        float dx = fieldSDF(p + vec2(eps, 0.0), uTime, ptr, uPress, spread);
        float dy = fieldSDF(p + vec2(0.0, eps), uTime, ptr, uPress, spread);
  
        vec3 bgCol   = vec3(0.055, 0.020, 0.039);
        vec3 bodyLo  = vec3(0.420, 0.071, 0.224);
        vec3 bodyHi  = vec3(0.882, 0.114, 0.282);
        vec3 rimHue  = vec3(0.984, 0.443, 0.522);
        vec3 specCol = vec3(1.000, 0.945, 0.949);
  
        vec2 g = vec2(dx - d, dy - d) / eps;
        float inside = 1.0 - smoothstep(-0.008, 0.012, d);
        float outerHalo = exp(-max(0.0, d) * 7.5);
  
        float zNorm = sqrt(max(0.02, 1.0 - clamp(dot(g, g) * 0.35, 0.0, 0.95)));
        vec3 n = normalize(vec3(g * 0.72, zNorm));
        vec3 lightDir = normalize(vec3(-0.55, 0.65, 0.75));
        vec3 viewDir = vec3(0.0, 0.0, 1.0);
        vec3 halfVec = normalize(lightDir + viewDir);
  
        float diff = max(0.0, dot(n, lightDir));
        float spec = pow(max(0.0, dot(n, halfVec)), GLOSS_POWER);
        float fres = pow(1.0 - max(0.0, dot(n, viewDir)), 2.6);
  
        vec3 blobCol = mix(bodyLo, bodyHi, diff * 0.75 + 0.25 * (0.5 + 0.5 * sin(p.x * 2.5 - uTime)));
        blobCol += rimHue * fres * 0.95 * RIM_BOOST;
        blobCol += specCol * spec * 1.15;
  
        vec3 col = bgCol + rimHue * outerHalo * 0.26 + bodyHi * exp(-length(p - pulsePos) * 3.0) * burst;
        col = mix(col, blobCol, inside);
        col = 1.0 - exp(-col * 1.12);
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
    const uPulse = gl.getUniformLocation(prog, 'uPulse');
    const uPress = gl.getUniformLocation(prog, 'uPress');
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
    let pulseX = 0.5, pulseY = 0.5, pulseTime = -20.0;
    let press = 0.0, targetPress = 0.0;
    let zoom = 1.0, targetZoom = 1.0;
    let nowSec = 0.0;
  
    window.addEventListener('pointermove', (e: any) => {
      const nx = e.clientX / Math.max(window.innerWidth, 1);
      const ny = 1.0 - e.clientY / Math.max(window.innerHeight, 1);
      velX += (nx - targetPtrX) * 0.8;
      velY += (ny - targetPtrY) * 0.8;
      targetPtrX = nx;
      targetPtrY = ny;
    });
  
    window.addEventListener('pointerdown', (e: any) => {
      targetPress = 1.0;
      pulseX = e.clientX / Math.max(window.innerWidth, 1);
      pulseY = 1.0 - e.clientY / Math.max(window.innerHeight, 1);
      pulseTime = nowSec;
    });
  
    window.addEventListener('pointerup', () => {
      targetPress = 0.0;
    });
  
    window.addEventListener('pointerleave', () => {
      targetPress = 0.0;
    });
  
    window.addEventListener('wheel', (e: any) => {
      targetZoom = Math.max(0.6, Math.min(1.75, targetZoom + e.deltaY * 0.0005));
    }, { passive: true });
  
    function render(now?: any) {
      const t = now * 0.001;
      nowSec = t;
  
      ptrX += (targetPtrX - ptrX) * 0.08;
      ptrY += (targetPtrY - ptrY) * 0.08;
      velX *= 0.90;
      velY *= 0.90;
      press += (targetPress - press) * 0.09;
      zoom += (targetZoom - zoom) * 0.08;
  
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uPointer, ptrX, ptrY);
      gl.uniform2f(uVelocity, velX, velY);
      gl.uniform3f(uPulse, pulseX, pulseY, pulseTime);
      gl.uniform1f(uPress, press);
      gl.uniform1f(uZoom, zoom);
  
  
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestAnimationFrame(render);
    }
  
    requestAnimationFrame(render);
  })();
}
/* eslint-enable */

export function Background32({ className, style, width = '100%', height = '100%' }: Background32Props) {
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

    initBackground32Runtime({
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
      className={className ? `fv-backgrounds-background-32 ${className}` : 'fv-backgrounds-background-32'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="glCanvas"></canvas>
    </div>
  );
}

export default Background32;
