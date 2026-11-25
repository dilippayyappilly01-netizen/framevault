'use client';

/**
 * Background 027 — Obsidian Cyan Isometric Hex Wave
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Background27Props {
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
.fv-backgrounds-background-27 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-backgrounds-background-27 *, .fv-backgrounds-background-27 *::before, .fv-backgrounds-background-27 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-backgrounds-background-27 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #050811;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-backgrounds-background-27 canvas {
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
function initBackground27Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    // Isometric 3D-shaded hexagonal wave field lifting beneath the cursor with click ripples
    const canvas = document.getElementById('stageCanvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
  
    const BG_HEX = '#050811';
    const TOP_HEX = '#111827';
    const LEFT_HEX = '#090f1d';
    const RIGHT_HEX = '#1e293b';
    const ACCENT_HEX = '#22d3ee';
  
    function hexRgb(h?: any) {
      const s = h.replace('#', '');
      return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
    }
    const topRgb = hexRgb(TOP_HEX);
    const accRgb = hexRgb(ACCENT_HEX);
  
    let width = 0, height = 0, dpr = 1;
    let hexR = 28;
    let tiles: any = [];
    const ripples: any[] = [];
  
    function build() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  
      const dx = hexR * 1.82;
      const dy = hexR * 1.12;
      const cols = Math.ceil(width / dx) + 3;
      const rows = Math.ceil(height / dy) + 4;
      tiles = [];
      for (let r = -1; r < rows; r++) {
        for (let c = -1; c < cols; c++) {
          tiles.push({
            x: c * dx + (r % 2 !== 0 ? dx * 0.5 : 0),
            y: r * dy,
            h: 0
          });
        }
      }
    }
    window.addEventListener('resize', build);
    build();
  
    let ptrX = -9999, ptrY = -9999, liftScale = 1.0;
  
    window.addEventListener('pointermove', (e: any) => { ptrX = e.clientX; ptrY = e.clientY; });
    window.addEventListener('pointerleave', () => { ptrX = -9999; ptrY = -9999; });
    window.addEventListener('pointerdown', (e: any) => {
      ripples.push({ x: e.clientX, y: e.clientY, r: 0, a: 1.0 });
      if (ripples.length > 4) ripples.shift();
    });
    window.addEventListener('wheel', (e: any) => {
      liftScale = Math.max(0.5, Math.min(1.8, liftScale - e.deltaY * 0.0006));
    }, { passive: true });
  
    function drawHexPillar(cx: any, cy: any, r: any, elev: any, glow?: any) {
      const yTop = cy - elev;
      const rx = r * 0.92;
      const ry = r * 0.56;
      const pts: any[] = [];
      for (let k = 0; k < 6; k++) {
        const a = (Math.PI / 3) * k + Math.PI / 6;
        pts.push([cx + Math.cos(a) * rx, yTop + Math.sin(a) * ry]);
      }
      const depth = Math.max(6, elev + 12);
  
      // Left extruded wall
      ctx.fillStyle = LEFT_HEX;
      ctx.beginPath();
      ctx.moveTo(pts[1][0], pts[1][1]);
      ctx.lineTo(pts[2][0], pts[2][1]);
      ctx.lineTo(pts[2][0], pts[2][1] + depth);
      ctx.lineTo(pts[1][0], pts[1][1] + depth);
      ctx.closePath();
      ctx.fill();
  
      // Right extruded wall
      ctx.fillStyle = RIGHT_HEX;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      ctx.lineTo(pts[1][0], pts[1][1]);
      ctx.lineTo(pts[1][0], pts[1][1] + depth);
      ctx.lineTo(pts[0][0], pts[0][1] + depth);
      ctx.closePath();
      ctx.fill();
  
      // Top face interpolated toward accent glow
      const m = Math.max(0, Math.min(1, glow));
      const tr = Math.round(topRgb[0] + (accRgb[0] - topRgb[0]) * m);
      const tg = Math.round(topRgb[1] + (accRgb[1] - topRgb[1]) * m);
      const tb = Math.round(topRgb[2] + (accRgb[2] - topRgb[2]) * m);
      ctx.fillStyle = `rgb(${tr},${tg},${tb})`;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let k = 1; k < 6; k++) ctx.lineTo(pts[k][0], pts[k][1]);
      ctx.closePath();
      ctx.fill();
    }
  
    function animate(now?: any) {
      const t = now * 0.001 + 4.29;
      const speedMult = 1.0;
  
      ctx.fillStyle = BG_HEX;
      ctx.fillRect(0, 0, width, height);
  
      for (let i = ripples.length - 1; i >= 0; i--) {
        ripples[i].r += 7.5 * speedMult;
        ripples[i].a *= 0.96;
        if (ripples[i].a < 0.02) ripples.splice(i, 1);
      }
  
      for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i];
        let targetH = (Math.sin(tile.x * 0.011 + t * 1.45) * Math.cos(tile.y * 0.013 - t * 1.15) * 0.5 + 0.5) * 22 * liftScale;
        let glow = targetH / 38;
  
        if (ptrX > -9000) {
          const d = Math.hypot(tile.x - ptrX, tile.y - ptrY);
          if (d < 190) {
            const inf = 1 - d / 190;
            const s = inf * inf;
            targetH += s * 36 * liftScale;
            glow += s * 0.9;
          }
        }
  
        for (let r = 0; r < ripples.length; r++) {
          const rd = Math.hypot(tile.x - ripples[r].x, tile.y - ripples[r].y);
          const band = Math.abs(rd - ripples[r].r);
          if (band < 55) {
            const p = (1 - band / 55) * ripples[r].a;
            targetH += p * 34;
            glow += p * 0.85;
          }
        }
  
        tile.h += (targetH - tile.h) * 0.14;
        drawHexPillar(tile.x, tile.y, hexR, tile.h, glow);
      }
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  })();
}
/* eslint-enable */

export function Background27({ className, style, width = '100%', height = '100%' }: Background27Props) {
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

    initBackground27Runtime({
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
      className={className ? `fv-backgrounds-background-27 ${className}` : 'fv-backgrounds-background-27'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="stageCanvas"></canvas>
    </div>
  );
}

export default Background27;
