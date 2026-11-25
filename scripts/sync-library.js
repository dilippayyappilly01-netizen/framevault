const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { convertHtmlToReactTsx, getTsxFilenameForHtml } = require('../backend/reactConverter');

const rootDir = path.resolve(__dirname, '..');
const designsDir = path.join(rootDir, 'designs');
const catalogFile = path.join(rootDir, 'components-data.js');

const DEFAULT_SECTION_ORDER = ['orbs', 'assets', 'carasols', 'cubes', 'backgrounds'];

function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function titleFromFolder(name) {
  return String(name || 'Component')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, ch => ch.toUpperCase());
}

function detectEngine(html) {
  if (/getContext\s*\(\s*['"]webgl|THREE\.|createShader|gl_Position/i.test(html)) {
    return 'WEBGL 3D';
  }
  if (/<canvas\b/i.test(html) || /getContext\s*\(\s*['"]2d['"]/i.test(html)) {
    return 'CANVAS 2D';
  }
  if (/preserve-3d|perspective\s*:|rotateX|rotateY|translateZ/i.test(html)) {
    return 'DOM 3D';
  }
  return 'DOM 3D';
}

function normalizeHex(hex, fallback = '#000000') {
  const s = String(hex || '').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(s)) {
    return `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`.toLowerCase();
  }
  return fallback;
}

function rgbFloatToHex(r, g, b) {
  const toByte = v => Math.max(0, Math.min(255, Math.round(Number(v) * 255))).toString(16).padStart(2, '0');
  return `#${toByte(r)}${toByte(g)}${toByte(b)}`;
}

function extractBackground(html) {
  const m = html.match(/background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})\b/i);
  return m ? normalizeHex(m[1], '#000000') : '#000000';
}

function extractHexParams(html) {
  const seen = new Set();
  const params = [];
  for (const m of html.matchAll(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)) {
    const raw = `#${m[1]}`;
    const norm = normalizeHex(raw);
    if (seen.has(norm)) continue;
    seen.add(norm);
    params.push({
      key: `hex_${params.length + 1}`,
      label: params.length === 0 ? 'PRIMARY SURFACE HEX' : `PALETTE HEX ${params.length + 1}`,
      value: norm,
      defaultValue: norm,
      rawHex: raw
    });
    if (params.length >= 8) break;
  }
  return params;
}

function extractShaderColorParams(html) {
  const seen = new Set();
  const params = [];
  const regex = /vec3\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*vec3\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\)/g;
  for (const m of html.matchAll(regex)) {
    const varName = m[1];
    const r = Number(m[2]), g = Number(m[3]), b = Number(m[4]);
    if (seen.has(varName) || r < 0 || r > 1 || g < 0 || g > 1 || b < 0 || b > 1) continue;
    seen.add(varName);
    const hex = rgbFloatToHex(r, g, b);
    const label = `SHADER ${varName.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').toUpperCase()}`;
    params.push({
      key: `vec3_${varName}`,
      varName,
      label,
      value: hex,
      defaultValue: hex,
      rawMatch: m[0]
    });
    if (params.length >= 8) break;
  }
  return params;
}

function extractGlslEffects(html) {
  const seen = new Set();
  const effects = [];
  const floatRegex = /\b(float|const\s+int)\s+([A-Z][A-Z0-9_]{0,16})\s*=\s*([0-9]+(?:\.[0-9]+)?)\s*;/g;
  for (const m of html.matchAll(floatRegex)) {
    const glType = m[1];
    const varName = m[2];
    const val = Number(m[3]);
    if (seen.has(varName) || !Number.isFinite(val) || val <= 0) continue;
    seen.add(varName);
    const isFloat = glType === 'float';
    effects.push({
      key: `glsl_${varName}`,
      varName,
      label: `SHADER ${varName.replace(/_/g, ' ')}`,
      category: 'effect',
      type: 'range',
      value: val,
      defaultValue: val,
      min: isFloat ? Number((val * 0.2).toFixed(3)) : Math.max(2, Math.floor(val * 0.3)),
      max: isFloat ? Number((val * 2.5).toFixed(3)) : Math.ceil(val * 2),
      step: isFloat ? 0.01 : 1,
      rawMatch: m[0],
      isGlsl: true,
      glType,
      isFloat
    });
    if (effects.length >= 6) break;
  }
  return effects;
}

