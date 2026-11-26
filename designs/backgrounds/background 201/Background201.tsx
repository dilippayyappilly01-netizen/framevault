'use client';

/**
 * Background 201 — Flocking Boids Murmuration
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Background201Props {
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
.fv-backgrounds-background-201 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-backgrounds-background-201 *, .fv-backgrounds-background-201 *::before, .fv-backgrounds-background-201 *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .fv-backgrounds-background-201 { width: 100%; height: 100%; overflow: hidden; background: #060a14; user-select: none; -webkit-font-smoothing: antialiased; }
  .fv-backgrounds-background-201 canvas { display: block; width: 100%; height: 100%; cursor: pointer; }
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
function initBackground201Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    const canvas = document.getElementById('stageCanvas');
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let w = 0, h = 0, dpr = 1, ptrX = -999, ptrY = -999;
    const boids: any[] = [];
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!boids.length) for (let i = 0; i < 120; i++) {
        const a = Math.random() * 6.283;
        boids.push({ x: Math.random() * w, y: Math.random() * h, vx: Math.cos(a) * 2.5, vy: Math.sin(a) * 2.5 });
      }
    }
    window.addEventListener('resize', resize); resize();
    window.addEventListener('pointermove', (e: any) => { ptrX = e.clientX; ptrY = e.clientY; });
    window.addEventListener('pointerleave', () => { ptrX = -999; ptrY = -999; });
    function animate() {
      ctx.fillStyle = 'rgba(6, 10, 20, 0.18)'; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < boids.length; i++) {
        const b = boids[i];
        let ax = 0, ay = 0, cx = 0, cy = 0, sx = 0, sy = 0, n = 0;
        for (let j = 0; j < boids.length; j++) {
          if (i === j) continue;
          const o = boids[j], dx = o.x - b.x, dy = o.y - b.y, d = Math.hypot(dx, dy);
          if (d < 68 && d > 0.1) {
            ax += o.vx; ay += o.vy; cx += o.x; cy += o.y; n++;
            if (d < 24) { sx -= dx / d; sy -= dy / d; }
          }
        }
        if (n > 0) {
          b.vx += (ax / n - b.vx) * 0.04 + (cx / n - b.x) * 0.0018 + sx * 0.14;
          b.vy += (ay / n - b.vy) * 0.04 + (cy / n - b.y) * 0.0018 + sy * 0.14;
        }
        if (ptrX > -900) {
          const dx = ptrX - b.x, dy = ptrY - b.y, d = Math.hypot(dx, dy) || 1;
          if (d < 240) { b.vx += (dx / d) * 0.18; b.vy += (dy / d) * 0.18; }
        }
        const sp = Math.hypot(b.vx, b.vy) || 1;
        const clamped = Math.max(1.8, Math.min(4.2, sp));
        b.vx = (b.vx / sp) * clamped; b.vy = (b.vy / sp) * clamped;
        b.x = (b.x + b.vx + w) % w; b.y = (b.y + b.vy + h) % h;
        const ang = Math.atan2(b.vy, b.vx);
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(ang);
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(-5, 3.5); ctx.lineTo(-3, 0); ctx.lineTo(-5, -3.5); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  })();
}
/* eslint-enable */

export function Background201({ className, style, width = '100%', height = '100%' }: Background201Props) {
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

    initBackground201Runtime({
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
      className={className ? `fv-backgrounds-background-201 ${className}` : 'fv-backgrounds-background-201'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="stageCanvas"></canvas>
    </div>
  );
}

export default Background201;
