'use client';

/**
 * Asset 14 — 3D Bioluminescent Lime-Green Whirlpool Vortex
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Asset14Props {
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
.fv-assets-asset-14 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-assets-asset-14 *, .fv-assets-asset-14 *::before, .fv-assets-asset-14 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-assets-asset-14 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000000;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-assets-asset-14 canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: grab;
  }

  .fv-assets-asset-14 canvas:active {
    cursor: grabbing;
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
function initAsset14Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    const canvas = document.getElementById('vortexCanvas');
    const ctx = canvas.getContext('2d');
  
    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
  
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
    }
    window.addEventListener('resize', resize);
    resize();
  
    // 4,600 crisp glowing lime-green / chartreuse particles orbiting into the central funnel throat
    // Matching the continuous particle whirlpool of Asset 14 recording
    const NUM_PARTICLES = 4600;
    const particles = new Array(NUM_PARTICLES);
  
    function initParticle(p: any, randomRadius?: any) {
      p.u = randomRadius ? Math.pow(Math.random(), 0.78) : (0.86 + Math.random() * 0.14);
      p.angle = Math.random() * Math.PI * 2;
      p.speedScale = 0.85 + Math.random() * 0.32;
      p.size = 1.15 + Math.random() * 1.65;
      p.hueShift = Math.random();
    }
  
    for (let i = 0; i < NUM_PARTICLES; i++) {
      particles[i] = {};
      initParticle(particles[i], true);
    }
  
    let tiltX = 0;
    let tiltY = 0;
    let targetTiltX = 0;
    let targetTiltY = 0;
    let isHolding = false;
  
    window.addEventListener('pointerdown', () => { isHolding = true; });
    window.addEventListener('pointerup', () => { isHolding = false; });
    window.addEventListener('pointermove', (e: any) => {
      targetTiltX = ((e.clientX / Math.max(width, 1)) * 2 - 1) * 0.45;
      targetTiltY = ((e.clientY / Math.max(height, 1)) * 2 - 1) * 0.45;
    });
  
    function project3DFunnel(u: any, angle?: any) {
      const r = 0.095 + Math.pow(u, 1.32) * 1.22;
      const y = -0.17 / (r * 2.1 + 0.18) + 0.15 * r;
  
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
  
      const pitch = 0.84 + tiltY * 0.08;
      const roll = tiltX * 0.06;
  
      const cp = Math.cos(pitch), sp = Math.sin(pitch);
      const cr = Math.cos(roll),  sr = Math.sin(roll);
  
      const yRel = y + 0.36;
      const y1 = yRel * cp - z * sp;
      const z1 = yRel * sp + z * cp;
  
      const x2 = x * cr - y1 * sr;
      const y2 = x * sr + y1 * cr;
  
      const fov = 2.25;
      const scale = fov / Math.max(0.45, fov + z1 * 0.48);
      const screenScale = Math.max(width, height) * 0.56;
  
      return {
        sx: width * 0.5 + x2 * screenScale * scale,
        sy: height * 0.47 - y2 * screenScale * scale,
        scale,
        z: z1
      };
    }
  
    function animate() {
      tiltX += (targetTiltX - tiltX) * 0.06;
      tiltY += (targetTiltY - tiltY) * 0.06;
  
      // Subtle short motion blur dash matching 00:00-00:06 of Asset 14 video
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = isHolding ? 'rgba(0, 0, 0, 0.16)' : 'rgba(0, 0, 0, 0.38)';
      ctx.fillRect(0, 0, width, height);
  
      ctx.globalCompositeOperation = 'lighter';
  
      for (let i = 0; i < NUM_PARTICLES; i++) {
        const p = particles[i];
        const invR = 1.0 / (0.22 + p.u * 0.85);
        const speedMult = isHolding ? 1.85 : 1.0;
  
        const oldPos = project3DFunnel(p.u, p.angle);
  
        p.angle += 0.0052 * invR * p.speedScale * speedMult;
        p.u -= 0.00072 * (0.5 + 0.5 * invR) * speedMult;
  
        if (p.u <= 0.002) {
          initParticle(p, false);
          continue;
        }
  
        const newPos = project3DFunnel(p.u, p.angle);
  
        const throatGlow = Math.exp(-p.u * 6.5);
        const depthBright = Math.max(0.25, Math.min(1.2, 0.78 - newPos.z * 0.45));
        const outerFade = Math.min(1.0, (1.0 - p.u) * 3.5);
        const alpha = Math.min(0.95, (0.28 + throatGlow * 0.68) * depthBright * outerFade);
  
        let r: any, g: any, b: any;
        if (throatGlow > 0.45 || p.hueShift > 0.72) {
          r = 185 + Math.round(throatGlow * 65);
          g = 255;
          b = 45 + Math.round(throatGlow * 55);
        } else if (p.hueShift > 0.3) {
          r = 128;
          g = 232;
          b = 24;
        } else {
          r = 68;
          g = 175;
          b = 18;
        }
  
        const w = p.size * newPos.scale * (1.15 + throatGlow * 0.65);
        ctx.strokeStyle = `rgba(${r},${g},${b},${Math.min(0.95, alpha * 1.32).toFixed(3)})`;
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(oldPos.sx, oldPos.sy);
        ctx.lineTo(newPos.sx, newPos.sy);
        ctx.stroke();
      }
  
      // Central pitch-black funnel throat eye aligned concentrically at (x=0, z=0)
      ctx.globalCompositeOperation = 'source-over';
      const rCenter = 0.095;
      const y0 = -0.17 / (rCenter * 2.1 + 0.18) + 0.15 * rCenter;
      const pitch0 = 0.84 + tiltY * 0.08;
      const yRel0 = y0 + 0.36;
      const y10 = yRel0 * Math.cos(pitch0);
      const z10 = yRel0 * Math.sin(pitch0);
      const scale0 = 2.25 / Math.max(0.45, 2.25 + z10 * 0.48);
      const screenScale0 = Math.max(width, height) * 0.56;
      const eyeSx = width * 0.5;
      const eyeSy = height * 0.47 - y10 * screenScale0 * scale0;
      const eyeRx = Math.max(width, height) * 0.052;
      const eyeRy = eyeRx * 0.68;
      ctx.save();
      ctx.translate(eyeSx, eyeSy);
      ctx.scale(1.0, eyeRy / eyeRx);
      const eyeGrad = ctx.createRadialGradient(0, 0, eyeRx * 0.55, 0, 0, eyeRx * 1.05);
      eyeGrad.addColorStop(0, 'rgba(0,0,0,1)');
      eyeGrad.addColorStop(0.78, 'rgba(0,0,0,0.96)');
      eyeGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = eyeGrad;
      ctx.beginPath();
      ctx.arc(0, 0, eyeRx * 1.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
  
      requestAnimationFrame(animate);
    }
  
    requestAnimationFrame(animate);
  })();
}
/* eslint-enable */

export function Asset14({ className, style, width = '100%', height = '100%' }: Asset14Props) {
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

    initAsset14Runtime({
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
      className={className ? `fv-assets-asset-14 ${className}` : 'fv-assets-asset-14'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="vortexCanvas"></canvas>
    </div>
  );
}

export default Asset14;
