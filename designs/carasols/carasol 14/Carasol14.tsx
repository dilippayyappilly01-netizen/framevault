'use client';

/**
 * Accordion Frame Reticle Carousel
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Carasol14Props {
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
.fv-carasols-carasol-14 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-carasols-carasol-14 * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
      -webkit-user-select: none;
    }

    .fv-carasols-carasol-14 {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #0e0e0e;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Full-width Horizontal Strip Container */
    .fv-carasols-carasol-14 .accordion-strip {
      position: relative;
      width: 100%;
      height: 440px;
      display: flex;
      align-items: center;
      justify-content: stretch;
      overflow: hidden;
      background: #000;
    }

    .fv-carasols-carasol-14 .strip-item {
      position: relative;
      height: 100%;
      flex: 1 1 0%;
      overflow: hidden;
      cursor: pointer;
      transition: flex 0.55s cubic-bezier(0.22, 1, 0.36, 1), filter 0.4s ease;
      border-right: 1px solid rgba(0, 0, 0, 0.55);
    }

    .fv-carasols-carasol-14 .strip-item.active {
      flex: 0 0 440px;
      z-index: 5;
    }

    .fv-carasols-carasol-14 .strip-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      display: block;
      pointer-events: none;
      image-rendering: high-quality;
      image-rendering: -webkit-optimize-contrast;
      transform: scale(1.01) translateZ(0);
      transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
    }

    .fv-carasols-carasol-14 .strip-item.active img {
      transform: scale(1) translateZ(0);
    }

    /* Sliding White Reticle Frame + Top & Bottom Crosshair Lines */
    .fv-carasols-carasol-14 .reticle-overlay {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 440px;
      pointer-events: none;
      z-index: 20;
      will-change: transform;
      transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
    }

    .fv-carasols-carasol-14 .reticle-box {
      position: absolute;
      top: 50%;
      left: 0;
      width: 440px;
      height: 440px;
      transform: translateY(-50%);
      border: 1.5px solid rgba(255, 255, 255, 0.92);
      box-shadow: 0 0 30px rgba(0, 0, 0, 0.45);
    }

    .fv-carasols-carasol-14 .reticle-line-top {
      position: absolute;
      top: 0;
      left: 50%;
      width: 1.5px;
      height: calc(50vh - 220px);
      background: rgba(255, 255, 255, 0.88);
      transform: translateX(-50%);
    }

    .fv-carasols-carasol-14 .reticle-line-bottom {
      position: absolute;
      bottom: 0;
      left: 50%;
      width: 1.5px;
      height: calc(50vh - 220px);
      background: rgba(255, 255, 255, 0.88);
      transform: translateX(-50%);
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
function initCarasol14Runtime(__fvRuntime: ScopedRuntimeContext): void {
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
  
      const strip = document.getElementById('strip');
      const reticle = document.getElementById('reticle');
  
      const TOTAL = IMAGES.length;
      let activeIndex = 4; // Start near center like the video
      const itemEls: any[] = [];
  
      IMAGES.forEach((src: any, i: any) => {
        const el = document.createElement('div');
        el.className = 'strip-item' + (i === activeIndex ? ' active' : '');
        el.innerHTML = `<img src="${src}" alt="Portrait ${i + 1}" loading="eager" decoding="sync" fetchpriority="high">`;
  
        el.addEventListener('pointerenter', () => {
          setActive(i);
        });
        el.addEventListener('click', () => {
          setActive(i);
        });
  
        strip.appendChild(el);
        itemEls.push(el);
      });
  
      function computeReticlePosition(index?: any) {
        const vw = window.innerWidth;
        const expandedW = Math.min(440, vw * 0.42);
        const remainingW = vw - expandedW;
        const sliceW = remainingW / (TOTAL - 1);
        const leftX = index * sliceW;
  
        reticle.style.width = `${expandedW}px`;
        reticle.querySelector('.reticle-box').style.width = `${expandedW}px`;
        reticle.style.transform = `translate3d(${leftX.toFixed(1)}px, 0, 0)`;
  
        itemEls.forEach((el: any, idx: any) => {
          if (idx === index) {
            el.classList.add('active');
            el.style.flex = `0 0 ${expandedW}px`;
          } else {
            el.classList.remove('active');
            el.style.flex = '1 1 0%';
          }
        });
      }
  
      function setActive(index?: any) {
        activeIndex = ((index % TOTAL) + TOTAL) % TOTAL;
        computeReticlePosition(activeIndex);
      }
  
      window.addEventListener('resize', () => computeReticlePosition(activeIndex));
      window.addEventListener('keydown', (e: any) => {
        if (e.key === 'ArrowLeft') setActive(activeIndex - 1);
        if (e.key === 'ArrowRight') setActive(activeIndex + 1);
      });
  
      window.addEventListener('wheel', (e: any) => {
        e.preventDefault();
        if (window._wheelLock) return;
        window._wheelLock = true;
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        if (delta > 0) setActive(activeIndex + 1);
        else if (delta < 0) setActive(activeIndex - 1);
        setTimeout(() => { window._wheelLock = false; }, 160);
      }, { passive: false });
  
      // Initial position
      computeReticlePosition(activeIndex);
}
/* eslint-enable */

export function Carasol14({ className, style, width = '100%', height = '100%', imageBasePath = 'images' }: Carasol14Props) {
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

    initCarasol14Runtime({
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
      className={className ? `fv-carasols-carasol-14 ${className}` : 'fv-carasols-carasol-14'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <div className="accordion-strip" id="strip"></div>

          {/* Sliding White Frame & Vertical Crosshair Lines */}
          <div className="reticle-overlay" id="reticle">
            <div className="reticle-line-top"></div>
            <div className="reticle-box"></div>
            <div className="reticle-line-bottom"></div>
          </div>
    </div>
  );
}

export default Carasol14;
