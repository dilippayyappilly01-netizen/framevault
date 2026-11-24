---
name: originkit-ui
description: Search, fetch, and adapt existing OriginKit 3D, WebGL, Canvas, and interactive UI components via the originkit-ui MCP server before writing UI components from scratch.
---

# OriginKit UI Component Delivery Skill

Use this skill whenever the user asks to build, add, or restyle visual UI elements—especially interactive 3D orbs, WebGL shaders, particle tunnels, plush/tactile icons, 3D cubes, kinetic carousels, galleries, or animated backgrounds.

## Mandatory Workflow

### 1. Search Existing Components First (Never Invent From Scratch)
Before writing any visual UI component from scratch, ALWAYS call the MCP tool **`search_components`** with a concise natural-language `query` describing what the user wants (e.g., `"glowing plasma orb"`, `"3d carousel"`, `"violet particle wave tunnel"`, `"plush fur icon"`, or `"*"` to inspect the full catalog).

- Use optional `category` (`orbs`, `assets`, `carasols`, `cubes`, `shaders`) or `engine` (`WEBGL 3D`, `DOM 3D`, `CANVAS 2D`) filters when narrowing down results.
- Never rewrite, overwrite, or modify the canonical source files inside the component library folder unless the user explicitly asks to edit the library itself.

### 2. Inspect Shared Guidelines & Target Project Tokens
When a matching component is found:
1. Read the MCP resource **`ui://guidelines/design-system`** (if not already loaded in this session) to align with the library's conventions for dark obsidian vs. editorial light stages, DPR clamping, pointer physics, and container scoping.
2. Inspect the target project's local styling configuration before writing any code:
   - Check `tailwind.config.*`, `globals.css`, `styles.css`, `theme.*`, or `:root` CSS custom properties (`--bg-*`, `--text-*`, `--accent-*`, font stacks).
   - Detect the target stack (React/Next.js, Vue, Svelte, or standalone HTML/CSS/JS).

### 3. Fetch Raw Source & Follow the Remix Prompt
Call **`get_component`** with the selected component's `id` (e.g., `orbs/orb-1`, `assets/asset-2`, `carasols/carasol-1`) and pass `targetFramework` matching the user's project.

Follow every instruction in the returned **Remix Prompt** carefully:
- **Preserve core visuals & motion**: Keep GLSL vertex/fragment shaders, uniform math, CSS 3D `perspective` / `preserve-3d` geometry, spring/damping physics, and pointer/wheel interactions intact.
- **Adapt design tokens cleanly**:
  - Map wrapper backgrounds, borders, typography, and overlay text to the target project's CSS variables or Tailwind tokens.
  - For WebGL shaders, translate brand hex colors into normalized `vec3(r/255, g/255, b/255)` shader constants instead of distorting the canvas with CSS filters.
  - Replace placeholder headings, labels, and relative `images/...` carousel paths with domain-appropriate copy and real assets/props.
- **Scope embedded layout safely**: Never let a standalone component's `html, body { width: 100vw; height: 100vh; overflow: hidden; }` leak into a multi-section page. Scope styling to a container wrapper and size canvases with `ResizeObserver` / `container.getBoundingClientRect()`.

### 4. Cross-Stack Porting (HTML <-> React / Next.js / Vue / Svelte)
When converting a standalone HTML component to a component framework (or vice versa), use the Remix Prompt to port cleanly:
- **Standalone HTML -> React / Next.js**:
  - Add `'use client'` when targeting Next.js App Router.
  - Bind `<canvas>` or the 3D stage via `useRef`, initialize WebGL/Canvas/event listeners inside `useEffect`, and return a cleanup function that calls `cancelAnimationFrame`, removes all event listeners, disconnects `ResizeObserver`, and releases WebGL resources.
  - Expose practical props (`className`, `style`, copy, colors, `items`/`images`, speed) without triggering React re-renders on every animation frame.
- **React/TSX -> Standalone HTML**:
  - Inline styles and wrap interactive initialization in a scoped `(() => { ... })()` IIFE with clean resize handling and zero runtime dependencies.

### 5. Verify Before Completing
- Confirm zero TypeScript, build, console, or WebGL shader compilation errors.
- Confirm the component resizes smoothly inside its host container and preserves the original animation feel.
