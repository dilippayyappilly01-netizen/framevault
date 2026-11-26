'use client';

/**
 * NEON ARCHIVE N°06
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Carasol6Props {
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
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+JP:wght@700;900&display=swap"
];

const SCOPED_STYLES = `
.fv-carasols-carasol-6 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-carasols-carasol-6 * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
      -webkit-user-select: none;
    }

    .fv-carasols-carasol-6 {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #ededed;
      color: #181818;
      font-family: 'Inter', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    .fv-carasols-carasol-6 .top-right-label {
      position: absolute;
      top: 32px;
      right: 40px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      color: #222;
      z-index: 40;
      pointer-events: none;
    }

    .fv-carasols-carasol-6 .bottom-right-label {
      position: absolute;
      bottom: 24px;
      right: 32px;
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.06em;
      color: #666;
      z-index: 40;
      pointer-events: none;
    }

    .fv-carasols-carasol-6 .viewport {
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

    .fv-carasols-carasol-6 .viewport:active {
      cursor: grabbing;
    }

    .fv-carasols-carasol-6 .stack-stage {
      position: relative;
      width: 0;
      height: 0;
    }

    .fv-carasols-carasol-6 .diag-card {
      position: absolute;
      width: 260px;
      height: 330px;
      margin-left: -130px;
      margin-top: -165px;
      transform-origin: center center;
      will-change: transform, opacity, filter;
    }

    /* RGB Chromatic Ghost Layers (visible when card accelerates to top-left) */
    .fv-carasols-carasol-6 .ghost-layer {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      opacity: 0;
      mix-blend-mode: screen;
      will-change: transform, opacity;
    }

    .fv-carasols-carasol-6 .ghost-cyan {
      background: #00f0ff;
    }

    .fv-carasols-carasol-6 .ghost-magenta {
      background: #ff006a;
    }

    .fv-carasols-carasol-6 .card-main {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #111;
      box-shadow: 0 18px 42px rgba(0, 0, 0, 0.16);
    }

    .fv-carasols-carasol-6 .card-main img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      display: block;
      pointer-events: none;
      image-rendering: -webkit-optimize-contrast;
      transform: translateZ(0);
    }

    /* Subtle editorial typography overlay matching Neon Archive N°06 */
    .fv-carasols-carasol-6 .card-meta-top {
      position: absolute;
      top: 14px;
      left: 16px;
      right: 16px;
      display: flex;
      justify-content: space-between;
      font-size: 8px;
      font-weight: 700;
      letter-spacing: 0.12em;
      color: rgba(255, 255, 255, 0.9);
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.55);
      pointer-events: none;
    }

    .fv-carasols-carasol-6 .card-jp-badge {
      position: absolute;
      bottom: 16px;
      left: 16px;
      font-family: 'Noto Sans JP', sans-serif;
      font-size: 32px;
      font-weight: 900;
      line-height: 1.05;
      color: #ffffff;
      text-shadow: 0 2px 12px rgba(0, 0, 0, 0.65);
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
function initCarasol6Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame, imgBase } = __fvRuntime as any;
  const SLIDES = [
        { src: `${imgBase}/1.jpg`, tag: 'LIGHT STUDIES', num: '01', jp: '光の\n速さで' },
        { src: `${imgBase}/2.jpg`, tag: 'NIGHT SERIES', num: '02', jp: '夜明け' },
        { src: `${imgBase}/3.jpg`, tag: 'SHOWCASE', num: '03', jp: '東京\n大阪' },
        { src: `${imgBase}/4.jpg`, tag: 'ARCHIVE', num: '04', jp: '風' },
        { src: `${imgBase}/5.jpg`, tag: 'DEEP BLUE', num: '05', jp: '海流' },
        { src: `${imgBase}/6.jpg`, tag: 'VISION', num: '06', jp: '視点' },
        { src: `${imgBase}/7.jpg`, tag: 'HORIZON', num: '07', jp: '静寂' },
        { src: `${imgBase}/8.jpg`, tag: 'BOTANICAL', num: '08', jp: '緑陰' },
        { src: `${imgBase}/9.jpg`, tag: 'LUNAR', num: '09', jp: '月光' },
        { src: `${imgBase}/10.jpg`, tag: 'BLOSSOM', num: '10', jp: '花' },
        { src: `${imgBase}/11.jpg`, tag: 'AUTUMN', num: '11', jp: '紅葉' },
        { src: `${imgBase}/12.jpg`, tag: 'WILDLIFE', num: '12', jp: '星' }
      ];
  
      const stage = document.getElementById('stage');
      const viewport = document.getElementById('viewport');
  
      const TOTAL = SLIDES.length;
      const cards: any[] = [];
  
      SLIDES.forEach((slide: any, i: any) => {
        const el = document.createElement('div');
        el.className = 'diag-card';
        el.innerHTML = `
          <div class="ghost-layer ghost-cyan"></div>
          <div class="ghost-layer ghost-magenta"></div>
          <div class="card-main">
            <img src="${slide.src}" alt="Archive ${slide.num}" loading="eager" decoding="sync" fetchpriority="high">
            <div class="card-meta-top">
              <span>${slide.tag}</span>
              <span>${slide.num}</span>
            </div>
            <div class="card-jp-badge">${slide.jp.replace('\n', '<br>')}</div>
          </div>
        `;
        stage.appendChild(el);
        cards.push({
          el,
          cyan: el.querySelector('.ghost-cyan'),
          magenta: el.querySelector('.ghost-magenta'),
          index: i
        });
      });
  
      let progress = 0;
      let targetProgress = 0;
      let isDragging = false;
      let lastX = 0;
      let lastY = 0;
      let lastTime = 0;
      let velocity = 0;
      let autoPlay = true;
  
      function renderDiagonalStack() {
        if (autoPlay && !isDragging) {
          targetProgress += 0.0055;
        }
  
        if (!isDragging) {
          progress += (targetProgress - progress) * 0.11;
        } else {
          progress = targetProgress;
        }
  
        cards.forEach(({ el, cyan, magenta, index }: any) => {
          // Compute wrapped distance from active center card [-TOTAL/2, +TOTAL/2]
          let delta = (index - progress) % TOTAL;
          if (delta < -TOTAL / 2) delta += TOTAL;
          if (delta > TOTAL / 2) delta -= TOTAL;
  
          // Visible range along the diagonal: from -2.2 (top-left exit) to +3.2 (bottom-right entry)
          if (delta < -2.3 || delta > 3.3) {
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
            return;
          }
  
          // Diagonal trajectory:
          // delta > 0 is bottom-right; delta = 0 is dead center; delta < 0 is top-left
          const x = delta * 245;
          const y = delta * 155;
  
          // Rotation:
          // Center card (delta = 0) is upright (0 deg).
          // Cards at bottom-right and top-left tilt counter-clockwise (-24 deg) matching the video!
          const distFromCenter = Math.min(1, Math.abs(delta));
          let rot = 0;
          if (delta > 0) {
            rot = -21 * Math.pow(Math.min(1, delta / 1.1), 0.85);
          } else {
            rot = -32 * Math.pow(Math.min(1, -delta / 1.1), 0.85);
          }
  
          // Scale & chromatic aberration when exiting toward top-left (delta < -0.25)
          let scale = 1;
          let blurPx = 0;
          let ghostAmt = 0;
  
          if (delta < -0.2) {
            const exitFactor = Math.min(1.5, Math.abs(delta + 0.2));
            scale = 1 + exitFactor * 0.26;
            blurPx = exitFactor * 3.2;
            ghostAmt = Math.min(0.75, exitFactor * 0.65);
          }
  
          const opacity = delta < -1.5 ? Math.max(0, 1 - (-delta - 1.5) * 1.4) : 1;
  
          el.style.opacity = opacity.toFixed(3);
          el.style.pointerEvents = opacity > 0.2 ? 'auto' : 'none';
          el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${rot.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
          el.style.filter = blurPx > 0.2 ? `blur(${blurPx.toFixed(2)}px)` : 'none';
          // Cards exiting to top-left stack on top of earlier ones just like the video
          el.style.zIndex = Math.round(100 - delta * 15);
  
          if (ghostAmt > 0.02) {
            cyan.style.opacity = ghostAmt.toFixed(2);
            cyan.style.transform = `translate3d(${(ghostAmt * 18).toFixed(1)}px, ${(-ghostAmt * 12).toFixed(1)}px, 0)`;
            magenta.style.opacity = (ghostAmt * 0.85).toFixed(2);
            magenta.style.transform = `translate3d(${(-ghostAmt * 16).toFixed(1)}px, ${(ghostAmt * 10).toFixed(1)}px, 0)`;
          } else {
            cyan.style.opacity = '0';
            magenta.style.opacity = '0';
          }
        });
  
        requestAnimationFrame(renderDiagonalStack);
      }
  
      viewport.addEventListener('pointerdown', (e: any) => {
        isDragging = true;
        autoPlay = false;
        lastX = e.clientX;
        lastY = e.clientY;
        lastTime = performance.now();
        velocity = 0;
        viewport.setPointerCapture(e.pointerId);
      });
  
      viewport.addEventListener('pointermove', (e: any) => {
        if (!isDragging) return;
        const now = performance.now();
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        const dt = Math.max(1, now - lastTime);
  
        const dProg = (-dx * 0.0032) + (-dy * 0.0022);
        targetProgress += dProg;
        velocity = dProg / dt;
  
        lastX = e.clientX;
        lastY = e.clientY;
        lastTime = now;
      });
  
      function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        targetProgress += velocity * 150;
        targetProgress = Math.round(targetProgress);
        setTimeout(() => {
          if (!isDragging) autoPlay = true;
        }, 2200);
      }
  
      viewport.addEventListener('pointerup', endDrag);
      viewport.addEventListener('pointercancel', endDrag);
  
      window.addEventListener('wheel', (e: any) => {
        e.preventDefault();
        autoPlay = false;
        targetProgress += (e.deltaY || e.deltaX) * 0.0025;
        clearTimeout(window._diagTimer);
        window._diagTimer = setTimeout(() => {
          targetProgress = Math.round(targetProgress);
          autoPlay = true;
        }, 1500);
      }, { passive: false });
  
      window.addEventListener('keydown', (e: any) => {
        autoPlay = false;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') targetProgress = Math.round(targetProgress) - 1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') targetProgress = Math.round(targetProgress) + 1;
      });
  
      requestAnimationFrame(renderDiagonalStack);
}
/* eslint-enable */

export function Carasol6({ className, style, width = '100%', height = '100%', imageBasePath = 'images' }: Carasol6Props) {
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

    initCarasol6Runtime({
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
      className={className ? `fv-carasols-carasol-6 ${className}` : 'fv-carasols-carasol-6'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <div className="top-right-label">NEON ARCHIVE N°06</div>
          <div className="bottom-right-label">35.202° N / 139.692° E</div>

          <div className="viewport" id="viewport">
            <div className="stack-stage" id="stage"></div>
          </div>
    </div>
  );
}

export default Carasol6;
