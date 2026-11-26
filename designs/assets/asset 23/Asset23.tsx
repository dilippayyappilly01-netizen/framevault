'use client';

/**
 * Asset 23 — 3D Iridescent Thermal-Rainbow Morphing Blob Orb
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Asset23Props {
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
.fv-assets-asset-23 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-assets-asset-23 *, .fv-assets-asset-23 *::before, .fv-assets-asset-23 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-assets-asset-23 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000000;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-assets-asset-23 canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: grab;
  }

  .fv-assets-asset-23 canvas:active {
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
function initAsset23Runtime(__fvRuntime: ScopedRuntimeContext): void {
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
  
    // Raymarched 3D Iridescent / Oil-Slick Thermal-Rainbow Morphing Liquid Blob Orb
    // Replicating the breathing noise amplitude (smooth sphere at 00:05-00:07 -> deep organic lobes
    // at 00:02-00:03 and 00:08-00:09), swirling green/blue/cyan/magenta/gold thin-film iridescence,
    // dark core absorption, and glowing pink/orange outer atmospheric bloom halo of Asset 23!
    const fsSource = `
      precision highp float;
      varying vec2 vUv;
  
      uniform vec2 uResolution;
      uniform float uTime;
      uniform mat3 uRot;
      uniform mat3 uInvRot;
  
      float hash(vec3 p) {
        p = fract(p * vec3(443.897, 441.423, 437.195));
        p += dot(p, p.yzx + 19.19);
        return fract((p.x + p.y) * p.z);
      }
  
      float noise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(
            mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
            mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x),
            f.y
          ),
          mix(
            mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
            mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x),
            f.y
          ),
          f.z
        );
      }
  
      float blobDisplacement(vec3 p) {
        vec3 n = normalize(p);
        float t = uTime * 0.68;
  
        // Smooth flowing liquid mercury lobes without bumpy high-frequency roughness
        float ampEnv = 0.055 + 0.115 * pow(sin(uTime * 0.55) * 0.5 + 0.5, 1.4);
  
        float n1 = noise(n * 1.65 + vec3(t * 0.7, -t * 0.55, t * 0.4)) - 0.5;
        float wave = sin(n.x * 3.1 + t) * cos(n.y * 3.1 - t * 0.85) * sin(n.z * 3.1 + t * 0.65);
  
        return (n1 * 1.10 + wave * 0.55) * ampEnv;
      }
  
      float mapBlob(vec3 p) {
        float r = length(p);
        if (r < 0.001) return r - 0.85;
        float disp = blobDisplacement(p);
        return (r - (0.86 + disp)) * 0.48;
      }
  
      vec3 calcNormal(vec3 p) {
        vec2 e = vec2(0.002, 0.0);
        return normalize(vec3(
          mapBlob(p + e.xyy) - mapBlob(p - e.xyy),
          mapBlob(p + e.yxy) - mapBlob(p - e.yxy),
          mapBlob(p + e.yyx) - mapBlob(p - e.yyx)
        ));
      }
  
      void main() {
        vec2 uv = vUv;
        uv.x *= uResolution.x / max(uResolution.y, 1.0);
  
        vec3 roWorld = vec3(0.0, 0.0, 3.25);
        vec3 rdWorld = normalize(vec3(uv * 0.52, -1.0));
  
        vec3 ro = uRot * roWorld;
        vec3 rd = normalize(uRot * rdWorld);
  
        float t = 0.0;
        bool hit = false;
        float minDist = 10.0;
        vec3 p;
  
        for (int i = 0; i < 80; i++) {
          p = ro + rd * t;
          float d = mapBlob(p);
          minDist = min(minDist, d);
          if (abs(d) < 0.001) {
            hit = true;
            break;
          }
          t += d;
          if (t > 5.5) break;
        }
  
        // Soft glowing magenta & warm orange outer atmospheric bloom halo around the blob silhouette
        float haloStrength = exp(-max(0.0, minDist) * 16.0);
        vec3 haloColor = mix(
          vec3(1.0, 0.12, 0.62), // Hot pink-magenta at bottom/left
          vec3(1.0, 0.52, 0.08), // Warm amber-orange at right
          clamp(uv.x * 0.8 + 0.5, 0.0, 1.0)
        );
        haloColor *= smoothstep(0.45, -0.55, uv.y * 0.7 - uv.x * 0.4);
        vec3 bgHalo = haloColor * haloStrength * 0.52;
  
        if (!hit) {
          gl_FragColor = vec4(bgHalo, 1.0);
          return;
        }
  
        vec3 nObj = calcNormal(p);
        vec3 nWorld = normalize(uInvRot * nObj);
        vec3 v = -rdWorld;
  
        float NdotV = clamp(dot(nWorld, v), 0.0, 1.0);
        float fresnel = pow(1.0 - NdotV, 1.85);
  
        // Swirling oil-slick / thin-film interference pattern across the 3D surface normals & coordinates
        float swirl = noise(p * 2.8 + nObj * 1.6 + vec3(uTime * 0.25)) * 0.65 +
                      noise(p * 5.6 - nObj * 2.2 - vec3(uTime * 0.35)) * 0.35;
  
        // Regional color mapping matching Asset 23 recording:
        // Top (+Y): Neon Emerald Green (#15f46e)
        // Upper-Left (-X, +Y): Deep Cobalt Blue (#1a25ff) & Electric Cyan (#00e8ff) with pink bullseye rings
        // Bottom-Left (-X, -Y): Hot Magenta / Crimson-Pink (#ff1268)
        // Right (+X): Warm Gold / Amber-Orange (#ff9d00)
        vec3 neonGreen   = vec3(0.10, 0.94, 0.42);
        vec3 cobaltBlue  = vec3(0.10, 0.16, 0.98);
        vec3 electricCyan= vec3(0.05, 0.88, 0.96);
        vec3 hotMagenta  = vec3(0.98, 0.08, 0.46);
        vec3 warmGold    = vec3(0.98, 0.68, 0.12);
  
        // Blend regional colors smoothly with normal & thin-film swirl interference
        vec3 nw = nWorld;
        float wTop   = clamp(nw.y * 0.7 + 0.3, 0.0, 1.0);
        float wRight = clamp(nw.x * 0.75 + 0.35, 0.0, 1.0);
        float wLeft  = clamp(-nw.x * 0.75 + 0.35, 0.0, 1.0);
        float wBot   = clamp(-nw.y * 0.75 + 0.35, 0.0, 1.0);
  
        // Thin-film interference rings in the upper-left blue/cyan zone
        float filmRing = sin((swirl + NdotV * 0.85) * 14.0) * 0.5 + 0.5;
        vec3 upperLeftCol = mix(cobaltBlue, electricCyan, smoothstep(0.2, 0.8, filmRing));
        upperLeftCol = mix(upperLeftCol, hotMagenta, pow(1.0 - filmRing, 4.0) * 0.65);
  
        vec3 col = hotMagenta * wBot;
        col = mix(col, upperLeftCol, clamp(wLeft * wTop * 1.45, 0.0, 1.0));
        col = mix(col, neonGreen,    clamp(wTop * (1.0 - wLeft * 0.55) * 1.25, 0.0, 1.0));
        col = mix(col, warmGold,     clamp(wRight * (0.65 + 0.35 * swirl) * 1.15, 0.0, 1.0));
  
        // Glossy iridescent liquid-chrome reflections matching Asset 23 video
        vec3 refl = reflect(-v, nWorld);
        float film = dot(refl, vec3(0.55, 0.68, -0.48)) + NdotV * 1.35 + swirl * 1.25;
        vec3 iridRing = 0.5 + 0.5 * cos(film * 4.6 + vec3(0.0, 2.094, 4.188));
        col = mix(col, iridRing, 0.36 + fresnel * 0.34);
  
        float centerDarken = mix(0.22, 1.22, smoothstep(0.0, 0.75, fresnel + length(nw.xy) * 0.55));
        col *= centerDarken;
  
        // Sharp wet liquid mercury specular catchlights
        vec3 keyLight = normalize(vec3(-0.38, 0.68, 0.62));
        vec3 halfVec = normalize(keyLight + v);
        float spec = pow(max(0.0, dot(nWorld, halfVec)), 54.0);
        float rimSpec = smoothstep(0.75, 0.95, abs(sin(refl.y * 3.2 + refl.x * 2.4))) * fresnel;
  
        col += vec3(0.95, 0.98, 1.0) * (spec * 0.82 + rimSpec * 0.45);
        col += haloColor * pow(1.0 - NdotV, 3.4) * 0.88;
  
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
      targetRotY -= dx * 0.008;
      targetRotX = Math.max(-1.4, Math.min(1.4, targetRotX - dy * 0.008));
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
  
      rotX += (targetRotX - rotX) * 0.08;
      rotY += (targetRotY - rotY) * 0.08;
  
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

export function Asset23({ className, style, width = '100%', height = '100%' }: Asset23Props) {
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

    initAsset23Runtime({
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
      className={className ? `fv-assets-asset-23 ${className}` : 'fv-assets-asset-23'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="glCanvas"></canvas>
    </div>
  );
}

export default Asset23;
