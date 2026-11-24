'use client';

/**
 * Asset 01 — Interactive 3D Plush Fur Pinterest Icon
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Asset1Props {
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
.fv-assets-asset-1 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-assets-asset-1 *, .fv-assets-asset-1 *::before, .fv-assets-asset-1 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-assets-asset-1 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #080808;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-assets-asset-1 canvas {
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
function initAsset1Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl2', { antialias: true, alpha: false }) ||
               canvas.getContext('webgl', { antialias: true, alpha: false });
    if (!gl) return;
  
    // 1. High-Resolution Pinterest Circular Badge Texture (1024x1024)
    // Warm cream-white plush squircle cushion with a large crimson circle + white Pinterest 'P' cutout
    const logoCanvas = document.createElement('canvas');
    logoCanvas.width = 1024;
    logoCanvas.height = 1024;
    const lctx = logoCanvas.getContext('2d');
  
    // Warm plush cream-white fur base matching Asset 1 recording
    lctx.fillStyle = '#fbf6ee';
    lctx.fillRect(0, 0, 1024, 1024);
  
    // Official Pinterest circle badge path (24x24 viewBox: full crimson circle with white 'P' cutout)
    const pinterestBadgePath = new Path2D(
      'M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z'
    );
  
    lctx.save();
    lctx.translate(512, 512);
    const badgeDiameter = 738;
    const pScale = badgeDiameter / 24;
    lctx.scale(pScale, pScale);
    lctx.translate(-12, -12);
  
    // Subtle soft dye halo at fur roots
    lctx.save();
    lctx.filter = 'blur(0.28px)';
    lctx.fillStyle = '#cf1220';
    lctx.fill(pinterestBadgePath);
    lctx.restore();
  
    // Rich crimson Pinterest red fur pigment
    lctx.fillStyle = '#df1422';
    lctx.fill(pinterestBadgePath);
    lctx.restore();
  
    const logoTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, logoTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, logoCanvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  
    // 2. Interactive 2D Spring-Damper Fur Parting & Combing Field (128x128)
    const FIELD_RES = 128;
    const combX = new Float32Array(FIELD_RES * FIELD_RES);
    const combY = new Float32Array(FIELD_RES * FIELD_RES);
    const combVelX = new Float32Array(FIELD_RES * FIELD_RES);
    const combVelY = new Float32Array(FIELD_RES * FIELD_RES);
    const partDepth = new Float32Array(FIELD_RES * FIELD_RES);
    const combPixels = new Uint8Array(FIELD_RES * FIELD_RES * 4);
  
    const combTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, combTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, FIELD_RES, FIELD_RES, 0, gl.RGBA, gl.UNSIGNED_BYTE, combPixels);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  
    const vsSource = `
      attribute vec2 aPos;
      varying vec2 vUv;
      void main() {
        vUv = aPos;
        gl_Position = vec4(aPos, 0.0, 1.0);
      }
    `;
  
    // 34-Shell Volumetric Directional Silky Plush Fur Raymarcher
    // Renders long silky cream-white & crimson-red fur fibers with radial edge fluff,
    // soft top-down studio cushion lighting, and responsive cursor fur-parting physics
    const fsSource = `
      precision highp float;
      varying vec2 vUv;
  
      uniform vec2 uResolution;
      uniform float uTime;
      uniform sampler2D uLogoTex;
      uniform sampler2D uCombTex;
  
      vec3 hash23(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
        p3 += dot(p3, p3.yxz + 33.33);
        return fract((p3.xxy + p3.yzz) * p3.zyx);
      }
  
      float hash21(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * 0.1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
      }
  
      float valueNoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash21(i);
        float b = hash21(i + vec2(1.0, 0.0));
        float c = hash21(i + vec2(0.0, 1.0));
        float d = hash21(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }
  
      // Rounded Squircle Signed Distance Function
      float sdRoundSquare(vec2 p, float b, float r) {
        vec2 q = abs(p) - vec2(b - r);
        return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
      }
  
      // Evaluate silky multi-scale tapered plush hair fibers at shell height h in [0, 1]
      float sampleSilkyFur(vec2 pos, vec2 flowDir, float h, out float strandTone, out float clumpVar) {
        float dirLen = length(flowDir);
        vec2 dir = dirLen > 0.0001 ? flowDir / dirLen : vec2(0.0, 1.0);
        vec2 perp = vec2(-dir.y, dir.x);
  
        // Anisotropic strand-aligned coordinates so tufts form silky locks rather than sand noise
        vec2 localCoord = vec2(dot(pos, perp), dot(pos, dir));
  
        // Gentle organic clump curl
        float clumpNoise = valueNoise(pos * 18.0 + vec2(3.1, 7.4));
        clumpVar = clumpNoise;
        float curlOffset = (clumpNoise - 0.5) * 0.022 * h;
        vec2 fiberUv = pos + perp * curlOffset;
  
        float accum = 0.0;
        strandTone = 0.5;
  
        // Layer 0: Dense plush primary hair coat (soft silky locks)
        {
          vec2 g = fiberUv * 175.0;
          vec2 cell = floor(g);
          vec2 f = fract(g) - 0.5;
          vec3 rnd = hash23(cell);
          vec2 jitter = (rnd.xy - 0.5) * 0.62;
          float maxLen = 0.45 + 0.55 * rnd.z * (0.82 + 0.36 * clumpNoise);
          if (h < maxLen) {
            vec2 delta = f - jitter;
            // Slightly elliptical cross-section along flow for silky continuity across shells
            float dist = length(vec2(delta.x, delta.y));
            float taper = 1.0 - pow(h / maxLen, 1.15) * 0.84;
            float radius = 0.56 * taper;
            float hit = 1.0 - smoothstep(radius * 0.18, radius, dist);
            if (hit > accum) {
              accum = hit;
              strandTone = rnd.x;
            }
          }
        }
  
        // Layer 1: Fine outer wispy guard hairs (gives bright plush halo & soft silky sheen)
        {
          vec2 g2 = (fiberUv + vec2(0.137, 0.291)) * 285.0;
          vec2 cell2 = floor(g2);
          vec2 f2 = fract(g2) - 0.5;
          vec3 rnd2 = hash23(cell2 + 41.7);
          vec2 jitter2 = (rnd2.xy - 0.5) * 0.58;
          float maxLen2 = 0.38 + 0.62 * rnd2.z;
          if (h < maxLen2) {
            float dist2 = length(f2 - jitter2);
            float taper2 = 1.0 - pow(h / maxLen2, 1.05) * 0.88;
            float radius2 = 0.50 * taper2;
            float hit2 = (1.0 - smoothstep(radius2 * 0.15, radius2, dist2)) * 0.88;
            if (hit2 > accum) {
              accum = hit2;
              strandTone = mix(strandTone, rnd2.y, 0.72);
            }
          }
        }
  
        // Subtle elongated strand micro-modulation to smooth stepping between shells
        float silkyStreak = valueNoise(vec2(localCoord.x * 260.0, localCoord.y * 55.0));
        accum *= (0.78 + 0.36 * silkyStreak);
  
        return clamp(accum, 0.0, 1.0);
      }
  
      void main() {
        vec2 uv = vUv;
        float aspect = uResolution.x / max(uResolution.y, 1.0);
        uv.x *= aspect;
  
        // Dark studio charcoal radial backdrop matching Asset 1 video
        float bgRad = length(uv);
        vec3 bgCol = mix(vec3(0.135, 0.135, 0.135), vec3(0.018, 0.018, 0.018), smoothstep(0.0, 1.38, bgRad));
  
        // Cushion geometry (slightly plump iconic app-icon squircle centered cleanly)
        float cushionHalf = 0.59;
        float cornerR = 0.195;
  
        // Soft ambient drop shadow behind & below the plush squircle
        float shadowDist = sdRoundSquare(uv - vec2(0.0, -0.045), cushionHalf + 0.01, cornerR);
        float dropShadow = 1.0 - exp(-max(0.0, shadowDist) * 7.2);
        bgCol *= mix(0.18, 1.0, dropShadow);
  
        float d2d = sdRoundSquare(uv, cushionHalf, cornerR);
  
        // Fluffy outer protruding hair fringe around silhouette
        float maxFurOut = 0.072;
        if (d2d > maxFurOut) {
          gl_FragColor = vec4(bgCol, 1.0);
          return;
        }
  
        // Plump 3D rounded cushion dome height & surface normal
        float insideDist = clamp(-d2d / 0.25, 0.0, 1.0);
        float domeZ = sqrt(max(0.002, insideDist * (2.0 - insideDist)));
  
        vec2 eps = vec2(0.0025, 0.0);
        vec2 grad2D = normalize(vec2(
          sdRoundSquare(uv + eps.xy, cushionHalf, cornerR) - sdRoundSquare(uv - eps.xy, cushionHalf, cornerR),
          sdRoundSquare(uv + eps.yx, cushionHalf, cornerR) - sdRoundSquare(uv - eps.yx, cushionHalf, cornerR)
        ) + vec2(1e-6));
  
        float edgeSlope = 1.0 - insideDist;
        vec3 surfNormal = normalize(vec3(grad2D * edgeSlope * 0.94, domeZ));
  
        // Texture coordinates in [0, 1]^2
        vec2 texUv = clamp((uv / (cushionHalf * 2.0)) + 0.5, 0.0, 1.0);
  
        // Sample interactive cursor combing & radial parting field
        vec4 combSample = texture2D(uCombTex, vec2(texUv.x, 1.0 - texUv.y));
        vec2 userComb = (combSample.rg - 0.5) * 2.0;
        float userPart = combSample.b;
  
        // Organic silky groom pattern:
        // Smooth outward radial brush + soft cowlick wave + gentle breathing wind
        float angleField = valueNoise(uv * 3.4 + vec2(1.7, 2.3)) * 6.28318;
        vec2 organicFlow = vec2(cos(angleField), sin(angleField)) * 0.28;
        vec2 radialOut = uv * 0.72 + grad2D * pow(edgeSlope, 1.15) * 1.05;
        vec2 gentleBreath = vec2(
          sin(uv.y * 5.2 + uTime * 0.9),
          cos(uv.x * 5.2 + uTime * 0.75)
        ) * 0.024;
        vec2 baseFlow = radialOut + organicFlow + gentleBreath;
  
        // Studio lighting matching Asset 1 video: bright warm overhead softbox + clean fill
        vec3 keyLight  = normalize(vec3(0.04, 0.54, 0.84));
        vec3 fillLight = normalize(vec3(-0.38, 0.15, 0.91));
        vec3 topRim    = normalize(vec3(0.0, 0.92, 0.38));
  
        const int SHELLS = 32;
        vec3 accumCol = vec3(0.0);
        float transmittance = 1.0;
  
        for (int i = 0; i < SHELLS; i++) {
          float h = 1.0 - (float(i) / float(SHELLS - 1));
  
          // Fluffy outer edge halo expands smoothly with shell height h
          float edgeFluff = h * maxFurOut * (1.0 - userPart * 0.42);
          float shellD = d2d - edgeFluff * (0.18 + 0.82 * edgeSlope);
          if (shellD > 0.0) continue;
  
          // Curved hair strand displacement from root to tip
          float bend = pow(h, 1.38);
          vec2 strandOffset = baseFlow * 0.072 * bend + userComb * 0.115 * bend;
  
          vec2 rootPos = uv - strandOffset;
          vec2 rootUv = clamp((rootPos / (cushionHalf * 2.0)) + 0.5, 0.0, 1.0);
  
          float strandTone;
          float clumpVar;
          float density = sampleSilkyFur(rootPos, baseFlow + userComb * 1.4, h, strandTone, clumpVar);
  
          // Parting opening right where the cursor splits the fur down toward roots
          float partThin = 1.0 - userPart * pow(h, 0.75) * 0.68;
          density *= clamp(partThin, 0.08, 1.0);
  
          // Solid warm plush undercoat at skin base so no black holes appear inside cushion
          if (i == SHELLS - 1 && d2d <= 0.002) {
            density = 1.0;
          }
  
          if (density > 0.015) {
            vec3 dyeCol = texture2D(uLogoTex, vec2(rootUv.x, 1.0 - rootUv.y)).rgb;
  
            // Identify red vs cream fur for tailored rich subsurface tinting
            float isRed = clamp((dyeCol.r - dyeCol.g) * 2.2, 0.0, 1.0);
  
            // Richer warmer cream highlights & luminous crimson fur tone variation
            vec3 creamBase = vec3(0.99, 0.965, 0.92);
            vec3 redBase   = vec3(0.89, 0.085, 0.135);
            vec3 baseAlbedo = mix(creamBase, redBase, isRed);
            baseAlbedo *= (0.90 + 0.20 * strandTone) * (0.93 + 0.14 * clumpVar);
  
            // Kajiya-Kay anisotropic silky hair tangent sheen
            vec3 hairTangent = normalize(vec3(strandOffset * 14.0 + baseFlow * 0.25, 0.52) + surfNormal * 0.55);
            float TdotL = clamp(dot(hairTangent, keyLight), -1.0, 1.0);
            float sinTL = sqrt(max(0.0, 1.0 - TdotL * TdotL));
            float furSheen = pow(sinTL, 10.0) * pow(h, 1.25) * 0.26;
  
            // Soft plush 3D pillow illumination (bright top & center, soft warm bevel shadow at bottom)
            float nDotKey = clamp(dot(surfNormal, keyLight), 0.0, 1.0);
            float wrapDiff = clamp((dot(surfNormal, keyLight) + 0.55) / 1.55, 0.0, 1.0);
            float fillDiff = clamp(dot(surfNormal, fillLight), 0.0, 1.0) * 0.22;
  
            // Soft underside cushion shadow matching the video's bottom edge falloff
            float bottomPillowShade = mix(0.46, 1.04, smoothstep(-0.64, -0.08, uv.y));
            float lighting = (0.30 + 0.78 * wrapDiff + fillDiff) * bottomPillowShade;
  
            // Root-to-tip ambient occlusion: warm deep roots -> luminous bright silky tips
            float rootAO = mix(0.26, 1.12, pow(h, 0.68));
            // Deepen parting groove shadow slightly where cursor pushes fur open
            rootAO *= (1.0 - userPart * (1.0 - h) * 0.52);
  
            // Warm shadow tint in fur roots (warm taupe for cream fur, deep velvet burgundy for red)
            vec3 shadowTint = mix(vec3(0.76, 0.71, 0.64), vec3(0.56, 0.04, 0.07), isRed);
            vec3 litAlbedo = mix(shadowTint, baseAlbedo, clamp(rootAO, 0.0, 1.0));
  
            // Grazing velvet rim glow on protruding fluffy top & side edges
            float topGlow = clamp(dot(surfNormal, topRim), 0.0, 1.0);
            float velvetRim = pow(1.0 - domeZ, 1.6) * (0.35 + 0.65 * topGlow) * pow(h, 1.1) * 0.28;
  
            vec3 layerCol = litAlbedo * lighting * (0.42 + 0.66 * rootAO);
            vec3 sheenCol = mix(vec3(1.0, 0.985, 0.95), vec3(1.0, 0.42, 0.42), isRed);
            layerCol += sheenCol * (furSheen + velvetRim);
  
            // Smooth front-to-back shell compositing
            float stepAlpha = clamp(density * (0.28 + 0.36 * (1.0 - h)), 0.0, 1.0);
            if (i == SHELLS - 1 && d2d <= 0.002) stepAlpha = 1.0;
  
            accumCol += transmittance * stepAlpha * layerCol;
            transmittance *= (1.0 - stepAlpha);
            if (transmittance < 0.006) break;
          }
        }
  
        vec3 finalCol = accumCol + bgCol * transmittance;
        // Gentle filmic highlight rolloff so white fur stays creamy & luminous without harsh clipping
        finalCol = finalCol / (1.0 + max(vec3(0.0), finalCol - 0.88) * 0.42);
        gl_FragColor = vec4(clamp(finalCol, 0.0, 1.0), 1.0);
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
    const uLogoTex = gl.getUniformLocation(prog, 'uLogoTex');
    const uCombTex = gl.getUniformLocation(prog, 'uCombTex');
  
    gl.uniform1i(uLogoTex, 0);
    gl.uniform1i(uCombTex, 1);
  
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();
  
    let pointerUV = { x: -10, y: -10 };
    let prevPointerUV = { x: -10, y: -10 };
    let pointerActive = false;
  
    function clampVal(x: any, a: any, b?: any) {
      return Math.max(a, Math.min(b, x));
    }
  
    function applyFurBrush(u: any, v: any, vx: any, vy?: any) {
      const radius = 0.145;
      const minX = Math.max(0, Math.floor((u - radius) * FIELD_RES));
      const maxX = Math.min(FIELD_RES - 1, Math.ceil((u + radius) * FIELD_RES));
      const minY = Math.max(0, Math.floor((v - radius) * FIELD_RES));
      const maxY = Math.min(FIELD_RES - 1, Math.ceil((v + radius) * FIELD_RES));
  
      for (let gy = minY; gy <= maxY; gy++) {
        const cy = gy / (FIELD_RES - 1);
        for (let gx = minX; gx <= maxX; gx++) {
          const cx = gx / (FIELD_RES - 1);
          const dx = cx - u;
          const dy = -(cy - v);
          const dist = Math.hypot(dx, dy);
          if (dist < radius) {
            const normD = dist / radius;
            const falloff = Math.pow(1.0 - normD, 1.8);
            const idx = gy * FIELD_RES + gx;
            const invD = dist > 0.002 ? 1.0 / dist : 0.0;
            // Radial parting away from pointer + directional combing along sweep velocity
            const partX = dx * invD * 0.95;
            const partY = dy * invD * 0.95;
            combVelX[idx] += (partX * 0.65 + vx * 0.62) * falloff * 0.42;
            combVelY[idx] += (partY * 0.65 + vy * 0.62) * falloff * 0.42;
            partDepth[idx] = Math.min(1.0, partDepth[idx] + Math.pow(1.0 - normD, 2.2) * 0.55);
          }
        }
      }
    }
  
    window.addEventListener('pointermove', (e: any) => {
      const vw = Math.max(window.innerWidth, 1);
      const vh = Math.max(window.innerHeight, 1);
      const aspect = vw / vh;
      const ndcX = ((e.clientX / vw) * 2 - 1) * aspect;
      const ndcY = 1 - (e.clientY / vh) * 2;
  
      const cushionHalf = 0.59;
      const u = (ndcX / (cushionHalf * 2.0)) + 0.5;
      const v = 1.0 - ((ndcY / (cushionHalf * 2.0)) + 0.5);
  
      if (!pointerActive) {
        prevPointerUV.x = u;
        prevPointerUV.y = v;
        pointerActive = true;
      } else {
        prevPointerUV.x = pointerUV.x;
        prevPointerUV.y = pointerUV.y;
      }
      pointerUV.x = u;
      pointerUV.y = v;
  
      const vx = clampVal((u - prevPointerUV.x) * 16.0, -1.4, 1.4);
      const vy = clampVal(-(v - prevPointerUV.y) * 16.0, -1.4, 1.4);
      applyFurBrush(u, v, vx, vy);
    });
  
    window.addEventListener('pointerleave', () => {
      pointerActive = false;
    });
  
    function stepFurPhysics() {
      for (let i = 0; i < FIELD_RES * FIELD_RES; i++) {
        combVelX[i] = (combVelX[i] - combX[i] * 0.028) * 0.89;
        combVelY[i] = (combVelY[i] - combY[i] * 0.028) * 0.89;
        combX[i] = clampVal(combX[i] + combVelX[i], -1.0, 1.0);
        combY[i] = clampVal(combY[i] + combVelY[i], -1.0, 1.0);
        partDepth[i] *= 0.945;
  
        const mag = Math.min(1.0, Math.max(partDepth[i], Math.hypot(combX[i], combY[i]) * 0.95));
        const pIdx = i * 4;
        combPixels[pIdx]     = Math.round((combX[i] * 0.5 + 0.5) * 255);
        combPixels[pIdx + 1] = Math.round((combY[i] * 0.5 + 0.5) * 255);
        combPixels[pIdx + 2] = Math.round(mag * 255);
        combPixels[pIdx + 3] = 255;
      }
  
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, combTex);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, FIELD_RES, FIELD_RES, gl.RGBA, gl.UNSIGNED_BYTE, combPixels);
    }
  
    function render(now?: any) {
      const t = now * 0.001;
      stepFurPhysics();
  
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, logoTex);
  
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
  
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestAnimationFrame(render);
    }
  
    requestAnimationFrame(render);
  })();
}
/* eslint-enable */

export function Asset1({ className, style, width = '100%', height = '100%' }: Asset1Props) {
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

    initAsset1Runtime({
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
      className={className ? `fv-assets-asset-1 ${className}` : 'fv-assets-asset-1'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="glCanvas"></canvas>
    </div>
  );
}

export default Asset1;
