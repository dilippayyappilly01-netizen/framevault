'use client';

/**
 * Background 168 — Minimalist Tumbling Paper Confetti
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Background168Props {
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
.fv-backgrounds-background-168 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-backgrounds-background-168 *, .fv-backgrounds-background-168 *::before, .fv-backgrounds-background-168 *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .fv-backgrounds-background-168 { width: 100%; height: 100%; overflow: hidden; background: #f8fafc; user-select: none; -webkit-font-smoothing: antialiased; }
  .fv-backgrounds-background-168 canvas { display: block; width: 100%; height: 100%; cursor: pointer; }
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
function initBackground168Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    const canvas = document.getElementById('stageCanvas');
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const COLS = ['#2563eb', '#ec4899', '#f59e0b', '#10b981', '#7c3aed', '#0ea5e9'];
    let w = 0, h = 0, dpr = 1, ptrX = -999, ptrY = -999;
    const pieces: any[] = [];
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!pieces.length) for (let i = 0; i < 110; i++) pieces.push({
        x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.8, vy: 0.7 + Math.random() * 1.4,
        rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.06, flip: Math.random() * 6.28,
        w: 7 + Math.random() * 7, h: 4 + Math.random() * 5, col: COLS[i % COLS.length]
      });
    }
    window.addEventListener('resize', resize); resize();
    window.addEventListener('pointermove', (e: any) => { ptrX = e.clientX; ptrY = e.clientY; });
    window.addEventListener('pointerdown', (e: any) => {
      for (let i = 0; i < pieces.length; i++) {
        const p = pieces[i], dx = p.x - e.clientX, dy = p.y - e.clientY, d = Math.hypot(dx, dy) || 1;
        if (d < 220) { p.vx += (dx / d) * 6; p.vy += (dy / d) * 6 - 2; }
      }
    });
    function animate() {
      ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < pieces.length; i++) {
        const p = pieces[i];
        const dx = p.x - ptrX, dy = p.y - ptrY, d = Math.hypot(dx, dy);
        if (d < 130 && d > 1) { p.vx += (dx / d) * 0.35; p.vy += (dy / d) * 0.25; }
        p.vx *= 0.985; p.vy = Math.min(2.4, p.vy + 0.02);
        p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.flip += 0.06;
        if (p.y > h + 20) { p.y = -20; p.x = Math.random() * w; }
        if (p.x > w + 20) p.x = -20; else if (p.x < -20) p.x = w + 20;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, Math.cos(p.flip));
        ctx.fillStyle = p.col; ctx.fillRect(-p.w * 0.5, -p.h * 0.5, p.w, p.h);
        ctx.restore();
      }
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  })();
}
/* eslint-enable */

export function Background168({ className, style, width = '100%', height = '100%' }: Background168Props) {
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

    initBackground168Runtime({
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
      className={className ? `fv-backgrounds-background-168 ${className}` : 'fv-backgrounds-background-168'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="stageCanvas"></canvas>
    </div>
  );
}

export default Background168;
