'use client';

/**
 * Orb 02 — Sculpted Cobalt-Blue Wave-Grooved Sphere
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Orb2Props {
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
.fv-orbs-orb-2 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-orbs-orb-2 *, .fv-orbs-orb-2 *::before, .fv-orbs-orb-2 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-orbs-orb-2 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #f7f7f7;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-orbs-orb-2 canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: grab;
  }

  .fv-orbs-orb-2 canvas:active {
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
function initOrb2Runtime(__fvRuntime: ScopedRuntimeContext): void {
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
  
    // High-precision Raymarched Sculpted Cobalt-Blue Wave Sphere Shader
    // Replicating the exact 5 deep diagonal wave ridges, concentric polar rings when rotated,
    // deep navy groove ambient occlusion, and broad satin royal-blue specular highlights of Orb 2
    const fsSource = `
      precision highp float;
      varying vec2 vUv;
  
      uniform vec2 uResolution;
      uniform float uTime;
      uniform mat3 uRot;
      uniform mat3 uInvRot;
  
      // Exact displacement of the sculpted wave orb in object space
      float displacement(vec3 p, out float waveCrest) {
        vec3 n = normalize(p);
  
        // Primary wave axis tilted at ~42 degrees matching 00:00 of the recording
        // Rotating the orb reveals concentric circular rings around this axis (00:08-00:13)
        vec3 axis = normalize(vec3(0.68, 0.56, 0.47));
        float axial = dot(n, axis);
  
        // Orthogonal basis around the wave axis for subtle organic secondary undulation
        vec3 up = abs(axis.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
        vec3 tangent = normalize(cross(up, axis));
        vec3 bitangent = cross(axis, tangent);
        float u = dot(n, tangent);
        float v = dot(n, bitangent);
        float radialDist = sqrt(u * u + v * v);
  
        // Organic twist & gentle secondary lobe modulation along the ridges
        float waveArg = axial * 13.8 - uTime * 2.1 + 0.32 * sin(u * 3.8 + v * 3.2 + uTime * 0.9);
        float primaryWave = sin(waveArg);
  
        // Slightly sharpen the valleys and round the crests just like the sculpted mesh in the video
        float shapedWave = primaryWave - 0.16 * cos(waveArg * 2.0);
        waveCrest = shapedWave * 0.5 + 0.5;
  
        // Secondary subtle organic surface undulation
        float secondary = 0.024 * cos(u * 5.2 - v * 4.6 + uTime * 1.3) * radialDist;
  
        return 0.125 * shapedWave + secondary;
      }
  
      float mapOrb(vec3 p) {
        float r = length(p);
        if (r < 0.001) return r - 1.0;
        float crest;
        float disp = displacement(p, crest);
        // Conservative Lipschitz step scale eliminates raymarch ridge slicing seams completely
        return (r - (0.98 + disp)) * 0.36;
      }
  
      vec3 calcNormal(vec3 p) {
        vec2 e = vec2(0.0018, 0.0);
        return normalize(vec3(
          mapOrb(p + e.xyy) - mapOrb(p - e.xyy),
          mapOrb(p + e.yxy) - mapOrb(p - e.yxy),
          mapOrb(p + e.yyx) - mapOrb(p - e.yyx)
        ));
      }
  
      void main() {
        vec2 uv = vUv;
        uv.x *= uResolution.x / max(uResolution.y, 1.0);
  
        vec3 bgCol = vec3(0.969, 0.969, 0.969);
  
        // Camera setup matching the scale and perspective of Orb 2
        vec3 roWorld = vec3(0.0, 0.0, 3.85);
        vec3 rdWorld = normalize(vec3(uv * 0.52, -1.0));
  
        // Bounding sphere test (max displaced radius is ~1.16)
        float b = dot(roWorld, rdWorld);
        float c = dot(roWorld, roWorld) - 1.42;
        float disc = b * b - c;
        if (disc < 0.0) {
          gl_FragColor = vec4(bgCol, 1.0);
          return;
        }
  
        vec3 ro = uRot * roWorld;
        vec3 rd = normalize(uRot * rdWorld);
  
        float t = max(0.0, -b - sqrt(disc));
        float tMax = -b + sqrt(disc);
        bool hit = false;
        float minDist = 10.0;
        float closestT = t;
        vec3 p;
  
        for (int i = 0; i < 128; i++) {
          p = ro + rd * t;
          float d = mapOrb(p);
          if (d < minDist) {
            minDist = d;
            closestT = t;
          }
          if (abs(d) < 0.0014) {
            hit = true;
            break;
          }
          t += max(d, 0.0008);
          if (t > tMax) break;
        }
  
        if (!hit && minDist < 0.012) {
          p = ro + rd * closestT;
          hit = true;
        }
  
        if (!hit) {
          gl_FragColor = vec4(bgCol, 1.0);
          return;
        }
  
        vec3 nObj = calcNormal(p);
        vec3 nWorld = normalize(uInvRot * nObj);
        vec3 viewDir = normalize(-rdWorld);
  
        float crest;
        displacement(p, crest);
  
        // Studio lighting setup matching the royal-cobalt blue satin material in the video:
        // 1) Broad soft key light from top-left-front
        // 2) Secondary fill light from right-front
        // 3) Soft rim light from back-top
        vec3 keyLight  = normalize(vec3(-0.38, 0.52, 0.76));
        vec3 fillLight = normalize(vec3(0.62, -0.25, 0.74));
        vec3 topLight  = normalize(vec3(0.0, 0.92, 0.38));
  
        float diffKey  = max(0.0, dot(nWorld, keyLight));
        float diffFill = max(0.0, dot(nWorld, fillLight));
        float diffTop  = max(0.0, dot(nWorld, topLight));
  
        // Cavity / groove ambient occlusion (deep navy blue inside the concave wave valleys)
        float grooveAO = smoothstep(0.0, 0.88, crest);
        float valleyDarken = mix(0.28, 1.0, grooveAO);
  
        // Authentic royal-cobalt blue palette from Orb 2 recording
        vec3 deepNavy    = vec3(0.015, 0.060, 0.440);
        vec3 royalCobalt = vec3(0.045, 0.210, 0.920);
        vec3 brightBlue  = vec3(0.110, 0.360, 0.990);
        vec3 satinSpec   = vec3(0.420, 0.620, 1.000);
  
        float lambert = clamp(diffKey * 0.78 + diffFill * 0.34 + diffTop * 0.22, 0.0, 1.15);
        vec3 col = mix(deepNavy, royalCobalt, clamp(lambert * valleyDarken * 1.15, 0.0, 1.0));
        col = mix(col, brightBlue, clamp(pow(diffKey, 1.35) * grooveAO * 0.85, 0.0, 1.0));
  
        // Broad satin Blinn-Phong specular highlight along the rounded wave ridges
        vec3 halfKey  = normalize(keyLight + viewDir);
        vec3 halfFill = normalize(fillLight + viewDir);
        float spec1 = pow(max(0.0, dot(nWorld, halfKey)), 18.0) * (0.45 + 0.55 * grooveAO);
        float spec2 = pow(max(0.0, dot(nWorld, halfKey)), 56.0) * grooveAO;
        float specFill = pow(max(0.0, dot(nWorld, halfFill)), 22.0) * 0.35;
  
        col += satinSpec * (spec1 * 0.52 + specFill * 0.32);
        col += vec3(0.68, 0.78, 1.0) * spec2 * 0.28;
  
        // Subtle grazing studio Fresnel rim
        float fresnel = pow(1.0 - max(0.0, dot(nWorld, viewDir)), 3.2);
        col += vec3(0.22, 0.36, 0.98) * fresnel * 0.22 * grooveAO;
  
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
      // Dragging rotates the 3D wave orb to reveal the concentric polar rings (as in 00:06-00:13)
      targetRotY -= dx * 0.0085;
      targetRotX = Math.max(-1.45, Math.min(1.45, targetRotX - dy * 0.0085));
    });
  
    window.addEventListener('pointerup', () => {
      isDragging = false;
    });
  
    function buildRotMatrices(rx: any, ry?: any) {
      const cx = Math.cos(rx), sx = Math.sin(rx);
      const cy = Math.cos(ry), sy = Math.sin(ry);
  
      const m00 = cy,      m01 = sx * sy,  m02 = -cx * sy;
      const m10 = 0,       m11 = cx,       m12 = sx;
      const m20 = sy,      m21 = -sx * cy, m22 = cx * cy;
  
      return {
        rot: new Float32Array([m00, m10, m20, m01, m11, m21, m02, m12, m22]),
        invRot: new Float32Array([m00, m01, m02, m10, m11, m12, m20, m21, m22])
      };
    }
  
    function render(now?: any) {
      const t = now * 0.001;
  
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

export function Orb2({ className, style, width = '100%', height = '100%' }: Orb2Props) {
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

    initOrb2Runtime({
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
      className={className ? `fv-orbs-orb-2 ${className}` : 'fv-orbs-orb-2'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="glCanvas"></canvas>
    </div>
  );
}

export default Orb2;
