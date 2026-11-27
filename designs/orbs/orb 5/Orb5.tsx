'use client';

/**
 * Orb 05 — 3D Golden-Ember Fine Particle Nebula Sphere
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Orb5Props {
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
.fv-orbs-orb-5 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-orbs-orb-5 *, .fv-orbs-orb-5 *::before, .fv-orbs-orb-5 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-orbs-orb-5 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000000;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-orbs-orb-5 canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: grab;
  }

  .fv-orbs-orb-5 canvas:active {
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
function initOrb5Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl2', { antialias: true }) ||
               canvas.getContext('webgl', { antialias: true });
    if (!gl) return;
  
    const vsSource = `
      attribute vec3 aPos;
      attribute float aHeat;
      attribute float aSize;
      attribute float aLayer;
  
      uniform vec2 uResolution;
      uniform mat3 uRot;
      uniform float uTime;
  
      varying vec3 vColor;
      varying float vAlpha;
  
      void main() {
        vec3 rp = uRot * aPos;
  
        // Perspective camera matching the Orb 5 recording
        float fov = 3.2;
        float persp = fov / (fov - rp.z * 0.48);
  
        float aspect = uResolution.x / max(uResolution.y, 1.0);
        float radius = 0.66;
        vec2 screenPos = vec2(
          (rp.x * radius * persp) / aspect,
          rp.y * radius * persp
        );
  
        gl_Position = vec4(screenPos, 0.0, 1.0);
  
        // Fine luminous astronomical dust points visible across the golden sphere perimeter
        float dpr = min(2.0, uResolution.y / 900.0);
        gl_PointSize = aSize * persp * max(1.35, dpr * 1.65);
  
        // Natural limb brightening on the outer spherical shell + front-hemisphere visibility
        float r2d = clamp(length(rp.xy), 0.0, 1.0);
        float limb = (aLayer < 0.5) ? (0.62 + 0.78 * pow(r2d, 1.85)) : 1.0;
        float depthFade = mix(0.42, 1.0, smoothstep(-0.95, 0.85, rp.z));
  
        // Authentic copper -> burnt orange -> amber -> bright gold color ramp from Orb 5 video
        vec3 darkCopper = vec3(0.55, 0.22, 0.05);
        vec3 burntAmber = vec3(0.90, 0.44, 0.10);
        vec3 warmGold   = vec3(1.00, 0.74, 0.28);
        vec3 hotCore    = vec3(1.00, 0.94, 0.68);
  
        vec3 col = mix(darkCopper, burntAmber, smoothstep(0.0, 0.45, aHeat));
        col = mix(col, warmGold, smoothstep(0.38, 0.78, aHeat));
        col = mix(col, hotCore,  smoothstep(0.75, 1.00, aHeat));
  
        vColor = col;
        vAlpha = clamp((0.36 + 0.62 * aHeat) * limb * depthFade, 0.08, 0.96);
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
        float falloff = 1.0 - smoothstep(0.12, 1.0, r2);
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
  
    // Simple 3D deterministic pseudo-noise for realistic filamentary clumping on the sphere and core
    function fbm3(x: any, y: any, z?: any) {
      const s1 = Math.sin(x * 3.7 + Math.cos(y * 4.1 + z * 3.3));
      const s2 = Math.cos(y * 7.3 - Math.sin(z * 6.7 + x * 5.9)) * 0.5;
      const s3 = Math.sin(z * 13.1 + x * 11.7 - y * 12.3) * 0.25;
      return (s1 + s2 + s3) / 1.75;
    }
  
    // Generate 30,000 ultra-fine particles matching Orb 5:
    // 1) Crisp outer spherical dust shell with wispy turbulent voids (~19,000 points)
    // 2) Off-center glowing golden-amber nebula cluster & internal filament clouds (~11,000 points)
    //    that starts at bottom-right (00:00) and rotates toward center (00:08)
    const TOTAL = 30000;
    const positions = new Float32Array(TOTAL * 3);
    const heats = new Float32Array(TOTAL);
    const sizes = new Float32Array(TOTAL);
    const layers = new Float32Array(TOTAL);
  
    // Hotspot center in object space (at t=0 positioned at bottom-right (+0.52, -0.26, +0.58))
    const hotCenter = { x: 0.52, y: -0.26, z: 0.58 };
  
    let idx = 0;
    while (idx < TOTAL) {
      const isHotCluster = idx < 10500;
  
      let x: any, y: any, z: any, heat: any, size: any, layer: any;
  
      if (!isHotCluster) {
        // Outer spherical shell + sparse internal dust veil
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2 * Math.PI;
        const phi = Math.acos(2 * v - 1);
  
        const nx = Math.sin(phi) * Math.cos(theta);
        const ny = Math.sin(phi) * Math.sin(theta);
        const nz = Math.cos(phi);
  
        // Modulate density with 3D turbulence so the shell has organic dark voids and glowing veins
        const turb = fbm3(nx * 1.4, ny * 1.4, nz * 1.4);
        if (turb < -0.32 && Math.random() < 0.72) continue;
  
        const isOuterBoundary = Math.random() < 0.78;
        const rad = isOuterBoundary
          ? (0.972 + Math.pow(Math.random(), 2.0) * 0.028)
          : (0.35 + Math.pow(Math.random(), 0.7) * 0.62);
  
        x = nx * rad;
        y = ny * rad;
        z = nz * rad;
  
        // Boost warmth near the hotspot region on the shell as well
        const dHot = Math.hypot(x - hotCenter.x, y - hotCenter.y, z - hotCenter.z);
        const hotBoost = Math.exp(-dHot * dHot * 3.2) * 0.52;
  
        heat = Math.min(1.0, Math.max(0.08, 0.22 + turb * 0.28 + hotBoost + (Math.random() - 0.5) * 0.18));
        size = 0.95 + Math.random() * 0.85;
        layer = isOuterBoundary ? 0.0 : 1.0;
      } else {
        // Dense clumpy golden-amber nebula cluster around hotCenter with multiple glowing sub-knots
        const subKnot = idx % 5;
        const knotOffsets = [
          [0.00,  0.00,  0.00],
          [0.09,  0.07,  0.05],
          [-0.08, -0.05, 0.08],
          [0.05, -0.09, -0.06],
          [-0.07, 0.08, -0.04]
        ][subKnot];
  
        // Gaussian-like radial falloff from sub-knot center
        const r = Math.pow(Math.random(), 1.65) * 0.42;
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
  
        x = hotCenter.x + knotOffsets[0] + r * Math.sin(phi) * Math.cos(theta);
        y = hotCenter.y + knotOffsets[1] + r * Math.sin(phi) * Math.sin(theta);
        z = hotCenter.z + knotOffsets[2] + r * Math.cos(phi);
  
        // Constrain strictly inside the outer sphere (r <= 0.985)
        const len = Math.hypot(x, y, z);
        if (len > 0.982) {
          const s = (0.95 + Math.random() * 0.032) / len;
          x *= s;
          y *= s;
          z *= s;
        }
  
        const dCenter = Math.hypot(
          x - (hotCenter.x + knotOffsets[0]),
          y - (hotCenter.y + knotOffsets[1]),
          z - (hotCenter.z + knotOffsets[2])
        );
        const clump = fbm3(x * 4.5, y * 4.5, z * 4.5) * 0.22;
        heat = Math.min(1.0, Math.max(0.25, 0.98 - dCenter * 2.1 + clump));
        size = 1.05 + Math.random() * 1.15 * (0.6 + 0.5 * heat);
        layer = 1.0;
      }
  
      positions[idx * 3]     = x;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = z;
      heats[idx] = heat;
      sizes[idx] = size;
      layers[idx] = layer;
      idx++;
    }
  
    function bindAttr(name: any, data: any, size?: any) {
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    }
  
    bindAttr('aPos', positions, 3);
    bindAttr('aHeat', heats, 1);
    bindAttr('aSize', sizes, 1);
    bindAttr('aLayer', layers, 1);
  
    const uResolution = gl.getUniformLocation(prog, 'uResolution');
    const uRot = gl.getUniformLocation(prog, 'uRot');
    const uTime = gl.getUniformLocation(prog, 'uTime');
  
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();
  
    // Rotation state: starts at (rotX=0, rotY=0) where the golden core is at bottom-right (00:00)
    // and rotates smoothly leftward/upward toward the center (00:08)
    let rotX = 0.0;
    let rotY = 0.0;
    let targetRotX = 0.0;
    let targetRotY = 0.0;
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
  
    window.addEventListener('pointerdown', (e: any) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    });
  
    window.addEventListener('pointermove', (e: any) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      targetRotY += dx * 0.007;
      targetRotX = Math.max(-1.4, Math.min(1.4, targetRotX + dy * 0.007));
    });
  
    window.addEventListener('pointerup', () => {
      isDragging = false;
    });
  
    function buildRot(rx: any, ry?: any) {
      const cx = Math.cos(rx), sx = Math.sin(rx);
      const cy = Math.cos(ry), sy = Math.sin(ry);
      return new Float32Array([
        cy, sx * sy, -cx * sy,
        0,  cx,       sx,
        sy, -sx * cy, cx * cy
      ]);
    }
  
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
  
    function render(now?: any) {
      const t = now * 0.001;
      if (!isDragging) {
        // Smooth rotation carrying the golden cluster from bottom-right toward the center
        targetRotY -= 0.0016;
        targetRotX = Math.sin(t * 0.22) * 0.18;
      }
  
      rotX += (targetRotX - rotX) * 0.08;
      rotY += (targetRotY - rotY) * 0.08;
  
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.uniformMatrix3fv(uRot, false, buildRot(rotX, rotY));
  
      gl.drawArrays(gl.POINTS, 0, TOTAL);
      requestAnimationFrame(render);
    }
  
    requestAnimationFrame(render);
  })();
}
/* eslint-enable */

export function Orb5({ className, style, width = '100%', height = '100%', blendMode = "normal", transparentBackground = false, edgeFeather = 0 }: Orb5Props) {
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

    initOrb5Runtime({
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
      className={className ? `fv-orbs-orb-5 ${className}` : 'fv-orbs-orb-5'}
      style={{ width, height, ...blendStyle, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="glCanvas"></canvas>
    </div>
  );
}

export default Orb5;
