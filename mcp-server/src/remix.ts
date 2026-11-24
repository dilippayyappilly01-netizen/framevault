import type { ComponentRecord } from "./scanner.js";

export function buildRemixPrompt(
  component: ComponentRecord,
  targetFramework?: string
): string {
  const frameworkLabel = targetFramework?.trim() || "the target project's detected framework (HTML/CSS/JS, React/Next.js, Vue, or Svelte)";

  const engineNotes: string[] = [];
  if (component.engine === "WEBGL 3D") {
    engineNotes.push(
      "- **WebGL Lifecycle & Container Scoping**: Preserve the GLSL vertex/fragment shaders, uniforms, buffer layouts, and blend modes. Replace `window.innerWidth`/`window.innerHeight` with the mounted container's `clientWidth`/`clientHeight` (via `ResizeObserver`) whenever embedding inside a section or card rather than a fullscreen page.",
      "- **Shader Palette Mapping**: Convert target brand hex colors to normalized linear/sRGB `vec3(r/255, g/255, b/255)` constants in the shader rather than slapping CSS filters over the canvas.",
      "- **Memory Cleanup**: Cancel `requestAnimationFrame`, detach `pointermove`/`resize` listeners, and release WebGL buffers/programs on component unmount."
    );
  } else if (component.engine === "CANVAS 2D") {
    engineNotes.push(
      "- **Canvas Sizing & DPR**: Keep `Math.min(window.devicePixelRatio || 1, 2)` scaling and adapt canvas dimensions to its parent container using `ResizeObserver`.",
      "- **Color Adaptation**: Map stroke/fill/gradient colors inside the 2D context draw loop to the target project's CSS variables (via `getComputedStyle`) or props.",
      "- **Cleanup**: Cancel the animation frame loop and remove window/canvas listeners on unmount."
    );
  } else {
    engineNotes.push(
      "- **3D CSS Transform Fidelity**: Keep `perspective`, `transform-style: preserve-3d`, `backface-visibility`, and spring/inertia physics intact so 3D card depth and drag feel identical.",
      "- **Scope Global Resets**: Do NOT copy global `html, body { overflow: hidden; height: 100vh; }` into a multi-section app; scope layout styles to a dedicated root wrapper class or CSS module."
    );
  }

  const imageNote =
    component.localImages.length > 0
      ? `- **Media / Image Slots (${component.localImages.length} local images detected)**: Replace relative \`images/...\` paths (${component.localImages.slice(0, 4).join(", ")}${component.localImages.length > 4 ? ", ..." : ""}) with the target project's real assets or a configurable \`items\`/\`images\` prop.`
      : "- **Zero External Image Dependencies**: All visuals are procedurally generated—no image copying required.";

  const colorList = [
    ...(component.colors.length ? [`CSS/Canvas Hex: ${component.colors.join(", ")}`] : []),
    ...(component.shaderColors.length ? [`GLSL Shader Colors: ${component.shaderColors.join(" | ")}`] : []),
  ];

  const frameworkPortingSteps = [
    "1. **React / Next.js (`'use client'`)**:",
    "   - Mount the `<canvas>` or 3D stage inside a `useRef<HTMLDivElement | HTMLCanvasElement>(null)`.",
    "   - Move the inline IIFE script into a `useEffect(() => { ...; return () => cleanup(); }, [])` hook.",
    "   - Expose key visual knobs (copy, accent colors, speed, items/images, className) as typed props.",
    "2. **Tailwind CSS / CSS Variables**:",
    "   - Inspect `tailwind.config.*`, `globals.css`, or `:root` tokens in the target repo before styling wrappers/overlays.",
    "   - Keep high-frequency 60fps transforms and WebGL/Canvas styles in CSS or inline transforms rather than triggering React state re-renders per frame.",
    "3. **Standalone HTML / Vanilla JS**:",
    "   - Scope CSS selectors under a unique container ID/class if embedding into an existing HTML page, and replace copy/colors directly.",
  ].join("\n");

  return `## Remix Prompt — Adapting \`${component.id}\` (${component.title})

You have retrieved the exact raw source for **${component.title}** (\`${component.filename}\`, engine: \`${component.engine}\`).
Follow this checklist to integrate and adapt it cleanly into **${frameworkLabel}** without breaking its layout, visual fidelity, or 60fps interaction physics:

### 1. Inspect Target Project First
- Read the target project's design tokens (\`styles.css\`, \`globals.css\`, \`tailwind.config.*\`, or theme provider) to identify its primary background, surface, foreground, accent color, and typography stack.
- Never paste bare \`html, body { overflow: hidden; width: 100vw; height: 100vh; }\` rules into an existing multi-section page—scope sizing to a container (e.g., \`relative w-full h-[520px] overflow-hidden\`).

### 2. Preserve Core Visual & Interaction Architecture
${engineNotes.join("\n")}
${imageNote}
- **Detected Interactions**: ${component.interactions.length ? component.interactions.join(", ") : "ambient animation"}. Keep pointer/drag/wheel responsiveness intact.

### 3. Adapt Copy, Palette & Typography
- **Detected Stage Background**: \`${component.background}\`
- **Detected Color Tokens**: ${colorList.length ? colorList.join(" ; ") : "None hardcoded"}
- **Detected Fonts**: ${component.fonts.length ? component.fonts.join(" | ") : "System sans-serif"}
- Replace placeholder headlines, labels, or captions with content that matches the user's domain while keeping concise text lengths so overlays never clip or wrap awkwardly.

### 4. Framework Porting Rules
${frameworkPortingSteps}

### 5. Verification Before Finishing
- Ensure zero TypeScript/console errors, zero memory leaks on unmount/HMR, smooth resize behavior inside its parent container, and verify visual fidelity matches the original component.
`;
}
