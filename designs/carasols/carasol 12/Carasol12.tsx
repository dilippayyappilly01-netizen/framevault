'use client';

/**
 * 3D Perspective Louver Carousel
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Carasol12Props {
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
.fv-carasols-carasol-12 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-carasols-carasol-12 * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
      -webkit-user-select: none;
    }

    .fv-carasols-carasol-12 {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #ededed;
      color: #111;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    .fv-carasols-carasol-12 .viewport {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      perspective: 1100px;
      perspective-origin: 50% 50%;
      cursor: grab;
      touch-action: none;
      overflow: hidden;
    }

    .fv-carasols-carasol-12 .viewport:active {
      cursor: grabbing;
    }

    .fv-carasols-carasol-12 .gallery-track {
      position: relative;
      width: 0;
      height: 0;
      transform-style: preserve-3d;
      will-change: transform;
    }

    .fv-carasols-carasol-12 .louver-card {
      position: absolute;
      width: 220px;
      height: 280px;
      margin-left: -110px;
      margin-top: -140px;
      border-radius: 10px;
      overflow: hidden;
      background: #d8d8d8;
      box-shadow: 0 18px 38px rgba(0, 0, 0, 0.14), 0 2px 6px rgba(0, 0, 0, 0.06);
      transform-style: preserve-3d;
      will-change: transform, opacity;
      cursor: pointer;
    }

    .fv-carasols-carasol-12 .louver-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      display: block;
      pointer-events: none;
      image-rendering: -webkit-optimize-contrast;
      transform: translateZ(0);
    }

    /* Bottom-left subtle dark gradient & white label matching Carousel 12 */
    .fv-carasols-carasol-12 .louver-card::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, transparent 55%, rgba(0, 0, 0, 0.62) 100%);
      pointer-events: none;
    }

    .fv-carasols-carasol-12 .card-title {
      position: absolute;
      bottom: 14px;
      left: 14px;
      color: #ffffff;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.01em;
      z-index: 2;
      pointer-events: none;
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.45);
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
function initCarasol12Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame, imgBase } = __fvRuntime as any;
  const SLIDES = [
        { src: `${imgBase}/1.jpg`, title: 'Rising Curve' },
        { src: `${imgBase}/2.jpg`, title: 'Flight Deck' },
        { src: `${imgBase}/3.jpg`, title: 'Glass Visor' },
        { src: `${imgBase}/4.jpg`, title: 'Vertical City' },
        { src: `${imgBase}/5.jpg`, title: 'Looking Up' },
        { src: `${imgBase}/6.jpg`, title: 'Soft Concrete' },
        { src: `${imgBase}/7.jpg`, title: 'Bronze Guard' },
        { src: `${imgBase}/8.jpg`, title: 'Glass Model' },
        { src: `${imgBase}/9.jpg`, title: 'Spiral' },
        { src: `${imgBase}/10.jpg`, title: 'Crimson Lake' },
        { src: `${imgBase}/11.jpg`, title: 'Autumn Path' },
        { src: `${imgBase}/12.jpg`, title: 'Canopy Light' }
      ];
  
      const track = document.getElementById('track');
      const viewport = document.getElementById('viewport');
  
      const TOTAL = SLIDES.length;
      const cards: any[] = [];
  
      SLIDES.forEach((slide: any, i: any) => {
        const el = document.createElement('div');
        el.className = 'louver-card';
        el.innerHTML = `
          <img src="${slide.src}" alt="${slide.title}" loading="eager" decoding="sync" fetchpriority="high">
          <div class="card-title">${slide.title}</div>
        `;
        el.addEventListener('click', () => {
          if (!wasDragged) {
            let diff = (i - Math.round(targetIndex)) % TOTAL;
            if (diff > TOTAL / 2) diff -= TOTAL;
            if (diff < -TOTAL / 2) diff += TOTAL;
            targetIndex = Math.round(targetIndex) + diff;
          }
        });
        track.appendChild(el);
        cards.push({ el, index: i });
      });
  
      let currentIndex = 0;
      let targetIndex = 0;
      let isDragging = false;
      let wasDragged = false;
      let startX = 0;
      let lastX = 0;
      let lastTime = 0;
      let velocity = 0;
  
      const SPACING = 215;
  
      function renderLouverGallery() {
        if (!isDragging) {
          currentIndex += (targetIndex - currentIndex) * 0.11;
        } else {
          currentIndex = targetIndex;
        }
  
        cards.forEach(({ el, index }: any) => {
          // Compute shortest circular index offset from active center card
          let delta = (index - currentIndex) % TOTAL;
          if (delta < -TOTAL / 2) delta += TOTAL;
          if (delta > TOTAL / 2) delta -= TOTAL;
  
          const absDelta = Math.abs(delta);
          if (absDelta > 4.2) {
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
            return;
          }
  
          const x = delta * SPACING;
          // Center card (delta = 0) faces flat forward (rotY = 0).
          // Cards off-center smoothly turn into 3D louver perspective matching the video!
          const t = Math.max(-1, Math.min(1, delta / 0.85));
          const rotY = t * -56;
          const z = -Math.min(1, absDelta) * 55;
  
          el.style.opacity = '1';
          el.style.pointerEvents = 'auto';
          el.style.transform = `translate3d(${x.toFixed(2)}px, 0, ${z.toFixed(2)}px) rotateY(${rotY.toFixed(2)}deg)`;
          el.style.zIndex = Math.round(100 - absDelta * 10);
        });
  
        requestAnimationFrame(renderLouverGallery);
      }
  
      viewport.addEventListener('pointerdown', (e: any) => {
        isDragging = true;
        wasDragged = false;
        startX = e.clientX;
        lastX = e.clientX;
        lastTime = performance.now();
        velocity = 0;
        viewport.setPointerCapture(e.pointerId);
      });
  
      viewport.addEventListener('pointermove', (e: any) => {
        if (!isDragging) return;
        if (Math.abs(e.clientX - startX) > 5) wasDragged = true;
  
        const now = performance.now();
        const dx = e.clientX - lastX;
        const dt = Math.max(1, now - lastTime);
  
        targetIndex -= dx / SPACING;
        velocity = -dx / dt;
  
        lastX = e.clientX;
        lastTime = now;
      });
  
      function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        targetIndex += velocity * 0.35;
        targetIndex = Math.round(targetIndex);
      }
  
      viewport.addEventListener('pointerup', endDrag);
      viewport.addEventListener('pointercancel', endDrag);
  
      window.addEventListener('wheel', (e: any) => {
        e.preventDefault();
        targetIndex += (e.deltaX || e.deltaY) * 0.003;
        clearTimeout(window._louverSnap);
        window._louverSnap = setTimeout(() => {
          targetIndex = Math.round(targetIndex);
        }, 250);
      }, { passive: false });
  
      window.addEventListener('keydown', (e: any) => {
        if (e.key === 'ArrowLeft') targetIndex = Math.round(targetIndex) - 1;
        if (e.key === 'ArrowRight') targetIndex = Math.round(targetIndex) + 1;
      });
  
      requestAnimationFrame(renderLouverGallery);
}
/* eslint-enable */

export function Carasol12({ className, style, width = '100%', height = '100%', imageBasePath = 'images' }: Carasol12Props) {
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

    initCarasol12Runtime({
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
      className={className ? `fv-carasols-carasol-12 ${className}` : 'fv-carasols-carasol-12'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <div className="viewport" id="viewport">
            <div className="gallery-track" id="track"></div>
          </div>
    </div>
  );
}

export default Carasol12;
