'use client';

/**
 * Cube 01 — 3D Glossy Voxel Wave Matrix
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Cube1Props {
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
.fv-cubes-cube-1 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-cubes-cube-1 *, .fv-cubes-cube-1 *::before, .fv-cubes-cube-1 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-cubes-cube-1 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #f4f4f4;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-cubes-cube-1 canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: grab;
  }

  .fv-cubes-cube-1 canvas:active {
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
function initCube1Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl2', { antialias: true, alpha: false }) ||
               canvas.getContext('webgl', { antialias: true, alpha: false });
  
    if (!gl) return;
  
    const vsSource = `
      attribute vec3 aPos;
      attribute vec3 aNormal;
      attribute vec2 aUv;
  
      uniform mat4 uProj;
      uniform mat4 uView;
      uniform vec3 uOffset;
      uniform float uScale;
      uniform vec3 uGridCoord;
  
      varying vec3 vNormal;
      varying vec3 vLocalPos;
      varying vec3 vLocalNormal;
      varying vec3 vViewPos;
      varying vec2 vUv;
      varying vec3 vGridCoord;
      varying float vScale;
  
      void main() {
        vec3 scaledPos = aPos * uScale + uOffset;
        vec4 viewPos = uView * vec4(scaledPos, 1.0);
        vViewPos = viewPos.xyz;
        vLocalPos = aPos;
        vLocalNormal = aNormal;
        vNormal = mat3(uView) * aNormal;
        vUv = aUv;
        vGridCoord = uGridCoord;
        vScale = uScale;
        gl_Position = uProj * viewPos;
      }
    `;
  
    const fsSource = `
      precision highp float;
  
      varying vec3 vNormal;
      varying vec3 vLocalPos;
      varying vec3 vLocalNormal;
      varying vec3 vViewPos;
      varying vec2 vUv;
      varying vec3 vGridCoord;
      varying float vScale;
  
      uniform mat4 uView;
      uniform float uTime;
  
      void main() {
        // Construct a smooth 3D beveled + slightly crowned normal in local cube space
        // so every sub-cube face and beveled edge catches a realistic glossy studio shine
        vec3 innerBox = clamp(vLocalPos, vec3(-0.37), vec3(0.37));
        vec3 bevelVec = vLocalPos - innerBox;
        vec3 localN = normalize(vLocalNormal + bevelVec * 4.2 + vLocalPos * 0.22);
        vec3 n = normalize(mat3(uView) * localN);
  
        // True per-fragment view direction in camera space
        vec3 viewDir = normalize(-vViewPos);
  
        // Edge bevel mask for crisp seam definition
        vec2 edgeDist = min(vUv, 1.0 - vUv);
        float minEdge = min(edgeDist.x, edgeDist.y);
        float bevelMask = smoothstep(0.0, 0.085, minEdge);
        float edgeRidge = 1.0 - smoothstep(0.0, 0.11, minEdge);
  
        // Studio lighting setup:
        // 1) Overhead/top-left key softbox
        // 2) Front-left fill light
        // 3) Right-side rim light
        vec3 lightTop   = normalize(vec3(-0.22, 0.88, 0.42));
        vec3 lightLeft  = normalize(vec3(-0.72, 0.22, 0.65));
        vec3 lightRight = normalize(vec3(0.75, -0.15, 0.45));
        vec3 specKey    = normalize(vec3(-0.28, 0.65, 0.71));
        vec3 specRim    = normalize(vec3(0.52, 0.48, 0.70));
  
        float dTop   = max(0.0, dot(n, lightTop));
        float dLeft  = max(0.0, dot(n, lightLeft));
        float dRight = max(0.0, dot(n, lightRight));
  
        // Vibrant azure palette
        vec3 baseBlue = vec3(0.055, 0.315, 0.585);
        vec3 leftBlue = vec3(0.145, 0.495, 0.805);
        vec3 topBlue  = vec3(0.310, 0.665, 0.945);
  
        vec3 col = baseBlue;
        col = mix(col, leftBlue, clamp(dLeft * 0.95, 0.0, 1.0));
        col = mix(col, topBlue,  clamp(pow(dTop, 1.12) * 0.98, 0.0, 1.0));
        col -= dRight * vec3(0.012, 0.030, 0.050);
  
        // Interior volumetric cavity ambient occlusion (rich deep cobalt inside the 11x11x11 matrix)
        float chebDist = max(max(abs(vGridCoord.x), abs(vGridCoord.y)), abs(vGridCoord.z)) / 5.0;
        float euclDist = length(vGridCoord) / 8.66;
        float cavityAO = mix(0.46, 1.0, smoothstep(0.15, 0.98, max(chebDist * 0.78, euclDist)));
  
        // Contact shadow between tightly packed full-scale neighbors
        float seamDarken = mix(0.75, 1.0, bevelMask);
        col *= cavityAO * mix(1.0, seamDarken, smoothstep(0.65, 1.0, vScale));
  
        // --- GLOSSY CLEARCOAT & STUDIO SHINE ---
        vec3 halfKey = normalize(specKey + viewDir);
        vec3 halfTop = normalize(lightTop + viewDir);
        vec3 halfRim = normalize(specRim + viewDir);
  
        float NdotHKey = max(0.0, dot(n, halfKey));
        float NdotHTop = max(0.0, dot(n, halfTop));
        float NdotHRim = max(0.0, dot(n, halfRim));
  
        // 1. Broad satin sheen across cube faces
        float satinSheen = pow(NdotHKey, 16.0) * 0.28 + pow(NdotHTop, 14.0) * 0.24;
  
        // 2. Sharp glossy clearcoat specular reflection
        float clearcoatSpec = pow(NdotHKey, 72.0) * 0.65 + pow(NdotHTop, 64.0) * 0.55;
  
        // 3. Bevel-edge catchlight (rounded edges gleam brightly when catching the studio key/rim lights)
        float bevelGleam = edgeRidge * (pow(NdotHKey, 20.0) * 0.75 + pow(NdotHRim, 24.0) * 0.55);
  
        // 4. Studio softbox reflection + Schlick Fresnel rim shine
        vec3 refl = reflect(-viewDir, n);
        float studioWindow = smoothstep(0.25, 0.82, refl.y) * smoothstep(-0.35, 0.85, refl.z);
        float fresnel = pow(1.0 - max(0.0, dot(n, viewDir)), 3.2);
  
        vec3 shineColor =
          vec3(0.62, 0.86, 1.00) * satinSheen +
          vec3(0.96, 0.99, 1.00) * clearcoatSpec +
          vec3(0.82, 0.94, 1.00) * bevelGleam +
          vec3(0.70, 0.88, 1.00) * (studioWindow * 0.26 + fresnel * 0.28);
  
        col += shineColor * mix(0.45, 1.0, cavityAO);
  
        gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
      }
    `;
  
    function compileShader(type: any, src?: any) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }
  
    const prog = gl.createProgram();
    gl.attachShader(prog, compileShader(gl.VERTEX_SHADER, vsSource));
    gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(prog);
    gl.useProgram(prog);
  
    // Unit cube geometry [-0.5, 0.5]^3 with normals and per-face UVs
    const positions: any[] = [];
    const normals: any[] = [];
    const uvs: any[] = [];
    const indices: any[] = [];
  
    const faces = [
      { n: [ 0,  0,  1], u: [ 1,  0,  0], v: [ 0,  1,  0] },
      { n: [ 0,  0, -1], u: [-1,  0,  0], v: [ 0,  1,  0] },
      { n: [ 0,  1,  0], u: [ 1,  0,  0], v: [ 0,  0, -1] },
      { n: [ 0, -1,  0], u: [ 1,  0,  0], v: [ 0,  0,  1] },
      { n: [ 1,  0,  0], u: [ 0,  0, -1], v: [ 0,  1,  0] },
      { n: [-1,  0,  0], u: [ 0,  0,  1], v: [ 0,  1,  0] }
    ];
  
    faces.forEach((f: any, fi: any) => {
      const corners = [
        [-0.5, -0.5, 0, 0],
        [ 0.5, -0.5, 1, 0],
        [ 0.5,  0.5, 1, 1],
        [-0.5,  0.5, 0, 1]
      ];
      corners.forEach(([cu, cv, s, t]: any) => {
        positions.push(
          f.n[0] * 0.5 + f.u[0] * cu + f.v[0] * cv,
          f.n[1] * 0.5 + f.u[1] * cu + f.v[1] * cv,
          f.n[2] * 0.5 + f.u[2] * cu + f.v[2] * cv
        );
        normals.push(f.n[0], f.n[1], f.n[2]);
        uvs.push(s, t);
      });
      const base = fi * 4;
      indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    });
  
    function makeBuffer(target: any, data: any, usage?: any) {
      const b = gl.createBuffer();
      gl.bindBuffer(target, b);
      gl.bufferData(target, data, usage || gl.STATIC_DRAW);
      return b;
    }
  
    const posBuf = makeBuffer(gl.ARRAY_BUFFER, new Float32Array(positions));
    const normBuf = makeBuffer(gl.ARRAY_BUFFER, new Float32Array(normals));
    const uvBuf = makeBuffer(gl.ARRAY_BUFFER, new Float32Array(uvs));
    const idxBuf = makeBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices));
  
    const aPos = gl.getAttribLocation(prog, 'aPos');
    const aNormal = gl.getAttribLocation(prog, 'aNormal');
    const aUv = gl.getAttribLocation(prog, 'aUv');
  
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
  
    gl.bindBuffer(gl.ARRAY_BUFFER, normBuf);
    gl.enableVertexAttribArray(aNormal);
    gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
  
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.enableVertexAttribArray(aUv);
    gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);
  
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
  
    const uProj = gl.getUniformLocation(prog, 'uProj');
    const uView = gl.getUniformLocation(prog, 'uView');
    const uOffset = gl.getUniformLocation(prog, 'uOffset');
    const uScale = gl.getUniformLocation(prog, 'uScale');
    const uGridCoord = gl.getUniformLocation(prog, 'uGridCoord');
    const uTime = gl.getUniformLocation(prog, 'uTime');
  
    // Precompute 11 x 11 x 11 grid coordinates (-5 to +5)
    const GRID = 11;
    const HALF = (GRID - 1) * 0.5;
    const SPACING = 1.015;
    const voxels: any[] = [];
  
    for (let x = 0; x < GRID; x++) {
      for (let y = 0; y < GRID; y++) {
        for (let z = 0; z < GRID; z++) {
          const gx = x - HALF;
          const gy = y - HALF;
          const gz = z - HALF;
          const dist = Math.sqrt(gx * gx + gy * gy + gz * gz);
          voxels.push({
            gx, gy, gz,
            ox: gx * SPACING,
            oy: gy * SPACING,
            oz: gz * SPACING,
            dist
          });
        }
      }
    }
  
    let rotX = 0.42;
    let rotY = -0.66;
    let targetRotX = 0.42;
    let targetRotY = -0.66;
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
      targetRotY += dx * 0.0075;
      targetRotX = Math.max(-1.35, Math.min(1.35, targetRotX + dy * 0.0075));
    });
  
    window.addEventListener('pointerup', () => {
      isDragging = false;
    });
  
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
  
    window.addEventListener('resize', resize);
    resize();
  
    function perspective(fovY: any, aspect: any, near: any, far?: any) {
      const f = 1.0 / Math.tan(fovY * 0.5);
      const nf = 1.0 / (near - far);
      return new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) * nf, -1,
        0, 0, (2 * far * near) * nf, 0
      ]);
    }
  
    function makeViewMatrix(rx: any, ry: any, dist?: any) {
      const sx = Math.sin(rx), cx = Math.cos(rx);
      const sy = Math.sin(ry), cy = Math.cos(ry);
  
      return new Float32Array([
        cy,       sx * sy,  -cx * sy, 0,
        0,        cx,        sx,      0,
        sy,      -sx * cy,   cx * cy, 0,
        0,        0,        -dist,    1
      ]);
    }
  
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.clearColor(0.957, 0.957, 0.957, 1.0);
  
    function render(now?: any) {
      const t = now * 0.001;
  
      rotX += (targetRotX - rotX) * 0.1;
      rotY += (targetRotY - rotY) * 0.1;
  
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
      const aspect = canvas.width / Math.max(canvas.height, 1);
      const proj = perspective(0.42, aspect, 1.0, 120.0);
      const view = makeViewMatrix(rotX, rotY, 46.0);
  
      gl.uniformMatrix4fv(uProj, false, proj);
      gl.uniformMatrix4fv(uView, false, view);
      gl.uniform1f(uTime, t);
  
      const waveSpeed = 2.4;
      const waveFreq = 0.85;
  
      for (let i = 0; i < voxels.length; i++) {
        const v = voxels[i];
        // Undulating planar-diagonal wave so the outer cube keeps crisp sharp 3D cube corners & edges
        // while circular wave troughs ripple cleanly across the cube faces (matching Cube 1 video)
        const wavePhase = v.dist * waveFreq - t * waveSpeed;
        const rawWave = Math.sin(wavePhase);
  
        const normalized = (rawWave + 0.72) / 1.72;
        const clamped = Math.min(1.0, Math.max(0.0, normalized));
        const eased = clamped * clamped * (3.0 - 2.0 * clamped);
        // Preserve outer cube frame voxels (>= 0.24) so the 3D CUBE never degrades into a spherical ball
        const isOuterShell = Math.max(Math.abs(v.gx), Math.abs(v.gy), Math.abs(v.gz)) >= 4.5;
        const scale = isOuterShell ? (0.28 + 0.69 * eased) : (eased * 0.96);
        if (scale <= 0.03) continue;
  
        gl.uniform3f(uOffset, v.ox, v.oy, v.oz);
        gl.uniform1f(uScale, scale);
        gl.uniform3f(uGridCoord, v.gx, v.gy, v.gz);
  
        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
      }
  
      requestAnimationFrame(render);
    }
  
    requestAnimationFrame(render);
  })();
}
/* eslint-enable */

export function Cube1({ className, style, width = '100%', height = '100%', blendMode = "normal", transparentBackground = false, edgeFeather = 0 }: Cube1Props) {
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

    initCube1Runtime({
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
      className={className ? `fv-cubes-cube-1 ${className}` : 'fv-cubes-cube-1'}
      style={{ width, height, ...blendStyle, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="glCanvas"></canvas>
    </div>
  );
}

export default Cube1;
