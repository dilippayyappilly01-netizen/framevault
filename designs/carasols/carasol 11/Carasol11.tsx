'use client';

/**
 * Radial Arch Carousel — Drag to Rotate
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Carasol11Props {
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

const FONT_STYLESHEETS: readonly string[] = [
  "https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700&display=swap"
];

const SCOPED_STYLES = `
.fv-carasols-carasol-11 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-carasols-carasol-11 * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
      -webkit-user-select: none;
    }

    .fv-carasols-carasol-11 {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #ededed;
      color: #222;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    .fv-carasols-carasol-11 .viewport {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      cursor: grab;
      touch-action: none;
      overflow: hidden;
    }

    .fv-carasols-carasol-11 .viewport:active {
      cursor: grabbing;
    }

    /* Pivot of the circular arch sits below center so the top arc sits in the middle of the screen */
    .fv-carasols-carasol-11 .arch-pivot {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate3d(0, 290px, 0);
      width: 0;
      height: 0;
    }

    .fv-carasols-carasol-11 .arch-card {
      position: absolute;
      width: 146px;
      height: 196px;
      margin-left: -73px;
      margin-top: -98px;
      border-radius: 18px;
      overflow: hidden;
      background: #1a2a4a;
      box-shadow: 0 16px 34px rgba(0, 0, 0, 0.16), 0 3px 8px rgba(0, 0, 0, 0.08);
      will-change: transform, opacity;
      transform-origin: center center;
    }

    .fv-carasols-carasol-11 .arch-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      display: block;
      pointer-events: none;
      image-rendering: -webkit-optimize-contrast;
      transform: translateZ(0);
    }

    /* Small dark pill badge in bottom-left of each card matching the recording */
    .fv-carasols-carasol-11 .num-badge {
      position: absolute;
      bottom: 10px;
      left: 10px;
      background: rgba(12, 18, 30, 0.78);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      color: #ffffff;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.06em;
      padding: 3px 6px;
      border-radius: 5px;
      pointer-events: none;
    }

    /* Soft gradient fade mask along the bottom of the arch */
    .fv-carasols-carasol-11 .arch-fade-mask {
      position: absolute;
      left: 0;
      right: 0;
      top: 56%;
      height: 220px;
      background: linear-gradient(180deg, rgba(237, 237, 237, 0) 0%, #ededed 58%, #ededed 100%);
      pointer-events: none;
      z-index: 20;
    }

    .fv-carasols-carasol-11 .drag-label {
      position: absolute;
      top: 67.5%;
      left: 50%;
      transform: translateX(-50%);
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: #666;
      z-index: 30;
      pointer-events: none;
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
function initCarasol11Runtime(__fvRuntime: ScopedRuntimeContext): void {
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
  
      const pivot = document.getElementById('pivot');
      const viewport = document.getElementById('viewport');
  
      const TOTAL = IMAGES.length; // 12 cards
      const STEP_DEG = 29;         // 29 deg between adjacent cards on the arch
      const RADIUS = 350;          // Arch radius in px
      const cards: any[] = [];
  
      IMAGES.forEach((src: any, i: any) => {
        const el = document.createElement('div');
        el.className = 'arch-card';
        const numStr = String(i + 1).padStart(2, '0');
        el.innerHTML = `
          <img src="${src}" alt="Card ${numStr}" loading="eager" decoding="sync" fetchpriority="high">
          <div class="num-badge">${numStr}</div>
        `;
        pivot.appendChild(el);
        cards.push({ el, index: i });
      });
  
      let currentIndex = 0;
      let targetIndex = 0;
      let isDragging = false;
      let lastX = 0;
      let lastTime = 0;
      let velocity = 0;
      let autoRotate = true;
  
      function renderArch() {
        if (autoRotate && !isDragging) {
          targetIndex += 0.0045;
        }
  
        if (!isDragging) {
          currentIndex += (targetIndex - currentIndex) * 0.11;
        } else {
          currentIndex = targetIndex;
        }
  
        cards.forEach(({ el, index }: any) => {
          // Compute shortest circular index offset from apex [-TOTAL/2, +TOTAL/2]
          let delta = (index - currentIndex) % TOTAL;
          if (delta < -TOTAL / 2) delta += TOTAL;
          if (delta > TOTAL / 2) delta -= TOTAL;
  
          const angleDeg = delta * STEP_DEG;
          if (Math.abs(angleDeg) > 85) {
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
            return;
          }
  
          const rad = (angleDeg * Math.PI) / 180;
          const x = RADIUS * Math.sin(rad);
          const y = -RADIUS * Math.cos(rad);
  
          // Smooth fade at the extreme left and right ends of the arch
          const fade = Math.max(0, 1 - Math.pow(Math.abs(angleDeg) / 76, 3.2));
  
          el.style.opacity = fade.toFixed(3);
          el.style.pointerEvents = fade > 0.2 ? 'auto' : 'none';
          el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${angleDeg.toFixed(2)}deg)`;
          el.style.zIndex = Math.round(100 - Math.abs(delta) * 10);
        });
  
        requestAnimationFrame(renderArch);
      }
  
      viewport.addEventListener('pointerdown', (e: any) => {
        isDragging = true;
        autoRotate = false;
        lastX = e.clientX;
        lastTime = performance.now();
        velocity = 0;
        viewport.setPointerCapture(e.pointerId);
      });
  
      viewport.addEventListener('pointermove', (e: any) => {
        if (!isDragging) return;
        const now = performance.now();
        const dx = e.clientX - lastX;
        const dt = Math.max(1, now - lastTime);
  
        const dIdx = -dx / 150;
        targetIndex += dIdx;
        velocity = dIdx / dt;
  
        lastX = e.clientX;
        lastTime = now;
      });
  
      function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        targetIndex += velocity * 140;
        setTimeout(() => {
          if (!isDragging) autoRotate = true;
        }, 2000);
      }
  
      viewport.addEventListener('pointerup', endDrag);
      viewport.addEventListener('pointercancel', endDrag);
  
      window.addEventListener('wheel', (e: any) => {
        e.preventDefault();
        autoRotate = false;
        targetIndex += (e.deltaX || e.deltaY) * 0.003;
        clearTimeout(window._archTimer);
        window._archTimer = setTimeout(() => { autoRotate = true; }, 2000);
      }, { passive: false });
  
      window.addEventListener('keydown', (e: any) => {
        autoRotate = false;
        if (e.key === 'ArrowLeft') targetIndex -= 1;
        if (e.key === 'ArrowRight') targetIndex += 1;
      });
  
      requestAnimationFrame(renderArch);
}
/* eslint-enable */

export function Carasol11({ className, style, width = '100%', height = '100%', imageBasePath = 'images' }: Carasol11Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    // Load required Google Fonts once per document
    for (const href of FONT_STYLESHEETS) {
      if (!document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
      }
    }
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

    initCarasol11Runtime({
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
      className={className ? `fv-carasols-carasol-11 ${className}` : 'fv-carasols-carasol-11'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <div className="viewport" id="viewport">
            <div className="arch-pivot" id="pivot"></div>
            <div className="arch-fade-mask"></div>
          </div>

          <div className="drag-label">DRAG TO ROTATE</div>
    </div>
  );
}

export default Carasol11;
