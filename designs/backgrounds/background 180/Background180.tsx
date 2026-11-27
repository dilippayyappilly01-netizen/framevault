'use client';

/**
 * Background 180 — Sunlit Cumulus Cloud Sea
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Background180Props {
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
.fv-backgrounds-background-180 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-backgrounds-background-180 *, .fv-backgrounds-background-180 *::before, .fv-backgrounds-background-180 *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .fv-backgrounds-background-180 { width: 100%; height: 100%; overflow: hidden; background: #8ab4e8; user-select: none; -webkit-font-smoothing: antialiased; }
  .fv-backgrounds-background-180 canvas { display: block; width: 100%; height: 100%; cursor: pointer; }
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
function initBackground180Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl2', { antialias: true }) || canvas.getContext('webgl', { antialias: true });
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
  
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
      }
      float fbm(vec2 p) {
        float v = 0.0, a = 0.5;
        for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.02 + vec2(3.1, 1.7); a *= 0.5; }
        return v;
      }
      void main() {
        float CLOUD_SCALE = 2.6;
        float aspect = uResolution.x / max(uResolution.y, 1.0);
        vec2 p = (vUv - 0.5) * vec2(aspect, 1.0) * CLOUD_SCALE * uZoom;
        vec2 ptr = (uPointer - 0.5) * vec2(aspect, 1.0);
        vec2 q = p + vec2(uTime * 0.14, uTime * 0.04) + ptr * 0.45;
        float c = fbm(q);
        float cLit = fbm(q + normalize(vec2(-0.6, 0.7)) * 0.18);
        float density = smoothstep(0.36, 0.78, c);
        float rim = clamp((c - cLit) * 3.2 + 0.5, 0.0, 1.0);
        vec3 skyLo = vec3(0.58, 0.76, 0.96);
        vec3 skyHi = vec3(0.24, 0.48, 0.84);
        vec3 cloudShadow = vec3(0.68, 0.76, 0.88);
        vec3 cloudSun    = vec3(1.00, 0.98, 0.95);
        vec3 col = mix(skyLo, skyHi, vUv.y);
        col = mix(col, mix(cloudShadow, cloudSun, rim), density);
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
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
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
  
    let ptrX = 0.5, ptrY = 0.5, tPtrX = 0.5, tPtrY = 0.5;
    let velX = 0.0, velY = 0.0;
    let pulseX = 0.5, pulseY = 0.5, pulseT = -20.0;
    let press = 0.0, tPress = 0.0;
    let zoom = 1.0, tZoom = 1.0, nowSec = 0.0;
  
    window.addEventListener('pointermove', (e: any) => {
      const nx = e.clientX / Math.max(window.innerWidth, 1);
      const ny = 1.0 - e.clientY / Math.max(window.innerHeight, 1);
      velX += (nx - tPtrX) * 0.8;
      velY += (ny - tPtrY) * 0.8;
      tPtrX = nx; tPtrY = ny;
    });
    window.addEventListener('pointerdown', (e: any) => {
      tPress = 1.0;
      pulseX = e.clientX / Math.max(window.innerWidth, 1);
      pulseY = 1.0 - e.clientY / Math.max(window.innerHeight, 1);
      pulseT = nowSec;
    });
    window.addEventListener('pointerup', () => { tPress = 0.0; });
    window.addEventListener('pointerleave', () => { tPress = 0.0; });
    window.addEventListener('wheel', (e: any) => {
      tZoom = Math.max(0.6, Math.min(1.75, tZoom + e.deltaY * 0.0005));
    }, { passive: true });
  
    function render(now?: any) {
      const t = now * 0.001;
      nowSec = t;
      ptrX += (tPtrX - ptrX) * 0.085;
      ptrY += (tPtrY - ptrY) * 0.085;
      velX *= 0.90; velY *= 0.90;
      press += (tPress - press) * 0.09;
      zoom += (tZoom - zoom) * 0.08;
  
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uPointer, ptrX, ptrY);
      gl.uniform2f(uVelocity, velX, velY);
      gl.uniform3f(uPulse, pulseX, pulseY, pulseT);
      gl.uniform1f(uPress, press);
      gl.uniform1f(uZoom, zoom);
  
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
  })();
}
/* eslint-enable */

export function Background180({ className, style, width = '100%', height = '100%', blendMode = "normal", transparentBackground = false, edgeFeather = 0 }: Background180Props) {
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

    initBackground180Runtime({
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
      className={className ? `fv-backgrounds-background-180 ${className}` : 'fv-backgrounds-background-180'}
      style={{ width, height, ...blendStyle, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="glCanvas"></canvas>
    </div>
  );
}

export default Background180;
