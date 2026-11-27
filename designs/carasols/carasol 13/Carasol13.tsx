'use client';

/**
 * Spiral Vortex Photo Carousel
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Carasol13Props {
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
.fv-carasols-carasol-13 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-carasols-carasol-13 * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
      -webkit-user-select: none;
    }

    .fv-carasols-carasol-13 {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #000000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    .fv-carasols-carasol-13 .viewport {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: grab;
      touch-action: none;
      overflow: hidden;
    }

    .fv-carasols-carasol-13 .viewport:active {
      cursor: grabbing;
    }

    .fv-carasols-carasol-13 .vortex-stage {
      position: relative;
      width: 0;
      height: 0;
    }

    .fv-carasols-carasol-13 .vortex-card {
      position: absolute;
      width: 150px;
      height: 150px;
      margin-left: -75px;
      margin-top: -75px;
      border-radius: 18px;
      overflow: hidden;
      background: #1a1a1a;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.65);
      will-change: transform, opacity;
      transform-origin: center center;
    }

    .fv-carasols-carasol-13 .vortex-card img {
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

    /* Top-right playback pill matching video UI */
    .fv-carasols-carasol-13 .ui-controls {
      position: absolute;
      top: 18px;
      right: 18px;
      display: flex;
      gap: 8px;
      z-index: 50;
    }

    .fv-carasols-carasol-13 .ui-btn {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.14);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.18);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .fv-carasols-carasol-13 .ui-btn:hover {
      background: rgba(255, 255, 255, 0.25);
    }

    .fv-carasols-carasol-13 .ui-btn svg {
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
function initCarasol13Runtime(__fvRuntime: ScopedRuntimeContext): void {
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
      const pauseBtn = document.getElementById('pauseBtn');
      const pauseIcon = document.getElementById('pauseIcon');
      const reverseBtn = document.getElementById('reverseBtn');
  
      // 32 cards arranged along a golden-angle / logarithmic spiral vortex
      const TOTAL_CARDS = 32;
      const GOLDEN_ANGLE = 2.399963229728653; // ~137.508 deg in radians
      const cards: any[] = [];
  
      for (let i = 0; i < TOTAL_CARDS; i++) {
        const el = document.createElement('div');
        el.className = 'vortex-card';
        const src = IMAGES[i % IMAGES.length];
        el.innerHTML = `<img src="${src}" alt="Vortex Photo ${i + 1}" loading="eager" decoding="sync" fetchpriority="high">`;
        stage.appendChild(el);
        cards.push({ el, index: i });
      }
  
      let progress = 0;
      let targetProgress = 0;
      let direction = 1;
      let isPaused = false;
      let isDragging = false;
      let lastAngle = 0;
      let lastTime = 0;
      let velocity = 0;
  
      function getAngle(x: any, y?: any) {
        return Math.atan2(y - window.innerHeight * 0.5, x - window.innerWidth * 0.5);
      }
  
      function renderVortex() {
        if (!isDragging && !isPaused) {
          targetProgress += 0.0085 * direction;
        }
  
        if (!isDragging) {
          progress += (targetProgress - progress) * 0.1;
        } else {
          progress = targetProgress;
        }
  
        const maxR = Math.hypot(window.innerWidth, window.innerHeight) * 0.54;
  
        cards.forEach(({ el, index }: any) => {
          // Continuous normalized spiral position u in [0, TOTAL_CARDS)
          let u = (index + progress) % TOTAL_CARDS;
          if (u < 0) u += TOTAL_CARDS;
  
          const t = u / TOTAL_CARDS; // 0 at center pinhole, 1 at outer rim
          // Exponential/power radial curve matching the screen recording
          const radius = Math.pow(t, 1.55) * maxR;
          const theta = u * GOLDEN_ANGLE - progress * 0.45;
  
          const x = radius * Math.cos(theta);
          const y = radius * Math.sin(theta);
  
          // Scale grows proportionally with distance from center
          const scale = Math.max(0.04, Math.pow(t, 1.25) * 1.18);
          const rotDeg = ((theta * 180) / Math.PI) + 90;
  
          // Smooth fade in at dead center and out at extreme outer edge
          let opacity = 1;
          if (t < 0.05) opacity = t / 0.05;
          else if (t > 0.92) opacity = Math.max(0, 1 - (t - 0.92) / 0.08);
  
          el.style.opacity = opacity.toFixed(3);
          el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${rotDeg.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
          el.style.zIndex = Math.round(t * 100);
        });
  
        requestAnimationFrame(renderVortex);
      }
  
      viewport.addEventListener('pointerdown', (e: any) => {
        isDragging = true;
        lastAngle = getAngle(e.clientX, e.clientY);
        lastTime = performance.now();
        velocity = 0;
        viewport.setPointerCapture(e.pointerId);
      });
  
      viewport.addEventListener('pointermove', (e: any) => {
        if (!isDragging) return;
        const now = performance.now();
        const dt = Math.max(1, now - lastTime);
        const curAngle = getAngle(e.clientX, e.clientY);
        let dAngle = curAngle - lastAngle;
        if (dAngle > Math.PI) dAngle -= Math.PI * 2;
        if (dAngle < -Math.PI) dAngle += Math.PI * 2;
  
        const dStep = dAngle * 2.2;
        targetProgress += dStep;
        velocity = dStep / dt;
  
        lastAngle = curAngle;
        lastTime = now;
      });
  
      function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        targetProgress += velocity * 150;
      }
  
      viewport.addEventListener('pointerup', endDrag);
      viewport.addEventListener('pointercancel', endDrag);
  
      window.addEventListener('wheel', (e: any) => {
        e.preventDefault();
        targetProgress += (e.deltaY || e.deltaX) * 0.004;
      }, { passive: false });
  
      pauseBtn.addEventListener('click', () => {
        isPaused = !isPaused;
        if (isPaused) {
          pauseIcon.innerHTML = `<polygon points="8 5 19 12 8 19 8 5" fill="currentColor"></polygon>`;
        } else {
          pauseIcon.innerHTML = `<line x1="9" y1="6" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="18"></line>`;
        }
      });
  
      reverseBtn.addEventListener('click', () => {
        direction *= -1;
      });
  
      requestAnimationFrame(renderVortex);
}
/* eslint-enable */

export function Carasol13({ className, style, width = '100%', height = '100%', blendMode = "normal", transparentBackground = false, edgeFeather = 0, imageBasePath = 'images' }: Carasol13Props) {
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

    initCarasol13Runtime({
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
      className={className ? `fv-carasols-carasol-13 ${className}` : 'fv-carasols-carasol-13'}
      style={{ width, height, ...blendStyle, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <div className="ui-controls">
            <button className="ui-btn" id="reverseBtn" title="Reverse Spiral Direction">
              <svg viewBox="0 0 24 24">
                <polyline points="1 4 1 10 7 10"></polyline>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
              </svg>
            </button>
            <button className="ui-btn" id="pauseBtn" title="Pause / Resume">
              <svg viewBox="0 0 24 24" id="pauseIcon">
                <line x1="9" y1="6" x2="9" y2="18"></line>
                <line x1="15" y1="6" x2="15" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="viewport" id="viewport">
            <div className="vortex-stage" id="stage"></div>
          </div>
    </div>
  );
}

export default Carasol13;