function listLocalImageSlots(compDir) {
  const imagesDir = path.join(compDir, 'images');
  if (!fs.existsSync(imagesDir)) return [];
  const files = fs
    .readdirSync(imagesDir)
    .filter(f => /\.(jpe?g|png|webp|gif|svg|avif)$/i.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  return files.map((file, idx) => ({
    key: `img_${idx + 1}`,
    label: `IMAGE SLOT ${idx + 1} (${file})`,
    rawPath: `images/${file}`,
    value: `images/${file}`,
    defaultValue: `images/${file}`
  }));
}

function buildDefaultControlParameterSet({ id, section, name, title, bgColor, html, compDir }) {
  const bodyId = `${slugify(section)}-${slugify(name)}`;
  const imageSlots = listLocalImageSlots(compDir);
  const hexColorParams = extractHexParams(html);
  const shaderColorParams = extractShaderColorParams(html);
  const componentEffects = extractGlslEffects(html);

  return {
    speeds: {
      animationSpeed: { label: 'MASTER ANIMATION SPEED', value: 1, defaultValue: 1, min: 0, max: 4, step: 0.05, unit: 'x' },
      autoPlay: { label: 'AUTO-PLAY / CONTINUOUS MOTION', value: true, defaultValue: true, type: 'toggle' },
      reverseDirection: { label: 'REVERSE MOTION DIRECTION', value: false, defaultValue: false, type: 'toggle' },
      autoDrive: { label: 'AUTO-ORBIT / AUTO-SCROLL DRIVE', value: false, defaultValue: false, type: 'toggle' },
      dragSensitivity: { label: 'POINTER DRAG SENSITIVITY', value: 1, defaultValue: 1, min: 0.2, max: 3, step: 0.1, unit: 'x' },
      motionSmoothing: { label: 'INERTIA / DAMPING FACTOR', value: 1, defaultValue: 1, min: 0.2, max: 3, step: 0.1, unit: 'x' },
      componentSpeeds: []
    },
    effects: {
      scale: { label: 'STAGE SCALE / ZOOM', value: 1, defaultValue: 1, min: 0.4, max: 2.2, step: 0.05, unit: 'x' },
      perspective: { label: '3D PERSPECTIVE DEPTH', value: 900, defaultValue: 900, min: 200, max: 2400, step: 25, unit: 'px' },
      tiltX: { label: '3D STAGE TILT X', value: 0, defaultValue: 0, min: -45, max: 45, step: 1, unit: 'deg' },
      tiltY: { label: '3D STAGE TILT Y', value: 0, defaultValue: 0, min: -45, max: 45, step: 1, unit: 'deg' },
      rotateZ: { label: 'STAGE ROTATION Z', value: 0, defaultValue: 0, min: -180, max: 180, step: 1, unit: 'deg' },
      blur: { label: 'OPTICAL GAUSSIAN BLUR', value: 0, defaultValue: 0, min: 0, max: 20, step: 0.5, unit: 'px' },
      glowIntensity: { label: 'BLOOM / DROP-GLOW STRENGTH', value: 0, defaultValue: 0, min: 0, max: 60, step: 1, unit: 'px' },
      glowColor: { label: 'BLOOM GLOW COLOUR', value: '#ff5500', defaultValue: '#ff5500', type: 'color' },
      liquidDistortion: { label: 'LIQUID SVG TURBULENCE WARP', value: 0, defaultValue: 0, min: 0, max: 80, step: 1, unit: '' },
      liquidFrequency: { label: 'TURBULENCE WAVE FREQUENCY', value: 0.015, defaultValue: 0.015, min: 0.002, max: 0.06, step: 0.002, unit: '' },
      vignette: { label: 'STUDIO RADIAL VIGNETTE', value: 0, defaultValue: 0, min: 0, max: 90, step: 2, unit: '%' },
      componentEffects
    },
    colours: {
      backgroundColor: { label: 'STAGE BACKGROUND COLOUR', value: bgColor, defaultValue: bgColor, type: 'color' },
      hueRotate: { label: 'HUE SHIFT ANGLE', value: 0, defaultValue: 0, min: -180, max: 180, step: 1, unit: 'deg' },
      saturate: { label: 'COLOUR SATURATION', value: 100, defaultValue: 100, min: 0, max: 300, step: 5, unit: '%' },
      brightness: { label: 'EXPOSURE BRIGHTNESS', value: 100, defaultValue: 100, min: 40, max: 220, step: 5, unit: '%' },
      contrast: { label: 'TONAL CONTRAST', value: 100, defaultValue: 100, min: 40, max: 220, step: 5, unit: '%' },
      invert: { label: 'INVERT / NEGATIVE', value: 0, defaultValue: 0, min: 0, max: 100, step: 5, unit: '%' },
      sepia: { label: 'WARM SEPIA FILTER', value: 0, defaultValue: 0, min: 0, max: 100, step: 5, unit: '%' },
      tintColor: { label: 'OVERLAY TINT COLOUR', value: '#ff5500', defaultValue: '#ff5500', type: 'color' },
      tintOpacity: { label: 'OVERLAY TINT OPACITY', value: 0, defaultValue: 0, min: 0, max: 85, step: 5, unit: '%' },
      hexColorParams,
      shaderColorParams
    },
    htmlProperties: {
      documentTitle: { label: 'HTML <TITLE> PROPERTY', value: title, defaultValue: title, type: 'text' },
      bodyId: { label: 'BODY [ID] ATTRIBUTE', value: bodyId, defaultValue: bodyId, type: 'text' },
      bodyClass: { label: 'BODY [CLASS] ATTRIBUTE', value: '', defaultValue: '', type: 'text' },
      bodyDir: { label: 'HTML [DIR] DIRECTION', value: 'ltr', defaultValue: 'ltr', options: ['ltr', 'rtl'] },
      dataTheme: { label: 'BODY [DATA-THEME] ATTRIBUTE', value: 'dark-carbon', defaultValue: 'dark-carbon', type: 'text' },
      fontFamily: {
        label: 'COMPONENT FONT-FAMILY',
        value: 'Inter, system-ui, sans-serif',
        defaultValue: 'Inter, system-ui, sans-serif',
        options: ['Inter, system-ui, sans-serif', 'monospace', 'sans-serif']
      },
      cursor: { label: 'STAGE [STYLE.CURSOR]', value: 'grab', defaultValue: 'grab', options: ['default', 'grab', 'pointer', 'crosshair', 'none'] },
      overflow: { label: 'BODY [STYLE.OVERFLOW]', value: 'hidden', defaultValue: 'hidden', options: ['hidden', 'visible', 'auto'] },
      opacity: { label: 'BODY [STYLE.OPACITY]', value: 1, defaultValue: 1, min: 0.1, max: 1, step: 0.05 },
      padding: { label: 'BODY [STYLE.PADDING]', value: 0, defaultValue: 0, min: 0, max: 64, step: 2, unit: 'px' },
      borderRadius: { label: 'STAGE [STYLE.BORDER-RADIUS]', value: 0, defaultValue: 0, min: 0, max: 80, step: 2, unit: 'px' },
      borderWidth: { label: 'STAGE [STYLE.BORDER-WIDTH]', value: 0, defaultValue: 0, min: 0, max: 16, step: 1, unit: 'px' },
      borderColor: { label: 'STAGE [STYLE.BORDER-COLOR]', value: '#ff5500', defaultValue: '#ff5500', type: 'color' },
      stageWidth: { label: 'STAGE [STYLE.WIDTH]', value: 100, defaultValue: 100, min: 30, max: 100, step: 2, unit: '%' },
      stageHeight: { label: 'STAGE [STYLE.HEIGHT]', value: 100, defaultValue: 100, min: 30, max: 100, step: 2, unit: '%' },
      mixBlendMode: {
        label: 'STAGE [STYLE.MIX-BLEND-MODE]',
        value: 'normal',
        defaultValue: 'normal',
        options: ['normal', 'screen', 'lighten', 'multiply', 'difference', 'exclusion', 'overlay']
      },
      domElements: [],
      cssRuleParams: [],
      stringParams: [],
      imageSlots
    }
  };
}

function loadExistingCatalog() {
  if (!fs.existsSync(catalogFile)) return new Map();
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(catalogFile, 'utf8'), ctx);
  const byHtmlPath = new Map();
  for (const comp of ctx.window.ORIGINKIT_COMPONENTS || []) {
    if (comp && comp.htmlPath) {
      byHtmlPath.set(comp.htmlPath.replace(/\\/g, '/').toLowerCase(), comp);
    }
  }
  return byHtmlPath;
}

