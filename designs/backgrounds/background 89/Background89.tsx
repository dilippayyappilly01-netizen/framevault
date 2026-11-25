'use client';

/**
 * Background 089 — Bio-Emerald Frequency Curtains
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Background89Props {
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
.fv-backgrounds-background-89 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-backgrounds-background-89 *, .fv-backgrounds-background-89 *::before, .fv-backgrounds-background-89 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-backgrounds-background-89 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #030c09;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-backgrounds-background-89 canvas {
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
function initBackground89Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    // Layered acoustic harmonic silk wave ribbons responding to pointer frequency and click bass impulse
    const canvas = document.getElementById('stageCanvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
  
    const BG_HEX = '#030c09';
    const COL_A = '#059669';
    const COL_B = '#2dd4bf';
    const COL_C = '#a3e635';
    const COLORS = [COL_A, COL_B, COL_C];
  
    let width = 0, height = 0, dpr = 1;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener('resize', resize);
    resize();
  
    let ptrX = 0.5, ptrY = 0.5, targetX = 0.5, targetY = 0.5;
    let impulse = 0.0, freqScale = 1.0;
  
    window.addEventListener('pointermove', (e: any) => {
      targetX = e.clientX / Math.max(width, 1);
      targetY = e.clientY / Math.max(height, 1);
    });
    window.addEventListener('pointerdown', () => { impulse = 1.0; });
    window.addEventListener('wheel', (e: any) => {
      freqScale = Math.max(0.55, Math.min(1.85, freqScale - e.deltaY * 0.0005));
    }, { passive: true });
  
    const LAYERS = 14;
  
    function animate(now?: any) {
      const t = now * 0.001 + 6.11;
      ptrX += (targetX - ptrX) * 0.07;
      ptrY += (targetY - ptrY) * 0.07;
      impulse *= 0.93;
  
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = BG_HEX;
      ctx.fillRect(0, 0, width, height);
  
      ctx.globalCompositeOperation = 'lighter';
      const steps = 96;
  
      for (let l = 0; l < LAYERS; l++) {
        const frac = l / (LAYERS - 1);
        const baseY = height * (0.28 + frac * 0.44) + (ptrY - 0.5) * 65 * (0.4 + frac);
        const amp = (28 + Math.sin(frac * Math.PI) * 58 + impulse * 65) * (0.65 + (1 - Math.abs(ptrY - 0.5)) * 0.5);
        const freq = (0.0042 + frac * 0.0038) * freqScale;
        const phase = t * (0.9 + frac * 0.65) + l * 0.45 + ptrX * 3.2;
  
        const grad = ctx.createLinearGradient(0, baseY - amp, width, baseY + amp);
        grad.addColorStop(0, COLORS[l % COLORS.length]);
        grad.addColorStop(0.5, COLORS[(l + 1) % COLORS.length]);
        grad.addColorStop(1, COLORS[(l + 2) % COLORS.length]);
  
        ctx.beginPath();
        for (let s = 0; s <= steps; s++) {
          const u = s / steps;
          const x = u * width;
          const env = Math.sin(u * Math.PI);
          const ptrBump = Math.exp(-Math.pow((u - ptrX) * 4.5, 2)) * (0.55 + impulse * 0.8);
          const y = baseY
            + Math.sin(x * freq + phase) * amp * env
            + Math.cos(x * freq * 1.9 - phase * 1.25) * (amp * 0.36) * env
            + Math.sin(x * freq * 3.2 + phase * 0.7) * (amp * 0.24 * ptrBump);
          if (s === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
  
        ctx.strokeStyle = grad;
        ctx.globalAlpha = 0.48 + Math.sin(frac * Math.PI) * 0.35;
        ctx.lineWidth = 1.4 + Math.sin(frac * Math.PI) * 1.8;
        ctx.stroke();
  
        // Subtle translucent ribbon fill
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.045;
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  })();
}
/* eslint-enable */

export function Background89({ className, style, width = '100%', height = '100%' }: Background89Props) {
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

    initBackground89Runtime({
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
      className={className ? `fv-backgrounds-background-89 ${className}` : 'fv-backgrounds-background-89'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="stageCanvas"></canvas>
    </div>
  );
}

export default Background89;
