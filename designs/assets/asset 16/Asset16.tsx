'use client';

/**
 * Asset 16 — 3D Glossy Black Obsidian Metaballs
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Asset16Props {
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
.fv-assets-asset-16 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-assets-asset-16 *, .fv-assets-asset-16 *::before, .fv-assets-asset-16 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-assets-asset-16 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000000;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-assets-asset-16 canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: pointer;
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
function initAsset16Runtime(__fvRuntime: ScopedRuntimeContext): void {
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
  
    // Raymarched 3D Glossy Black Obsidian / Ferrofluid Metaballs Shader
    // Replicating the large central liquid drop + budding/merging satellite droplets,
    // smooth-minimum liquid bridges, and crisp studio white specular reflections of Asset 16!
    const fsSource = `
      precision highp float;
      varying vec2 vUv;
  
      uniform vec2 uResolution;
      uniform float uTime;
      uniform vec2 uPointer;
  
      // Polynomial smooth minimum for organic liquid surface tension bridges
      float smin(float a, float b, float k) {
        float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
        return mix(b, a, h) - k * h * (1.0 - h);
      }
  
      float mapMetaballs(vec3 p) {
        float t = uTime * 0.95;
  
        // Central main wobbling drop (composed of 2 closely coupled core lobes)
        vec3 c0 = vec3(sin(t * 0.7) * 0.12, cos(t * 0.8) * 0.12, 0.0);
        vec3 c1 = vec3(cos(t * 1.1) * 0.28, sin(t * 0.9) * 0.26, sin(t * 0.7) * 0.18);
        float d = smin(length(p - c0) - 0.52, length(p - c1) - 0.40, 0.36);
  
        // Satellite droplet 1: buds off toward top-left -> bottom-left -> merges back
        vec3 s1 = vec3(
          -0.78 * sin(t * 0.82 + 0.4),
           0.72 * cos(t * 0.64 + 1.1),
           0.25 * sin(t * 0.95)
        );
        d = smin(d, length(p - s1) - 0.21, 0.32);
  
        // Satellite droplet 2: buds off toward top-right -> bottom-right -> merges back
        vec3 s2 = vec3(
           0.86 * cos(t * 0.74 + 2.2),
           0.68 * sin(t * 0.92 + 0.5),
          -0.22 * cos(t * 0.80)
        );
        d = smin(d, length(p - s2) - 0.22, 0.32);
  
        // Satellite droplet 3: buds off vertically/diagonally
        vec3 s3 = vec3(
           0.55 * sin(t * 1.05 + 3.8),
          -0.76 * cos(t * 0.78 + 2.0),
           0.28 * sin(t * 0.65)
        );
        d = smin(d, length(p - s3) - 0.185, 0.30);
  
        // Interactive pointer droplet that stretches the central blob toward the cursor
        vec3 ptrPos = vec3(uPointer.x * 0.65, uPointer.y * 0.55, 0.15);
        d = smin(d, length(p - ptrPos) - 0.19, 0.34);
  
        return d;
      }
  
      vec3 calcNormal(vec3 p) {
        vec2 e = vec2(0.0015, 0.0);
        return normalize(vec3(
          mapMetaballs(p + e.xyy) - mapMetaballs(p - e.xyy),
          mapMetaballs(p + e.yxy) - mapMetaballs(p - e.yxy),
          mapMetaballs(p + e.yyx) - mapMetaballs(p - e.yyx)
        ));
      }
  
      void main() {
        vec2 uv = vUv;
        uv.x *= uResolution.x / max(uResolution.y, 1.0);
  
        vec3 ro = vec3(0.0, 0.0, 2.95);
        vec3 rd = normalize(vec3(uv * 0.50, -1.0));
  
        float t = 0.0;
        bool hit = false;
        vec3 p;
  
        for (int i = 0; i < 72; i++) {
          p = ro + rd * t;
          float d = mapMetaballs(p);
          if (d < 0.001) {
            hit = true;
            break;
          }
          t += d;
          if (t > 6.0) break;
        }
  
        if (!hit) {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
          return;
        }
  
        vec3 n = calcNormal(p);
        vec3 v = -rd;
  
        // Studio lighting matching Asset 16 recording:
        // Smooth charcoal-slate diffuse gradient + intense, slightly soft-edged pure white studio highlight
        vec3 keyLight  = normalize(vec3(-0.34, 0.54, 0.77));
        vec3 fillLight = normalize(vec3( 0.45, -0.35, 0.82));
  
        float diffKey  = max(0.0, dot(n, keyLight));
        float diffFill = max(0.0, dot(n, fillLight));
        float fresnel  = pow(1.0 - max(0.0, dot(n, v)), 2.8);
  
        vec3 deepObsidian = vec3(0.015, 0.018, 0.028);
        vec3 midSlate     = vec3(0.085, 0.098, 0.130);
        vec3 rimSlate     = vec3(0.180, 0.210, 0.275);
  
        vec3 col = mix(deepObsidian, midSlate, smoothstep(0.0, 0.85, diffKey * 0.85 + diffFill * 0.25));
        col += rimSlate * fresnel * 0.58;
  
        // Signature bright white studio specular reflection on top-left of every droplet & neck bridge
        vec3 halfVec = normalize(keyLight + v);
        float NdotH = max(0.0, dot(n, halfVec));
        float specSoft  = pow(NdotH, 28.0);
        float specCore  = smoothstep(0.925, 0.985, NdotH);
  
        col += vec3(0.88, 0.92, 1.00) * specSoft * 0.72;
        col = mix(col, vec3(1.0), specCore * 0.96);
  
        gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
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
  
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();
  
    let ptrX = 0.0;
    let ptrY = 0.0;
    let targetX = 0.0;
    let targetY = 0.0;
  
    window.addEventListener('pointermove', (e: any) => {
      targetX = (e.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      targetY = 1 - (e.clientY / Math.max(window.innerHeight, 1)) * 2;
    });
  
    function render(now?: any) {
      const t = now * 0.001;
      ptrX += (targetX - ptrX) * 0.07;
      ptrY += (targetY - ptrY) * 0.07;
  
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uPointer, ptrX, ptrY);
  
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestAnimationFrame(render);
    }
  
    requestAnimationFrame(render);
  })();
}
/* eslint-enable */

export function Asset16({ className, style, width = '100%', height = '100%' }: Asset16Props) {
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

    initAsset16Runtime({
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
      className={className ? `fv-assets-asset-16 ${className}` : 'fv-assets-asset-16'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="glCanvas"></canvas>
    </div>
  );
}

export default Asset16;
