'use client';

/**
 * Background 088 — Gallery Paper Kinetic Crosses
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Background88Props {
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
.fv-backgrounds-background-88 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-backgrounds-background-88 *, .fv-backgrounds-background-88 *::before, .fv-backgrounds-background-88 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-backgrounds-background-88 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #faf9f6;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-backgrounds-background-88 canvas {
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
function initBackground88Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    // Elastic magnetic cross vector field aligning smoothly to pointer velocity with click shockwaves
    const canvas = document.getElementById('stageCanvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
  
    const BG_HEX = '#faf9f6';
    const BASE_HEX = '#cbd5e1';
    const ACCENT_A = '#ea580c';
    const ACCENT_B = '#dc2626';
  
    function parseHex(h?: any) {
      const c = h.replace('#', '');
      return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
    }
    const baseRgb = parseHex(BASE_HEX);
    const rgbA = parseHex(ACCENT_A);
    const rgbB = parseHex(ACCENT_B);
  
    let width = 0, height = 0, dpr = 1;
    let nodes: any[] = [];
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
      const t = now * 0.001 + 4.49;
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
  
        
        const sz = 3.5 + n.e * 6.5;
        ctx.save();
        ctx.translate(n.x, n.y);
        ctx.rotate(n.ang);
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},${alpha.toFixed(3)})`;
        ctx.lineWidth = 1.3 + n.e * 1.3;
        ctx.beginPath();
        ctx.moveTo(-sz, 0); ctx.lineTo(sz, 0);
        ctx.moveTo(0, -sz); ctx.lineTo(0, sz);
        ctx.stroke();
        ctx.restore();
      }
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  })();
}
/* eslint-enable */

export function Background88({ className, style, width = '100%', height = '100%' }: Background88Props) {
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

    initBackground88Runtime({
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
      className={className ? `fv-backgrounds-background-88 ${className}` : 'fv-backgrounds-background-88'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="stageCanvas"></canvas>
    </div>
  );
}

export default Background88;
