'use client';

/**
 * Asset 07 — 3D Nested Chrome Gyroscope Gimbal Rings
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Asset7Props {
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
.fv-assets-asset-7 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-assets-asset-7 *, .fv-assets-asset-7 *::before, .fv-assets-asset-7 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-assets-asset-7 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000000;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-assets-asset-7 canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: grab;
  }

  .fv-assets-asset-7 canvas:active {
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
function initAsset7Runtime(__fvRuntime: ScopedRuntimeContext): void {
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
  
    // High-Precision Raymarched 6-Ring Chrome Gyroscope Shader
    // Replicating the 6 concentric polished silver-chrome tubular rings rotating on independent
    // 3D gimbal axes, periodically aligning into orthogonal planes (as at 00:08 of Asset 7 video)
    const fsSource = `
      precision highp float;
      varying vec2 vUv;
  
      uniform vec2 uResolution;
      uniform mat3 uRingRot0;
      uniform mat3 uRingRot1;
      uniform mat3 uRingRot2;
      uniform mat3 uRingRot3;
      uniform mat3 uRingRot4;
      uniform mat3 uRingRot5;
  
      float sdTorus(vec3 p, vec2 t) {
        vec2 q = vec2(length(p.xy) - t.x, p.z);
        return length(q) - t.y;
      }
  
      float mapScene(vec3 p) {
        float tube = 0.036;
        float d = sdTorus(uRingRot0 * p, vec2(0.38, tube));
        d = min(d, sdTorus(uRingRot1 * p, vec2(0.51, tube)));
        d = min(d, sdTorus(uRingRot2 * p, vec2(0.64, tube)));
        d = min(d, sdTorus(uRingRot3 * p, vec2(0.77, tube)));
        d = min(d, sdTorus(uRingRot4 * p, vec2(0.90, tube)));
        d = min(d, sdTorus(uRingRot5 * p, vec2(1.03, tube)));
        return d;
      }
  
      vec3 calcNormal(vec3 p) {
        vec2 e = vec2(0.0012, 0.0);
        return normalize(vec3(
          mapScene(p + e.xyy) - mapScene(p - e.xyy),
          mapScene(p + e.yxy) - mapScene(p - e.yxy),
          mapScene(p + e.yyx) - mapScene(p - e.yyx)
        ));
      }
  
      float calcAO(vec3 pos, vec3 nor) {
        float occ = 0.0;
        float sca = 1.0;
        for (int i = 0; i < 5; i++) {
          float h = 0.015 + 0.045 * float(i);
          float d = mapScene(pos + h * nor);
          occ += (h - d) * sca;
          sca *= 0.72;
        }
        return clamp(1.0 - 2.6 * occ, 0.12, 1.0);
      }
  
      // Studio liquid-chrome metallic environment reflection map
      vec3 sampleChromeEnv(vec3 r, vec3 n) {
        // Multi-band studio softboxes & dark contrast ribs that give realistic brushed/polished steel look
        float band1 = sin(r.y * 9.5 + r.x * 4.2) * 0.5 + 0.5;
        float band2 = cos(r.x * 12.0 - r.z * 5.5) * 0.5 + 0.5;
        float studioArch = smoothstep(0.15, 0.85, band1 * 0.65 + band2 * 0.35);
  
        // Primary studio key softbox (top-left) and rim softbox (bottom-right)
        vec3 keyDir = normalize(vec3(-0.45, 0.68, 0.58));
        vec3 rimDir = normalize(vec3(0.62, -0.35, 0.70));
        vec3 topDir = normalize(vec3(0.0, 0.95, 0.31));
  
        float specKey = pow(max(0.0, dot(r, keyDir)), 24.0);
        float specSharp = pow(max(0.0, dot(r, keyDir)), 96.0);
        float specRim = pow(max(0.0, dot(r, rimDir)), 18.0);
        float specTop = pow(max(0.0, dot(r, topDir)), 14.0);
  
        vec3 darkSteel  = vec3(0.06, 0.065, 0.07);
        vec3 midSilver  = vec3(0.46, 0.47, 0.49);
        vec3 brightChrome = vec3(0.92, 0.93, 0.95);
  
        vec3 col = mix(darkSteel, midSilver, studioArch);
        col = mix(col, brightChrome, clamp(specTop * 0.55 + specRim * 0.48, 0.0, 1.0));
        col += vec3(1.0) * (specKey * 0.55 + specSharp * 0.65);
  
        return col;
      }
  
      void main() {
        vec2 uv = vUv;
        uv.x *= uResolution.x / max(uResolution.y, 1.0);
  
        vec3 ro = vec3(0.0, 0.0, 3.45);
        vec3 rd = normalize(vec3(uv * 0.45, -1.0));
  
        // Bounding sphere test (outermost ring radius + tube = 1.07)
        float b = dot(ro, rd);
        float c = dot(ro, ro) - 1.22;
        float disc = b * b - c;
        if (disc < 0.0) {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
          return;
        }
  
        float t = max(0.0, -b - sqrt(disc));
        float tMax = -b + sqrt(disc);
        bool hit = false;
        vec3 p;
  
        for (int i = 0; i < 84; i++) {
          p = ro + rd * t;
          float d = mapScene(p);
          if (d < 0.0008) {
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
  
        vec3 n = calcNormal(p);
        vec3 v = -rd;
        vec3 refl = reflect(rd, n);
  
        float ao = calcAO(p, n);
        float fresnel = 0.22 + 0.78 * pow(1.0 - max(0.0, dot(n, v)), 3.0);
  
        vec3 chrome = sampleChromeEnv(refl, n);
  
        // Subtle diffuse metallic fill so inner ring faces retain smooth silver gradients
        float diff = max(0.0, dot(n, normalize(vec3(-0.3, 0.6, 0.7)))) * 0.5 + 0.5;
        vec3 col = chrome * mix(0.62, 1.12, fresnel) * ao;
        col += vec3(0.18, 0.19, 0.20) * diff * ao * 0.35;
  
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
    const uRingRots = [
      gl.getUniformLocation(prog, 'uRingRot0'),
      gl.getUniformLocation(prog, 'uRingRot1'),
      gl.getUniformLocation(prog, 'uRingRot2'),
      gl.getUniformLocation(prog, 'uRingRot3'),
      gl.getUniformLocation(prog, 'uRingRot4'),
      gl.getUniformLocation(prog, 'uRingRot5')
    ];
  
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();
  
    let userRotX = 0.0;
    let userRotY = 0.0;
    let targetUserX = 0.0;
    let targetUserY = 0.0;
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
      targetUserY += dx * 0.008;
      targetUserX += dy * 0.008;
    });
  
    window.addEventListener('pointerup', () => {
      isDragging = false;
    });
  
    function mat3FromEuler(rx: any, ry: any, rz?: any) {
      const cx = Math.cos(rx), sx = Math.sin(rx);
      const cy = Math.cos(ry), sy = Math.sin(ry);
      const cz = Math.cos(rz), sz = Math.sin(rz);
  
      return new Float32Array([
        cz * cy - sz * sx * sy, -sz * cx, cz * sy + sz * sx * cy,
        sz * cy + cz * sx * sy,  cz * cx, sz * sy - cz * sx * cy,
       -cx * sy,                 sx,      cx * cy
      ]);
    }
  
    function render(now?: any) {
      // Harmonic gimbal speeds so all 6 rings precess continuously and periodically align into orthogonal planes
      const t = now * 0.00065 + 1.85;
  
      userRotX += (targetUserX - userRotX) * 0.08;
      userRotY += (targetUserY - userRotY) * 0.08;
  
      gl.uniform2f(uResolution, canvas.width, canvas.height);
  
      for (let i = 0; i < 6; i++) {
        // Alternating harmonic ratios so inner and outer rings weave through each other
        const dir = (i % 2 === 0) ? 1.0 : -1.0;
        const rx = userRotX + t * (1.0 + i * 0.25) * dir + (i % 2) * (Math.PI * 0.5);
        const ry = userRotY + t * (0.85 + (5 - i) * 0.22);
        const rz = t * (0.45 * dir) + i * 0.52;
        gl.uniformMatrix3fv(uRingRots[i], false, mat3FromEuler(rx, ry, rz));
      }
  
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestAnimationFrame(render);
    }
  
    requestAnimationFrame(render);
  })();
}
/* eslint-enable */

export function Asset7({ className, style, width = '100%', height = '100%', blendMode = "normal", transparentBackground = false, edgeFeather = 0 }: Asset7Props) {
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

    initAsset7Runtime({
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
      className={className ? `fv-assets-asset-7 ${className}` : 'fv-assets-asset-7'}
      style={{ width, height, ...blendStyle, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="glCanvas"></canvas>
    </div>
  );
}

export default Asset7;
