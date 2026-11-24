import fs from "node:fs";
import path from "node:path";

export type ComponentEngine =
  | "WEBGL 3D"
  | "CANVAS 2D"
  | "DOM 3D"
  | "REACT / TSX"
  | "CSS / HTML";

export interface ComponentRecord {
  id: string;
  legacyId: string;
  name: string;
  title: string;
  category: string;
  filename: string;
  absolutePath: string;
  format: string;
  engine: ComponentEngine;
  background: string;
  colors: string[];
  shaderColors: string[];
  fonts: string[];
  interactions: string[];
  localImages: string[];
  tags: string[];
  commentSummary: string;
  byteSize: number;
  mtimeMs: number;
}

export interface SearchMatch {
  component: ComponentRecord;
  score: number;
  matchedFields: string[];
}

const SUPPORTED_EXTS = new Set([".html", ".htm", ".tsx", ".jsx", ".vue", ".svelte"]);
const IGNORED_DIRS = new Set(["node_modules", ".git", "dist", "images", "img", "assets_tmp"]);

const QUERY_SYNONYMS: Record<string, string[]> = {
  carousel: ["carasol", "carasols", "slider", "reel", "gallery", "deck", "arch", "drum"],
  carousels: ["carasol", "carasols", "slider", "reel", "gallery"],
  slider: ["carasol", "carasols", "carousel", "reel"],
  orb: ["orbs", "sphere", "globe", "ball", "plasma"],
  orbs: ["orb", "sphere", "globe", "ball", "plasma"],
  sphere: ["orb", "orbs", "globe", "ball"],
  cube: ["cubes", "voxel", "box", "crystal"],
  cubes: ["cube", "voxel", "box", "crystal"],
  shader: ["webgl", "glsl", "fragment", "shaders", "background"],
  shaders: ["webgl", "glsl", "fragment", "shader", "background"],
  background: ["shader", "shaders", "tunnel", "vortex", "wave", "galaxy", "nebula"],
  particle: ["particles", "points", "vortex", "tunnel", "galaxy", "star", "dust"],
  particles: ["particle", "points", "vortex", "tunnel", "galaxy", "star"],
  "3d": ["webgl", "dom", "perspective", "preserve-3d", "cube", "orb", "sphere"],
  interactive: ["pointer", "drag", "hover", "cursor", "wheel", "scroll"],
  pinterest: ["fur", "plush", "icon", "asset-1"],
  fur: ["plush", "hair", "pinterest", "asset-1"],
  tunnel: ["wave", "violet", "concentric", "vortex", "asset-2"],
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatTitleFromName(name: string): string {
  return name
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function detectEngine(ext: string, src: string): ComponentEngine {
  if (ext === ".tsx" || ext === ".jsx") {
    if (/getContext\s*\(\s*['"]webgl|THREE\.|@react-three|gl_Position/i.test(src)) {
      return "WEBGL 3D";
    }
    return "REACT / TSX";
  }
  if (/getContext\s*\(\s*['"]webgl|THREE\.|createShader|gl_Position/i.test(src)) {
    return "WEBGL 3D";
  }
  if (/<canvas\b/i.test(src) || /getContext\s*\(\s*['"]2d['"]/i.test(src)) {
    return "CANVAS 2D";
  }
  if (/preserve-3d|perspective\s*:|rotateX|rotateY|translateZ/i.test(src)) {
    return "DOM 3D";
  }
  return "CSS / HTML";
}

function extractLeadingComments(src: string): string {
  const collected: string[] = [];
  const headSlice = src.slice(0, 3200);

  // HTML comments
  for (const m of headSlice.matchAll(/<!--([\s\S]*?)-->/g)) {
    const clean = m[1].replace(/\s+/g, " ").trim();
    if (clean.length >= 6) collected.push(clean);
  }
  // JS / CSS block or line comments in first 120 lines
  const lines = headSlice.split(/\r?\n/).slice(0, 120);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("//")) {
      const text = trimmed.replace(/^\/\/+\s*/, "").trim();
      if (text.length >= 10 && !text.startsWith("http")) {
        collected.push(text);
      }
    }
  }
  return collected.slice(0, 4).join(" | ").slice(0, 320);
}

function extractHexColors(src: string): string[] {
  const seen = new Set<string>();
  for (const m of src.matchAll(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)) {
    seen.add(`#${m[1].toLowerCase()}`);
    if (seen.size >= 12) break;
  }
  return [...seen];
}

function extractShaderVec3Colors(src: string): string[] {
  const seen = new Set<string>();
  const regex = /vec3\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*vec3\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\)/g;
  for (const m of src.matchAll(regex)) {
    const varName = m[1];
    const r = Number(m[2]);
    const g = Number(m[3]);
    const b = Number(m[4]);
    if (r >= 0 && r <= 1 && g >= 0 && g <= 1 && b >= 0 && b <= 1) {
      seen.add(`${varName}: vec3(${r}, ${g}, ${b})`);
    }
    if (seen.size >= 10) break;
  }
  return [...seen];
}

function extractFonts(src: string): string[] {
  const seen = new Set<string>();
  for (const m of src.matchAll(/font-family\s*:\s*([^;}{]+)/gi)) {
    const cleaned = m[1].replace(/\s+/g, " ").trim();
    if (cleaned) seen.add(cleaned);
    if (seen.size >= 5) break;
  }
  return [...seen];
}

function extractInteractions(src: string): string[] {
  const hooks: string[] = [];
  if (/pointermove|mousemove/i.test(src)) hooks.push("pointer-tracking");
  if (/pointerdown|mousedown|touchstart/i.test(src)) hooks.push("drag-interaction");
  if (/wheel|scroll/i.test(src)) hooks.push("scroll-wheel");
  if (/keydown|keyup/i.test(src)) hooks.push("keyboard");
  if (/requestAnimationFrame/i.test(src)) hooks.push("raf-animation");
  if (/resize/i.test(src)) hooks.push("responsive-resize");
  return hooks;
}

function extractTags(
  category: string,
  name: string,
  title: string,
  engine: ComponentEngine,
  commentSummary: string,
  interactions: string[],
  hasLocalImages: boolean
): string[] {
  const tagSet = new Set<string>();
  tagSet.add(slugify(category));
  tagSet.add(slugify(engine));
  if (category.toLowerCase().includes("carasol")) {
    tagSet.add("carousel");
    tagSet.add("slider");
  }
  if (category.toLowerCase().includes("orb")) {
    tagSet.add("sphere");
    tagSet.add("orb");
  }
  if (category.toLowerCase().includes("cube")) {
    tagSet.add("cube");
    tagSet.add("voxel");
  }
  if (hasLocalImages) {
    tagSet.add("images");
    tagSet.add("media-gallery");
  }
  for (const h of interactions) tagSet.add(h);

  const rawText = `${name} ${title} ${commentSummary}`.toLowerCase();
  const words = rawText.split(/[^a-z0-9]+/).filter((w) => w.length >= 3);
  const stopWords = new Set([
    "the",
    "and",
    "for",
    "with",
    "from",
    "that",
    "this",
    "into",
    "over",
    "matching",
    "recording",
    "video",
    "html",
    "index",
  ]);
  for (const w of words) {
    if (!stopWords.has(w)) tagSet.add(w);
    if (tagSet.size >= 24) break;
  }
  return [...tagSet];
}

function listLocalImages(componentDir: string): string[] {
  const imagesDir = path.join(componentDir, "images");
  if (!fs.existsSync(imagesDir)) return [];
  try {
    return fs
      .readdirSync(imagesDir)
      .filter((f) => /\.(jpe?g|png|webp|gif|svg|avif)$/i.test(f))
      .map((f) => `images/${f}`);
  } catch {
    return [];
  }
}

export class ComponentLibraryIndex {
  private readonly workspaceRoot: string;
  private readonly componentsDir: string;
  private records: ComponentRecord[] = [];
  private lastScanMs = 0;

  constructor(workspaceRoot: string, componentsDir: string) {
    this.workspaceRoot = workspaceRoot;
    this.componentsDir = componentsDir;
    this.scan();
  }

  public getComponentsDir(): string {
    return this.componentsDir;
  }

  public getWorkspaceRoot(): string {
    return this.workspaceRoot;
  }

  public scan(): ComponentRecord[] {
    const found: ComponentRecord[] = [];
    if (!fs.existsSync(this.componentsDir)) {
      this.records = [];
      this.lastScanMs = Date.now();
      return this.records;
    }

    const walk = (dir: string, topCategory: string | null) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith(".")) continue;
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (IGNORED_DIRS.has(entry.name.toLowerCase())) continue;
          const nextCat = topCategory ?? entry.name;
          walk(fullPath, nextCat);
          continue;
        }

        const ext = path.extname(entry.name).toLowerCase();
        if (!SUPPORTED_EXTS.has(ext)) continue;

        const stat = fs.statSync(fullPath);
        const src = fs.readFileSync(fullPath, "utf8");
        const relFromWorkspace = path.relative(this.workspaceRoot, fullPath).replace(/\\/g, "/");
        const relFromComponents = path.relative(this.componentsDir, fullPath).replace(/\\/g, "/");
        const parts = relFromComponents.split("/");

        const category = topCategory ?? (parts.length > 1 ? parts[0] : "general");
        const folderName =
          parts.length >= 2 && entry.name.toLowerCase() === "index.html"
            ? parts[parts.length - 2]
            : path.basename(entry.name, ext);

        const id = `${slugify(category)}/${slugify(folderName)}`;
        const legacyId = `${slugify(category)}__${slugify(folderName)}`;

        const titleMatch = src.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : formatTitleFromName(folderName);
        const engine = detectEngine(ext, src);
        const bgMatch = src.match(
          /background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/i
        );
        const background = bgMatch ? bgMatch[1].toLowerCase() : "#000000";
        const colors = extractHexColors(src);
        const shaderColors = extractShaderVec3Colors(src);
        const fonts = extractFonts(src);
        const interactions = extractInteractions(src);
        const localImages = listLocalImages(path.dirname(fullPath));
        const commentSummary = extractLeadingComments(src);
        const tags = extractTags(
          category,
          folderName,
          title,
          engine,
          commentSummary,
          interactions,
          localImages.length > 0
        );

        found.push({
          id,
          legacyId,
          name: folderName,
          title,
          category,
          filename: relFromWorkspace,
          absolutePath: fullPath,
          format: ext.replace(".", ""),
          engine,
          background,
          colors,
          shaderColors,
          fonts,
          interactions,
          localImages,
          tags,
          commentSummary,
          byteSize: stat.size,
          mtimeMs: stat.mtimeMs,
        });
      }
    };

    walk(this.componentsDir, null);

    // Display orbs first, then assets, carasols, cubes, then any newly added categories alphabetically
    const categoryOrder = ["orbs", "assets", "carasols", "cubes"];
    found.sort((a, b) => {
      const ia = categoryOrder.indexOf(a.category.toLowerCase());
      const ib = categoryOrder.indexOf(b.category.toLowerCase());
      const oa = ia === -1 ? 999 : ia;
      const ob = ib === -1 ? 999 : ib;
      if (oa !== ob) return oa - ob;
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    });

    this.records = found;
    this.lastScanMs = Date.now();
    return this.records;
  }

  /** Refresh index at most every 2 seconds so newly dropped component files appear automatically. */
  public getAll(forceRefresh = false): ComponentRecord[] {
    if (forceRefresh || Date.now() - this.lastScanMs > 2000) {
      this.scan();
    }
    return this.records;
  }

  public search(
    query: string,
    options: { category?: string; engine?: string; limit?: number } = {}
  ): SearchMatch[] {
    const items = this.getAll();
    const limit = Math.max(1, Math.min(options.limit ?? 15, 100));
    const catFilter = options.category?.trim().toLowerCase();
    const engFilter = options.engine?.trim().toLowerCase();

    const filtered = items.filter((item) => {
      if (catFilter && !item.category.toLowerCase().includes(catFilter)) {
        // Also allow "carousel" to match "carasols"
        if (!(catFilter.includes("carousel") && item.category.toLowerCase().includes("carasol"))) {
          return false;
        }
      }
      if (engFilter && !item.engine.toLowerCase().includes(engFilter)) {
        return false;
      }
      return true;
    });

    const trimmed = query.trim().toLowerCase();
    if (!trimmed || trimmed === "*" || trimmed === "all") {
      return filtered.slice(0, limit).map((component) => ({
        component,
        score: 1,
        matchedFields: ["all"],
      }));
    }

    const baseTokens = trimmed.split(/[^a-z0-9]+/).filter((t) => t.length > 0);
    const expandedTokens = new Set<string>(baseTokens);
    for (const tok of baseTokens) {
      const syns = QUERY_SYNONYMS[tok];
      if (syns) syns.forEach((s) => expandedTokens.add(s));
    }

    const results: SearchMatch[] = [];
    for (const comp of filtered) {
      let score = 0;
      const matchedFields = new Set<string>();

      const idLow = comp.id.toLowerCase();
      const nameLow = comp.name.toLowerCase();
      const titleLow = comp.title.toLowerCase();
      const fileLow = comp.filename.toLowerCase();
      const catLow = comp.category.toLowerCase();
      const engLow = comp.engine.toLowerCase();
      const commentLow = comp.commentSummary.toLowerCase();

      if (idLow === trimmed || nameLow === trimmed || comp.legacyId.toLowerCase() === trimmed) {
        score += 100;
        matchedFields.add("exact-id");
      }
      if (titleLow.includes(trimmed)) {
        score += 45;
        matchedFields.add("title");
      }
      if (fileLow.includes(trimmed)) {
        score += 35;
        matchedFields.add("filename");
      }

      for (const tok of expandedTokens) {
        const isDirect = baseTokens.includes(tok);
        const weight = isDirect ? 1 : 0.65;

        if (nameLow.includes(tok) || idLow.includes(tok)) {
          score += 18 * weight;
          matchedFields.add("id/name");
        }
        if (titleLow.includes(tok)) {
          score += 15 * weight;
          matchedFields.add("title");
        }
        if (catLow.includes(tok)) {
          score += 12 * weight;
          matchedFields.add("category");
        }
        if (engLow.includes(tok)) {
          score += 10 * weight;
          matchedFields.add("engine");
        }
        if (comp.tags.some((t) => t === tok || t.includes(tok))) {
          score += 9 * weight;
          matchedFields.add("tags");
        }
        if (commentLow.includes(tok)) {
          score += 6 * weight;
          matchedFields.add("comments");
        }
      }

      if (score > 0) {
        results.push({
          component: comp,
          score: Math.round(score * 10) / 10,
          matchedFields: [...matchedFields],
        });
      }
    }

    results.sort((a, b) => b.score - a.score || a.component.id.localeCompare(b.component.id));
    return results.slice(0, limit);
  }

  public findByIdOrFilename(identifier: string): ComponentRecord | undefined {
    const items = this.getAll();
    const raw = identifier.trim();
    const norm = raw.toLowerCase().replace(/\\/g, "/");
    const slugNorm = slugify(raw);

    return (
      items.find((c) => c.id.toLowerCase() === norm) ||
      items.find((c) => c.legacyId.toLowerCase() === norm) ||
      items.find((c) => c.filename.toLowerCase() === norm) ||
      items.find((c) => c.filename.toLowerCase().endsWith(`/${norm}`)) ||
      items.find((c) => c.name.toLowerCase() === norm) ||
      items.find((c) => slugify(c.name) === slugNorm) ||
      items.find((c) => c.title.toLowerCase() === norm) ||
      items.find((c) => c.id.toLowerCase().endsWith(`/${slugNorm}`))
    );
  }

  public readRawSource(comp: ComponentRecord): string {
    return fs.readFileSync(comp.absolutePath, "utf8");
  }

  public buildDesignSystemGuide(): string {
    const items = this.getAll();
    const byCategory = new Map<string, number>();
    const byEngine = new Map<string, number>();
    const bgCounts = new Map<string, number>();
    const fontSet = new Set<string>();
    let withImages = 0;

    for (const c of items) {
      byCategory.set(c.category, (byCategory.get(c.category) ?? 0) + 1);
      byEngine.set(c.engine, (byEngine.get(c.engine) ?? 0) + 1);
      bgCounts.set(c.background, (bgCounts.get(c.background) ?? 0) + 1);
      c.fonts.forEach((f) => fontSet.add(f));
      if (c.localImages.length > 0) withImages++;
    }

    const topBgs = [...bgCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([bg, n]) => `- \`${bg}\` (${n} components)`)
      .join("\n");

    const catLines = [...byCategory.entries()]
      .map(([cat, n]) => `- **${cat}**: ${n} component${n === 1 ? "" : "s"}`)
      .join("\n");

    const engLines = [...byEngine.entries()]
      .map(([eng, n]) => `- **${eng}**: ${n} component${n === 1 ? "" : "s"}`)
      .join("\n");

    // Extract shell tokens from root styles.css if available (read-only)
    let shellTokensSection = "";
    const rootCssPath = path.join(this.workspaceRoot, "styles.css");
    if (fs.existsSync(rootCssPath)) {
      const css = fs.readFileSync(rootCssPath, "utf8");
      const rootBlock = css.match(/:root\s*\{([\s\S]*?)\}/);
      if (rootBlock) {
        const tokenLines = rootBlock[1]
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter((l) => l.startsWith("--"))
          .slice(0, 20);
        if (tokenLines.length > 0) {
          shellTokensSection = `
## Host Library Shell Tokens (\`styles.css\`)
The parent showcase follows a crisp light-first / obsidian-dark aesthetic with cobalt blue accents:
\`\`\`css
:root {
  ${tokenLines.join("\n  ")}
}
\`\`\`
`;
        }
      }
    }

    return `# OriginKit UI Component Library — Design System & Engineering Guidelines

> Auto-extracted dynamically from \`${path.relative(this.workspaceRoot, this.componentsDir).replace(/\\/g, "/") || "designs"}\` (${items.length} indexed components).

## 1. Library Inventory
### Categories (Priority Display Order)
${catLines}

### Rendering Engines
${engLines}

## 2. Core Architectural Conventions
1. **Zero-Dependency Self-Contained Modules**: Components are authored as standalone HTML5 documents (\`index.html\`) containing scoped \`<style>\` and an IIFE \`<script>(() => { ... })()</script>\` with zero third-party JS bundle requirements.
2. **Full-Bleed Viewport Stage Reset**:
   - Standard box-sizing reset (\`*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }\`)
   - Full-viewport stage container (\`width: 100vw; height: 100vh; overflow: hidden; user-select: none;\`). When embedding inside a non-fullscreen section or card, replace \`100vw\`/\`100vh\` and \`window.innerWidth\`/\`window.innerHeight\` with \`100%\` and container \`getBoundingClientRect()\` / \`ResizeObserver\`.
3. **High-DPI Canvas & WebGL Discipline**:
   - WebGL/Canvas components clamp pixel ratio via \`Math.min(window.devicePixelRatio || 1, 2)\` (or \`1.5\` for heavy volumetric raymarchers) and subscribe to \`resize\`.
   - Always cancel \`requestAnimationFrame\` and remove event listeners (plus lose WebGL context/buffers on unmount) when porting to React/Vue/Svelte.
4. **Pointer & Kinetic Physics**:
   - Interactive shaders and 3D DOM carousels use smooth spring/damping interpolation (\`current += (target - current) * lerp\`) driven by \`pointermove\`, \`pointerdown\`, and \`wheel\` events.
5. **Local Media Assets**:
   - ${withImages} components (primarily 3D carousels) load relative image paths from a sibling \`images/\` directory. When integrating into a target project, replace or wire those image URLs to the host app's real media/props array.

## 3. Extracted Color Surfaces & Typography
### Dominant Stage Backgrounds
${topBgs}

- **Dark Obsidian Stages** (\`#000000\`, \`#080808\`, \`#020308\`): Used by additive-blended WebGL particle fields, plasma orbs, volumetric fur icons, and refractive cubes. Keep dark backgrounds or adapt shader blending/background colors carefully when placing on light pages.
- **Editorial Gallery Light Stages** (\`#ededed\`, \`#f4f4f4\`, \`#f7f7f7\`): Used by 3D DOM carousels, typographic cards, and matte sculpted spheres. Pair cleanly with target project surface tokens.

### Typography Stacks Observed
${[...fontSet].slice(0, 8).map((f) => `- \`${f}\``).join("\n") || "- System UI sans-serif"}
${shellTokensSection}
## 4. Safe Adaptation Rules for Coding Agents
- **Preserve visual fidelity first**: Keep GLSL shader math, easing constants, 3D perspective depth, and layout structure intact while adapting copy, palette, and container dimensions.
- **Map tokens cleanly**:
  - For **CSS / DOM 3D** components: swap hardcoded colors/fonts to the target project's CSS custom properties or Tailwind utility tokens.
  - For **WebGL 3D** components: update \`vec3(...)\` shader palette constants and \`gl.clearColor(...)\` / CSS canvas background to match the target brand palette in normalized RGB (\`0.0–1.0\`).
- **Scope sizing for embedded usage**: Never let an embedded component hijack \`html, body { overflow: hidden; }\` in a multi-section website—scope all rules to a dedicated wrapper class/container.
`;
  }
}
