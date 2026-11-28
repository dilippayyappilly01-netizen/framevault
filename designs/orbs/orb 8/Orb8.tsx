'use client';

/**
 * Orb 08 — Interactive Fibonacci Particle Sphere with Fluid Repulsion Wake
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Orb8Props {
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
.fv-orbs-orb-8 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-orbs-orb-8 *, .fv-orbs-orb-8 *::before, .fv-orbs-orb-8 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-orbs-orb-8 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000000;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-orbs-orb-8 canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: crosshair;
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
function initOrb8Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl2', { antialias: true, alpha: false }) ||
               canvas.getContext('webgl', { antialias: true, alpha: false });
    if (!gl) return;
  
    // ---------------------------------------------------------------------------
    // Shaders: Crisp Depth-Shaded Particles with Coral-Pink Displacement Rim
    // ---------------------------------------------------------------------------
    const vsSource = `
      attribute vec3 aPos;
      attribute float aDisp;
  
      uniform vec2 uResolution;
      uniform float uScale;
      uniform float uDpr;
  
      varying float vDepth;
      varying float vDisp;
  
      void main() {
        float fov = 3.2;
        float persp = fov / (fov - aPos.z * 0.72);
        float aspect = uResolution.x / max(uResolution.y, 1.0);
  
        float x = (aPos.x * uScale * persp) / aspect;
        float y = aPos.y * uScale * persp;
  
        gl_Position = vec4(x, y, -aPos.z * 0.25, 1.0);
  
        float frontness = clamp((aPos.z + 1.0) * 0.5, 0.0, 1.0);
        vDepth = frontness;
        vDisp = aDisp;
  
        float baseSize = mix(1.55, 3.05, pow(frontness, 1.15));
        float rimBoost = 1.0 + clamp(aDisp * 2.2, 0.0, 0.55);
        gl_PointSize = baseSize * rimBoost * persp * uDpr;
      }
    `;
  
    const fsSource = `
      precision highp float;
  
      varying float vDepth;
      varying float vDisp;
  
      void main() {
        vec2 p = gl_PointCoord - 0.5;
        float d = length(p);
        if (d > 0.5) discard;
  
        // Crisp circular dot with subtle anti-aliased edge
        float alpha = smoothstep(0.50, 0.22, d);
  
        // Depth attenuation so front hemisphere dots pop brightly over back dots
        float depthShade = mix(0.20, 1.0, pow(vDepth, 1.25));
  
        vec3 dotWhite  = vec3(0.98, 0.99, 1.00);
        vec3 wakeCoral = vec3(1.00, 0.42, 0.48);
  
        // Subtle rose-pink/coral tint along the displaced cavity rim
        float rimFactor = smoothstep(0.035, 0.22, vDisp) * smoothstep(0.05, 0.55, vDepth);
        vec3 col = mix(dotWhite, wakeCoral, clamp(rimFactor * 0.88, 0.0, 0.92));
  
        gl_FragColor = vec4(col * depthShade, alpha * mix(0.45, 1.0, vDepth));
      }
    `;
  
    function compile(type: any, src?: any) {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(sh));
      }
      return sh;
    }
  
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vsSource));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(prog);
    gl.useProgram(prog);
  
    // ---------------------------------------------------------------------------
    // Fibonacci Sphere Lattice (7,200 crisp regularly spaced particles)
    // ---------------------------------------------------------------------------
    const COUNT = 7200;
    const homeX = new Float32Array(COUNT);
    const homeY = new Float32Array(COUNT);
    const homeZ = new Float32Array(COUNT);
  
    // Displaced offsets in view/world space
    const offX = new Float32Array(COUNT);
    const offY = new Float32Array(COUNT);
    const offZ = new Float32Array(COUNT);
    const velX = new Float32Array(COUNT);
    const velY = new Float32Array(COUNT);
    const velZ = new Float32Array(COUNT);
  
    // Interleaved GPU vertex buffer: [x, y, z, disp]
    const vboData = new Float32Array(COUNT * 4);
  
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < COUNT; i++) {
      const y = 1 - (i / (COUNT - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = goldenAngle * i;
      homeX[i] = Math.cos(theta) * r;
      homeY[i] = y;
      homeZ[i] = Math.sin(theta) * r;
    }
  
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vboData.byteLength, gl.DYNAMIC_DRAW);
  
    const aPosLoc  = gl.getAttribLocation(prog, 'aPos');
    const aDispLoc = gl.getAttribLocation(prog, 'aDisp');
    const uResLoc  = gl.getUniformLocation(prog, 'uResolution');
    const uScaleLoc = gl.getUniformLocation(prog, 'uScale');
    const uDprLoc  = gl.getUniformLocation(prog, 'uDpr');
  
    gl.enableVertexAttribArray(aPosLoc);
    gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(aDispLoc);
    gl.vertexAttribPointer(aDispLoc, 1, gl.FLOAT, false, 16, 12);
  
    // ---------------------------------------------------------------------------
    // Cursor & Fluid Wake Trail State
    // ---------------------------------------------------------------------------
    const TRAIL_LEN = 18;
    const trail: any[] = [];
    for (let i = 0; i < TRAIL_LEN; i++) {
      trail.push({ x: 99, y: 99, active: 0 });
    }
  
    let pointerActive = false;
    let lastPointerTime = -10000;
    let cursorSX = 0; // sphere-normalized space (-1..1 around sphere radius)
    let cursorSY = 0;
    let smoothCX = 0;
    let smoothCY = 0;
  
    let width = 1, height = 1, dpr = 1;
    const SPHERE_SCALE = 0.78;
  
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.floor(window.innerWidth * dpr));
      height = Math.max(1, Math.floor(window.innerHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
      gl.uniform2f(uResLoc, width, height);
      gl.uniform1f(uScaleLoc, SPHERE_SCALE);
      gl.uniform1f(uDprLoc, dpr);
    }
  
    window.addEventListener('resize', resize);
    resize();
  
    function updatePointerFromClient(clientX: any, clientY?: any) {
      const aspect = width / Math.max(height, 1);
      const ndcX = (clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      const ndcY = -((clientY / Math.max(1, window.innerHeight)) * 2 - 1);
      // Map NDC to sphere local X/Y (accounting for perspective ~1.18 at front surface)
      cursorSX = (ndcX * aspect) / (SPHERE_SCALE * 1.18);
      cursorSY = ndcY / (SPHERE_SCALE * 1.18);
      pointerActive = true;
      lastPointerTime = performance.now();
    }
  
    canvas.addEventListener('pointermove', (e: any) => {
      updatePointerFromClient(e.clientX, e.clientY);
    });
  
    canvas.addEventListener('pointerdown', (e: any) => {
      updatePointerFromClient(e.clientX, e.clientY);
    });
  
    canvas.addEventListener('pointerleave', () => {
      pointerActive = false;
    });
  
    // ---------------------------------------------------------------------------
    // Physics & Render Loop
    // ---------------------------------------------------------------------------
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);
  
    const startTime = performance.now();
  
    function frame(now?: any) {
      const t = (now - startTime) * 0.001;
  
      // Gentle autonomous cursor sweep when idle so preview shows the signature fluid wake
      const isIdle = !pointerActive && (now - lastPointerTime > 2400);
      let targetActive = pointerActive ? 1.0 : 0.0;
      let tx = cursorSX;
      let ty = cursorSY;
  
      if (isIdle) {
        const cycle = t * 0.72;
        tx = Math.sin(cycle) * 0.62 + Math.cos(cycle * 2.1) * 0.14;
        ty = Math.sin(cycle * 1.45) * 0.52;
        targetActive = 1.0;
      }
  
      smoothCX += (tx - smoothCX) * 0.24;
      smoothCY += (ty - smoothCY) * 0.24;
  
      // Shift wake trail history
      for (let i = TRAIL_LEN - 1; i > 0; i--) {
        trail[i].x = trail[i - 1].x;
        trail[i].y = trail[i - 1].y;
        trail[i].active = trail[i - 1].active * 0.91;
      }
      trail[0].x = smoothCX;
      trail[0].y = smoothCY;
      trail[0].active = targetActive;
  
      // Slow continuous sphere rotation
      const rotY = t * 0.16;
      const rotX = Math.sin(t * 0.11) * 0.18 + 0.15;
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
  
      const springK = 0.082;
      const damping = 0.80;
  
      // Update all 7,200 particles
      for (let i = 0; i < COUNT; i++) {
        const hx = homeX[i];
        const hy = homeY[i];
        const hz = homeZ[i];
  
        // Rotate home lattice point
        const rx1 = hx * cosY + hz * sinY;
        const rz1 = -hx * sinY + hz * cosY;
        const ry2 = hy * cosX - rz1 * sinX;
        const rz2 = hy * sinX + rz1 * cosX;
  
        let ox = offX[i];
        let oy = offY[i];
        let oz = offZ[i];
        let vx = velX[i];
        let vy = velY[i];
        let vz = velZ[i];
  
        // Current particle position
        const px = rx1 + ox;
        const py = ry2 + oy;
        const pz = rz2 + oz;
  
        // Apply fluid wake repulsion on the front hemisphere
        if (pz > -0.15) {
          const frontMask = Math.min(1.0, (pz + 0.15) * 1.4);
  
          for (let k = 0; k < TRAIL_LEN; k++) {
            const node = trail[k];
            if (node.active < 0.04) continue;
  
            const u = k / (TRAIL_LEN - 1);
            // Teardrop / comet profile: wider at cursor head, tapering smoothly along tail
            const radius = (0.31 - 0.19 * u) * node.active;
            const dx = px - node.x;
            const dy = py - node.y;
            const distSq = dx * dx + dy * dy;
  
            if (distSq < radius * radius) {
              const dist = Math.sqrt(distSq) + 0.0001;
              const falloff = 1.0 - dist / radius;
              const strength = falloff * falloff * (0.046 * (1.0 - u * 0.72)) * frontMask * node.active;
  
              const nx = dx / dist;
              const ny = dy / dist;
  
              // Push tangentially along sphere surface so particles bunch up into a crisp rim
              vx += nx * strength;
              vy += ny * strength;
              vz -= falloff * 0.014 * frontMask * node.active;
            }
          }
        }
  
        // Spring back to home lattice position
        vx = (vx - ox * springK) * damping;
        vy = (vy - oy * springK) * damping;
        vz = (vz - oz * springK) * damping;
  
        ox += vx;
        oy += vy;
        oz += vz;
  
        offX[i] = ox;
        offY[i] = oy;
        offZ[i] = oz;
        velX[i] = vx;
        velY[i] = vy;
        velZ[i] = vz;
  
        // Keep displaced particles gently hugging the spherical shell
        let fx = rx1 + ox;
        let fy = ry2 + oy;
        let fz = rz2 + oz;
        const dispMag = Math.hypot(ox, oy, oz);
        if (dispMag > 0.001) {
          const len = Math.hypot(fx, fy, fz) || 1;
          const targetLen = 1.0 + Math.min(0.06, dispMag * 0.18);
          const s = targetLen / len;
          fx *= s;
          fy *= s;
          fz *= s;
        }
  
        const idx = i * 4;
        vboData[idx]     = fx;
        vboData[idx + 1] = fy;
        vboData[idx + 2] = fz;
        vboData[idx + 3] = dispMag;
      }
  
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, vboData);
      gl.drawArrays(gl.POINTS, 0, COUNT);
  
      requestAnimationFrame(frame);
    }
  
    requestAnimationFrame(frame);
  })();
}
/* eslint-enable */

export function Orb8({ className, style, width = '100%', height = '100%', blendMode = "normal", transparentBackground = false, edgeFeather = 0 }: Orb8Props) {
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

    initOrb8Runtime({
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
      className={className ? `fv-orbs-orb-8 ${className}` : 'fv-orbs-orb-8'}
      style={{ width, height, ...blendStyle, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="glCanvas"></canvas>
    </div>
  );
}

export default Orb8;
