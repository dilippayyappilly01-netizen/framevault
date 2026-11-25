const { toPascalCase } = require('./reactConverter');

const FRAME_PRESETS = {
  desktop: { width: 1440, height: 900, label: 'Desktop (1440×900)' },
  card: { width: 1200, height: 800, label: 'Card (1200×800)' },
  square: { width: 1080, height: 1080, label: 'Square (1080×1080)' },
  mobile: { width: 390, height: 844, label: 'Mobile (390×844)' }
};

function escapeXml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeHex(hex, fallback = '#0b4dff') {
  const s = String(hex || '').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(s)) {
    return `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`.toLowerCase();
  }
  return fallback;
}

function hexToRgb(hex) {
  const h = normalizeHex(hex, '#000000').slice(1);
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16)
  };
}

function isDarkHex(hex) {
  const { r, g, b } = hexToRgb(hex);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum < 0.5;
}

function extractPalette(comp, cps, compiledHtml) {
  const colors = [];
  const pushColor = (c) => {
    const n = normalizeHex(c, '');
    if (n && !colors.includes(n)) colors.push(n);
  };

  const bgColor = normalizeHex(
    cps?.colours?.backgroundColor?.value || comp?.defaultBgColor || '#09090b',
    '#09090b'
  );

  // Gather customized shader & hex colors first
  (cps?.colours?.shaderColorParams || []).forEach(p => pushColor(p.value));
  (cps?.colours?.hexColorParams || []).forEach(p => pushColor(p.value));
  if (cps?.effects?.glowColor?.value) pushColor(cps.effects.glowColor.value);
  if (Number(cps?.colours?.tintOpacity?.value || 0) > 0 && cps?.colours?.tintColor?.value) {
    pushColor(cps.colours.tintColor.value);
  }

  // Fallback: extract hex and GLSL vec3 colors from HTML source
  const src = String(compiledHtml || comp?.htmlSource || '');
  for (const m of src.matchAll(/vec3\s*\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\)/g)) {
    const r = Number(m[1]), g = Number(m[2]), b = Number(m[3]);
    if (r >= 0 && r <= 1 && g >= 0 && g <= 1 && b >= 0 && b <= 1) {
      const hex = '#' + [r, g, b].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
      if (hex !== '#000000' && hex !== '#ffffff') pushColor(hex);
    }
    if (colors.length >= 8) break;
  }
  for (const m of src.matchAll(/#([0-9a-fA-F]{6})\b/g)) {
    const hex = `#${m[1].toLowerCase()}`;
    if (hex !== bgColor) pushColor(hex);
    if (colors.length >= 8) break;
  }

  const accents = colors.filter(c => c !== bgColor);
  const primary = accents[0] || '#38bdf8';
  const secondary = accents[1] || '#6366f1';
  const tertiary = accents[2] || '#e0f2fe';
  const darkBg = isDarkHex(bgColor);
  const fg = darkBg ? '#f4f4f5' : '#09090b';
  const fgMuted = darkBg ? '#a1a1aa' : '#52525b';
  const surface = darkBg ? '#18181b' : '#ffffff';
  const border = darkBg ? '#27272a' : '#e4e4e7';

  return {
    background: bgColor,
    surface,
    border,
    foreground: fg,
    foregroundMuted: fgMuted,
    primary,
    secondary,
    tertiary,
    allAccents: [primary, secondary, tertiary, ...accents.slice(3)].slice(0, 6)
  };
}

