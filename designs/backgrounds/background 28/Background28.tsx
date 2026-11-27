'use client';

/**
 * Background 028 — Magnetic Compass Needle Field
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Background28Props {
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
.fv-backgrounds-background-28 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-backgrounds-background-28 *, .fv-backgrounds-background-28 *::before, .fv-backgrounds-background-28 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-backgrounds-background-28 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #060810;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-backgrounds-background-28 canvas {
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
function initBackground28Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    // Elastic magnetic needle vector field aligning smoothly to pointer velocity with click shockwaves
    const canvas = document.getElementById('stageCanvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
  
    const BG_HEX = '#060810';
    const BASE_HEX = '#334155';
    const ACCENT_A = '#38bdf8';
    const ACCENT_B = '#818cf8';
  
    function parseHex(h?: any) {
      const c = h.replace('#', '');
      return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
    }
    const baseRgb = parseHex(BASE_HEX);
    const rgbA = parseHex(ACCENT_A);
    const rgbB = parseHex(ACCENT_B);
  
    let width = 0, height = 0, dpr = 1;
    let nodes: any = [];
    const shocks: any[] = [];
  
    function build() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  
      const sp = Math.max(24, Math.min(38, Math.round(Math.min(width, height) / 20)));
      const cols = Math.ceil(width / sp) + 2;
      const rows = Math.ceil(height / sp) + 2;
      const ox = (width - (cols - 1) * sp) * 0.5;
      const oy = (height - (rows - 1) * sp) * 0.5;
      nodes = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          nodes.push({ hx: ox + c * sp, hy: oy + r * sp, x: ox + c * sp, y: oy + r * sp, vx: 0, vy: 0, ang: 0, e: 0 });
        }
      }
    }
    window.addEventListener('resize', build);
    build();
  
    let ptrX = -9999, ptrY = -9999, isHold = false, radiusScale = 1.0;
    window.addEventListener('pointermove', (e: any) => { ptrX = e.clientX; ptrY = e.clientY; });
    window.addEventListener('pointerleave', () => { ptrX = -9999; ptrY = -9999; isHold = false; });
    window.addEventListener('pointerdown', (e: any) => {
      isHold = true;
      shocks.push({ x: e.clientX, y: e.clientY, r: 0, a: 1.0 });
      if (shocks.length > 5) shocks.shift();
    });
    window.addEventListener('pointerup', () => { isHold = false; });
    window.addEventListener('wheel', (e: any) => {
      radiusScale = Math.max(0.55, Math.min(1.8, radiusScale - e.deltaY * 0.0005));
    }, { passive: true });
  
    function animate(now?: any) {
      const t = now * 0.001 + 5.90;
      const speedMult = 1.0;
  
      ctx.fillStyle = BG_HEX;
      ctx.fillRect(0, 0, width, height);
  
      for (let s = shocks.length - 1; s >= 0; s--) {
        shocks[s].r += 8.0 * speedMult;
        shocks[s].a *= 0.962;
        if (shocks[s].a < 0.02) shocks.splice(s, 1);
      }
  
      const R = 190 * radiusScale;
      ctx.lineCap = 'round';
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const wx = Math.sin(n.hy * 0.012 + t * 1.4) * 4.0;
        const wy = Math.cos(n.hx * 0.012 - t * 1.2) * 4.0;
        let fx = (n.hx + wx - n.x) * 0.09;
        let fy = (n.hy + wy - n.y) * 0.09;
        let targetAng = Math.sin(n.hx * 0.008 + n.hy * 0.008 + t) * 1.2;
        let localE = 0;
  
        if (ptrX > -9000) {
          const dx = ptrX - n.x;
          const dy = ptrY - n.y;
          const d = Math.hypot(dx, dy) || 1;
          if (d < R) {
            const inf = 1 - d / R;
            const sm = inf * inf;
            const sign = isHold ? 0.85 : -1.0;
            fx += (dx / d) * sm * 3.8 * sign;
            fy += (dy / d) * sm * 3.8 * sign;
            targetAng = Math.atan2(dy, dx);
            localE = Math.max(localE, sm);
          }
        }
  
        for (let s = 0; s < shocks.length; s++) {
          const sd = Math.hypot(n.x - shocks[s].x, n.y - shocks[s].y) || 1;
          const band = Math.abs(sd - shocks[s].r);
          if (band < 48) {
            const p = (1 - band / 48) * shocks[s].a;
            fx += ((n.x - shocks[s].x) / sd) * p * 5.0;
            fy += ((n.y - shocks[s].y) / sd) * p * 5.0;
            localE = Math.max(localE, p);
          }
        }
  
        n.vx = (n.vx + fx) * 0.84;
        n.vy = (n.vy + fy) * 0.84;
        n.x += n.vx;
        n.y += n.vy;
        n.ang += (targetAng - n.ang) * 0.16;
        n.e += (localE - n.e) * 0.18;
  
        const mix = Math.min(1, n.e * 1.3);
        const tCol = 0.5 + 0.5 * Math.sin(n.hx * 0.01 + t * 1.5);
        const ar = rgbA[0] + (rgbB[0] - rgbA[0]) * tCol;
        const ag = rgbA[1] + (rgbB[1] - rgbA[1]) * tCol;
        const ab = rgbA[2] + (rgbB[2] - rgbA[2]) * tCol;
        const cr = Math.round(baseRgb[0] + (ar - baseRgb[0]) * mix);
        const cg = Math.round(baseRgb[1] + (ag - baseRgb[1]) * mix);
        const cb = Math.round(baseRgb[2] + (ab - baseRgb[2]) * mix);
        const alpha = 0.45 + n.e * 0.55;
  
        
        const len = 5.5 + n.e * 9.5;
        const ca = Math.cos(n.ang) * len;
        const sa = Math.sin(n.ang) * len;
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},${alpha.toFixed(3)})`;
        ctx.lineWidth = 1.4 + n.e * 1.6;
        ctx.beginPath();
        ctx.moveTo(n.x - ca * 0.5, n.y - sa * 0.5);
        ctx.lineTo(n.x + ca * 0.5, n.y + sa * 0.5);
        ctx.stroke();
      }
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  })();
}
/* eslint-enable */

export function Background28({ className, style, width = '100%', height = '100%', blendMode = "normal", transparentBackground = false, edgeFeather = 0 }: Background28Props) {
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

    initBackground28Runtime({
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
      className={className ? `fv-backgrounds-background-28 ${className}` : 'fv-backgrounds-background-28'}
      style={{ width, height, ...blendStyle, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="stageCanvas"></canvas>
    </div>
  );
}

export default Background28;
