'use client';

/**
 * Background 120 — Midnight Indigo Silver Veils
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Background120Props {
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
.fv-backgrounds-background-120 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-backgrounds-background-120 *, .fv-backgrounds-background-120 *::before, .fv-backgrounds-background-120 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-backgrounds-background-120 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #03040c;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-backgrounds-background-120 canvas {
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
function initBackground120Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    // Volumetric polar aurora curtains with starry night sky, pointer wind sway, and geomagnetic flare (Background 120 — Midnight Indigo Silver Veils)
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
  
      void main() {
        float CURTAIN_FREQ = 2.70;
        float STREAK_GAIN = 1.25;
        float WIND_SPEED = 0.32;
  
        float aspect = uResolution.x / max(uResolution.y, 1.0);
        vec2 uv = (vUv - 0.5) * vec2(aspect, 1.0);
        vec2 ptr = (uPointer - 0.5) * vec2(aspect, 1.0);
        float t = uTime * WIND_SPEED + 16.86;
  
        vec3 nightLo  = vec3(0.012, 0.016, 0.047);
        vec3 nightHi  = vec3(0.118, 0.161, 0.231);
        vec3 ribbonA  = vec3(0.388, 0.400, 0.945);
        vec3 ribbonB  = vec3(0.580, 0.639, 0.722);
        vec3 flareTop = vec3(0.973, 0.980, 0.988);
  
        vec3 col = mix(nightLo, nightHi, smoothstep(-0.5, 0.55, uv.y));
  
        // Subtle crisp stars
        vec2 starCell = floor(uv * 110.0);
        float sh = hash(starCell);
        if (sh > 0.986) {
          float sd = length(fract(uv * 110.0) - 0.5);
          float tw = 0.55 + 0.45 * sin(uTime * 2.8 + sh * 45.0);
          col += vec3(0.85, 0.93, 1.0) * smoothstep(0.18, 0.02, sd) * tw * 0.7;
        }
  
        // Layered vertical aurora curtains
        float age = max(0.0, uTime - uPulse.z);
        float flare = exp(-age * 1.4) * 0.75 + uPress * 0.35;
  
        vec3 aurora = vec3(0.0);
        for (int i = 0; i < 4; i++) {
          float fi = float(i);
          float xCoord = uv.x * (CURTAIN_FREQ + fi * 0.65) * uZoom + ptr.x * (0.45 + fi * 0.2);
          float waveY = sin(xCoord * 0.85 + t * (1.1 + fi * 0.25) + fi * 1.7) * 0.16
                      + cos(xCoord * 1.6 - t * 0.8 + fi) * 0.08
                      + (fi - 1.5) * 0.10 + ptr.y * 0.16;
  
          float dy = uv.y - waveY;
          float verticalEnv = exp(-max(0.0, dy) * 4.2) * smoothstep(-0.18, 0.04, dy);
          float rays = 0.45 + 0.55 * noise(vec2(xCoord * 3.8 + t * 1.4, uv.y * 1.6 + fi * 4.0));
          float fineRays = pow(noise(vec2(xCoord * 9.5 - t * 2.2, fi * 7.1)), 1.6);
  
          vec3 layerCol = mix(ribbonA, ribbonB, smoothstep(0.0, 0.32, dy) + fi * 0.15);
          layerCol = mix(layerCol, flareTop, smoothstep(0.18, 0.45, dy) * 0.65);
  
          aurora += layerCol * verticalEnv * (rays * 0.65 + fineRays * 0.85) * (0.42 + flare * 0.4);
        }
  
        col += aurora * STREAK_GAIN;
        col = 1.0 - exp(-col * 1.15);
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

export function Background120({ className, style, width = '100%', height = '100%' }: Background120Props) {
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

    initBackground120Runtime({
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
      className={className ? `fv-backgrounds-background-120 ${className}` : 'fv-backgrounds-background-120'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="glCanvas"></canvas>
    </div>
  );
}

export default Background120;
