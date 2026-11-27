'use client';

/**
 * Background 026 — Neon Cyan Calligraphic Flow
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Background26Props {
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
.fv-backgrounds-background-26 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-backgrounds-background-26 *, .fv-backgrounds-background-26 *::before, .fv-backgrounds-background-26 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-backgrounds-background-26 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #040710;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-backgrounds-background-26 canvas {
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
function initBackground26Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    // Calligraphic curl-noise flow field ribbons with pointer vortex deflection and click burst
    const canvas = document.getElementById('stageCanvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
  
    const BG_HEX = '#040710';
    const COL_A = '#06b6d4';
    const COL_B = '#3b82f6';
    const COL_C = '#818cf8';
    const PALETTE = [COL_A, COL_B, COL_C];
  
    let width = 0, height = 0, dpr = 1;
    const COUNT = 1100;
    const particles = new Array(COUNT);
  
    function spawn(p?: any) {
      p.x = Math.random() * width;
      p.y = Math.random() * height;
      p.life = 40 + Math.random() * 140;
      p.maxLife = p.life;
      p.speed = 1.1 + Math.random() * 1.4;
      p.color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      p.width = 0.8 + Math.random() * 1.4;
    }
  
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = BG_HEX;
      ctx.fillRect(0, 0, width, height);
      for (let i = 0; i < COUNT; i++) {
        if (!particles[i]) particles[i] = {};
        spawn(particles[i]);
      }
    }
    window.addEventListener('resize', resize);
    resize();
  
    let ptrX = -9999, ptrY = -9999, isHolding = false, fieldScale = 0.0042;
    const bursts: any[] = [];
  
    window.addEventListener('pointermove', (e: any) => { ptrX = e.clientX; ptrY = e.clientY; });
    window.addEventListener('pointerleave', () => { ptrX = -9999; ptrY = -9999; isHolding = false; });
    window.addEventListener('pointerdown', (e: any) => {
      isHolding = true;
      bursts.push({ x: e.clientX, y: e.clientY, r: 0, a: 1.0 });
      if (bursts.length > 4) bursts.shift();
    });
    window.addEventListener('pointerup', () => { isHolding = false; });
    window.addEventListener('wheel', (e: any) => {
      fieldScale = Math.max(0.002, Math.min(0.009, fieldScale + e.deltaY * 0.000003));
    }, { passive: true });
  
    function animate(now?: any) {
      const t = now * 0.00045 + 2.67;
      const speedMult = 1.0;
  
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.065;
      ctx.fillStyle = BG_HEX;
      ctx.fillRect(0, 0, width, height);
  
      for (let b = bursts.length - 1; b >= 0; b--) {
        bursts[b].r += 8.5 * speedMult;
        bursts[b].a *= 0.94;
        if (bursts[b].a < 0.02) bursts.splice(b, 1);
      }
  
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < COUNT; i++) {
        const p = particles[i];
        const ox = p.x;
        const oy = p.y;
  
        let ang = Math.sin(p.x * fieldScale + t) * Math.cos(p.y * fieldScale - t * 0.85) * Math.PI * 2.4
                + Math.cos((p.x + p.y) * fieldScale * 0.65 + t * 1.1) * 1.4;
  
        if (ptrX > -9000) {
          const dx = p.x - ptrX;
          const dy = p.y - ptrY;
          const d = Math.hypot(dx, dy) || 1;
          if (d < 210) {
            const inf = 1 - d / 210;
            const tang = Math.atan2(dy, dx) + (isHolding ? 0.55 : 1.35);
            ang = ang * (1 - inf * 0.72) + tang * (inf * 0.72);
          }
        }
  
        let boost = 1.0;
        for (let b = 0; b < bursts.length; b++) {
          const bd = Math.hypot(p.x - bursts[b].x, p.y - bursts[b].y);
          if (Math.abs(bd - bursts[b].r) < 50) {
            ang = Math.atan2(p.y - bursts[b].y, p.x - bursts[b].x);
            boost = 2.6;
          }
        }
  
        p.x += Math.cos(ang) * p.speed * boost * speedMult;
        p.y += Math.sin(ang) * p.speed * boost * speedMult;
        p.life -= 1;
  
        const fade = Math.sin((p.life / p.maxLife) * Math.PI);
        ctx.globalAlpha = Math.max(0.05, fade * 0.78);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.width;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
  
        if (p.life <= 0 || p.x < -10 || p.x > width + 10 || p.y < -10 || p.y > height + 10) {
          spawn(p);
        }
      }
      ctx.globalAlpha = 1.0;
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  })();
}
/* eslint-enable */

export function Background26({ className, style, width = '100%', height = '100%', blendMode = "normal", transparentBackground = false, edgeFeather = 0 }: Background26Props) {
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

    initBackground26Runtime({
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
      className={className ? `fv-backgrounds-background-26 ${className}` : 'fv-backgrounds-background-26'}
      style={{ width, height, ...blendStyle, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="stageCanvas"></canvas>
    </div>
  );
}

export default Background26;
