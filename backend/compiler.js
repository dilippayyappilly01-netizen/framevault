const fs = require('fs');
const vm = require('vm');
const crypto = require('crypto');
const zlib = require('zlib');

function countControlsFromSet(cps) {
  if (!cps) return 50;
  return (
    6 + (cps.speeds?.componentSpeeds?.length || 0) +
    11 + (cps.effects?.componentEffects?.length || 0) +
    9 + (cps.colours?.hexColorParams?.length || 0) + (cps.colours?.shaderColorParams?.length || 0) +
    16 + (cps.htmlProperties?.domElements?.length || 0) +
    (cps.htmlProperties?.cssRuleParams?.length || 0) +
    (cps.htmlProperties?.stringParams?.length || 0)
  );
}

function makeCompressedAsset(rawStringOrBuf) {
  const raw = Buffer.isBuffer(rawStringOrBuf)
    ? rawStringOrBuf
    : Buffer.from(String(rawStringOrBuf), 'utf8');
  const etag = '"' + crypto.createHash('sha1').update(raw).digest('hex').slice(0, 16) + '"';
  const br = zlib.brotliCompressSync(raw, {
    params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 }
  });
  const gzip = zlib.gzipSync(raw, { level: 6 });
  return { raw, br, gzip, etag };
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function hexToNormalizedRgb(hex) {
  let h = String(hex || '#000000').trim().replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return {
    r: Number.isNaN(r) ? 0 : r,
    g: Number.isNaN(g) ? 0 : g,
    b: Number.isNaN(b) ? 0 : b
  };
}

function sanitizeHexColor(val, fallback) {
  const s = String(val || '').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(s) || /^#[0-9a-fA-F]{3}$/.test(s)) {
    return s;
  }
  return fallback;
}

function sanitizeImageSlotValue(val, fallback) {
  const s = String(val || '').trim();
  if (!s) return fallback;
  if (
    s.startsWith('data:image/') ||
    s.startsWith('https://') ||
    s.startsWith('http://') ||
    /^[a-zA-Z0-9._/\- ]+$/.test(s)
  ) {
    return s;
  }
  return fallback;
}

