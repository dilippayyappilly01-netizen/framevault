'use client';

/**
 * Asset 08 — 3D Ferrofluid Spiky Harmonic Standing-Wave Orb
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Asset8Props {
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
.fv-assets-asset-8 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-assets-asset-8 *, .fv-assets-asset-8 *::before, .fv-assets-asset-8 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-assets-asset-8 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000000;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-assets-asset-8 canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: grab;
  }

  .fv-assets-asset-8 canvas:active {
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
function initAsset8Runtime(__fvRuntime: ScopedRuntimeContext): void {
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
  
    // High-Precision Raymarched 3D Ferrofluid / Spiky Spherical Harmonic Standing-Wave Orb
    // Replicating the exact symmetrical spiky standing-wave lobes, frequency modulation,
    // electric cyan directional lighting, deep ultramarine valleys, and neon magenta rim/ridge glow of Asset 8!
    const fsSource = `
      precision highp float;
      varying vec2 vUv;
  
      uniform vec2 uResolution;
      uniform float uTime;
      uniform mat3 uRot;
      uniform mat3 uInvRot;
  
      // Smooth C^inf 3D Organic Flower Standing-Wave Harmonic Orb (no hard abs() octahedron creases)
      float spikeDisplacement(vec3 p, out float ridgeFactor) {
        vec3 n = normalize(p);
  
        float theta = atan(n.x, n.z);
        float phi = asin(clamp(n.y, -1.0, 1.0));
  
        float lobeFreq = 5.0 + 1.5 * sin(uTime * 0.45);
  
        // Smooth cubic standing waves using 3D cartesian directions so poles stay silky smooth
        float w1 = sin(theta * 5.0 + uTime * 0.55) * pow(max(0.001, cos(phi)), 1.35) * cos(phi * 4.0);
        float w2 = cos(n.x * 5.8 - uTime * 0.9) * cos(n.y * 5.8 + uTime * 0.7) * cos(n.z * 5.8);
        float w3 = sin((n.x * n.y + n.y * n.z + n.z * n.x) * 14.0 + uTime * 1.1) * 0.35;
  
        float rawWave = (w1 * 0.55 + w2 * 0.55 + w3) * 0.5 + 0.5;
        float spike = pow(clamp(rawWave, 0.0, 1.15), 1.45);
  
        // Valley factor (1 inside deep concave magenta troughs, 0 on sky-blue flower lobes)
        ridgeFactor = clamp(1.0 - spike, 0.0, 1.0);
  
        return spike * 0.34;
      }
  
      float mapSpikeOrb(vec3 p) {
        float r = length(p);
        if (r < 0.001) return r - 0.7;
        float rf;
        float disp = spikeDisplacement(p, rf);
        // Conservative step scale for sharp conical spikes
        return (r - (0.68 + disp)) * 0.34;
      }
  
      vec3 calcNormal(vec3 p) {
        vec2 e = vec2(0.0016, 0.0);
        return normalize(vec3(
          mapSpikeOrb(p + e.xyy) - mapSpikeOrb(p - e.xyy),
          mapSpikeOrb(p + e.yxy) - mapSpikeOrb(p - e.yxy),
          mapSpikeOrb(p + e.yyx) - mapSpikeOrb(p - e.yyx)
        ));
      }
  
      void main() {
        vec2 uv = vUv;
        uv.x *= uResolution.x / max(uResolution.y, 1.0);
  
        vec3 roWorld = vec3(0.0, 0.0, 3.35);
        vec3 rdWorld = normalize(vec3(uv * 0.48, -1.0));
  
        // Bounding sphere test (max spike radius ~ 1.15)
        float b = dot(roWorld, rdWorld);
        float c = dot(roWorld, roWorld) - 1.38;
        float disc = b * b - c;
        if (disc < 0.0) {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
          return;
        }
  
        vec3 ro = uRot * roWorld;
        vec3 rd = normalize(uRot * rdWorld);
  
        float t = max(0.0, -b - sqrt(disc));
        float tMax = -b + sqrt(disc);
        bool hit = false;
        vec3 p;
  
        for (int i = 0; i < 96; i++) {
          p = ro + rd * t;
          float d = mapSpikeOrb(p);
          if (abs(d) < 0.0009) {
            hit = true;
            break;
          }
          t += d;
          if (t > tMax) break;
        }
  
        if (!hit) {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
          return;
        }
  
        vec3 nObj = calcNormal(p);
        vec3 nWorld = normalize(uInvRot * nObj);
        vec3 viewDir = normalize(-rdWorld);
  
        float ridgeFactor;
        float disp = spikeDisplacement(p, ridgeFactor);
        float tipFactor = clamp(disp / 0.36, 0.0, 1.0);
  
        // Authentic Asset 8 Dual-Tone Neon Lighting:
        // 1) Bright Electric Cyan / Sky-Blue directional light from left & top-left (#00dcff)
        // 2) Deep Royal Ultramarine Blue in the valleys & front-facing hollows (#1428ff)
        // 3) Hot Neon Magenta / Pink on grazing rims, spike tips, and right-facing flanks (#ff00a6)
        vec3 cyanLightDir = normalize(vec3(-0.72, 0.45, 0.52));
        vec3 magLightDir  = normalize(vec3(0.68, -0.35, 0.64));
        vec3 topLightDir  = normalize(vec3(-0.25, 0.88, 0.40));
  
        float diffCyan = max(0.0, dot(nWorld, cyanLightDir));
        float diffTop  = max(0.0, dot(nWorld, topLightDir));
        float diffMag  = max(0.0, dot(nWorld, magLightDir));
  
        // Grazing Fresnel rim factor
        float NdotV = max(0.0, dot(nWorld, viewDir));
        float fresnel = pow(1.0 - NdotV, 2.1);
  
        vec3 deepUltramarine = vec3(0.08, 0.12, 0.78);
        vec3 electricCyan    = vec3(0.10, 0.72, 1.00);
        vec3 skyHighlight    = vec3(0.45, 0.86, 1.00);
        vec3 neonMagenta     = vec3(1.00, 0.08, 0.74);
  
        vec3 col = mix(deepUltramarine, electricCyan, clamp(diffCyan * 0.85 + diffTop * 0.45, 0.0, 1.0));
        col = mix(col, skyHighlight, pow(clamp(tipFactor, 0.0, 1.0), 1.3) * clamp(diffCyan + 0.35, 0.0, 1.0) * 0.65);
  
        // Rich neon magenta glow inside the concave flower troughs & soft rim (no hard center cross!)
        float magentaMask = clamp(
          pow(ridgeFactor, 1.25) * 0.88 +
          fresnel * 0.58 +
          diffMag * 0.35 * ridgeFactor,
          0.0,
          0.96
        );
        col = mix(col, neonMagenta, magentaMask);
  
        // Soft velvet sheen along the lobes
        vec3 halfCyan = normalize(cyanLightDir + viewDir);
        float specCyan = pow(max(0.0, dot(nWorld, halfCyan)), 20.0);
        col += vec3(0.45, 0.95, 1.0) * specCyan * 0.16;
        col += vec3(1.00, 0.22, 0.85) * pow(fresnel, 2.2) * 0.36;
  
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

export function Asset8({ className, style, width = '100%', height = '100%' }: Asset8Props) {
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

    initAsset8Runtime({
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
      className={className ? `fv-assets-asset-8 ${className}` : 'fv-assets-asset-8'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="glCanvas"></canvas>
    </div>
  );
}

export default Asset8;
