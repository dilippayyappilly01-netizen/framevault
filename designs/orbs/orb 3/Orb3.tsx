'use client';

/**
 * Orb 03 — 3D Rotating Typography / Letter Orb
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Orb3Props {
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
.fv-orbs-orb-3 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-orbs-orb-3 *, .fv-orbs-orb-3 *::before, .fv-orbs-orb-3 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-orbs-orb-3 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000000;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-orbs-orb-3 canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: grab;
  }

  .fv-orbs-orb-3 canvas:active {
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
function initOrb3Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl2', { antialias: true, alpha: false }) ||
               canvas.getContext('webgl', { antialias: true, alpha: false });
    if (!gl) return;
  
    // Build an in-memory 2048x2048 high-DPI Glyph Texture Atlas (8x8 = 64 characters)
    // Using an in-memory canvas is 100% same-origin so gl.texImage2D works offline on file://
    const ATLAS_COLS = 8;
    const ATLAS_ROWS = 8;
    const CELL_SIZE = 256;
    const ATLAS_SIZE = ATLAS_COLS * CELL_SIZE; // 2048x2048
  
    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+#';
  
    const atlasCanvas = document.createElement('canvas');
    atlasCanvas.width = ATLAS_SIZE;
    atlasCanvas.height = ATLAS_SIZE;
    const actx = atlasCanvas.getContext('2d');
  
    actx.clearRect(0, 0, ATLAS_SIZE, ATLAS_SIZE);
    actx.fillStyle = '#ffffff';
    actx.textAlign = 'center';
    actx.textBaseline = 'middle';
    actx.font = '600 168px "SF Mono", "JetBrains Mono", "Roboto Mono", "Consolas", "Menlo", monospace';
  
    for (let i = 0; i < 64; i++) {
      const col = i % ATLAS_COLS;
      const row = Math.floor(i / ATLAS_COLS);
      const cx = col * CELL_SIZE + CELL_SIZE * 0.5;
      const cy = row * CELL_SIZE + CELL_SIZE * 0.52;
      actx.fillText(CHARS[i % CHARS.length], cx, cy);
    }
  
    const glyphTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, glyphTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlasCanvas);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  
    const vsSource = `
      attribute vec3 aPos;
      attribute float aCharIdx;
      attribute float aScale;
      attribute float aLum;
      attribute float aPhase;
  
      uniform float uTime;
      uniform vec2 uResolution;
      uniform float uRotZ;
      uniform mat3 uRot3D;
  
      varying vec2 vAtlasOffset;
      varying float vAlpha;
      varying float vLum;
      varying float vAngle;
  
      void main() {
        float t = uTime;
        vec3 p = aPos;
  
        // Primary counterclockwise rotation around Z axis + 3D trackball rotation
        float cz = cos(uRotZ);
        float sz = sin(uRotZ);
        vec3 rz = vec3(
          p.x * cz - p.y * sz,
          p.x * sz + p.y * cz,
          p.z
        );
  
        // Subtle 3D poloidal circulation inside the torus-sphere shell
        float rXY = length(rz.xy);
        float majorR = 0.68;
        float rollAngle = t * 0.24 + aPhase * 0.25;
        float zRolled = rz.z * cos(rollAngle) + (rXY - majorR) * sin(rollAngle) * 0.55;
  
        vec3 worldPos = uRot3D * vec3(rz.x, rz.y, zRolled);
  
        // Perspective projection
        float fov = 2.85;
        float persp = fov / (fov - worldPos.z * 0.52);
  
        float aspect = uResolution.x / max(uResolution.y, 1.0);
        float orbRadius = 0.64;
        vec2 screenPos = vec2(
          (worldPos.x * orbRadius * persp) / aspect,
          worldPos.y * orbRadius * persp
        );
  
        gl_Position = vec4(screenPos, 0.0, 1.0);
  
        // Crisp letter size scaled proportionally to viewport resolution and 3D perspective
        float resScale = uResolution.y / 920.0;
        gl_PointSize = aScale * persp * resScale;
  
        // Compute UV cell offset in the 8x8 glyph atlas
        float idx = floor(mod(aCharIdx + floor(t * 0.6 + aPhase) * 0.0, 64.0));
        float col = mod(idx, 8.0);
        float row = floor(idx / 8.0);
        vAtlasOffset = vec2(col / 8.0, row / 8.0);
  
        // Depth-based luminance: bright white in front, silver in mid-plane, dim slate in back
        float depthFactor = smoothstep(-0.92, 0.88, worldPos.z);
        vLum = mix(0.32, 1.0, depthFactor) * aLum;
        vAlpha = mix(0.35, 0.98, depthFactor);
  
        // Subtle tangential letter orientation tilt
        vAngle = atan(worldPos.y, worldPos.x) * 0.15 * sin(aPhase);
      }
    `;
  
    const fsSource = `
      precision highp float;
  
      varying vec2 vAtlasOffset;
      varying float vAlpha;
      varying float vLum;
      varying float vAngle;
  
      uniform sampler2D uGlyphTex;
  
      void main() {
        // Optional slight rotation around sprite center
        vec2 centered = gl_PointCoord - 0.5;
        float c = cos(vAngle);
        float s = sin(vAngle);
        vec2 rotated = vec2(
          centered.x * c - centered.y * s,
          centered.x * s + centered.y * c
        ) + 0.5;
  
        if (rotated.x < 0.02 || rotated.x > 0.98 || rotated.y < 0.02 || rotated.y > 0.98) {
          discard;
        }
  
        vec2 uv = vAtlasOffset + rotated / 8.0;
        vec4 tex = texture2D(uGlyphTex, uv);
  
        float alpha = tex.a * vAlpha;
        if (alpha < 0.04) discard;
  
        gl_FragColor = vec4(vec3(vLum), alpha);
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
  
    // Generate 3,400 3D letters forming the exact thick hollow torus-sphere shell from Orb 3:
    // Crisp outer spherical boundary (r = 1.0) and hollow inner core void (r < 0.36)
    const COUNT = 3400;
    const positions = new Float32Array(COUNT * 3);
    const charIndices = new Float32Array(COUNT);
    const scales = new Float32Array(COUNT);
    const lums = new Float32Array(COUNT);
    const phases = new Float32Array(COUNT);
  
    for (let i = 0; i < COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
  
      // Radial distribution matching the hollow center and crisp outer circular edge of Orb 3
      let r2d: any;
      if (i < COUNT * 0.14) {
        // Soft inner transition fringe (0.33..0.48)
        r2d = 0.33 + Math.pow(Math.random(), 0.75) * 0.15;
      } else {
        // Dense main spherical ring band (0.45..1.00)
        r2d = 0.45 + Math.pow(Math.random(), 0.80) * 0.55;
      }
  
      // 3D sphere chord thickness at radius r2d
      const maxZ = Math.sqrt(Math.max(0.0, 1.0 - r2d * r2d));
      const sign = Math.random() < 0.5 ? 1 : -1;
      const z = (0.32 + 0.68 * Math.pow(Math.random(), 0.58)) * maxZ * sign;
  
      positions[i * 3]     = Math.cos(theta) * r2d;
      positions[i * 3 + 1] = Math.sin(theta) * r2d;
      positions[i * 3 + 2] = z;
  
      charIndices[i] = Math.floor(Math.random() * 64);
      scales[i] = 9.0 + Math.random() * 4.5; // Crisp micro-letter size (~9px-13.5px)
      lums[i] = 0.68 + Math.random() * 0.32;
      phases[i] = Math.random() * Math.PI * 2;
    }
  
    function bindAttr(name: any, data: any, size?: any) {
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    }
  
    bindAttr('aPos', positions, 3);
    bindAttr('aCharIdx', charIndices, 1);
    bindAttr('aScale', scales, 1);
    bindAttr('aLum', lums, 1);
    bindAttr('aPhase', phases, 1);
  
    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uResolution = gl.getUniformLocation(prog, 'uResolution');
    const uRotZ = gl.getUniformLocation(prog, 'uRotZ');
    const uRot3D = gl.getUniformLocation(prog, 'uRot3D');
    const uGlyphTex = gl.getUniformLocation(prog, 'uGlyphTex');
  
    gl.uniform1i(uGlyphTex, 0);
  
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();
  
    let rotZ = 0;
    let rotX = 0;
    let rotY = 0;
    let targetRotX = 0;
    let targetRotY = 0;
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
  
    window.addEventListener('pointerdown', (e: any) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    });
  
    window.addEventListener('pointermove', (e: any) => {
      const nx = (e.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      const ny = (e.clientY / Math.max(window.innerHeight, 1)) * 2 - 1;
  
      if (isDragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        rotZ -= dx * 0.004;
        targetRotY += dx * 0.005;
        targetRotX = Math.max(-0.85, Math.min(0.85, targetRotX + dy * 0.005));
      } else {
        targetRotY = nx * 0.16;
        targetRotX = ny * 0.16;
      }
    });
  
    window.addEventListener('pointerup', () => {
      isDragging = false;
    });
  
    function buildRot3D(rx: any, ry?: any) {
      const cx = Math.cos(rx), sx = Math.sin(rx);
      const cy = Math.cos(ry), sy = Math.sin(ry);
      return new Float32Array([
        cy, sx * sy, -cx * sy,
        0,  cx,       sx,
        sy, -sx * cy, cx * cy
      ]);
    }
  
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
  
    function render(now?: any) {
      const t = now * 0.001;
      if (!isDragging) {
        rotZ += 0.0032; // Smooth counterclockwise rotation matching Orb 3 recording
      }
  
      rotX += (targetRotX - rotX) * 0.06;
      rotY += (targetRotY - rotY) * 0.06;
  
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uRotZ, rotZ);
      gl.uniformMatrix3fv(uRot3D, false, buildRot3D(rotX, rotY));
  
      gl.drawArrays(gl.POINTS, 0, COUNT);
      requestAnimationFrame(render);
    }
  
    requestAnimationFrame(render);
  })();
}
/* eslint-enable */

export function Orb3({ className, style, width = '100%', height = '100%', blendMode = "normal", transparentBackground = false, edgeFeather = 0 }: Orb3Props) {
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

    initOrb3Runtime({
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
      className={className ? `fv-orbs-orb-3 ${className}` : 'fv-orbs-orb-3'}
      style={{ width, height, ...blendStyle, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="glCanvas"></canvas>
    </div>
  );
}

export default Orb3;
