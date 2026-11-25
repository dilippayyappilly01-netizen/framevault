'use client';

/**
 * Background 157 — Blueprint Drafting Crosshair Grid
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Background157Props {
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
.fv-backgrounds-background-157 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-backgrounds-background-157 *, .fv-backgrounds-background-157 *::before, .fv-backgrounds-background-157 *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .fv-backgrounds-background-157 { width: 100%; height: 100%; overflow: hidden; background: #0b1930; user-select: none; -webkit-font-smoothing: antialiased; }
  .fv-backgrounds-background-157 canvas { display: block; width: 100%; height: 100%; cursor: crosshair; }
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
function initBackground157Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    const canvas = document.getElementById('stageCanvas');
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let w = 0, h = 0, dpr = 1, ptrX = 0, ptrY = 0, tPtrX = 0, tPtrY = 0, grid = 48;
    const pins: any[] = [];
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      tPtrX = ptrX = w * 0.5; tPtrY = ptrY = h * 0.5;
    }
    window.addEventListener('resize', resize); resize();
    window.addEventListener('pointermove', (e: any) => { tPtrX = e.clientX; tPtrY = e.clientY; });
    window.addEventListener('pointerdown', (e: any) => {
      pins.push({ x: Math.round(e.clientX / grid) * grid, y: Math.round(e.clientY / grid) * grid, a: 1 });
      if (pins.length > 8) pins.shift();
    });
    window.addEventListener('wheel', (e: any) => { grid = Math.max(28, Math.min(84, grid + (e.deltaY > 0 ? 4 : -4))); }, { passive: true });
    function animate(now?: any) {
      const t = now * 0.001;
      ptrX += (tPtrX - ptrX) * 0.16; ptrY += (tPtrY - ptrY) * 0.16;
      ctx.fillStyle = '#0b1930'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(147, 197, 253, 0.11)'; ctx.lineWidth = 1;
      for (let x = 0; x < w; x += grid) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += grid) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      const sx = Math.round(ptrX / grid) * grid, sy = Math.round(ptrY / grid) * grid;
      ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(96, 165, 250, 0.55)';
      ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, h); ctx.moveTo(0, sy); ctx.lineTo(w, sy); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(sx, sy, 14 + Math.sin(t * 3) * 3, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#bfdbfe'; ctx.font = '11px monospace';
      ctx.fillText(`X:${sx} Y:${sy}`, sx + 18, sy - 10);
      for (let i = 0; i < pins.length; i++) {
        const p = pins[i];
        ctx.strokeStyle = 'rgba(191, 219, 254, 0.65)';
        ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.stroke();
        if (i > 0) {
          ctx.strokeStyle = 'rgba(96, 165, 250, 0.35)';
          ctx.beginPath(); ctx.moveTo(pins[i - 1].x, pins[i - 1].y); ctx.lineTo(p.x, p.y); ctx.stroke();
        }
      }
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  })();
}
/* eslint-enable */

export function Background157({ className, style, width = '100%', height = '100%' }: Background157Props) {
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

    initBackground157Runtime({
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
      className={className ? `fv-backgrounds-background-157 ${className}` : 'fv-backgrounds-background-157'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="stageCanvas"></canvas>
    </div>
  );
}

export default Background157;
