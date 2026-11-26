'use client';

/**
 * Asset 21 — 3D Morphing Violet &amp; Fresnel-White Geometric Primitives
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Asset21Props {
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
.fv-assets-asset-21 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-assets-asset-21 *, .fv-assets-asset-21 *::before, .fv-assets-asset-21 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-assets-asset-21 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000000;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-assets-asset-21 canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: grab;
  }

  .fv-assets-asset-21 canvas:active {
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
function initAsset21Runtime(__fvRuntime: ScopedRuntimeContext): void {
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
  
    // Raymarched 3D Morphing Geometric Primitives Shader
    // Cycles through the exact sequence in Asset 21 recording:
    // 0: Sharp Cube -> 1: Sphere -> 2: Octahedron -> 3: Reuleaux/Spherical Tetrahedron -> 4: Torus
    // With deep indigo-violet shading, bright white top/side facets, and glowing white Fresnel rim!
    const fsSource = `
      precision highp float;
      varying vec2 vUv;
  
      uniform vec2 uResolution;
      uniform float uTime;
      uniform mat3 uRot;
      uniform mat3 uInvRot;
  
      float sdBox(vec3 p, vec3 b) {
        vec3 q = abs(p) - b;
        return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
      }
  
      float sdSphere(vec3 p, float r) {
        return length(p) - r;
      }
  
      float sdOctahedron(vec3 p, float s) {
        p = abs(p);
        return (p.x + p.y + p.z - s) * 0.57735027;
      }
  
      // Spherical / Reuleaux Tetrahedron (intersection of 4 spheres centered at tetrahedron vertices)
      float sdSphericalTetra(vec3 p) {
        vec3 v0 = vec3( 0.55,  0.55,  0.55);
        vec3 v1 = vec3( 0.55, -0.55, -0.55);
        vec3 v2 = vec3(-0.55,  0.55, -0.55);
        vec3 v3 = vec3(-0.55, -0.55,  0.55);
        float r = 1.38;
        float d = length(p - v0) - r;
        d = max(d, length(p - v1) - r);
        d = max(d, length(p - v2) - r);
        d = max(d, length(p - v3) - r);
        return d;
      }
  
      float sdTorus(vec3 p, vec2 t) {
        vec2 q = vec2(length(p.xz) - t.x, p.y);
        return length(q) - t.y;
      }
  
      float evalShape(vec3 p, int idx) {
        if (idx == 0) return sdBox(p, vec3(0.76));
        if (idx == 1) return sdOctahedron(p, 1.24);
        if (idx == 2) return sdTorus(p, vec2(0.68, 0.30));
        if (idx == 3) return sdSphericalTetra(p);
        return sdSphere(p, 0.92);
      }
  
      float mapMorph(vec3 p, out float curvedness) {
        // Each stage lasts ~1.7 seconds with a crisp smoothstep transition
        float stageTime = uTime * 0.58;
        float stageIdx = mod(floor(stageTime), 5.0);
        float frac = fract(stageTime);
        // Hold each crisp geometric shape briefly then morph smoothly
        float blend = smoothstep(0.32, 0.92, frac);
  
        int s0 = int(stageIdx);
        int s1 = int(mod(stageIdx + 1.0, 5.0));
  
        float d0 = evalShape(p, s0);
        float d1 = evalShape(p, s1);
  
        float c0 = (s0 == 2 || s0 == 4) ? 1.0 : ((s0 == 3) ? 0.45 : 0.0);
        float c1 = (s1 == 2 || s1 == 4) ? 1.0 : ((s1 == 3) ? 0.45 : 0.0);
        curvedness = mix(c0, c1, blend);
  
        return mix(d0, d1, blend);
      }
  
      vec3 calcNormal(vec3 p) {
        vec2 e = vec2(0.0012, 0.0);
        float c;
        return normalize(vec3(
          mapMorph(p + e.xyy, c) - mapMorph(p - e.xyy, c),
          mapMorph(p + e.yxy, c) - mapMorph(p - e.yxy, c),
          mapMorph(p + e.yyx, c) - mapMorph(p - e.yyx, c)
        ));
      }
  
      void main() {
        vec2 uv = vUv;
        uv.x *= uResolution.x / max(uResolution.y, 1.0);
  
        vec3 roWorld = vec3(0.0, 0.0, 3.45);
        vec3 rdWorld = normalize(vec3(uv * 0.48, -1.0));
  
        vec3 ro = uRot * roWorld;
        vec3 rd = normalize(uRot * rdWorld);
  
        float t = 0.0;
        bool hit = false;
        float curvedness = 0.0;
        vec3 p;
  
        for (int i = 0; i < 80; i++) {
          p = ro + rd * t;
          float d = mapMorph(p, curvedness);
          if (abs(d) < 0.001) {
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
  
        vec3 nObj = calcNormal(p);
        vec3 nWorld = normalize(uInvRot * nObj);
        vec3 v = -rdWorld;
  
        // Lighting & Shading matching Asset 21 recording:
        // Deep royal indigo/violet core (#0f0438 -> #4e22e0), bright pure-white top/side facets on polyhedra,
        // and intense glowing white Fresnel rim + top specular spot on the sphere and torus!
        vec3 topLight  = normalize(vec3(0.15, 0.92, 0.36));
        vec3 leftLight = normalize(vec3(-0.78, 0.18, 0.60));
        vec3 specLight = normalize(vec3(0.22, 0.72, 0.66));
  
        float dTop  = max(0.0, dot(nWorld, topLight));
        float dLeft = max(0.0, dot(nWorld, leftLight));
  
        vec3 darkIndigo  = vec3(0.055, 0.015, 0.220);
        vec3 vividViolet = vec3(0.360, 0.140, 0.880);
        vec3 brightLilac = vec3(0.620, 0.450, 0.980);
  
        // Polyhedral facet shading vs Smooth curved Fresnel shading
        vec3 polyCol = darkIndigo;
        polyCol = mix(polyCol, vividViolet, smoothstep(0.05, 0.85, dLeft));
        polyCol = mix(polyCol, brightLilac, pow(dLeft, 2.2) * 0.75);
        // Top-facing polyhedral faces flash pure crisp white as in 00:00, 00:02, 00:05, 00:08
        float whiteFace = smoothstep(0.58, 0.92, dTop);
        polyCol = mix(polyCol, vec3(1.0), whiteFace);
  
        // Curved Sphere/Torus shading (00:01, 00:04, 00:06, 00:07, 00:09)
        float NdotV = max(0.0, dot(nWorld, v));
        float fresnel = pow(1.0 - NdotV, 2.65);
        float outerRim = pow(1.0 - NdotV, 6.5);
  
        vec3 halfSpec = normalize(specLight + v);
        float specSpot = pow(max(0.0, dot(nWorld, halfSpec)), 36.0);
  
        vec3 curveCol = mix(darkIndigo, vividViolet, clamp(dTop * 0.55 + fresnel * 0.85, 0.0, 1.0));
        curveCol = mix(curveCol, vec3(1.0), clamp(fresnel * 0.92 + outerRim * 0.65 + specSpot * 0.95, 0.0, 1.0));
  
        vec3 col = mix(polyCol, curveCol, curvedness);
        // Add subtle white Fresnel glow even during polyhedral transitions
        col += vec3(1.0) * pow(1.0 - NdotV, 4.5) * (1.0 - curvedness) * 0.35;
  
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
  
    let rotX = 0.42;
    let rotY = -0.58;
    let rotZ = 0.18;
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
        rotY += 0.0095;
        rotX = 0.42 + Math.sin(t * 0.85) * 0.28;
        rotZ = 0.18 + Math.cos(t * 0.65) * 0.22;
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

export function Asset21({ className, style, width = '100%', height = '100%' }: Asset21Props) {
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

    initAsset21Runtime({
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
      className={className ? `fv-assets-asset-21 ${className}` : 'fv-assets-asset-21'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="glCanvas"></canvas>
    </div>
  );
}

export default Asset21;
