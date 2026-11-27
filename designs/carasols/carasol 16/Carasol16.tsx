'use client';

/**
 * 3D Panoramic Room Cube Carousel
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Carasol16Props {
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
.fv-carasols-carasol-16 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-carasols-carasol-16 * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
      -webkit-user-select: none;
    }

    .fv-carasols-carasol-16 {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #000000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    .fv-carasols-carasol-16 .viewport {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      perspective: 520px;
      perspective-origin: 50% 50%;
      cursor: grab;
      touch-action: none;
      overflow: hidden;
    }

    .fv-carasols-carasol-16 .viewport:active {
      cursor: grabbing;
    }

    /* Camera sits inside the 3D room looking outward at the walls */
    .fv-carasols-carasol-16 .room-camera {
      position: relative;
      width: 0;
      height: 0;
      transform-style: preserve-3d;
      will-change: transform;
    }

    .fv-carasols-carasol-16 .room-wall {
      position: absolute;
      width: 960px;
      height: 540px;
      margin-left: -480px;
      margin-top: -270px;
      overflow: hidden;
      background: #080808;
      border-left: 4px solid #000;
      border-right: 4px solid #000;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      transform-style: preserve-3d;
    }

    .fv-carasols-carasol-16 .room-wall img {
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

    /* Optional psychedelic liquid SVG filter toggle matching the recording */
    .fv-carasols-carasol-16.psychedelic-mode .room-wall img {
      filter: url(#liquidPsyFilter) saturate(2.1) contrast(1.25);
    }

    .fv-carasols-carasol-16 .ui-controls {
      position: absolute;
      top: 18px;
      right: 18px;
      display: flex;
      gap: 8px;
      z-index: 40;
    }

    .fv-carasols-carasol-16 .ui-btn {
      height: 34px;
      padding: 0 11px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.14);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.18);
      color: #fff;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.05em;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      cursor: pointer;
    }

    .fv-carasols-carasol-16 .ui-btn:hover {
      background: rgba(255, 255, 255, 0.25);
    }

    .fv-carasols-carasol-16 .ui-btn svg {
      width: 14px;
      height: 14px;
      stroke: currentColor;
      stroke-width: 2;
      fill: none;
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
function initCarasol16Runtime(__fvRuntime: ScopedRuntimeContext): void {
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
  
      const camera = document.getElementById('camera');
      const viewport = document.getElementById('viewport');
      const pauseBtn = document.getElementById('pauseBtn');
      const pauseIcon = document.getElementById('pauseIcon');
      const fxBtn = document.getElementById('fxBtn');
      const turbNode = document.getElementById('turbNode');
  
      // 4 interior walls forming a square 3D room (960px wide each -> apothem = 480px)
      // As the room rotates, walls behind the viewer cycle through all 12 high-res photos!
      const WALL_APOTHEM = 478;
      const wallConfigs = [
        { rotY: 0,   tx: 0,             tz: -WALL_APOTHEM }, // Front wall (North)
        { rotY: -90, tx: WALL_APOTHEM,  tz: 0 },             // Right wall (East)
        { rotY: 180, tx: 0,             tz: WALL_APOTHEM },  // Back wall (South)
        { rotY: 90,  tx: -WALL_APOTHEM, tz: 0 }              // Left wall (West)
      ];
  
      const walls = wallConfigs.map((cfg: any, idx: any) => {
        const el = document.createElement('div');
        el.className = 'room-wall';
        el.style.transform = `translate3d(${cfg.tx}px, 0, ${cfg.tz}px) rotateY(${cfg.rotY}deg)`;
        const img = document.createElement('img');
        img.src = IMAGES[idx % IMAGES.length];
        img.loading = 'eager';
        img.decoding = 'sync';
        img.fetchPriority = 'high';
        el.appendChild(img);
        camera.appendChild(el);
        return { el, img, cfg, currentPhotoIdx: idx };
      });
  
      let yaw = -25;
      let targetYaw = -25;
      let isPaused = false;
      let isDragging = false;
      let lastX = 0;
      let lastTime = 0;
      let velocity = 0;
      let phase = 0;
  
      function renderRoom() {
        phase += 0.008;
        if (document.body.classList.contains('psychedelic-mode')) {
          const bfX = 0.01 + Math.sin(phase) * 0.004;
          const bfY = 0.022 + Math.cos(phase * 0.8) * 0.006;
          turbNode.setAttribute('baseFrequency', `${bfX.toFixed(4)} ${bfY.toFixed(4)}`);
        }
  
        if (!isDragging && !isPaused) {
          targetYaw -= 0.32;
        }
  
        if (!isDragging) {
          yaw += (targetYaw - yaw) * 0.1;
        } else {
          yaw = targetYaw;
        }
  
        // Move camera slightly backward (`translateZ(180px)`) so we see the front wall plus left & right side walls just like the video!
        camera.style.transform = `translate3d(0, 0, 165px) rotateY(${yaw.toFixed(2)}deg)`;
  
        // Seamless photo cycling on the wall currently behind the camera so all 12 photos appear as you turn
        const quarterTurns = Math.floor(-yaw / 90);
        walls.forEach((w: any, wallIdx: any) => {
          const turnCycle = Math.floor((quarterTurns - wallIdx + 2) / 4);
          const photoIdx = (((wallIdx + turnCycle * 4) % IMAGES.length) + IMAGES.length) % IMAGES.length;
          if (w.currentPhotoIdx !== photoIdx) {
            w.currentPhotoIdx = photoIdx;
            w.img.src = IMAGES[photoIdx];
          }
        });
  
        requestAnimationFrame(renderRoom);
      }
  
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
  
        const dYaw = dx * 0.25;
        targetYaw += dYaw;
        velocity = dYaw / dt;
  
        lastX = e.clientX;
        lastTime = now;
      });
  
      function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        targetYaw += velocity * 150;
      }
  
      viewport.addEventListener('pointerup', endDrag);
      viewport.addEventListener('pointercancel', endDrag);
  
      window.addEventListener('wheel', (e: any) => {
        e.preventDefault();
        targetYaw -= (e.deltaX || e.deltaY) * 0.12;
      }, { passive: false });
  
      pauseBtn.addEventListener('click', () => {
        isPaused = !isPaused;
        if (isPaused) {
          pauseIcon.innerHTML = `<polygon points="8 5 19 12 8 19 8 5" fill="currentColor"></polygon>`;
        } else {
          pauseIcon.innerHTML = `<line x1="9" y1="6" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="18"></line>`;
        }
      });
  
      fxBtn.addEventListener('click', () => {
        document.body.classList.toggle('psychedelic-mode');
        const isPsy = document.body.classList.contains('psychedelic-mode');
        fxBtn.textContent = isPsy ? 'FX: LIQUID SHADER' : 'FX: HD PHOTO';
      });
  
      requestAnimationFrame(renderRoom);
}
/* eslint-enable */

