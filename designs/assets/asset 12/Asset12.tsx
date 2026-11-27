'use client';

/**
 * Asset 12 — 3D Interactive Blue Core &amp; Glass Containment Sphere
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Asset12Props {
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
.fv-assets-asset-12 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-assets-asset-12 *, .fv-assets-asset-12 *::before, .fv-assets-asset-12 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-assets-asset-12 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000000;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-assets-asset-12 canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: default;
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
function initAsset12Runtime(__fvRuntime: ScopedRuntimeContext): void {
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
  
    // Raycasted 3D Blue Core Robot Orb inside a Stepped Double-Walled Glass Containment Sphere
    // Replicating the exact royal-blue inner sphere, two glowing white vertical capsule eyes that
    // track the mouse cursor, the double-walled equatorial glass bowl rim, and top-right glass highlights!
    const fsSource = `
      precision highp float;
      varying vec2 vUv;
  
      uniform vec2 uResolution;
      uniform vec2 uPointer;
      uniform float uTime;
  
      // 2D Capsule SDF for the two glowing white pill eyes on the inner blue sphere
      float sdCapsule2D(vec2 p, vec2 a, vec2 b, float r) {
        vec2 pa = p - a, ba = b - a;
        float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        return length(pa - ba * h) - r;
      }
  
      // 2D Ring/Ellipse SDF for the equatorial glass bowl rim lines
      float sdEllipseApprox(vec2 p, vec2 ab) {
        vec2 q = p / ab;
        float r = length(q);
        return (r - 1.0) * min(ab.x, ab.y);
      }
  
      void main() {
        vec2 uv = vUv;
        uv.x *= uResolution.x / max(uResolution.y, 1.0);
  
        // Slight floating bob
        uv.y -= sin(uTime * 1.8) * 0.012;
  
        float outerR = 0.65;
        float innerR = 0.375;
        float r2d = length(uv);
  
        vec3 col = vec3(0.0);
  
        // Soft outer white atmospheric glow around the glass sphere silhouette
        float outerGlow = exp(-max(0.0, r2d - outerR) * 28.0) * smoothstep(outerR + 0.12, outerR - 0.01, r2d);
        col += vec3(0.85, 0.88, 0.95) * outerGlow * 0.48;
  
        if (r2d > outerR + 0.08) {
          gl_FragColor = vec4(col, 1.0);
          return;
        }
  
        // Outer glass sphere geometry
        vec2 pOuter = uv / outerR;
        float rOuterNorm = length(pOuter);
        bool insideOuter = rOuterNorm <= 1.0;
        float zOuter = insideOuter ? sqrt(max(0.0, 1.0 - rOuterNorm * rOuterNorm)) : 0.0;
        vec3 nOuter = normalize(vec3(pOuter, zOuter));
  
        // Equatorial stepped glass bowl rim plane (tilted slightly forward so we see the oval rim loop)
        float rimTilt = 0.24 - uPointer.y * 0.06;
        float rimYOffset = -0.055;
  
        // Back arc of the equatorial double-walled glass rim (behind the inner blue sphere, y > rimYOffset)
        vec2 rimUV = vec2(uv.x, uv.y - rimYOffset);
        float dOuterRim = abs(sdEllipseApprox(rimUV, vec2(outerR * 0.992, outerR * rimTilt)));
        float dInnerRim = abs(sdEllipseApprox(rimUV, vec2(outerR * 0.915, outerR * rimTilt * 0.90)));
        float dMidBand  = sdEllipseApprox(rimUV, vec2(outerR * 0.992, outerR * rimTilt));
        float dInBand   = sdEllipseApprox(rimUV, vec2(outerR * 0.915, outerR * rimTilt * 0.90));
  
        float rimStrokeBack = (1.0 - smoothstep(0.002, 0.009, dOuterRim)) +
                              (1.0 - smoothstep(0.002, 0.009, dInnerRim));
        float rimShelfBack = (dMidBand < 0.0 && dInBand > 0.0) ? 0.22 : 0.0;
  
        if (insideOuter && rimUV.y > 0.0) {
          col += vec3(0.75, 0.78, 0.84) * (rimStrokeBack * 0.55 + rimShelfBack);
        }
  
        // --- INNER ROYAL-PERWINKLE BLUE SPHERE ---
        // Subtly shifts and rotates toward the user's cursor (matching 00:00-00:07 of Asset 12 video)
        vec2 innerCenter = uPointer * 0.045 + vec2(0.0, 0.015);
        vec2 pInner = (uv - innerCenter) / innerR;
        float rInnerNorm = length(pInner);
  
        if (rInnerNorm <= 1.0) {
          float zInner = sqrt(max(0.0, 1.0 - rInnerNorm * rInnerNorm));
          vec3 nInner = normalize(vec3(pInner, zInner));
  
          // Base royal-periwinkle blue shading with soft upper-right studio light & lower-left deep blue shadow
          vec3 lightDir = normalize(vec3(0.38, 0.52, 0.76));
          float diff = max(0.0, dot(nInner, lightDir));
          float rimInner = pow(1.0 - zInner, 2.2);
  
          vec3 deepBlue   = vec3(0.11, 0.16, 0.88);
          vec3 midBlue    = vec3(0.28, 0.36, 0.98);
          vec3 brightBlue = vec3(0.55, 0.62, 1.00);
  
          vec3 blueCol = mix(deepBlue, midBlue, smoothstep(0.05, 0.75, diff));
          blueCol = mix(blueCol, brightBlue, pow(diff, 2.2) * 0.82);
          blueCol += vec3(0.35, 0.45, 1.0) * rimInner * 0.35;
  
          // Rotate surface point on the inner sphere toward the mouse pointer for the 2 glowing white pill eyes!
          float yaw = -uPointer.x * 0.62;
          float pitch = uPointer.y * 0.52;
          float cy = cos(yaw), sy = sin(yaw);
          float cx = cos(pitch), sx = sin(pitch);
  
          // Rotate around X then Y
          vec3 r1 = vec3(nInner.x, nInner.y * cx - nInner.z * sx, nInner.y * sx + nInner.z * cx);
          vec3 localP = vec3(r1.x * cy + r1.z * sy, r1.y, -r1.x * sy + r1.z * cy);
  
          if (localP.z > 0.0) {
            // Two vertical capsule eyes on the front hemisphere of the blue core
            vec2 eyeSpace = localP.xy;
            float dLeftEye  = sdCapsule2D(eyeSpace, vec2(-0.24, -0.11), vec2(-0.24, 0.14), 0.068);
            float dRightEye = sdCapsule2D(eyeSpace, vec2( 0.24, -0.11), vec2( 0.24, 0.14), 0.068);
            float dEyes = min(dLeftEye, dRightEye);
  
            float eyeFill = 1.0 - smoothstep(-0.008, 0.012, dEyes);
            float eyeGlow = exp(-max(0.0, dEyes) * 18.0) * 0.38;
  
            blueCol += vec3(0.75, 0.84, 1.0) * eyeGlow;
            blueCol = mix(blueCol, vec3(0.97, 0.98, 1.00), eyeFill);
          }
  
          // Anti-aliased inner sphere edge + soft blue bloom around inner sphere
          float innerAA = 1.0 - smoothstep(0.985, 1.0, rInnerNorm);
          col = mix(col, blueCol, innerAA);
        } else if (insideOuter) {
          // Soft blue glow halo around the inner sphere inside the glass bowl
          float innerHalo = exp(-(rInnerNorm - 1.0) * 9.5) * 0.28;
          col += vec3(0.24, 0.34, 0.98) * innerHalo;
        }
  
        // --- OUTER GLASS CONTAINMENT DOME & LOWER DOUBLE-WALLED GLASS BOWL ---
        if (insideOuter) {
          // Lower hemisphere (below the equatorial rim) has thicker frosted/milky glass Fresnel shading
          bool inLowerBowl = rimUV.y <= 0.0;
          float fresnel = pow(1.0 - zOuter, 2.6);
          float sharpRim = pow(1.0 - zOuter, 9.5);
  
          if (inLowerBowl) {
            // Inner wall of the lower glass bowl (radius ~ 0.915 * outerR)
            float rInnerWall = rOuterNorm / 0.915;
            float innerWallRim = (rInnerWall <= 1.0)
              ? pow(1.0 - sqrt(max(0.0, 1.0 - rInnerWall * rInnerWall)), 3.2) * 0.42
              : 0.35;
  
            float bowlShade = fresnel * 0.72 + innerWallRim;
            col += vec3(0.82, 0.85, 0.90) * bowlShade;
          } else {
            // Upper glass dome Fresnel rim
            col += vec3(0.78, 0.82, 0.88) * fresnel * 0.42;
          }
  
          // Crisp white outer silhouette rim
          col += vec3(0.96, 0.98, 1.00) * sharpRim * 0.95;
  
          // Front arc of the equatorial double-walled glass rim (in front of the inner blue sphere, y <= rimYOffset)
          if (rimUV.y <= 0.015) {
            float frontMask = smoothstep(0.015, -0.015, rimUV.y);
            float rimStrokeFront = (1.0 - smoothstep(0.002, 0.008, dOuterRim)) +
                                   (1.0 - smoothstep(0.002, 0.008, dInnerRim));
            float rimShelfFront = (dMidBand < 0.0 && dInBand > 0.0) ? 0.28 : 0.0;
            col += vec3(0.92, 0.94, 0.98) * (rimStrokeFront * 0.85 + rimShelfFront) * frontMask;
          }
  
          // Signature 3 curved glossy white studio reflections on the upper-right of the outer glass dome (1-2 o'clock)
          float angle = atan(pOuter.y, pOuter.x);
          float rad = rOuterNorm;
  
          // Outer curved specular streak 1 (top-right, ~55 deg)
          float s1 = exp(-pow((rad - 0.83) * 26.0, 2.0)) * exp(-pow((angle - 0.98) * 4.2, 2.0));
          // Outer curved specular streak 2 (upper-right, ~28 deg)
          float s2 = exp(-pow((rad - 0.83) * 26.0, 2.0)) * exp(-pow((angle - 0.44) * 5.2, 2.0));
          // Inner parallel curved specular streaks (rad ~ 0.72)
          float s3 = exp(-pow((rad - 0.71) * 24.0, 2.0)) * exp(-pow((angle - 0.96) * 4.8, 2.0));
          float s4 = exp(-pow((rad - 0.71) * 24.0, 2.0)) * exp(-pow((angle - 0.46) * 5.8, 2.0));
  
          float glassHighlights = clamp((s1 + s2 + s3 * 0.85 + s4 * 0.85) * 1.35, 0.0, 1.0);
          col = mix(col, vec3(1.0), glassHighlights * 0.92);
        }
  
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
    const uPointer = gl.getUniformLocation(prog, 'uPointer');
    const uTime = gl.getUniformLocation(prog, 'uTime');
  
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();
  
    // Start looking slightly up-left as in 00:00 of the Asset 12 recording, then track mouse cursor!
    let ptrX = -0.35;
    let ptrY = 0.25;
    let targetX = -0.35;
    let targetY = 0.25;
  
    window.addEventListener('pointermove', (e: any) => {
      targetX = (e.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      targetY = 1 - (e.clientY / Math.max(window.innerHeight, 1)) * 2;
    });
  
    function render(now?: any) {
      const t = now * 0.001;
      ptrX += (targetX - ptrX) * 0.09;
      ptrY += (targetY - ptrY) * 0.09;
  
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform2f(uPointer, ptrX, ptrY);
      gl.uniform1f(uTime, t);
  
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestAnimationFrame(render);
    }
  
    requestAnimationFrame(render);
  })();
}
/* eslint-enable */

export function Asset12({ className, style, width = '100%', height = '100%', blendMode = "normal", transparentBackground = false, edgeFeather = 0 }: Asset12Props) {
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

    initAsset12Runtime({
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
      className={className ? `fv-assets-asset-12 ${className}` : 'fv-assets-asset-12'}
      style={{ width, height, ...blendStyle, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="glCanvas"></canvas>
    </div>
  );
}

export default Asset12;