function discoverHtmlComponents() {
  const found = [];
  if (!fs.existsSync(designsDir)) return found;

  const sectionDirs = fs
    .readdirSync(designsDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('.'));

  for (const secEntry of sectionDirs) {
    const sectionName = secEntry.name;
    const secPath = path.join(designsDir, sectionName);
    const items = fs.readdirSync(secPath, { withFileTypes: true });

    for (const item of items) {
      if (item.name.startsWith('.') || item.name === 'images') continue;
      const full = path.join(secPath, item.name);
      if (item.isDirectory()) {
        const idxHtml = path.join(full, 'index.html');
        if (fs.existsSync(idxHtml)) {
          found.push({
            section: sectionName,
            name: item.name,
            compDir: full,
            htmlFile: idxHtml
          });
        }
      } else if (item.name.toLowerCase().endsWith('.html')) {
        found.push({
          section: sectionName,
          name: path.basename(item.name, path.extname(item.name)),
          compDir: secPath,
          htmlFile: full
        });
      }
    }
  }

  found.sort((a, b) => {
    const ia = DEFAULT_SECTION_ORDER.indexOf(a.section.toLowerCase());
    const ib = DEFAULT_SECTION_ORDER.indexOf(b.section.toLowerCase());
    const oa = ia === -1 ? 999 : ia;
    const ob = ib === -1 ? 999 : ib;
    if (oa !== ob) return oa - ob;
    if (a.section !== b.section) return a.section.localeCompare(b.section);
    return a.name.localeCompare(b.name, undefined, { numeric: true });
  });

  return found;
}

