'use client';

/**
 * Background 017 — Cyber Cyan Circuit Labyrinth
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Background17Props {
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
.fv-backgrounds-background-17 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-backgrounds-background-17 *, .fv-backgrounds-background-17 *::before, .fv-backgrounds-background-17 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-backgrounds-background-17 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #040812;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-backgrounds-background-17 canvas {
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
function initBackground17Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    // Seamless Truchet arc labyrinth with glowing traveling signal pulses and pointer highlight (Background 017 — Cyber Cyan Circuit Labyrinth)
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
  
      void main() {
        float TILE_DENSITY = 9.0;
        float TRACE_WIDTH = 0.072;
        float SIGNAL_SPEED = 1.40;
  
        float aspect = uResolution.x / max(uResolution.y, 1.0);
        vec2 p = (vUv - 0.5) * vec2(aspect, 1.0) * TILE_DENSITY * uZoom;
        vec2 ptr = (uPointer - 0.5) * vec2(aspect, 1.0) * TILE_DENSITY * uZoom;
  
        p += vec2(uTime * 0.18, uTime * 0.09);
        ptr += vec2(uTime * 0.18, uTime * 0.09);
  
        vec2 cell = floor(p);
        vec2 uv = fract(p) - 0.5;
        float h = hash(cell + 7.81);
        if (h > 0.5) uv.x = -uv.x;
  
        vec2 c1 = uv - vec2(0.5, 0.5);
        vec2 c2 = uv + vec2(0.5, 0.5);
        float d1 = abs(length(c1) - 0.5);
        float d2 = abs(length(c2) - 0.5);
        float d = min(d1, d2);
        float ang = d1 < d2 ? atan(c1.y, c1.x) : atan(c2.y, c2.x);
  
        float checker = mod(cell.x + cell.y, 2.0) * 2.0 - 1.0;
        float flow = 0.5 + 0.5 * sin(ang * 4.0 * checker - uTime * SIGNAL_SPEED * 2.5 + h * 6.2831);
        float packet = pow(flow, 5.0);
  
        float dPtr = length(p - ptr);
        float ptrGlow = exp(-dPtr * dPtr * 0.16) * (0.85 + uPress * 0.75);
  
        vec2 pulsePos = (uPulse.xy - 0.5) * vec2(aspect, 1.0) * TILE_DENSITY * uZoom + vec2(uTime * 0.18, uTime * 0.09);
        float age = max(0.0, uTime - uPulse.z);
        float scan = exp(-pow(length(p - pulsePos) - age * 6.5, 2.0) * 1.4) * exp(-age * 1.15);
  
        float aa = clamp(TILE_DENSITY / max(uResolution.y, 1.0) * 1.5, 0.008, 0.04);
        float line = 1.0 - smoothstep(TRACE_WIDTH - aa, TRACE_WIDTH + aa, d);
        float halo = exp(-d * 14.0);
  
        vec3 boardBg  = vec3(0.016, 0.031, 0.071);
        vec3 traceLo  = vec3(0.055, 0.455, 0.565);
        vec3 traceHi  = vec3(0.133, 0.827, 0.933);
        vec3 pulseCol = vec3(0.647, 0.953, 0.988);
        vec3 hotCore  = vec3(1.000, 1.000, 1.000);
  
        vec3 col = boardBg;
        col += traceLo * halo * (0.35 + ptrGlow * 0.55);
        col = mix(col, mix(traceLo, traceHi, 0.4 + 0.6 * ptrGlow), line * 0.92);
        col += pulseCol * line * (packet * 0.95 + scan * 1.25);
        col += hotCore * halo * (packet * ptrGlow * 0.65 + scan * 0.55);
  
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

export function Background17({ className, style, width = '100%', height = '100%', blendMode = "normal", transparentBackground = false, edgeFeather = 0 }: Background17Props) {
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

    initBackground17Runtime({
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
      className={className ? `fv-backgrounds-background-17 ${className}` : 'fv-backgrounds-background-17'}
      style={{ width, height, ...blendStyle, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="glCanvas"></canvas>
    </div>
  );
}

export default Background17;
