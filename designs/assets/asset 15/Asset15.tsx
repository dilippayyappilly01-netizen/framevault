'use client';

/**
 * Asset 15 — 3D Tilted Silver-White Galactic Ring Vortex
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Asset15Props {
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
}

const SCOPED_STYLES = `
.fv-assets-asset-15 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-assets-asset-15 *, .fv-assets-asset-15 *::before, .fv-assets-asset-15 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-assets-asset-15 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #020308;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-assets-asset-15 canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: grab;
  }

  .fv-assets-asset-15 canvas:active {
    cursor: grabbing;
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
}

/* eslint-disable */
function initAsset15Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl2', { antialias: true }) ||
               canvas.getContext('webgl', { antialias: true });
    if (!gl) return;
  
    const vsSource = `
      attribute float aRadiusNorm;
      attribute float aAngle;
      attribute float aYOffset;
      attribute float aSize;
      attribute float aBrightness;
  
      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uTilt;
  
      varying vec3 vColor;
      varying float vAlpha;
  
      void main() {
        // Softly feather the inner eye boundary (no razor-sharp piled-up white wall) matching Asset 15 video
        float r = 0.21 + pow(aRadiusNorm, 1.18) * 1.45;
  
        // Differential Keplerian orbital rotation around the central void
        float speed = 0.16 / pow(r, 0.85);
        float theta = aAngle + uTime * speed;
  
        // Subtle spiral density wave modulation across the disk
        float spiralMod = sin(theta * 2.0 - r * 7.5 + uTime * 0.4) * 0.5 + 0.5;
        float innerRimFade = smoothstep(0.21, 0.34, r);
        float innerRimBoost = exp(-(r - 0.32) * 3.1) * innerRimFade;
  
        vec3 p = vec3(
          cos(theta) * r,
          aYOffset * (0.018 + r * 0.036),
          sin(theta) * r
        );
  
        // Oblique 3D tilt (~62 deg pitch, ~-16 deg roll matching Asset 15 video)
        float pitch = 1.08 + uTilt.y * 0.15;
        float roll  = -0.26 + uTilt.x * 0.15;
  
        float cp = cos(pitch), sp = sin(pitch);
        float cr = cos(roll),  sr = sin(roll);
  
        // Rotate X (pitch) then Z (roll)
        vec3 p1 = vec3(p.x, p.y * cp - p.z * sp, p.y * sp + p.z * cp);
        vec3 p2 = vec3(p1.x * cr - p1.y * sr, p1.x * sr + p1.y * cr, p1.z);
  
        float fov = 2.45;
        float persp = fov / max(0.5, fov - p2.z * 0.52);
  
        float aspect = uResolution.x / max(uResolution.y, 1.0);
        float scale = 0.94;
        gl_Position = vec4(
          (p2.x * scale * persp) / aspect,
          p2.y * scale * persp,
          0.0,
          1.0
        );
  
        float dpr = min(2.0, uResolution.y / 900.0);
        gl_PointSize = aSize * persp * max(0.9, dpr * 1.05);
  
        // Crisp pure white transitioning smoothly to cool silver-blue & midnight-indigo outward
        vec3 innerWhite = vec3(0.98, 0.99, 1.00);
        vec3 midIceBlue = vec3(0.76, 0.82, 0.96);
        vec3 outerSlate = vec3(0.45, 0.50, 0.72);
  
        vec3 col = mix(outerSlate, midIceBlue, clamp(innerRimBoost + spiralMod * 0.45, 0.0, 1.0));
        col = mix(col, innerWhite, clamp(innerRimBoost * 1.05 + aBrightness * 0.35, 0.0, 1.0));
  
        float outerFade = 1.0 - smoothstep(0.76, 1.0, aRadiusNorm);
        vColor = col;
        vAlpha = clamp((0.14 + 0.56 * innerRimBoost + 0.22 * aBrightness) * innerRimFade * outerFade, 0.01, 0.92);
      }
    `;
  
    const fsSource = `
      precision highp float;
      varying vec3 vColor;
      varying float vAlpha;
  
      void main() {
        vec2 d = gl_PointCoord - 0.5;
        float r2 = dot(d, d) * 4.0;
        if (r2 > 1.0) discard;
        float falloff = 1.0 - smoothstep(0.25, 1.0, r2);
        gl_FragColor = vec4(vColor, vAlpha * falloff);
      }
    `;
  
    function compile(type: any, src?: any) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }
  
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vsSource));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(prog);
    gl.useProgram(prog);
  
    // 70,000 fine star particles for the dense luminous inner ring and wide misty outer disk
    const COUNT = 70000;
    const rNorms = new Float32Array(COUNT);
    const angles = new Float32Array(COUNT);
    const yOffsets = new Float32Array(COUNT);
    const sizes = new Float32Array(COUNT);
    const brights = new Float32Array(COUNT);
  
    for (let i = 0; i < COUNT; i++) {
      rNorms[i] = Math.random();
      angles[i] = Math.random() * Math.PI * 2;
      yOffsets[i] = (Math.random() + Math.random() - 1.0);
      sizes[i] = 0.95 + Math.pow(Math.random(), 2.6) * 1.55;
      brights[i] = Math.random();
    }
  
    function bindAttr(name: any, data: any, size?: any) {
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    }
  
    bindAttr('aRadiusNorm', rNorms, 1);
    bindAttr('aAngle', angles, 1);
    bindAttr('aYOffset', yOffsets, 1);
    bindAttr('aSize', sizes, 1);
    bindAttr('aBrightness', brights, 1);
  
    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uResolution = gl.getUniformLocation(prog, 'uResolution');
    const uTilt = gl.getUniformLocation(prog, 'uTilt');
  
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();
  
    let tiltX = 0;
    let tiltY = 0;
    let targetTiltX = 0;
    let targetTiltY = 0;
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
  
    window.addEventListener('pointerdown', (e: any) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    });
  
    window.addEventListener('pointermove', (e: any) => {
      if (isDragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        targetTiltX = Math.max(-1.2, Math.min(1.2, targetTiltX + dx * 0.005));
        targetTiltY = Math.max(-1.0, Math.min(1.0, targetTiltY + dy * 0.005));
      } else {
        targetTiltX = ((e.clientX / Math.max(window.innerWidth, 1)) * 2 - 1) * 0.25;
        targetTiltY = ((e.clientY / Math.max(window.innerHeight, 1)) * 2 - 1) * 0.25;
      }
    });
  
    window.addEventListener('pointerup', () => {
      isDragging = false;
    });
  
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.clearColor(0.012, 0.016, 0.035, 1.0);
  
    function render(now?: any) {
      const t = now * 0.001;
      tiltX += (targetTiltX - tiltX) * 0.06;
      tiltY += (targetTiltY - tiltY) * 0.06;
  
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform2f(uTilt, tiltX, tiltY);
  
      gl.drawArrays(gl.POINTS, 0, COUNT);
      requestAnimationFrame(render);
    }
  
    requestAnimationFrame(render);
  })();
}
/* eslint-enable */

export function Asset15({ className, style, width = '100%', height = '100%', blendMode = "normal", transparentBackground = false, edgeFeather = 0 }: Asset15Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

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

    initAsset15Runtime({
      root,
      document: scopedDoc,
      window: scopedWin,
      requestAnimationFrame: scopedRaf,
      cancelAnimationFrame: scopedCaf
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
  }, []);

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
      className={className ? `fv-assets-asset-15 ${className}` : 'fv-assets-asset-15'}
      style={{ width, height, ...blendStyle, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="glCanvas"></canvas>
    </div>
  );
}

export default Asset15;
