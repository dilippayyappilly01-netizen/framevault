'use client';

/**
 * Infinite 3D Grid Tunnel Carousel
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Carasol17Props {
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
.fv-carasols-carasol-17 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-carasols-carasol-17 * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
      -webkit-user-select: none;
    }

    .fv-carasols-carasol-17 {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #000000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    .fv-carasols-carasol-17 #stage {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      cursor: grab;
      touch-action: none;
    }

    .fv-carasols-carasol-17 #stage:active {
      cursor: grabbing;
    }

    .fv-carasols-carasol-17 canvas {
      display: block;
      width: 100%;
      height: 100%;
    }

    .fv-carasols-carasol-17 .ui-controls {
      position: absolute;
      top: 18px;
      right: 18px;
      display: flex;
      gap: 8px;
      z-index: 40;
    }

    .fv-carasols-carasol-17 .ui-btn {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.14);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.18);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .fv-carasols-carasol-17 .ui-btn svg {
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
function initCarasol17Runtime(__fvRuntime: ScopedRuntimeContext): void {
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
  
      const COLORS = ['#ef4444', '#2563eb', '#16a34a', '#eab308', '#f97316', '#9333ea'];
  
      const canvas = document.getElementById('tunnelCanvas');
      const ctx = canvas.getContext('2d', { alpha: false });
      const stage = document.getElementById('stage');
      const pauseBtn = document.getElementById('pauseBtn');
      const pauseIcon = document.getElementById('pauseIcon');
      const reverseBtn = document.getElementById('reverseBtn');
  
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
  
      // Load all 12 high-resolution user photos into square textures
      const TOTAL_IMGS = IMAGES.length;
      const textures = new Array(TOTAL_IMGS).fill(null);
      const TEX_SIZE = 700;
  
      IMAGES.forEach((src: any, idx: any) => {
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
  
      // Helper to draw a textured quad (two triangles) in 3D perspective
      function drawQuadImg(img: any, x0: any, y0: any, x1: any, y1: any, x2: any, y2: any, x3: any, y3: any, alpha?: any) {
        if (alpha <= 0.01) return;
        ctx.save();
        ctx.globalAlpha = alpha;
        drawTri(img, 0, 0, TEX_SIZE, 0, TEX_SIZE, TEX_SIZE, x0, y0, x1, y1, x2, y2);
        drawTri(img, 0, 0, TEX_SIZE, TEX_SIZE, 0, TEX_SIZE, x0, y0, x2, y2, x3, y3);
        ctx.restore();
      }
  
      function drawTri(img: any, u0: any, v0: any, u1: any, v1: any, u2: any, v2: any, x0: any, y0: any, x1: any, y1: any, x2: any, y2?: any) {
        const cx = (x0 + x1 + x2) / 3;
        const cy = (y0 + y1 + y2) / 3;
        const expand = 0.4;
        const l0 = Math.hypot(x0 - cx, y0 - cy) || 1;
        const l1 = Math.hypot(x1 - cx, y1 - cy) || 1;
        const l2 = Math.hypot(x2 - cx, y2 - cy) || 1;
        const ex0 = x0 + ((x0 - cx) / l0) * expand;
        const ey0 = y0 + ((y0 - cy) / l0) * expand;
        const ex1 = x1 + ((x1 - cx) / l1) * expand;
        const ey1 = y1 + ((y1 - cy) / l1) * expand;
        const ex2 = x2 + ((x2 - cx) / l2) * expand;
        const ey2 = y2 + ((y2 - cy) / l2) * expand;
  
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(ex0, ey0);
        ctx.lineTo(ex1, ey1);
        ctx.lineTo(ex2, ey2);
        ctx.closePath();
        ctx.clip();
  
        const du1 = u1 - u0, dv1 = v1 - v0;
        const du2 = u2 - u0, dv2 = v2 - v0;
        const det = du1 * dv2 - du2 * dv1;
        if (Math.abs(det) > 1e-6) {
          const inv = 1 / det;
          const dx1 = x1 - x0, dy1 = y1 - y0;
          const dx2 = x2 - x0, dy2 = y2 - y0;
          const a = (dx1 * dv2 - dx2 * dv1) * inv;
          const b = (dy1 * dv2 - dy2 * dv1) * inv;
          const c = (dx2 * du1 - dx1 * du2) * inv;
          const d = (dy2 * du1 - dy1 * du2) * inv;
          const e = x0 - a * u0 - c * v0;
          const f = y0 - b * u0 - d * v0;
          ctx.transform(a, b, c, d, e, f);
          ctx.drawImage(img, 0, 0);
        }
        ctx.restore();
      }
  
      // Deterministic hash for cell content (photo vs color tile vs empty black cell)
      function cellHash(wallId: any, lane: any, depthIdx?: any) {
        let n = (wallId * 73856093) ^ (lane * 19349663) ^ (depthIdx * 83492791);
        n = ((n >> 13) ^ n) * 1274126177;
        return Math.abs(n);
      }
  
      // Tunnel Dimensions: 5x5 grid cross-section
      const COLS = 5;
      const ROWS = 4;
      const DEPTH_SLICES = 14;
  
      let cameraZ = 0;
      let targetZ = 0;
      let dir = 1;
      let isPaused = false;
      let isDragging = false;
      let lastY = 0;
      let lastTime = 0;
      let velocity = 0;
  
      function project(wx: any, wy: any, wz?: any) {
        const fov = Math.min(width, height) * 0.72;
        const scale = fov / Math.max(0.08, wz);
        return {
          x: width * 0.5 + wx * scale,
          y: height * 0.5 + wy * scale
        };
      }
  
      function renderTunnel() {
        if (!isDragging && !isPaused) {
          targetZ += 0.018 * dir;
        }
        if (!isDragging) {
          cameraZ += (targetZ - cameraZ) * 0.12;
        } else {
          cameraZ = targetZ;
        }
  
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
  
        const baseSlice = Math.floor(cameraZ);
        const fracZ = cameraZ - baseSlice;
  
        const halfW = 2.5;
        const halfH = 2.0;
        const sliceLen = 1.0;
  
        // Render from farthest slice to nearest slice (Painter's algorithm)
        for (let s = DEPTH_SLICES; s >= 0; s--) {
          const worldSlice = baseSlice + s;
          const zNear = (s - fracZ) * sliceLen + 0.35;
          const zFar = (s + 1 - fracZ) * sliceLen + 0.35;
          if (zNear <= 0.1) continue;
  
          const fogAlpha = Math.min(1, Math.max(0, 1 - (s - fracZ) / (DEPTH_SLICES - 0.5)));
  
          // 1. TOP & BOTTOM WALLS (5 columns across X)
          for (let c = 0; c < COLS; c++) {
            const x0 = -halfW + (c / COLS) * (halfW * 2);
            const x1 = -halfW + ((c + 1) / COLS) * (halfW * 2);
  
            // Top wall (wy = -halfH)
            drawCell(0, c, worldSlice, x0, -halfH, zNear, x1, -halfH, zNear, x1, -halfH, zFar, x0, -halfH, zFar, fogAlpha);
            // Bottom wall (wy = +halfH)
            drawCell(1, c, worldSlice, x0, halfH, zFar, x1, halfH, zFar, x1, halfH, zNear, x0, halfH, zNear, fogAlpha);
          }
  
          // 2. LEFT & RIGHT WALLS (4 rows across Y)
          for (let r = 0; r < ROWS; r++) {
            const y0 = -halfH + (r / ROWS) * (halfH * 2);
            const y1 = -halfH + ((r + 1) / ROWS) * (halfH * 2);
  
            // Left wall (wx = -halfW)
            drawCell(2, r, worldSlice, -halfW, y0, zNear, -halfW, y0, zFar, -halfW, y1, zFar, -halfW, y1, zNear, fogAlpha);
            // Right wall (wx = +halfW)
            drawCell(3, r, worldSlice, halfW, y0, zFar, halfW, y0, zNear, halfW, y1, zNear, halfW, y1, zFar, fogAlpha);
          }
        }
  
        requestAnimationFrame(renderTunnel);
      }
  
      function drawCell(wallId: any, lane: any, sliceIdx: any, wx0: any, wy0: any, wz0: any, wx1: any, wy1: any, wz1: any, wx2: any, wy2: any, wz2: any, wx3: any, wy3: any, wz3: any, alpha?: any) {
        const p0 = project(wx0, wy0, wz0);
        const p1 = project(wx1, wy1, wz1);
        const p2 = project(wx2, wy2, wz2);
        const p3 = project(wx3, wy3, wz3);
  
        const h = cellHash(wallId, lane, sliceIdx);
        const mod = h % 10;
  
        if (mod < 3) {
          // High-res Photo cell (30% of cells)
          const photoIdx = h % TOTAL_IMGS;
          const tex = textures[photoIdx];
          if (tex) {
            drawQuadImg(tex, p0.x, p0.y, p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, alpha);
          }
        } else if (mod < 5) {
          // Vibrant Color Tile cell (20% of cells)
          const color = COLORS[h % COLORS.length];
          ctx.save();
          ctx.globalAlpha = alpha * 0.92;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineTo(p3.x, p3.y);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
  
        // Crisp white wireframe grid border
        ctx.save();
        ctx.strokeStyle = `rgba(255, 255, 255, ${(alpha * 0.42).toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }
  
      stage.addEventListener('pointerdown', (e: any) => {
        isDragging = true;
        lastY = e.clientY;
        lastTime = performance.now();
        velocity = 0;
        stage.setPointerCapture(e.pointerId);
      });
  
      stage.addEventListener('pointermove', (e: any) => {
        if (!isDragging) return;
        const now = performance.now();
        const dy = e.clientY - lastY;
        const dt = Math.max(1, now - lastTime);
  
        const dZ = dy * 0.015;
        targetZ += dZ;
        velocity = dZ / dt;
  
        lastY = e.clientY;
        lastTime = now;
      });
  
      function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        targetZ += velocity * 140;
      }
  
      stage.addEventListener('pointerup', endDrag);
      stage.addEventListener('pointercancel', endDrag);
  
      window.addEventListener('wheel', (e: any) => {
        e.preventDefault();
        targetZ += e.deltaY * 0.005;
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
        dir *= -1;
      });
  
      requestAnimationFrame(renderTunnel);
}
/* eslint-enable */

export function Carasol17({ className, style, width = '100%', height = '100%', blendMode = "normal", transparentBackground = false, edgeFeather = 0, imageBasePath = 'images' }: Carasol17Props) {
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

    initCarasol17Runtime({
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
      className={className ? `fv-carasols-carasol-17 ${className}` : 'fv-carasols-carasol-17'}
      style={{ width, height, ...blendStyle, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <div className="ui-controls">
            <button className="ui-btn" id="reverseBtn" title="Reverse Flight Direction">
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

          <div id="stage">
            <canvas id="tunnelCanvas"></canvas>
          </div>
    </div>
  );
}

export default Carasol17;