function mergeControlParameterSet(canonicalCps, userCps) {
  const merged = JSON.parse(JSON.stringify(canonicalCps));
  if (!userCps || typeof userCps !== 'object') return merged;

  const mergeScalarGroup = (targetGroup, sourceGroup, arrayKeys = new Set()) => {
    if (!targetGroup || !sourceGroup || typeof sourceGroup !== 'object') return;
    for (const key of Object.keys(targetGroup)) {
      if (arrayKeys.has(key)) continue;
      const targetField = targetGroup[key];
      const sourceField = sourceGroup[key];
      if (!targetField || typeof targetField !== 'object' || !('value' in targetField)) continue;
      if (!sourceField || typeof sourceField !== 'object' || !('value' in sourceField)) continue;

      if (typeof targetField.defaultValue === 'boolean') {
        targetField.value = Boolean(sourceField.value);
      } else if (typeof targetField.defaultValue === 'number') {
        const n = Number(sourceField.value);
        if (Number.isFinite(n)) targetField.value = n;
      } else if (typeof targetField.defaultValue === 'string') {
        if (targetField.defaultValue.startsWith('#')) {
          targetField.value = sanitizeHexColor(sourceField.value, targetField.defaultValue);
        } else {
          targetField.value = String(sourceField.value).slice(0, 300);
        }
      }
    }
  };

  // Speeds
  mergeScalarGroup(merged.speeds, userCps.speeds, new Set(['componentSpeeds']));
  if (Array.isArray(merged.speeds.componentSpeeds) && Array.isArray(userCps.speeds?.componentSpeeds)) {
    merged.speeds.componentSpeeds.forEach((item, i) => {
      const u = userCps.speeds.componentSpeeds[i];
      if (u && Number.isFinite(Number(u.value))) item.value = Number(u.value);
    });
  }

  // Effects
  mergeScalarGroup(merged.effects, userCps.effects, new Set(['componentEffects']));
  if (Array.isArray(merged.effects.componentEffects) && Array.isArray(userCps.effects?.componentEffects)) {
    merged.effects.componentEffects.forEach((item, i) => {
      const u = userCps.effects.componentEffects[i];
      if (u && Number.isFinite(Number(u.value))) item.value = Number(u.value);
    });
  }

  // Colours
  mergeScalarGroup(merged.colours, userCps.colours, new Set(['hexColorParams', 'shaderColorParams']));
  if (Array.isArray(merged.colours.hexColorParams) && Array.isArray(userCps.colours?.hexColorParams)) {
    merged.colours.hexColorParams.forEach((item, i) => {
      const u = userCps.colours.hexColorParams[i];
      if (u && u.value) item.value = sanitizeHexColor(u.value, item.defaultValue);
    });
  }
  if (Array.isArray(merged.colours.shaderColorParams) && Array.isArray(userCps.colours?.shaderColorParams)) {
    merged.colours.shaderColorParams.forEach((item, i) => {
      const u = userCps.colours.shaderColorParams[i];
      if (u && u.value) item.value = sanitizeHexColor(u.value, item.defaultValue);
    });
  }

  // HTML Properties
  mergeScalarGroup(
    merged.htmlProperties,
    userCps.htmlProperties,
    new Set(['domElements', 'cssRuleParams', 'stringParams', 'imageSlots'])
  );

  if (Array.isArray(merged.htmlProperties.stringParams) && Array.isArray(userCps.htmlProperties?.stringParams)) {
    merged.htmlProperties.stringParams.forEach((item, i) => {
      const u = userCps.htmlProperties.stringParams[i];
      if (u && typeof u.value === 'string') item.value = u.value.slice(0, 500);
    });
  }

  if (Array.isArray(merged.htmlProperties.domElements) && Array.isArray(userCps.htmlProperties?.domElements)) {
    merged.htmlProperties.domElements.forEach((item, i) => {
      const u = userCps.htmlProperties.domElements[i];
      if (!u || !('value' in u)) return;
      if (item.type === 'toggle') item.value = Boolean(u.value);
      else if (item.type === 'color') item.value = sanitizeHexColor(u.value, item.defaultValue);
      else item.value = String(u.value).slice(0, 500);
    });
  }

  if (Array.isArray(merged.htmlProperties.cssRuleParams) && Array.isArray(userCps.htmlProperties?.cssRuleParams)) {
    merged.htmlProperties.cssRuleParams.forEach((rule, rIdx) => {
      const uRule = userCps.htmlProperties.cssRuleParams[rIdx];
      if (!uRule || !Array.isArray(uRule.props)) return;
      rule.props.forEach((prop, pIdx) => {
        const uProp = uRule.props[pIdx];
        if (uProp && typeof uProp.value === 'string') {
          prop.value = uProp.value.replace(/[<>]/g, '').slice(0, 200);
        }
      });
    });
  }

  if (Array.isArray(merged.htmlProperties.imageSlots) && Array.isArray(userCps.htmlProperties?.imageSlots)) {
    merged.htmlProperties.imageSlots.forEach((slot, i) => {
      const u = userCps.htmlProperties.imageSlots[i];
      if (u && typeof u.value === 'string') {
        slot.value = sanitizeImageSlotValue(u.value, slot.defaultValue);
      }
    });
  }

  if (userCps.colours && typeof userCps.colours === 'object') {
    if (userCps.colours.blendIntoBg && typeof userCps.colours.blendIntoBg === 'object') {
      merged.colours.blendIntoBg = {
        label: 'Blend Into Background',
        type: 'toggle',
        value: Boolean(userCps.colours.blendIntoBg.value),
        defaultValue: false
      };
    }
  }
  if (userCps.effects && typeof userCps.effects === 'object') {
    if (userCps.effects.edgeFeather && typeof userCps.effects.edgeFeather === 'object') {
      const n = Number(userCps.effects.edgeFeather.value);
      merged.effects.edgeFeather = {
        label: 'Edge Feather Mask',
        type: 'range',
        min: 0,
        max: 100,
        step: 1,
        value: Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0,
        defaultValue: 0
      };
    }
  }

  return merged;
}

