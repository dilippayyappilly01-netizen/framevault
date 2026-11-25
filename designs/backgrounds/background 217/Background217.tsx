'use client';

/**
 * Background 217 — Low-Poly Origami Shimmer Mesh
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Background217Props {
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
.fv-backgrounds-background-217 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-backgrounds-background-217 *, .fv-backgrounds-background-217 *::before, .fv-backgrounds-background-217 *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .fv-backgrounds-background-217 { width: 100%; height: 100%; overflow: hidden; background: #0a0f1d; user-select: none; -webkit-font-smoothing: antialiased; }
  .fv-backgrounds-background-217 canvas { display: block; width: 100%; height: 100%; cursor: pointer; }
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
function initBackground217Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    const canvas = document.getElementById('stageCanvas');
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let w = 0, h = 0, dpr = 1, cols = 14, rows = 9, pts: any = [], ptrX = 0, ptrY = 0;
    function build() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ptrX = w * 0.5; ptrY = h * 0.5; pts = [];
      for (let r = 0; r <= rows; r++) for (let c = 0; c <= cols; c++) {
        const edge = r === 0 || r === rows || c === 0 || c === cols;
        pts.push({ bx: (c / cols) * w, by: (r / rows) * h, ox: edge ? 0 : (Math.random() - 0.5) * 34, oy: edge ? 0 : (Math.random() - 0.5) * 34, ph: Math.random() * 6.28 });
      }
    }
    window.addEventListener('resize', build); build();
    window.addEventListener('pointermove', (e: any) => { ptrX = e.clientX; ptrY = e.clientY; });
    function drawTri(a: any, b: any, c?: any) {
      const cx = (a[0] + b[0] + c[0]) / 3, cy = (a[1] + b[1] + c[1]) / 3;
      const d = Math.hypot(cx - ptrX, cy - ptrY);
      const lit = Math.exp(-d * d / 90000);
      const l = Math.round(14 + lit * 44 + (cx / w) * 14);
      ctx.fillStyle = `hsl(${Math.round(215 + lit * 35)}, 72%, ${l}%)`;
      ctx.strokeStyle = 'rgba(147, 197, 253, 0.14)'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    function animate(now?: any) {
      const t = now * 0.001;
      const pos = pts.map((p: any) => [p.bx + p.ox + Math.sin(t + p.ph) * 8, p.by + p.oy + Math.cos(t * 0.9 + p.ph) * 8]);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const i = r * (cols + 1) + c;
        drawTri(pos[i], pos[i + 1], pos[i + cols + 1]);
        drawTri(pos[i + 1], pos[i + cols + 2], pos[i + cols + 1]);
      }
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  })();
}
/* eslint-enable */

export function Background217({ className, style, width = '100%', height = '100%' }: Background217Props) {
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

    initBackground217Runtime({
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
      className={className ? `fv-backgrounds-background-217 ${className}` : 'fv-backgrounds-background-217'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="stageCanvas"></canvas>
    </div>
  );
}

export default Background217;
