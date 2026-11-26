'use client';

/**
 * Asset 24 — 3D Multi-Shell Ruffled Wireframe Grid Sphere
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Asset24Props {
  /** Additional CSS class names for the root container */
  className?: string;
  /** Inline styles applied to the root container */
  style?: React.CSSProperties;
  /** Container width (default: '100%') */
  width?: number | string;
  /** Container height (default: '100%') */
  height?: number | string;
}

const SCOPED_STYLES = `
.fv-assets-asset-24 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-assets-asset-24 *, .fv-assets-asset-24 *::before, .fv-assets-asset-24 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-assets-asset-24 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000000;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-assets-asset-24 canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: grab;
  }

  .fv-assets-asset-24 canvas:active {
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
function initAsset24Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl2', { antialias: true }) ||
               canvas.getContext('webgl', { antialias: true });
    if (!gl) return;
  
    const vsSource = `
      attribute vec3 aBaseDir;
      attribute float aShell;   // 0.0 = inner grid core, 1.0 = outermost ruffled petal shell
      attribute float aTheta;
      attribute float aPhi;
  
      uniform float uTime;
      uniform vec2 uResolution;
      uniform mat3 uRot;
  
      varying vec3 vColor;
      varying float vAlpha;
  
      void main() {
        float t = uTime * 1.15;
  
        // Multi-frequency undulating petal ruffles along latitude & longitude (matching Asset 24 video)
        float wave1 = sin(aTheta * 16.0 + t + aShell * 2.2) * sin(aPhi * 14.0 - t * 0.8);
        float wave2 = cos(aTheta * 10.0 - t * 0.9) * cos(aPhi * 18.0 + t * 1.1);
        float wave3 = sin((aTheta + aPhi) * 12.0 - t * 1.3);
  
        // Inner core retains a crisp rectilinear/spherical lattice while outer shells flare into wavy ruffles
        float ruffleAmp = (0.025 + 0.095 * pow(aShell, 1.35));
        float r = (0.58 + aShell * 0.36) + (wave1 * 0.55 + wave2 * 0.30 + wave3 * 0.15) * ruffleAmp;
  
        // Tangential wave ripple for the delicate folded ribbon look at the perimeter
        vec3 pos = aBaseDir * r;
        pos.x += 0.022 * aShell * cos(aPhi * 16.0 + t);
        pos.y += 0.022 * aShell * sin(aTheta * 16.0 - t);
  
        vec3 worldPos = uRot * pos;
  
        float fov = 2.85;
        float persp = fov / (fov - worldPos.z * 0.45);
  
        float aspect = uResolution.x / max(uResolution.y, 1.0);
        float scale = 0.78;
        gl_Position = vec4(
          (worldPos.x * scale * persp) / aspect,
          worldPos.y * scale * persp,
          0.0,
          1.0
        );
  
        float dpr = min(2.0, uResolution.y / 900.0);
        gl_PointSize = (1.55 + 0.65 * aShell) * persp * max(1.0, dpr * 1.18);
  
        // Authentic Asset 24 vertical color gradient:
        // Top pole (+Y): Warm coral-peach & glowing cream-white (#ffd6c8 / #ff967d)
        // Equator (Y ~ 0): Electric azure & royal cobalt-indigo (#1e70ff / #4232f5)
        // Bottom pole (-Y): Vibrant orchid-magenta & glowing lavender-white (#ea66ff / #ffc4ff)
        float ny = clamp(worldPos.y / 0.95, -1.0, 1.0);
  
        vec3 topCoral    = vec3(1.00, 0.72, 0.64);
        vec3 topWhite    = vec3(1.00, 0.94, 0.90);
        vec3 midAzure    = vec3(0.14, 0.46, 1.00);
        vec3 midIndigo   = vec3(0.32, 0.22, 0.95);
        vec3 botMagenta  = vec3(0.92, 0.38, 1.00);
        vec3 botLavender = vec3(1.00, 0.82, 1.00);
  
        vec3 midCol = mix(midIndigo, midAzure, clamp(abs(worldPos.x) * 1.2, 0.0, 1.0));
        vec3 col;
        if (ny >= 0.0) {
          col = mix(midCol, topCoral, smoothstep(0.05, 0.72, ny));
          col = mix(col, topWhite, smoothstep(0.58, 0.98, ny));
        } else {
          float b = -ny;
          col = mix(midCol, botMagenta, smoothstep(0.05, 0.72, b));
          col = mix(col, botLavender, smoothstep(0.58, 0.98, b));
        }
  
        // Grazing limb & wave-ridge caustic brightening
        float r2d = length(worldPos.xy);
        float limbBoost = smoothstep(0.48, 0.98, r2d);
        float ridgeCrest = abs(wave1);
  
        col = mix(col, vec3(1.0), pow(limbBoost * ridgeCrest, 1.45) * 0.62);
  
        vColor = col * (1.15 + 0.45 * limbBoost);
        vAlpha = clamp((0.36 + 0.38 * limbBoost + 0.30 * ridgeCrest) * mix(0.65, 1.0, aShell), 0.15, 0.95);
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
        float glow = 1.0 - smoothstep(0.18, 1.0, r2);
        gl_FragColor = vec4(vColor, vAlpha * glow);
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
  
    // Build 4 concentric spherical rectilinear/polar grid shells (90,000 fine points)
    // so both the crisp inner vertical/horizontal grid and outer wavy ruffled petals appear simultaneously!
    const SHELLS = 4;
    const LAT_STEPS = 150;
    const LON_STEPS = 150;
    const COUNT = SHELLS * LAT_STEPS * LON_STEPS;
  
    const baseDirs = new Float32Array(COUNT * 3);
    const shells = new Float32Array(COUNT);
    const thetas = new Float32Array(COUNT);
    const phis = new Float32Array(COUNT);
  
    let ptr = 0;
    for (let s = 0; s < SHELLS; s++) {
      const shellNorm = s / (SHELLS - 1);
      for (let i = 0; i < LAT_STEPS; i++) {
        // Uniform grid spacing that creates the crisp vertical/horizontal mesh lines in the center
        const u = (i / (LAT_STEPS - 1)) * 2.0 - 1.0;
        const phi = u * (Math.PI * 0.5);
        const cosPhi = Math.cos(phi);
        const sinPhi = Math.sin(phi);
  
        for (let j = 0; j < LON_STEPS; j++) {
          const theta = (j / LON_STEPS) * Math.PI * 2.0;
          const x = cosPhi * Math.sin(theta);
          const y = sinPhi;
          const z = cosPhi * Math.cos(theta);
  
          baseDirs[ptr * 3]     = x;
          baseDirs[ptr * 3 + 1] = y;
          baseDirs[ptr * 3 + 2] = z;
          shells[ptr] = shellNorm;
          thetas[ptr] = theta;
          phis[ptr]   = phi;
          ptr++;
        }
      }
    }
  
    function bindAttr(name: any, data: any, size?: any) {
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    }
  
    bindAttr('aBaseDir', baseDirs, 3);
    bindAttr('aShell', shells, 1);
    bindAttr('aTheta', thetas, 1);
    bindAttr('aPhi', phis, 1);
  
    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uResolution = gl.getUniformLocation(prog, 'uResolution');
    const uRot = gl.getUniformLocation(prog, 'uRot');
  
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();
  
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
      targetRotX = Math.max(-1.2, Math.min(1.2, targetRotX + dy * 0.007));
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
  
      rotX += (targetRotX - rotX) * 0.08;
      rotY += (targetRotY - rotY) * 0.08;
  
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniformMatrix3fv(uRot, false, buildRot(rotX, rotY));
  
      gl.drawArrays(gl.POINTS, 0, COUNT);
      requestAnimationFrame(render);
    }
  
    requestAnimationFrame(render);
  })();
}
/* eslint-enable */

export function Asset24({ className, style, width = '100%', height = '100%' }: Asset24Props) {
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

    initAsset24Runtime({
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

  return (
    <div
      ref={containerRef}
      className={className ? `fv-assets-asset-24 ${className}` : 'fv-assets-asset-24'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="glCanvas"></canvas>
    </div>
  );
}

export default Asset24;
