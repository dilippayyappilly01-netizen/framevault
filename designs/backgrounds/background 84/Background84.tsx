'use client';

/**
 * Background 084 — Emerald Vault Architectural Grid
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Background84Props {
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
.fv-backgrounds-background-84 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-backgrounds-background-84 *, .fv-backgrounds-background-84 *::before, .fv-backgrounds-background-84 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-backgrounds-background-84 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #030b08;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-backgrounds-background-84 canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: grab;
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
function initBackground84Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    // Raymarched 3D repeating architectural monolith pillars in volumetric fog with pointer camera pan (Background 084 — Emerald Vault Architectural Grid)
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl2', { antialias: true }) ||
               canvas.getContext('webgl', { antialias: true });
    if (!gl) return;
  
    const vsSource = `
      attribute vec2 aPos;
      varying vec2 vUv;
      void main() {
        vUv = aPos * 0.5 + 0.5;
        gl_Position = vec4(aPos, 0.0, 1.0);
      }
    `;
  
    const fsSource = `
      precision highp float;
      varying vec2 vUv;
  
      uniform vec2 uResolution;
      uniform float uTime;
      uniform vec2 uPointer;
      uniform vec2 uVelocity;
      uniform vec3 uPulse;
      uniform float uPress;
      uniform float uZoom;
  
  
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
  
      float sdBox(vec3 p, vec3 b) {
        vec3 q = abs(p) - b;
        return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
      }
  
      float mapScene(vec3 p, float t, float scale) {
        vec2 id = floor(p.xz / scale);
        vec2 gv = mod(p.xz, scale) - scale * 0.5;
        float h = hash(id + 17.71);
        float pillarH = 0.65 + 1.35 * (0.5 + 0.5 * sin(t * 0.95 + h * 6.2831 + length(id) * 0.35));
        float dPillar = sdBox(vec3(gv.x, p.y - pillarH * 0.5, gv.y), vec3(scale * 0.32, pillarH * 0.5, scale * 0.32)) - 0.03;
        float dFloor = p.y;
        return min(dPillar, dFloor);
      }
  
      void main() {
        float PILLAR_PITCH = 1.40;
        float FOG_DENSITY = 0.110;
        float RIM_ENERGY = 1.20;
  
        float aspect = uResolution.x / max(uResolution.y, 1.0);
        vec2 uv = (vUv - 0.5) * vec2(aspect, 1.0) * 2.0;
        vec2 ptr = (uPointer - 0.5) * 2.0;
  
        vec3 ro = vec3(ptr.x * 1.4, 2.75 + ptr.y * 0.65, uTime * (1.1 + uPress * 1.6));
        vec3 rd = normalize(vec3(uv.x, uv.y - 0.42 + ptr.y * 0.22, 1.55 * uZoom));
  
        float tDist = 0.2;
        float hit = 0.0;
        vec3 hitP = vec3(0.0);
        const int STEPS = 44;
        for (int i = 0; i < STEPS; i++) {
          vec3 p = ro + rd * tDist;
          float d = mapScene(p, uTime, PILLAR_PITCH);
          if (d < 0.008) {
            hit = 1.0;
            hitP = p;
            break;
          }
          tDist += d * 0.72;
          if (tDist > 26.0) break;
        }
  
        vec3 fogBase   = vec3(0.012, 0.043, 0.031);
        vec3 stoneDark = vec3(0.059, 0.141, 0.114);
        vec3 lightBeam = vec3(0.020, 0.588, 0.412);
        vec3 edgeNeon  = vec3(0.204, 0.827, 0.600);
        vec3 highlight = vec3(0.820, 0.980, 0.898);
  
        vec3 col = fogBase + lightBeam * exp(-abs(uv.y + 0.12) * 4.5) * 0.28;
        if (hit > 0.5) {
          float eps = 0.015;
          vec3 n = normalize(vec3(
            mapScene(hitP + vec3(eps, 0.0, 0.0), uTime, PILLAR_PITCH) - mapScene(hitP - vec3(eps, 0.0, 0.0), uTime, PILLAR_PITCH),
            mapScene(hitP + vec3(0.0, eps, 0.0), uTime, PILLAR_PITCH) - mapScene(hitP - vec3(0.0, eps, 0.0), uTime, PILLAR_PITCH),
            mapScene(hitP + vec3(0.0, 0.0, eps), uTime, PILLAR_PITCH) - mapScene(hitP - vec3(0.0, 0.0, eps), uTime, PILLAR_PITCH)
          ));
          vec3 lDir = normalize(vec3(-0.45 + ptr.x * 0.4, 0.85, -0.35));
          float diff = max(0.0, dot(n, lDir));
          float topMask = smoothstep(0.75, 0.98, n.y);
          vec2 gv = abs(mod(hitP.xz, PILLAR_PITCH) - PILLAR_PITCH * 0.5);
          float capEdge = topMask * smoothstep(PILLAR_PITCH * 0.24, PILLAR_PITCH * 0.33, max(gv.x, gv.y));
  
          vec3 surf = stoneDark * (0.35 + 0.65 * diff);
          surf += lightBeam * topMask * 0.22;
          surf += edgeNeon * capEdge * 0.95 * RIM_ENERGY;
          surf += highlight * pow(max(0.0, dot(reflect(-lDir, n), -rd)), 20.0) * 0.55;
  
          float fog = exp(-tDist * FOG_DENSITY);
          col = mix(col, surf, fog);
        }
  
        col = 1.0 - exp(-col * 1.15);
        gl_FragColor = vec4(col, 1.0);
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
    const uPointer = gl.getUniformLocation(prog, 'uPointer');
    const uVelocity = gl.getUniformLocation(prog, 'uVelocity');
    const uPulse = gl.getUniformLocation(prog, 'uPulse');
    const uPress = gl.getUniformLocation(prog, 'uPress');
    const uZoom = gl.getUniformLocation(prog, 'uZoom');
  
  
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();
  
    let ptrX = 0.5, ptrY = 0.5;
    let targetPtrX = 0.5, targetPtrY = 0.5;
    let velX = 0.0, velY = 0.0;
    let pulseX = 0.5, pulseY = 0.5, pulseTime = -20.0;
    let press = 0.0, targetPress = 0.0;
    let zoom = 1.0, targetZoom = 1.0;
    let nowSec = 0.0;
  
    window.addEventListener('pointermove', (e: any) => {
      const nx = e.clientX / Math.max(window.innerWidth, 1);
      const ny = 1.0 - e.clientY / Math.max(window.innerHeight, 1);
      velX += (nx - targetPtrX) * 0.8;
      velY += (ny - targetPtrY) * 0.8;
      targetPtrX = nx;
      targetPtrY = ny;
    });
  
    window.addEventListener('pointerdown', (e: any) => {
      targetPress = 1.0;
      pulseX = e.clientX / Math.max(window.innerWidth, 1);
      pulseY = 1.0 - e.clientY / Math.max(window.innerHeight, 1);
      pulseTime = nowSec;
    });
  
    window.addEventListener('pointerup', () => {
      targetPress = 0.0;
    });
  
    window.addEventListener('pointerleave', () => {
      targetPress = 0.0;
    });
  
    window.addEventListener('wheel', (e: any) => {
      targetZoom = Math.max(0.6, Math.min(1.75, targetZoom + e.deltaY * 0.0005));
    }, { passive: true });
  
    function render(now?: any) {
      const t = now * 0.001;
      nowSec = t;
  
      ptrX += (targetPtrX - ptrX) * 0.08;
      ptrY += (targetPtrY - ptrY) * 0.08;
      velX *= 0.90;
      velY *= 0.90;
      press += (targetPress - press) * 0.09;
      zoom += (targetZoom - zoom) * 0.08;
  
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uPointer, ptrX, ptrY);
      gl.uniform2f(uVelocity, velX, velY);
      gl.uniform3f(uPulse, pulseX, pulseY, pulseTime);
      gl.uniform1f(uPress, press);
      gl.uniform1f(uZoom, zoom);
  
  
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestAnimationFrame(render);
    }
  
    requestAnimationFrame(render);
  })();
}
/* eslint-enable */

export function Background84({ className, style, width = '100%', height = '100%' }: Background84Props) {
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

    initBackground84Runtime({
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
      className={className ? `fv-backgrounds-background-84 ${className}` : 'fv-backgrounds-background-84'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="glCanvas"></canvas>
    </div>
  );
}

export default Background84;
