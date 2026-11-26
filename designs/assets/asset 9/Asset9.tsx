'use client';

/**
 * Asset 09 — Gargantua Relativistic Black Hole &amp; Lensed Accretion Disk
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Asset9Props {
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
.fv-assets-asset-9 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-assets-asset-9 *, .fv-assets-asset-9 *::before, .fv-assets-asset-9 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-assets-asset-9 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000000;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-assets-asset-9 canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: grab;
  }

  .fv-assets-asset-9 canvas:active {
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
function initAsset9Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl2', { antialias: true }) ||
               canvas.getContext('webgl', { antialias: true });
    if (!gl) return;
  
    const vsSource = `
      attribute vec2 aPos;
      varying vec2 vUv;
      void main() {
        vUv = aPos;
        gl_Position = vec4(aPos, 0.0, 1.0);
      }
    `;
  
    // Schwarzschild Relativistic Geodesic Black Hole Raytracer
    // Integrates curved null geodesics around a black hole to produce the exact:
    // 1) Central pitch-black Event Horizon shadow
    // 2) Thin lower semicircular white-lavender Einstein Photon Ring
    // 3) Upper gravitationally lensed accretion disk arch curving over the shadow
    // 4) Foreground equatorial accretion disk with Doppler-beamed white-silver inner lanes
    //    and champagne-gold / warm bronze / rose-taupe outer differential-rotation filaments!
    const fsSource = `
      precision highp float;
      varying vec2 vUv;
  
      uniform vec2 uResolution;
      uniform float uTime;
      uniform vec2 uOrbit;
  
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }
  
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), f.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
          f.y
        );
      }
  
      // Swirling fibrous Keplerian accretion disk shader
      vec4 evaluateDisk(vec3 hitPos, float t) {
        float r = length(hitPos.xz);
        float innerR = 1.56;
        float outerR = 7.45;
  
        if (r < innerR || r > outerR) return vec4(0.0);
  
        // Normalized radial coordinate u in [0, 1]
        float u = (r - innerR) / (outerR - innerR);
  
        // Differential Keplerian angular speed
        float phi = atan(hitPos.z, hitPos.x);
        float keplerSpeed = 2.0 / pow(r, 1.12);
        float woundAngle = phi + t * keplerSpeed + r * 3.4;
  
        float ring1 = sin(r * 13.0 + sin(woundAngle * 2.0) * 0.7) * 0.5 + 0.5;
        float ring2 = cos(r * 28.0 - woundAngle * 3.0) * 0.5 + 0.5;
        float ring3 = noise(vec2(r * 9.0, woundAngle * 1.8));
        float ring4 = noise(vec2(r * 20.0, woundAngle * 3.8 + t * 0.45));
  
        float streaks = ring1 * 0.36 + ring2 * 0.24 + ring3 * 0.25 + ring4 * 0.15;
        streaks = pow(clamp(streaks * 1.15, 0.0, 1.0), 1.25);
  
        float darkLane1 = 1.0 - 0.52 * exp(-pow((u - 0.24) * 15.0, 2.0));
        float darkLane2 = 1.0 - 0.42 * exp(-pow((u - 0.54) * 12.0, 2.0));
        streaks *= darkLane1 * darkLane2;
  
        float doppler = clamp(1.0 - (hitPos.x / r) * 0.34, 0.58, 1.45);
  
        // Warm creamy-white inner disk tapering into warm copper-amber wide wings matching Asset 9 video
        vec3 innerWhite  = vec3(0.99, 0.97, 0.94);
        vec3 midRoseGold = vec3(0.90, 0.76, 0.65);
        vec3 outerBronze = vec3(0.72, 0.44, 0.26);
        vec3 deepEdge    = vec3(0.26, 0.12, 0.06);
  
        float coreBoost = exp(-u * 4.2);
        vec3 col = mix(innerWhite, midRoseGold, smoothstep(0.05, 0.40, u));
        col = mix(col, outerBronze, smoothstep(0.32, 0.74, u));
        col = mix(col, deepEdge,    smoothstep(0.68, 1.00, u));
  
        float innerFade = smoothstep(0.0, 0.04, u);
        float outerFade = pow(1.0 - smoothstep(0.45, 1.0, u), 1.55);
        float alpha = clamp(streaks * innerFade * outerFade * 1.45, 0.0, 0.98);
  
        col *= (0.38 + 0.92 * streaks) * doppler * (1.0 + coreBoost * 0.55);
  
        return vec4(col, alpha);
      }
  
      void main() {
        vec2 uv = vUv;
        uv.x *= uResolution.x / max(uResolution.y, 1.0);
  
        // Gentle ~6 deg tilt matching Asset 9 video horizontal Gargantua disk
        float roll = -0.105 + uOrbit.x * 0.18;
        float cr = cos(roll), sr = sin(roll);
        vec2 ruv = vec2(uv.x * cr - uv.y * sr, uv.x * sr + uv.y * cr);
  
        // Low grazing camera angle (~5.8 deg) so accretion disk spans widely horizontally
        float camPitch = 0.102 + uOrbit.y * 0.12;
        float camDist = 9.2;
        vec3 ro = vec3(0.0, sin(camPitch) * camDist, cos(camPitch) * camDist);
  
        vec3 forward = normalize(-ro);
        vec3 right = vec3(1.0, 0.0, 0.0);
        vec3 up = normalize(cross(right, forward));
  
        vec3 rd = normalize(forward + (ruv.x * right + ruv.y * up) * 0.72);
  
        // Specific angular momentum squared h^2 = |ro x rd|^2 for Schwarzschild geodesic deflection
        vec3 hVec = cross(ro, rd);
        float h2 = dot(hVec, hVec);
  
        vec3 pos = ro;
        vec3 dir = rd;
  
        vec3 accumCol = vec3(0.0);
        float transmittance = 1.0;
        bool swallowed = false;
        float minR = 100.0;
  
        // Symplectic geodesic ray integration around the black hole
        const int STEPS = 110;
        for (int i = 0; i < STEPS; i++) {
          float r2 = dot(pos, pos);
          float r = sqrt(r2);
          minR = min(minR, r);
  
          // Event Horizon capture radius (Schwarzschild radius r_s = 1.0)
          if (r < 1.02) {
            swallowed = true;
            break;
          }
          if (r > 13.5 && i > 20) break;
  
          // Adaptive step size: smaller near the black hole photon sphere (r ~ 1.5), larger far away
          float dt = clamp(r * 0.075, 0.045, 0.28);
  
          // Gravitational light-bending acceleration: a = -1.5 * r_s * h^2 * pos / r^5
          vec3 accel = -1.5 * h2 * pos / (r2 * r2 * r + 1e-4);
          vec3 nextDir = normalize(dir + accel * dt);
          vec3 nextPos = pos + nextDir * dt;
  
          // Check if the curved photon ray crossed the equatorial accretion disk plane (y = 0)
          if (pos.y * nextPos.y <= 0.0) {
            float frac = abs(pos.y) / (abs(pos.y) + abs(nextPos.y) + 1e-6);
            vec3 hitPos = mix(pos, nextPos, frac);
            vec4 diskSample = evaluateDisk(hitPos, uTime);
            if (diskSample.a > 0.005) {
              accumCol += transmittance * diskSample.rgb * diskSample.a;
              transmittance *= (1.0 - diskSample.a);
              if (transmittance < 0.01) break;
            }
          }
  
          pos = nextPos;
          dir = nextDir;
        }
  
        // Razor-thin Einstein Photon Ring around the lower hemisphere of the black hole shadow
        // Matches the delicate thin white-lavender semicircular ring underneath the black hole in Asset 9!
        float photonRingDist = abs(minR - 1.52);
        float photonRing = exp(-photonRingDist * 42.0) * smoothstep(0.15, -0.35, ruv.y) * transmittance;
        accumCol += vec3(0.86, 0.82, 0.98) * photonRing * 0.88;
  
        // Subtle atmospheric bloom around the bright inner lensed arch
        accumCol = 1.0 - exp(-accumCol * 1.18);
  
        gl_FragColor = vec4(clamp(accumCol, 0.0, 1.0), 1.0);
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
  
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
  
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  
    const uResolution = gl.getUniformLocation(prog, 'uResolution');
    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uOrbit = gl.getUniformLocation(prog, 'uOrbit');
  
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();
  
    let orbitX = 0;
    let orbitY = 0;
    let targetOrbitX = 0;
    let targetOrbitY = 0;
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
        targetOrbitX = Math.max(-1.2, Math.min(1.2, targetOrbitX + dx * 0.004));
        targetOrbitY = Math.max(-0.85, Math.min(1.2, targetOrbitY + dy * 0.004));
      }
    });
  
    window.addEventListener('pointerup', () => {
      isDragging = false;
    });
  
    function render(now?: any) {
      const t = now * 0.001;
  
      orbitX += (targetOrbitX - orbitX) * 0.08;
      orbitY += (targetOrbitY - orbitY) * 0.08;
  
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uOrbit, orbitX, orbitY);
  
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestAnimationFrame(render);
    }
  
    requestAnimationFrame(render);
  })();
}
/* eslint-enable */

export function Asset9({ className, style, width = '100%', height = '100%' }: Asset9Props) {
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

    initAsset9Runtime({
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
      className={className ? `fv-assets-asset-9 ${className}` : 'fv-assets-asset-9'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="glCanvas"></canvas>
    </div>
  );
}

export default Asset9;
