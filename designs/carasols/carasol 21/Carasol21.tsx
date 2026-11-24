'use client';

/**
 * Carousel 21 — Interactive Vertical Strip Wave Magnification
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Carasol21Props {
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
.fv-carasols-carasol-21 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-carasols-carasol-21 *, .fv-carasols-carasol-21 *::before, .fv-carasols-carasol-21 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-carasols-carasol-21 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000000;
    font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-carasols-carasol-21 #stage {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: #000000;
  }

  .fv-carasols-carasol-21 #stripTrack {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 18px;
    height: 76vh;
    will-change: transform;
  }

  .fv-carasols-carasol-21 .strip {
    position: relative;
    overflow: hidden;
    background: #111;
    cursor: pointer;
    flex-shrink: 0;
    will-change: width, height, transform;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.75);
  }

  .fv-carasols-carasol-21 .strip img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    pointer-events: none;
    image-rendering: high-quality;
    -webkit-user-drag: none;
    will-change: transform, object-position;
    transform: scale(1.06);
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
function initCarasol21Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame, imgBase } = __fvRuntime as any;
  (() => {
    const stage = document.getElementById('stage');
    const track = document.getElementById('stripTrack');
  
    // All 12 high-resolution user photos from images/1.jpg..12.jpg
    const IMAGES = Array.from({ length: 12 }, (_: any, i: any) => `images/${i + 1}.jpg`);
  
    const strips: any[] = [];
  
    IMAGES.forEach((src: any, i: any) => {
      const strip = document.createElement('div');
      strip.className = 'strip';
  
      const img = document.createElement('img');
      img.src = src;
      img.alt = `Visual ${i + 1}`;
      img.loading = 'eager';
      img.decoding = 'sync';
      img.fetchPriority = 'high';
  
      strip.appendChild(img);
      track.appendChild(strip);
  
      strips.push({
        el: strip,
        img,
        index: i,
        curW: 164,
        curH: 480,
        targetW: 164,
        targetH: 480,
        curObjX: 50,
        targetObjX: 50
      });
    });
  
    let pointerX = -9999;
    let pointerY = -9999;
    let isHovering = false;
    let scrollOffset = 0;
    let targetScrollOffset = 0;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartOffset = 0;
  
    window.addEventListener('pointermove', (e: any) => {
      pointerX = e.clientX;
      pointerY = e.clientY;
      const vh = window.innerHeight;
      // Activate wave magnification when cursor is over the strip band
      isHovering = pointerY > vh * 0.12 && pointerY < vh * 0.88;
  
      if (isDragging) {
        const dx = e.clientX - dragStartX;
        targetScrollOffset = dragStartOffset + dx;
      }
    });
  
    window.addEventListener('pointerleave', () => {
      isHovering = false;
      pointerX = -9999;
    });
  
    window.addEventListener('pointerdown', (e: any) => {
      isDragging = true;
      dragStartX = e.clientX;
      dragStartOffset = targetScrollOffset;
    });
  
    window.addEventListener('pointerup', () => {
      isDragging = false;
    });
  
    window.addEventListener('wheel', (e: any) => {
      e.preventDefault();
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      targetScrollOffset -= delta * 0.85;
    }, { passive: false });
  
    // Clicking a strip smoothly centers it in the viewport
    strips.forEach((s: any, idx: any) => {
      s.el.addEventListener('click', () => {
        const mid = (strips.length - 1) * 0.5;
        targetScrollOffset = (mid - idx) * 182;
      });
    });
  
    function animate() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
  
      // Responsive base dimensions matching the recording's 7-visible vertical strips
      const baseW = Math.max(125, Math.min(182, vw * 0.115));
      const maxW = baseW * 1.62;
      const baseH = Math.round(vh * 0.57);
      const maxH = Math.round(vh * 0.72);
  
      // Clamp horizontal track scroll so all 12 high-res photos can be explored
      const maxScroll = Math.max(0, (strips.length * (baseW + 18) - vw * 0.78) * 0.55);
      targetScrollOffset = Math.max(-maxScroll, Math.min(maxScroll, targetScrollOffset));
      scrollOffset += (targetScrollOffset - scrollOffset) * 0.1;
  
      track.style.transform = `translate3d(${scrollOffset.toFixed(1)}px, 0, 0)`;
  
      // Measure strip centers to compute smooth Gaussian wave magnification
      const sigma = baseW * 1.65;
  
      for (let i = 0; i < strips.length; i++) {
        const s = strips[i];
        const rect = s.el.getBoundingClientRect();
        const centerX = rect.left + rect.width * 0.5;
  
        let influence = 0;
        if (isHovering && pointerX >= 0) {
          const dist = pointerX - centerX;
          influence = Math.exp(-(dist * dist) / (2 * sigma * sigma));
          // Subtle inner horizontal parallax as cursor moves across a strip
          const normDist = Math.max(-1, Math.min(1, dist / (baseW * 2.5)));
          s.targetObjX = 50 - normDist * 18;
        } else {
          s.targetObjX = 50;
        }
  
        s.targetW = baseW + (maxW - baseW) * influence;
        s.targetH = baseH + (maxH - baseH) * influence;
  
        s.curW += (s.targetW - s.curW) * 0.12;
        s.curH += (s.targetH - s.curH) * 0.12;
        s.curObjX += (s.targetObjX - s.curObjX) * 0.12;
  
        s.el.style.width = `${s.curW.toFixed(1)}px`;
        s.el.style.height = `${s.curH.toFixed(1)}px`;
        s.img.style.objectPosition = `${s.curObjX.toFixed(1)}% 50%`;
      }
  
      requestAnimationFrame(animate);
    }
  
    requestAnimationFrame(animate);
  })();
}
/* eslint-enable */

export function Carasol21({ className, style, width = '100%', height = '100%', imageBasePath = 'images' }: Carasol21Props) {
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

    initCarasol21Runtime({
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
      className={className ? `fv-carasols-carasol-21 ${className}` : 'fv-carasols-carasol-21'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <div id="stage">
          <div id="stripTrack"></div>
        </div>
    </div>
  );
}

export default Carasol21;
