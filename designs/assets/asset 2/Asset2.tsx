'use client';

/**
 * Asset 02 — Concentric Violet Particle Wave Tunnel
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Asset2Props {
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
.fv-assets-asset-2 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-assets-asset-2 *, .fv-assets-asset-2 *::before, .fv-assets-asset-2 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-assets-asset-2 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000000;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-assets-asset-2 canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: grab;
  }

  .fv-assets-asset-2 canvas:active {
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
function initAsset2Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl2', { antialias: true }) ||
               canvas.getContext('webgl', { antialias: true });
    if (!gl) return;
  
    const vsSource = `
      attribute float aAngle;
      attribute float aRingIndex;
      attribute float aTailDist;
      attribute float aSeed;
      attribute float aSize;
  
      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uTilt;
      uniform vec2 uPointer;
  
      varying vec3 vColor;
      varying float vAlpha;
  
      void main() {
        // 4 nested sweeping concentric violet/indigo wave fronts expanding from the dark central void
        const float RINGS = 4.0;
        float speed = 0.17;
        float ringProg = fract((aRingIndex + uTime * speed) / RINGS);
  
        // Large pure-black central void (~0.45 of half-height) with 3-4 lush concentric waves visible across full frame
        float baseRadius = 0.44 + pow(ringProg, 1.10) * 1.18;
  
        // Subtle fluid angular swirl along each wave
        float theta = aAngle + sin(uTime * 0.28 + ringProg * 3.14159) * 0.04;
  
        // Smooth undulating organic ocean-ripple harmonics matching Asset 2 recording
        float phaseShift = ringProg * 5.6;
        float organicWave =
          0.040 * sin(theta * 6.0 + uTime * 0.72 - phaseShift) +
          0.026 * cos(theta * 8.0 - uTime * 0.56 + phaseShift * 1.15) +
          0.020 * sin(theta * 4.0 + uTime * 0.42 + phaseShift * 0.65) +
          0.012 * cos(theta * 11.0 - uTime * 0.88 - phaseShift * 0.85);
  
        float waveAmp = 0.76 + 0.78 * ringProg;
        float crestRadius = baseRadius + organicWave * waveAmp;
  
        // Rich volumetric wave cross-section:
        // Bright luminous orchid-violet ridge at aTailDist ~ 0 + wide shimmering royal-indigo/violet particle spray behind it
        float bandWidth = 0.24 + 0.16 * ringProg;
        float radialWaveMod = 1.0 + 0.18 * sin(theta * 6.0 - phaseShift + aSeed * 2.0);
        float tailSpread = aTailDist * bandWidth * radialWaveMod;
        float microJitter = (sin(aSeed * 437.5 + uTime * 2.4) * 0.012) * (0.25 + aTailDist);
        float r = crestRadius + tailSpread + microJitter;
  
        // Gently wide perspective ellipse filling widescreen frame cleanly
        vec2 pos = vec2(cos(theta) * r * 1.08, sin(theta) * r);
  
        // Interactive pointer parallax + localized fluid wave push
        pos += uTilt * (0.04 + 0.14 * ringProg);
        float aspect = uResolution.x / max(uResolution.y, 1.0);
        vec2 pointerWorld = vec2(uPointer.x * aspect, uPointer.y);
        vec2 toPtr = pos - pointerWorld;
        float ptrDist = length(toPtr);
        float ptrPush = exp(-ptrDist * ptrDist * 5.0) * 0.06;
        pos += normalize(toPtr + vec2(1e-5)) * ptrPush;
  
        gl_Position = vec4(pos.x / aspect, pos.y, 0.0, 1.0);
  
        // Ridge & volumetric spray intensity curves
        float crestProximity = exp(-aTailDist * 5.8);
        float sprayDensity = exp(-aTailDist * 1.55);
  
        // Shimmering starry micro-twinkle across the violet/indigo mist
        float twinkle = 0.72 + 0.28 * sin(uTime * 3.8 + aSeed * 62.8318);
  
        float dpr = clamp(uResolution.y / 780.0, 1.0, 2.0);
        gl_PointSize = (1.65 + aSize * 1.35 + crestProximity * 0.85) * dpr;
  
        // Vivid electric violet, royal indigo, cobalt-blue & glowing orchid crest palette (matching Asset 2 video)
        vec3 royalBlue    = vec3(0.18, 0.14, 0.86);
        vec3 deepIndigo   = vec3(0.38, 0.16, 0.96);
        vec3 vividViolet  = vec3(0.66, 0.24, 1.00);
        vec3 brightOrchid = vec3(0.84, 0.48, 1.00);
        vec3 whiteCrest   = vec3(0.95, 0.82, 1.00);
  
        // Mix deep royal blue & violet speckles throughout the wide spray band
        float blueVioletSplit = fract(aSeed * 7.31);
        vec3 tailCol = mix(royalBlue, deepIndigo, smoothstep(0.15, 0.65, blueVioletSplit));
        tailCol = mix(tailCol, vividViolet, clamp(sprayDensity * 0.82 + smoothstep(0.55, 0.98, blueVioletSplit) * 0.55, 0.0, 1.0));
  
        vec3 col = mix(tailCol, brightOrchid, pow(crestProximity, 1.25) * 0.95);
        col = mix(col, whiteCrest, pow(crestProximity, 3.4) * 0.72);
  
        // Smooth fade emerging out of the dark central void and fading past outer corners
        float innerFade = smoothstep(0.0, 0.14, ringProg);
        float outerFade = 1.0 - smoothstep(0.88, 1.0, ringProg);
  
        vColor = col;
        vAlpha = (0.34 + 0.62 * crestProximity + 0.32 * sprayDensity) * innerFade * outerFade * twinkle;
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
        float core = exp(-r2 * 1.75);
        gl_FragColor = vec4(vColor * core, vAlpha * core);
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
  
    // 135,000 luminous particles creating dense glowing violet crests + wide sparkling indigo/violet wakes
    const COUNT = 135000;
    const angles = new Float32Array(COUNT);
    const ringIndices = new Float32Array(COUNT);
    const tailDists = new Float32Array(COUNT);
    const seeds = new Float32Array(COUNT);
    const sizes = new Float32Array(COUNT);
  
    for (let i = 0; i < COUNT; i++) {
      angles[i] = Math.random() * Math.PI * 2;
      ringIndices[i] = i % 4;
      // 26% crisp bright ridge particles, 74% lush wide trailing indigo/violet volumetric particle wake
      const u = Math.random();
      if (u < 0.26) {
        tailDists[i] = Math.pow(Math.random(), 3.6) * 0.11;
      } else {
        tailDists[i] = Math.pow(Math.random(), 1.38) * 1.0;
      }
      seeds[i] = Math.random();
      sizes[i] = Math.random();
    }
  
    function bindAttr(name: any, data: any, size?: any) {
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    }
  
    bindAttr('aAngle', angles, 1);
    bindAttr('aRingIndex', ringIndices, 1);
    bindAttr('aTailDist', tailDists, 1);
    bindAttr('aSeed', seeds, 1);
    bindAttr('aSize', sizes, 1);
  
    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uResolution = gl.getUniformLocation(prog, 'uResolution');
    const uTilt = gl.getUniformLocation(prog, 'uTilt');
    const uPointer = gl.getUniformLocation(prog, 'uPointer');
  
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
    let ptrX = 9.0;
    let ptrY = 9.0;
  
    window.addEventListener('pointermove', (e: any) => {
      const nx = (e.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      const ny = 1 - (e.clientY / Math.max(window.innerHeight, 1)) * 2;
      targetTiltX = nx;
      targetTiltY = ny;
      ptrX = nx;
      ptrY = ny;
    });
  
    window.addEventListener('pointerleave', () => {
      targetTiltX = 0;
      targetTiltY = 0;
      ptrX = 9.0;
      ptrY = 9.0;
    });
  
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
  
    function render(now?: any) {
      const t = now * 0.001;
      tiltX += (targetTiltX - tiltX) * 0.055;
      tiltY += (targetTiltY - tiltY) * 0.055;
  
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform2f(uTilt, tiltX, tiltY);
      gl.uniform2f(uPointer, ptrX, ptrY);
  
      gl.drawArrays(gl.POINTS, 0, COUNT);
      requestAnimationFrame(render);
    }
  
    requestAnimationFrame(render);
  })();
}
/* eslint-enable */

export function Asset2({ className, style, width = '100%', height = '100%', blendMode = "normal", transparentBackground = false, edgeFeather = 0 }: Asset2Props) {
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

    initAsset2Runtime({
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
      className={className ? `fv-assets-asset-2 ${className}` : 'fv-assets-asset-2'}
      style={{ width, height, ...blendStyle, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="glCanvas"></canvas>
    </div>
  );
}

export default Asset2;
