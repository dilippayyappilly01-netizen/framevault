'use client';

/**
 * Background 156 — Radial Radar Sonar Sweep
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Background156Props {
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
.fv-backgrounds-background-156 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-backgrounds-background-156 *, .fv-backgrounds-background-156 *::before, .fv-backgrounds-background-156 *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .fv-backgrounds-background-156 { width: 100%; height: 100%; overflow: hidden; background: #030b0a; user-select: none; -webkit-font-smoothing: antialiased; }
  .fv-backgrounds-background-156 canvas { display: block; width: 100%; height: 100%; cursor: crosshair; }
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
function initBackground156Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    const canvas = document.getElementById('stageCanvas');
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let w = 0, h = 0, dpr = 1, cx = 0, cy = 0, tcx = 0, tcy = 0;
    const blips: any[] = [];
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = tcx = w * 0.5; cy = tcy = h * 0.5;
      if (!blips.length) for (let i = 0; i < 24; i++) blips.push({ a: Math.random() * 6.283, r: 0.12 + Math.random() * 0.42, glow: 0 });
    }
    window.addEventListener('resize', resize); resize();
    window.addEventListener('pointermove', (e: any) => { tcx = w * 0.5 + (e.clientX - w * 0.5) * 0.25; tcy = h * 0.5 + (e.clientY - h * 0.5) * 0.25; });
    window.addEventListener('pointerdown', (e: any) => {
      const a = Math.atan2(e.clientY - cy, e.clientX - cx);
      const r = Math.hypot(e.clientX - cx, e.clientY - cy) / Math.min(w, h);
      blips.push({ a, r: Math.min(0.48, r), glow: 1.0 });
      if (blips.length > 36) blips.shift();
    });
    function animate(now?: any) {
      const t = now * 0.001;
      cx += (tcx - cx) * 0.06; cy += (tcy - cy) * 0.06;
      ctx.fillStyle = '#030b0a'; ctx.fillRect(0, 0, w, h);
      const maxR = Math.min(w, h) * 0.46;
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.18)'; ctx.lineWidth = 1;
      for (let i = 1; i <= 5; i++) { ctx.beginPath(); ctx.arc(cx, cy, (maxR / 5) * i, 0, Math.PI * 2); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(cx - maxR, cy); ctx.lineTo(cx + maxR, cy); ctx.moveTo(cx, cy - maxR); ctx.lineTo(cx, cy + maxR); ctx.stroke();
      const sweep = (t * 1.15) % (Math.PI * 2);
      for (let s = 0; s < 26; s++) {
        const a0 = sweep - s * 0.035;
        ctx.strokeStyle = `rgba(52, 211, 153, ${((1 - s / 26) * 0.32).toFixed(3)})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a0) * maxR, cy + Math.sin(a0) * maxR); ctx.stroke();
      }
      for (let i = 0; i < blips.length; i++) {
        const b = blips[i];
        let diff = ((sweep - b.a) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        if (diff < 0.12) b.glow = 1.0;
        b.glow *= 0.985;
        if (b.glow < 0.03) continue;
        const bx = cx + Math.cos(b.a) * b.r * Math.min(w, h);
        const by = cy + Math.sin(b.a) * b.r * Math.min(w, h);
        ctx.fillStyle = `rgba(110, 231, 183, ${b.glow.toFixed(3)})`;
        ctx.beginPath(); ctx.arc(bx, by, 2.5 + b.glow * 3.5, 0, Math.PI * 2); ctx.fill();
      }
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  })();
}
/* eslint-enable */

export function Background156({ className, style, width = '100%', height = '100%', blendMode = "normal", transparentBackground = false, edgeFeather = 0 }: Background156Props) {
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

    initBackground156Runtime({
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
      className={className ? `fv-backgrounds-background-156 ${className}` : 'fv-backgrounds-background-156'}
      style={{ width, height, ...blendStyle, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="stageCanvas"></canvas>
    </div>
  );
}

export default Background156;
