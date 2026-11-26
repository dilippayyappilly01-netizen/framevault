'use client';

/**
 * Background 130 — Silver Quantum Node Network
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Background130Props {
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
.fv-backgrounds-background-130 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-backgrounds-background-130 *, .fv-backgrounds-background-130 *::before, .fv-backgrounds-background-130 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-backgrounds-background-130 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #06070a;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-backgrounds-background-130 canvas {
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
function initBackground130Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    // Multi-depth interactive neural constellation background with pointer gravity tether
    const canvas = document.getElementById('stageCanvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
  
    const BG_HEX = '#06070a';
    const COL_A = '#e4e4e7';
    const COL_B = '#94a3b8';
    const COL_C = '#38bdf8';
  
    function toRgb(h?: any) {
      const s = h.replace('#', '');
      return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
    }
    const palette = [toRgb(COL_A), toRgb(COL_B), toRgb(COL_C)];
  
    let width = 0, height = 0, dpr = 1;
    let nodes: any = [];
    const pulses: any[] = [];
  
    function init() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  
      const count = Math.max(60, Math.min(135, Math.round((width * height) / 11500)));
      nodes = new Array(count);
      for (let i = 0; i < count; i++) {
        const depth = 0.35 + Math.random() * 0.65;
        const a = Math.random() * Math.PI * 2;
        const sp = (0.22 + Math.random() * 0.45) * depth;
        nodes[i] = {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          depth,
          r: 1.3 + depth * 2.0,
          ci: i % palette.length,
          ph: Math.random() * Math.PI * 2
        };
      }
    }
    window.addEventListener('resize', init);
    init();
  
    let ptrX = -9999, ptrY = -9999, linkScale = 1.0;
    window.addEventListener('pointermove', (e: any) => { ptrX = e.clientX; ptrY = e.clientY; });
    window.addEventListener('pointerleave', () => { ptrX = -9999; ptrY = -9999; });
    window.addEventListener('pointerdown', (e: any) => {
      pulses.push({ x: e.clientX, y: e.clientY, r: 0, a: 0.9 });
      if (pulses.length > 5) pulses.shift();
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const dx = n.x - e.clientX, dy = n.y - e.clientY;
        const d = Math.hypot(dx, dy) || 1;
        if (d < 230) {
          const f = (1 - d / 230) * 3.5 * n.depth;
          n.vx += (dx / d) * f;
          n.vy += (dy / d) * f;
        }
      }
    });
    window.addEventListener('wheel', (e: any) => {
      linkScale = Math.max(0.65, Math.min(1.65, linkScale - e.deltaY * 0.0005));
    }, { passive: true });
  
    function drawArc(x1: any, y1: any, x2: any, y2: any, rgb: any, alpha?: any) {
      ctx.strokeStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  
    function animate(now?: any) {
      const t = now * 0.001 + 13.34;
      const speedMult = 1.0;
  
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = BG_HEX;
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';
  
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (ptrX > -9000) {
          const dx = ptrX - n.x, dy = ptrY - n.y;
          const d = Math.hypot(dx, dy) || 1;
          if (d < 200 && d > 24) {
            const pull = (1 - d / 200) * 0.025 * n.depth;
            n.vx += (dx / d) * pull + (-dy / d) * pull * 0.4;
            n.vy += (dy / d) * pull + (dx / d) * pull * 0.4;
          }
        }
        if (Math.hypot(n.vx, n.vy) > 0.6 * n.depth) { n.vx *= 0.98; n.vy *= 0.98; }
        n.x += n.vx * speedMult;
        n.y += n.vy * speedMult;
        if (n.x < -30) n.x = width + 30; else if (n.x > width + 30) n.x = -30;
        if (n.y < -30) n.y = height + 30; else if (n.y > height + 30) n.y = -30;
      }
  
      const linkD = 148 * linkScale;
      const linkD2 = linkD * linkD;
      ctx.lineWidth = 1.1;
  
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        const col = palette[a.ci];
        if (ptrX > -9000) {
          const cd = Math.hypot(ptrX - a.x, ptrY - a.y);
          if (cd < linkD * 1.2) drawArc(a.x, a.y, ptrX, ptrY, col, (1 - cd / (linkD * 1.2)) * 0.55);
        }
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const d2 = (b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y);
          if (d2 > linkD2) continue;
          const prox = 1 - Math.sqrt(d2) / linkD;
          drawArc(a.x, a.y, b.x, b.y, col, prox * prox * 0.38);
        }
      }
  
      for (let p = pulses.length - 1; p >= 0; p--) {
        pulses[p].r += 6.5 * speedMult;
        pulses[p].a *= 0.955;
        if (pulses[p].a < 0.02) { pulses.splice(p, 1); continue; }
        ctx.strokeStyle = `rgba(${palette[0][0]},${palette[0][1]},${palette[0][2]},${pulses[p].a.toFixed(3)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(pulses[p].x, pulses[p].y, pulses[p].r, 0, Math.PI * 2);
        ctx.stroke();
      }
  
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const col = palette[n.ci];
        const p = 0.72 + 0.28 * Math.sin(t * 2.5 + n.ph);
        ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${(0.24 * p).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r * 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${(0.9 * p).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
      }
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  })();
}
/* eslint-enable */

export function Background130({ className, style, width = '100%', height = '100%' }: Background130Props) {
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

    initBackground130Runtime({
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
      className={className ? `fv-backgrounds-background-130 ${className}` : 'fv-backgrounds-background-130'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="stageCanvas"></canvas>
    </div>
  );
}

export default Background130;
