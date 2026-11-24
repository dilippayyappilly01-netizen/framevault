'use client';

/**
 * Asset 13 — 3D Brilliant-Cut Faceted Crystal Diamond
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Asset13Props {
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
.fv-assets-asset-13 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-assets-asset-13 *, .fv-assets-asset-13 *::before, .fv-assets-asset-13 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-assets-asset-13 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000000;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-assets-asset-13 canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: grab;
  }

  .fv-assets-asset-13 canvas:active {
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
function initAsset13Runtime(__fvRuntime: ScopedRuntimeContext): void {
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
  
    // Exact Convex-Polyhedron Raycasted Round Brilliant-Cut Diamond with Multi-Bounce Internal
    // Total Internal Reflection (TIR) & Facet Scintillation matching Asset 13 recording!
    const fsSource = `
      precision highp float;
      varying vec2 vUv;
  
      uniform vec2 uResolution;
      uniform float uTime;
      uniform mat3 uRot;
      uniform mat3 uInvRot;
  
      // Exact ray-convex-polyhedron intersection for a multi-tiered brilliant-cut diamond
      // Returns (tNear, tFar) and outputs front-face normal nFront and back-face normal nBack
      vec2 intersectDiamond(vec3 ro, vec3 rd, out vec3 nFront, out vec3 nBack) {
        float tNear = -1e9;
        float tFar  =  1e9;
        nFront = vec3(0.0, 1.0, 0.0);
        nBack  = vec3(0.0, -1.0, 0.0);
  
        // 1) Top flat Table plane (y <= 0.56) and bottom Culet tip (y >= -0.92)
        {
          vec3 n = vec3(0.0, 1.0, 0.0);
          float d = 0.56;
          float denom = dot(n, rd);
          float num = d - dot(n, ro);
          if (abs(denom) < 1e-6) {
            if (num < 0.0) return vec2(1e9, -1e9);
          } else {
            float t = num / denom;
            if (denom < 0.0) { if (t > tNear) { tNear = t; nFront = n; } }
            else             { if (t < tFar)  { tFar  = t; nBack  = n; } }
          }
        }
  
        // 2) 16-fold symmetrical Crown, Upper-Girdle, Girdle, Upper-Pavilion, and Main-Pavilion facets
        for (int i = 0; i < 16; i++) {
          float a = float(i) * 0.39269908; // 2*PI / 16
          float ca = cos(a);
          float sa = sin(a);
  
          // Alternate slightly between primary bezel/main facets (even i) and star/half facets (odd i)
          float isOdd = mod(float(i), 2.0);
  
          // Tier A: Upper Crown / Star facets
          {
            vec3 n = normalize(vec3(ca * 0.54, 0.84 - isOdd * 0.04, sa * 0.54));
            float d = 0.725;
            float denom = dot(n, rd);
            float num = d - dot(n, ro);
            if (abs(denom) > 1e-6) {
              float t = num / denom;
              if (denom < 0.0) { if (t > tNear) { tNear = t; nFront = n; } }
              else             { if (t < tFar)  { tFar  = t; nBack  = n; } }
            } else if (num < 0.0) return vec2(1e9, -1e9);
          }
  
          // Tier B: Lower Crown Bezel facets
          {
            vec3 n = normalize(vec3(ca * 0.82, 0.57 + isOdd * 0.03, sa * 0.82));
            float d = 0.885;
            float denom = dot(n, rd);
            float num = d - dot(n, ro);
            if (abs(denom) > 1e-6) {
              float t = num / denom;
              if (denom < 0.0) { if (t > tNear) { tNear = t; nFront = n; } }
              else             { if (t < tFar)  { tFar  = t; nBack  = n; } }
            } else if (num < 0.0) return vec2(1e9, -1e9);
          }
  
          // Tier C: Vertical Girdle facets
          {
            vec3 n = vec3(ca, 0.0, sa);
            float d = 0.985;
            float denom = dot(n, rd);
            float num = d - dot(n, ro);
            if (abs(denom) > 1e-6) {
              float t = num / denom;
              if (denom < 0.0) { if (t > tNear) { tNear = t; nFront = n; } }
              else             { if (t < tFar)  { tFar  = t; nBack  = n; } }
            } else if (num < 0.0) return vec2(1e9, -1e9);
          }
  
          // Tier D: Pavilion facets meeting sharply at the bottom culet point
          {
            vec3 n = normalize(vec3(ca * 0.73, -0.683 - isOdd * 0.015, sa * 0.73));
            float d = 0.635;
            float denom = dot(n, rd);
            float num = d - dot(n, ro);
            if (abs(denom) > 1e-6) {
              float t = num / denom;
              if (denom < 0.0) { if (t > tNear) { tNear = t; nFront = n; } }
              else             { if (t < tFar)  { tFar  = t; nBack  = n; } }
            } else if (num < 0.0) return vec2(1e9, -1e9);
          }
        }
  
        return vec2(tNear, tFar);
      }
  
      // Crisp high-contrast studio light-dome environment for clean triangular crystal facet flashes
      vec3 sampleDiamondEnv(vec3 dir) {
        vec3 d = normalize(dir);
        float phi = atan(d.z, d.x);
        float theta = acos(clamp(d.y, -1.0, 1.0));
  
        float softBand1 = smoothstep(0.15, 0.72, cos(phi * 3.0 + d.y * 2.5));
        float softBand2 = smoothstep(0.25, 0.78, sin(theta * 5.0 - phi * 2.0));
  
        // Bright studio strip lights & overhead key ring
        float topLight = smoothstep(0.50, 0.92, d.y);
        float sideRim  = pow(max(0.0, abs(d.x)), 5.0) * smoothstep(-0.35, 0.65, d.y);
        float glint    = pow(max(0.0, cos(phi * 4.0) * sin(theta * 4.0)), 10.0);
  
        float lum = softBand1 * 0.34 + softBand2 * 0.28 + topLight * 0.52 + sideRim * 0.65 + glint * 0.85;
        return vec3(clamp(lum, 0.0, 1.3));
      }
  
      void main() {
        vec2 uv = vUv;
        uv.x *= uResolution.x / max(uResolution.y, 1.0);
  
        // Center the diamond vertically matching the video framing
        uv.y += 0.06;
  
        vec3 roWorld = vec3(0.0, 0.08, 3.35);
        vec3 rdWorld = normalize(vec3(uv * 0.52, -1.0));
  
        vec3 ro = uRot * roWorld;
        vec3 rd = normalize(uRot * rdWorld);
  
        vec3 nFront, nBack;
        vec2 hit = intersectDiamond(ro, rd, nFront, nBack);
  
        if (hit.x > hit.y || hit.y < 0.0) {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
          return;
        }
  
        vec3 pEntry = ro + rd * hit.x;
        vec3 nFrontWorld = normalize(uInvRot * nFront);
  
        // Diamond Index of Refraction (n = 2.417)
        float ior = 2.417;
        float cosTheta = clamp(dot(-rd, nFront), 0.0, 1.0);
        float f0 = pow((ior - 1.0) / (ior + 1.0), 2.0); // ~0.172 for diamond
        float fresnel = f0 + (1.0 - f0) * pow(1.0 - cosTheta, 4.0);
  
        // Surface specular reflection off front crown/pavilion facets
        vec3 reflWorld = reflect(rdWorld, nFrontWorld);
        vec3 frontRefl = sampleDiamondEnv(reflWorld);
  
        // Direct studio key highlights on front facets
        vec3 key1 = normalize(vec3(-0.55, 0.62, 0.56));
        vec3 key2 = normalize(vec3( 0.58, 0.48, 0.65));
        float spec1 = pow(max(0.0, dot(reflWorld, key1)), 36.0);
        float spec2 = pow(max(0.0, dot(reflWorld, key2)), 36.0);
        frontRefl += vec3(1.0) * (spec1 + spec2) * 0.85;
  
        // Multi-bounce internal raytracing inside the diamond (4 bounces of smooth facet TIR & refraction)
        vec3 inDir = refract(rd, nFront, 1.0 / ior);
        vec3 inPos = pEntry + inDir * 0.002;
        vec3 accumInternal = vec3(0.0);
        float weight = 1.0;
  
        for (int bounce = 0; bounce < 4; bounce++) {
          vec3 nf, nb;
          vec2 bHit = intersectDiamond(inPos, inDir, nf, nb);
          if (bHit.y <= 0.0) break;
  
          inPos = inPos + inDir * bHit.y;
          vec3 normalIn = normalize(-nb);
  
          vec3 refrOut = refract(inDir, normalIn, ior);
          vec3 reflIn  = reflect(inDir, normalIn);
  
          float inCos = abs(dot(inDir, normalIn));
          float inFresnel = f0 + (1.0 - f0) * pow(1.0 - inCos, 3.0);
  
          if (length(refrOut) > 0.001) {
            vec3 exitWorld = uInvRot * refrOut;
            accumInternal += weight * (1.0 - inFresnel) * sampleDiamondEnv(exitWorld);
            weight *= inFresnel;
          } else {
            // Total Internal Reflection (TIR)
            vec3 tirWorld = uInvRot * reflIn;
            accumInternal += weight * 0.36 * sampleDiamondEnv(tirWorld);
            weight *= 0.84;
          }
  
          inDir = reflIn;
          inPos += inDir * 0.002;
        }
  
        // Edge rim brightening along the outer silhouette of crown, girdle, and pavilion
        float edgeRim = pow(1.0 - cosTheta, 2.2);
  
        vec3 col = mix(accumInternal * 0.88, frontRefl, clamp(fresnel * 1.15 + edgeRim * 0.42, 0.0, 0.96));
        col += vec3(1.0) * pow(edgeRim, 2.4) * 0.65;
  
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
    const uRot = gl.getUniformLocation(prog, 'uRot');
    const uInvRot = gl.getUniformLocation(prog, 'uInvRot');
  
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();
  
    // Slight forward tilt (~6 deg) matching the side-profile elevation in Asset 13 video
    let rotX = 0.11;
    let rotY = 0.0;
    let targetRotX = 0.11;
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
      targetRotY -= dx * 0.008;
      targetRotX = Math.max(-0.85, Math.min(0.85, targetRotX + dy * 0.008));
    });
  
    window.addEventListener('pointerup', () => {
      isDragging = false;
    });
  
    function buildRotMatrices(rx: any, ry?: any) {
      const cx = Math.cos(rx), sx = Math.sin(rx);
      const cy = Math.cos(ry), sy = Math.sin(ry);
  
      const m00 = cy,      m01 = 0,   m02 = -sy;
      const m10 = sx * sy, m11 = cx,  m12 = sx * cy;
      const m20 = cx * sy, m21 = -sx, m22 = cx * cy;
  
      return {
        rot: new Float32Array([m00, m10, m20, m01, m11, m21, m02, m12, m22]),
        invRot: new Float32Array([m00, m01, m02, m10, m11, m12, m20, m21, m22])
      };
    }
  
    function render(now?: any) {
      const t = now * 0.001;
      if (!isDragging) {
        targetRotY += 0.0085; // Smooth continuous rotation matching the recording
      }
  
      rotX += (targetRotX - rotX) * 0.09;
      rotY += (targetRotY - rotY) * 0.09;
  
      const { rot, invRot } = buildRotMatrices(rotX, rotY);
  
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.uniformMatrix3fv(uRot, false, rot);
      gl.uniformMatrix3fv(uInvRot, false, invRot);
  
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestAnimationFrame(render);
    }
  
    requestAnimationFrame(render);
  })();
}
/* eslint-enable */

export function Asset13({ className, style, width = '100%', height = '100%' }: Asset13Props) {
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

    initAsset13Runtime({
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
      className={className ? `fv-assets-asset-13 ${className}` : 'fv-assets-asset-13'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="glCanvas"></canvas>
    </div>
  );
}

export default Asset13;
