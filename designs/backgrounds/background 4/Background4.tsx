'use client';

/**
 * Background 04 — Molten Chrome Ferrofluid Surface
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Background4Props {
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
.fv-backgrounds-background-4 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-backgrounds-background-4 *, .fv-backgrounds-background-4 *::before, .fv-backgrounds-background-4 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-backgrounds-background-4 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #050508;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-backgrounds-background-4 canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: grab;
  }

  .fv-backgrounds-background-4 canvas:active {
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
function initBackground4Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    // Specular liquid mercury & magnetic ferrofluid surface shader with pointer spike attraction and studio environment reflections
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
      uniform float uMagnetBoost;
      uniform float uSpikeFreq;
  
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
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
  
      // Smooth metaball-like ferrofluid heightfield with magnetic rosette spikes near cursor
      float ferroHeight(vec2 p, float t, vec2 ptr, float boost, float freq) {
        vec2 warp = vec2(
          noise(p * 1.4 + vec2(t * 0.32, -t * 0.24)),
          noise(p * 1.4 + vec2(-t * 0.28, t * 0.36) + 4.3)
        ) - 0.5;
  
        vec2 q = p + warp * 0.55;
        float swell = 0.0;
        swell += 0.34 * sin(q.x * 2.4 + t * 0.85) * cos(q.y * 2.1 - t * 0.72);
        swell += 0.22 * sin((q.x + q.y) * 3.6 - t * 1.15);
        swell += 0.16 * noise(q * 3.2 - t * 0.45);
  
        // Magnetic Rosensweig-instability spikes focused around the live pointer
        vec2 d = p - ptr;
        float r = length(d);
        float angle = atan(d.y, d.x);
        float envelope = exp(-r * r * (1.85 - boost * 0.55));
        float radialRings = cos(r * 13.0 * freq - t * 3.6 - boost * 2.5);
        float petals = cos(angle * 7.0 + sin(r * 4.0 - t) * 2.0);
        float spikes = pow(0.5 + 0.5 * radialRings * (0.65 + 0.35 * petals), 1.8) * envelope * (0.65 + boost * 0.55);
  
        return swell + spikes;
      }
  
      vec3 sampleStudioEnv(vec3 refl, vec3 darkCore, vec3 chromeMid, vec3 iridBlue, vec3 iridAmber) {
        // Overhead studio softbox strips + rim gradient
        float sky = smoothstep(-0.35, 0.85, refl.y);
        float strip1 = smoothstep(0.76, 0.94, refl.z) * smoothstep(0.65, 0.05, abs(refl.x * 0.65 - refl.y * 0.45));
        float strip2 = smoothstep(0.55, 0.88, -refl.x * 0.6 + refl.y * 0.6 + refl.z * 0.45);
        float horizonBand = exp(-pow(refl.y + 0.12, 2.0) * 14.0);
  
        vec3 env = mix(darkCore, chromeMid, sky * 0.72);
        env += iridBlue * horizonBand * 0.62;
        env += iridAmber * smoothstep(0.2, 0.95, refl.x * 0.7 - refl.y * 0.3) * 0.36;
        env += vec3(0.96, 0.98, 1.0) * (strip1 * 1.15 + strip2 * 0.55);
        return env;
      }
  
      void main() {
        float SURFACE_SCALE = 2.60;
        float BUMP_DEPTH = 0.62;
        float CHROME_GLOSS = 1.20;
  
        float aspect = uResolution.x / max(uResolution.y, 1.0);
        vec2 p = (vUv - 0.5) * vec2(aspect, 1.0) * SURFACE_SCALE;
        vec2 ptr = (uPointer - 0.5) * vec2(aspect, 1.0) * SURFACE_SCALE;
  
        float eps = 0.012;
        float hC = ferroHeight(p, uTime, ptr, uMagnetBoost, uSpikeFreq);
        float hX = ferroHeight(p + vec2(eps, 0.0), uTime, ptr, uMagnetBoost, uSpikeFreq);
        float hY = ferroHeight(p + vec2(0.0, eps), uTime, ptr, uMagnetBoost, uSpikeFreq);
  
        vec3 normal = normalize(vec3(-(hX - hC) / eps * BUMP_DEPTH, -(hY - hC) / eps * BUMP_DEPTH, 1.0));
        vec3 viewDir = normalize(vec3((vUv - 0.5) * vec2(aspect, 1.0) * -0.45, 1.0));
        vec3 refl = reflect(-viewDir, normal);
  
        vec3 obsidianCore = vec3(0.020, 0.022, 0.035);
        vec3 liquidSilver = vec3(0.560, 0.600, 0.680);
        vec3 cobaltRim    = vec3(0.160, 0.450, 0.960);
        vec3 copperRim    = vec3(0.950, 0.440, 0.220);
  
        vec3 envCol = sampleStudioEnv(refl, obsidianCore, liquidSilver, cobaltRim, copperRim);
  
        float fresnel = pow(1.0 - max(0.0, dot(normal, viewDir)), 3.2);
        vec3 keyLight = normalize(vec3(-0.45, 0.62, 0.64));
        vec3 fillLight = normalize(vec3(0.58, -0.42, 0.69));
        float specKey = pow(max(0.0, dot(refl, keyLight)), 42.0);
        float specFill = pow(max(0.0, dot(refl, fillLight)), 24.0);
  
        // Subtle thin-film chromatic iridescence along grazing ferrofluid crests
        vec3 thinFilm = mix(cobaltRim, copperRim, 0.5 + 0.5 * sin(hC * 8.0 + fresnel * 5.0));
  
        vec3 col = envCol * (0.58 + 0.52 * fresnel) * CHROME_GLOSS;
        col += thinFilm * fresnel * (0.42 + uMagnetBoost * 0.35);
        col += vec3(1.0, 0.99, 0.98) * specKey * 0.95;
        col += cobaltRim * specFill * 0.45;
  
        // Ambient occlusion in deep liquid troughs
        float ao = smoothstep(-0.55, 0.35, hC);
        col *= 0.48 + 0.52 * ao;
  
        col = 1.0 - exp(-col * 1.18);
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
    const uMagnetBoost = gl.getUniformLocation(prog, 'uMagnetBoost');
    const uSpikeFreq = gl.getUniformLocation(prog, 'uSpikeFreq');
  
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
    let magnetBoost = 0.0, targetBoost = 0.0;
    let spikeFreq = 1.0, targetFreq = 1.0;
  
    window.addEventListener('pointermove', (e: any) => {
      targetPtrX = e.clientX / Math.max(window.innerWidth, 1);
      targetPtrY = 1.0 - e.clientY / Math.max(window.innerHeight, 1);
    });
  
    window.addEventListener('pointerdown', (e: any) => {
      targetPtrX = e.clientX / Math.max(window.innerWidth, 1);
      targetPtrY = 1.0 - e.clientY / Math.max(window.innerHeight, 1);
      targetBoost = 1.0;
    });
  
    window.addEventListener('pointerup', () => {
      targetBoost = 0.0;
    });
  
    window.addEventListener('wheel', (e: any) => {
      targetFreq = Math.max(0.55, Math.min(1.8, targetFreq - e.deltaY * 0.0005));
    }, { passive: true });
  
    function render(now?: any) {
      const t = now * 0.001;
  
      ptrX += (targetPtrX - ptrX) * 0.085;
      ptrY += (targetPtrY - ptrY) * 0.085;
      magnetBoost += (targetBoost - magnetBoost) * 0.09;
      spikeFreq += (targetFreq - spikeFreq) * 0.08;
  
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uPointer, ptrX, ptrY);
      gl.uniform1f(uMagnetBoost, magnetBoost);
      gl.uniform1f(uSpikeFreq, spikeFreq);
  
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestAnimationFrame(render);
    }
  
    requestAnimationFrame(render);
  })();
}
/* eslint-enable */

export function Background4({ className, style, width = '100%', height = '100%' }: Background4Props) {
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

    initBackground4Runtime({
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
      className={className ? `fv-backgrounds-background-4 ${className}` : 'fv-backgrounds-background-4'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="glCanvas"></canvas>
    </div>
  );
}

export default Background4;