function getRuntimeStatePayload(cps) {
  return {
    speeds: {
      animationSpeed: Number(cps.speeds.animationSpeed.value),
      autoPlay: Boolean(cps.speeds.autoPlay.value),
      reverseDirection: Boolean(cps.speeds.reverseDirection.value),
      autoDrive: Boolean(cps.speeds.autoDrive.value),
      dragSensitivity: Number(cps.speeds.dragSensitivity.value),
      motionSmoothing: Number(cps.speeds.motionSmoothing.value)
    },
    effects: {
      scale: Number(cps.effects.scale.value),
      perspective: Number(cps.effects.perspective.value),
      tiltX: Number(cps.effects.tiltX.value),
      tiltY: Number(cps.effects.tiltY.value),
      rotateZ: Number(cps.effects.rotateZ.value),
      blur: Number(cps.effects.blur.value),
      glowIntensity: Number(cps.effects.glowIntensity.value),
      glowColor: cps.effects.glowColor.value,
      liquidDistortion: Number(cps.effects.liquidDistortion.value),
      liquidFrequency: Number(cps.effects.liquidFrequency.value),
      vignette: Number(cps.effects.vignette.value),
      edgeFeather: Number(cps.effects.edgeFeather?.value || 0)
    },
    colours: {
      backgroundColor: cps.colours.backgroundColor.value,
      bgChanged: cps.colours.backgroundColor.value !== cps.colours.backgroundColor.defaultValue,
      blendIntoBg: Boolean(cps.colours.blendIntoBg?.value),
      hueRotate: Number(cps.colours.hueRotate.value),
      saturate: Number(cps.colours.saturate.value),
      brightness: Number(cps.colours.brightness.value),
      contrast: Number(cps.colours.contrast.value),
      invert: Number(cps.colours.invert.value),
      sepia: Number(cps.colours.sepia.value),
      tintColor: cps.colours.tintColor.value,
      tintOpacity: Number(cps.colours.tintOpacity.value),
      noBlueLock: false
    },
    htmlProps: {
      documentTitle: cps.htmlProperties.documentTitle.value,
      bodyId: cps.htmlProperties.bodyId.value,
      bodyClass: cps.htmlProperties.bodyClass.value,
      bodyDir: cps.htmlProperties.bodyDir.value,
      dataTheme: cps.htmlProperties.dataTheme.value,
      fontFamily: cps.htmlProperties.fontFamily.value,
      cursor: cps.htmlProperties.cursor.value,
      overflow: cps.htmlProperties.overflow.value,
      opacity: Number(cps.htmlProperties.opacity.value),
      padding: Number(cps.htmlProperties.padding.value),
      borderRadius: Number(cps.htmlProperties.borderRadius.value),
      borderWidth: Number(cps.htmlProperties.borderWidth.value),
      borderColor: cps.htmlProperties.borderColor.value,
      stageWidth: Number(cps.htmlProperties.stageWidth.value),
      stageHeight: Number(cps.htmlProperties.stageHeight.value),
      mixBlendMode: cps.htmlProperties.mixBlendMode.value,
      domElements: (cps.htmlProperties.domElements || []).map(d => ({
        selector: d.selector,
        type: d.type,
        attr: d.attr,
        value: d.value
      })),
      cssRules: (cps.htmlProperties.cssRuleParams || []).map(r => ({
        selector: r.selector,
        props: r.props.map(p => ({ prop: p.prop, value: p.value }))
      }))
    }
  };
}

