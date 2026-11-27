'use client';

/**
 * 3D SPIRAL FLUX — Archive N° 08
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Carasol2Props {
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
  "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap"
];

const SCOPED_STYLES = `
.fv-carasols-carasol-2 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-carasols-carasol-2 * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
      -webkit-user-select: none;
    }

    .fv-carasols-carasol-2 {
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
    .fv-carasols-carasol-2 header {
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

    .fv-carasols-carasol-2 .header-plus {
      font-size: 15px;
      font-weight: 400;
      color: #444;
    }

    /* Bottom Footer */
    .fv-carasols-carasol-2 footer {
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

    .fv-carasols-carasol-2 .footer-photos {
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: none;
      font-size: 12px;
      color: #222;
    }

    /* 3D Helical Spiral Viewport */
    .fv-carasols-carasol-2 .spiral-viewport {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      perspective: 1350px;
      perspective-origin: 50% 50%;
      cursor: grab;
      touch-action: none;
      overflow: hidden;
    }

    .fv-carasols-carasol-2 .spiral-viewport:active {
      cursor: grabbing;
    }

    .fv-carasols-carasol-2 .helix-stage {
      position: relative;
      width: 0;
      height: 0;
      transform-style: preserve-3d;
      will-change: transform;
    }

    /* High-Resolution Spiral Photo Cards with Clean Spacing */
    .fv-carasols-carasol-2 .spiral-card {
      position: absolute;
      width: 236px;
      height: 154px;
      margin-left: -118px;
      margin-top: -77px;
      border-radius: 6px;
      overflow: hidden;
      background: #dcdcdc;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.13), 0 2px 6px rgba(0, 0, 0, 0.05);
      transform-style: preserve-3d;
      will-change: transform, opacity;
      transition: box-shadow 0.25s ease;
    }

    .fv-carasols-carasol-2 .spiral-card:hover {
      box-shadow: 0 22px 48px rgba(0, 0, 0, 0.2);
    }

    .fv-carasols-carasol-2 .spiral-card img {
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

    .fv-carasols-carasol-2 .card-badge {
      position: absolute;
      bottom: 8px;
      right: 10px;
      background: rgba(15, 15, 15, 0.62);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      color: #ffffff;
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.14em;
      padding: 3px 7px;
      border-radius: 3px;
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
function initCarasol2Runtime(__fvRuntime: ScopedRuntimeContext): void {
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
  
      const helixStage = document.getElementById('helixStage');
      const viewport = document.getElementById('viewport');
  
      const UNIQUE_COUNT = IMAGES.length; // 12 high-res photos
      const TOTAL_CARDS = 24;             // 2 full sets preloaded in GPU memory (no dynamic src swapping)
      const cards: any[] = [];
  
      for (let i = 0; i < TOTAL_CARDS; i++) {
        const photoIdx = i % UNIQUE_COUNT;
        const numStr = String(photoIdx + 1).padStart(2, '0');
        const el = document.createElement('div');
        el.className = 'spiral-card';
        el.innerHTML = `
          <img src="${IMAGES[photoIdx]}" alt="Spiral Photo ${numStr}" loading="eager" decoding="sync" fetchpriority="high">
          <div class="card-badge">N° ${numStr}</div>
        `;
        helixStage.appendChild(el);
        cards.push({ el, index: i });
      }
  
      // 3D Helix Geometry tuned for generous, uniform gaps between every picture:
      // Card size is 236x154.
      // With RADIUS = 420 and ANGLE_STEP = 0.76 rad (~43.5 deg), chord spacing is ~312px (leaving a ~76px gap along the arc).
      // With VERTICAL_STEP = 96px per card, each full 360° turn rises ~795px vertically so turns never overlap!
      const RADIUS = 420;
      const ANGLE_STEP = 0.76;
      const VERTICAL_STEP = 96;
      const HELIX_SLOPE_DEG = -8.5;
  
      let currentOffset = 0;
      let targetOffset = 0;
      let isDragging = false;
      let lastX = 0;
      let lastY = 0;
      let lastTime = 0;
      let velocity = 0;
  
      function renderSpiral() {
        if (!isDragging) {
          currentOffset += (targetOffset - currentOffset) * 0.1;
        } else {
          currentOffset = targetOffset;
        }
  
        const halfTotal = TOTAL_CARDS / 2;
  
        cards.forEach(({ el, index }: any) => {
          // Wrap card slot smoothly into [-halfTotal, +halfTotal)
          let rel = (index - currentOffset) % TOTAL_CARDS;
          if (rel < -halfTotal) rel += TOTAL_CARDS;
          if (rel >= halfTotal) rel -= TOTAL_CARDS;
  
          const theta = rel * ANGLE_STEP;
          const x = RADIUS * Math.sin(theta);
          const z = RADIUS * Math.cos(theta) - 90;
          const y = -rel * VERTICAL_STEP;
  
          // Cull cards far off-screen vertically
          const maxVisibleY = window.innerHeight * 0.68;
          if (Math.abs(y) > maxVisibleY) {
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
            return;
          }
  
          const rotY = (theta * 180) / Math.PI;
  
          // Depth & vertical edge fade
          const depthNorm = (Math.cos(theta) + 1) * 0.5; // 0 at back of cylinder, 1 at front
          const edgeFade = Math.max(0, 1 - Math.pow(Math.abs(y) / maxVisibleY, 2.6));
          const opacity = edgeFade * (0.28 + 0.72 * depthNorm);
  
          el.style.opacity = opacity.toFixed(3);
          el.style.pointerEvents = opacity > 0.25 ? 'auto' : 'none';
          el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateY(${rotY.toFixed(2)}deg) rotateZ(${HELIX_SLOPE_DEG}deg)`;
          el.style.zIndex = Math.round(z + 1000);
        });
  
        requestAnimationFrame(renderSpiral);
      }
  
      // Pointer Drag Interaction
      viewport.addEventListener('pointerdown', (e: any) => {
        isDragging = true;
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
  
        const dStep = (-dx * 0.0055) + (dy * 0.0055);
        targetOffset += dStep;
        velocity = dStep / dt;
  
        lastX = e.clientX;
        lastY = e.clientY;
        lastTime = now;
      });
  
      function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        targetOffset += velocity * 170;
      }
  
      viewport.addEventListener('pointerup', endDrag);
      viewport.addEventListener('pointercancel', endDrag);
  
      // Wheel & Keyboard Support
      window.addEventListener('wheel', (e: any) => {
        e.preventDefault();
        const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        targetOffset += delta * 0.0032;
      }, { passive: false });
  
      window.addEventListener('keydown', (e: any) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') targetOffset -= 1;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') targetOffset += 1;
      });
  
      requestAnimationFrame(renderSpiral);
}
/* eslint-enable */

export function Carasol2({ className, style, width = '100%', height = '100%', blendMode = "normal", transparentBackground = false, edgeFeather = 0, imageBasePath = 'images' }: Carasol2Props) {
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

    initCarasol2Runtime({
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
      className={className ? `fv-carasols-carasol-2 ${className}` : 'fv-carasols-carasol-2'}
      style={{ width, height, ...blendStyle, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        {/* Top Header */}
          <header>
            <div>• 3D SPIRAL FLUX •</div>
            <div className="header-plus">+</div>
            <div>ARCHIVE — N° 08 &nbsp;⊕</div>
          </header>

          {/* 3D Cylindrical Spiral Viewport */}
          <div className="spiral-viewport" id="viewport">
            <div className="helix-stage" id="helixStage"></div>
          </div>

          {/* Bottom Footer */}
          <footer>
            <div>• 35.6762° N 139.6503° E</div>
            <div className="footer-photos">/12 Photos</div>
            <div>MOTION STUDY / SS 2026 &nbsp;⊙</div>
          </footer>
    </div>
  );
}

export default Carasol2;
