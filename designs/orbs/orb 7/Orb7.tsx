'use client';

/**
 * Orb 07 — 3D Blue Fur Ribbon Sphere &amp; Yellow Honeycomb Core
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Orb7Props {
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
.fv-orbs-orb-7 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-orbs-orb-7 *, .fv-orbs-orb-7 *::before, .fv-orbs-orb-7 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-orbs-orb-7 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000000;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-orbs-orb-7 canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: grab;
  }

  .fv-orbs-orb-7 canvas:active {
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
function initOrb7Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl2', { antialias: true, alpha: false }) ||
               canvas.getContext('webgl', { antialias: true, alpha: false });
    if (!gl) return;
  
    // ---------------------------------------------------------------------------
    // Shaders: Pass 1 — Inner Yellow Honeycomb Core Sphere
    // ---------------------------------------------------------------------------
    const vsCore = `
      attribute vec3 aPos;
      attribute vec3 aNormal;
  
      uniform mat4 uProj;
      uniform mat4 uView;
      uniform mat3 uModelRot;
      uniform float uScale;
  
      varying vec3 vObjPos;
      varying vec3 vWorldNormal;
      varying vec3 vViewPos;
  
      void main() {
        vObjPos = aPos;
        vec3 worldPos = uModelRot * (aPos * uScale);
        vWorldNormal = normalize(uModelRot * aNormal);
        vec4 viewPos = uView * vec4(worldPos, 1.0);
        vViewPos = viewPos.xyz;
        gl_Position = uProj * viewPos;
      }
    `;
  
    const fsCore = `
      precision highp float;
  
      varying vec3 vObjPos;
      varying vec3 vWorldNormal;
      varying vec3 vViewPos;
  
      uniform float uTime;
  
      // Fast procedural hexagonal honeycomb grid on spherical coordinates
      float hexDist(vec2 p) {
        p = abs(p);
        float c = dot(p, normalize(vec2(1.0, 1.7320508)));
        return max(c, p.x);
      }
  
      vec4 hexCoords(vec2 uv) {
        vec2 r = vec2(1.0, 1.7320508);
        vec2 h = r * 0.5;
        vec2 a = mod(uv, r) - h;
        vec2 b = mod(uv - h, r) - h;
        vec2 gv = dot(a, a) < dot(b, b) ? a : b;
        float edge = 0.5 - hexDist(gv);
        vec2 id = uv - gv;
        return vec4(gv.x, gv.y, edge, fract(sin(dot(id, vec2(127.1, 311.7))) * 43758.5453));
      }
  
      // Helical ribbon mask matching the fur bands so core casts soft shadow under the bands
      float bandField(vec3 p) {
        float lat = asin(clamp(p.y, -1.0, 1.0));
        float lon = atan(p.z, p.x);
        float wave = sin(lat * 7.8 + lon * 1.0 + 0.35 * sin(lon * 2.0 + lat * 2.0));
        return wave;
      }
  
      void main() {
        vec3 p = normalize(vObjPos);
        vec3 n = normalize(vWorldNormal);
        vec3 v = normalize(-vViewPos);
  
        // Spherical UV for fine hexagonal mesh
        float lon = atan(p.z, p.x);
        float lat = asin(clamp(p.y, -1.0, 1.0));
        vec2 uv = vec2(lon * 11.5, lat * 11.5);
        vec4 hc = hexCoords(uv);
  
        // Raised cell center + crisp dark mesh groove
        float cellBorder = smoothstep(0.02, 0.14, hc.z);
        float cellDome = smoothstep(0.0, 0.42, hc.z);
        float cellVar = 0.90 + 0.14 * hc.w;
  
        // Studio lighting
        vec3 keyLight  = normalize(vec3(-0.35, 0.55, 0.78));
        vec3 fillLight = normalize(vec3(0.60, -0.25, 0.72));
        vec3 rimLight  = normalize(vec3(0.0, 0.2, -0.95));
  
        float diffKey  = max(0.0, dot(n, keyLight));
        float diffFill = max(0.0, dot(n, fillLight));
        float spec     = pow(max(0.0, dot(n, normalize(keyLight + v))), 26.0);
        float fresnel  = pow(1.0 - max(0.0, dot(n, v)), 2.5);
  
        // Ambient occlusion near the fur band borders
        float bf = bandField(p);
        float slitMask = smoothstep(-0.32, -0.66, bf); // 1 inside yellow slit, 0 under fur
        float creviceAO = mix(0.18, 1.0, smoothstep(-0.15, -0.58, bf));
  
        vec3 coreYellow = vec3(0.98, 0.89, 0.12);
        vec3 coreAmber  = vec3(0.45, 0.36, 0.03);
        vec3 coreGroove = vec3(0.16, 0.13, 0.01);
  
        vec3 cellCol = mix(coreGroove, coreYellow * cellVar, cellBorder);
        cellCol = mix(coreAmber, cellCol, 0.38 + 0.62 * diffKey + 0.22 * diffFill);
        cellCol += vec3(1.0, 0.98, 0.68) * spec * cellDome * 0.45;
        cellCol *= creviceAO;
  
        // Darken deeply underneath fur bands so no yellow bleeds through thick fur roots
        cellCol *= mix(0.06, 1.0, slitMask);
        cellCol *= (1.0 - 0.35 * fresnel);
  
        gl_FragColor = vec4(cellCol, 1.0);
      }
    `;
  
    // ---------------------------------------------------------------------------
    // Shaders: Pass 2 — 3D Curved Tapered Fur Strands
    // ---------------------------------------------------------------------------
    const vsFur = `
      attribute vec3 aRoot;
      attribute vec3 aFlow;
      attribute vec3 aSide;
      attribute vec4 aParam; // x: t (0..1), y: side (-1..1), z: length, w: seed
  
      uniform mat4 uProj;
      uniform mat4 uView;
      uniform mat3 uModelRot;
      uniform float uTime;
      uniform vec2 uHoverWind;
  
      varying float vT;
      varying float vSeed;
      varying vec3 vWorldNormal;
      varying vec3 vWorldTangent;
      varying vec3 vViewPos;
  
      void main() {
        float t = aParam.x;
        float side = aParam.y;
        float len = aParam.z;
        float seed = aParam.w;
  
        // Base spherical normal at root
        vec3 rootNorm = normalize(aRoot);
  
        // Gentle wind ripple along strand length
        float phase = seed * 6.28318 + aRoot.x * 5.0 + aRoot.y * 4.0 + aRoot.z * 5.0;
        float sway1 = sin(uTime * 2.2 + phase) * 0.032 * t * t;
        float sway2 = cos(uTime * 1.65 - phase * 0.7) * 0.022 * t * t;
  
        // Curve smoothly outward then tangentially along the helical ribbon flow
        float lift = (0.36 * t + 0.14 * t * t) * len;
        float sweep = (0.72 * t + 0.34 * t * t) * len;
  
        vec3 strandPos = aRoot
          + rootNorm * lift
          + aFlow * sweep
          + aSide * (sway1 + uHoverWind.x * 0.06 * t * t)
          + rootNorm * (sway2 + uHoverWind.y * 0.04 * t * t);
  
        // Taper ribbon width to a crisp needle tip
        float halfWidth = (0.0115 + 0.005 * fract(seed * 17.3)) * (1.0 - t * 0.92);
        vec3 posObj = strandPos + aSide * (side * halfWidth);
  
        vec3 worldPos = uModelRot * posObj;
        vWorldNormal = normalize(uModelRot * mix(rootNorm, aFlow, 0.25 * t));
        vWorldTangent = normalize(uModelRot * normalize(aFlow * 0.85 + rootNorm * (0.45 - 0.3 * t)));
  
        vec4 viewPos = uView * vec4(worldPos, 1.0);
        vViewPos = viewPos.xyz;
        vT = t;
        vSeed = seed;
  
        gl_Position = uProj * viewPos;
      }
    `;
  
    const fsFur = `
      precision highp float;
  
      varying float vT;
      varying float vSeed;
      varying vec3 vWorldNormal;
      varying vec3 vWorldTangent;
      varying vec3 vViewPos;
  
      void main() {
        vec3 n = normalize(vWorldNormal);
        vec3 tang = normalize(vWorldTangent);
        vec3 v = normalize(-vViewPos);
  
        vec3 keyLight  = normalize(vec3(-0.35, 0.58, 0.74));
        vec3 fillLight = normalize(vec3(0.62, -0.18, 0.76));
        vec3 rimLight  = normalize(vec3(0.05, 0.50, -0.86));
  
        // Diffuse macro sphere lighting
        float diffKey  = max(0.0, dot(n, keyLight));
        float diffFill = max(0.0, dot(n, fillLight));
  
        // Kajiya-Kay anisotropic hair highlight along strand tangent
        vec3 hKey = normalize(keyLight + v);
        float tdH = dot(tang, hKey);
        float sinTH = sqrt(max(0.001, 1.0 - tdH * tdH));
        float specHair = pow(sinTH, 18.0) * (0.35 + 0.65 * diffKey);
  
        float rim = pow(1.0 - max(0.0, dot(n, v)), 2.2);
  
        // Rich cobalt-blue fur palette with frost-white tipped guard hairs
        vec3 furDeep  = vec3(0.02, 0.11, 0.34);
        vec3 furRoyal = vec3(0.07, 0.36, 0.84);
        vec3 furCyan  = vec3(0.24, 0.60, 0.98);
        vec3 furTip   = vec3(0.90, 0.96, 1.00);
  
        // Root-to-tip ambient occlusion & color progression
        float rootAO = smoothstep(0.0, 0.42, vT);
        float shadeVar = fract(vSeed * 31.7);
        vec3 baseCol = mix(furDeep, furRoyal, rootAO * (0.65 + 0.35 * shadeVar));
        baseCol = mix(baseCol, furCyan, smoothstep(0.45, 0.95, vT) * (0.45 + 0.55 * diffKey));
  
        // Guard hairs with crisp silvery-white tips (matching the frosty streaks in Orb 7)
        float isFrostTip = step(0.66, fract(vSeed * 13.37));
        float frostAmount = isFrostTip * smoothstep(0.48, 0.96, vT);
        baseCol = mix(baseCol, furTip, frostAmount * 0.90);
  
        // Combine lighting
        float lightFactor = 0.28 + 0.78 * diffKey + 0.30 * diffFill;
        vec3 col = baseCol * lightFactor;
        col += mix(furCyan, furTip, 0.65) * specHair * 0.52 * smoothstep(0.15, 0.85, vT);
        col += vec3(0.28, 0.58, 1.0) * rim * 0.32 * vT;
  
        gl_FragColor = vec4(col, 1.0);
      }
    `;
  
    // ---------------------------------------------------------------------------
    // WebGL Helpers
    // ---------------------------------------------------------------------------
    function compile(type: any, src?: any) {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(sh));
      }
      return sh;
    }
  
    function link(vs: any, fs?: any) {
      const p = gl.createProgram();
      gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
      gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(p));
      }
      return p;
    }
  
    const coreProg = link(vsCore, fsCore);
    const furProg  = link(vsFur, fsFur);
  
    // ---------------------------------------------------------------------------
    // Geometry 1: High-res UV Sphere for Yellow Honeycomb Core
    // ---------------------------------------------------------------------------
    function buildSphere(latSegs: any, lonSegs?: any) {
      const pos: any[] = [];
      const norm: any[] = [];
      const idx: any[] = [];
  
      for (let y = 0; y <= latSegs; y++) {
        const v = y / latSegs;
        const theta = v * Math.PI;
        const sinT = Math.sin(theta);
        const cosT = Math.cos(theta);
        for (let x = 0; x <= lonSegs; x++) {
          const u = x / lonSegs;
          const phi = u * Math.PI * 2;
          const nx = sinT * Math.cos(phi);
          const ny = cosT;
          const nz = sinT * Math.sin(phi);
          pos.push(nx, ny, nz);
          norm.push(nx, ny, nz);
        }
      }
  
      for (let y = 0; y < latSegs; y++) {
        for (let x = 0; x < lonSegs; x++) {
          const a = y * (lonSegs + 1) + x;
          const b = a + lonSegs + 1;
          idx.push(a, b, a + 1);
          idx.push(b, b + 1, a + 1);
        }
      }
  
      return {
        pos: new Float32Array(pos),
        norm: new Float32Array(norm),
        idx: new Uint16Array(idx),
        count: idx.length
      };
    }
  
    const coreMesh = buildSphere(56, 84);
    const corePosBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, corePosBuf);
    gl.bufferData(gl.ARRAY_BUFFER, coreMesh.pos, gl.STATIC_DRAW);
  
    const coreNormBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, coreNormBuf);
    gl.bufferData(gl.ARRAY_BUFFER, coreMesh.norm, gl.STATIC_DRAW);
  
    const coreIdxBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, coreIdxBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, coreMesh.idx, gl.STATIC_DRAW);
  
    // ---------------------------------------------------------------------------
    // Geometry 2: Helical Blue Fur Ribbons (13,500 3D curved strands)
    // ---------------------------------------------------------------------------
    function bandFieldJS(x: any, y: any, z?: any) {
      const lat = Math.asin(Math.max(-1, Math.min(1, y)));
      const lon = Math.atan2(z, x);
      return Math.sin(lat * 7.8 + lon * 1.0 + 0.35 * Math.sin(lon * 2.0 + lat * 2.0));
    }
  
    function buildFurGeometry() {
      const TARGET_STRANDS = 13500;
      const VERTS_PER_STRAND = 15; // 2 quads (12 verts) + 1 tip triangle (3 verts)
      const STRIDE = 13; // root(3) + flow(3) + side(3) + param(4)
      const data = new Float32Array(TARGET_STRANDS * VERTS_PER_STRAND * STRIDE);
  
      // Deterministic pseudo-random generator
      let rng = 918273;
      const rand = () => {
        rng = (rng * 1664525 + 1013904223) >>> 0;
        return rng / 4294967296;
      };
  
      const coreRadius = 0.855;
      let placed = 0;
      let offset = 0;
      let attempts = 0;
  
      while (placed < TARGET_STRANDS && attempts < TARGET_STRANDS * 8) {
        attempts++;
        // Uniform random point on sphere
        const u = rand() * 2 - 1;
        const phi = rand() * Math.PI * 2;
        const s = Math.sqrt(Math.max(0, 1 - u * u));
        const nx = s * Math.cos(phi);
        const ny = u;
        const nz = s * Math.sin(phi);
  
        const bf = bandFieldJS(nx, ny, nz);
        // Leave clean helical slits open so the yellow honeycomb core gleams through
        if (bf < -0.28) continue;
  
        // Feather density slightly near band edges
        const edgeWeight = Math.min(1, (bf + 0.28) / 0.35);
        if (rand() > 0.35 + 0.65 * edgeWeight) continue;
  
        const rx = nx * coreRadius;
        const ry = ny * coreRadius;
        const rz = nz * coreRadius;
  
        // Tangential flow direction wrapping around the helical bands
        let tx = -nz;
        let ty = 0.16 * Math.cos(phi * 2.0) + 0.12;
        let tz = nx;
  
        // Project tangent orthogonal to sphere normal
        const dotTN = tx * nx + ty * ny + tz * nz;
        tx -= dotTN * nx;
        ty -= dotTN * ny;
        tz -= dotTN * nz;
        let tLen = Math.hypot(tx, ty, tz) || 1;
        tx /= tLen; ty /= tLen; tz /= tLen;
  
        // Bitangent (side vector)
        let bx = ny * tz - nz * ty;
        let by = nz * tx - nx * tz;
        let bz = nx * ty - ny * tx;
        let bLen = Math.hypot(bx, by, bz) || 1;
        bx /= bLen; by /= bLen; bz /= bLen;
  
        // Add organic clumping & directional ruffle
        const clumpAng = (rand() - 0.5) * 0.75 + 0.28 * Math.sin(ny * 14.0 + phi * 5.0);
        const ca = Math.cos(clumpAng);
        const sa = Math.sin(clumpAng);
        const fx = tx * ca + bx * sa;
        const fy = ty * ca + by * sa;
        const fz = tz * ca + bz * sa;
  
        const sx = -tx * sa + bx * ca;
        const sy = -ty * sa + by * ca;
        const sz = -tz * sa + bz * ca;
  
        const strandLen = (0.145 + 0.115 * rand()) * (0.72 + 0.28 * edgeWeight);
        const seed = rand();
  
        const pushVert = (tVal: any, sideVal: any) => {
          data[offset++] = rx;
          data[offset++] = ry;
          data[offset++] = rz;
          data[offset++] = fx;
          data[offset++] = fy;
          data[offset++] = fz;
          data[offset++] = sx;
          data[offset++] = sy;
          data[offset++] = sz;
          data[offset++] = tVal;
          data[offset++] = sideVal;
          data[offset++] = strandLen;
          data[offset++] = seed;
        };
  
        // Segment 0: t = 0.0 -> 0.36
        pushVert(0.00, -1); pushVert(0.00,  1); pushVert(0.36, -1);
        pushVert(0.36, -1); pushVert(0.00,  1); pushVert(0.36,  1);
        // Segment 1: t = 0.36 -> 0.72
        pushVert(0.36, -1); pushVert(0.36,  1); pushVert(0.72, -1);
        pushVert(0.72, -1); pushVert(0.36,  1); pushVert(0.72,  1);
        // Segment 2: tapered tip t = 0.72 -> 1.0
        pushVert(0.72, -1); pushVert(0.72,  1); pushVert(1.00,  0);
  
        placed++;
      }
  
      return {
        data: data.subarray(0, placed * VERTS_PER_STRAND * STRIDE),
        vertCount: placed * VERTS_PER_STRAND,
        strideBytes: STRIDE * 4
      };
    }
  
    const furGeo = buildFurGeometry();
    const furBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, furBuf);
    gl.bufferData(gl.ARRAY_BUFFER, furGeo.data, gl.STATIC_DRAW);
  
    // ---------------------------------------------------------------------------
    // Matrix Math
    // ---------------------------------------------------------------------------
    function perspective(fovRad: any, aspect: any, near: any, far?: any) {
      const f = 1.0 / Math.tan(fovRad * 0.5);
      const nf = 1 / (near - far);
      return new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) * nf, -1,
        0, 0, 2 * far * near * nf, 0
      ]);
    }
  
    function rotationMat3(rx: any, ry: any, rz?: any) {
      const cx = Math.cos(rx), sx = Math.sin(rx);
      const cy = Math.cos(ry), sy = Math.sin(ry);
      const cz = Math.cos(rz), sz = Math.sin(rz);
  
      // Rz * Rx * Ry
      const m00 = cz * cy - sz * sx * sy;
      const m01 = -sz * cx;
      const m02 = cz * sy + sz * sx * cy;
  
      const m10 = sz * cy + cz * sx * sy;
      const m11 = cz * cx;
      const m12 = sz * sy - cz * sx * cy;
  
      const m20 = -cx * sy;
      const m21 = sx;
      const m22 = cx * cy;
  
      return new Float32Array([
        m00, m10, m20,
        m01, m11, m21,
        m02, m12, m22
      ]);
    }
  
    const viewMat = new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, -3.15, 1
    ]);
  
    // ---------------------------------------------------------------------------
    // Interaction (Drag to Orbit + Hover Breeze)
    // ---------------------------------------------------------------------------
    let isDragging = false;
    let lastX = 0, lastY = 0;
    let rotX = 0.20, rotY = 0.0;
    let velX = 0, velY = 0;
    let hoverTargetX = 0, hoverTargetY = 0;
    let hoverX = 0, hoverY = 0;
  
    canvas.addEventListener('pointerdown', (e: any) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    });
  
    window.addEventListener('pointermove', (e: any) => {
      const nx = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      const ny = -((e.clientY / Math.max(1, window.innerHeight)) * 2 - 1);
      hoverTargetX = nx;
      hoverTargetY = ny;
  
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      velY = dx * 0.008;
      velX = dy * 0.008;
      rotY += velY;
      rotX += velX;
    });
  
    window.addEventListener('pointerup', () => {
      isDragging = false;
    });
  
    // ---------------------------------------------------------------------------
    // Resize & Render Loop
    // ---------------------------------------------------------------------------
    let projMat = perspective(Math.PI / 4.2, 1, 0.1, 20);
  
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(window.innerWidth * dpr));
      const h = Math.max(1, Math.floor(window.innerHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      projMat = perspective(Math.PI / 4.2, w / h, 0.1, 20);
    }
  
    window.addEventListener('resize', resize);
    resize();
  
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
  
    // Attribute & Uniform locations
    const cLoc = {
      aPos: gl.getAttribLocation(coreProg, 'aPos'),
      aNormal: gl.getAttribLocation(coreProg, 'aNormal'),
      uProj: gl.getUniformLocation(coreProg, 'uProj'),
      uView: gl.getUniformLocation(coreProg, 'uView'),
      uModelRot: gl.getUniformLocation(coreProg, 'uModelRot'),
      uScale: gl.getUniformLocation(coreProg, 'uScale'),
      uTime: gl.getUniformLocation(coreProg, 'uTime')
    };
  
    const fLoc = {
      aRoot: gl.getAttribLocation(furProg, 'aRoot'),
      aFlow: gl.getAttribLocation(furProg, 'aFlow'),
      aSide: gl.getAttribLocation(furProg, 'aSide'),
      aParam: gl.getAttribLocation(furProg, 'aParam'),
      uProj: gl.getUniformLocation(furProg, 'uProj'),
      uView: gl.getUniformLocation(furProg, 'uView'),
      uModelRot: gl.getUniformLocation(furProg, 'uModelRot'),
      uTime: gl.getUniformLocation(furProg, 'uTime'),
      uHoverWind: gl.getUniformLocation(furProg, 'uHoverWind')
    };
  
    let startTime = performance.now();
  
    function frame(now?: any) {
      const t = (now - startTime) * 0.001;
  
      if (!isDragging) {
        rotY += 0.0065 + velY;
        rotX += velX;
        velX *= 0.92;
        velY *= 0.92;
        rotX += (0.20 - rotX) * 0.015;
      }
  
      hoverX += (hoverTargetX - hoverX) * 0.06;
      hoverY += (hoverTargetY - hoverY) * 0.06;
  
      const modelRot = rotationMat3(rotX, rotY, -0.22);
  
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
      // 1. Draw Inner Yellow Honeycomb Core
      gl.useProgram(coreProg);
      gl.uniformMatrix4fv(cLoc.uProj, false, projMat);
      gl.uniformMatrix4fv(cLoc.uView, false, viewMat);
      gl.uniformMatrix3fv(cLoc.uModelRot, false, modelRot);
      gl.uniform1f(cLoc.uScale, 0.855);
      gl.uniform1f(cLoc.uTime, t);
  
      gl.bindBuffer(gl.ARRAY_BUFFER, corePosBuf);
      gl.enableVertexAttribArray(cLoc.aPos);
      gl.vertexAttribPointer(cLoc.aPos, 3, gl.FLOAT, false, 0, 0);
  
      gl.bindBuffer(gl.ARRAY_BUFFER, coreNormBuf);
      gl.enableVertexAttribArray(cLoc.aNormal);
      gl.vertexAttribPointer(cLoc.aNormal, 3, gl.FLOAT, false, 0, 0);
  
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, coreIdxBuf);
      gl.drawElements(gl.TRIANGLES, coreMesh.count, gl.UNSIGNED_SHORT, 0);
  
      gl.disableVertexAttribArray(cLoc.aPos);
      gl.disableVertexAttribArray(cLoc.aNormal);
  
      // 2. Draw 3D Blue Fur Strands
      gl.useProgram(furProg);
      gl.uniformMatrix4fv(fLoc.uProj, false, projMat);
      gl.uniformMatrix4fv(fLoc.uView, false, viewMat);
      gl.uniformMatrix3fv(fLoc.uModelRot, false, modelRot);
      gl.uniform1f(fLoc.uTime, t);
      gl.uniform2f(fLoc.uHoverWind, hoverX, hoverY);
  
      gl.bindBuffer(gl.ARRAY_BUFFER, furBuf);
      gl.enableVertexAttribArray(fLoc.aRoot);
      gl.vertexAttribPointer(fLoc.aRoot, 3, gl.FLOAT, false, furGeo.strideBytes, 0);
      gl.enableVertexAttribArray(fLoc.aFlow);
      gl.vertexAttribPointer(fLoc.aFlow, 3, gl.FLOAT, false, furGeo.strideBytes, 12);
      gl.enableVertexAttribArray(fLoc.aSide);
      gl.vertexAttribPointer(fLoc.aSide, 3, gl.FLOAT, false, furGeo.strideBytes, 24);
      gl.enableVertexAttribArray(fLoc.aParam);
      gl.vertexAttribPointer(fLoc.aParam, 4, gl.FLOAT, false, furGeo.strideBytes, 36);
  
      gl.drawArrays(gl.TRIANGLES, 0, furGeo.vertCount);
  
      gl.disableVertexAttribArray(fLoc.aRoot);
      gl.disableVertexAttribArray(fLoc.aFlow);
      gl.disableVertexAttribArray(fLoc.aSide);
      gl.disableVertexAttribArray(fLoc.aParam);
  
      requestAnimationFrame(frame);
    }
  
    requestAnimationFrame(frame);
  })();
}
/* eslint-enable */

export function Orb7({ className, style, width = '100%', height = '100%', blendMode = "normal", transparentBackground = false, edgeFeather = 0 }: Orb7Props) {
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

    initOrb7Runtime({
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
      className={className ? `fv-orbs-orb-7 ${className}` : 'fv-orbs-orb-7'}
      style={{ width, height, ...blendStyle, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="glCanvas"></canvas>
    </div>
  );
}

export default Orb7;
