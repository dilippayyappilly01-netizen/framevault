'use client';

/**
 * Particle-Dissolve Horizontal Photo Carousel
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Carasol18Props {
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
.fv-carasols-carasol-18 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-carasols-carasol-18 * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
      -webkit-user-select: none;
    }

    .fv-carasols-carasol-18 {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #000000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    .fv-carasols-carasol-18 #stage {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      cursor: grab;
      touch-action: none;
    }

    .fv-carasols-carasol-18 #stage:active {
      cursor: grabbing;
    }

    .fv-carasols-carasol-18 canvas {
      display: block;
      width: 100%;
      height: 100%;
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
function initCarasol18Runtime(__fvRuntime: ScopedRuntimeContext): void {
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
  
      const canvas = document.getElementById('dissolveCanvas');
      const ctx = canvas.getContext('2d', { alpha: false });
      const stage = document.getElementById('stage');
  
      let width = window.innerWidth;
      let height = window.innerHeight;
      let dpr = Math.min(Math.max(window.devicePixelRatio || 1, 2), 2.5);
  
      function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        dpr = Math.min(Math.max(window.devicePixelRatio || 1, 2), 2.5);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
      }
      window.addEventListener('resize', resize);
      resize();
  
      const TOTAL = IMAGES.length;
      const CARD_W = 520;
      const CARD_H = 380;
      const CARD_GAP = 38;
      const STRIDE = CARD_W + CARD_GAP;
  
      // Pre-render each high-res photo into a rounded-corner offscreen canvas for ultra-crisp center rendering + edge particle sampling
      const cardCanvases = new Array(TOTAL).fill(null);
  
      IMAGES.forEach((src: any, idx: any) => {
        const img = new Image();
        img.decoding = 'sync';
        img.onload = () => {
          const off = document.createElement('canvas');
          const scale = 2; // 2x supersampled offscreen card
          off.width = CARD_W * scale;
          off.height = CARD_H * scale;
          const octx = off.getContext('2d');
          octx.scale(scale, scale);
          octx.imageSmoothingEnabled = true;
          octx.imageSmoothingQuality = 'high';
  
          // Rounded rectangle clip
          const r = 20;
          octx.beginPath();
          octx.moveTo(r, 0);
          octx.lineTo(CARD_W - r, 0);
          octx.quadraticCurveTo(CARD_W, 0, CARD_W, r);
          octx.lineTo(CARD_W, CARD_H - r);
          octx.quadraticCurveTo(CARD_W, CARD_H, CARD_W - r, CARD_H);
          octx.lineTo(r, CARD_H);
          octx.quadraticCurveTo(0, CARD_H, 0, CARD_H - r);
          octx.lineTo(0, r);
          octx.quadraticCurveTo(0, 0, r, 0);
          octx.closePath();
          octx.clip();
  
          // Cover crop
          const imgAspect = img.naturalWidth / img.naturalHeight;
          const cardAspect = CARD_W / CARD_H;
          let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
          if (imgAspect > cardAspect) {
            sw = img.naturalHeight * cardAspect;
            sx = (img.naturalWidth - sw) * 0.5;
          } else {
            sh = img.naturalWidth / cardAspect;
            sy = (img.naturalHeight - sh) * 0.5;
          }
          octx.drawImage(img, sx, sy, sw, sh, 0, 0, CARD_W, CARD_H);
          cardCanvases[idx] = off;
        };
        img.src = src;
      });
  
      // Deterministic pseudo-random table for fast particle scatter at left & right screen edges
      const RAND_COUNT = 2048;
      const randX = new Float32Array(RAND_COUNT);
      const randY = new Float32Array(RAND_COUNT);
      for (let i = 0; i < RAND_COUNT; i++) {
        randX[i] = (Math.random() - 0.5) * 2;
        randY[i] = (Math.random() - 0.5) * 2;
      }
  
      let scrollX = 0;
      let targetScrollX = 0;
      let isDragging = false;
      let lastX = 0;
      let lastTime = 0;
      let velocity = 0;
      let time = 0;
  
      function render() {
        time += 0.025;
        if (!isDragging) {
          targetScrollX += 1.65;
          scrollX += (targetScrollX - scrollX) * 0.12;
        } else {
          scrollX = targetScrollX;
        }
  
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
  
        const totalTrack = TOTAL * STRIDE;
        const centerY = (height - CARD_H) * 0.5;
  
        // Zone thresholds where cards begin dissolving into pixel sand near the left & right edges
        const edgeZone = Math.min(260, width * 0.24);
  
        for (let i = 0; i < TOTAL; i++) {
          const off = cardCanvases[i];
          if (!off) continue;
  
          let rawX = (i * STRIDE - scrollX) % totalTrack;
          if (rawX < -totalTrack * 0.5) rawX += totalTrack;
          if (rawX > totalTrack * 0.5) rawX -= totalTrack;
  
          const cardLeft = width * 0.5 + rawX - CARD_W * 0.5;
          const cardRight = cardLeft + CARD_W;
  
          if (cardRight < -120 || cardLeft > width + 120) continue;
  
          // Determine if any portion of the card is inside the left or right particle-dissolve zone
          const safeLeft = Math.max(edgeZone, cardLeft);
          const safeRight = Math.min(width - edgeZone, cardRight);
  
          // 1. Draw the solid, ultra-crisp center portion of the card
          if (safeRight > safeLeft) {
            const u0 = (safeLeft - cardLeft) / CARD_W;
            const u1 = (safeRight - cardLeft) / CARD_W;
            ctx.drawImage(
              off,
              u0 * off.width, 0, (u1 - u0) * off.width, off.height,
              safeLeft, centerY, safeRight - safeLeft, CARD_H
            );
          }
  
          // 2. Draw Left Dissolve Zone (if card overlaps x < edgeZone)
          if (cardLeft < edgeZone) {
            const zStart = Math.max(0, cardLeft);
            const zEnd = Math.min(edgeZone, cardRight);
            renderDissolveSlices(off, cardLeft, centerY, zStart, zEnd, true, edgeZone, i);
          }
  
          // 3. Draw Right Dissolve Zone (if card overlaps x > width - edgeZone)
          if (cardRight > width - edgeZone) {
            const zStart = Math.max(width - edgeZone, cardLeft);
            const zEnd = Math.min(width, cardRight);
            renderDissolveSlices(off, cardLeft, centerY, zStart, zEnd, false, edgeZone, i);
          }
        }
  
        requestAnimationFrame(render);
      }
  
      function renderDissolveSlices(off: any, cardLeft: any, cardTop: any, xStart: any, xEnd: any, isLeftEdge: any, edgeZone: any, seedOffset?: any) {
        const stepX = 4;
        const stepY = 5;
  
        for (let sx = xStart; sx < xEnd; sx += stepX) {
          const u = (sx - cardLeft) / CARD_W;
          if (u < 0 || u >= 1) continue;
  
          // Dissolve factor: 0 at inner boundary of edgeZone, 1 at screen edge (0 or width)
          const factor = isLeftEdge
            ? Math.max(0, Math.min(1, 1 - sx / edgeZone))
            : Math.max(0, Math.min(1, (sx - (width - edgeZone)) / edgeZone));
  
          const powFactor = Math.pow(factor, 1.45);
          const srcX = u * off.width;
  
          for (let py = 0; py < CARD_H; py += stepY) {
            const hashIdx = ((Math.floor(sx) * 37 + py * 17 + seedOffset * 131) & (RAND_COUNT - 1));
            // Randomly cull particles as they get closer to the screen edge
            if (Math.abs(randX[hashIdx]) < powFactor * 0.78) continue;
  
            const scatterX = randX[hashIdx] * powFactor * 75 + (isLeftEdge ? -powFactor * 28 : powFactor * 28);
            const scatterY = randY[hashIdx] * powFactor * 95 + Math.sin(time + py * 0.05) * powFactor * 14;
  
            const v = py / CARD_H;
            ctx.drawImage(
              off,
              srcX, v * off.height, stepX * 2, stepY * 2,
              sx + scatterX, cardTop + py + scatterY, stepX * (1 - powFactor * 0.35), stepY * (1 - powFactor * 0.35)
            );
          }
        }
      }
  
      stage.addEventListener('pointerdown', (e: any) => {
        isDragging = true;
        lastX = e.clientX;
        lastTime = performance.now();
        velocity = 0;
        stage.setPointerCapture(e.pointerId);
      });
  
      stage.addEventListener('pointermove', (e: any) => {
        if (!isDragging) return;
        const now = performance.now();
        const dx = e.clientX - lastX;
        const dt = Math.max(1, now - lastTime);
  
        targetScrollX -= dx * 1.2;
        velocity = -dx / dt;
  
        lastX = e.clientX;
        lastTime = now;
      });
  
      function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        targetScrollX += velocity * 180;
      }
  
      stage.addEventListener('pointerup', endDrag);
      stage.addEventListener('pointercancel', endDrag);
  
      window.addEventListener('wheel', (e: any) => {
        e.preventDefault();
        targetScrollX += (e.deltaX || e.deltaY) * 0.85;
      }, { passive: false });
  
      requestAnimationFrame(render);
}
/* eslint-enable */

export function Carasol18({ className, style, width = '100%', height = '100%', imageBasePath = 'images' }: Carasol18Props) {
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

    initCarasol18Runtime({
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
      className={className ? `fv-carasols-carasol-18 ${className}` : 'fv-carasols-carasol-18'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <div id="stage">
            <canvas id="dissolveCanvas"></canvas>
          </div>
    </div>
  );
}

export default Carasol18;
