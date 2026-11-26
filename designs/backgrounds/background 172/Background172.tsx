'use client';

/**
 * Background 172 — Orthogonal PCB Circuit Signal Traces
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Background172Props {
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
.fv-backgrounds-background-172 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-backgrounds-background-172 *, .fv-backgrounds-background-172 *::before, .fv-backgrounds-background-172 *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .fv-backgrounds-background-172 { width: 100%; height: 100%; overflow: hidden; background: #04090c; user-select: none; -webkit-font-smoothing: antialiased; }
  .fv-backgrounds-background-172 canvas { display: block; width: 100%; height: 100%; cursor: pointer; }
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
function initBackground172Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    const canvas = document.getElementById('stageCanvas');
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let w = 0, h = 0, dpr = 1, traces: any = [], signals: any = [];
    function build() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      traces = [];
      for (let i = 0; i < 42; i++) {
        const pts: any[] = []; let x = Math.round(Math.random() * w / 32) * 32, y = Math.round(Math.random() * h / 32) * 32;
        pts.push([x, y]);
        for (let s = 0; s < 5; s++) {
          const dir = Math.floor(Math.random() * 4);
          const len = (2 + Math.floor(Math.random() * 5)) * 32;
          if (dir === 0) x += len; else if (dir === 1) x -= len; else if (dir === 2) y += len; else y -= len;
          pts.push([x, y]);
        }
        traces.push(pts);
      }
      signals = traces.map((_: any, i: any) => ({ ti: i, prog: Math.random(), sp: 0.004 + Math.random() * 0.008 }));
    }
    window.addEventListener('resize', build); build();
    window.addEventListener('pointerdown', () => { for (let i = 0; i < signals.length; i++) signals[i].sp = 0.022; });
    function animate() {
      ctx.fillStyle = '#04090c'; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < traces.length; i++) {
        const pts = traces[i];
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.22)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
        for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k][0], pts[k][1]);
        ctx.stroke();
        ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.beginPath(); ctx.arc(pts[0][0], pts[0][1], 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(pts[pts.length - 1][0], pts[pts.length - 1][1], 3, 0, Math.PI * 2); ctx.fill();
      }
      for (let i = 0; i < signals.length; i++) {
        const sig = signals[i], pts = traces[sig.ti];
        sig.prog = (sig.prog + sig.sp) % 1; sig.sp += (0.007 - sig.sp) * 0.03;
        const segF = sig.prog * (pts.length - 1), idx = Math.floor(segF), f = segF - idx;
        const a = pts[idx], b = pts[Math.min(pts.length - 1, idx + 1)];
        const sx = a[0] + (b[0] - a[0]) * f, sy = a[1] + (b[1] - a[1]) * f;
        ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(sx, sy, 3.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(253, 224, 71, 0.25)'; ctx.beginPath(); ctx.arc(sx, sy, 9, 0, Math.PI * 2); ctx.fill();
      }
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  })();
}
/* eslint-enable */

export function Background172({ className, style, width = '100%', height = '100%' }: Background172Props) {
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

    initBackground172Runtime({
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
      className={className ? `fv-backgrounds-background-172 ${className}` : 'fv-backgrounds-background-172'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="stageCanvas"></canvas>
    </div>
  );
}

export default Background172;