function instrumentComponentScript(scriptCode) {
  let s = scriptCode;

  s = s.replace(
    /\b(targetRotY|targetRotX|targetRotZ|rotZ|rotY|rotX|targetYaw|targetAngle|targetProgress|targetZ|targetScrollX|wavePhase|time|phase)\s*(\+=|-=)\s*([^;\n]+);/g,
    (match, vName, op, expr) => {
      if (/\b(dx|dy|dYaw|dIdx|delta|velocity|dAngle|target|rotX|rotY|rotZ|current|master|cameraZ|scrollX|yaw|progress|angleOffset)\b/.test(expr)) {
        return match;
      }
      return `${vName} ${op} (${expr}) * window.__OK_TICK__();`;
    }
  );

  s = s.replace(
    /const\s+speedMult\s*=\s*([^;\n]+);/g,
    'const speedMult = ($1) * window.__OK_TICK__();'
  );

  s = s.replace(
    /camX\s*\+=\s*velX\s*;\s*\n\s*camY\s*\+=\s*velY\s*;/g,
    'camX += velX * window.__OK_TICK__(); camY += velY * window.__OK_TICK__();'
  );

  s = s.replace(
    /progress\s*\+=\s*velocity\s*;/g,
    'progress += velocity * window.__OK_TICK__();'
  );

  s = s.replace(
    /(function\s+(?:render\w*|animate\w*)\s*\([^)]*\)\s*\{)/,
    `$1\n      if (window.__OK_STATE__ && window.__OK_STATE__.speeds.autoDrive && typeof isDragging !== 'undefined' && !isDragging) {\n        const _drv = 0.008 * window.__OK_TICK__();\n        if (typeof targetIndex !== 'undefined') targetIndex += _drv;\n        if (typeof targetOffset !== 'undefined') targetOffset += _drv;\n        if (typeof targetScrollOffset !== 'undefined') targetScrollOffset += _drv * 40;\n        if (typeof targetRotY !== 'undefined') targetRotY += _drv;\n        if (typeof targetYaw !== 'undefined') targetYaw += _drv;\n        if (typeof targetOrbitX !== 'undefined') targetOrbitX += _drv;\n      }`
  );

  return s;
}

