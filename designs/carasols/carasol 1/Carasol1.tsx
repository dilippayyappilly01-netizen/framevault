'use client';

/**
 * REEL FLUX — Archive N° 07
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Carasol1Props {
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
  "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap"
];

const SCOPED_STYLES = `
.fv-carasols-carasol-1 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-carasols-carasol-1 * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
      -webkit-user-select: none;
    }

    .fv-carasols-carasol-1 {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #ededed;
      color: #1a1a1a;
      font-family: 'Space Grotesk', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Top Header */
    .fv-carasols-carasol-1 header {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      padding: 26px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #222;
      z-index: 50;
      pointer-events: none;
    }

    .fv-carasols-carasol-1 .header-plus {
      font-size: 15px;
      font-weight: 400;
      color: #444;
    }

    /* Bottom Footer */
    .fv-carasols-carasol-1 footer {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      padding: 26px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #333;
      z-index: 50;
      pointer-events: none;
    }

    .fv-carasols-carasol-1 .footer-photos {
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: none;
      font-size: 12px;
      color: #222;
    }

    /* Main Interactive Stage */
    .fv-carasols-carasol-1 .reel-viewport {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      perspective: 780px;
      perspective-origin: 50% 50%;
      cursor: grab;
      touch-action: none;
      overflow: hidden;
    }

    .fv-carasols-carasol-1 .reel-viewport:active {
      cursor: grabbing;
    }

    /* 3D Concave Strip World */
    .fv-carasols-carasol-1 .reel-strip {
      position: relative;
      width: 0;
      height: 0;
      transform-style: preserve-3d;
      will-change: transform;
    }

    /* High-Resolution Photo Cards */
    .fv-carasols-carasol-1 .reel-card {
      position: absolute;
      width: 520px;
      height: 540px;
      margin-left: -260px;
      margin-top: -270px;
      overflow: hidden;
      background: #dcdcdc;
      border-left: 1.5px solid #ededed;
      border-right: 1.5px solid #ededed;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      will-change: transform;
    }

    .fv-carasols-carasol-1 .reel-card img {
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

    /* Subtle editorial number badge on each photo */
    .fv-carasols-carasol-1 .card-index {
      position: absolute;
      bottom: 84px;
      right: 22px;
      background: rgba(15, 15, 15, 0.62);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      color: #ffffff;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.14em;
      padding: 4px 9px;
      border-radius: 4px;
      pointer-events: none;
    }

    /* Precision SVG Hourglass Aperture Mask & Architectural Contour Lines */
    .fv-carasols-carasol-1 .aperture-svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 30;
    }

    /* Left & Right Circular Navigation Buttons */
    .fv-carasols-carasol-1 .nav-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(237, 237, 237, 0.9);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      border: 1.5px solid #222;
      color: #111;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 60;
      transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), background 0.2s ease, box-shadow 0.2s ease;
    }

    .fv-carasols-carasol-1 .nav-btn:hover {
      background: #ffffff;
      transform: translateY(-50%) scale(1.07);
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
    }

    .fv-carasols-carasol-1 .nav-btn:active {
      transform: translateY(-50%) scale(0.95);
    }

    .fv-carasols-carasol-1 .nav-prev {
      left: 24px;
    }

    .fv-carasols-carasol-1 .nav-next {
      right: 24px;
    }

    .fv-carasols-carasol-1 .nav-btn svg {
      width: 17px;
      height: 17px;
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
function initCarasol1Runtime(__fvRuntime: ScopedRuntimeContext): void {
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
      const viewport = document.getElementById('viewport');
      const prevBtn = document.getElementById('prevBtn');
      const nextBtn = document.getElementById('nextBtn');
  
      const topMaskPath = document.getElementById('topMaskPath');
      const bottomMaskPath = document.getElementById('bottomMaskPath');
      const topGuidePath = document.getElementById('topGuidePath');
      const bottomGuidePath = document.getElementById('bottomGuidePath');
  
      const TOTAL = IMAGES.length;
      const cards: any[] = [];
  
      // Create high-resolution DOM image cards
      IMAGES.forEach((src: any, i: any) => {
        const el = document.createElement('div');
        el.className = 'reel-card';
        const num = String(i + 1).padStart(2, '0');
        el.innerHTML = `
          <img src="${src}" alt="Reel Photo ${num}" loading="eager" decoding="sync" fetchpriority="high">
          <div class="card-index">N° ${num}</div>
        `;
        strip.appendChild(el);
        cards.push({ el, index: i });
      });
  
      // Update the SVG hourglass mask paths to match the exact pinched-center / flared-edges curve
      function updateApertureGeometry() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const cy = h * 0.5;
  
        // Pinched half-height in center vs flared half-height at left/right edges
        const centerHalfH = Math.min(h * 0.205, 162);
        const edgeHalfH = Math.min(h * 0.365, 295);
  
        const topEdgeY = cy - edgeHalfH;
        const topCenterY = cy - centerHalfH;
  
        const botEdgeY = cy + edgeHalfH;
        const botCenterY = cy + centerHalfH;
  
        // Flat middle section [0.27w .. 0.73w] with smooth cubic Bézier flares at left [0 .. 0.27w] and right [0.73w .. w]
        const xL = w * 0.28;
        const xR = w * 0.72;
  
        const topCurve = `
          M 0 ${topEdgeY}
          C ${w * 0.08} ${topCenterY - 12}, ${w * 0.18} ${topCenterY}, ${xL} ${topCenterY}
          L ${xR} ${topCenterY}
          C ${w * 0.82} ${topCenterY}, ${w * 0.92} ${topCenterY - 12}, ${w} ${topEdgeY}
        `;
  
        const botCurve = `
          M 0 ${botEdgeY}
          C ${w * 0.08} ${botCenterY + 12}, ${w * 0.18} ${botCenterY}, ${xL} ${botCenterY}
          L ${xR} ${botCenterY}
          C ${w * 0.82} ${botCenterY}, ${w * 0.92} ${botCenterY + 12}, ${w} ${botEdgeY}
        `;
  
        topMaskPath.setAttribute('d', `${topCurve} L ${w} 0 L 0 0 Z`);
        bottomMaskPath.setAttribute('d', `${botCurve} L ${w} ${h} L 0 ${h} Z`);
  
        // Offset architectural guide lines 18px outside the aperture
        const gOff = 18;
        const topGuide = `
          M 0 ${topEdgeY - gOff}
          C ${w * 0.08} ${topCenterY - 12 - gOff}, ${w * 0.18} ${topCenterY - gOff}, ${xL} ${topCenterY - gOff}
          L ${xR} ${topCenterY - gOff}
          C ${w * 0.82} ${topCenterY - gOff}, ${w * 0.92} ${topCenterY - 12 - gOff}, ${w} ${topEdgeY - gOff}
        `;
  
        const botGuide = `
          M 0 ${botEdgeY + gOff}
          C ${w * 0.08} ${botCenterY + 12 + gOff}, ${w * 0.18} ${botCenterY + gOff}, ${xL} ${botCenterY + gOff}
          L ${xR} ${botCenterY + gOff}
          C ${w * 0.82} ${botCenterY + gOff}, ${w * 0.92} ${botCenterY + 12 + gOff}, ${w} ${botEdgeY + gOff}
        `;
  
        topGuidePath.setAttribute('d', topGuide);
        bottomGuidePath.setAttribute('d', botGuide);
      }
  
      window.addEventListener('resize', updateApertureGeometry);
      updateApertureGeometry();
  
      // Scroll & 3D concave ribbon state
      let currentIndex = 0;
      let targetIndex = 0;
      let isDragging = false;
      let lastX = 0;
      let lastTime = 0;
      let velocity = 0;
  
      function renderReel() {
        if (!isDragging) {
          currentIndex += (targetIndex - currentIndex) * 0.1;
        } else {
          currentIndex = targetIndex;
        }
  
        const cardStride = 485;
  
        cards.forEach(({ el, index }: any) => {
          // Compute circular distance in card units from center [-TOTAL/2, +TOTAL/2]
          let delta = (index - currentIndex) % TOTAL;
          if (delta < -TOTAL / 2) delta += TOTAL;
          if (delta > TOTAL / 2) delta -= TOTAL;
  
          if (Math.abs(delta) > 2.6) {
            el.style.display = 'none';
            return;
          }
          el.style.display = 'block';
  
          // Horizontal position along the ribbon
          const x = delta * cardStride;
  
          // Concave 3D flare: center card sits flat at z = 0, side cards curve forward in Z and angle inward
          const norm = delta / 1.65;
          const z = Math.min(220, Math.pow(Math.abs(norm), 1.85) * 155);
          const rotY = Math.max(-28, Math.min(28, -norm * 19));
  
          el.style.transform = `translate3d(${x.toFixed(2)}px, 0, ${z.toFixed(2)}px) rotateY(${rotY.toFixed(2)}deg)`;
          el.style.zIndex = Math.round(100 - Math.abs(delta) * 10);
        });
  
        requestAnimationFrame(renderReel);
      }
  
      // Pointer Drag Interaction
      viewport.addEventListener('pointerdown', (e: any) => {
        isDragging = true;
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
  
        const dIdx = -dx / 460;
        targetIndex += dIdx;
        velocity = dIdx / dt;
  
        lastX = e.clientX;
        lastTime = now;
      });
  
      function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        targetIndex += velocity * 180;
        targetIndex = Math.round(targetIndex);
      }
  
      viewport.addEventListener('pointerup', endDrag);
      viewport.addEventListener('pointercancel', endDrag);
  
      // Prev / Next Arrow Buttons
      prevBtn.addEventListener('click', () => {
        targetIndex = Math.round(targetIndex) - 1;
      });
  
      nextBtn.addEventListener('click', () => {
        targetIndex = Math.round(targetIndex) + 1;
      });
  
      // Wheel & Keyboard Support
      window.addEventListener('wheel', (e: any) => {
        e.preventDefault();
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        targetIndex += delta * 0.0022;
        clearTimeout(window._reelSnap);
        window._reelSnap = setTimeout(() => {
          targetIndex = Math.round(targetIndex);
        }, 220);
      }, { passive: false });
  
      window.addEventListener('keydown', (e: any) => {
        if (e.key === 'ArrowLeft') targetIndex = Math.round(targetIndex) - 1;
        if (e.key === 'ArrowRight') targetIndex = Math.round(targetIndex) + 1;
      });
  
      requestAnimationFrame(renderReel);
}
/* eslint-enable */

