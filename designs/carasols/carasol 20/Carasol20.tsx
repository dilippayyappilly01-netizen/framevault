'use client';

/**
 * Carousel 20 — Infinite 3D Parallax Square Photo Field
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Carasol20Props {
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
.fv-carasols-carasol-20 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-carasols-carasol-20 *, .fv-carasols-carasol-20 *::before, .fv-carasols-carasol-20 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-carasols-carasol-20 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000000;
    font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-carasols-carasol-20 #viewport {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000000;
    cursor: grab;
    perspective: 1200px;
  }

  .fv-carasols-carasol-20 #viewport:active {
    cursor: grabbing;
  }

  .fv-carasols-carasol-20 .tile {
    position: absolute;
    top: 0;
    left: 0;
    border-radius: 16px;
    overflow: hidden;
    will-change: transform;
    background: #111;
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.78);
    transition: box-shadow 0.25s ease;
    transform-style: preserve-3d;
    backface-visibility: hidden;
  }

  .fv-carasols-carasol-20 .tile:hover {
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.22);
    z-index: 9999 !important;
  }

  .fv-carasols-carasol-20 .tile img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    pointer-events: none;
    image-rendering: high-quality;
    -webkit-user-drag: none;
    transform: translateZ(0);
  }

  /* Subtle corner controls matching recording */
  .fv-carasols-carasol-20 .corner-btn {
    position: absolute;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.14);
    color: rgba(255, 255, 255, 0.82);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10000;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    transition: background 0.2s ease, transform 0.2s ease;
  }

  .fv-carasols-carasol-20 .corner-btn:hover {
    background: rgba(255, 255, 255, 0.22);
    transform: scale(1.06);
  }

  .fv-carasols-carasol-20 .btn-top-left {
    top: 18px;
    left: 18px;
  }

  .fv-carasols-carasol-20 .btn-top-right {
    top: 18px;
    right: 18px;
  }

  /* Lightbox modal when clicking a photo tile */
  .fv-carasols-carasol-20 #lightbox {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.86);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.28s ease;
    z-index: 20000;
  }

  .fv-carasols-carasol-20 #lightbox.open {
    opacity: 1;
    pointer-events: auto;
  }

  .fv-carasols-carasol-20 #lightbox img {
    max-width: 82vw;
    max-height: 82vh;
    border-radius: 20px;
    box-shadow: 0 30px 90px rgba(0, 0, 0, 0.9);
    object-fit: contain;
    image-rendering: high-quality;
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
function initCarasol20Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame, imgBase } = __fvRuntime as any;
  (() => {
    const viewport = document.getElementById('viewport');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const resetBtn = document.getElementById('resetBtn');
    const zoomBtn = document.getElementById('zoomBtn');
  
    const IMAGES = Array.from({ length: 12 }, (_: any, i: any) => `images/${i + 1}.jpg`);
  
    // Virtual infinite field dimensions
    let vw = window.innerWidth;
    let vh = window.innerHeight;
    let fieldW = Math.max(vw * 2.3, 2800);
    let fieldH = Math.max(vh * 2.3, 2000);
  
    // Create 36 square photo tiles across multiple Z-depth layers
    const NUM_TILES = 36;
    const tiles: any[] = [];
  
    // Deterministic well-spaced Halton-like distribution so tiles fill the infinite space naturally
    function halton(index: any, base?: any) {
      let result = 0;
      let f = 1 / base;
      let i = index;
      while (i > 0) {
        result += f * (i % base);
        i = Math.floor(i / base);
        f /= base;
      }
      return result;
    }
  
    for (let i = 0; i < NUM_TILES; i++) {
      const el = document.createElement('div');
      el.className = 'tile';
  
      const img = document.createElement('img');
      const src = IMAGES[i % IMAGES.length];
      img.src = src;
      img.alt = `Photo ${(i % IMAGES.length) + 1}`;
      img.loading = 'eager';
      img.decoding = 'sync';
      img.fetchPriority = 'high';
      el.appendChild(img);
      viewport.appendChild(el);
  
      // Depth layer factor: 0.18 (far small) to 1.0 (foreground large)
      const depthTier = (i % 6) / 5; // 6 distinct parallax planes
      const depth = 0.22 + depthTier * 0.78;
      const size = Math.round(74 + Math.pow(depth, 1.35) * 205);
      const radius = Math.round(8 + depth * 12);
  
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.borderRadius = `${radius}px`;
      el.style.zIndex = String(Math.round(depth * 1000) + i);
  
      const bx = (halton(i + 1, 2) - 0.5) * fieldW;
      const by = (halton(i + 1, 3) - 0.5) * fieldH;
  
      el.addEventListener('click', (e: any) => {
        if (dragMoved > 6) return;
        e.stopPropagation();
        lightboxImg.src = src;
        lightbox.classList.add('open');
      });
  
      tiles.push({
        el,
        bx,
        by,
        depth,
        size,
        hoverScale: 1,
        targetHoverScale: 1
      });
  
      el.addEventListener('pointerenter', () => {
        tiles[i].targetHoverScale = 1.07;
      });
      el.addEventListener('pointerleave', () => {
        tiles[i].targetHoverScale = 1.0;
      });
    }
  
    lightbox.addEventListener('click', () => {
      lightbox.classList.remove('open');
    });
  
    // Camera pan & momentum state
    let camX = 0;
    let camY = 0;
    let velX = -1.6;
    let velY = -0.95;
    let targetVelX = -1.6;
    let targetVelY = -0.95;
  
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let dragMoved = 0;
    let globalZoom = 1.0;
    let targetZoom = 1.0;
  
    window.addEventListener('pointerdown', (e: any) => {
      if (e.target.closest('.corner-btn') || lightbox.classList.contains('open')) return;
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      dragMoved = 0;
    });
  
    window.addEventListener('pointermove', (e: any) => {
      if (isDragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        dragMoved += Math.hypot(dx, dy);
  
        camX += dx * 1.35;
        camY += dy * 1.35;
        velX = dx * 0.95;
        velY = dy * 0.95;
      } else {
        // Gentle pointer-steered drift matching the video recording
        const nx = (e.clientX / Math.max(vw, 1)) - 0.5;
        const ny = (e.clientY / Math.max(vh, 1)) - 0.5;
        targetVelX = -nx * 5.2;
        targetVelY = -ny * 5.2;
      }
    });
  
    window.addEventListener('pointerup', () => {
      isDragging = false;
    });
  
    window.addEventListener('wheel', (e: any) => {
      e.preventDefault();
      camX -= e.deltaX * 1.1;
      camY -= e.deltaY * 1.1;
      velX = -e.deltaX * 0.35;
      velY = -e.deltaY * 0.35;
    }, { passive: false });
  
    resetBtn.addEventListener('click', () => {
      targetVelX = -1.8;
      targetVelY = -1.1;
      targetZoom = 1.0;
    });
  
    zoomBtn.addEventListener('click', () => {
      targetZoom = targetZoom > 1.05 ? 1.0 : 1.24;
    });
  
    window.addEventListener('resize', () => {
      vw = window.innerWidth;
      vh = window.innerHeight;
      fieldW = Math.max(vw * 2.3, 2800);
      fieldH = Math.max(vh * 2.3, 2000);
    });
  
    function wrap(val: any, span?: any) {
      const half = span * 0.5;
      return ((((val + half) % span) + span) % span) - half;
    }
  
    function animate() {
      if (!isDragging) {
        velX += (targetVelX - velX) * 0.04;
        velY += (targetVelY - velY) * 0.04;
        camX += velX;
        camY += velY;
      }
  
      globalZoom += (targetZoom - globalZoom) * 0.07;
  
      const cx = vw * 0.5;
      const cy = vh * 0.5;
  
      for (let i = 0; i < NUM_TILES; i++) {
        const t = tiles[i];
        t.hoverScale += (t.targetHoverScale - t.hoverScale) * 0.14;
  
        // Multi-plane parallax speed proportional to depth
        const parallax = 0.28 + t.depth * 1.15;
        const wx = wrap(t.bx + camX * parallax, fieldW);
        const wy = wrap(t.by + camY * parallax, fieldH);
  
        const scale = globalZoom * t.hoverScale;
        const x = cx + wx * globalZoom - (t.size * 0.5);
        const y = cy + wy * globalZoom - (t.size * 0.5);
  
        t.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
      }
  
      requestAnimationFrame(animate);
    }
  
    requestAnimationFrame(animate);
  })();
}
/* eslint-enable */

export function Carasol20({ className, style, width = '100%', height = '100%', blendMode = "normal", transparentBackground = false, edgeFeather = 0, imageBasePath = 'images' }: Carasol20Props) {
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

    initCarasol20Runtime({
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
      className={className ? `fv-carasols-carasol-20 ${className}` : 'fv-carasols-carasol-20'}
      style={{ width, height, ...blendStyle, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <div id="viewport"></div>

        <button className="corner-btn btn-top-left" id="resetBtn" title="Reset Drift">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </button>

        <button className="corner-btn btn-top-right" id="zoomBtn" title="Toggle Depth Zoom">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
          </svg>
        </button>

        <div id="lightbox">
          <img id="lightboxImg" src="images/1.jpg" alt="" />
        </div>
    </div>
  );
}

export default Carasol20;
