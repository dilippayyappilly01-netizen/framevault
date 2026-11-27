'use client';

/**
 * Asset 11 — 3D Golden-Sand Spiral Whirlpool Vortex
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Asset11Props {
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
.fv-assets-asset-11 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-assets-asset-11 *, .fv-assets-asset-11 *::before, .fv-assets-asset-11 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-assets-asset-11 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000000;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-assets-asset-11 canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: grab;
  }

  .fv-assets-asset-11 canvas:active {
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
function initAsset11Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl2', { antialias: true }) ||
               canvas.getContext('webgl', { antialias: true });
    if (!gl) return;
  
    const vsSource = `
      attribute float aRadiusSeed;
      attribute float aAngleSeed;
      attribute float aArmBunch;
      attribute float aToneSeed;
      attribute float aSizeSeed;
  
      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uTilt;
  
      varying vec3 vColor;
      varying float vAlpha;
  
      void main() {
        // Continuous inward/rotational spiral flow
        float rNorm = fract(aRadiusSeed - uTime * 0.018);
  
        // Inner funnel throat radius = 0.085, outer disk radius = 1.48
        float r = 0.085 + pow(rNorm, 1.08) * 1.42;
  
        // 2 tightly-wound interleaved spiral arms making ~6 full turns across the disk
        // Matches the crisp golden-champagne spiral ridges & warm bronze troughs in Asset 11
        float spiralK = 26.5;
        float spin = uTime * (0.48 + 0.25 / (r + 0.18));
  
        // Angle along the spiral wave
        float baseAngle = aAngleSeed + spin;
        float spiralPhase = baseAngle * 2.0 + r * spiralK;
  
        // Caustic bunching pulls particles toward the spiral ridge crests (cos(spiralPhase) == 1)
        float bunchStrength = 0.58 * aArmBunch;
        float theta = baseAngle - (bunchStrength * 0.5) * sin(spiralPhase);
  
        // Crest factor: 1.0 on the bright champagne-gold spiral ridge, 0.0 in the copper-brown valley
        float waveCos = cos(theta * 2.0 + r * spiralK) * 0.5 + 0.5;
        float crest = pow(waveCos, 3.2);
  
        // 3D funnel depression: plunges downward at the central throat (r -> 0.085)
        // and rises slightly along the spiral wave ridges
        float funnelY = -0.19 / (r * 2.8 + 0.08) + crest * 0.022;
  
        vec3 p = vec3(cos(theta) * r, funnelY, sin(theta) * r);
  
        // Oblique 3D camera view (~40 deg pitch + slight diagonal roll matching Asset 11 recording)
        float pitch = 0.68 + uTilt.y * 0.14;
        float roll  = -0.08 + uTilt.x * 0.14;
  
        float cp = cos(pitch), sp = sin(pitch);
        float cr = cos(roll),  sr = sin(roll);
  
        // Rotate X (pitch)
        vec3 p1 = vec3(p.x, p.y * cp - p.z * sp, p.y * sp + p.z * cp);
        // Rotate Z (roll)
        vec3 p2 = vec3(p1.x * cr - p1.y * sr, p1.x * sr + p1.y * cr, p1.z);
  
        float fov = 2.35;
        float persp = fov / max(0.5, fov - p2.z * 0.55);
  
        float aspect = uResolution.x / max(uResolution.y, 1.0);
        float scale = 0.92;
        gl_Position = vec4(
          (p2.x * scale * persp) / aspect,
          (p2.y * scale * persp) + 0.03,
          0.0,
          1.0
        );
  
        float dpr = min(2.0, uResolution.y / 900.0);
        gl_PointSize = (0.72 + crest * 0.55 + pow(aSizeSeed, 3.0) * 0.95) * persp * max(1.0, dpr * 1.08);
  
        // Authentic Asset 11 sparkling discrete golden-sand particles over dark umber pit
        vec3 deepUmber     = vec3(0.18, 0.09, 0.03);
        vec3 copperBrown   = vec3(0.46, 0.27, 0.10);
        vec3 warmGold      = vec3(0.88, 0.66, 0.28);
        vec3 champagnePeak = vec3(1.00, 0.95, 0.78);
  
        vec3 col = mix(deepUmber, copperBrown, aToneSeed);
        col = mix(col, warmGold, smoothstep(0.15, 0.68, crest));
        col = mix(col, champagnePeak, smoothstep(0.55, 0.98, crest) * (0.55 + 0.45 * aToneSeed));
  
        // Darken inside the central black hole throat & fade cleanly at outer disk boundary
        float innerShadow = smoothstep(0.0, 0.085, rNorm);
        float outerFade = 1.0 - smoothstep(0.84, 1.0, rNorm);
  
        vColor = col * innerShadow;
        vAlpha = (0.14 + 0.56 * crest) * innerShadow * outerFade;
      }
    `;
  
    const fsSource = `
      precision highp float;
      varying vec3 vColor;
      varying float vAlpha;
  
      void main() {
        vec2 d = gl_PointCoord - 0.5;
        float r2 = dot(d, d) * 4.0;
        if (r2 > 1.0) discard;
        float falloff = 1.0 - smoothstep(0.25, 1.0, r2);
        gl_FragColor = vec4(vColor, vAlpha * falloff);
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
  
    // 85,000 fine sand/star particles for ultra-rich spiral ridge definition and copper-brown trough texture
    const COUNT = 85000;
    const radiusSeeds = new Float32Array(COUNT);
    const angleSeeds = new Float32Array(COUNT);
    const armBunches = new Float32Array(COUNT);
    const toneSeeds = new Float32Array(COUNT);
    const sizeSeeds = new Float32Array(COUNT);
  
    for (let i = 0; i < COUNT; i++) {
      radiusSeeds[i] = Math.random();
      angleSeeds[i] = Math.random() * Math.PI * 2;
      // 70% of particles strongly bunch into the spiral ridges, 30% fill the copper-brown troughs
      armBunches[i] = Math.random() < 0.72 ? (0.75 + Math.random() * 0.25) : (Math.random() * 0.35);
      toneSeeds[i] = Math.random();
      sizeSeeds[i] = Math.random();
    }
  
    function bindAttr(name: any, data: any, size?: any) {
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    }
  
    bindAttr('aRadiusSeed', radiusSeeds, 1);
    bindAttr('aAngleSeed', angleSeeds, 1);
    bindAttr('aArmBunch', armBunches, 1);
    bindAttr('aToneSeed', toneSeeds, 1);
    bindAttr('aSizeSeed', sizeSeeds, 1);
  
    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uResolution = gl.getUniformLocation(prog, 'uResolution');
    const uTilt = gl.getUniformLocation(prog, 'uTilt');
  
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();
  
    let tiltX = 0;
    let tiltY = 0;
    let targetTiltX = 0;
    let targetTiltY = 0;
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
  
    window.addEventListener('pointerdown', (e: any) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    });
  
    window.addEventListener('pointermove', (e: any) => {
      if (isDragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        targetTiltX = Math.max(-1.2, Math.min(1.2, targetTiltX + dx * 0.005));
        targetTiltY = Math.max(-1.0, Math.min(1.0, targetTiltY + dy * 0.005));
      } else {
        targetTiltX = ((e.clientX / Math.max(window.innerWidth, 1)) * 2 - 1) * 0.35;
        targetTiltY = ((e.clientY / Math.max(window.innerHeight, 1)) * 2 - 1) * 0.35;
      }
    });
  
    window.addEventListener('pointerup', () => {
      isDragging = false;
    });
  
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
  
    function render(now?: any) {
      const t = now * 0.001;
      tiltX += (targetTiltX - tiltX) * 0.06;
      tiltY += (targetTiltY - tiltY) * 0.06;
  
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform2f(uTilt, tiltX, tiltY);
  
      gl.drawArrays(gl.POINTS, 0, COUNT);
      requestAnimationFrame(render);
    }
  
    requestAnimationFrame(render);
  })();
}
/* eslint-enable */

export function Asset11({ className, style, width = '100%', height = '100%', blendMode = "normal", transparentBackground = false, edgeFeather = 0 }: Asset11Props) {
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

    initAsset11Runtime({
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
      className={className ? `fv-assets-asset-11 ${className}` : 'fv-assets-asset-11'}
      style={{ width, height, ...blendStyle, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="glCanvas"></canvas>
    </div>
  );
}

export default Asset11;