function compileComponentHtml(comp, userCps = null, options = {}) {
  const forIframe = Boolean(options.forIframe);
  const cps = mergeControlParameterSet(comp.controlParameterSet, userCps);
  const state = getRuntimeStatePayload(cps);
  let html = comp.htmlSource;

  // 1. Replace <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(state.htmlProps.documentTitle)}</title>`);

  // 2. Replace Hex Colors in source only when customized
  for (const hc of cps.colours.hexColorParams || []) {
    if (hc.value.toLowerCase() !== hc.defaultValue.toLowerCase()) {
      const esc = hc.rawHex.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      html = html.replace(new RegExp(esc, 'gi'), hc.value);
    }
  }

  // 3. Replace GLSL Shader vec3 colors only when customized
  for (const sc of cps.colours.shaderColorParams || []) {
    if (sc.value.toLowerCase() !== sc.defaultValue.toLowerCase()) {
      const rgb = hexToNormalizedRgb(sc.value);
      const replacement = `vec3 ${sc.varName} = vec3(${rgb.r.toFixed(3)}, ${rgb.g.toFixed(3)}, ${rgb.b.toFixed(3)})`;
      html = html.replace(sc.rawMatch, replacement);
    }
  }

  // 4. Replace JS & GLSL numeric/string parameters
  const allJsParams = [
    ...(cps.speeds.componentSpeeds || []),
    ...(cps.effects.componentEffects || []),
    ...(cps.htmlProperties.stringParams || [])
  ];
  for (const p of allJsParams) {
    if (p.value !== p.defaultValue) {
      if (p.type === 'text') {
        html = html.replace(p.rawMatch, `${p.declType} ${p.key} = ${JSON.stringify(p.value)};`);
      } else if (p.isGlsl) {
        const formatted = p.isFloat
          ? (Number(p.value).toString().includes('.') ? Number(p.value) : Number(p.value).toFixed(2))
          : Math.round(Number(p.value));
        html = html.replace(p.rawMatch, `${p.glType} ${p.varName} = ${formatted};`);
      } else {
        html = html.replace(p.rawMatch, `${p.declType} ${p.key} = ${p.value};`);
      }
    }
  }

  // 4B. Replace Carousel Images when customized
  const imgSlots = cps.htmlProperties.imageSlots || [];
  const hasReplacedImages = imgSlots.some(s => s.value !== s.defaultValue);
  if (hasReplacedImages) {
    html = html.replace(
      /Array\.from\(\s*\{\s*length:\s*12\s*\}\s*,\s*\([^)]*\)\s*=>\s*`images\/\$\{[^}]+\}\.jpg`\s*\)/g,
      `[${imgSlots.map(s => JSON.stringify(s.value)).join(', ')}]`
    );

    for (const slot of imgSlots) {
      if (slot.value !== slot.defaultValue) {
        const escDef = slot.defaultValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        html = html.replace(new RegExp(`(['"])${escDef}\\1`, 'g'), (_, q) => {
          return q + slot.value.replace(new RegExp(q, 'g'), encodeURIComponent(q)) + q;
        });
      }
    }

    html = html.replace(
      /const\s+img\s*=\s*new\s+Image\(\);/g,
      "const img = new Image();\n      img.crossOrigin = 'anonymous';"
    );
  }

  // 5. Instrument component <script>
  html = html.replace(/<script>([\s\S]*?)<\/script>/i, (_, code) => {
    return `<script>${instrumentComponentScript(code)}<\/script>`;
  });

  // 6. Inject Base URL (root-relative for /api/preview/:id iframes), optional font, styles & runtime bridge
  const cleanFolderPath = String(comp.folderPath || '').replace(/^\/+/, '');
  const baseHrefTag = forIframe ? `<base href="/${encodeURI(cleanFolderPath)}">` : '';
  const safeStateJson = JSON.stringify(state).replace(/<\//g, '<\\/');

  // Avoid unnecessary external font requests inside pure-canvas iframe previews unless DOM text or custom font is used
  const needsExternalFont =
    !forIframe ||
    (cps.htmlProperties.domElements && cps.htmlProperties.domElements.length > 0) ||
    (cps.htmlProperties.fontFamily.value !== cps.htmlProperties.fontFamily.defaultValue);
  const fontLinks = needsExternalFont
    ? `<link rel="preconnect" href="https://api.fontshare.com" crossorigin>\n  <link href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap" rel="stylesheet">`
    : '';

  const headInjection = `
  ${baseHrefTag}
  ${fontLinks}
  <style id="originkit-injected-styles">
    #ok-vignette-layer {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 9998;
    }
    #ok-tint-layer {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 9997;
      mix-blend-mode: overlay;
    }
  </style>
  <script id="originkit-runtime-bridge">
  (() => {
    window.__OK_STATE__ = ${safeStateJson};

    // Preserve WebGL drawing buffer when rendering inside offscreen Figma capture iframe (?capture=1)
    if (window.location.search.indexOf('capture=1') !== -1 && typeof HTMLCanvasElement !== 'undefined') {
      const origGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, attrs) {
        if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
          attrs = Object.assign({}, attrs || {}, { preserveDrawingBuffer: true });
        }
        return origGetContext.call(this, type, attrs);
      };
    }

    const origRAF = window.requestAnimationFrame.bind(window);
    const origPerfNow = performance.now.bind(performance);
    let lastRealTime = origPerfNow();
    let virtualTime = lastRealTime;
    let isPaused = false;
    let pausedCallbacks = [];

    window.__OK_TICK__ = function() {
      if (isPaused || document.hidden) return 0;
      const st = window.__OK_STATE__.speeds;
      if (!st.autoPlay) return 0;
      return st.animationSpeed * (st.reverseDirection ? -1 : 1);
    };

    function flushPausedCallbacks() {
      if (isPaused || document.hidden || pausedCallbacks.length === 0) return;
      lastRealTime = origPerfNow();
      const pending = pausedCallbacks;
      pausedCallbacks = [];
      for (let i = 0; i < pending.length; i++) {
        window.requestAnimationFrame(pending[i]);
      }
    }

    window.__okSetPaused = function(paused) {
      const next = Boolean(paused);
      if (next === isPaused) return;
      isPaused = next;
      if (!isPaused) flushPausedCallbacks();
    };

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) flushPausedCallbacks();
    });

    window.requestAnimationFrame = function(cb) {
      if (isPaused || document.hidden) {
        pausedCallbacks.push(cb);
        return 0;
      }
      return origRAF((realNow) => {
        if (isPaused || document.hidden) {
          pausedCallbacks.push(cb);
          return;
        }
        const dt = Math.min(100, Math.max(0, realNow - lastRealTime));
        lastRealTime = realNow;
        virtualTime += dt * window.__OK_TICK__();
        cb(virtualTime);
      });
    };

    const origGetContext = HTMLCanvasElement.prototype.getContext;
    const glContexts = [];
    HTMLCanvasElement.prototype.getContext = function(type, attrs) {
      const ctx = origGetContext.call(this, type, attrs);
      if (ctx && (type === 'webgl' || type === 'webgl2')) {
        if (!ctx.__okHooked) {
          ctx.__okHooked = true;
          glContexts.push(ctx);
          const origClearColor = ctx.clearColor.bind(ctx);
          ctx.__origClearColor = origClearColor;
          ctx.clearColor = function(r, g, b, a) {
            ctx.__defaultClear = [r, g, b, a];
            if (window.__OK_STATE__.colours.bgChanged) {
              const c = window.__okHexToRgb(window.__OK_STATE__.colours.backgroundColor);
              origClearColor(c.r, c.g, c.b, a);
            } else {
              origClearColor(r, g, b, a);
            }
          };
        }
      }
      return ctx;
    };

    window.__okHexToRgb = function(hex) {
      let h = String(hex || '#000000').replace('#', '');
      if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
      return {
        r: (parseInt(h.slice(0,2), 16) || 0) / 255,
        g: (parseInt(h.slice(2,4), 16) || 0) / 255,
        b: (parseInt(h.slice(4,6), 16) || 0) / 255
      };
    };

    window.__okApplyLiveState = function() {
      const st = window.__OK_STATE__;
      if (!document.body) return;

      document.title = st.htmlProps.documentTitle;
      document.documentElement.setAttribute('dir', st.htmlProps.bodyDir || 'ltr');
      if (st.htmlProps.bodyId) document.body.id = st.htmlProps.bodyId;
      document.body.className = st.htmlProps.bodyClass || '';
      document.body.setAttribute('data-theme', st.htmlProps.dataTheme || 'dark-carbon');
      document.body.setAttribute('data-speed', st.speeds.animationSpeed);

      if (st.colours.blendIntoBg) {
        document.documentElement.style.background = 'transparent';
        document.body.style.background = 'transparent';
        document.body.style.backgroundColor = 'transparent';
      } else if (st.colours.bgChanged) {
        document.documentElement.style.background = '';
        document.body.style.background = '';
        document.body.style.backgroundColor = st.colours.backgroundColor;
      } else {
        document.documentElement.style.background = '';
        document.body.style.background = '';
        document.body.style.backgroundColor = '';
      }
      document.body.style.overflow = st.htmlProps.overflow;
      document.body.style.opacity = st.htmlProps.opacity;
      document.body.style.padding = st.htmlProps.padding + 'px';

      if (st.colours.bgChanged) {
        const c = window.__okHexToRgb(st.colours.backgroundColor);
        glContexts.forEach(gl => {
          if (gl.__origClearColor) gl.__origClearColor(c.r, c.g, c.b, 1.0);
        });
      }

      const turb = document.getElementById('ok-fe-turb');
      const disp = document.getElementById('ok-fe-disp');
      if (turb && disp) {
        turb.setAttribute('baseFrequency', st.effects.liquidFrequency + ' ' + (st.effects.liquidFrequency * 1.4));
        disp.setAttribute('scale', st.effects.liquidDistortion);
      }

      const stageEl = document.querySelector('canvas, .reel-viewport, .spiral-viewport, .viewport, .accordion-strip, .carousel-wrapper, #stage, #viewport');
      if (stageEl) {
        if (st.htmlProps.stageWidth !== 100 || st.htmlProps.stageHeight !== 100) {
          stageEl.style.width = st.htmlProps.stageWidth + 'vw';
          stageEl.style.height = st.htmlProps.stageHeight + 'vh';
        } else {
          stageEl.style.width = '';
          stageEl.style.height = '';
        }
        stageEl.style.borderRadius = st.htmlProps.borderRadius > 0 ? st.htmlProps.borderRadius + 'px' : '';
        stageEl.style.border = st.htmlProps.borderWidth > 0
          ? (st.htmlProps.borderWidth + 'px solid ' + st.htmlProps.borderColor)
          : '';
        stageEl.style.cursor = st.htmlProps.cursor !== 'default' ? st.htmlProps.cursor : '';
        stageEl.style.mixBlendMode = st.htmlProps.mixBlendMode !== 'normal' ? st.htmlProps.mixBlendMode : '';
        if (st.effects.edgeFeather > 0) {
          const innerStop = Math.max(25, Math.round(100 - st.effects.edgeFeather * 0.65));
          const maskVal = \`radial-gradient(ellipse at center, #000 \${innerStop}%, transparent 100%)\`;
          stageEl.style.maskImage = maskVal;
          stageEl.style.webkitMaskImage = maskVal;
        } else {
          stageEl.style.maskImage = '';
          stageEl.style.webkitMaskImage = '';
        }

        const ef = st.effects;
        const col = st.colours;
        const hasCustomTransform = ef.scale !== 1 || ef.tiltX !== 0 || ef.tiltY !== 0 || ef.rotateZ !== 0 || ef.perspective !== 1000;
        stageEl.style.transform = hasCustomTransform
          ? \`perspective(\${ef.perspective}px) scale(\${ef.scale}) rotateX(\${ef.tiltX}deg) rotateY(\${ef.tiltY}deg) rotateZ(\${ef.rotateZ}deg)\`
          : '';

        const hasCustomFilter = col.hueRotate !== 0 || col.saturate !== 100 || col.brightness !== 100 || col.contrast !== 100 || col.invert !== 0 || col.sepia !== 0 || ef.blur > 0 || ef.glowIntensity > 0 || ef.liquidDistortion > 0;
        if (hasCustomFilter) {
          const filters = [
            \`hue-rotate(\${col.hueRotate}deg)\`,
            \`saturate(\${col.saturate}%)\`,
            \`brightness(\${col.brightness}%)\`,
            \`contrast(\${col.contrast}%)\`,
            \`invert(\${col.invert}%)\`,
            \`sepia(\${col.sepia}%)\`
          ];
          if (ef.blur > 0) filters.push(\`blur(\${ef.blur}px)\`);
          if (ef.glowIntensity > 0) filters.push(\`drop-shadow(0 0 \${ef.glowIntensity}px \${ef.glowColor})\`);
          if (ef.liquidDistortion > 0) filters.push('url(#okLiquidFilter)');
          stageEl.style.filter = filters.join(' ');
        } else {
          stageEl.style.filter = '';
        }
      }

      const vigEl = document.getElementById('ok-vignette-layer');
      if (vigEl) {
        vigEl.style.background = st.effects.vignette > 0
          ? \`radial-gradient(circle, transparent \${100 - st.effects.vignette}%, rgba(0,0,0,0.92) 100%)\`
          : 'none';
      }
      const tintEl = document.getElementById('ok-tint-layer');
      if (tintEl) {
        tintEl.style.backgroundColor = st.colours.tintColor;
        tintEl.style.opacity = (st.colours.tintOpacity / 100).toFixed(2);
      }

      if (Array.isArray(st.htmlProps.domElements)) {
        st.htmlProps.domElements.forEach(item => {
          const els = document.querySelectorAll(item.selector);
          els.forEach(el => {
            if (item.type === 'text') {
              el.textContent = item.value;
            } else if (item.type === 'toggle') {
              el.style.display = item.value ? '' : 'none';
            } else if (item.attr) {
              el.setAttribute(item.attr, item.value);
            }
          });
        });
      }

      let dynStyle = document.getElementById('ok-dynamic-css-rules');
      if (!dynStyle) {
        dynStyle = document.createElement('style');
        dynStyle.id = 'ok-dynamic-css-rules';
        document.head.appendChild(dynStyle);
      }
      if (Array.isArray(st.htmlProps.cssRules)) {
        const cssText = st.htmlProps.cssRules.map(r => {
          const decls = r.props.map(p => \`\${p.prop}: \${p.value} !important;\`).join(' ');
          return \`\${r.selector} { \${decls} }\`;
        }).join('\\n');
        dynStyle.textContent = \`*, *::before, *::after, body, html { font-family: \${st.htmlProps.fontFamily} !important; }\\n\` + cssText;
      }
    };

    window.addEventListener('DOMContentLoaded', () => {
      window.__okApplyLiveState();
    });

    window.addEventListener('message', (e) => {
      if (e.origin !== window.location.origin) return;
      if (!e.data) return;
      if (e.data.type === 'ORIGINKIT_UPDATE_STATE') {
        window.__OK_STATE__ = e.data.state;
        window.__okApplyLiveState();
      } else if (e.data.type === 'ORIGINKIT_SET_PAUSED') {
        window.__okSetPaused(e.data.paused);
      }
    });
  })();
  <\/script>`;

  const bodyInjection = `
  <svg width="0" height="0" style="position:absolute;pointer-events:none;">
    <defs>
      <filter id="okLiquidFilter" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence id="ok-fe-turb" type="turbulence" baseFrequency="${state.effects.liquidFrequency}" numOctaves="2" result="warp" />
        <feDisplacementMap id="ok-fe-disp" in="SourceGraphic" in2="warp" scale="${state.effects.liquidDistortion}" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id="okNoBlueFilter" color-interpolation-filters="sRGB">
        <feColorMatrix type="matrix" values="
          1.00 0.00 0.65 0 0
          0.00 1.00 0.42 0 0
          0.18 0.22 0.08 0 0
          0    0    0    1 0" />
      </filter>
    </defs>
  </svg>
  <div id="ok-tint-layer"></div>
  <div id="ok-vignette-layer"></div>`;

  html = html.replace(/<head>/i, `<head>\n${headInjection}`);
  html = html.replace(/<body([^>]*)>/i, `<body$1>\n${bodyInjection}`);

  // Inject blend metadata attributes on <body> so React/Framer converters preserve Studio blend defaults
  if (state.colours.blendIntoBg || state.htmlProps.mixBlendMode !== 'normal' || state.effects.edgeFeather > 0) {
    const blendAttrs = ` data-fv-blend="${escapeHtml(state.htmlProps.mixBlendMode || 'normal')}" data-fv-transparent="${state.colours.blendIntoBg ? '1' : '0'}" data-fv-feather="${Math.round(state.effects.edgeFeather || 0)}"`;
    html = html.replace(/<body([^>]*)>/i, `<body$1${blendAttrs}>`);
  }

  return html;
}

