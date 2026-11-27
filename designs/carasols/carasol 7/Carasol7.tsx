'use client';

/**
 * 3D Stack Carousel
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Carasol7Props {
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
.fv-carasols-carasol-7 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-carasols-carasol-7 * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
      -webkit-user-select: none;
    }

    .fv-carasols-carasol-7 {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #ededed;
      color: #111;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      -webkit-font-smoothing: antialiased;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .fv-carasols-carasol-7 .carousel-wrapper {
      position: relative;
      width: 100%;
      height: 460px;
      display: flex;
      align-items: center;
      justify-content: center;
      perspective: 1100px;
      cursor: grab;
      touch-action: none;
    }

    .fv-carasols-carasol-7 .carousel-wrapper:active {
      cursor: grabbing;
    }

    .fv-carasols-carasol-7 .stack-stage {
      position: relative;
      width: 0;
      height: 0;
      transform-style: preserve-3d;
    }

    .fv-carasols-carasol-7 .stack-card {
      position: absolute;
      width: 280px;
      height: 380px;
      margin-left: -140px;
      margin-top: -190px;
      border-radius: 38px;
      overflow: hidden;
      background: #d8d8d8;
      box-shadow: 0 22px 48px rgba(0, 0, 0, 0.14), 0 3px 10px rgba(0, 0, 0, 0.05);
      will-change: transform, opacity;
      cursor: pointer;
    }

    .fv-carasols-carasol-7 .stack-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      display: block;
      pointer-events: none;
      image-rendering: -webkit-optimize-contrast;
      transform: translateZ(0);
    }

    /* Subtle frosted glass caption overlay on cards matching the recording aesthetic */
    .fv-carasols-carasol-7 .card-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      padding: 28px 24px;
      text-align: center;
      color: #fff;
      background: linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.48) 100%);
      pointer-events: none;
    }

    .fv-carasols-carasol-7 .card-sparkle {
      font-size: 13px;
      opacity: 0.85;
    }

    .fv-carasols-carasol-7 .card-caption {
      font-size: 11px;
      line-height: 1.45;
      color: rgba(255, 255, 255, 0.9);
      max-width: 210px;
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.45);
    }

    /* Compact Pill Indicator directly below center card */
    .fv-carasols-carasol-7 .pill-indicator {
      margin-top: 8px;
      height: 20px;
      padding: 0 8px;
      border-radius: 999px;
      background: #848484;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      z-index: 40;
      cursor: pointer;
    }

    .fv-carasols-carasol-7 .dot {
      width: 4px;
      height: 4px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.55);
      transition: width 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), background 0.25s ease;
    }

    .fv-carasols-carasol-7 .dot.active {
      width: 11px;
      background: #ffffff;
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
function initCarasol7Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame, imgBase } = __fvRuntime as any;
  const CARDS = [
        { src: `${imgBase}/1.jpg`, caption: 'Golden hour silhouette framed against calm coastal horizons.' },
        { src: `${imgBase}/2.jpg`, caption: 'Starlit nocturnal reflections across still wilderness waters.' },
        { src: `${imgBase}/3.jpg`, caption: 'Celestial Milky Way arch above ancient savanna plains.' },
        { src: `${imgBase}/4.jpg`, caption: 'Quiet rainforest bond captured in warm natural light.' },
        { src: `${imgBase}/5.jpg`, caption: 'Deep ocean sunbeams illuminating weightless marine motion.' },
        { src: `${imgBase}/6.jpg`, caption: 'Perspective framed in flight above open coastal cliffs.' },
        { src: `${imgBase}/7.jpg`, caption: 'Pastel dusk clouds mirrored along a quiet wooden pier.' },
        { src: `${imgBase}/8.jpg`, caption: 'Emerald canopy avenue leading to a solitary park bench.' },
        { src: `${imgBase}/9.jpg`, caption: 'Amber supermoon rising behind craggy mountain pines.' },
        { src: `${imgBase}/10.jpg`, caption: 'Crimson blossom tree reflected in glassy morning water.' },
        { src: `${imgBase}/11.jpg`, caption: 'Autumn leaves drifting across a sunlit cobblestone path.' },
        { src: `${imgBase}/12.jpg`, caption: 'Expressive wildlife portrait in vibrant woodland bokeh.' }
      ];
  
      const stage = document.getElementById('stage');
      const wrapper = document.getElementById('wrapper');
      const pillIndicator = document.getElementById('pillIndicator');
  
      const TOTAL = CARDS.length;
      const cardEls: any[] = [];
      const dotEls: any[] = [];
  
      CARDS.forEach((item: any, i: any) => {
        const el = document.createElement('div');
        el.className = 'stack-card';
        el.innerHTML = `
          <img src="${item.src}" alt="Slide ${i + 1}" loading="eager" decoding="sync" fetchpriority="high">
          <div class="card-overlay">
            <div class="card-sparkle">✦</div>
            <div class="card-caption">${item.caption}</div>
          </div>
        `;
        el.addEventListener('click', () => {
          if (!wasDragged) {
            // Shortest circular step to clicked card
            let diff = (i - Math.round(targetIndex)) % TOTAL;
            if (diff > TOTAL / 2) diff -= TOTAL;
            if (diff < -TOTAL / 2) diff += TOTAL;
            targetIndex = Math.round(targetIndex) + diff;
          }
        });
        stage.appendChild(el);
        cardEls.push({ el, index: i });
      });
  
      // 3 indicator dots in the compact pill matching the video
      for (let d = 0; d < 3; d++) {
        const dot = document.createElement('div');
        dot.className = 'dot' + (d === 0 ? ' active' : '');
        pillIndicator.appendChild(dot);
        dotEls.push(dot);
      }
  
      pillIndicator.addEventListener('click', () => {
        targetIndex = Math.round(targetIndex) + 1;
      });
  
      let currentIndex = 0;
      let targetIndex = 0;
      let isDragging = false;
      let wasDragged = false;
      let startX = 0;
      let lastX = 0;
      let lastTime = 0;
      let velocity = 0;
  
      // Auto-advance timer like in the video recording
      let autoTimer = setInterval(() => {
        if (!isDragging) {
          targetIndex = Math.round(targetIndex) + 1;
        }
      }, 2800);
  
      function resetAutoTimer() {
        clearInterval(autoTimer);
        autoTimer = setInterval(() => {
          if (!isDragging) {
            targetIndex = Math.round(targetIndex) + 1;
          }
        }, 2800);
      }
  
      function renderStack() {
        if (!isDragging) {
          currentIndex += (targetIndex - currentIndex) * 0.12;
        } else {
          currentIndex = targetIndex;
        }
  
        cardEls.forEach(({ el, index }: any) => {
          let delta = (index - currentIndex) % TOTAL;
          if (delta < -TOTAL / 2) delta += TOTAL;
          if (delta > TOTAL / 2) delta -= TOTAL;
  
          const absDelta = Math.abs(delta);
  
          // Only 3 cards visible at a time (center + immediate left & right neighbors)
          if (absDelta > 1.65) {
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
            return;
          }
  
          // Exact 3-card geometry from video:
          // Center card: x = 0, scale = 1, z = 0
          // Side cards (delta = ±1): x = ±168px, scale = 0.72, z = -120px
          const x = delta * 168;
          const z = -absDelta * 120;
          const scale = Math.max(0.55, 1 - absDelta * 0.28);
          const opacity = absDelta > 1 ? Math.max(0, 1 - (absDelta - 1) * 1.8) : 1;
  
          el.style.opacity = opacity.toFixed(3);
          el.style.pointerEvents = opacity > 0.3 ? 'auto' : 'none';
          el.style.transform = `translate3d(${x.toFixed(2)}px, 0, ${z.toFixed(2)}px) scale(${scale.toFixed(4)})`;
          el.style.zIndex = Math.round(100 - absDelta * 30);
        });
  
        // Update active pill dot (cycles 0, 1, 2)
        const activeMod = ((Math.round(currentIndex) % 3) + 3) % 3;
        dotEls.forEach((d: any, idx: any) => {
          d.classList.toggle('active', idx === activeMod);
        });
  
        requestAnimationFrame(renderStack);
      }
  
      wrapper.addEventListener('pointerdown', (e: any) => {
        isDragging = true;
        wasDragged = false;
        startX = e.clientX;
        lastX = e.clientX;
        lastTime = performance.now();
        velocity = 0;
        resetAutoTimer();
        wrapper.setPointerCapture(e.pointerId);
      });
  
      wrapper.addEventListener('pointermove', (e: any) => {
        if (!isDragging) return;
        if (Math.abs(e.clientX - startX) > 5) wasDragged = true;
  
        const now = performance.now();
        const dx = e.clientX - lastX;
        const dt = Math.max(1, now - lastTime);
  
        targetIndex -= dx / 220;
        velocity = -dx / dt;
  
        lastX = e.clientX;
        lastTime = now;
      });
  
      function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        targetIndex += velocity * 0.35;
        targetIndex = Math.round(targetIndex);
        resetAutoTimer();
      }
  
      wrapper.addEventListener('pointerup', endDrag);
      wrapper.addEventListener('pointercancel', endDrag);
  
      window.addEventListener('keydown', (e: any) => {
        resetAutoTimer();
        if (e.key === 'ArrowLeft') targetIndex = Math.round(targetIndex) - 1;
        if (e.key === 'ArrowRight') targetIndex = Math.round(targetIndex) + 1;
      });
  
      requestAnimationFrame(renderStack);
}
/* eslint-enable */

export function Carasol7({ className, style, width = '100%', height = '100%', blendMode = "normal", transparentBackground = false, edgeFeather = 0, imageBasePath = 'images' }: Carasol7Props) {
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

    initCarasol7Runtime({
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
      className={className ? `fv-carasols-carasol-7 ${className}` : 'fv-carasols-carasol-7'}
      style={{ width, height, ...blendStyle, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <div className="carousel-wrapper" id="wrapper">
            <div className="stack-stage" id="stage"></div>
          </div>

          <div className="pill-indicator" id="pillIndicator" title="Click to advance"></div>
    </div>
  );
}

export default Carasol7;
