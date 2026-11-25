'use client';

/**
 * Background 08 — Kinetic Neural Constellation Web
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Background8Props {
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
.fv-backgrounds-background-8 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-backgrounds-background-8 *, .fv-backgrounds-background-8 *::before, .fv-backgrounds-background-8 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-backgrounds-background-8 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #080b12;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-backgrounds-background-8 canvas {
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
function initBackground8Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    // Multi-depth interactive neural constellation plexus with signal pulses, cursor gravity tether, and impulse bursts
    const canvas = document.getElementById('plexusCanvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
  
    const BG_HEX = '#080b12';
    const CYAN_HEX = '#38bdf8';
    const INDIGO_HEX = '#818cf8';
    const EMERALD_HEX = '#34d399';
    const ROSE_HEX = '#f472b6';
  
    function hexToRgb(hex?: any) {
      const h = hex.replace('#', '');
      return [
        parseInt(h.slice(0, 2), 16),
        parseInt(h.slice(2, 4), 16),
        parseInt(h.slice(4, 6), 16)
      ];
    }
  
    const palette = [
      hexToRgb(CYAN_HEX),
      hexToRgb(INDIGO_HEX),
      hexToRgb(EMERALD_HEX),
      hexToRgb(ROSE_HEX)
    ];
  
    let width = 0;
    let height = 0;
    let dpr = 1;
    let nodes: any = [];
    const pulses: any[] = [];
  
    function initNodes() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  
      const area = width * height;
      const count = Math.max(70, Math.min(155, Math.round(area / 10500)));
      nodes = new Array(count);
  
      for (let i = 0; i < count; i++) {
        const depth = 0.35 + Math.random() * 0.65;
        const angle = Math.random() * Math.PI * 2;
        const speed = (0.18 + Math.random() * 0.42) * depth;
        nodes[i] = {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          depth,
          radius: 1.3 + depth * 2.1,
          colorIdx: i % palette.length,
          phase: Math.random() * Math.PI * 2
        };
      }
    }
  
    window.addEventListener('resize', initNodes);
    initNodes();
  
    let ptrX = -9999;
    let ptrY = -9999;
    let parallaxX = 0;
    let parallaxY = 0;
    let targetParallaxX = 0;
    let targetParallaxY = 0;
    let linkDistScale = 1.0;
  
    window.addEventListener('pointermove', (e: any) => {
      ptrX = e.clientX;
      ptrY = e.clientY;
      targetParallaxX = (e.clientX / Math.max(width, 1) - 0.5) * 28;
      targetParallaxY = (e.clientY / Math.max(height, 1) - 0.5) * 28;
    });
  
    window.addEventListener('pointerleave', () => {
      ptrX = -9999;
      ptrY = -9999;
      targetParallaxX = 0;
      targetParallaxY = 0;
    });
  
    window.addEventListener('pointerdown', (e: any) => {
      const cx = e.clientX;
      const cy = e.clientY;
      pulses.push({ x: cx, y: cy, radius: 0, alpha: 0.85 });
      if (pulses.length > 5) pulses.shift();
  
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const dx = n.x - cx;
        const dy = n.y - cy;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < 240) {
          const force = (1 - dist / 240) * 3.4 * n.depth;
          n.vx += (dx / dist) * force;
          n.vy += (dy / dist) * force;
        }
      }
    });
  
    window.addEventListener('wheel', (e: any) => {
      linkDistScale = Math.max(0.65, Math.min(1.65, linkDistScale - e.deltaY * 0.0005));
    }, { passive: true });
  
    function animate(now?: any) {
      const t = now * 0.001;
      const speedMult = 1.0;
  
      parallaxX += (targetParallaxX - parallaxX) * 0.06;
      parallaxY += (targetParallaxY - parallaxY) * 0.06;
  
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = BG_HEX;
      ctx.fillRect(0, 0, width, height);
  
      const bgGlow = ctx.createRadialGradient(
        width * 0.5 - parallaxX * 1.5,
        height * 0.45 - parallaxY * 1.5,
        10,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.68
      );
      bgGlow.addColorStop(0, 'rgba(56, 189, 248, 0.07)');
      bgGlow.addColorStop(0.5, 'rgba(129, 140, 248, 0.035)');
      bgGlow.addColorStop(1, 'rgba(8, 11, 18, 0)');
      ctx.fillStyle = bgGlow;
      ctx.fillRect(0, 0, width, height);
  
      ctx.globalCompositeOperation = 'lighter';
  
      const pad = 40;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
  
        if (ptrX > -9000) {
          const dx = ptrX - n.x;
          const dy = ptrY - n.y;
          const d = Math.hypot(dx, dy) || 1;
          if (d < 210 && d > 28) {
            const pull = (1 - d / 210) * 0.022 * n.depth;
            n.vx += (dx / d) * pull + (-dy / d) * pull * 0.45;
            n.vy += (dy / d) * pull + (dx / d) * pull * 0.45;
          }
        }
  
        const speed = Math.hypot(n.vx, n.vy);
        const maxCruise = 0.55 * n.depth;
        if (speed > maxCruise) {
          n.vx *= 0.982;
          n.vy *= 0.982;
        }
  
        n.x += n.vx * speedMult;
        n.y += n.vy * speedMult;
  
        if (n.x < -pad) n.x = width + pad;
        else if (n.x > width + pad) n.x = -pad;
        if (n.y < -pad) n.y = height + pad;
        else if (n.y > height + pad) n.y = -pad;
      }
  
      const linkDist = 148 * linkDistScale;
      const linkDist2 = linkDist * linkDist;
  
      ctx.lineWidth = 1.05;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        const ax = a.x + parallaxX * (a.depth - 0.5);
        const ay = a.y + parallaxY * (a.depth - 0.5);
        const colA = palette[a.colorIdx];
  
        if (ptrX > -9000) {
          const cdx = ptrX - ax;
          const cdy = ptrY - ay;
          const cd2 = cdx * cdx + cdy * cdy;
          if (cd2 < linkDist2 * 1.35) {
            const alpha = (1 - Math.sqrt(cd2) / (linkDist * 1.16)) * 0.48;
            ctx.strokeStyle = `rgba(${colA[0]}, ${colA[1]}, ${colA[2]}, ${alpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(ptrX, ptrY);
            ctx.stroke();
          }
        }
  
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const bx = b.x + parallaxX * (b.depth - 0.5);
          const by = b.y + parallaxY * (b.depth - 0.5);
          const dx = bx - ax;
          const dy = by - ay;
          const d2 = dx * dx + dy * dy;
          if (d2 > linkDist2) continue;
  
          const dist = Math.sqrt(d2);
          const proximity = 1 - dist / linkDist;
          const alpha = proximity * proximity * 0.36 * ((a.depth + b.depth) * 0.5);
  
          ctx.strokeStyle = `rgba(${colA[0]}, ${colA[1]}, ${colA[2]}, ${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
  
          if ((i + j) % 11 === 0 && proximity > 0.32) {
            const prog = (t * 0.55 + a.phase) % 1;
            const px = ax + dx * prog;
            const py = ay + dy * prog;
            ctx.fillStyle = `rgba(240, 249, 255, ${(proximity * 0.78).toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(px, py, 1.55, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
  
      for (let p = pulses.length - 1; p >= 0; p--) {
        const pulse = pulses[p];
        pulse.radius += 6.2 * speedMult;
        pulse.alpha *= 0.96;
        if (pulse.alpha < 0.02) {
          pulses.splice(p, 1);
          continue;
        }
        ctx.strokeStyle = `rgba(56, 189, 248, ${pulse.alpha.toFixed(3)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
  
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const nx = n.x + parallaxX * (n.depth - 0.5);
        const ny = n.y + parallaxY * (n.depth - 0.5);
        const col = palette[n.colorIdx];
        const pulse = 0.75 + 0.25 * Math.sin(t * 2.4 + n.phase);
  
        ctx.fillStyle = `rgba(${col[0]}, ${col[1]}, ${col[2]}, ${(0.22 * pulse).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(nx, ny, n.radius * 2.6, 0, Math.PI * 2);
        ctx.fill();
  
        ctx.fillStyle = `rgba(${col[0]}, ${col[1]}, ${col[2]}, ${(0.88 * pulse).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(nx, ny, n.radius, 0, Math.PI * 2);
        ctx.fill();
      }
  
      requestAnimationFrame(animate);
    }
  
    requestAnimationFrame(animate);
  })();
}
/* eslint-enable */

export function Background8({ className, style, width = '100%', height = '100%' }: Background8Props) {
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

    initBackground8Runtime({
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
      className={className ? `fv-backgrounds-background-8 ${className}` : 'fv-backgrounds-background-8'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="plexusCanvas"></canvas>
    </div>
  );
}

export default Background8;