function extractLabels(comp, cps) {
  const title = String(
    cps?.htmlProperties?.documentTitle?.value ||
    comp?.displayTitle ||
    comp?.name ||
    'FrameVault Component'
  ).trim();

  const domTexts = [];
  (cps?.htmlProperties?.domElements || []).forEach(el => {
    if (el && el.type !== 'toggle' && el.type !== 'color' && typeof el.value === 'string') {
      const clean = el.value.trim();
      if (clean && clean.length >= 2 && clean.length <= 80 && !domTexts.includes(clean)) {
        domTexts.push(clean);
      }
    }
  });
  (cps?.htmlProperties?.stringParams || []).forEach(sp => {
    if (sp && typeof sp.value === 'string') {
      const clean = sp.value.trim();
      if (clean && clean.length >= 2 && clean.length <= 80 && !domTexts.includes(clean)) {
        domTexts.push(clean);
      }
    }
  });

  const fontRaw = String(cps?.htmlProperties?.fontFamily?.value || 'Inter, sans-serif');
  const primaryFont = fontRaw.split(',')[0].replace(/['"]/g, '').trim() || 'Inter';

  return {
    title,
    primaryFont,
    domTexts: domTexts.slice(0, 4)
  };
}

function buildOrbLayers(w, h, pal) {
  const cx = Math.round(w / 2);
  const cy = Math.round(h / 2);
  const r = Math.round(Math.min(w, h) * 0.28);
  const rOuter = Math.round(r * 1.28);
  const rInner = Math.round(r * 0.56);

  return `
  <g id="Orb_Containment_Component">
    <circle id="Outer_Atmospheric_Halo" cx="${cx}" cy="${cy}" r="${rOuter}" fill="url(#fvOrbHalo)" />
    <circle id="Orb_Base_Sphere" cx="${cx}" cy="${cy}" r="${r}" fill="url(#fvOrbSphere)" stroke="${pal.primary}" stroke-opacity="0.55" stroke-width="2" />
    <g id="Orbital_Rings">
      <ellipse id="Ring_Horizontal" cx="${cx}" cy="${cy}" rx="${Math.round(r * 0.86)}" ry="${Math.round(r * 0.30)}" fill="none" stroke="${pal.tertiary}" stroke-opacity="0.45" stroke-width="1.5" transform="rotate(-18 ${cx} ${cy})" />
      <ellipse id="Ring_Diagonal" cx="${cx}" cy="${cy}" rx="${Math.round(r * 0.78)}" ry="${Math.round(r * 0.26)}" fill="none" stroke="${pal.primary}" stroke-opacity="0.55" stroke-width="1.5" transform="rotate(34 ${cx} ${cy})" />
      <ellipse id="Ring_Vertical" cx="${cx}" cy="${cy}" rx="${Math.round(r * 0.68)}" ry="${Math.round(r * 0.22)}" fill="none" stroke="${pal.secondary}" stroke-opacity="0.50" stroke-width="1.5" transform="rotate(78 ${cx} ${cy})" />
    </g>
    <g id="Plasma_Filaments">
      <path id="Filament_Ribbon_1" d="M ${cx - Math.round(r * 0.62)} ${cy + Math.round(r * 0.18)} C ${cx - Math.round(r * 0.2)} ${cy - Math.round(r * 0.65)}, ${cx + Math.round(r * 0.28)} ${cy + Math.round(r * 0.58)}, ${cx + Math.round(r * 0.62)} ${cy - Math.round(r * 0.14)}" fill="none" stroke="${pal.primary}" stroke-width="4" stroke-linecap="round" stroke-opacity="0.85" />
      <path id="Filament_Ribbon_2" d="M ${cx - Math.round(r * 0.48)} ${cy - Math.round(r * 0.36)} C ${cx} ${cy + Math.round(r * 0.52)}, ${cx + Math.round(r * 0.18)} ${cy - Math.round(r * 0.55)}, ${cx + Math.round(r * 0.52)} ${cy + Math.round(r * 0.28)}" fill="none" stroke="${pal.tertiary}" stroke-width="2.5" stroke-linecap="round" stroke-opacity="0.75" />
    </g>
    <circle id="Plasma_Core_Bloom" cx="${cx}" cy="${cy}" r="${rInner}" fill="url(#fvOrbCore)" />
    <path id="Glass_Specular_Catchlight" d="M ${cx - Math.round(r * 0.68)} ${cy - Math.round(r * 0.24)} A ${Math.round(r * 0.86)} ${Math.round(r * 0.86)} 0 0 1 ${cx - Math.round(r * 0.12)} ${cy - Math.round(r * 0.72)}" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-opacity="0.55" />
  </g>`;
}

function buildCarouselLayers(w, h, pal, labels) {
  const cx = Math.round(w / 2);
  const cy = Math.round(h / 2) + 12;
  const cardW = Math.round(Math.min(w * 0.23, 280));
  const cardH = Math.round(cardW * 1.28);
  const gap = Math.round(cardW * 0.78);
  const cards = [-2, -1, 0, 1, 2].map((offset, idx) => {
    const scale = offset === 0 ? 1 : Math.abs(offset) === 1 ? 0.86 : 0.72;
    const cw = Math.round(cardW * scale);
    const ch = Math.round(cardH * scale);
    const x = Math.round(cx + offset * gap - cw / 2);
    const y = Math.round(cy - ch / 2 + Math.abs(offset) * 14);
    const accent = pal.allAccents[idx % pal.allAccents.length];
    const opacity = offset === 0 ? 1 : Math.abs(offset) === 1 ? 0.88 : 0.62;
    return `
    <g id="Carousel_Card_${idx + 1}" opacity="${opacity}">
      <rect id="Card_${idx + 1}_Frame" x="${x}" y="${y}" width="${cw}" height="${ch}" rx="18" fill="${pal.surface}" stroke="${offset === 0 ? pal.primary : pal.border}" stroke-width="${offset === 0 ? 2 : 1.2}" />
      <rect id="Card_${idx + 1}_Media_Slot" x="${x + 12}" y="${y + 12}" width="${cw - 24}" height="${Math.round(ch * 0.68)}" rx="12" fill="${accent}" fill-opacity="0.22" stroke="${accent}" stroke-opacity="0.45" stroke-width="1" />
      <text id="Card_${idx + 1}_Label" x="${x + 16}" y="${y + ch - 42}" fill="${pal.foreground}" font-family="${escapeXml(labels.primaryFont)}, sans-serif" font-size="${offset === 0 ? 15 : 13}" font-weight="600">Slide 0${idx + 1}</text>
      <text id="Card_${idx + 1}_Caption" x="${x + 16}" y="${y + ch - 22}" fill="${pal.foregroundMuted}" font-family="${escapeXml(labels.primaryFont)}, sans-serif" font-size="11">Editable Figma Card</text>
    </g>`;
  });

  return `
  <g id="Carousel_Stage_Component">
    <ellipse id="Stage_Ambient_Glow" cx="${cx}" cy="${cy}" rx="${Math.round(w * 0.36)}" ry="${Math.round(h * 0.24)}" fill="url(#fvOrbHalo)" />
    ${cards.join('')}
  </g>`;
}

function buildCubeLayers(w, h, pal) {
  const cx = Math.round(w / 2);
  const cy = Math.round(h / 2);
  const s = Math.round(Math.min(w, h) * 0.23);
  const dx = Math.round(s * 0.866);
  const dy = Math.round(s * 0.5);

  const topPts = `${cx},${cy - s} ${cx + dx},${cy - dy} ${cx},${cy} ${cx - dx},${cy - dy}`;
  const leftPts = `${cx - dx},${cy - dy} ${cx},${cy} ${cx},${cy + s} ${cx - dx},${cy + dy}`;
  const rightPts = `${cx + dx},${cy - dy} ${cx + dx},${cy + dy} ${cx},${cy + s} ${cx},${cy}`;

  return `
  <g id="Cube_3D_Component">
    <circle id="Cube_Ambient_Glow" cx="${cx}" cy="${cy}" r="${Math.round(s * 1.55)}" fill="url(#fvOrbHalo)" />
    <polygon id="Cube_Top_Face" points="${topPts}" fill="${pal.primary}" fill-opacity="0.88" stroke="${pal.tertiary}" stroke-width="2" stroke-linejoin="round" />
    <polygon id="Cube_Left_Face" points="${leftPts}" fill="${pal.secondary}" fill-opacity="0.82" stroke="${pal.tertiary}" stroke-width="2" stroke-linejoin="round" />
    <polygon id="Cube_Right_Face" points="${rightPts}" fill="${pal.primary}" fill-opacity="0.52" stroke="${pal.tertiary}" stroke-width="2" stroke-linejoin="round" />
    <line id="Cube_Center_Edge" x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy + s}" stroke="#ffffff" stroke-opacity="0.65" stroke-width="2" />
  </g>`;
}

function buildAssetLayers(w, h, pal) {
  const cx = Math.round(w / 2);
  const cy = Math.round(h / 2);
  const rx = Math.round(Math.min(w, h) * 0.34);
  const ry = Math.round(Math.min(w, h) * 0.22);

  return `
  <g id="Shader_Asset_Component">
    <circle id="Asset_Glow_Backdrop" cx="${cx}" cy="${cy}" r="${Math.round(rx * 1.15)}" fill="url(#fvOrbHalo)" />
    <g id="Concentric_Geometry">
      <ellipse id="Wave_Ring_1" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${pal.primary}" stroke-width="2.5" stroke-opacity="0.7" />
      <ellipse id="Wave_Ring_2" cx="${cx}" cy="${cy}" rx="${Math.round(rx * 0.76)}" ry="${Math.round(ry * 0.76)}" fill="none" stroke="${pal.secondary}" stroke-width="2" stroke-opacity="0.8" transform="rotate(14 ${cx} ${cy})" />
      <ellipse id="Wave_Ring_3" cx="${cx}" cy="${cy}" rx="${Math.round(rx * 0.52)}" ry="${Math.round(ry * 0.52)}" fill="none" stroke="${pal.tertiary}" stroke-width="1.8" stroke-opacity="0.85" transform="rotate(-18 ${cx} ${cy})" />
    </g>
    <path id="Flow_Wave_Primary" d="M ${Math.round(w * 0.14)} ${cy + 40} Q ${cx - 120} ${cy - 140}, ${cx} ${cy} T ${Math.round(w * 0.86)} ${cy - 30}" fill="none" stroke="${pal.primary}" stroke-width="5" stroke-linecap="round" stroke-opacity="0.85" />
    <path id="Flow_Wave_Secondary" d="M ${Math.round(w * 0.14)} ${cy - 20} Q ${cx - 80} ${cy + 130}, ${cx + 20} ${cy - 10} T ${Math.round(w * 0.86)} ${cy + 45}" fill="none" stroke="${pal.secondary}" stroke-width="3" stroke-linecap="round" stroke-opacity="0.7" />
    <circle id="Focal_Emblem_Core" cx="${cx}" cy="${cy}" r="${Math.round(Math.min(w, h) * 0.11)}" fill="url(#fvOrbCore)" stroke="${pal.tertiary}" stroke-opacity="0.6" stroke-width="1.5" />
  </g>`;
}

function buildTokenSwatchesLayer(w, h, pal, labels) {
  const swY = h - 78;
  const swX = 36;
  const swatchItems = [
    { name: 'BG', hex: pal.background },
    { name: 'Primary', hex: pal.primary },
    { name: 'Secondary', hex: pal.secondary },
    { name: 'Accent', hex: pal.tertiary }
  ];

  const chips = swatchItems.map((item, idx) => {
    const x = swX + idx * 144;
    return `
    <g id="Token_Swatch_${item.name}">
      <rect x="${x}" y="${swY}" width="132" height="44" rx="10" fill="${pal.surface}" stroke="${pal.border}" stroke-width="1" />
      <rect x="${x + 8}" y="${swY + 8}" width="28" height="28" rx="6" fill="${item.hex}" stroke="${pal.border}" stroke-width="1" />
      <text x="${x + 44}" y="${swY + 20}" fill="${pal.foreground}" font-family="${escapeXml(labels.primaryFont)}, sans-serif" font-size="11" font-weight="600">${item.name}</text>
      <text x="${x + 44}" y="${swY + 34}" fill="${pal.foregroundMuted}" font-family="monospace" font-size="10">${item.hex.toUpperCase()}</text>
    </g>`;
  });

  return `
  <g id="Design_Tokens_Swatches">
    ${chips.join('')}
  </g>`;
}

function buildFigmaTokensJson(comp, cps, compiledHtml, presetKey = 'desktop') {
  const preset = FRAME_PRESETS[presetKey] || FRAME_PRESETS.desktop;
  const pal = extractPalette(comp, cps, compiledHtml);
  const labels = extractLabels(comp, cps);
  const componentName = toPascalCase(comp?.name || labels.title);

  return {
    $schema: 'https://tr.designtokens.org/format/',
    framevault: {
      component: { $value: componentName, $type: 'other' },
      category: { $value: comp?.section || 'general', $type: 'other' },
      engine: { $value: comp?.engine || 'WEBGL 3D', $type: 'other' },
      color: {
        background: { $value: pal.background, $type: 'color' },
        surface: { $value: pal.surface, $type: 'color' },
        border: { $value: pal.border, $type: 'color' },
        foreground: { $value: pal.foreground, $type: 'color' },
        foregroundMuted: { $value: pal.foregroundMuted, $type: 'color' },
        primary: { $value: pal.primary, $type: 'color' },
        secondary: { $value: pal.secondary, $type: 'color' },
        tertiary: { $value: pal.tertiary, $type: 'color' }
      },
      typography: {
        fontFamily: { $value: labels.primaryFont, $type: 'fontFamily' }
      },
      layout: {
        frameWidth: { $value: `${preset.width}px`, $type: 'dimension' },
        frameHeight: { $value: `${preset.height}px`, $type: 'dimension' },
        borderRadius: {
          $value: `${Number(cps?.htmlProperties?.borderRadius?.value || 16)}px`,
          $type: 'dimension'
        }
      },
      motion: {
        animationSpeed: {
          $value: Number(cps?.speeds?.animationSpeed?.value ?? 1),
          $type: 'number'
        },
        scale: {
          $value: Number(cps?.effects?.scale?.value ?? 1),
          $type: 'number'
        },
        glowIntensity: {
          $value: Number(cps?.effects?.glowIntensity?.value ?? 0),
          $type: 'number'
        }
      }
    }
  };
}

/**
 * Generates an editable Figma SVG (with named vector layers, gradients, text nodes,
 * and optional token swatches) + Figma Design Tokens JSON for any FrameVault component.
 */
function buildFigmaBundle(comp, cps, compiledHtml, options = {}) {
  const presetKey = FRAME_PRESETS[options.preset] ? options.preset : 'desktop';
  const preset = FRAME_PRESETS[presetKey];
  const includeSwatches = Boolean(options.includeSwatches);
  const w = preset.width;
  const h = preset.height;

  const pal = extractPalette(comp, cps, compiledHtml);
  const labels = extractLabels(comp, cps);
  const componentName = toPascalCase(comp?.name || labels.title);
  const sec = String(comp?.section || '').toLowerCase();

  let artworkGroup;
  if (sec.includes('orb')) artworkGroup = buildOrbLayers(w, h, pal);
  else if (sec.includes('carasol') || sec.includes('carousel')) artworkGroup = buildCarouselLayers(w, h, pal, labels);
  else if (sec.includes('cube')) artworkGroup = buildCubeLayers(w, h, pal);
  else artworkGroup = buildAssetLayers(w, h, pal);

  const textOverlays = labels.domTexts.length > 0
    ? `\n  <g id="Component_Text_Layers">\n${labels.domTexts
        .map((txt, idx) => `    <text id="Text_Layer_${idx + 1}" x="48" y="${64 + idx * 32}" fill="${pal.foreground}" font-family="${escapeXml(labels.primaryFont)}, sans-serif" font-size="${idx === 0 ? 20 : 14}" font-weight="${idx === 0 ? 600 : 400}">${escapeXml(txt)}</text>`)
        .join('\n')}\n  </g>`
    : '';

  const swatchGroup = includeSwatches && w >= 640
    ? buildTokenSwatchesLayer(w, h, pal, labels)
    : '';

  // Start directly with <svg ...> (no <?xml?> prolog) so Figma Ctrl+V always pastes editable layers
  const svg = `<svg id="${escapeXml(componentName)}_Frame" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none">
  <title>${escapeXml(labels.title)}</title>
  <defs>
    <radialGradient id="fvOrbHalo" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${pal.primary}" stop-opacity="0.42" />
      <stop offset="55%" stop-color="${pal.secondary}" stop-opacity="0.16" />
      <stop offset="100%" stop-color="${pal.background}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="fvOrbSphere" cx="38%" cy="34%" r="65%">
      <stop offset="0%" stop-color="${pal.tertiary}" stop-opacity="0.32" />
      <stop offset="48%" stop-color="${pal.primary}" stop-opacity="0.38" />
      <stop offset="100%" stop-color="${pal.background}" stop-opacity="0.92" />
    </radialGradient>
    <radialGradient id="fvOrbCore" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
      <stop offset="42%" stop-color="${pal.primary}" stop-opacity="0.65" />
      <stop offset="100%" stop-color="${pal.secondary}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <g id="Background_Stage">
    <rect id="Stage_Fill" x="0" y="0" width="${w}" height="${h}" fill="${pal.background}" />
  </g>${artworkGroup}${textOverlays}${swatchGroup}
</svg>`;

  const tokensObj = buildFigmaTokensJson(comp, cps, compiledHtml, presetKey);
  const tokensJson = JSON.stringify(tokensObj, null, 2);

  return {
    componentName,
    preset: presetKey,
    width: w,
    height: h,
    palette: pal,
    svg,
    tokensJson,
    filenameSvg: `${componentName}-figma.svg`,
    filenameTokens: `${componentName}.figma-tokens.json`
  };
}

module.exports = {
  FRAME_PRESETS,
  buildFigmaBundle,
  buildFigmaTokensJson
};
