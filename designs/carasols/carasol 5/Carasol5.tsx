'use client';

/**
 * LIGHT / WAVE / SPACE / FUTURE — Concave Panorama
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Carasol5Props {
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
  "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap"
];

const SCOPED_STYLES = `
.fv-carasols-carasol-5 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-carasols-carasol-5 * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
      -webkit-user-select: none;
    }

    .fv-carasols-carasol-5 {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #ededed;
      color: #222;
      font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    /* Four Corner Labels matching the video */
    .fv-carasols-carasol-5 .corner {
      position: absolute;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: #2b2b2b;
      z-index: 30;
      pointer-events: none;
    }

    .fv-carasols-carasol-5 .corner-tl { top: 34px; left: 42px; }
    .fv-carasols-carasol-5 .corner-tr { top: 34px; right: 42px; }
    .fv-carasols-carasol-5 .corner-bl { bottom: 34px; left: 42px; }
    .fv-carasols-carasol-5 .corner-br { bottom: 34px; right: 42px; }

    /* 3D Concave Cylindrical Viewport */
    .fv-carasols-carasol-5 .viewport {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      perspective: 720px;
      perspective-origin: 50% 50%;
      cursor: grab;
      touch-action: none;
      overflow: hidden;
    }

    .fv-carasols-carasol-5 .viewport:active {
      cursor: grabbing;
    }

    .fv-carasols-carasol-5 .cylinder-stage {
      position: relative;
      width: 0;
      height: 0;
      transform-style: preserve-3d;
      will-change: transform;
    }

    .fv-carasols-carasol-5 .pano-card {
      position: absolute;
      width: 156px;
      height: 210px;
      margin-left: -78px;
      margin-top: -105px;
      border-radius: 10px;
      overflow: hidden;
      background: #dcdcdc;
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      will-change: transform, opacity;
    }

    .fv-carasols-carasol-5 .pano-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      display: block;
      pointer-events: none;
      image-rendering: -webkit-optimize-contrast;
      transform: translateZ(0);
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
function initCarasol5Runtime(__fvRuntime: ScopedRuntimeContext): void {
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
  
      const stage = document.getElementById('stage');
      const viewport = document.getElementById('viewport');
  
      // 24 cards around the full interior of the concave cylinder
      const TOTAL_SLOTS = 24;
      const STEP_RAD = (Math.PI * 2) / TOTAL_SLOTS;
      const RADIUS = 640;
      const cards: any[] = [];
  
      for (let i = 0; i < TOTAL_SLOTS; i++) {
        const el = document.createElement('div');
        el.className = 'pano-card';
        const src = IMAGES[i % IMAGES.length];
        el.innerHTML = `<img src="${src}" alt="Panorama ${i + 1}" loading="eager" decoding="sync" fetchpriority="high">`;
        stage.appendChild(el);
        cards.push({ el, index: i });
      }
  
      let currentAngle = 0;
      let targetAngle = 0;
      let isDragging = false;
      let lastX = 0;
      let lastTime = 0;
      let velocity = 0;
      let autoDrift = true;
  
      function renderPanorama() {
        if (autoDrift && !isDragging) {
          targetAngle -= 0.0016;
        }
  
        if (!isDragging) {
          currentAngle += (targetAngle - currentAngle) * 0.1;
        } else {
          currentAngle = targetAngle;
        }
  
        cards.forEach(({ el, index }: any) => {
          // Normalize angle to [-PI, +PI] where 0 is dead-center at the back of the concave arc
          let theta = (index * STEP_RAD + currentAngle) % (Math.PI * 2);
          if (theta > Math.PI) theta -= Math.PI * 2;
          if (theta < -Math.PI) theta += Math.PI * 2;
  
          // Only show the front concave half-cylinder [-PI * 0.48, +PI * 0.48]
          if (Math.abs(theta) > Math.PI * 0.48) {
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
            return;
          }
  
          // Concave cylinder coordinates:
          // At theta = 0 (center), z is far back (-360px).
          // As |theta| approaches PI/2 (left & right screen edges), z comes forward toward the camera (+280px)!
          const x = RADIUS * Math.sin(theta);
          const z = 280 - RADIUS * Math.cos(theta);
          const rotY = (-theta * 180) / Math.PI;
  
          el.style.opacity = '1';
          el.style.pointerEvents = 'auto';
          el.style.transform = `translate3d(${x.toFixed(2)}px, 0, ${z.toFixed(2)}px) rotateY(${rotY.toFixed(2)}deg)`;
          el.style.zIndex = Math.round(z + 1000);
        });
  
        requestAnimationFrame(renderPanorama);
      }
  
      viewport.addEventListener('pointerdown', (e: any) => {
        isDragging = true;
        autoDrift = false;
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
  
        const dAngle = dx * 0.0022;
        targetAngle += dAngle;
        velocity = dAngle / dt;
  
        lastX = e.clientX;
        lastTime = now;
      });
  
      function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        targetAngle += velocity * 160;
        setTimeout(() => {
          if (!isDragging) autoDrift = true;
        }, 2000);
      }
  
      viewport.addEventListener('pointerup', endDrag);
      viewport.addEventListener('pointercancel', endDrag);
  
      window.addEventListener('wheel', (e: any) => {
        e.preventDefault();
        autoDrift = false;
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        targetAngle -= delta * 0.0012;
        clearTimeout(window._panoTimer);
        window._panoTimer = setTimeout(() => { autoDrift = true; }, 2000);
      }, { passive: false });
  
      window.addEventListener('keydown', (e: any) => {
        if (e.key === 'ArrowLeft') targetAngle += STEP_RAD;
        if (e.key === 'ArrowRight') targetAngle -= STEP_RAD;
      });
  
      requestAnimationFrame(renderPanorama);
}
/* eslint-enable */

export function Carasol5({ className, style, width = '100%', height = '100%', imageBasePath = 'images' }: Carasol5Props) {
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

    initCarasol5Runtime({
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
      className={className ? `fv-carasols-carasol-5 ${className}` : 'fv-carasols-carasol-5'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <div className="corner corner-tl">LIGHT</div>
          <div className="corner corner-tr">WAVE</div>
          <div className="corner corner-bl">SPACE</div>
          <div className="corner corner-br">FUTURE</div>

          <div className="viewport" id="viewport">
            <div className="cylinder-stage" id="stage"></div>
          </div>
    </div>
  );
}

export default Carasol5;
