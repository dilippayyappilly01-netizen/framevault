'use client';

/**
 * Background 213 — Live Dipole Magnetic Field Lines
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Background213Props {
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
.fv-backgrounds-background-213 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-backgrounds-background-213 *, .fv-backgrounds-background-213 *::before, .fv-backgrounds-background-213 *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .fv-backgrounds-background-213 { width: 100%; height: 100%; overflow: hidden; background: #050812; user-select: none; -webkit-font-smoothing: antialiased; }
  .fv-backgrounds-background-213 canvas { display: block; width: 100%; height: 100%; cursor: pointer; }
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
function initBackground213Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    const canvas = document.getElementById('stageCanvas');
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let w = 0, h = 0, dpr = 1, ptrX = 0, ptrY = 0, tX = 0, tY = 0;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ptrX = tX = w * 0.68; ptrY = tY = h * 0.5;
    }
    window.addEventListener('resize', resize); resize();
    window.addEventListener('pointermove', (e: any) => { tX = e.clientX; tY = e.clientY; });
    function animate(now?: any) {
      const t = now * 0.001; ptrX += (tX - ptrX) * 0.09; ptrY += (tY - ptrY) * 0.09;
      ctx.fillStyle = '#050812'; ctx.fillRect(0, 0, w, h);
      const p1x = w * 0.32, p1y = h * 0.5 + Math.sin(t) * 40;
      const p2x = ptrX, p2y = ptrY;
      for (let k = 0; k < 28; k++) {
        const a0 = (k / 28) * Math.PI * 2;
        let x = p1x + Math.cos(a0) * 14, y = p1y + Math.sin(a0) * 14;
        ctx.strokeStyle = `hsla(${Math.round(195 + (k / 28) * 65)}, 90%, 64%, 0.45)`;
        ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(x, y);
        for (let s = 0; s < 90; s++) {
          const dx1 = x - p1x, dy1 = y - p1y, r1 = Math.pow(dx1 * dx1 + dy1 * dy1 + 40, 1.5);
          const dx2 = x - p2x, dy2 = y - p2y, r2 = Math.pow(dx2 * dx2 + dy2 * dy2 + 40, 1.5);
          const fx = dx1 / r1 - dx2 / r2, fy = dy1 / r1 - dy2 / r2;
          const m = Math.hypot(fx, fy) || 1;
          x += (fx / m) * 12; y += (fy / m) * 12;
          ctx.lineTo(x, y);
          if (Math.hypot(x - p2x, y - p2y) < 16) break;
        }
        ctx.stroke();
      }
      ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(p1x, p1y, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f43f5e'; ctx.beginPath(); ctx.arc(p2x, p2y, 7, 0, Math.PI * 2); ctx.fill();
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  })();
}
/* eslint-enable */

export function Background213({ className, style, width = '100%', height = '100%' }: Background213Props) {
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

    initBackground213Runtime({
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
      className={className ? `fv-backgrounds-background-213 ${className}` : 'fv-backgrounds-background-213'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="stageCanvas"></canvas>
    </div>
  );
}

export default Background213;
