'use client';

/**
 * Orb 06 — 3D Tactile Fibonacci Beaded Sphere &amp; Breaching Sub-Spheres
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

export interface Orb6Props {
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
.fv-orbs-orb-6 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fv-orbs-orb-6 *, .fv-orbs-orb-6 *::before, .fv-orbs-orb-6 *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .fv-orbs-orb-6 {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #f4f4f4;
    user-select: none;
    -webkit-font-smoothing: antialiased;
  }

  .fv-orbs-orb-6 canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: grab;
  }

  .fv-orbs-orb-6 canvas:active {
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
function initOrb6Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame } = __fvRuntime as any;
  (() => {
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl2', { antialias: true, alpha: false }) ||
               canvas.getContext('webgl', { antialias: true, alpha: false });
    if (!gl) return;
  
    // We render true 3D Z-buffered sphere geometry for:
    // 1) 2,150 tightly packed Fibonacci-spiral matte slate-grey beads (#62666c)
    // 2) The dark interior occlusion core sphere (#202226)
    // 3) 4 medium smooth frosted light-grey spheres (#adb2b9) that move inside & breach through the beads
    // 4) 6 smaller smooth matte-black nodule spheres (#1c1e22) that orbit & poke out around the perimeter
    // 5) The soft directional studio floor shadow extending toward the bottom-right
  
    const vsSphere = `
      attribute vec3 aPos;
      attribute vec3 aNormal;
  
      uniform mat4 uProj;
      uniform mat4 uView;
      uniform vec3 uCenter;
      uniform float uRadius;
      uniform float uRadialDist;
  
      varying vec3 vNormal;
      varying vec3 vLocalNormal;
      varying vec3 vWorldPos;
      varying float vRadialDist;
  
      void main() {
        vec3 worldPos = uCenter + aPos * uRadius;
        vWorldPos = worldPos;
        vNormal = mat3(uView) * aNormal;
        vLocalNormal = aNormal;
        vRadialDist = uRadialDist;
        gl_Position = uProj * uView * vec4(worldPos, 1.0);
      }
    `;
  
    const fsSphere = `
      precision highp float;
  
      varying vec3 vNormal;
      varying vec3 vLocalNormal;
      varying vec3 vWorldPos;
      varying float vRadialDist;
  
      uniform int uMaterialType; // 0 = matte bead, 1 = core occlusion, 2 = frosted light sphere, 3 = black nodule
  
      void main() {
        vec3 n = normalize(vNormal);
        vec3 worldN = normalize(vWorldPos);
  
        // Studio directional key light from top-left-front casting shadow to bottom-right
        vec3 keyLight  = normalize(vec3(-0.48, 0.58, 0.66));
        vec3 fillLight = normalize(vec3(0.55, -0.25, 0.78));
        vec3 ambLight  = normalize(vec3(0.0, 0.85, 0.52));
  
        float diffKey  = max(0.0, dot(n, keyLight));
        float diffFill = max(0.0, dot(n, fillLight));
        float diffAmb  = max(0.0, dot(n, ambLight)) * 0.5 + 0.5;
  
        // Global macro-sphere shading so the entire beaded orb has realistic 3D volume
        float macroDiff = max(0.0, dot(worldN, keyLight)) * 0.55 + 0.45;
  
        if (uMaterialType == 1) {
          // Interior occlusion core calibrated to match studio charcoal crevice depth
          gl_FragColor = vec4(vec3(0.24, 0.26, 0.29) * macroDiff, 1.0);
          return;
        }
  
        if (uMaterialType == 0) {
          // Tactile matte slate-grey Fibonacci bead (#747a82) matching Orb 6 studio lighting
          float beadOutward = clamp(dot(normalize(vNormal), worldN), -1.0, 1.0);
          float creviceAO = smoothstep(-0.20, 0.62, beadOutward);
  
          vec3 baseGrey = vec3(0.56, 0.585, 0.615);
          float lighting = (0.52 + 0.52 * diffKey + 0.25 * diffFill) * (0.76 + 0.26 * macroDiff);
          vec3 col = baseGrey * lighting * mix(0.45, 1.12, creviceAO);
  
          // Soft matte micro-specular highlight on top-left of each bead
          vec3 viewDir = vec3(0.0, 0.0, 1.0);
          vec3 halfVec = normalize(keyLight + viewDir);
          float spec = pow(max(0.0, dot(n, halfVec)), 20.0) * creviceAO;
          col += vec3(0.14, 0.15, 0.16) * spec;
  
          gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
          return;
        }
  
        if (uMaterialType == 2) {
          // Smooth frosted light-grey breaching sub-sphere (#b2b7be) matching 00:00, 00:06, 00:07
          vec3 baseLight = vec3(0.68, 0.70, 0.73);
          float lighting = 0.46 + 0.52 * diffKey + 0.18 * diffFill;
          vec3 col = baseLight * lighting * (0.78 + 0.24 * macroDiff);
  
          // Subtle diagonal frosted sheen / studio reflection
          vec3 viewDir = vec3(0.0, 0.0, 1.0);
          vec3 halfVec = normalize(keyLight + viewDir);
          float spec = pow(max(0.0, dot(n, halfVec)), 28.0);
          float fresnel = pow(1.0 - max(0.0, dot(n, viewDir)), 2.5);
          col += vec3(0.20, 0.21, 0.23) * spec + vec3(0.10) * fresnel;
  
          gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
          return;
        }
  
        // MaterialType == 3: Smooth matte dark-charcoal/black nodule sphere (#1b1d21)
        vec3 baseDark = vec3(0.125, 0.135, 0.150);
        float lighting = 0.35 + 0.65 * diffKey + 0.15 * diffFill;
        vec3 col = baseDark * lighting;
        vec3 viewDir = vec3(0.0, 0.0, 1.0);
        vec3 halfVec = normalize(keyLight + viewDir);
        float spec = pow(max(0.0, dot(n, halfVec)), 32.0);
        col += vec3(0.11, 0.12, 0.14) * spec;
        gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
      }
    `;
  
    // Background & soft studio floor shadow shader
    const vsBg = `
      attribute vec2 aQuad;
      varying vec2 vUv;
      void main() {
        vUv = aQuad;
        gl_Position = vec4(aQuad, 0.999, 1.0);
      }
    `;
  
    const fsBg = `
      precision highp float;
      varying vec2 vUv;
      uniform vec2 uResolution;
  
      void main() {
        vec2 uv = vUv;
        uv.x *= uResolution.x / max(uResolution.y, 1.0);
  
        vec3 bg = vec3(0.957, 0.957, 0.957);
  
        // Soft studio floor shadow extending from bottom of medium orb toward the right
        vec2 shadowCenter = vec2(0.18, -0.34);
        vec2 d = uv - shadowCenter;
        vec2 rotD = vec2(d.x * 0.98 - d.y * 0.14, d.x * 0.14 + d.y * 0.98);
        float ellip = length(rotD * vec2(1.85, 6.2));
        float shadow = exp(-ellip * ellip * 1.35) * 0.165;
  
        // Contact shadow right under the base of the sphere
        vec2 contactD = (uv - vec2(0.05, -0.325)) * vec2(3.4, 8.8);
        float contact = exp(-dot(contactD, contactD) * 1.8) * 0.115;
  
        vec3 col = bg - vec3(shadow + contact);
        gl_FragColor = vec4(col, 1.0);
      }
    `;
  
    function compile(type: any, src?: any) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }
  
    function createProgram(vs: any, fs?: any) {
      const p = gl.createProgram();
      gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
      gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(p);
      return p;
    }
  
    const sphereProg = createProgram(vsSphere, fsSphere);
    const bgProg = createProgram(vsBg, fsBg);
  
    // Build smooth UV sphere mesh generator
    function createSphereMesh(latBands: any, lonBands?: any) {
      const pos: any[] = [];
      const norm: any[] = [];
      const idx: any[] = [];
  
      for (let lat = 0; lat <= latBands; lat++) {
        const theta = (lat * Math.PI) / latBands;
        const sinT = Math.sin(theta);
        const cosT = Math.cos(theta);
  
        for (let lon = 0; lon <= lonBands; lon++) {
          const phi = (lon * 2 * Math.PI) / lonBands;
          const x = Math.cos(phi) * sinT;
          const y = cosT;
          const z = Math.sin(phi) * sinT;
          pos.push(x, y, z);
          norm.push(x, y, z);
        }
      }
  
      for (let lat = 0; lat < latBands; lat++) {
        for (let lon = 0; lon < lonBands; lon++) {
          const first = lat * (lonBands + 1) + lon;
          const second = first + lonBands + 1;
          idx.push(first, second, first + 1);
          idx.push(second, second + 1, first + 1);
        }
      }
  
      const posBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);
  
      const normBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, normBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(norm), gl.STATIC_DRAW);
  
      const idxBuf = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
  
      return { posBuf, normBuf, idxBuf, count: idx.length };
    }
  
    // Medium-poly mesh for the 2,150 small beads, high-poly mesh for the large smooth breaching spheres
    const beadMesh = createSphereMesh(10, 14);
    const smoothMesh = createSphereMesh(28, 36);
  
    // Fullscreen quad for background + shadow
    const bgQuadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bgQuadBuf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
  
    // Generate 2,150 Fibonacci-spiral beads on the unit sphere (matching the tight spiral packing in Orb 6)
    const NUM_BEADS = 2150;
    const GOLDEN_ANGLE = Math.PI * (3.0 - Math.sqrt(5.0));
    const beads = new Array(NUM_BEADS);
  
    for (let i = 0; i < NUM_BEADS; i++) {
      const y = 1.0 - (i / (NUM_BEADS - 1)) * 2.0;
      const r = Math.sqrt(Math.max(0.0, 1.0 - y * y));
      const theta = GOLDEN_ANGLE * i;
      beads[i] = {
        x: Math.cos(theta) * r,
        y,
        z: Math.sin(theta) * r
      };
    }
  
    // Dynamic internal sub-spheres that orbit and breach through the beaded surface:
    // 4 frosted light-grey spheres (type=2) + 6 smaller dark-charcoal nodule spheres (type=3)
    const subSpheres = [
      // Frosted light-grey spheres (radius ~ 0.195, breaching near front/poles as in 00:00, 00:06, 00:07)
      { type: 2, radius: 0.195, baseR: 0.81, ampR: 0.065, freqR: 1.35, phaseR: 0.4, lat0: -0.38, lon0: 1.35, vLat: 0.42, vLon: 0.55 },
      { type: 2, radius: 0.188, baseR: 0.80, ampR: 0.070, freqR: 1.15, phaseR: 2.1, lat0:  0.12, lon0: 1.85, vLat: -0.38, vLon: -0.48 },
      { type: 2, radius: 0.182, baseR: 0.80, ampR: 0.068, freqR: 1.50, phaseR: 3.8, lat0:  0.65, lon0: 0.45, vLat: 0.35, vLon: 0.62 },
      { type: 2, radius: 0.190, baseR: 0.80, ampR: 0.065, freqR: 1.25, phaseR: 5.2, lat0: -0.22, lon0: -1.45, vLat: -0.44, vLon: 0.50 },
  
      // Smaller matte-black nodule spheres (radius ~ 0.092, poking out around the perimeter as in 00:00-00:11)
      { type: 3, radius: 0.092, baseR: 0.90, ampR: 0.065, freqR: 1.85, phaseR: 0.0, lat0: -0.08, lon0: 0.15,  vLat: 0.52, vLon: 0.68 },
      { type: 3, radius: 0.088, baseR: 0.90, ampR: 0.062, freqR: 1.65, phaseR: 1.4, lat0: -1.15, lon0: 1.55,  vLat: -0.46, vLon: -0.58 },
      { type: 3, radius: 0.094, baseR: 0.90, ampR: 0.068, freqR: 2.05, phaseR: 2.9, lat0:  0.15, lon0: 3.05,  vLat: 0.48, vLon: -0.64 },
      { type: 3, radius: 0.086, baseR: 0.89, ampR: 0.065, freqR: 1.75, phaseR: 4.1, lat0:  1.18, lon0: 1.20,  vLat: -0.55, vLon: 0.52 },
      { type: 3, radius: 0.090, baseR: 0.90, ampR: 0.060, freqR: 1.95, phaseR: 5.0, lat0: -0.65, lon0: -0.85, vLat: 0.40, vLon: 0.72 },
      { type: 3, radius: 0.088, baseR: 0.89, ampR: 0.064, freqR: 1.55, phaseR: 2.2, lat0:  0.52, lon0: -2.10, vLat: -0.42, vLon: -0.54 }
    ];
  
    // Uniform locations
    const aPosLoc = gl.getAttribLocation(sphereProg, 'aPos');
    const aNormLoc = gl.getAttribLocation(sphereProg, 'aNormal');
    const uProjLoc = gl.getUniformLocation(sphereProg, 'uProj');
    const uViewLoc = gl.getUniformLocation(sphereProg, 'uView');
    const uCenterLoc = gl.getUniformLocation(sphereProg, 'uCenter');
    const uRadiusLoc = gl.getUniformLocation(sphereProg, 'uRadius');
    const uRadialDistLoc = gl.getUniformLocation(sphereProg, 'uRadialDist');
    const uMatTypeLoc = gl.getUniformLocation(sphereProg, 'uMaterialType');
  
    const aQuadLoc = gl.getAttribLocation(bgProg, 'aQuad');
    const uBgResLoc = gl.getUniformLocation(bgProg, 'uResolution');
  
    function bindMesh(mesh?: any) {
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.posBuf);
      gl.enableVertexAttribArray(aPosLoc);
      gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 0, 0);
  
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normBuf);
      gl.enableVertexAttribArray(aNormLoc);
      gl.vertexAttribPointer(aNormLoc, 3, gl.FLOAT, false, 0, 0);
  
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.idxBuf);
    }
  
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
  
    // Interactive trackball / pointer rotation matching the video
    let rotX = 0.25;
    let rotY = -0.35;
    let targetRotX = 0.25;
    let targetRotY = -0.35;
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
        targetRotY += dx * 0.009;
        targetRotX = Math.max(-1.45, Math.min(1.45, targetRotX + dy * 0.009));
      } else {
        // Gentle reactive rotation toward the pointer as seen in the recording
        targetRotY += nx * 0.006;
        targetRotX += (ny * 0.45 - targetRotX) * 0.03;
      }
    });
  
    window.addEventListener('pointerup', () => {
      isDragging = false;
    });
  
    function rotateVec(x: any, y: any, z: any, rx: any, ry?: any) {
      const cx = Math.cos(rx), sx = Math.sin(rx);
      const cy = Math.cos(ry), sy = Math.sin(ry);
      const x1 = x * cy - z * sy;
      const z1 = x * sy + z * cy;
      const y2 = y * cx - z1 * sx;
      const z2 = y * sx + z1 * cx;
      return [x1, y2, z2];
    }
  
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
  
    const viewMat = new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, -0.14, -7.25, 1
    ]);
  
    function render(now?: any) {
      const t = now * 0.001;
  
      if (!isDragging) {
        targetRotY += 0.0038;
      }
      rotX += (targetRotX - rotX) * 0.09;
      rotY += (targetRotY - rotY) * 0.09;
  
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
      // 1. Draw studio background & soft floor shadow
      gl.disable(gl.DEPTH_TEST);
      gl.useProgram(bgProg);
      gl.bindBuffer(gl.ARRAY_BUFFER, bgQuadBuf);
      gl.enableVertexAttribArray(aQuadLoc);
      gl.vertexAttribPointer(aQuadLoc, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(uBgResLoc, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
  
      // 2. Draw 3D Orb scene with hardware depth buffering
      gl.enable(gl.DEPTH_TEST);
      gl.useProgram(sphereProg);
  
      const aspect = canvas.width / Math.max(canvas.height, 1);
      const projMat = perspective(0.45, aspect, 1.0, 20.0);
      gl.uniformMatrix4fv(uProjLoc, false, projMat);
      gl.uniformMatrix4fv(uViewLoc, false, viewMat);
  
      // Update positions of internal breaching sub-spheres in object space
      const activeSubs = subSpheres.map((s: any, idx: any) => {
        const lat = s.lat0 + Math.sin(t * s.vLat + idx) * 0.65;
        const lon = s.lon0 + t * s.vLon;
        const clat = Math.cos(lat);
        const dirX = Math.cos(lon) * clat;
        const dirY = Math.sin(lat);
        const dirZ = Math.sin(lon) * clat;
  
        const rDist = s.baseR + Math.sin(t * s.freqR + s.phaseR) * s.ampR;
        const ox = dirX * rDist;
        const oy = dirY * rDist;
        const oz = dirZ * rDist;
  
        const [wx, wy, wz] = rotateVec(ox, oy, oz, rotX, rotY);
        return {
          ox, oy, oz,
          wx, wy, wz,
          radius: s.radius,
          type: s.type,
          rDist
        };
      });
  
      // Draw high-res smooth spheres (core occlusion sphere + frosted light-grey + dark-charcoal nodules)
      bindMesh(smoothMesh);
  
      // Inner dark occlusion core (radius 0.968 so zero gaps ever appear between Fibonacci beads)
      gl.uniform1i(uMatTypeLoc, 1);
      gl.uniform3f(uCenterLoc, 0.0, 0.0, 0.0);
      gl.uniform1f(uRadiusLoc, 0.968);
      gl.uniform1f(uRadialDistLoc, 0.968);
      gl.drawElements(gl.TRIANGLES, smoothMesh.count, gl.UNSIGNED_SHORT, 0);
  
      // Draw breaching smooth sub-spheres
      for (let i = 0; i < activeSubs.length; i++) {
        const sub = activeSubs[i];
        gl.uniform1i(uMatTypeLoc, sub.type);
        gl.uniform3f(uCenterLoc, sub.wx, sub.wy, sub.wz);
        gl.uniform1f(uRadiusLoc, sub.radius);
        gl.uniform1f(uRadialDistLoc, sub.rDist);
        gl.drawElements(gl.TRIANGLES, smoothMesh.count, gl.UNSIGNED_SHORT, 0);
      }
  
      // Draw all 2,150 Fibonacci-spiral tactile beads
      bindMesh(beadMesh);
      gl.uniform1i(uMatTypeLoc, 0);
      const beadRadius = 0.0415;
  
      for (let i = 0; i < NUM_BEADS; i++) {
        const b = beads[i];
        const [wx, wy, wz] = rotateVec(b.x, b.y, b.z, rotX, rotY);
  
        // Cull back-facing internal beads that cannot be seen past the core occlusion sphere
        if (wz < -0.18) continue;
  
        // Subtle organic surface wave deformation where sub-spheres press from within
        let radialScale = 1.0;
        for (let k = 0; k < activeSubs.length; k++) {
          const sub = activeSubs[k];
          if (sub.type === 2) {
            const dx = b.x - sub.ox;
            const dy = b.y - sub.oy;
            const dz = b.z - sub.oz;
            const d2 = dx * dx + dy * dy + dz * dz;
            if (d2 < 0.14) {
              radialScale += (0.14 - d2) * 0.18;
            }
          }
        }
  
        gl.uniform3f(uCenterLoc, wx * radialScale, wy * radialScale, wz * radialScale);
        gl.uniform1f(uRadiusLoc, beadRadius);
        gl.uniform1f(uRadialDistLoc, radialScale);
        gl.drawElements(gl.TRIANGLES, beadMesh.count, gl.UNSIGNED_SHORT, 0);
      }
  
      requestAnimationFrame(render);
    }
  
    requestAnimationFrame(render);
  })();
}
/* eslint-enable */

export function Orb6({ className, style, width = '100%', height = '100%' }: Orb6Props) {
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

    initOrb6Runtime({
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
      className={className ? `fv-orbs-orb-6 ${className}` : 'fv-orbs-orb-6'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
        <canvas id="glCanvas"></canvas>
    </div>
  );
}

export default Orb6;
