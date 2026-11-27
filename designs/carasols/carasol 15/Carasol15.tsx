'use client';

/**
 * Vertical Perspective Cascade Carousel
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Carasol15Props {
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
.fv-carasols-carasol-15 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-carasols-carasol-15 * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
      -webkit-user-select: none;
    }

    .fv-carasols-carasol-15 {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #000000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    .fv-carasols-carasol-15 .viewport {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      perspective: 750px;
      perspective-origin: 50% 50%;
      cursor: ns-resize;
      touch-action: none;
      overflow: hidden;
    }

    .fv-carasols-carasol-15 .cascade-stage {
      position: relative;
      width: 0;
      height: 0;
      transform-style: preserve-3d;
      will-change: transform;
    }

    /* Wide landscape cards tilted backward at top / forward at bottom so they form perspective trapezoids */
    .fv-carasols-carasol-15 .cascade-card {
      position: absolute;
      width: 720px;
      height: 210px;
      margin-left: -360px;
      margin-top: -105px;
      overflow: hidden;
      background: #141414;
      box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.72), 0 12px 32px rgba(0, 0, 0, 0.65);
      transform-style: preserve-3d;
      will-change: transform, opacity;
      /* Trapezoidal clip matching the recording's inverted-trapezoid louver geometry */
      clip-path: polygon(0% 0%, 100% 0%, 91.5% 100%, 8.5% 100%);
    }

    .fv-carasols-carasol-15 .cascade-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      display: block;
      pointer-events: none;
      image-rendering: high-quality;
      image-rendering: -webkit-optimize-contrast;
      transform: translateZ(0);
    }

    .fv-carasols-carasol-15 .ui-btn {
      position: absolute;
      top: 18px;
      right: 18px;
      width: 34px;
      height: 34px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.14);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.18);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 40;
    }

    .fv-carasols-carasol-15 .ui-btn svg {
      width: 15px;
      height: 15px;
      stroke: currentColor;
      stroke-width: 2;
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
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
function initCarasol15Runtime(__fvRuntime: ScopedRuntimeContext): void {
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
      const reverseBtn = document.getElementById('reverseBtn');
  
      const TOTAL = IMAGES.length;
      const cards: any[] = [];
  
      IMAGES.forEach((src: any, i: any) => {
        const el = document.createElement('div');
        el.className = 'cascade-card';
        el.innerHTML = `<img src="${src}" alt="Cascade ${i + 1}" loading="eager" decoding="sync" fetchpriority="high">`;
        stage.appendChild(el);
        cards.push({ el, index: i });
      });
  
      let progress = 0;
      let targetProgress = 0;
      let dir = 1;
      let isDragging = false;
      let lastY = 0;
      let lastTime = 0;
      let velocity = 0;
  
      function renderCascade() {
        if (!isDragging) {
          targetProgress += 0.008 * dir;
          progress += (targetProgress - progress) * 0.12;
        } else {
          progress = targetProgress;
        }
  
        const halfH = window.innerHeight * 0.56;
        const visibleCount = 6.5; // 6-7 stacked trapezoidal slats visible from top to bottom
  
        cards.forEach(({ el, index }: any) => {
          // Normalized vertical slot u in [0, TOTAL)
          let u = (index + progress) % TOTAL;
          if (u < 0) u += TOTAL;
  
          if (u > visibleCount) {
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
            return;
          }
  
          const t = u / visibleCount; // 0 at top of stack, 1 at bottom of stack
          // Non-linear perspective spacing: cards at bottom are larger and spaced further apart than cards at top
          const y = -halfH * 0.92 + Math.pow(t, 1.28) * (halfH * 1.88);
          const scale = 0.56 + Math.pow(t, 1.15) * 0.58;
          const z = t * 140 - 70;
  
          let opacity = 1;
          if (t < 0.06) opacity = t / 0.06;
          else if (t > 0.92) opacity = Math.max(0, 1 - (t - 0.92) / 0.08);
  
          el.style.opacity = opacity.toFixed(3);
          el.style.pointerEvents = 'auto';
          el.style.transform = `translate3d(0, ${y.toFixed(2)}px, ${z.toFixed(2)}px) scale(${scale.toFixed(4)})`;
          el.style.zIndex = Math.round(t * 100);
        });
  
        requestAnimationFrame(renderCascade);
      }
  
      viewport.addEventListener('pointerdown', (e: any) => {
        isDragging = true;
        lastY = e.clientY;
        lastTime = performance.now();
        velocity = 0;
        viewport.setPointerCapture(e.pointerId);
      });
  
      viewport.addEventListener('pointermove', (e: any) => {
        if (!isDragging) return;
        const now = performance.now();
        const dy = e.clientY - lastY;
        const dt = Math.max(1, now - lastTime);
  
        const dStep = dy / 140;
        targetProgress += dStep;
        velocity = dStep / dt;
  
        lastY = e.clientY;
        lastTime = now;
      });
  
      function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        targetProgress += velocity * 140;
      }
  
      viewport.addEventListener('pointerup', endDrag);
      viewport.addEventListener('pointercancel', endDrag);
  
      window.addEventListener('wheel', (e: any) => {
        e.preventDefault();
        targetProgress += e.deltaY * 0.0035;
      }, { passive: false });
  
      reverseBtn.addEventListener('click', () => {
        dir *= -1;
      });
  
      requestAnimationFrame(renderCascade);
}
/* eslint-enable */

export function Carasol15({ className, style, width = '100%', height = '100%', blendMode = "normal", transparentBackground = false, edgeFeather = 0, imageBasePath = 'images' }: Carasol15Props) {
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

    initCarasol15Runtime({
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
      className={className ? `fv-carasols-carasol-15 ${className}` : 'fv-carasols-carasol-15'}
      style={{ width, height, ...blendStyle, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <button className="ui-btn" id="reverseBtn" title="Reverse Flow Direction">
            <svg viewBox="0 0 24 24">
              <polyline points="1 4 1 10 7 10"></polyline>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
            </svg>
          </button>

          <div className="viewport" id="viewport">
            <div className="cascade-stage" id="stage"></div>
          </div>
    </div>
  );
}

export default Carasol15;
