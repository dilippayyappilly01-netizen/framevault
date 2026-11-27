'use client';

/**
 * Background 10 — Holographic Halftone Moire Matrix
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Background10Props {
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
.fv-backgrounds-background-10 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-backgrounds-background-10 *, .fv-backgrounds-background-10 *::before, .fv-backgrounds-background-10 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-backgrounds-background-10 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #06070c;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-backgrounds-background-10 canvas {
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
function initBackground10Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    // Precision micro-LED halftone & optical moire wave matrix with holographic diffraction lens and scanline pulse
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
      uniform vec3 uScan;
      uniform float uPitch;
  
      void main() {
        float CELL_COUNT = 64.0;
        float MOIRE_FREQ = 5.40;
        float HOLO_SHIFT = 1.15;
  
        float aspect = uResolution.x / max(uResolution.y, 1.0);
        vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);
        vec2 ptr = (uPointer - 0.5) * vec2(aspect, 1.0);
  
        // Optical magnifier lens distortion around the live cursor
        vec2 toPtr = p - ptr;
        float dPtr = length(toPtr);
        float lens = exp(-dPtr * dPtr * 7.5);
        vec2 lensUv = p - toPtr * lens * 0.26;
  
        // Quantize space into crisp micro-LED halftone cells
        float density = CELL_COUNT * uPitch;
        vec2 gridCoord = lensUv * density;
        vec2 cellId = floor(gridCoord);
        vec2 cellLocal = fract(gridCoord) - 0.5;
        vec2 cellWorld = (cellId + 0.5) / density;
  
        // Dual-source interfering moire wave harmonics evaluated at cell center
        vec2 srcA = vec2(sin(uTime * 0.42) * 0.45, cos(uTime * 0.31) * 0.32);
        vec2 srcB = ptr;
        float dA = length(cellWorld - srcA);
        float dB = length(cellWorld - srcB);
  
        float w1 = sin(dA * MOIRE_FREQ * 3.2 - uTime * 1.85);
        float w2 = sin(dB * MOIRE_FREQ * 3.8 - uTime * 2.35);
        float w3 = cos((cellWorld.x * 1.4 - cellWorld.y * 1.1) * MOIRE_FREQ * 2.2 + uTime * 1.15);
        float waveEnergy = 0.5 + 0.5 * ((w1 + w2 + w3) / 3.0);
  
        // Click radial scanline sweep
        vec2 scanOrigin = (uScan.xy - 0.5) * vec2(aspect, 1.0);
        float scanAge = max(0.0, uTime - uScan.z);
        float dScan = length(cellWorld - scanOrigin);
        float scanBand = exp(-pow(dScan - scanAge * 0.95, 2.0) * 90.0) * exp(-scanAge * 1.25);
  
        float energy = clamp(pow(waveEnergy, 1.35) + lens * 0.32 + scanBand * 0.75, 0.04, 1.0);
  
        // Anti-aliased variable-aperture halftone dot + subtle sub-cell ring
        float rCell = length(cellLocal);
        float maxRadius = 0.44 * energy + 0.05;
        float aa = clamp(density / max(uResolution.y, 1.0) * 1.35, 0.015, 0.08);
        float dotMask = 1.0 - smoothstep(maxRadius - aa, maxRadius + aa, rCell);
        float coreHot = 1.0 - smoothstep(0.0, maxRadius * 0.55, rCell);
  
        vec3 darkPanel   = vec3(0.024, 0.027, 0.047);
        vec3 holoCobalt  = vec3(0.180, 0.440, 0.980);
        vec3 holoMint    = vec3(0.140, 0.940, 0.760);
        vec3 holoMagenta = vec3(0.920, 0.280, 0.860);
        vec3 silverPeak  = vec3(0.950, 0.970, 1.000);
  
        // Iridescent diffraction phase varies smoothly with wave angle & cursor proximity
        float diffPhase = fract((dA - dB) * 1.35 * HOLO_SHIFT + uTime * 0.08 + energy * 0.35);
        vec3 holoCol = mix(holoCobalt, holoMint, smoothstep(0.0, 0.5, diffPhase));
        holoCol = mix(holoCol, holoMagenta, smoothstep(0.45, 0.92, diffPhase));
        holoCol = mix(holoCol, silverPeak, pow(energy, 2.6) * 0.65 + scanBand * 0.55);
  
        // Subtle recessed matrix bezel grid between LEDs
        float bezel = smoothstep(0.49, 0.45, max(abs(cellLocal.x), abs(cellLocal.y)));
        vec3 bg = darkPanel * (0.78 + 0.22 * bezel);
  
        vec3 col = bg;
        col += holoCol * dotMask * (0.35 + 0.85 * energy);
        col += silverPeak * dotMask * coreHot * pow(energy, 2.0) * 0.42;
  
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
    const uScan = gl.getUniformLocation(prog, 'uScan');
    const uPitch = gl.getUniformLocation(prog, 'uPitch');
  
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
    let scanX = 0.5, scanY = 0.5, scanTime = -20.0;
    let pitch = 1.0, targetPitch = 1.0;
    let nowSec = 0.0;
  
    window.addEventListener('pointermove', (e: any) => {
      targetPtrX = e.clientX / Math.max(window.innerWidth, 1);
      targetPtrY = 1.0 - e.clientY / Math.max(window.innerHeight, 1);
    });
  
    window.addEventListener('pointerdown', (e: any) => {
      scanX = e.clientX / Math.max(window.innerWidth, 1);
      scanY = 1.0 - e.clientY / Math.max(window.innerHeight, 1);
      scanTime = nowSec;
    });
  
    window.addEventListener('wheel', (e: any) => {
      targetPitch = Math.max(0.6, Math.min(1.7, targetPitch - e.deltaY * 0.0005));
    }, { passive: true });
  
    function render(now?: any) {
      const t = now * 0.001;
      nowSec = t;
  
      ptrX += (targetPtrX - ptrX) * 0.085;
      ptrY += (targetPtrY - ptrY) * 0.085;
      pitch += (targetPitch - pitch) * 0.08;
  
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uPointer, ptrX, ptrY);
      gl.uniform3f(uScan, scanX, scanY, scanTime);
      gl.uniform1f(uPitch, pitch);
  
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestAnimationFrame(render);
    }
  
    requestAnimationFrame(render);
  })();
}
/* eslint-enable */

export function Background10({ className, style, width = '100%', height = '100%', blendMode = "normal", transparentBackground = false, edgeFeather = 0 }: Background10Props) {
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

    initBackground10Runtime({
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
      className={className ? `fv-backgrounds-background-10 ${className}` : 'fv-backgrounds-background-10'}
      style={{ width, height, ...blendStyle, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="glCanvas"></canvas>
    </div>
  );
}

export default Background10;
