'use client';

/**
 * 3D Cloth Wave Carousel
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Carasol9Props {
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
.fv-carasols-carasol-9 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-carasols-carasol-9 * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
      -webkit-user-select: none;
    }

    .fv-carasols-carasol-9 {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #ededed;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    .fv-carasols-carasol-9 #stage {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      cursor: grab;
      touch-action: none;
    }

    .fv-carasols-carasol-9 #stage:active {
      cursor: grabbing;
    }

    .fv-carasols-carasol-9 canvas {
      display: block;
      width: 100%;
      height: 100%;
    }

    /* Bottom 3 Circular Dark Buttons matching the screen recording */
    .fv-carasols-carasol-9 .controls {
      position: absolute;
      bottom: 21vh;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 8px;
      z-index: 30;
    }

    .fv-carasols-carasol-9 .ctrl-btn {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #1c1c1c;
      color: #ffffff;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.16);
      transition: transform 0.18s ease, background 0.18s ease;
    }

    .fv-carasols-carasol-9 .ctrl-btn:hover {
      background: #333333;
      transform: scale(1.08);
    }

    .fv-carasols-carasol-9 .ctrl-btn:active {
      transform: scale(0.94);
    }

    .fv-carasols-carasol-9 .ctrl-btn svg {
      width: 12px;
      height: 12px;
      stroke: currentColor;
      stroke-width: 2.3;
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
function initCarasol9Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame, imgBase } = __fvRuntime as any;
  const IMAGE_SOURCES = [
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
  
      const canvas = document.getElementById('clothCanvas');
      const ctx = canvas.getContext('2d', { alpha: false });
      const stage = document.getElementById('stage');
      const prevBtn = document.getElementById('prevBtn');
      const nextBtn = document.getElementById('nextBtn');
      const toggleBtn = document.getElementById('toggleBtn');
      const toggleIcon = document.getElementById('toggleIcon');
  
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
  
      const TOTAL = IMAGE_SOURCES.length;
      const textures = new Array(TOTAL).fill(null);
      const TEX_SIZE = 900; // High-res square texture canvas per photo
  
      IMAGE_SOURCES.forEach((src: any, idx: any) => {
        const img = new Image();
        img.decoding = 'sync';
        img.onload = () => {
          const off = document.createElement('canvas');
          off.width = TEX_SIZE;
          off.height = TEX_SIZE;
          const octx = off.getContext('2d');
          octx.imageSmoothingEnabled = true;
          octx.imageSmoothingQuality = 'high';
  
          const minDim = Math.min(img.naturalWidth, img.naturalHeight);
          const sx = (img.naturalWidth - minDim) * 0.5;
          const sy = (img.naturalHeight - minDim) * 0.5;
          octx.drawImage(img, sx, sy, minDim, minDim, 0, 0, TEX_SIZE, TEX_SIZE);
          textures[idx] = off;
        };
        img.src = src;
      });
  
      // Draw a textured triangle with affine transform + cloth fold shading
      function drawTexturedTriangle(img: any, u0: any, v0: any, u1: any, v1: any, u2: any, v2: any, x0: any, y0: any, x1: any, y1: any, x2: any, y2: any, shade?: any) {
        // Expand triangle vertices slightly outward from centroid to prevent sub-pixel seam lines
        const cx = (x0 + x1 + x2) / 3;
        const cy = (y0 + y1 + y2) / 3;
        const expand = 0.45;
        const len0 = Math.hypot(x0 - cx, y0 - cy) || 1;
        const len1 = Math.hypot(x1 - cx, y1 - cy) || 1;
        const len2 = Math.hypot(x2 - cx, y2 - cy) || 1;
        const ex0 = x0 + ((x0 - cx) / len0) * expand;
        const ey0 = y0 + ((y0 - cy) / len0) * expand;
        const ex1 = x1 + ((x1 - cx) / len1) * expand;
        const ey1 = y1 + ((y1 - cy) / len1) * expand;
        const ex2 = x2 + ((x2 - cx) / len2) * expand;
        const ey2 = y2 + ((y2 - cy) / len2) * expand;
  
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(ex0, ey0);
        ctx.lineTo(ex1, ey1);
        ctx.lineTo(ex2, ey2);
        ctx.closePath();
        ctx.clip();
  
        // Solve affine mapping from texture space (u,v) to screen space (x,y)
        const du1 = u1 - u0;
        const dv1 = v1 - v0;
        const du2 = u2 - u0;
        const dv2 = v2 - v0;
        const det = du1 * dv2 - du2 * dv1;
        if (Math.abs(det) > 1e-6) {
          const invDet = 1 / det;
          const dx1 = x1 - x0;
          const dy1 = y1 - y0;
          const dx2 = x2 - x0;
          const dy2 = y2 - y0;
  
          const a = (dx1 * dv2 - dx2 * dv1) * invDet;
          const b = (dy1 * dv2 - dy2 * dv1) * invDet;
          const c = (dx2 * du1 - dx1 * du2) * invDet;
          const d = (dy2 * du1 - dy1 * du2) * invDet;
          const e = x0 - a * u0 - c * v0;
          const f = y0 - b * u0 - d * v0;
  
          ctx.transform(a, b, c, d, e, f);
          ctx.drawImage(img, 0, 0);
        }
  
        ctx.restore();
  
        // Apply realistic 3D silk fold highlight/shadow
        if (Math.abs(shade) > 0.015) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(ex0, ey0);
          ctx.lineTo(ex1, ey1);
          ctx.lineTo(ex2, ey2);
          ctx.closePath();
          if (shade > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.42, shade).toFixed(3)})`;
          } else {
            ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.48, -shade).toFixed(3)})`;
          }
          ctx.fill();
          ctx.restore();
        }
      }
  
      let currentIndex = 2;
      let targetIndex = 2;
      let isDragging = false;
      let isPlaying = true;
      let lastX = 0;
      let lastTime = 0;
      let velocity = 0;
      let wavePhase = 0;
  
      function render() {
        wavePhase += isPlaying ? 0.035 : 0.008;
  
        if (!isDragging) {
          currentIndex += (targetIndex - currentIndex) * 0.1;
        } else {
          currentIndex = targetIndex;
        }
  
        ctx.fillStyle = '#ededed';
        ctx.fillRect(0, 0, width, height);
  
        const centerX = width * 0.5;
        const centerY = height * 0.47;
        const spacing = Math.min(Math.max(width * 0.165, 200), 255);
  
        // Collect visible cards and sort back-to-front (center card on top)
        const visibleCards: any[] = [];
        for (let i = 0; i < TOTAL; i++) {
          let delta = (i - currentIndex) % TOTAL;
          if (delta < -TOTAL / 2) delta += TOTAL;
          if (delta > TOTAL / 2) delta -= TOTAL;
          if (Math.abs(delta) <= 2.65) {
            visibleCards.push({ index: i, delta });
          }
        }
        visibleCards.sort((a: any, b: any) => Math.abs(b.delta) - Math.abs(a.delta));
  
        visibleCards.forEach(({ index, delta }: any) => {
          const tex = textures[index];
          if (!tex) return;
  
          const absDelta = Math.abs(delta);
          const cardCenterX = centerX + delta * spacing;
          const cardCenterY = centerY;
  
          // Center card is larger (~225px) and flat; side cards are ~175px and heavily rippled like cloth
          const flatFactor = Math.max(0, 1 - absDelta * 1.15); // 1 at center, 0 at |delta| >= 0.87
          const waveAmp = Math.pow(Math.min(1, absDelta / 0.95), 1.35);
          const cardSize = 172 + 56 * flatFactor;
  
          // If completely flat (center card), draw directly at ultra-crisp full resolution with subtle tilt
          if (waveAmp < 0.02) {
            ctx.save();
            ctx.translate(cardCenterX, cardCenterY);
            ctx.rotate(-0.045);
            ctx.shadowColor = 'rgba(0, 0, 0, 0.14)';
            ctx.shadowBlur = 26;
            ctx.shadowOffsetY = 12;
            ctx.drawImage(tex, -cardSize * 0.5, -cardSize * 0.5, cardSize, cardSize);
            ctx.restore();
            return;
          }
  
          // Subdivide cloth into 26 x 26 grid for silky-smooth fold curvature (zero visible flat facets)
          const N = 26;
          const verts: any[] = [];
          const seed = index * 1.7 + delta * 0.9;
          const baseRot = -0.045 + delta * 0.06;
          const cosR = Math.cos(baseRot);
          const sinR = Math.sin(baseRot);
  
          for (let r = 0; r <= N; r++) {
            const row: any[] = [];
            const vNorm = r / N - 0.5; // -0.5 .. +0.5
            for (let c = 0; c <= N; c++) {
              const uNorm = c / N - 0.5; // -0.5 .. +0.5
  
              // Multi-frequency 3D cloth wave distortion matching the video's crumpled silk ribbon look
              const angle1 = uNorm * 5.2 + vNorm * 3.8 + wavePhase + seed;
              const angle2 = vNorm * 6.4 - uNorm * 4.1 - wavePhase * 0.8 + seed * 1.3;
              const edgeBoost = 0.65 + 0.85 * Math.hypot(uNorm, vNorm);
  
              const dispZ = waveAmp * edgeBoost * (Math.sin(angle1) * 28 + Math.cos(angle2) * 18);
              const dispX = waveAmp * edgeBoost * (Math.cos(angle1) * 16 - Math.sin(angle2) * 14);
              const dispY = waveAmp * edgeBoost * (Math.sin(angle2) * 22 + Math.cos(angle1 * 0.9) * 14);
  
              const lx = uNorm * cardSize + dispX;
              const ly = vNorm * cardSize + dispY;
  
              // Perspective projection of Z displacement
              const persp = 1 + dispZ / 420;
              const sx = cardCenterX + (lx * cosR - ly * sinR) * persp;
              const sy = cardCenterY + (lx * sinR + ly * cosR) * persp;
  
              // Analytical slope for realistic silk fold specular/shadow shading
              const dZdu = waveAmp * (Math.cos(angle1) * 5.2 * 28 + Math.sin(angle2) * 4.1 * 18);
              const dZdv = waveAmp * (Math.cos(angle1) * 3.8 * 28 - Math.sin(angle2) * 6.4 * 18);
              const shade = (dZdu * 0.0018 - dZdv * 0.0016);
  
              row.push({
                x: sx,
                y: sy,
                u: (c / N) * TEX_SIZE,
                v: (r / N) * TEX_SIZE,
                shade
              });
            }
            verts.push(row);
          }
  
          // Soft ambient drop shadow behind cloth card
          ctx.save();
          ctx.fillStyle = 'rgba(0, 0, 0, 0.09)';
          ctx.filter = 'blur(14px)';
          ctx.beginPath();
          for (let c = 0; c <= N; c++) {
            const p = verts[0][c];
            if (c === 0) ctx.moveTo(p.x, p.y + 12);
            else ctx.lineTo(p.x, p.y + 12);
          }
          for (let r = 1; r <= N; r++) ctx.lineTo(verts[r][N].x, verts[r][N].y + 12);
          for (let c = N - 1; c >= 0; c--) ctx.lineTo(verts[N][c].x, verts[N][c].y + 12);
          for (let r = N - 1; r >= 0; r--) ctx.lineTo(verts[r][0].x, verts[r][0].y + 12);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
  
          // Render cloth mesh triangles
          for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
              const p00 = verts[r][c];
              const p10 = verts[r][c + 1];
              const p01 = verts[r + 1][c];
              const p11 = verts[r + 1][c + 1];
  
              const shade1 = (p00.shade + p10.shade + p11.shade) / 3;
              drawTexturedTriangle(
                tex,
                p00.u, p00.v, p10.u, p10.v, p11.u, p11.v,
                p00.x, p00.y, p10.x, p10.y, p11.x, p11.y,
                shade1
              );
  
              const shade2 = (p00.shade + p11.shade + p01.shade) / 3;
              drawTexturedTriangle(
                tex,
                p00.u, p00.v, p11.u, p11.v, p01.u, p01.v,
                p00.x, p00.y, p11.x, p11.y, p01.x, p01.y,
                shade2
              );
            }
          }
        });
  
        requestAnimationFrame(render);
      }
  
      // Drag & Controls
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
      }
  
      stage.addEventListener('pointerup', endDrag);
      stage.addEventListener('pointercancel', endDrag);
  
      prevBtn.addEventListener('click', () => {
        targetIndex = Math.round(targetIndex) - 1;
      });
  
      nextBtn.addEventListener('click', () => {
        targetIndex = Math.round(targetIndex) + 1;
      });
  
      toggleBtn.addEventListener('click', () => {
        isPlaying = !isPlaying;
        if (isPlaying) {
          toggleIcon.innerHTML = `<line x1="9" y1="6" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="18"></line>`;
        } else {
          toggleIcon.innerHTML = `<polygon points="8 5 19 12 8 19 8 5" fill="currentColor"></polygon>`;
        }
      });
  
      window.addEventListener('keydown', (e: any) => {
        if (e.key === 'ArrowLeft') targetIndex = Math.round(targetIndex) - 1;
        if (e.key === 'ArrowRight') targetIndex = Math.round(targetIndex) + 1;
      });
  
      requestAnimationFrame(render);
}
/* eslint-enable */

export function Carasol9({ className, style, width = '100%', height = '100%', imageBasePath = 'images' }: Carasol9Props) {
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

    initCarasol9Runtime({
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
      className={className ? `fv-carasols-carasol-9 ${className}` : 'fv-carasols-carasol-9'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <div id="stage">
            <canvas id="clothCanvas"></canvas>
          </div>

          <div className="controls">
            <button className="ctrl-btn" id="prevBtn" aria-label="Previous">
              <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button className="ctrl-btn" id="toggleBtn" aria-label="Pause or Resume">
              <svg viewBox="0 0 24 24" id="toggleIcon">
                <line x1="9" y1="6" x2="9" y2="18"></line>
                <line x1="15" y1="6" x2="15" y2="18"></line>
              </svg>
            </button>
            <button className="ctrl-btn" id="nextBtn" aria-label="Next">
              <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
    </div>
  );
}

export default Carasol9;
