'use client';

/**
 * Background 06 — Prismatic Caustic Glass Waves
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Background6Props {
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
.fv-backgrounds-background-6 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-backgrounds-background-6 *, .fv-backgrounds-background-6 *::before, .fv-backgrounds-background-6 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-backgrounds-background-6 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #eef2f8;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-backgrounds-background-6 canvas {
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
function initBackground6Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    // Editorial sunlit water & prismatic glass caustics shader with chromatic dispersion and interactive droplet ripples
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
      uniform vec3 uDrop;
      uniform float uScale;
  
      // Iterative trigonometric caustic interference network
      float causticPattern(vec2 uv, float t) {
        vec2 p = mod(uv * 6.2831853, 6.2831853) - 250.0;
        vec2 i = p;
        float c = 1.0;
        float inten = 0.0052;
  
        for (int n = 0; n < 5; n++) {
          float fn = float(n) + 1.0;
          float tn = t * (1.0 - 2.8 / (fn + 2.0));
          i = p + vec2(
            cos(tn - i.x) + sin(tn + i.y),
            sin(tn - i.y) + cos(tn + i.x)
          );
          vec2 denom = vec2(
            p.x / (sin(i.x + tn) / inten),
            p.y / (cos(i.y + tn) / inten)
          );
          c += 1.0 / max(length(denom), 0.001);
        }
        c /= 5.0;
        c = 1.16 - pow(c, 1.38);
        return clamp(pow(abs(c), 7.5), 0.0, 1.6);
      }
  
      void main() {
        float CAUSTIC_ZOOM = 0.62;
        float CHROMA_SPREAD = 0.011;
        float RIB_STRENGTH = 0.18;
  
        float aspect = uResolution.x / max(uResolution.y, 1.0);
        vec2 p = (vUv - 0.5) * vec2(aspect, 1.0) * CAUSTIC_ZOOM * uScale;
        vec2 ptr = (uPointer - 0.5) * vec2(aspect, 1.0) * CAUSTIC_ZOOM * uScale;
  
        // Subtle architectural fluted-glass vertical refraction ribs
        float glassRib = sin(vUv.x * 58.0 * aspect) * 0.0035 * RIB_STRENGTH;
        p.x += glassRib;
  
        // Cursor fluid wake displacement
        vec2 toPtr = p - ptr;
        float dPtr = length(toPtr);
        float wake = exp(-dPtr * dPtr * 10.5);
        p -= uVelocity * wake * 0.45;
        p += normalize(toPtr + vec2(1e-4)) * wake * 0.032 * cos(dPtr * 26.0 - uTime * 5.0);
  
        // Click water-droplet concentric ripple wave
        vec2 dropPos = (uDrop.xy - 0.5) * vec2(aspect, 1.0) * CAUSTIC_ZOOM * uScale;
        float dropAge = max(0.0, uTime - uDrop.z);
        float dDrop = length(p - dropPos);
        float ringEnv = exp(-pow(dDrop - dropAge * 0.48, 2.0) * 65.0) * exp(-dropAge * 1.15);
        float dropRipple = sin((dDrop - dropAge * 0.48) * 52.0) * ringEnv;
        p += normalize(p - dropPos + vec2(1e-4)) * dropRipple * 0.036;
  
        float t = uTime * 0.42 + 12.0;
  
        // Chromatic RGB caustic dispersion for sunlit prism sparkle
        vec2 dispDir = normalize(toPtr + vec2(0.35, 0.25)) * CHROMA_SPREAD * (1.0 + wake * 1.4 + ringEnv * 2.0);
        float cR = causticPattern(p + dispDir, t);
        float cG = causticPattern(p, t);
        float cB = causticPattern(p - dispDir, t);
  
        vec3 alabasterBg = vec3(0.933, 0.949, 0.973);
        vec3 glacierBlue = vec3(0.750, 0.855, 0.965);
        vec3 prismCobalt = vec3(0.240, 0.520, 0.950);
        vec3 sunlitGold  = vec3(1.000, 0.880, 0.680);
  
        // Gentle ambient pool depth gradient across the light canvas
        float poolGrad = smoothstep(-0.6, 0.7, vUv.y - vUv.x * 0.25);
        vec3 baseCol = mix(glacierBlue, alabasterBg, 0.58 + 0.34 * poolGrad);
  
        // Combine dispersed caustic channels
        vec3 causticLight = vec3(cR, cG, cB);
        vec3 tintedCaustic =
          sunlitGold * cR * 0.42 +
          vec3(0.55, 0.92, 0.96) * cG * 0.46 +
          prismCobalt * cB * 0.44;
  
        // Soft shadow troughs beneath caustic filaments for realistic optical depth
        float shadowMask = smoothstep(0.0, 0.45, cG);
        vec3 col = baseCol * (0.91 + 0.09 * shadowMask);
        col += tintedCaustic * 0.52 + causticLight * 0.24;
        col += vec3(1.0, 0.99, 0.96) * ringEnv * 0.22;
  
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
    const uDrop = gl.getUniformLocation(prog, 'uDrop');
    const uScale = gl.getUniformLocation(prog, 'uScale');
  
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
    let dropX = 0.5, dropY = 0.5, dropTime = -20.0;
    let scale = 1.0, targetScale = 1.0;
    let nowSec = 0.0;
  
    window.addEventListener('pointermove', (e: any) => {
      const nx = e.clientX / Math.max(window.innerWidth, 1);
      const ny = 1.0 - e.clientY / Math.max(window.innerHeight, 1);
      velX += (nx - targetPtrX) * 0.75;
      velY += (ny - targetPtrY) * 0.75;
      targetPtrX = nx;
      targetPtrY = ny;
    });
  
    window.addEventListener('pointerdown', (e: any) => {
      dropX = e.clientX / Math.max(window.innerWidth, 1);
      dropY = 1.0 - e.clientY / Math.max(window.innerHeight, 1);
      dropTime = nowSec;
    });
  
    window.addEventListener('wheel', (e: any) => {
      targetScale = Math.max(0.65, Math.min(1.65, targetScale + e.deltaY * 0.0005));
    }, { passive: true });
  
    function render(now?: any) {
      const t = now * 0.001;
      nowSec = t;
  
      ptrX += (targetPtrX - ptrX) * 0.09;
      ptrY += (targetPtrY - ptrY) * 0.09;
      velX *= 0.9;
      velY *= 0.9;
      scale += (targetScale - scale) * 0.08;
  
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uPointer, ptrX, ptrY);
      gl.uniform2f(uVelocity, velX, velY);
      gl.uniform3f(uDrop, dropX, dropY, dropTime);
      gl.uniform1f(uScale, scale);
  
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestAnimationFrame(render);
    }
  
    requestAnimationFrame(render);
  })();
}
/* eslint-enable */

export function Background6({ className, style, width = '100%', height = '100%', blendMode = "normal", transparentBackground = false, edgeFeather = 0 }: Background6Props) {
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

    initBackground6Runtime({
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
      className={className ? `fv-backgrounds-background-6 ${className}` : 'fv-backgrounds-background-6'}
      style={{ width, height, ...blendStyle, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="glCanvas"></canvas>
    </div>
  );
}

export default Background6;
