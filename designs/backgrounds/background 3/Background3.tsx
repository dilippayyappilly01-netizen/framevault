'use client';

/**
 * Background 03 — Magnetic Dot Matrix Wave Grid
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Background3Props {
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
.fv-backgrounds-background-3 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-backgrounds-background-3 *, .fv-backgrounds-background-3 *::before, .fv-backgrounds-background-3 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-backgrounds-background-3 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #f4f5f8;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-backgrounds-background-3 canvas {
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
function initBackground3Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    // Editorial gallery-light elastic dot matrix with spring physics, magnetic cursor vortex, and click shockwaves
    const canvas = document.getElementById('matrixCanvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
  
    const BG_HEX = '#f4f5f8';
    const BASE_DOT_HEX = '#94a3b8';
    const COBALT_HEX = '#2563eb';
    const VIOLET_HEX = '#7c3aed';
    const CYAN_HEX = '#0891b2';
  
    function parseHex(hex?: any) {
      const clean = hex.replace('#', '');
      return [
        parseInt(clean.slice(0, 2), 16),
        parseInt(clean.slice(2, 4), 16),
        parseInt(clean.slice(4, 6), 16)
      ];
    }
  
    const baseRgb = parseHex(BASE_DOT_HEX);
    const cobaltRgb = parseHex(COBALT_HEX);
    const violetRgb = parseHex(VIOLET_HEX);
    const cyanRgb = parseHex(CYAN_HEX);
  
    let width = 0;
    let height = 0;
    let dpr = 1;
    let cols = 0;
    let rows = 0;
    let spacing = 30;
    let nodes: any = [];
    const shockwaves: any[] = [];
  
    function buildGrid() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  
      spacing = Math.max(24, Math.min(36, Math.round(Math.min(width, height) / 22)));
      cols = Math.ceil(width / spacing) + 2;
      rows = Math.ceil(height / spacing) + 2;
      const offsetX = (width - (cols - 1) * spacing) * 0.5;
      const offsetY = (height - (rows - 1) * spacing) * 0.5;
  
      nodes = new Array(cols * rows);
      let idx = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const hx = offsetX + c * spacing;
          const hy = offsetY + r * spacing;
          nodes[idx++] = {
            hx,
            hy,
            x: hx,
            y: hy,
            vx: 0,
            vy: 0,
            energy: 0
          };
        }
      }
    }
  
    window.addEventListener('resize', buildGrid);
    buildGrid();
  
    let ptrX = -9999;
    let ptrY = -9999;
    let ptrVx = 0;
    let ptrVy = 0;
    let isHolding = false;
    let radiusScale = 1.0;
  
    window.addEventListener('pointermove', (e: any) => {
      if (ptrX > -9000) {
        ptrVx = e.clientX - ptrX;
        ptrVy = e.clientY - ptrY;
      }
      ptrX = e.clientX;
      ptrY = e.clientY;
    });
  
    window.addEventListener('pointerleave', () => {
      ptrX = -9999;
      ptrY = -9999;
      isHolding = false;
    });
  
    window.addEventListener('pointerdown', (e: any) => {
      isHolding = true;
      ptrX = e.clientX;
      ptrY = e.clientY;
      shockwaves.push({ x: e.clientX, y: e.clientY, radius: 0, strength: 1.0 });
      if (shockwaves.length > 5) shockwaves.shift();
    });
  
    window.addEventListener('pointerup', () => {
      isHolding = false;
    });
  
    window.addEventListener('wheel', (e: any) => {
      radiusScale = Math.max(0.55, Math.min(1.85, radiusScale - e.deltaY * 0.0006));
    }, { passive: true });
  
    function animate(now?: any) {
      const t = now * 0.001;
      const speedMult = 1.0;
  
      ctx.fillStyle = BG_HEX;
      ctx.fillRect(0, 0, width, height);
  
      const interactRadius = 175 * radiusScale;
      const interactR2 = interactRadius * interactRadius;
  
      for (let s = shockwaves.length - 1; s >= 0; s--) {
        const sw = shockwaves[s];
        sw.radius += 7.5 * speedMult;
        sw.strength *= 0.968;
        if (sw.strength < 0.02) shockwaves.splice(s, 1);
      }
  
      // Update spring-damper physics on every dot
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
  
        // Ambient organic harmonic wave drift
        const waveX = Math.sin(n.hy * 0.012 + t * 1.45) * 3.8 + Math.cos(n.hx * 0.01 + t * 1.1) * 2.2;
        const waveY = Math.cos(n.hx * 0.012 - t * 1.3) * 3.8 + Math.sin((n.hx + n.hy) * 0.008 + t * 0.95) * 2.2;
        const targetX = n.hx + waveX;
        const targetY = n.hy + waveY;
  
        let fx = (targetX - n.x) * 0.085;
        let fy = (targetY - n.y) * 0.085;
        let localEnergy = 0;
  
        // Magnetic cursor repulsion (or vortex attraction while holding pointer)
        const dx = n.x - ptrX;
        const dy = n.y - ptrY;
        const d2 = dx * dx + dy * dy;
        if (d2 < interactR2 && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const falloff = 1.0 - d / interactRadius;
          const smooth = falloff * falloff;
          const dir = isHolding ? -0.65 : 1.0;
          fx += (dx / d) * smooth * 4.4 * dir + ptrVx * smooth * 0.075;
          fy += (dy / d) * smooth * 4.4 * dir + ptrVy * smooth * 0.075;
          // Subtle tangential swirl when holding
          if (isHolding) {
            fx += (-dy / d) * smooth * 2.6;
            fy += (dx / d) * smooth * 2.6;
          }
          localEnergy = Math.max(localEnergy, smooth);
        }
  
        // Shockwave rings
        for (let s = 0; s < shockwaves.length; s++) {
          const sw = shockwaves[s];
          const sdx = n.x - sw.x;
          const sdy = n.y - sw.y;
          const sd = Math.sqrt(sdx * sdx + sdy * sdy) || 1;
          const band = Math.abs(sd - sw.radius);
          if (band < 48) {
            const push = (1.0 - band / 48) * sw.strength;
            fx += (sdx / sd) * push * 5.2;
            fy += (sdy / sd) * push * 5.2;
            localEnergy = Math.max(localEnergy, push);
          }
        }
  
        n.vx = (n.vx + fx) * 0.84;
        n.vy = (n.vy + fy) * 0.84;
        n.x += n.vx;
        n.y += n.vy;
  
        const disp = Math.min(1.0, Math.hypot(n.x - targetX, n.y - targetY) / 26);
        n.energy += (Math.max(localEnergy, disp) - n.energy) * 0.18;
      }
  
      ptrVx *= 0.82;
      ptrVy *= 0.82;
  
      // Draw delicate tension filaments only for energized neighbor pairs
      ctx.lineWidth = 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          const n = nodes[idx];
          if (n.energy < 0.09) continue;
  
          if (c + 1 < cols) {
            const right = nodes[idx + 1];
            const e = (n.energy + right.energy) * 0.5;
            if (e > 0.09) {
              ctx.strokeStyle = `rgba(${cobaltRgb[0]}, ${cobaltRgb[1]}, ${cobaltRgb[2]}, ${(e * 0.34).toFixed(3)})`;
              ctx.beginPath();
              ctx.moveTo(n.x, n.y);
              ctx.lineTo(right.x, right.y);
              ctx.stroke();
            }
          }
          if (r + 1 < rows) {
            const down = nodes[idx + cols];
            const e = (n.energy + down.energy) * 0.5;
            if (e > 0.09) {
              ctx.strokeStyle = `rgba(${violetRgb[0]}, ${violetRgb[1]}, ${violetRgb[2]}, ${(e * 0.34).toFixed(3)})`;
              ctx.beginPath();
              ctx.moveTo(n.x, n.y);
              ctx.lineTo(down.x, down.y);
              ctx.stroke();
            }
          }
        }
      }
  
      // Render crisp dots with smooth palette interpolation
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const e = Math.min(1.0, n.energy);
        const radius = 1.65 + e * 3.1;
  
        let rCol: any, gCol: any, bCol: any, alpha: any;
        if (e < 0.03) {
          rCol = baseRgb[0];
          gCol = baseRgb[1];
          bCol = baseRgb[2];
          alpha = 0.52;
        } else {
          const hueMix = 0.5 + 0.5 * Math.sin(n.hx * 0.01 + n.hy * 0.01 + t * 2.0);
          const accent = hueMix > 0.5
            ? [
                cobaltRgb[0] + (violetRgb[0] - cobaltRgb[0]) * ((hueMix - 0.5) * 2),
                cobaltRgb[1] + (violetRgb[1] - cobaltRgb[1]) * ((hueMix - 0.5) * 2),
                cobaltRgb[2] + (violetRgb[2] - cobaltRgb[2]) * ((hueMix - 0.5) * 2)
              ]
            : [
                cyanRgb[0] + (cobaltRgb[0] - cyanRgb[0]) * (hueMix * 2),
                cyanRgb[1] + (cobaltRgb[1] - cyanRgb[1]) * (hueMix * 2),
                cyanRgb[2] + (cobaltRgb[2] - cyanRgb[2]) * (hueMix * 2)
              ];
          rCol = Math.round(baseRgb[0] + (accent[0] - baseRgb[0]) * Math.min(1, e * 1.4));
          gCol = Math.round(baseRgb[1] + (accent[1] - baseRgb[1]) * Math.min(1, e * 1.4));
          bCol = Math.round(baseRgb[2] + (accent[2] - baseRgb[2]) * Math.min(1, e * 1.4));
          alpha = 0.52 + e * 0.46;
        }
  
        ctx.fillStyle = `rgba(${rCol}, ${gCol}, ${bCol}, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
  
      requestAnimationFrame(animate);
    }
  
    requestAnimationFrame(animate);
  })();
}
/* eslint-enable */

export function Background3({ className, style, width = '100%', height = '100%' }: Background3Props) {
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

    initBackground3Runtime({
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
      className={className ? `fv-backgrounds-background-3 ${className}` : 'fv-backgrounds-background-3'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="matrixCanvas"></canvas>
    </div>
  );
}

export default Background3;