export function Carasol1({ className, style, width = '100%', height = '100%', imageBasePath = 'images' }: Carasol1Props) {
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

    initCarasol1Runtime({
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
      className={className ? `fv-carasols-carasol-1 ${className}` : 'fv-carasols-carasol-1'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        {/* Top Header */}
          <header>
            <div>• REEL FLUX •</div>
            <div className="header-plus">+</div>
            <div>ARCHIVE — N° 07 &nbsp;⊕</div>
          </header>

          {/* 3D High-Resolution Photo Ribbon */}
          <div className="reel-viewport" id="viewport">
            <div className="reel-strip" id="strip"></div>
          </div>

          {/* SVG Pinched Hourglass Aperture Overlay & Guide Lines */}
          <svg className="aperture-svg" id="apertureSvg" preserveAspectRatio="none">
            <path id="topMaskPath" fill="#ededed"></path>
            <path id="bottomMaskPath" fill="#ededed"></path>
            <path id="topGuidePath" fill="none" stroke="rgba(0,0,0,0.16)" strokeWidth="1.1"></path>
            <path id="bottomGuidePath" fill="none" stroke="rgba(0,0,0,0.16)" strokeWidth="1.1"></path>
          </svg>

          {/* Navigation Buttons */}
          <button className="nav-btn nav-prev" id="prevBtn" aria-label="Previous Photo">
            <svg viewBox="0 0 24 24">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="11 18 5 12 11 6"></polyline>
            </svg>
          </button>

          <button className="nav-btn nav-next" id="nextBtn" aria-label="Next Photo">
            <svg viewBox="0 0 24 24">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="13 6 19 12 13 18"></polyline>
            </svg>
          </button>

          {/* Bottom Footer */}
          <footer>
            <div>• 40.7128° N 74.0060° W</div>
            <div className="footer-photos" id="photoCounter">/12 Photos</div>
            <div>MOTION STUDY / SS 2026 &nbsp;⊙</div>
          </footer>
    </div>
  );
}

export default Carasol1;