function syncLibrary() {
  const existingMap = loadExistingCatalog();
  const discovered = discoverHtmlComponents();

  const finalComponents = [];
  const sectionCounts = new Map();
  let added = 0;
  let updated = 0;
  let tsxGenerated = 0;

  for (const item of discovered) {
    const relHtmlPath = path.relative(rootDir, item.htmlFile).replace(/\\/g, '/');
    const relFolderPath = path.relative(rootDir, item.compDir).replace(/\\/g, '/') + '/';
    const rawHtml = fs.readFileSync(item.htmlFile, 'utf8');
    const titleMatch = rawHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : titleFromFolder(item.name);
    const secSlug = slugify(item.section);
    const compId = `${secSlug}__${slugify(item.name)}`;

    const existing = existingMap.get(relHtmlPath.toLowerCase());
    if (existing) {
      if (existing.htmlSource !== rawHtml) {
        existing.htmlSource = rawHtml;
        existing.rawTitle = title;
        existing.displayTitle = title;
        if (existing.controlParameterSet?.htmlProperties?.documentTitle) {
          existing.controlParameterSet.htmlProperties.documentTitle.value = title;
          existing.controlParameterSet.htmlProperties.documentTitle.defaultValue = title;
        }
        updated++;
      }
      finalComponents.push(existing);
    } else {
      const bgColor = extractBackground(rawHtml);
      const engine = detectEngine(rawHtml);
      const hasImages = fs.existsSync(path.join(item.compDir, 'images'));
      const newComp = {
        id: compId,
        section: secSlug,
        name: item.name,
        rawTitle: title,
        displayTitle: title,
        folderPath: relFolderPath,
        htmlPath: relHtmlPath,
        videoPath: '',
        engine,
        hasImages,
        hasBlueDefault: false,
        defaultBgColor: bgColor,
        htmlSource: rawHtml,
        controlParameterSet: buildDefaultControlParameterSet({
          id: compId,
          section: secSlug,
          name: item.name,
          title,
          bgColor,
          html: rawHtml,
          compDir: item.compDir
        })
      };
      finalComponents.push(newComp);
      added++;
    }

    sectionCounts.set(secSlug, (sectionCounts.get(secSlug) || 0) + 1);

    // Keep matching TypeScript + React (.tsx) sibling file up to date
    const tsxResult = convertHtmlToReactTsx(rawHtml, {
      section: secSlug,
      name: item.name,
      id: `${secSlug}-${item.name}`
    });
    const tsxFilename = getTsxFilenameForHtml(item.htmlFile, item.name);
    const tsxPath = path.join(item.compDir, tsxFilename);
    const prevTsx = fs.existsSync(tsxPath) ? fs.readFileSync(tsxPath, 'utf8') : null;
    if (prevTsx !== tsxResult.tsx) {
      fs.writeFileSync(tsxPath, tsxResult.tsx, 'utf8');
      tsxGenerated++;
    }
  }

  const removed = Math.max(0, existingMap.size - (finalComponents.length - added));

  const sections = [...sectionCounts.entries()].map(([secId, count]) => ({
    id: secId,
    name: secId.toUpperCase(),
    folderName: secId,
    count
  }));

  const headerComment = `// Auto-generated FrameVault Component Catalog from designs/ folder (${finalComponents.length} components across ${sections.length} sections)\n`;
  const catalogOut =
    headerComment +
    `window.ORIGINKIT_SECTIONS = ${JSON.stringify(sections, null, 2)};\n` +
    `window.ORIGINKIT_COMPONENTS = ${JSON.stringify(finalComponents, null, 2)};\n`;

  fs.writeFileSync(catalogFile, catalogOut, 'utf8');

  console.log(`FrameVault library synced!`);
  console.log(`  Total components: ${finalComponents.length} across ${sections.length} sections (${sections.map(s => `${s.id}:${s.count}`).join(', ')})`);
  console.log(`  Catalog changes:  +${added} added, ~${updated} updated, -${removed} removed`);
  console.log(`  React .tsx files: ${tsxGenerated} generated/updated (all original .html retained)`);
}

if (require.main === module) {
  syncLibrary();
}

module.exports = { syncLibrary };