export function Carasol16({ className, style, width = '100%', height = '100%', blendMode = "normal", transparentBackground = false, edgeFeather = 0, imageBasePath = 'images' }: Carasol16Props) {
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

    initCarasol16Runtime({
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
      className={className ? `fv-carasols-carasol-16 ${className}` : 'fv-carasols-carasol-16'}
      style={{ width, height, ...blendStyle, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        {/* Dynamic SVG Displacement Filter for optional Liquid Wave Mode */}
          <svg width="0" height="0" style={{ position: "absolute" }}>
            <defs>
              <filter id="liquidPsyFilter" x="-10%" y="-10%" width="120%" height="120%">
                <feTurbulence id="turbNode" type="turbulence" baseFrequency="0.012 0.025" numOctaves="2" result="warp"  />
                <feDisplacementMap in="SourceGraphic" in2="warp" scale="28" xChannelSelector="R" yChannelSelector="G"  />
              </filter>
            </defs>
          </svg>

          <div className="ui-controls">
            <button className="ui-btn" id="fxBtn" title="Toggle Liquid Distortion Effect">FX: LIQUID SHADER</button>
            <button className="ui-btn" id="pauseBtn" title="Pause / Resume Rotation">
              <svg viewBox="0 0 24 24" id="pauseIcon">
                <line x1="9" y1="6" x2="9" y2="18"></line>
                <line x1="15" y1="6" x2="15" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="viewport" id="viewport">
            <div className="room-camera" id="camera"></div>
          </div>
    </div>
  );
}

export default Carasol16;
