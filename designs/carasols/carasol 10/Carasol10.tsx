'use client';

/**
 * 3D Cylindrical Drum Carousel
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Carasol10Props {
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
.fv-carasols-carasol-10 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-carasols-carasol-10 * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
      -webkit-user-select: none;
    }

    .fv-carasols-carasol-10 {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #ededed;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    .fv-carasols-carasol-10 .viewport {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      perspective: 1200px;
      perspective-origin: 50% 42%;
      cursor: grab;
      touch-action: none;
    }

    .fv-carasols-carasol-10 .viewport:active {
      cursor: grabbing;
    }

    .fv-carasols-carasol-10 .drum-ring {
      position: relative;
      width: 0;
      height: 0;
      transform-style: preserve-3d;
      transform: rotateX(-5deg);
      will-change: transform;
    }

    .fv-carasols-carasol-10 .drum-card {
      position: absolute;
      width: 240px;
      height: 240px;
      margin-left: -120px;
      margin-top: -120px;
      border-radius: 22px;
      overflow: hidden;
      background: #dcdcdc;
      box-shadow: 0 14px 34px rgba(0, 0, 0, 0.14);
      transform-style: preserve-3d;
      will-change: transform, filter;
    }

    .fv-carasols-carasol-10 .drum-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      display: block;
      pointer-events: none;
      image-rendering: -webkit-optimize-contrast;
      transform: translateZ(0);
    }

    /* Signature vertical fluted/ribbed glass line overlay seen in Carousel 10 */
    .fv-carasols-carasol-10 .drum-card::after {
      content: '';
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.08) 0px,
        rgba(255, 255, 255, 0.08) 1px,
        rgba(0, 0, 0, 0.14) 1px,
        rgba(0, 0, 0, 0.14) 2px,
        transparent 2px,
        transparent 7px
      );
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
function initCarasol10Runtime(__fvRuntime: ScopedRuntimeContext): void {
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
  
      const drum = document.getElementById('drum');
      const viewport = document.getElementById('viewport');
  
      const TOTAL = IMAGES.length; // 12 cards around the drum
      const STEP_RAD = (Math.PI * 2) / TOTAL;
      // Radius chosen so 12 cards of width 240px sit edge-to-edge in a tight cylinder
      const RADIUS = 458;
      const cards: any[] = [];
  
      IMAGES.forEach((src: any, i: any) => {
        const el = document.createElement('div');
        el.className = 'drum-card';
        el.innerHTML = `<img src="${src}" alt="Drum Slide ${i + 1}" loading="eager" decoding="sync" fetchpriority="high">`;
        drum.appendChild(el);
        cards.push({ el, index: i });
      });
  
      let currentAngle = 0;
      let targetAngle = 0;
      let isDragging = false;
      let lastX = 0;
      let lastTime = 0;
      let velocity = 0;
      let autoSpin = true;
  
      function renderDrum() {
        if (autoSpin && !isDragging) {
          targetAngle -= 0.0032;
        }
  
        if (!isDragging) {
          currentAngle += (targetAngle - currentAngle) * 0.11;
        } else {
          currentAngle = targetAngle;
        }
  
        cards.forEach(({ el, index }: any) => {
          const theta = index * STEP_RAD + currentAngle;
          const x = RADIUS * Math.sin(theta);
          const z = RADIUS * Math.cos(theta);
          const rotY = (theta * 180) / Math.PI;
  
          // Back cards are slightly dimmed so the front arc reads clearly
          const depthNorm = (Math.cos(theta) + 1) * 0.5; // 0 at back, 1 at front
          const brightness = 0.72 + 0.28 * depthNorm;
  
          el.style.transform = `translate3d(${x.toFixed(2)}px, 0, ${z.toFixed(2)}px) rotateY(${rotY.toFixed(2)}deg)`;
          el.style.filter = `brightness(${brightness.toFixed(2)})`;
          el.style.zIndex = Math.round(z + 1000);
        });
  
        requestAnimationFrame(renderDrum);
      }
  
      viewport.addEventListener('pointerdown', (e: any) => {
        isDragging = true;
        autoSpin = false;
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
  
        const dAngle = dx * 0.0038;
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
          if (!isDragging) autoSpin = true;
        }, 1800);
      }
  
      viewport.addEventListener('pointerup', endDrag);
      viewport.addEventListener('pointercancel', endDrag);
  
      window.addEventListener('wheel', (e: any) => {
        e.preventDefault();
        autoSpin = false;
        targetAngle += (e.deltaX || e.deltaY) * 0.0022;
        clearTimeout(window._drumTimer);
        window._drumTimer = setTimeout(() => { autoSpin = true; }, 1800);
      }, { passive: false });
  
      window.addEventListener('keydown', (e: any) => {
        autoSpin = false;
        if (e.key === 'ArrowLeft') targetAngle += STEP_RAD;
        if (e.key === 'ArrowRight') targetAngle -= STEP_RAD;
      });
  
      requestAnimationFrame(renderDrum);
}
/* eslint-enable */

export function Carasol10({ className, style, width = '100%', height = '100%', blendMode = "normal", transparentBackground = false, edgeFeather = 0, imageBasePath = 'images' }: Carasol10Props) {
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

    initCarasol10Runtime({
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
      className={className ? `fv-carasols-carasol-10 ${className}` : 'fv-carasols-carasol-10'}
      style={{ width, height, ...blendStyle, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <div className="viewport" id="viewport">
            <div className="drum-ring" id="drum"></div>
          </div>
    </div>
  );
}

export default Carasol10;
