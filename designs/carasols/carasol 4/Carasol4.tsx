'use client';

/**
 * 3D Rolodex Fin Carousel
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Carasol4Props {
  /** Additional CSS class names for the root container */
  className?: string;
  /** Inline styles applied to the root container */
  style?: React.CSSProperties;
  /** Container width (default: '100%') */
  width?: number | string;
  /** Container height (default: '100%') */
  height?: number | string;
  /** Base URL/path for local images (default: 'images') */
  imageBasePath?: string;
}

const SCOPED_STYLES = `
.fv-carasols-carasol-4 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-carasols-carasol-4 * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
      -webkit-user-select: none;
    }

    .fv-carasols-carasol-4 {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #ededed;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    .fv-carasols-carasol-4 .viewport {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      perspective: 1300px;
      perspective-origin: 50% 50%;
      cursor: grab;
      touch-action: none;
    }

    .fv-carasols-carasol-4 .viewport:active {
      cursor: grabbing;
    }

    /* Isometric 3/4 view matching the video recording */
    .fv-carasols-carasol-4 .rolodex-assembly {
      position: relative;
      width: 0;
      height: 0;
      transform-style: preserve-3d;
      transform: rotateX(-12deg) rotateY(-34deg) rotateZ(-6deg);
      will-change: transform;
    }

    /* Each fin is hinged at its bottom edge along the central horizontal spine */
    .fv-carasols-carasol-4 .fin {
      position: absolute;
      width: 280px;
      height: 250px;
      left: -140px;
      top: -250px;
      transform-origin: 50% 100%;
      transform-style: preserve-3d;
      will-change: transform, filter;
    }

    .fv-carasols-carasol-4 .fin-face {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      border-radius: 10px 10px 3px 3px;
      overflow: hidden;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      background: #d8d8d8;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.14);
    }

    .fv-carasols-carasol-4 .fin-face.back {
      transform: rotateY(180deg) rotateZ(180deg);
    }

    .fv-carasols-carasol-4 .fin-face img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      display: block;
      pointer-events: none;
      image-rendering: -webkit-optimize-contrast;
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
function initCarasol4Runtime(__fvRuntime: ScopedRuntimeContext): void {
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
  
      const assembly = document.getElementById('assembly');
      const viewport = document.getElementById('viewport');
  
      // 6 full radiating fins (12 faces total, displaying all 12 high-res user pictures!)
      const FIN_COUNT = 6;
      const STEP_DEG = 360 / FIN_COUNT;
      const fins: any[] = [];
  
      for (let i = 0; i < FIN_COUNT; i++) {
        const fin = document.createElement('div');
        fin.className = 'fin';
  
        const frontImg = IMAGES[(i * 2) % IMAGES.length];
        const backImg = IMAGES[(i * 2 + 1) % IMAGES.length];
  
        fin.innerHTML = `
          <div class="fin-face front">
            <img src="${frontImg}" alt="Slide ${i * 2 + 1}" loading="eager" decoding="sync" fetchpriority="high">
          </div>
          <div class="fin-face back">
            <img src="${backImg}" alt="Slide ${i * 2 + 2}" loading="eager" decoding="sync" fetchpriority="high">
          </div>
        `;
  
        assembly.appendChild(fin);
        fins.push({ el: fin, baseAngle: i * STEP_DEG });
      }
  
      let currentAngle = 18;
      let targetAngle = 18;
      let isDragging = false;
      let lastX = 0;
      let lastY = 0;
      let lastTime = 0;
      let velocity = 0;
      let autoSpin = true;
  
      function renderRolodex() {
        if (autoSpin && !isDragging) {
          targetAngle += 0.28;
        }
  
        if (!isDragging) {
          currentAngle += (targetAngle - currentAngle) * 0.11;
        } else {
          currentAngle = targetAngle;
        }
  
        fins.forEach(({ el, baseAngle }: any) => {
          const angle = baseAngle + currentAngle;
          el.style.transform = `rotateX(${angle.toFixed(2)}deg)`;
  
          // Subtle shallow depth-of-field blur on horizontal fins matching the video
          const rad = (angle * Math.PI) / 180;
          const uprightness = Math.abs(Math.cos(rad)); // 1 when vertical, 0 when horizontal
          const blurPx = (1 - uprightness) * 1.4;
          el.style.filter = blurPx > 0.35 ? `blur(${blurPx.toFixed(2)}px)` : 'none';
        });
  
        requestAnimationFrame(renderRolodex);
      }
  
      viewport.addEventListener('pointerdown', (e: any) => {
        isDragging = true;
        autoSpin = false;
        lastX = e.clientX;
        lastY = e.clientY;
        lastTime = performance.now();
        velocity = 0;
        viewport.setPointerCapture(e.pointerId);
      });
  
      viewport.addEventListener('pointermove', (e: any) => {
        if (!isDragging) return;
        const now = performance.now();
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        const dt = Math.max(1, now - lastTime);
  
        const delta = (-dy * 0.45) + (dx * 0.35);
        targetAngle += delta;
        velocity = delta / dt;
  
        lastX = e.clientX;
        lastY = e.clientY;
        lastTime = now;
      });
  
      function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        targetAngle += velocity * 140;
        setTimeout(() => {
          if (!isDragging) autoSpin = true;
        }, 1800);
      }
  
      viewport.addEventListener('pointerup', endDrag);
      viewport.addEventListener('pointercancel', endDrag);
  
      window.addEventListener('wheel', (e: any) => {
        e.preventDefault();
        autoSpin = false;
        targetAngle += (e.deltaY || e.deltaX) * 0.25;
        clearTimeout(window._spinTimer);
        window._spinTimer = setTimeout(() => { autoSpin = true; }, 1800);
      }, { passive: false });
  
      requestAnimationFrame(renderRolodex);
}
/* eslint-enable */

export function Carasol4({ className, style, width = '100%', height = '100%', imageBasePath = 'images' }: Carasol4Props) {
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

    initCarasol4Runtime({
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

  return (
    <div
      ref={containerRef}
      className={className ? `fv-carasols-carasol-4 ${className}` : 'fv-carasols-carasol-4'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <div className="viewport" id="viewport">
            <div className="rolodex-assembly" id="assembly"></div>
          </div>
    </div>
  );
}

export default Carasol4;
