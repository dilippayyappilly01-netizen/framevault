'use client';

/**
 * Visual Archive — 16 works · Edition 01
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Carasol3Props {
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

const FONT_STYLESHEETS: readonly string[] = [
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
];

const SCOPED_STYLES = `
.fv-carasols-carasol-3 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-carasols-carasol-3 * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
      -webkit-user-select: none;
    }

    .fv-carasols-carasol-3 {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #ededed;
      color: #222;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    /* Header & Footer positioned matching the screen recording */
    .fv-carasols-carasol-3 header {
      position: absolute;
      top: 17vh;
      left: 0;
      width: 100%;
      padding: 0 48px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 0.01em;
      color: #333;
      z-index: 30;
      pointer-events: none;
    }

    .fv-carasols-carasol-3 footer {
      position: absolute;
      bottom: 17vh;
      left: 0;
      width: 100%;
      padding: 0 48px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      font-weight: 400;
      letter-spacing: 0.01em;
      color: #555;
      z-index: 30;
      pointer-events: none;
    }

    /* Ring Stage */
    .fv-carasols-carasol-3 .viewport {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: grab;
      touch-action: none;
    }

    .fv-carasols-carasol-3 .viewport:active {
      cursor: grabbing;
    }

    .fv-carasols-carasol-3 .ring-container {
      position: relative;
      width: 0;
      height: 0;
    }

    .fv-carasols-carasol-3 .ring-item {
      position: absolute;
      width: 140px;
      height: 140px;
      margin-left: -70px;
      margin-top: -70px;
      overflow: hidden;
      background: #dcdcdc;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.09);
      will-change: transform;
      transform-origin: center center;
    }

    .fv-carasols-carasol-3 .ring-item img {
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
function initCarasol3Runtime(__fvRuntime: ScopedRuntimeContext): void {
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
  
      const TOTAL_ITEMS = 16;
      const ring = document.getElementById('ring');
      const viewport = document.getElementById('viewport');
  
      const items: any[] = [];
      for (let i = 0; i < TOTAL_ITEMS; i++) {
        const el = document.createElement('div');
        el.className = 'ring-item';
        const src = IMAGES[i % IMAGES.length];
        el.innerHTML = `<img src="${src}" alt="Work ${i + 1}" loading="eager" decoding="sync" fetchpriority="high">`;
        ring.appendChild(el);
        items.push({ el, index: i });
      }
  
      let angleOffset = 0;
      let targetAngle = 0;
      let isPaused = false;
      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let pointerDownX = 0;
      let pointerDownY = 0;
      let lastAngle = 0;
      let angularVelocity = 0;
      let lastTime = 0;
  
      function getPointerAngle(clientX: any, clientY?: any) {
        const cx = window.innerWidth * 0.5;
        const cy = window.innerHeight * 0.5;
        return Math.atan2(clientY - cy, clientX - cx);
      }
  
      function renderRing() {
        if (!isDragging && !isPaused) {
          targetAngle -= 0.0042; // Smooth counter-clockwise orbit matching video
        }
  
        if (!isDragging) {
          angleOffset += (targetAngle - angleOffset) * 0.12;
        } else {
          angleOffset = targetAngle;
        }
  
        const radius = Math.min(window.innerWidth, window.innerHeight) * 0.235;
        const step = (Math.PI * 2) / TOTAL_ITEMS;
  
        items.forEach(({ el, index }: any) => {
          const theta = index * step + angleOffset;
          const x = radius * Math.cos(theta);
          const y = radius * Math.sin(theta);
  
          // Normalized horizontal position: 1 at right (3 o'clock), 0 at left (9 o'clock)
          const t = (Math.cos(theta) + 1) * 0.5;
          // Scale ranges from 0.055 on far left up to 1.05 on far right
          const scale = 0.055 + 0.995 * Math.pow(t, 1.75);
  
          el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
          el.style.zIndex = Math.round(t * 100);
        });
  
        requestAnimationFrame(renderRing);
      }
  
      viewport.addEventListener('pointerdown', (e: any) => {
        isDragging = true;
        pointerDownX = e.clientX;
        pointerDownY = e.clientY;
        lastAngle = getPointerAngle(e.clientX, e.clientY);
        lastTime = performance.now();
        angularVelocity = 0;
        viewport.setPointerCapture(e.pointerId);
      });
  
      viewport.addEventListener('pointermove', (e: any) => {
        if (!isDragging) return;
        const now = performance.now();
        const dt = Math.max(1, now - lastTime);
  
        const curAngle = getPointerAngle(e.clientX, e.clientY);
        let dAngle = curAngle - lastAngle;
        // Wrap angle delta across -PI / +PI boundary
        if (dAngle > Math.PI) dAngle -= Math.PI * 2;
        if (dAngle < -Math.PI) dAngle += Math.PI * 2;
  
        targetAngle += dAngle;
        angularVelocity = dAngle / dt;
  
        lastAngle = curAngle;
        lastTime = now;
      });
  
      function endDrag(e?: any) {
        if (!isDragging) return;
        isDragging = false;
  
        const moveDist = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY);
        if (moveDist < 6) {
          // Tap to pause / resume
          isPaused = !isPaused;
        } else {
          targetAngle += angularVelocity * 160;
        }
      }
  
      viewport.addEventListener('pointerup', endDrag);
      viewport.addEventListener('pointercancel', endDrag);
  
      window.addEventListener('wheel', (e: any) => {
        e.preventDefault();
        targetAngle += (e.deltaY || e.deltaX) * 0.0018;
      }, { passive: false });
  
      requestAnimationFrame(renderRing);
}
/* eslint-enable */

export function Carasol3({ className, style, width = '100%', height = '100%', blendMode = "normal", transparentBackground = false, edgeFeather = 0, imageBasePath = 'images' }: Carasol3Props) {
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

    initCarasol3Runtime({
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
      className={className ? `fv-carasols-carasol-3 ${className}` : 'fv-carasols-carasol-3'}
      style={{ width, height, ...blendStyle, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <header>
            <div>Visual Archive</div>
            <div>16 works · Edition 01</div>
          </header>

          <div className="viewport" id="viewport">
            <div className="ring-container" id="ring"></div>
          </div>

          <footer>
            <div>Drag to explore</div>
            <div id="pauseLabel">Tap to pause / resume</div>
          </footer>
    </div>
  );
}

export default Carasol3;