function loadCatalog(catalogFile) {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(catalogFile, 'utf8'), ctx);
  const sections = ctx.window.ORIGINKIT_SECTIONS || [];
  const components = ctx.window.ORIGINKIT_COMPONENTS || [];
  const byId = new Map(components.map(c => [c.id, c]));

  // Lightweight catalog metadata for fast initial page load (~20 KB raw / ~3 KB brotli vs ~423 KB)
  const liteComponents = components.map(comp => {
    const { htmlSource, htmlPath, controlParameterSet, ...safeMeta } = comp;
    return {
      ...safeMeta,
      controlCount: countControlsFromSet(controlParameterSet),
      hasImageSlots: Boolean(controlParameterSet?.htmlProperties?.imageSlots?.length)
    };
  });

  // Full parameter sets indexed by id (served lazily on demand via /api/component/:id/params)
  const paramsAssetCache = new Map();
  function getParamsAsset(compId) {
    if (paramsAssetCache.has(compId)) return paramsAssetCache.get(compId);
    const comp = byId.get(compId);
    if (!comp) return null;
    const asset = makeCompressedAsset(JSON.stringify({
      id: comp.id,
      controlParameterSet: comp.controlParameterSet
    }));
    paramsAssetCache.set(compId, asset);
    return asset;
  }

  // Lazy in-memory cache of default compiled iframe preview HTML (raw + brotli + gzip + etag)
  const defaultPreviewCache = new Map();
  function getDefaultPreviewAsset(compId) {
    if (defaultPreviewCache.has(compId)) return defaultPreviewCache.get(compId);
    const comp = byId.get(compId);
    if (!comp) return null;
    const html = compileComponentHtml(comp, null, { forIframe: true });
    const asset = makeCompressedAsset(html);
    defaultPreviewCache.set(compId, asset);
    return asset;
  }

  const publicScriptBody =
    `window.ORIGINKIT_SECTIONS = ${JSON.stringify(sections)};\n` +
    `window.ORIGINKIT_COMPONENTS = ${JSON.stringify(liteComponents)};\n`;
  const publicScriptAsset = makeCompressedAsset(publicScriptBody);

  return {
    sections,
    components,
    byId,
    buildPublicCatalog(unlocked) {
      return {
        unlocked: Boolean(unlocked),
        sections,
        components: liteComponents
      };
    },
    publicScriptBody,
    publicScriptAsset,
    getParamsAsset,
    getDefaultPreviewAsset
  };
}

module.exports = {
  loadCatalog,
  compileComponentHtml,
  mergeControlParameterSet,
  getRuntimeStatePayload,
  instrumentComponentScript,
  makeCompressedAsset
};
