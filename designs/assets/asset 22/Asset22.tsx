'use client';

/**
 * Asset 22 — 3D Chamfered Obsidian Dichroic Prism Cube
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Asset22Props {
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
.fv-assets-asset-22 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-assets-asset-22 *, .fv-assets-asset-22 *::before, .fv-assets-asset-22 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-assets-asset-22 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000000;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-assets-asset-22 canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: grab;
  }

  .fv-assets-asset-22 canvas:active {
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
function initAsset22Runtime(__fvRuntime: ScopedRuntimeContext): void {
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
  
    // Raymarched 3D Chamfered Dark-Obsidian Dichroic Prism Cube Shader
    // Replicating the wide flat 45-degree chamfered bevel strips, recessed framed inner faces,
    // pitch-black obsidian flat panels, intense electric blue / magenta-red / gold / cyan-green
    // dichroic bevel reflections, and razor-sharp neon edge pin-stripes of Asset 22!
    const fsSource = `
      precision highp float;
      varying vec2 vUv;
  
      uniform vec2 uResolution;
      uniform float uTime;
      uniform mat3 uRot;
      uniform mat3 uInvRot;
  
      float sdRoundBox(vec3 p, vec3 b, float r) {
        vec3 q = abs(p) - b;
        return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
      }
  
      // Chamfered cube SDF: intersection of a bounding box and an edge-chamfering rhombic dodecahedron
      // plus subtle recessed inner square panels on each of the 6 faces (matching 00:00-00:07 of Asset 22)
      float mapChamferCube(vec3 p, out float isBevel, out float edgeLine) {
        vec3 ap = abs(p);
  
        // Sort coordinates: s.x >= s.y >= s.z
        float maxC = max(ap.x, max(ap.y, ap.z));
        float minC = min(ap.x, min(ap.y, ap.z));
        float midC = ap.x + ap.y + ap.z - maxC - minC;
  
        // Primary cube faces at maxC = 0.88
        float dBox = sdRoundBox(p, vec3(0.86), 0.02);
  
        // Slim 45-degree obsidian edge chamfers matching Asset 22 video
        float dChamfer = (maxC + midC - 1.65) * 0.70710678;
  
        // Corner chamfer
        float dCorner = (ap.x + ap.y + ap.z - 2.26) * 0.57735027;
  
        float dOuter = max(dBox, max(dChamfer, dCorner));
  
        // Subtle inner obsidian panel groove (midC < 0.72)
        float frameDist = abs(midC - 0.72);
        float groove = exp(-frameDist * 85.0) * 0.005;
  
        // Restrict dichroic flash to the narrow beveled rim zone
        isBevel = smoothstep(0.68, 0.75, midC);
  
        // Razor-thin fiery chromatic pin-stripes along the chamfer seams
        float ridge1 = exp(-abs((maxC + midC) - 1.65) * 145.0);
        float ridge2 = exp(-abs(midC - 0.72) * 145.0);
        float ridge3 = exp(-abs(maxC - 0.875) * 130.0) * isBevel;
        edgeLine = clamp(ridge1 + ridge2 + ridge3, 0.0, 1.0);
  
        return dOuter + groove;
      }
  
      vec3 calcNormal(vec3 p) {
        vec2 e = vec2(0.0012, 0.0);
        float b, l;
        return normalize(vec3(
          mapChamferCube(p + e.xyy, b, l) - mapChamferCube(p - e.xyy, b, l),
          mapChamferCube(p + e.yxy, b, l) - mapChamferCube(p - e.yxy, b, l),
          mapChamferCube(p + e.yyx, b, l) - mapChamferCube(p - e.yyx, b, l)
        ));
      }
  
      // Dichroic thin-film interference spectrum for the chamfered prism bevels
      vec3 dichroicSpectrum(vec3 refl, vec3 nObj, float cosTheta) {
        float phase = dot(refl, vec3(0.75, 0.55, -0.38)) * 1.6 + cosTheta * 1.8 + dot(nObj, vec3(0.4, -0.6, 0.5));
  
        vec3 electricBlue = vec3(0.02, 0.22, 1.00);
        vec3 crimsonPink  = vec3(0.95, 0.06, 0.36);
        vec3 solarGold    = vec3(0.96, 0.86, 0.24);
        vec3 cyanGreen    = vec3(0.08, 0.95, 0.62);
  
        float w = fract(phase * 0.5 + 0.5);
        if (w < 0.28) return mix(electricBlue, crimsonPink, w / 0.28);
        if (w < 0.55) return mix(crimsonPink, solarGold, (w - 0.28) / 0.27);
        if (w < 0.80) return mix(solarGold, cyanGreen, (w - 0.55) / 0.25);
        return mix(cyanGreen, electricBlue, (w - 0.80) / 0.20);
      }
  
      void main() {
        vec2 uv = vUv;
        uv.x *= uResolution.x / max(uResolution.y, 1.0);
  
        vec3 roWorld = vec3(0.0, 0.0, 3.35);
        vec3 rdWorld = normalize(vec3(uv * 0.50, -1.0));
  
        vec3 ro = uRot * roWorld;
        vec3 rd = normalize(uRot * rdWorld);
  
        float t = 0.0;
        bool hit = false;
        float isBevel = 0.0;
        float edgeLine = 0.0;
        vec3 p;
  
        for (int i = 0; i < 84; i++) {
          p = ro + rd * t;
          float d = mapChamferCube(p, isBevel, edgeLine);
          if (abs(d) < 0.001) {
            hit = true;
            break;
          }
          t += d;
          if (t > 5.8) break;
        }
  
        if (!hit) {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
          return;
        }
  
        vec3 nObj = calcNormal(p);
        vec3 nWorld = normalize(uInvRot * nObj);
        vec3 v = -rdWorld;
        vec3 refl = reflect(rdWorld, nWorld);
  
        float cosTheta = clamp(dot(nWorld, v), 0.0, 1.0);
        float fresnel = pow(1.0 - cosTheta, 3.2);
  
        // Studio directional lights that ignite the chamfered bevel faces as the cube tumbles
        vec3 light1 = normalize(vec3(-0.62, 0.65, 0.44));
        vec3 light2 = normalize(vec3( 0.68, -0.35, 0.64));
        vec3 light3 = normalize(vec3(-0.25, -0.78, 0.58));
  
        float bLit1 = pow(max(0.0, dot(nWorld, light1)), 3.5);
        float bLit2 = pow(max(0.0, dot(nWorld, light2)), 3.5);
        float bLit3 = pow(max(0.0, dot(nWorld, light3)), 3.5);
  
        vec3 dichCol = dichroicSpectrum(refl, nObj, cosTheta);
  
        // Flat inner square faces remain deep mirror pitch-black obsidian (#030408)
        vec3 flatCol = vec3(0.010, 0.012, 0.020) + dichCol * fresnel * 0.08;
  
        // Narrow bevels stay dark except where catching directional dichroic gleams (ruby / cobalt / gold)
        float bevelIntensity = clamp(pow(bLit1, 1.6) * 1.15 + pow(bLit2, 1.6) * 0.95 + pow(bLit3, 1.6) * 0.75 + pow(fresnel, 1.5) * 0.45, 0.015, 1.25);
        vec3 bevelCol = dichCol * bevelIntensity;
  
        // White-hot studio specular streak along sharp edge highlights
        float specStreak = pow(max(0.0, dot(refl, light1)), 42.0);
        bevelCol += vec3(0.90, 0.95, 1.00) * specStreak * 0.88;
  
        vec3 col = mix(flatCol, bevelCol, isBevel);
  
        // Razor-thin fiery gold / ruby / cobalt chromatic gleam along seams
        vec3 edgeChroma = dichroicSpectrum(nWorld, p, 1.0 - cosTheta);
        col += mix(edgeChroma, vec3(1.0, 0.78, 0.35), 0.32) * edgeLine * (0.35 + 0.75 * (1.0 - cosTheta));
  
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
  
    let rotX = 0.58;
    let rotY = 0.64;
    let rotZ = -0.48;
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
      rotY += dx * 0.008;
      rotX += dy * 0.008;
    });
  
    window.addEventListener('pointerup', () => {
      isDragging = false;
    });
  
    function buildRotMatrices(rx: any, ry: any, rz?: any) {
      const cx = Math.cos(rx), sx = Math.sin(rx);
      const cy = Math.cos(ry), sy = Math.sin(ry);
      const cz = Math.cos(rz), sz = Math.sin(rz);
  
      const m00 = cz * cy - sz * sx * sy;
      const m01 = -sz * cx;
      const m02 = cz * sy + sz * sx * cy;
  
      const m10 = sz * cy + cz * sx * sy;
      const m11 = cz * cx;
      const m12 = sz * sy - cz * sx * cy;
  
      const m20 = -cx * sy;
      const m21 = sx;
      const m22 = cx * cy;
  
      return {
        rot: new Float32Array([m00, m10, m20, m01, m11, m21, m02, m12, m22]),
        invRot: new Float32Array([m00, m01, m02, m10, m11, m12, m20, m21, m22])
      };
    }
  
    function render(now?: any) {
      const t = now * 0.001;
      if (!isDragging) {
        rotY += 0.0055;
        rotX += 0.0038;
        rotZ += 0.0025;
      }
  
      const { rot, invRot } = buildRotMatrices(rotX, rotY, rotZ);
  
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

export function Asset22({ className, style, width = '100%', height = '100%' }: Asset22Props) {
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

    initAsset22Runtime({
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
      className={className ? `fv-assets-asset-22 ${className}` : 'fv-assets-asset-22'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="glCanvas"></canvas>
    </div>
  );
}

export default Asset22;
