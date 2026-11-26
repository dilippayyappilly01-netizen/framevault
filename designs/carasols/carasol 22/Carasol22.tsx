'use client';

/**
 * Carousel 22 — 3D Swirling Comet-Tail &amp; Fluted Glass Card Vortex
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Carasol22Props {
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
.fv-carasols-carasol-22 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-carasols-carasol-22 *, .fv-carasols-carasol-22 *::before, .fv-carasols-carasol-22 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-carasols-carasol-22 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000000;
    font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-carasols-carasol-22 #stage {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000000;
    cursor: grab;
  }

  .fv-carasols-carasol-22 #stage:active {
    cursor: grabbing;
  }

  /* High-res DOM cards for the foreground/midground stream */
  .fv-carasols-carasol-22 .stream-card {
    position: absolute;
    top: 0;
    left: 0;
    width: 340px;
    height: 340px;
    border-radius: 30px;
    overflow: hidden;
    will-change: transform, opacity;
    transform-origin: center center;
    background: #111;
    box-shadow: 0 22px 60px rgba(0, 0, 0, 0.72);
    backface-visibility: hidden;
  }

  .fv-carasols-carasol-22 .stream-card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    pointer-events: none;
    image-rendering: high-quality;
    -webkit-user-drag: none;
  }

  /* Ribbed / fluted glass & graphic stripe overlay matching the recording */
  .fv-carasols-carasol-22 .stream-card::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: var(--flute-opacity, 0);
  }

  /* Variant 1: Vertical fluted glass ribs */
  .fv-carasols-carasol-22 .stream-card.flute-v::after {
    background:
      repeating-linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.24) 0px,
        rgba(255, 255, 255, 0.03) 4px,
        rgba(0, 0, 0, 0.34) 8px,
        rgba(255, 255, 255, 0.14) 11px
      );
    mix-blend-mode: hard-light;
  }

  /* Variant 2: Half fluted bottom / graphic top */
  .fv-carasols-carasol-22 .stream-card.flute-half::after {
    top: 48%;
    background:
      repeating-linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.32) 0px,
        rgba(20, 40, 110, 0.38) 5px,
        rgba(0, 0, 0, 0.52) 10px
      );
    backdrop-filter: blur(4px) saturate(1.4);
    -webkit-backdrop-filter: blur(4px) saturate(1.4);
  }

  /* Variant 3: Horizontal scanline motion ribs */
  .fv-carasols-carasol-22 .stream-card.flute-h::after {
    background:
      repeating-linear-gradient(
        0deg,
        rgba(255, 255, 255, 0.18) 0px,
        rgba(0, 0, 0, 0.28) 4px,
        rgba(255, 255, 255, 0.08) 7px
      );
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
function initCarasol22Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame, imgBase } = __fvRuntime as any;
  (() => {
    const stage = document.getElementById('stage');
    const IMAGES = Array.from({ length: 12 }, (_: any, i: any) => `images/${i + 1}.jpg`);
  
    // Create 96 cards arranged along a 3D S-curve / double-spiral stream from deep space to foreground cluster
    const TOTAL_CARDS = 96;
    const cards: any[] = [];
    const fluteClasses = ['', 'flute-v', '', 'flute-half', '', 'flute-h'];
  
    for (let i = 0; i < TOTAL_CARDS; i++) {
      const el = document.createElement('div');
      const fluteClass = fluteClasses[i % fluteClasses.length];
      el.className = `stream-card ${fluteClass}`.trim();
      el.style.setProperty('--flute-opacity', fluteClass ? '0.82' : '0');
  
      const img = document.createElement('img');
      img.src = IMAGES[i % IMAGES.length];
      img.alt = `Photo ${(i % IMAGES.length) + 1}`;
      img.loading = 'eager';
      img.decoding = 'sync';
      img.fetchPriority = 'high';
  
      el.appendChild(img);
      stage.appendChild(el);
  
      // Deterministic jitter so cards form a rich multi-stranded comet tail & foreground cluster
      const angleSeed = i * 2.39996;
      const strand = (i % 3) - 1; // -1, 0, +1
  
      cards.push({
        el,
        index: i,
        strand,
        jitterX: Math.cos(angleSeed) * 68 + strand * 46,
        jitterY: Math.sin(angleSeed * 1.3) * 68 - strand * 38,
        clusterOffsetX: Math.cos(i * 1.7) * 92,
        clusterOffsetY: Math.sin(i * 2.1) * 86
      });
    }
  
    let vw = window.innerWidth;
    let vh = window.innerHeight;
    window.addEventListener('resize', () => {
      vw = window.innerWidth;
      vh = window.innerHeight;
    });
  
    // Stream progression & interactive pointer steering
    let progress = 0;
    let velocity = 0.0022;
    let pointerNX = 0;
    let pointerNY = 0;
    let smoothNX = 0;
    let smoothNY = 0;
    let isDragging = false;
    let lastY = 0;
    let lastX = 0;
  
    window.addEventListener('pointermove', (e: any) => {
      pointerNX = (e.clientX / Math.max(vw, 1)) * 2 - 1;
      pointerNY = (e.clientY / Math.max(vh, 1)) * 2 - 1;
  
      if (isDragging) {
        const dy = e.clientY - lastY;
        const dx = e.clientX - lastX;
        lastY = e.clientY;
        lastX = e.clientX;
        progress += (dy - dx * 0.5) * 0.0008;
        velocity = (dy - dx * 0.5) * 0.00025;
      }
    });
  
    window.addEventListener('pointerdown', (e: any) => {
      isDragging = true;
      lastY = e.clientY;
      lastX = e.clientX;
    });
  
    window.addEventListener('pointerup', () => {
      isDragging = false;
    });
  
    window.addEventListener('wheel', (e: any) => {
      e.preventDefault();
      progress += e.deltaY * 0.00035;
      velocity = Math.sign(e.deltaY || 1) * 0.0026;
    }, { passive: false });
  
    function animate(now?: any) {
      const time = now * 0.001;
  
      if (!isDragging) {
        velocity += (0.0020 - velocity) * 0.04;
        progress += velocity;
      }
  
      smoothNX += (pointerNX - smoothNX) * 0.06;
      smoothNY += (pointerNY - smoothNY) * 0.06;
  
      const cx = vw * 0.5 + smoothNX * 75;
      const cy = vh * 0.5 + smoothNY * 55;
  
      for (let i = 0; i < TOTAL_CARDS; i++) {
        const c = cards[i];
  
        // Normalized stream position u in [0, 1):
        // u = 0.0 -> tiny far-field comet tail
        // u = 0.72..0.92 -> large foreground layered cluster in the center
        // u > 0.92 -> exits smoothly
        const raw = (i / TOTAL_CARDS + progress) % 1;
        const u = raw < 0 ? raw + 1 : raw;
  
        // S-curve / spiral trajectory across the screen
        const tailPhase = (1 - u) * 7.2 + time * 0.55;
        const spiralRadiusX = (1 - u) * Math.min(vw, 1400) * 0.54;
        const spiralRadiusY = (1 - u) * Math.min(vh, 950) * 0.42;
  
        // Smoothly transition from wide sweeping S-curve tail into the tight overlapping foreground cluster
        const clusterBlend = Math.pow(u, 2.6);
  
        const tailX =
          Math.cos(tailPhase + smoothNX * 1.1) * spiralRadiusX +
          c.jitterX * (1 - u * 0.5);
        const tailY =
          Math.sin(tailPhase * 1.35 + smoothNY * 1.1) * spiralRadiusY +
          c.jitterY * (1 - u * 0.5);
  
        const fgX = c.clusterOffsetX * (1.15 - u * 0.35) + Math.sin(time * 1.4 + i) * 18;
        const fgY = c.clusterOffsetY * (1.15 - u * 0.35) + Math.cos(time * 1.2 + i) * 18;
  
        const x = cx + tailX * (1 - clusterBlend) + fgX * clusterBlend - 170;
        const y = cy + tailY * (1 - clusterBlend) + fgY * clusterBlend - 170;
  
        // Exponential scale curve: tiny 12px dots in tail -> 340px overlapping hero squares in foreground
        let scale: any;
        if (u < 0.72) {
          scale = 0.032 + Math.pow(u / 0.72, 2.85) * 0.38;
        } else {
          const fgU = (u - 0.72) / 0.28;
          scale = 0.412 + Math.sin(fgU * Math.PI * 0.88) * 0.68;
        }
  
        // Fade in at birth (u < 0.06) and fade out cleanly at exit (u > 0.94)
        let opacity = 1;
        if (u < 0.06) opacity = u / 0.06;
        else if (u > 0.93) opacity = Math.max(0, 1 - (u - 0.93) / 0.07);
  
        const zIndex = Math.round(u * 1000);
        c.el.style.zIndex = String(zIndex);
        c.el.style.opacity = opacity.toFixed(3);
        c.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(4)})`;
      }
  
      requestAnimationFrame(animate);
    }
  
    requestAnimationFrame(animate);
  })();
}
/* eslint-enable */

export function Carasol22({ className, style, width = '100%', height = '100%', imageBasePath = 'images' }: Carasol22Props) {
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

    initCarasol22Runtime({
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
      className={className ? `fv-carasols-carasol-22 ${className}` : 'fv-carasols-carasol-22'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <div id="stage"></div>
    </div>
  );
}

export default Carasol22;
