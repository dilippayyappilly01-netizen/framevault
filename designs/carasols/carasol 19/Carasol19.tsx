'use client';

/**
 * Concentric Sector Rings Carousel
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Carasol19Props {
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
  /** Base URL/path for local images (default: 'images') */
  imageBasePath?: string;
}

const SCOPED_STYLES = `
.fv-carasols-carasol-19 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-carasols-carasol-19 * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
      -webkit-user-select: none;
    }

    .fv-carasols-carasol-19 {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #000000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    .fv-carasols-carasol-19 #stage {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      cursor: grab;
      touch-action: none;
    }

    .fv-carasols-carasol-19 #stage:active {
      cursor: grabbing;
    }

    .fv-carasols-carasol-19 canvas {
      display: block;
      width: 100%;
      height: 100%;
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
  imgBase: string;
}

/* eslint-disable */
function initCarasol19Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame, imgBase } = __fvRuntime as any;
  const IMAGES = [
        `${imgBase}/1.jpg`,
        `${imgBase}/2.jpg`,
        `${imgBase}/3.jpg`,
        `${imgBase}/4.jpg`,
        `${imgBase}/5.jpg`,
        `${imgBase}/6.jpg`,
        `${imgBase}/7.jpg`,
        `${imgBase}/8.jpg`,
        `${imgBase}/9.jpg`,
        `${imgBase}/10.jpg`,
        `${imgBase}/11.jpg`,
        `${imgBase}/12.jpg`
      ];
  
      const canvas = document.getElementById('nautilusCanvas');
      const ctx = canvas.getContext('2d', { alpha: false });
      const stage = document.getElementById('stage');
  
      let width = window.innerWidth;
      let height = window.innerHeight;
      let dpr = Math.min(Math.max(window.devicePixelRatio || 1, 2), 2.5);
  
      function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        dpr = Math.min(Math.max(window.devicePixelRatio || 1, 2), 2.5);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
      }
      window.addEventListener('resize', resize);
      resize();
  
      // Load all 12 high-resolution user photos
      const TOTAL = IMAGES.length;
      const loadedImgs = new Array(TOTAL).fill(null);
  
      IMAGES.forEach((src: any, i: any) => {
        const img = new Image();
        img.decoding = 'sync';
        img.onload = () => {
          loadedImgs[i] = img;
        };
        img.src = src;
      });
  
      // 7 concentric rings scaling exponentially from the outer screen diagonal to the center pinhole
      const RING_COUNT = 7;
      const SECTORS_PER_RING = 8;
  
      let masterAngle = 0;
      let targetAngle = 0;
      let isDragging = false;
      let lastPointerAngle = 0;
      let lastTime = 0;
      let velocity = 0;
  
      function getPointerAngle(x: any, y?: any) {
        return Math.atan2(y - height * 0.5, x - width * 0.5);
      }
  
      function renderNautilus() {
        if (!isDragging) {
          targetAngle += 0.0025;
          masterAngle += (targetAngle - masterAngle) * 0.1;
        } else {
          masterAngle = targetAngle;
        }
  
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
  
        const cx = width * 0.5;
        const cy = height * 0.5;
        const maxRadius = Math.hypot(width, height) * 0.54;
  
        // Radii ratio from outermost ring down to center
        const ratio = 0.62;
        const stepAngle = (Math.PI * 2) / SECTORS_PER_RING;
        const gapAngle = 0.048; // Bold black radial border between sectors
  
        for (let rIdx = 0; rIdx < RING_COUNT; rIdx++) {
          const rOuter = maxRadius * Math.pow(ratio, rIdx);
          const rInner = maxRadius * Math.pow(ratio, rIdx + 1);
          const ringThick = rOuter - rInner;
          const borderW = Math.max(3.5, ringThick * 0.115);
  
          // Each inner ring rotates with a progressive phase & speed multiplier matching the video
          const ringRot = masterAngle * (1 + rIdx * 0.28) * (rIdx % 2 === 0 ? 1 : -0.85) + rIdx * 0.45;
  
          for (let s = 0; s < SECTORS_PER_RING; s++) {
            const a0 = s * stepAngle + ringRot + gapAngle * 0.5;
            const a1 = (s + 1) * stepAngle + ringRot - gapAngle * 0.5;
            const midAngle = (a0 + a1) * 0.5;
            const midR = (rInner + rOuter) * 0.5;
  
            const photoIdx = (rIdx * 3 + s) % TOTAL;
            const img = loadedImgs[photoIdx];
  
            ctx.save();
            // Annular sector clip path
            ctx.beginPath();
            ctx.arc(cx, cy, Math.max(1, rOuter - borderW * 0.5), a0, a1, false);
            ctx.arc(cx, cy, Math.max(0.5, rInner + borderW * 0.5), a1, a0, true);
            ctx.closePath();
            ctx.clip();
  
            if (img) {
              // Position and orient the photo inside the sector wedge
              const px = cx + midR * Math.cos(midAngle);
              const py = cy + midR * Math.sin(midAngle);
              const boxSize = Math.max(ringThick * 1.45, rOuter * stepAngle * 1.25);
  
              ctx.translate(px, py);
              // Keep photos upright or gently aligned with the sector
              ctx.rotate(midAngle + Math.PI * 0.5);
  
              const imgAspect = img.naturalWidth / img.naturalHeight;
              let dw = boxSize, dh = boxSize;
              if (imgAspect > 1) dw = boxSize * imgAspect;
              else dh = boxSize / imgAspect;
  
              ctx.drawImage(img, -dw * 0.5, -dh * 0.5, dw, dh);
            } else {
              ctx.fillStyle = '#1e293b';
              ctx.fill();
            }
  
            ctx.restore();
          }
        }
  
        requestAnimationFrame(renderNautilus);
      }
  
      stage.addEventListener('pointerdown', (e: any) => {
        isDragging = true;
        lastPointerAngle = getPointerAngle(e.clientX, e.clientY);
        lastTime = performance.now();
        velocity = 0;
        stage.setPointerCapture(e.pointerId);
      });
  
      stage.addEventListener('pointermove', (e: any) => {
        if (!isDragging) return;
        const now = performance.now();
        const dt = Math.max(1, now - lastTime);
        const curAngle = getPointerAngle(e.clientX, e.clientY);
        let dAngle = curAngle - lastPointerAngle;
        if (dAngle > Math.PI) dAngle -= Math.PI * 2;
        if (dAngle < -Math.PI) dAngle += Math.PI * 2;
  
        targetAngle += dAngle;
        velocity = dAngle / dt;
  
        lastPointerAngle = curAngle;
        lastTime = now;
      });
  
      function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        targetAngle += velocity * 160;
      }
  
      stage.addEventListener('pointerup', endDrag);
      stage.addEventListener('pointercancel', endDrag);
  
      window.addEventListener('wheel', (e: any) => {
        e.preventDefault();
        targetAngle += (e.deltaY || e.deltaX) * 0.002;
      }, { passive: false });
  
      requestAnimationFrame(renderNautilus);
}
/* eslint-enable */

export function Carasol19({ className, style, width = '100%', height = '100%', blendMode = "normal", transparentBackground = false, edgeFeather = 0, imageBasePath = 'images' }: Carasol19Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const imgBase = imageBasePath.replace(/\/+$/, '');
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

    initCarasol19Runtime({
      root,
      document: scopedDoc,
      window: scopedWin,
      requestAnimationFrame: scopedRaf,
      cancelAnimationFrame: scopedCaf,
      imgBase
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
  }, [imageBasePath]);

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
      className={className ? `fv-carasols-carasol-19 ${className}` : 'fv-carasols-carasol-19'}
      style={{ width, height, ...blendStyle, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <div id="stage">
            <canvas id="nautilusCanvas"></canvas>
          </div>
    </div>
  );
}

export default Carasol19;
