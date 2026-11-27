'use client';

/**
 * Background 02 — Interactive Topographic Contour Field
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Background2Props {
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
.fv-backgrounds-background-2 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-backgrounds-background-2 *, .fv-backgrounds-background-2 *::before, .fv-backgrounds-background-2 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-backgrounds-background-2 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #07090e;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-backgrounds-background-2 canvas {
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
function initBackground2Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    // Architectural elevation contour background with interactive cursor terrain summit/well and seismic wave rings
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
      uniform float uPress;
      uniform vec3 uPulse;
      uniform float uContourDensity;
  
      float hash(vec2 p) {
        p = fract(p * vec2(234.34, 435.345));
        p += dot(p, p + 34.23);
        return fract(p.x * p.y);
      }
  
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }
  
      float terrainHeight(vec2 p, float t, vec2 ptr, float press, vec2 pulsePos, float pulseAge) {
        float h = 0.0;
        float amp = 0.52;
        vec2 q = p;
        mat2 m = mat2(0.84, -0.54, 0.54, 0.84);
        for (int i = 0; i < 4; i++) {
          h += amp * noise(q + vec2(t * 0.09, -t * 0.07) * float(i + 1));
          q = m * q * 2.02 + vec2(4.1, 2.7);
          amp *= 0.48;
        }
  
        // Cursor Gaussian elevation mound (or gravity well while pressed)
        float dPtr = length(p - ptr);
        float mound = exp(-dPtr * dPtr * 2.2) * mix(0.42, -0.48, press);
        h += mound;
  
        // Seismic pulse wave emitted on click
        float dPulse = length(p - pulsePos);
        float waveFront = dPulse - pulseAge * 1.85;
        float seismic = cos(waveFront * 10.0) * exp(-waveFront * waveFront * 5.0) * exp(-pulseAge * 1.15) * 0.18;
        h += seismic;
  
        return h;
      }
  
      void main() {
        float TERRAIN_SCALE = 3.10;
        float CONTOUR_STEPS = 18.0;
        float LINE_GLOW = 1.25;
  
        float aspect = uResolution.x / max(uResolution.y, 1.0);
        vec2 p = (vUv - 0.5) * vec2(aspect, 1.0) * TERRAIN_SCALE;
        vec2 ptr = (uPointer - 0.5) * vec2(aspect, 1.0) * TERRAIN_SCALE;
        vec2 pulsePos = (uPulse.xy - 0.5) * vec2(aspect, 1.0) * TERRAIN_SCALE;
        float pulseAge = max(0.0, uTime - uPulse.z);
  
        float eps = TERRAIN_SCALE / max(uResolution.y, 1.0);
        float h = terrainHeight(p, uTime, ptr, uPress, pulsePos, pulseAge);
        float hx = terrainHeight(p + vec2(eps, 0.0), uTime, ptr, uPress, pulsePos, pulseAge);
        float hy = terrainHeight(p + vec2(0.0, eps), uTime, ptr, uPress, pulsePos, pulseAge);
  
        // Analytical screen-space gradient magnitude for uniform crisp anti-aliased contour lines
        float grad = max(length(vec2(hx - h, hy - h)), 1e-4);
        float steps = CONTOUR_STEPS * uContourDensity;
        float scaledH = h * steps;
  
        float minorDist = abs(fract(scaledH - 0.5) - 0.5) / (grad * steps);
        float majorDist = abs(fract(scaledH * 0.2 - 0.5) - 0.5) / (grad * steps * 0.2);
  
        float minorLine = 1.0 - smoothstep(0.55, 1.75, minorDist);
        float majorLine = 1.0 - smoothstep(0.75, 2.25, majorDist);
        float majorBloom = exp(-majorDist * 0.14) * 0.32;
  
        // Subtle architectural survey grid & crosshairs
        vec2 gridUv = fract(p * 2.0);
        float microGrid = (1.0 - smoothstep(0.0, 0.018, min(gridUv.x, gridUv.y))) * 0.08;
        vec2 crossUv = abs(fract(p * 2.0 + 0.5) - 0.5);
        float crossHair = (1.0 - smoothstep(0.008, 0.022, min(crossUv.x, crossUv.y))) *
                          (1.0 - smoothstep(0.06, 0.09, max(crossUv.x, crossUv.y))) * 0.22;
  
        vec3 slateBg      = vec3(0.027, 0.035, 0.055);
        vec3 basinTeal    = vec3(0.055, 0.285, 0.395);
        vec3 contourCyan  = vec3(0.180, 0.760, 0.890);
        vec3 summitAmber  = vec3(0.980, 0.620, 0.210);
        vec3 chalkCrest   = vec3(0.940, 0.960, 0.990);
  
        float elevNorm = smoothstep(0.25, 1.15, h);
        vec3 baseShade = mix(slateBg, basinTeal * 0.28, elevNorm);
  
        vec3 linePalette = mix(contourCyan, summitAmber, smoothstep(0.35, 0.92, elevNorm));
        vec3 majorPalette = mix(linePalette, chalkCrest, 0.45);
  
        float cursorGlow = exp(-dot(p - ptr, p - ptr) * 1.8);
        vec3 col = baseShade;
        col += vec3(0.22, 0.34, 0.48) * (microGrid + crossHair);
        col += linePalette * minorLine * 0.48 * LINE_GLOW;
        col += majorPalette * (majorLine * 0.95 + majorBloom) * LINE_GLOW;
        col += mix(contourCyan, summitAmber, uPress) * cursorGlow * 0.14;
  
        float vig = 1.0 - dot(vUv - 0.5, vUv - 0.5) * 0.55;
        col *= clamp(vig, 0.35, 1.0);
  
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
    const uPress = gl.getUniformLocation(prog, 'uPress');
    const uPulse = gl.getUniformLocation(prog, 'uPulse');
    const uContourDensity = gl.getUniformLocation(prog, 'uContourDensity');
  
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
    let press = 0.0, targetPress = 0.0;
    let pulseX = 0.5, pulseY = 0.5, pulseTime = -20.0;
    let density = 1.0, targetDensity = 1.0;
    let nowSec = 0.0;
  
    window.addEventListener('pointermove', (e: any) => {
      targetPtrX = e.clientX / Math.max(window.innerWidth, 1);
      targetPtrY = 1.0 - e.clientY / Math.max(window.innerHeight, 1);
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
  
    window.addEventListener('wheel', (e: any) => {
      targetDensity = Math.max(0.55, Math.min(1.85, targetDensity - e.deltaY * 0.0005));
    }, { passive: true });
  
    function render(now?: any) {
      const t = now * 0.001;
      nowSec = t;
  
      ptrX += (targetPtrX - ptrX) * 0.075;
      ptrY += (targetPtrY - ptrY) * 0.075;
      press += (targetPress - press) * 0.1;
      density += (targetDensity - density) * 0.08;
  
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uPointer, ptrX, ptrY);
      gl.uniform1f(uPress, press);
      gl.uniform3f(uPulse, pulseX, pulseY, pulseTime);
      gl.uniform1f(uContourDensity, density);
  
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestAnimationFrame(render);
    }
  
    requestAnimationFrame(render);
  })();
}
/* eslint-enable */

export function Background2({ className, style, width = '100%', height = '100%', blendMode = "normal", transparentBackground = false, edgeFeather = 0 }: Background2Props) {
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

    initBackground2Runtime({
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
      className={className ? `fv-backgrounds-background-2 ${className}` : 'fv-backgrounds-background-2'}
      style={{ width, height, ...blendStyle, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="glCanvas"></canvas>
    </div>
  );
}

export default Background2;
