// ==========================================================================
// FRAMEVAULT // COMPONENT VAULT — NON-AI PARAMETRIC ENGINE & UI CONTROLLER
// 51 Components across 4 Sections (assets, carasols, cubes, orbs)
// ==========================================================================

(() => {
  let sections = window.ORIGINKIT_SECTIONS || [];
  let components = window.ORIGINKIT_COMPONENTS || [];
  let compMap = new Map(components.map(c => [c.id, c]));

  // Active UI State
  let activeSection = 'all';
  let activeEngine = 'ALL';
  let showOnlyModified = false;
  let searchQuery = '';
  let gridCols = 3; // 2 | 3 | 4
  let globalNoBlueLock = false; // Keep components in their exact original colors by default

  // Studio Modal State
  let studioCompId = null;
  let studioTab = 'speeds'; // 'speeds' | 'effects' | 'colours' | 'html'
  let studioStageMode = 'live'; // 'live' | 'code' | 'split'
  let studioCodeFormat = 'html'; // 'html' | 'tsx'
  let studioViewportSize = 'full'; // 'full' | 'desktop' | 'square' | 'mobile'
  let ctrlSearchQuery = '';
  let reloadTimer = null;

  // Track which components have been customized by the user
  const customizedSet = new Set();
  // Active WebGL card tracking to prevent exceeding browser WebGL context limits on scroll
  const activeWebGLIds = [];
  // All-Access Pricing / Paid Export State
  let accessState = {
    unlocked: false,
    licenseKey: null,
    price: '$4.99',
    currency: 'USD',
    stripeConfigured: false,
    razorpayConfigured: false,
    demoCheckoutEnabled: true,
    emailConfigured: false,
    method: null
  };
  let pendingPaidAction = null;
  let sourceFetchTimer = null;
  let sourceFetchSeq = 0;

  // DOM References
  const navSectionsEl = document.getElementById('navSections');
  const sidebarSectionsEl = document.getElementById('sidebarSections');
  const mainSectionsContainer = document.getElementById('mainSectionsContainer');
  const searchInput = document.getElementById('searchInput');
  const modifiedCountEl = document.getElementById('modifiedCountBadge');

  // Studio DOM References
  const studioBackdrop = document.getElementById('studioBackdrop');
  const studioCompTitle = document.getElementById('studioCompTitle');
  const studioViewportFrame = document.getElementById('studioViewportFrame');
  const studioIframe = document.getElementById('studioIframe');
  const studioStagePane = document.getElementById('studioStagePane');
  const studioCodePre = document.getElementById('studioCodePre');
  const studioControlsScroll = document.getElementById('studioControlsScroll');
  const ctrlFilterInput = document.getElementById('ctrlFilterInput');
  const toastEl = document.getElementById('toastNotification');

  // ========================================================================
  // HELPER UTILITIES
  // ========================================================================
  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(window.__okToastTimer);
    window.__okToastTimer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 2400);
  }

  const LOCK_ICON_SVG = '<svg class="ok-lock-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';

  function setLockedButtonLabel(btn, label, unlocked, unlockedTitle, lockedTitle) {
    if (!btn) return;
    btn.classList.toggle('ok-btn-locked', !unlocked);
    btn.innerHTML = unlocked
      ? escapeHtml(label)
      : `${LOCK_ICON_SVG}<span>${escapeHtml(label)}</span>`;
    if (unlockedTitle || lockedTitle) {
      btn.title = unlocked ? (unlockedTitle || label) : (lockedTitle || `${label} (Locked)`);
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function hexToNormalizedRgb(hex) {
    let h = String(hex).trim().replace('#', '');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    return {
      r: Number.isNaN(r) ? 0 : r,
      g: Number.isNaN(g) ? 0 : g,
      b: Number.isNaN(b) ? 0 : b
    };
  }

  function countComponentControls(comp) {
    if (comp.locked || !comp.controlParameterSet) {
      return comp.controlCount || 50;
    }
    const cps = comp.controlParameterSet;
    return (
      6 + cps.speeds.componentSpeeds.length +
      11 + cps.effects.componentEffects.length +
      9 + cps.colours.hexColorParams.length + cps.colours.shaderColorParams.length +
      16 + cps.htmlProperties.domElements.length + cps.htmlProperties.cssRuleParams.length + cps.htmlProperties.stringParams.length
    );
  }

  // ========================================================================
  // RUNTIME CONTROLLER & CUSTOMIZED HTML BUILDER
  // ========================================================================
  function getRuntimeStatePayload(comp) {
    if (comp.locked || !comp.controlParameterSet) {
      return {
        speeds: { animationSpeed: 1, autoPlay: true, reverseDirection: false, autoDrive: false, dragSensitivity: 1, motionSmoothing: 0.1, componentSpeeds: [] },
        effects: { scale: 1, perspective: 1000, tiltX: 0, tiltY: 0, rotateZ: 0, blur: 0, glowIntensity: 0, glowColor: '#ff5500', liquidDistortion: 0, liquidFrequency: 0.015, vignette: 0, componentEffects: [] },
        colours: { backgroundColor: comp.defaultBgColor || '#09090b', bgChanged: false, hueRotate: 0, saturate: 100, brightness: 100, contrast: 100, invert: 0, sepia: 0, tintColor: '#ff5500', tintOpacity: 0, hexColorParams: [], shaderColorParams: [] },
        htmlProps: { documentTitle: comp.displayTitle || comp.name, bodyId: '', bodyClass: '', bodyDir: 'ltr', dataTheme: 'dark-carbon', fontFamily: 'General Sans', overflow: 'hidden', opacity: 1, padding: 0, stageWidth: 100, stageHeight: 100, borderRadius: 0, borderWidth: 0, borderColor: '#222222', cursor: 'default', mixBlendMode: 'normal', cssRuleParams: [], stringParams: [], imageSlots: [] }
      };
    }
    const cps = comp.controlParameterSet;
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
        vignette: Number(cps.effects.vignette.value)
      },
      colours: {
        backgroundColor: cps.colours.backgroundColor.value,
        bgChanged: cps.colours.backgroundColor.value !== cps.colours.backgroundColor.defaultValue,
        hueRotate: Number(cps.colours.hueRotate.value),
        saturate: Number(cps.colours.saturate.value),
        brightness: Number(cps.colours.brightness.value),
        contrast: Number(cps.colours.contrast.value),
        invert: Number(cps.colours.invert.value),
        sepia: Number(cps.colours.sepia.value),
        tintColor: cps.colours.tintColor.value,
        tintOpacity: Number(cps.colours.tintOpacity.value),
        noBlueLock: globalNoBlueLock
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
        domElements: cps.htmlProperties.domElements.map(d => ({
          selector: d.selector,
          type: d.type,
          attr: d.attr,
          value: d.value
        })),
        cssRules: cps.htmlProperties.cssRuleParams.map(r => ({
          selector: r.selector,
          props: r.props.map(p => ({ prop: p.prop, value: p.value }))
        }))
      }
    };
  }

  const pendingParamsRequests = new Map();
  async function ensureComponentParams(comp) {
    if (!comp || comp.controlParameterSet) return comp;
    if (pendingParamsRequests.has(comp.id)) {
      return pendingParamsRequests.get(comp.id);
    }
    const p = fetch(`/api/component/${encodeURIComponent(comp.id)}/params`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data && data.controlParameterSet) {
          comp.controlParameterSet = data.controlParameterSet;
        }
        return comp;
      })
      .catch(() => comp)
      .finally(() => {
        pendingParamsRequests.delete(comp.id);
      });
    pendingParamsRequests.set(comp.id, p);
    return p;
  }

  function setIframePaused(iframeEl, paused) {
    if (!iframeEl || !iframeEl.getAttribute('src') || !iframeEl.contentWindow) return;
    try {
      iframeEl.contentWindow.postMessage({ type: 'ORIGINKIT_SET_PAUSED', paused: Boolean(paused) }, window.location.origin);
    } catch (_) {}
  }

  function pauseAllGalleryIframes(paused) {
    mainSectionsContainer.querySelectorAll('.ok-card-iframe').forEach(ifr => {
      const compId = ifr.getAttribute('data-comp-id');
      if (paused) {
        setIframePaused(ifr, true);
      } else if (compId && visibleCardIds.has(compId)) {
        setIframePaused(ifr, false);
      }
    });
  }

  async function mountPreviewIframe(iframeEl, comp, forceRecompile = false) {
    if (!iframeEl || !comp) return;
    iframeEl.__okPreviewSeq = (iframeEl.__okPreviewSeq || 0) + 1;
    const reqId = String(iframeEl.__okPreviewSeq);
    iframeEl.dataset.previewSeq = reqId;

    const pushStateOnLoad = () => {
      if (iframeEl.dataset.previewSeq !== reqId) return;
      try {
        if (customizedSet.has(comp.id) && comp.controlParameterSet) {
          const state = getRuntimeStatePayload(comp);
          iframeEl.contentWindow?.postMessage({ type: 'ORIGINKIT_UPDATE_STATE', state }, window.location.origin);
        }
        if (iframeEl !== studioIframe && (studioCompId || !visibleCardIds.has(comp.id))) {
          setIframePaused(iframeEl, true);
        }
      } catch (_) {}
    };

    iframeEl.onload = pushStateOnLoad;

    if (!forceRecompile || !comp.controlParameterSet) {
      const baseUrl = `/api/preview/${encodeURIComponent(comp.id)}`;
      if (iframeEl.getAttribute('src') === baseUrl) {
        iframeEl.src = `${baseUrl}?r=${Date.now()}`;
      } else {
        iframeEl.src = baseUrl;
      }
      return;
    }

    try {
      const res = await fetch(`/api/preview/${encodeURIComponent(comp.id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ controlParameterSet: comp.controlParameterSet })
      });
      if (!res.ok || iframeEl.dataset.previewSeq !== reqId) return;
      const data = await res.json();
      if (data.previewUrl && iframeEl.dataset.previewSeq === reqId) {
        iframeEl.src = data.previewUrl;
      }
    } catch (_) {
      if (iframeEl.dataset.previewSeq === reqId) {
        iframeEl.src = `/api/preview/${encodeURIComponent(comp.id)}`;
      }
    }
  }

  async function fetchLicensedSource(comp, format = studioCodeFormat) {
    const fmt = format === 'tsx' ? 'tsx' : 'html';
    const res = await fetch('/api/source', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: comp.id,
        format: fmt,
        controlParameterSet: comp.controlParameterSet
      })
    });
    if (res.status === 402) {
      return { locked: true, code: null, html: null, tsx: null, filename: null, format: fmt };
    }
    if (!res.ok) {
      throw new Error('Unable to compile component source');
    }
    const data = await res.json();
    return {
      locked: false,
      format: data.format || fmt,
      code: data.code || data.tsx || data.html || '',
      html: data.html || '',
      tsx: data.tsx || '',
      filename: data.filename || (fmt === 'tsx' ? 'Component.tsx' : 'component.html')
    };
  }

  // ========================================================================
  // APPLY VISUAL STATE TO CARD IN GALLERY GRID
  // ========================================================================
  function updateGridCardVisuals(comp) {
    const cardEl = document.querySelector(`.ok-card[data-id="${comp.id}"]`);
    if (!cardEl) return;

    const isMod = customizedSet.has(comp.id);
    cardEl.classList.toggle('is-customized', isMod);

    const state = getRuntimeStatePayload(comp);
    const viewport = cardEl.querySelector('.ok-card-viewport');
    const stageInner = cardEl.querySelector('.ok-card-stage-inner');
    const iframeEl = cardEl.querySelector('.ok-card-iframe');
    const tintEl = cardEl.querySelector('.ok-card-tint-layer');

    if (viewport) {
      viewport.style.backgroundColor = state.colours.backgroundColor;
    }

    if (stageInner) {
      const ef = state.effects;
      stageInner.style.transform = `perspective(${ef.perspective}px) scale(${ef.scale}) rotateX(${ef.tiltX}deg) rotateY(${ef.tiltY}deg) rotateZ(${ef.rotateZ}deg)`;
    }

    if (tintEl) {
      tintEl.style.backgroundColor = state.colours.tintColor;
      tintEl.style.opacity = (state.colours.tintOpacity / 100).toFixed(2);
    }

    if (iframeEl && iframeEl.getAttribute('src')) {
      try {
        iframeEl.contentWindow.postMessage({ type: 'ORIGINKIT_UPDATE_STATE', state }, window.location.origin);
      } catch (_) {}
    }

    // Sync Quick-Edit inline controls on the card
    const speedInput = cardEl.querySelector('.qe-speed-slider');
    const speedVal = cardEl.querySelector('.qe-speed-val');
    if (speedInput && speedVal) {
      speedInput.value = state.speeds.animationSpeed;
      speedVal.textContent = Number(state.speeds.animationSpeed).toFixed(2) + 'x';
    }

    const scaleInput = cardEl.querySelector('.qe-scale-slider');
    const scaleVal = cardEl.querySelector('.qe-scale-val');
    if (scaleInput && scaleVal) {
      scaleInput.value = state.effects.scale;
      scaleVal.textContent = Number(state.effects.scale).toFixed(2) + 'x';
    }

    const hueInput = cardEl.querySelector('.qe-hue-slider');
    const hueVal = cardEl.querySelector('.qe-hue-val');
    if (hueInput && hueVal) {
      hueInput.value = state.colours.hueRotate;
      hueVal.textContent = state.colours.hueRotate + '°';
    }

    const bgInput = cardEl.querySelector('.qe-bg-color');
    if (bgInput) {
      bgInput.value = state.colours.backgroundColor;
    }
  }

  // ========================================================================
  // RENDER NAVIGATION & SIDEBAR (Strictly the 4 Sections from designs/)
  // ========================================================================
  function formatSectionLabel(name) {
    const s = String(name || '').trim();
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  }

  function syncDynamicCatalogStats() {
    const totalCount = components.length;
    document.querySelectorAll('[data-total-count]').forEach(el => {
      el.textContent = String(totalCount);
    });

    const engineCounts = {
      ALL: totalCount,
      'WEBGL 3D': 0,
      'DOM 3D': 0,
      'CANVAS 2D': 0
    };
    for (const c of components) {
      if (c.engine in engineCounts) engineCounts[c.engine]++;
    }
    document.querySelectorAll('[data-engine-count]').forEach(el => {
      const key = el.getAttribute('data-engine-count');
      if (key && key in engineCounts) el.textContent = String(engineCounts[key]);
    });

    const heroStatsEl = document.getElementById('heroStatsPills');
    if (heroStatsEl) {
      heroStatsEl.innerHTML = sections
        .map(sec => `<div class="ok-stat-pill"><span class="ok-stat-num">${sec.count}</span><span class="ok-stat-label">${escapeHtml(formatSectionLabel(sec.name))}</span></div>`)
        .join('');
    }

    const topQuickWrap = document.getElementById('topQuickSecWrap');
    if (topQuickWrap) {
      topQuickWrap.innerHTML = sections
        .map(sec => `<button class="ok-top-link ${activeSection === sec.id ? 'active' : ''}" data-quick-sec="${escapeHtml(sec.id)}">${escapeHtml(formatSectionLabel(sec.name))}</button>`)
        .join('');
      topQuickWrap.querySelectorAll('.ok-top-link[data-quick-sec]').forEach(btn => {
        btn.addEventListener('click', () => {
          activeSection = btn.getAttribute('data-quick-sec') || 'all';
          renderNavigation();
          renderGallery();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      });
    }
  }

  function renderNavigation() {
    syncDynamicCatalogStats();
    const totalCount = components.length;
    if (navSectionsEl) {
      let pillsHtml = `
        <button class="ok-nav-pill ${activeSection === 'all' ? 'active' : ''}" data-sec="all">
          All <span class="ok-nav-count">${totalCount}</span>
        </button>
      `;
      for (const sec of sections) {
        pillsHtml += `
          <button class="ok-nav-pill ${activeSection === sec.id ? 'active' : ''}" data-sec="${sec.id}">
            ${escapeHtml(formatSectionLabel(sec.name))} <span class="ok-nav-count">${sec.count}</span>
          </button>
        `;
      }
      navSectionsEl.innerHTML = pillsHtml;

      navSectionsEl.querySelectorAll('.ok-nav-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          activeSection = btn.getAttribute('data-sec');
          renderNavigation();
          renderGallery();
        });
      });
    }

    // Sync Topbar quick-nav links
    document.querySelectorAll('.ok-top-link[data-quick-sec]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-quick-sec') === activeSection);
    });
    const homeTopBtn = document.getElementById('btnHomeTop');
    if (homeTopBtn) homeTopBtn.classList.toggle('active', activeSection === 'all');

    // Directory Drawer tree matching designs/ folders
    if (sidebarSectionsEl) {
      let sideHtml = `
        <button class="ok-sidebar-item ${activeSection === 'all' ? 'active' : ''}" data-sec="all">
          <span>All Components</span>
          <span class="ok-nav-count">${totalCount}</span>
        </button>
      `;
      for (const sec of sections) {
        const isSecActive = activeSection === sec.id;
        const secComps = components.filter(c => c.section === sec.id);
        sideHtml += `
          <div class="ok-sidebar-sec-wrap">
            <button class="ok-sidebar-item ${isSecActive ? 'active' : ''}" data-sec="${sec.id}">
              <span>${escapeHtml(formatSectionLabel(sec.name))}</span>
              <span class="ok-nav-count">${sec.count}</span>
            </button>
            <div class="ok-sidebar-sublist">
              ${secComps.map(c => `
                <button class="ok-sidebar-subitem ${customizedSet.has(c.id) ? 'modified' : ''}" data-comp-id="${c.id}">
                  <span>${escapeHtml(c.name)}</span>
                  <span>${c.engine.split(' ')[0]}</span>
                </button>
              `).join('')}
            </div>
          </div>
        `;
      }
      sidebarSectionsEl.innerHTML = sideHtml;

      sidebarSectionsEl.querySelectorAll('.ok-sidebar-item').forEach(btn => {
        btn.addEventListener('click', () => {
          activeSection = btn.getAttribute('data-sec');
          renderNavigation();
          renderGallery();
          document.getElementById('directoryBackdrop')?.classList.remove('open');
        });
      });

      sidebarSectionsEl.querySelectorAll('.ok-sidebar-subitem').forEach(btn => {
        btn.addEventListener('click', () => {
          const cId = btn.getAttribute('data-comp-id');
          document.getElementById('directoryBackdrop')?.classList.remove('open');
          openStudio(cId);
        });
      });
    }

    if (modifiedCountEl) {
      modifiedCountEl.textContent = String(customizedSet.size);
    }
  }

  // ========================================================================
  // RENDER COMPONENT GALLERY BY SECTIONS (ASSETS, CARASOLS, CUBES, ORBS)
  // ========================================================================
  function filterComponent(comp) {
    if (activeSection !== 'all' && comp.section !== activeSection) return false;
    if (activeEngine !== 'ALL' && comp.engine !== activeEngine) return false;
    if (showOnlyModified && !customizedSet.has(comp.id)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const hay = `${comp.name} ${comp.displayTitle} ${comp.section} ${comp.engine}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }

  function createComponentCardHtml(comp) {
    const totalParams = countComponentControls(comp);
    const state = getRuntimeStatePayload(comp);
    const isMod = customizedSet.has(comp.id);

    const ef = state.effects;
    const col = state.colours;

    return `
      <article class="ok-card ${isMod ? 'is-customized' : ''}" data-id="${comp.id}">
        <!-- 4:3 Interactive Showcase Tile (Original Component Only) -->
        <div class="ok-card-media-shell">
          <div class="ok-card-overlay-bar">
            <div class="ok-card-badges">
              <span class="ok-pill-glass">${escapeHtml(comp.name)}</span>
              <span class="ok-pill-glass">${escapeHtml(comp.engine.split(' ')[0])}</span>
              <span class="ok-pill-glass ok-pill-modified">Edited</span>
            </div>
            <div class="ok-card-top-actions">
              <button class="ok-card-float-btn btn-reset-card" title="Reset Component Parameters">
                Reset
              </button>
            </div>
          </div>

          <div class="ok-card-viewport" style="background-color: ${state.colours.backgroundColor};">
            <div class="ok-card-stage-inner" style="transform: perspective(${ef.perspective}px) scale(${ef.scale}) rotateX(${ef.tiltX}deg) rotateY(${ef.tiltY}deg) rotateZ(${ef.rotateZ}deg);">
              <iframe class="ok-card-iframe" data-comp-id="${comp.id}" sandbox="allow-scripts allow-same-origin" loading="lazy"></iframe>
            </div>
            <div class="ok-card-tint-layer" style="background-color: ${col.tintColor}; opacity: ${(col.tintOpacity / 100).toFixed(2)};"></div>
          </div>
        </div>

        <!-- Inline Quick-Tune Drawer (Expands via Tune button) -->
        <div class="ok-card-quickedit">
          <div class="ok-qe-row">
            <span class="ok-qe-label">Speed</span>
            <input type="range" class="qe-speed-slider" min="0" max="4" step="0.05" value="${state.speeds.animationSpeed}">
            <span class="ok-qe-val qe-speed-val">${Number(state.speeds.animationSpeed).toFixed(2)}x</span>
          </div>
          <div class="ok-qe-row">
            <span class="ok-qe-label">Zoom</span>
            <input type="range" class="qe-scale-slider" min="0.4" max="2.2" step="0.05" value="${state.effects.scale}">
            <span class="ok-qe-val qe-scale-val">${Number(state.effects.scale).toFixed(2)}x</span>
          </div>
          <div class="ok-qe-row">
            <span class="ok-qe-label">Hue</span>
            <input type="range" class="qe-hue-slider" min="-180" max="180" step="1" value="${state.colours.hueRotate}">
            <span class="ok-qe-val qe-hue-val">${state.colours.hueRotate}°</span>
          </div>
          <div class="ok-qe-color-row">
            <div class="ok-qe-color-group">
              <span class="ok-qe-label">BG</span>
              <input type="color" class="qe-bg-color" value="${state.colours.backgroundColor}">
            </div>
            <div class="ok-qe-color-group">
              <span class="ok-qe-label">Glow</span>
              <input type="range" class="qe-glow-slider" min="0" max="50" step="2" value="${state.effects.glowIntensity}" style="width:74px;">
            </div>
          </div>
        </div>

        <!-- Clean Minimalist Metadata Footer Below Preview -->
        <div class="ok-card-footer">
          <div class="ok-card-title-row">
            <h3 class="ok-card-title">${escapeHtml(comp.displayTitle)}</h3>
            <span class="ok-card-param-count">${totalParams} props</span>
          </div>
          <div class="ok-card-actions">
            <button class="ok-btn-primary btn-open-studio">Customize</button>
            <button class="ok-btn-secondary btn-toggle-tune" title="Quick inline sliders">Tune</button>
            ${comp.section === 'carasols'
              ? `<button class="ok-btn-secondary btn-open-images">Images</button>`
              : ''
            }
            <button class="ok-btn-secondary btn-download-card ${accessState.unlocked ? '' : 'ok-btn-locked'}" title="${accessState.unlocked ? 'Download standalone .html' : `Locked — Pay ${escapeHtml(accessState.price || '$4.99')} to download standalone .html`}">
              ${accessState.unlocked ? 'HTML' : `${LOCK_ICON_SVG}<span>HTML</span>`}
            </button>
            <button class="ok-btn-secondary btn-download-tsx ${accessState.unlocked ? '' : 'ok-btn-locked'}" title="${accessState.unlocked ? 'Download React TypeScript .tsx' : `Locked — Pay ${escapeHtml(accessState.price || '$4.99')} to download React TypeScript .tsx`}">
              ${accessState.unlocked ? 'TSX' : `${LOCK_ICON_SVG}<span>TSX</span>`}
            </button>
            <button class="ok-btn-secondary btn-open-figma ${accessState.unlocked ? '' : 'ok-btn-locked'}" title="${accessState.unlocked ? 'Edit in Figma (copy editable SVG or design tokens)' : `Locked — Pay ${escapeHtml(accessState.price || '$4.99')} to edit in Figma`}">
              ${accessState.unlocked ? 'Figma' : `${LOCK_ICON_SVG}<span>Figma</span>`}
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function renderGallery() {
    let html = '';
    const sectionsToRender = activeSection === 'all'
      ? sections
      : sections.filter(s => s.id === activeSection);

    let totalRendered = 0;

    for (const sec of sectionsToRender) {
      const secComps = components.filter(c => c.section === sec.id && filterComponent(c));
      if (secComps.length === 0) continue;
      totalRendered += secComps.length;

      html += `
        <section class="ok-section-block" id="section-${sec.id}">
          <div class="ok-section-header">
            <div class="ok-section-title-wrap">
              <h2 class="ok-section-title">${escapeHtml(formatSectionLabel(sec.name))}</h2>
              <span class="ok-section-folder-tag">designs/${escapeHtml(sec.id)}</span>
            </div>
            <span class="ok-section-count">${secComps.length} components</span>
          </div>
          <div class="ok-grid cols-${gridCols}">
            ${secComps.map(c => createComponentCardHtml(c)).join('')}
          </div>
        </section>
      `;
    }

    if (totalRendered === 0) {
      html = `
        <div class="ok-hero" style="justify-content:center;text-align:center;padding:64px 24px;">
          <div class="ok-hero-text" style="align-items:center;">
            <h2 class="ok-hero-title" style="font-size:28px;">No matching components</h2>
            <p class="ok-hero-subtitle">Try clearing your search query or switching category tabs.</p>
          </div>
        </div>
      `;
    }

    mainSectionsContainer.innerHTML = html;
    bindGalleryCardEvents();
    setupInteractiveCardObserver();
  }

  function applyIframeDimensions(iframeEl, w, h) {
    if (!iframeEl) return;
    const safeW = w || 400;
    const safeH = h || 300;
    const virtualW = 1200;
    const virtualH = Math.max(675, Math.round((virtualW * safeH) / safeW));
    const scale = safeW / virtualW;
    iframeEl.style.width = virtualW + 'px';
    iframeEl.style.height = virtualH + 'px';
    iframeEl.style.transform = `scale(${scale})`;
  }

  function scaleCardIframe(stageInner, iframeEl) {
    if (!stageInner || !iframeEl) return;
    const rect = stageInner.getBoundingClientRect();
    applyIframeDimensions(iframeEl, rect.width, rect.height);
  }

  // Batch layout reads: measure once per grid instead of 50 forced synchronous reflows
  function scaleAllCardIframes() {
    mainSectionsContainer.querySelectorAll('.ok-grid').forEach(grid => {
      const firstStage = grid.querySelector('.ok-card-stage-inner');
      if (!firstStage) return;
      const rect = firstStage.getBoundingClientRect();
      if (!rect.width) return;
      grid.querySelectorAll('.ok-card-iframe').forEach(ifr => {
        applyIframeDimensions(ifr, rect.width, rect.height);
      });
    });
  }

  function bindGalleryCardEvents() {
    scaleAllCardIframes();

    mainSectionsContainer.querySelectorAll('.ok-card').forEach(cardEl => {
      const compId = cardEl.getAttribute('data-id');
      const comp = compMap.get(compId);
      if (!comp) return;

      const iframeEl = cardEl.querySelector('.ok-card-iframe');

      // Reset card button
      const resetBtn = cardEl.querySelector('.btn-reset-card');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          resetComponentToDefault(comp);
          if (iframeEl && iframeEl.getAttribute('src')) {
            mountPreviewIframe(iframeEl, comp, false);
          }
          updateGridCardVisuals(comp);
          renderNavigation();
          showToast(`Reset ${comp.name} to defaults`);
        });
      }

      // Quick-Edit Speed Slider
      const speedSlider = cardEl.querySelector('.qe-speed-slider');
      if (speedSlider) {
        speedSlider.addEventListener('input', async (e) => {
          const val = parseFloat(e.target.value);
          await ensureComponentParams(comp);
          if (!comp.controlParameterSet) return;
          comp.controlParameterSet.speeds.animationSpeed.value = val;
          customizedSet.add(comp.id);
          updateGridCardVisuals(comp);
          renderNavigation();
        });
      }

      // Quick-Edit Scale Slider
      const scaleSlider = cardEl.querySelector('.qe-scale-slider');
      if (scaleSlider) {
        scaleSlider.addEventListener('input', async (e) => {
          const val = parseFloat(e.target.value);
          await ensureComponentParams(comp);
          if (!comp.controlParameterSet) return;
          comp.controlParameterSet.effects.scale.value = val;
          customizedSet.add(comp.id);
          updateGridCardVisuals(comp);
          renderNavigation();
        });
      }

      // Quick-Edit Hue Slider
      const hueSlider = cardEl.querySelector('.qe-hue-slider');
      if (hueSlider) {
        hueSlider.addEventListener('input', async (e) => {
          const val = parseInt(e.target.value, 10);
          await ensureComponentParams(comp);
          if (!comp.controlParameterSet) return;
          comp.controlParameterSet.colours.hueRotate.value = val;
          customizedSet.add(comp.id);
          updateGridCardVisuals(comp);
          renderNavigation();
        });
      }

      // Quick-Edit BG Color Picker
      const bgColor = cardEl.querySelector('.qe-bg-color');
      if (bgColor) {
        bgColor.addEventListener('input', async (e) => {
          const val = e.target.value;
          await ensureComponentParams(comp);
          if (!comp.controlParameterSet) return;
          comp.controlParameterSet.colours.backgroundColor.value = val;
          customizedSet.add(comp.id);
          updateGridCardVisuals(comp);
          renderNavigation();
        });
      }

      // Quick-Edit Glow Slider
      const glowSlider = cardEl.querySelector('.qe-glow-slider');
      if (glowSlider) {
        glowSlider.addEventListener('input', async (e) => {
          const val = parseInt(e.target.value, 10);
          await ensureComponentParams(comp);
          if (!comp.controlParameterSet) return;
          comp.controlParameterSet.effects.glowIntensity.value = val;
          customizedSet.add(comp.id);
          updateGridCardVisuals(comp);
          renderNavigation();
        });
      }

      // Open Studio Button
      const studioBtn = cardEl.querySelector('.btn-open-studio');
      if (studioBtn) {
        studioBtn.addEventListener('click', () => openStudio(comp.id));
      }

      // Quick Inline Sliders Toggle Button (prefetch params on expand)
      const tuneBtn = cardEl.querySelector('.btn-toggle-tune');
      if (tuneBtn) {
        tuneBtn.addEventListener('click', () => {
          const open = cardEl.classList.toggle('is-tuned');
          tuneBtn.classList.toggle('active', open);
          if (open) ensureComponentParams(comp);
        });
      }

      // Open Carousel Images Replacement Tab Button
      const imagesBtn = cardEl.querySelector('.btn-open-images');
      if (imagesBtn) {
        imagesBtn.addEventListener('click', () => openStudio(comp.id, 'images'));
      }

      // Download Component HTML / React TSX Buttons (gated by All-Access pass)
      const downloadBtn = cardEl.querySelector('.btn-download-card');
      if (downloadBtn) {
        downloadBtn.addEventListener('click', () => exportComponentHtml(comp, 'html'));
      }
      const downloadTsxBtn = cardEl.querySelector('.btn-download-tsx');
      if (downloadTsxBtn) {
        downloadTsxBtn.addEventListener('click', () => exportComponentHtml(comp, 'tsx'));
      }
      const figmaBtn = cardEl.querySelector('.btn-open-figma');
      if (figmaBtn) {
        figmaBtn.addEventListener('click', () => openFigmaModal(comp));
      }
    });
  }

  let cardObserver = null;
  const visibleCardIds = new Set();
  function setupInteractiveCardObserver() {
    if (cardObserver) cardObserver.disconnect();
    visibleCardIds.clear();
    activeWebGLIds.length = 0;

    const mountInteractiveCard = (iframeEl) => {
      if (!iframeEl) return;
      const compId = iframeEl.getAttribute('data-comp-id');
      const comp = compMap.get(compId);
      if (!comp) return;
      const stageInner = iframeEl.closest('.ok-card-stage-inner');
      scaleCardIframe(stageInner, iframeEl);

      if (iframeEl.getAttribute('src')) {
        if (!studioCompId) setIframePaused(iframeEl, false);
        return;
      }

      const isWebGL = comp.engine.indexOf('WEBGL') !== -1;
      if (isWebGL) {
        while (activeWebGLIds.length >= 6) {
          const evictIdx = activeWebGLIds.findIndex(id => !visibleCardIds.has(id) && id !== compId);
          const victimIdx = evictIdx !== -1 ? evictIdx : 0;
          const victimId = activeWebGLIds.splice(victimIdx, 1)[0];
          const victimEl = mainSectionsContainer.querySelector(`.ok-card-iframe[data-comp-id="${victimId}"]`);
          if (victimEl) victimEl.removeAttribute('src');
        }
        activeWebGLIds.push(compId);
      }

      mountPreviewIframe(iframeEl, comp, customizedSet.has(comp.id));
    };

    cardObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const ifr = entry.target;
        const compId = ifr.getAttribute('data-comp-id');
        if (entry.isIntersecting) {
          if (compId) visibleCardIds.add(compId);
          mountInteractiveCard(ifr);
        } else {
          if (compId) visibleCardIds.delete(compId);
          setIframePaused(ifr, true);
        }
      });
    }, { rootMargin: '120px 0px', threshold: 0.01 });

    document.querySelectorAll('.ok-card-iframe').forEach((ifr) => {
      cardObserver.observe(ifr);
    });
  }

  // ========================================================================
  // RESET COMPONENT TO DEFAULT
  // ========================================================================
  function resetComponentToDefault(comp) {
    if (!comp || comp.locked || !comp.controlParameterSet) return;
    const cps = comp.controlParameterSet;
    Object.values(cps.speeds).forEach(p => {
      if (Array.isArray(p)) p.forEach(item => { item.value = item.defaultValue; });
      else if (p && typeof p === 'object' && 'defaultValue' in p) p.value = p.defaultValue;
    });
    Object.values(cps.effects).forEach(p => {
      if (Array.isArray(p)) p.forEach(item => { item.value = item.defaultValue; });
      else if (p && typeof p === 'object' && 'defaultValue' in p) p.value = p.defaultValue;
    });
    Object.values(cps.colours).forEach(p => {
      if (Array.isArray(p)) p.forEach(item => { item.value = item.defaultValue; });
      else if (p && typeof p === 'object' && 'defaultValue' in p) p.value = p.defaultValue;
    });
    Object.values(cps.htmlProperties).forEach(p => {
      if (Array.isArray(p)) {
        p.forEach(item => {
          if ('defaultValue' in item) item.value = item.defaultValue;
          if (Array.isArray(item.props)) {
            item.props.forEach(pr => { pr.value = pr.defaultValue; });
          }
        });
      } else if (p && typeof p === 'object' && 'defaultValue' in p) {
        p.value = p.defaultValue;
      }
    });
    customizedSet.delete(comp.id);
  }

  // ========================================================================
  // PARAMETRIC STUDIO MODAL (Full Non-AI Speeds, Effects, Colours & HTML Props)
  // ========================================================================
  async function openStudio(compId, initialTab = null) {
    const comp = compMap.get(compId);
    if (!comp) return;
    studioCompId = compId;
    studioBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
    pauseAllGalleryIframes(true);

    if (studioControlsScroll && !comp.controlParameterSet) {
      studioControlsScroll.innerHTML = '<div style="padding:20px;color:var(--text-muted);font-size:13px;">Loading controls...</div>';
    }
    await ensureComponentParams(comp);
    if (studioCompId !== compId) return;

    if (initialTab) {
      studioTab = initialTab;
    } else if (studioTab === 'images' && !(comp.controlParameterSet?.htmlProperties?.imageSlots || []).length) {
      studioTab = 'speeds';
    }

    mountStudioComponent(comp);
  }

  function closeStudio() {
    studioBackdrop.classList.remove('open');
    document.body.style.overflow = '';
    if (studioIframe) {
      studioIframe.removeAttribute('src');
    }
    if (studioCompId) {
      const comp = compMap.get(studioCompId);
      if (comp) updateGridCardVisuals(comp);
    }
    studioCompId = null;
    pauseAllGalleryIframes(false);
    window.dispatchEvent(new Event('ok-studio-closed'));
  }

  async function mountStudioComponent(comp) {
    if (!comp.controlParameterSet) {
      await ensureComponentParams(comp);
      if (studioCompId !== comp.id) return;
    }
    const hasImagesTab = (comp.controlParameterSet?.htmlProperties?.imageSlots || []).length > 0;
    const tabsContainer = document.getElementById('studioCtrlTabs');
    const tabImagesBtn = document.getElementById('tabImagesBtn');
    if (tabsContainer && tabImagesBtn) {
      tabImagesBtn.style.display = hasImagesTab ? '' : 'none';
      tabsContainer.classList.toggle('has-images', hasImagesTab);
    }
    if (!hasImagesTab && studioTab === 'images') {
      studioTab = 'speeds';
    }
    document.querySelectorAll('[data-studio-tab]').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-studio-tab') === studioTab);
    });

    studioCompTitle.innerHTML = `
      <span class="ok-badge-folder">${escapeHtml(comp.section.toUpperCase())} / ${escapeHtml(comp.name.toUpperCase())}</span>
      <span>${escapeHtml(comp.displayTitle)}</span>
      <span class="ok-badge-engine">${escapeHtml(comp.engine)}</span>
    `;

    // Mount live server-rendered preview iframe
    mountPreviewIframe(studioIframe, comp, customizedSet.has(comp.id));
    updateStudioCodeView(comp, true);
    renderStudioControls(comp);
  }

  function updateStudioCodeView(comp, immediate = false) {
    if (!studioCodePre) return;
    const isTsx = studioCodeFormat === 'tsx';
    const headerTitle = document.getElementById('studioCodeHeaderTitle');
    if (headerTitle) {
      headerTitle.textContent = isTsx
        ? 'Generated TypeScript + React (.tsx) Component'
        : 'Generated Standalone HTML Output';
    }
    const lockOverlay = document.getElementById('studioCodeLockOverlay');
    if (!accessState.unlocked) {
      if (lockOverlay) lockOverlay.classList.remove('hidden');
      studioCodePre.textContent = isTsx
        ? `// All-Access Pass (${accessState.price || '$4.99'}) required to view & download React TypeScript (.tsx) source`
        : `<!-- All-Access Pass (${accessState.price || '$4.99'}) required to view & download HTML source -->`;
      return;
    }

    if (lockOverlay) lockOverlay.classList.add('hidden');

    const runFetch = async () => {
      const seq = ++sourceFetchSeq;
      const fmt = studioCodeFormat;
      try {
        const result = await fetchLicensedSource(comp, fmt);
        if (seq !== sourceFetchSeq || studioCompId !== comp.id || fmt !== studioCodeFormat) return;
        if (result.locked) {
          accessState.unlocked = false;
          syncAccessUI();
          return;
        }
        studioCodePre.textContent = result.code || result.html;
      } catch (_) {
        if (seq === sourceFetchSeq) {
          studioCodePre.textContent = isTsx
            ? '// Unable to load React TypeScript source from server'
            : '<!-- Unable to load component source from server -->';
        }
      }
    };

    clearTimeout(sourceFetchTimer);
    if (immediate) {
      studioCodePre.textContent = isTsx
        ? '// Compiling customized TypeScript + React (.tsx) on server...'
        : '<!-- Compiling customized HTML on server... -->';
      runFetch();
    } else {
      sourceFetchTimer = setTimeout(runFetch, 180);
    }
  }

  function pushLiveUpdateToStudio(comp, requiresRecompile = false) {
    customizedSet.add(comp.id);
    updateStudioCodeView(comp, false);
    updateGridCardVisuals(comp);
    renderNavigation();

    if (requiresRecompile) {
      clearTimeout(reloadTimer);
      reloadTimer = setTimeout(() => {
        if (studioIframe) {
          mountPreviewIframe(studioIframe, comp, true);
        }
      }, 150);
    } else if (studioIframe && studioIframe.contentWindow) {
      const state = getRuntimeStatePayload(comp);
      studioIframe.contentWindow.postMessage({ type: 'ORIGINKIT_UPDATE_STATE', state }, window.location.origin);
    }
  }

  // Build HTML for a Slider Control
  function buildSliderFieldHtml(id, label, val, min, max, step, unit = '', isRecompile = false) {
    if (ctrlSearchQuery && !label.toLowerCase().includes(ctrlSearchQuery.toLowerCase())) return '';
    return `
      <div class="ok-ctrl-field" data-ctrl-id="${id}" data-recompile="${isRecompile}">
        <div class="ok-ctrl-label-row">
          <label class="ok-ctrl-label">${escapeHtml(label)}</label>
          <span class="ok-ctrl-val-badge" id="badge-${id}">${val}${unit}</span>
        </div>
        <div class="ok-ctrl-slider-row">
          <input type="range" class="ctrl-range-input" data-id="${id}" data-unit="${unit}" min="${min}" max="${max}" step="${step}" value="${val}">
          <input type="number" class="ok-ctrl-num-input ctrl-num-input" data-id="${id}" data-unit="${unit}" min="${min}" max="${max}" step="${step}" value="${val}">
        </div>
      </div>
    `;
  }

  function buildToggleFieldHtml(id, label, val) {
    if (ctrlSearchQuery && !label.toLowerCase().includes(ctrlSearchQuery.toLowerCase())) return '';
    return `
      <div class="ok-ctrl-toggle-row" data-ctrl-id="${id}">
        <span class="ok-ctrl-label">${escapeHtml(label)}</span>
        <button class="ok-toggle-btn ctrl-toggle-btn ${val ? 'on' : ''}" data-id="${id}">
          ${val ? 'ENABLED' : 'DISABLED'}
        </button>
      </div>
    `;
  }

  function buildColorFieldHtml(id, label, val, isRecompile = false) {
    if (ctrlSearchQuery && !label.toLowerCase().includes(ctrlSearchQuery.toLowerCase())) return '';
    return `
      <div class="ok-ctrl-field" data-ctrl-id="${id}" data-recompile="${isRecompile}">
        <div class="ok-ctrl-label-row">
          <label class="ok-ctrl-label">${escapeHtml(label)}</label>
          <span class="ok-ctrl-val-badge" id="badge-${id}">${val.toUpperCase()}</span>
        </div>
        <div class="ok-color-picker-row">
          <input type="color" class="ctrl-color-input" data-id="${id}" value="${val}">
          <input type="text" class="ok-ctrl-text-input ctrl-color-hex" data-id="${id}" value="${val.toUpperCase()}">
        </div>
      </div>
    `;
  }

  function buildTextFieldHtml(id, label, val, isRecompile = false) {
    if (ctrlSearchQuery && !label.toLowerCase().includes(ctrlSearchQuery.toLowerCase())) return '';
    return `
      <div class="ok-ctrl-field" data-ctrl-id="${id}" data-recompile="${isRecompile}">
        <div class="ok-ctrl-label-row">
          <label class="ok-ctrl-label">${escapeHtml(label)}</label>
        </div>
        <input type="text" class="ok-ctrl-text-input ctrl-text-input" data-id="${id}" value="${escapeHtml(val)}">
      </div>
    `;
  }

  function buildSelectFieldHtml(id, label, val, options) {
    if (ctrlSearchQuery && !label.toLowerCase().includes(ctrlSearchQuery.toLowerCase())) return '';
    return `
      <div class="ok-ctrl-field" data-ctrl-id="${id}">
        <div class="ok-ctrl-label-row">
          <label class="ok-ctrl-label">${escapeHtml(label)}</label>
        </div>
        <select class="ok-ctrl-select ctrl-select-input" data-id="${id}">
          ${options.map(opt => `<option value="${escapeHtml(opt)}" ${opt === val ? 'selected' : ''}>${escapeHtml(opt.toUpperCase())}</option>`).join('')}
        </select>
      </div>
    `;
  }

  function renderStudioControls(comp) {
    const cps = comp.controlParameterSet;
    let html = '';

    // TAB 1: SPEEDS & MOTION
    if (studioTab === 'speeds') {
      const sp = cps.speeds;
      html += `
        <div class="ok-ctrl-section">
          <div class="ok-ctrl-section-title">
            <span>UNIVERSAL SPEED &amp; PLAYBACK</span>
            <span>REALTIME 60FPS</span>
          </div>
          ${buildSliderFieldHtml('sp_animationSpeed', sp.animationSpeed.label, sp.animationSpeed.value, sp.animationSpeed.min, sp.animationSpeed.max, sp.animationSpeed.step, 'x')}
          ${buildToggleFieldHtml('sp_autoPlay', sp.autoPlay.label, sp.autoPlay.value)}
          ${buildToggleFieldHtml('sp_reverseDirection', sp.reverseDirection.label, sp.reverseDirection.value)}
          ${buildToggleFieldHtml('sp_autoDrive', sp.autoDrive.label, sp.autoDrive.value)}
          ${buildSliderFieldHtml('sp_dragSensitivity', sp.dragSensitivity.label, sp.dragSensitivity.value, sp.dragSensitivity.min, sp.dragSensitivity.max, sp.dragSensitivity.step, 'x')}
          ${buildSliderFieldHtml('sp_motionSmoothing', sp.motionSmoothing.label, sp.motionSmoothing.value, sp.motionSmoothing.min, sp.motionSmoothing.max, sp.motionSmoothing.step, 'x')}
        </div>
      `;

      if (sp.componentSpeeds.length > 0) {
        html += `
          <div class="ok-ctrl-section">
            <div class="ok-ctrl-section-title">
              <span>COMPONENT-SPECIFIC SPEED PARAMS</span>
              <span>${sp.componentSpeeds.length} PARAMS</span>
            </div>
            ${sp.componentSpeeds.map((p, idx) =>
              buildSliderFieldHtml(`csp_${idx}`, p.label, p.value, p.min, p.max, p.step, '', true)
            ).join('')}
          </div>
        `;
      }
    }

    // TAB 2: EFFECTS & 3D GEOMETRY
    else if (studioTab === 'effects') {
      const ef = cps.effects;
      html += `
        <div class="ok-ctrl-section">
          <div class="ok-ctrl-section-title">
            <span>3D STAGE TRANSFORM &amp; OPTICS</span>
            <span>LIVE MATRIX</span>
          </div>
          ${buildSliderFieldHtml('ef_scale', ef.scale.label, ef.scale.value, ef.scale.min, ef.scale.max, ef.scale.step, 'x')}
          ${buildSliderFieldHtml('ef_perspective', ef.perspective.label, ef.perspective.value, ef.perspective.min, ef.perspective.max, ef.perspective.step, 'px')}
          ${buildSliderFieldHtml('ef_tiltX', ef.tiltX.label, ef.tiltX.value, ef.tiltX.min, ef.tiltX.max, ef.tiltX.step, '°')}
          ${buildSliderFieldHtml('ef_tiltY', ef.tiltY.label, ef.tiltY.value, ef.tiltY.min, ef.tiltY.max, ef.tiltY.step, '°')}
          ${buildSliderFieldHtml('ef_rotateZ', ef.rotateZ.label, ef.rotateZ.value, ef.rotateZ.min, ef.rotateZ.max, ef.rotateZ.step, '°')}
        </div>

        <div class="ok-ctrl-section">
          <div class="ok-ctrl-section-title">
            <span>POST-PROCESSING &amp; SHADER FX</span>
            <span>SVG + GPU</span>
          </div>
          ${buildSliderFieldHtml('ef_glowIntensity', ef.glowIntensity.label, ef.glowIntensity.value, ef.glowIntensity.min, ef.glowIntensity.max, ef.glowIntensity.step, 'px')}
          ${buildColorFieldHtml('ef_glowColor', ef.glowColor.label, ef.glowColor.value)}
          ${buildSliderFieldHtml('ef_blur', ef.blur.label, ef.blur.value, ef.blur.min, ef.blur.max, ef.blur.step, 'px')}
          ${buildSliderFieldHtml('ef_liquidDistortion', ef.liquidDistortion.label, ef.liquidDistortion.value, ef.liquidDistortion.min, ef.liquidDistortion.max, ef.liquidDistortion.step, '')}
          ${buildSliderFieldHtml('ef_liquidFrequency', ef.liquidFrequency.label, ef.liquidFrequency.value, ef.liquidFrequency.min, ef.liquidFrequency.max, ef.liquidFrequency.step, '')}
          ${buildSliderFieldHtml('ef_vignette', ef.vignette.label, ef.vignette.value, ef.vignette.min, ef.vignette.max, ef.vignette.step, '%')}
        </div>
      `;

      if (ef.componentEffects.length > 0) {
        html += `
          <div class="ok-ctrl-section">
            <div class="ok-ctrl-section-title">
              <span>COMPONENT GEOMETRY &amp; SHADER CONSTANTS</span>
              <span>${ef.componentEffects.length} PARAMS</span>
            </div>
            ${ef.componentEffects.map((p, idx) =>
              buildSliderFieldHtml(`cef_${idx}`, `${p.label} (${p.key})`, p.value, p.min, p.max, p.step, '', true)
            ).join('')}
          </div>
        `;
      }
    }

    // TAB 3: COLOURS & PALETTE
    else if (studioTab === 'colours') {
      const col = cps.colours;
      html += `
        <div class="ok-ctrl-section">
          <div class="ok-ctrl-section-title">
            <span>NON-BLUE THEME PRESETS</span>
            <span>1-CLICK GRADE</span>
          </div>
          <div class="ok-preset-grid">
            <button class="ok-preset-btn" data-preset="volcanic">
              <span class="ok-preset-swatch" style="background:#ff5500;"></span> VOLCANIC EMBER
            </button>
            <button class="ok-preset-btn" data-preset="solar">
              <span class="ok-preset-swatch" style="background:#f59e0b;"></span> SOLAR GOLD
            </button>
            <button class="ok-preset-btn" data-preset="lime">
              <span class="ok-preset-swatch" style="background:#84cc16;"></span> TOXIC LIME
            </button>
            <button class="ok-preset-btn" data-preset="crimson">
              <span class="ok-preset-swatch" style="background:#ef4444;"></span> CRIMSON PULSE
            </button>
            <button class="ok-preset-btn" data-preset="noir">
              <span class="ok-preset-swatch" style="background:#e5e5e0;"></span> MONOCHROME NOIR
            </button>
            <button class="ok-preset-btn" data-preset="default">
              <span class="ok-preset-swatch" style="background:#a8a29e;"></span> COMPONENT DEFAULT
            </button>
          </div>
        </div>

        <div class="ok-ctrl-section">
          <div class="ok-ctrl-section-title">
            <span>STAGE &amp; COLOUR GRADING</span>
            <span>LIVE FILTER</span>
          </div>
          ${buildColorFieldHtml('col_backgroundColor', col.backgroundColor.label, col.backgroundColor.value)}
          ${buildSliderFieldHtml('col_hueRotate', col.hueRotate.label, col.hueRotate.value, col.hueRotate.min, col.hueRotate.max, col.hueRotate.step, '°')}
          ${buildSliderFieldHtml('col_saturate', col.saturate.label, col.saturate.value, col.saturate.min, col.saturate.max, col.saturate.step, '%')}
          ${buildSliderFieldHtml('col_brightness', col.brightness.label, col.brightness.value, col.brightness.min, col.brightness.max, col.brightness.step, '%')}
          ${buildSliderFieldHtml('col_contrast', col.contrast.label, col.contrast.value, col.contrast.min, col.contrast.max, col.contrast.step, '%')}
          ${buildSliderFieldHtml('col_sepia', col.sepia.label, col.sepia.value, col.sepia.min, col.sepia.max, col.sepia.step, '%')}
          ${buildSliderFieldHtml('col_invert', col.invert.label, col.invert.value, col.invert.min, col.invert.max, col.invert.step, '%')}
          ${buildColorFieldHtml('col_tintColor', col.tintColor.label, col.tintColor.value)}
          ${buildSliderFieldHtml('col_tintOpacity', col.tintOpacity.label, col.tintOpacity.value, col.tintOpacity.min, col.tintOpacity.max, col.tintOpacity.step, '%')}
        </div>
      `;

      if (col.shaderColorParams.length > 0) {
        html += `
          <div class="ok-ctrl-section">
            <div class="ok-ctrl-section-title">
              <span>WEBGL SHADER VEC3 COLOURS</span>
              <span>${col.shaderColorParams.length} UNIFORMS</span>
            </div>
            ${col.shaderColorParams.map((sc, idx) =>
              buildColorFieldHtml(`scol_${idx}`, sc.label, sc.value, true)
            ).join('')}
          </div>
        `;
      }

      if (col.hexColorParams.length > 0) {
        html += `
          <div class="ok-ctrl-section">
            <div class="ok-ctrl-section-title">
              <span>COMPONENT SOURCE HEX PALETTE</span>
              <span>${col.hexColorParams.length} SWATCHES</span>
            </div>
            ${col.hexColorParams.map((hc, idx) =>
              buildColorFieldHtml(`hcol_${idx}`, hc.label, hc.value, true)
            ).join('')}
          </div>
        `;
      }
    }

    // TAB 4: HTML PROPERTIES & DOM INSPECTOR
    else if (studioTab === 'html') {
      const hp = cps.htmlProperties;
      html += `
        <div class="ok-ctrl-section">
          <div class="ok-ctrl-section-title">
            <span>DOCUMENT &amp; &lt;BODY&gt; HTML PROPERTIES</span>
            <span>DOM ATTRIBUTES</span>
          </div>
          ${buildTextFieldHtml('hp_documentTitle', hp.documentTitle.label, hp.documentTitle.value)}
          ${buildTextFieldHtml('hp_bodyId', hp.bodyId.label, hp.bodyId.value)}
          ${buildTextFieldHtml('hp_bodyClass', hp.bodyClass.label, hp.bodyClass.value)}
          ${buildSelectFieldHtml('hp_bodyDir', hp.bodyDir.label, hp.bodyDir.value, hp.bodyDir.options)}
          ${buildTextFieldHtml('hp_dataTheme', hp.dataTheme.label, hp.dataTheme.value)}
          ${buildSelectFieldHtml('hp_fontFamily', hp.fontFamily.label, hp.fontFamily.value, hp.fontFamily.options)}
          ${buildSelectFieldHtml('hp_overflow', hp.overflow.label, hp.overflow.value, hp.overflow.options)}
          ${buildSliderFieldHtml('hp_opacity', hp.opacity.label, hp.opacity.value, hp.opacity.min, hp.opacity.max, hp.opacity.step, '')}
          ${buildSliderFieldHtml('hp_padding', hp.padding.label, hp.padding.value, hp.padding.min, hp.padding.max, hp.padding.step, 'px')}
        </div>

        <div class="ok-ctrl-section">
          <div class="ok-ctrl-section-title">
            <span>STAGE / CANVAS HTML PROPERTIES</span>
            <span>LAYOUT &amp; BOX</span>
          </div>
          ${buildSliderFieldHtml('hp_stageWidth', hp.stageWidth.label, hp.stageWidth.value, hp.stageWidth.min, hp.stageWidth.max, hp.stageWidth.step, '%')}
          ${buildSliderFieldHtml('hp_stageHeight', hp.stageHeight.label, hp.stageHeight.value, hp.stageHeight.min, hp.stageHeight.max, hp.stageHeight.step, '%')}
          ${buildSliderFieldHtml('hp_borderRadius', hp.borderRadius.label, hp.borderRadius.value, hp.borderRadius.min, hp.borderRadius.max, hp.borderRadius.step, 'px')}
          ${buildSliderFieldHtml('hp_borderWidth', hp.borderWidth.label, hp.borderWidth.value, hp.borderWidth.min, hp.borderWidth.max, hp.borderWidth.step, 'px')}
          ${buildColorFieldHtml('hp_borderColor', hp.borderColor.label, hp.borderColor.value)}
          ${buildSelectFieldHtml('hp_cursor', hp.cursor.label, hp.cursor.value, hp.cursor.options)}
          ${buildSelectFieldHtml('hp_mixBlendMode', hp.mixBlendMode.label, hp.mixBlendMode.value, hp.mixBlendMode.options)}
        </div>
      `;

      if (hp.stringParams.length > 0 || hp.domElements.length > 0) {
        html += `
          <div class="ok-ctrl-section">
            <div class="ok-ctrl-section-title">
              <span>COMPONENT DOM ELEMENTS &amp; TEXT NODES</span>
              <span>${hp.domElements.length + hp.stringParams.length} NODES</span>
            </div>
            ${hp.stringParams.map((sp, idx) =>
              buildTextFieldHtml(`hstr_${idx}`, sp.label, sp.value, true)
            ).join('')}
            ${hp.domElements.map((d, idx) => {
              if (d.type === 'text') return buildTextFieldHtml(`hdom_${idx}`, d.label, d.value);
              if (d.type === 'toggle') return buildToggleFieldHtml(`hdom_${idx}`, d.label, d.value);
              if (d.type === 'color') return buildColorFieldHtml(`hdom_${idx}`, d.label, d.value);
              return '';
            }).join('')}
          </div>
        `;
      }

      if (hp.cssRuleParams.length > 0) {
        html += `
          <div class="ok-ctrl-section">
            <div class="ok-ctrl-section-title">
              <span>COMPONENT CSS SELECTOR PROPERTIES</span>
              <span>${hp.cssRuleParams.length} RULES</span>
            </div>
            ${hp.cssRuleParams.map((r, rIdx) =>
              r.props.map((p, pIdx) =>
                buildTextFieldHtml(`hcss_${rIdx}_${pIdx}`, `${r.selector} { ${p.prop} }`, p.value)
              ).join('')
            ).join('')}
          </div>
        `;
      }
    }

    // TAB 5: CAROUSEL IMAGES REPLACEMENT
    else if (studioTab === 'images') {
      const slots = cps.htmlProperties.imageSlots || [];
      html += `
        <div class="ok-ctrl-section">
          <div class="ok-ctrl-section-title">
            <span>REPLACE CAROUSEL IMAGES (${slots.length} SLOTS)</span>
            <span>FILE OR URL</span>
          </div>
          <div class="ok-img-bulk-bar">
            <label class="ok-file-label-btn" style="flex:1;">
              UPLOAD MULTIPLE IMAGES
              <input type="file" id="bulkImgUploadInput" accept="image/*" multiple>
            </label>
            <button class="ok-btn-secondary" id="resetAllImgsBtn">RESET IMAGES</button>
          </div>
        </div>
      `;

      slots.forEach((slot, idx) => {
        if (ctrlSearchQuery && !slot.label.toLowerCase().includes(ctrlSearchQuery.toLowerCase())) return;
        const isReplaced = slot.value !== slot.defaultValue;
        const thumbSrc = slot.value.startsWith('data:') || slot.value.startsWith('http')
          ? slot.value
          : encodeURI(comp.folderPath + slot.value);
        const displayVal = slot.value.startsWith('data:') ? '[LOCAL UPLOADED IMAGE]' : slot.value;
        html += `
          <div class="ok-img-slot-card ${isReplaced ? 'is-replaced' : ''}">
            <img class="ok-img-thumb" src="${escapeHtml(thumbSrc)}" alt="${escapeHtml(slot.label)}">
            <div class="ok-img-slot-meta">
              <div class="ok-img-slot-header">
                <span class="ok-ctrl-label">${escapeHtml(slot.label)}</span>
                <div class="ok-img-slot-actions">
                  <label class="ok-file-label-btn" style="padding:4px 8px;">
                    UPLOAD
                    <input type="file" class="slot-img-file" data-slot-idx="${idx}" accept="image/*">
                  </label>
                  <button class="ok-icon-btn slot-img-reset" data-slot-idx="${idx}">RESET</button>
                </div>
              </div>
              <input type="text" class="ok-ctrl-text-input slot-img-url" data-slot-idx="${idx}" value="${escapeHtml(displayVal)}" placeholder="PASTE IMAGE URL OR UPLOAD FILE...">
            </div>
          </div>
        `;
      });
    }

    studioControlsScroll.innerHTML = html;
    bindStudioControlEvents(comp);
  }

  function applyControlValueChange(comp, id, newVal) {
    const cps = comp.controlParameterSet;
    let requiresRecompile = false;

    // Speeds
    if (id.startsWith('sp_')) {
      const key = id.slice(3);
      if (cps.speeds[key]) cps.speeds[key].value = newVal;
    } else if (id.startsWith('csp_')) {
      const idx = parseInt(id.slice(4), 10);
      if (cps.speeds.componentSpeeds[idx]) {
        cps.speeds.componentSpeeds[idx].value = Number(newVal);
        requiresRecompile = true;
      }
    }
    // Effects
    else if (id.startsWith('ef_')) {
      const key = id.slice(3);
      if (cps.effects[key]) cps.effects[key].value = newVal;
    } else if (id.startsWith('cef_')) {
      const idx = parseInt(id.slice(4), 10);
      if (cps.effects.componentEffects[idx]) {
        cps.effects.componentEffects[idx].value = Number(newVal);
        requiresRecompile = true;
      }
    }
    // Colours
    else if (id.startsWith('col_')) {
      const key = id.slice(4);
      if (cps.colours[key]) cps.colours[key].value = newVal;
    } else if (id.startsWith('scol_')) {
      const idx = parseInt(id.slice(5), 10);
      if (cps.colours.shaderColorParams[idx]) {
        cps.colours.shaderColorParams[idx].value = String(newVal);
        requiresRecompile = true;
      }
    } else if (id.startsWith('hcol_')) {
      const idx = parseInt(id.slice(5), 10);
      if (cps.colours.hexColorParams[idx]) {
        cps.colours.hexColorParams[idx].value = String(newVal);
        requiresRecompile = true;
      }
    }
    // HTML Properties
    else if (id.startsWith('hp_')) {
      const key = id.slice(3);
      if (cps.htmlProperties[key]) cps.htmlProperties[key].value = newVal;
    } else if (id.startsWith('hstr_')) {
      const idx = parseInt(id.slice(5), 10);
      if (cps.htmlProperties.stringParams[idx]) {
        cps.htmlProperties.stringParams[idx].value = String(newVal);
        requiresRecompile = true;
      }
    } else if (id.startsWith('hdom_')) {
      const idx = parseInt(id.slice(5), 10);
      if (cps.htmlProperties.domElements[idx]) {
        cps.htmlProperties.domElements[idx].value = newVal;
      }
    } else if (id.startsWith('hcss_')) {
      const parts = id.slice(5).split('_');
      const rIdx = parseInt(parts[0], 10);
      const pIdx = parseInt(parts[1], 10);
      if (cps.htmlProperties.cssRuleParams[rIdx] && cps.htmlProperties.cssRuleParams[rIdx].props[pIdx]) {
        cps.htmlProperties.cssRuleParams[rIdx].props[pIdx].value = String(newVal);
      }
    }

    pushLiveUpdateToStudio(comp, requiresRecompile);
  }

  function bindStudioControlEvents(comp) {
    // Range & Number paired inputs
    studioControlsScroll.querySelectorAll('.ctrl-range-input').forEach(rangeEl => {
      rangeEl.addEventListener('input', (e) => {
        const id = rangeEl.getAttribute('data-id');
        const unit = rangeEl.getAttribute('data-unit') || '';
        const val = parseFloat(e.target.value);
        const badge = document.getElementById(`badge-${id}`);
        if (badge) badge.textContent = `${val}${unit}`;
        const numInput = studioControlsScroll.querySelector(`.ctrl-num-input[data-id="${id}"]`);
        if (numInput) numInput.value = val;
        applyControlValueChange(comp, id, val);
      });
    });

    studioControlsScroll.querySelectorAll('.ctrl-num-input').forEach(numEl => {
      numEl.addEventListener('input', (e) => {
        const id = numEl.getAttribute('data-id');
        const unit = numEl.getAttribute('data-unit') || '';
        const val = parseFloat(e.target.value);
        if (Number.isNaN(val)) return;
        const badge = document.getElementById(`badge-${id}`);
        if (badge) badge.textContent = `${val}${unit}`;
        const rangeInput = studioControlsScroll.querySelector(`.ctrl-range-input[data-id="${id}"]`);
        if (rangeInput) rangeInput.value = val;
        applyControlValueChange(comp, id, val);
      });
    });

    // Toggle buttons
    studioControlsScroll.querySelectorAll('.ctrl-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const isNowOn = !btn.classList.contains('on');
        btn.classList.toggle('on', isNowOn);
        btn.textContent = isNowOn ? 'ENABLED' : 'DISABLED';
        applyControlValueChange(comp, id, isNowOn);
      });
    });

    // Color pickers & Hex text inputs
    studioControlsScroll.querySelectorAll('.ctrl-color-input').forEach(colEl => {
      colEl.addEventListener('input', (e) => {
        const id = colEl.getAttribute('data-id');
        const val = e.target.value;
        const badge = document.getElementById(`badge-${id}`);
        if (badge) badge.textContent = val.toUpperCase();
        const hexInput = studioControlsScroll.querySelector(`.ctrl-color-hex[data-id="${id}"]`);
        if (hexInput) hexInput.value = val.toUpperCase();
        applyControlValueChange(comp, id, val);
      });
    });

    studioControlsScroll.querySelectorAll('.ctrl-color-hex').forEach(hexEl => {
      hexEl.addEventListener('change', (e) => {
        const id = hexEl.getAttribute('data-id');
        let val = e.target.value.trim();
        if (!/^#[0-9a-fA-F]{6}$/.test(val)) return;
        const badge = document.getElementById(`badge-${id}`);
        if (badge) badge.textContent = val.toUpperCase();
        const colInput = studioControlsScroll.querySelector(`.ctrl-color-input[data-id="${id}"]`);
        if (colInput) colInput.value = val;
        applyControlValueChange(comp, id, val);
      });
    });

    // Text inputs
    studioControlsScroll.querySelectorAll('.ctrl-text-input').forEach(txtEl => {
      txtEl.addEventListener('input', (e) => {
        const id = txtEl.getAttribute('data-id');
        applyControlValueChange(comp, id, e.target.value);
      });
    });

    // Select dropdowns
    studioControlsScroll.querySelectorAll('.ctrl-select-input').forEach(selEl => {
      selEl.addEventListener('change', (e) => {
        const id = selEl.getAttribute('data-id');
        applyControlValueChange(comp, id, e.target.value);
      });
    });

    // Non-Blue Theme Presets
    studioControlsScroll.querySelectorAll('.ok-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.getAttribute('data-preset');
        const col = comp.controlParameterSet.colours;
        if (preset === 'volcanic') {
          col.backgroundColor.value = '#080504';
          col.hueRotate.value = 155;
          col.saturate.value = 160;
          col.contrast.value = 115;
          col.sepia.value = 25;
          col.tintColor.value = '#ff5500';
          col.tintOpacity.value = 15;
        } else if (preset === 'solar') {
          col.backgroundColor.value = '#090804';
          col.hueRotate.value = 175;
          col.saturate.value = 170;
          col.contrast.value = 110;
          col.sepia.value = 40;
          col.tintColor.value = '#f59e0b';
          col.tintOpacity.value = 15;
        } else if (preset === 'lime') {
          col.backgroundColor.value = '#040804';
          col.hueRotate.value = -95;
          col.saturate.value = 165;
          col.contrast.value = 115;
          col.sepia.value = 10;
          col.tintColor.value = '#84cc16';
          col.tintOpacity.value = 15;
        } else if (preset === 'crimson') {
          col.backgroundColor.value = '#0a0405';
          col.hueRotate.value = 135;
          col.saturate.value = 185;
          col.contrast.value = 120;
          col.sepia.value = 15;
          col.tintColor.value = '#ef4444';
          col.tintOpacity.value = 20;
        } else if (preset === 'noir') {
          col.backgroundColor.value = '#050505';
          col.hueRotate.value = 0;
          col.saturate.value = 0;
          col.contrast.value = 135;
          col.sepia.value = 12;
          col.tintColor.value = '#f5f5f0';
          col.tintOpacity.value = 0;
        } else if (preset === 'default') {
          col.backgroundColor.value = col.backgroundColor.defaultValue;
          col.hueRotate.value = col.hueRotate.defaultValue;
          col.saturate.value = col.saturate.defaultValue;
          col.brightness.value = col.brightness.defaultValue;
          col.contrast.value = col.contrast.defaultValue;
          col.sepia.value = col.sepia.defaultValue;
          col.invert.value = col.invert.defaultValue;
          col.tintOpacity.value = 0;
        }
        renderStudioControls(comp);
        pushLiveUpdateToStudio(comp, false);
        showToast(`APPLIED ${preset.toUpperCase()} PALETTE`);
      });
    });

    // Carousel Image Replacement Handlers (Bulk Upload, Single Slot Upload, URL Replace, Reset)
    const bulkInput = document.getElementById('bulkImgUploadInput');
    if (bulkInput) {
      bulkInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files || []);
        const slots = comp.controlParameterSet.htmlProperties.imageSlots || [];
        if (!files.length || !slots.length) return;
        let pending = Math.min(files.length, slots.length);
        files.slice(0, slots.length).forEach((file, i) => {
          const reader = new FileReader();
          reader.onload = (ev) => {
            slots[i].value = ev.target.result;
            pending--;
            if (pending === 0) {
              renderStudioControls(comp);
              pushLiveUpdateToStudio(comp, true);
              showToast(`REPLACED ${Math.min(files.length, slots.length)} CAROUSEL IMAGES`);
            }
          };
          reader.readAsDataURL(file);
        });
      });
    }

    const resetAllImgsBtn = document.getElementById('resetAllImgsBtn');
    if (resetAllImgsBtn) {
      resetAllImgsBtn.addEventListener('click', () => {
        const slots = comp.controlParameterSet.htmlProperties.imageSlots || [];
        slots.forEach(s => { s.value = s.defaultValue; });
        renderStudioControls(comp);
        pushLiveUpdateToStudio(comp, true);
        showToast('RESTORED ORIGINAL CAROUSEL IMAGES');
      });
    }

    studioControlsScroll.querySelectorAll('.slot-img-file').forEach(input => {
      input.addEventListener('change', (e) => {
        const idx = parseInt(input.getAttribute('data-slot-idx'), 10);
        const file = e.target.files && e.target.files[0];
        const slots = comp.controlParameterSet.htmlProperties.imageSlots || [];
        if (!file || !slots[idx]) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          slots[idx].value = ev.target.result;
          renderStudioControls(comp);
          pushLiveUpdateToStudio(comp, true);
          showToast(`UPDATED ${slots[idx].label}`);
        };
        reader.readAsDataURL(file);
      });
    });

    studioControlsScroll.querySelectorAll('.slot-img-url').forEach(urlInput => {
      urlInput.addEventListener('change', (e) => {
        const idx = parseInt(urlInput.getAttribute('data-slot-idx'), 10);
        const val = e.target.value.trim();
        const slots = comp.controlParameterSet.htmlProperties.imageSlots || [];
        if (!slots[idx] || !val || val === '[LOCAL UPLOADED IMAGE]') return;
        slots[idx].value = val;
        renderStudioControls(comp);
        pushLiveUpdateToStudio(comp, true);
        showToast(`UPDATED ${slots[idx].label}`);
      });
    });

    studioControlsScroll.querySelectorAll('.slot-img-reset').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-slot-idx'), 10);
        const slots = comp.controlParameterSet.htmlProperties.imageSlots || [];
        if (!slots[idx]) return;
        slots[idx].value = slots[idx].defaultValue;
        renderStudioControls(comp);
        pushLiveUpdateToStudio(comp, true);
        showToast(`RESET ${slots[idx].label}`);
      });
    });
  }

  // ========================================================================
  // HOME ACTION & GLOBAL EVENT LISTENERS
  // ========================================================================
  function goHome() {
    if (studioCompId) closeStudio();
    activeSection = 'all';
    activeEngine = 'ALL';
    showOnlyModified = false;
    searchQuery = '';
    if (searchInput) searchInput.value = '';
    document.querySelectorAll('[data-engine-filter]').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-engine-filter') === 'ALL');
    });
    document.getElementById('btnFilterModified')?.classList.remove('active');
    renderNavigation();
    renderGallery();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function initGlobalListeners() {
    // Home Buttons (Topbar, Brand Logo, Studio Header)
    document.getElementById('btnHomeTop')?.addEventListener('click', goHome);
    document.getElementById('brandHomeBtn')?.addEventListener('click', goHome);
    document.getElementById('studioHomeBtn')?.addEventListener('click', goHome);

    // Search input
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        renderGallery();
      });
    }

    // Keyboard shortcuts ('/' to focus search, 'Escape' to close active modal)
    window.addEventListener('keydown', (e) => {
      const activeTag = document.activeElement?.tagName;
      const isTyping = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT';
      if (e.key === '/' && !isTyping && !studioCompId) {
        e.preventDefault();
        searchInput?.focus();
      } else if (e.key === 'Escape') {
        const figmaEl = document.getElementById('figmaBackdrop');
        const aiPromptEl = document.getElementById('aiPromptBackdrop');
        const mcpEl = document.getElementById('mcpBackdrop');
        const checkoutEl = document.getElementById('checkoutBackdrop');
        if (figmaEl?.classList.contains('open')) {
          closeFigmaModal();
        } else if (aiPromptEl?.classList.contains('open')) {
          closeAiPromptModal();
        } else if (mcpEl?.classList.contains('open')) {
          mcpEl.classList.remove('open');
        } else if (checkoutEl?.classList.contains('open')) {
          closeCheckoutModal();
        } else if (studioCompId) {
          closeStudio();
        }
      }
    });

    // Grid Columns Toggle (2, 3, 4)
    document.querySelectorAll('[data-grid-cols]').forEach(btn => {
      btn.addEventListener('click', () => {
        gridCols = parseInt(btn.getAttribute('data-grid-cols'), 10) || 3;
        document.querySelectorAll('[data-grid-cols]').forEach(b => {
          b.classList.toggle('active', parseInt(b.getAttribute('data-grid-cols'), 10) === gridCols);
        });
        document.querySelectorAll('.ok-grid').forEach(g => {
          g.className = `ok-grid cols-${gridCols}`;
        });
        scaleAllCardIframes();
      });
    });

    let resizeRaf = 0;
    window.addEventListener('resize', () => {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;
        scaleAllCardIframes();
      });
    }, { passive: true });

    // Sidebar Engine Filter
    document.querySelectorAll('[data-engine-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeEngine = btn.getAttribute('data-engine-filter');
        document.querySelectorAll('[data-engine-filter]').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-engine-filter') === activeEngine);
        });
        renderGallery();
      });
    });

    // Modified Filter Toggle
    const modFilterBtn = document.getElementById('btnFilterModified');
    if (modFilterBtn) {
      modFilterBtn.addEventListener('click', () => {
        showOnlyModified = !showOnlyModified;
        modFilterBtn.classList.toggle('active', showOnlyModified);
        renderGallery();
      });
    }

    // Global Reset All Button
    const resetAllBtn = document.getElementById('btnResetAll');
    if (resetAllBtn) {
      resetAllBtn.addEventListener('click', () => {
        components.forEach(c => resetComponentToDefault(c));
        renderNavigation();
        renderGallery();
        showToast(`ALL ${components.length} COMPONENTS RESET TO DEFAULTS`);
      });
    }

    // Studio Control Tabs (Speeds, Effects, Colours, HTML Props)
    document.querySelectorAll('[data-studio-tab]').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        studioTab = tabBtn.getAttribute('data-studio-tab');
        document.querySelectorAll('[data-studio-tab]').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-studio-tab') === studioTab);
        });
        const comp = compMap.get(studioCompId);
        if (comp) renderStudioControls(comp);
      });
    });

    // Studio Control Search Filter
    if (ctrlFilterInput) {
      ctrlFilterInput.addEventListener('input', (e) => {
        ctrlSearchQuery = e.target.value.trim();
        const comp = compMap.get(studioCompId);
        if (comp) renderStudioControls(comp);
      });
    }

    // Studio Stage Mode (LIVE, CODE, SPLIT)
    document.querySelectorAll('[data-stage-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        studioStageMode = btn.getAttribute('data-stage-mode');
        document.querySelectorAll('[data-stage-mode]').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-stage-mode') === studioStageMode);
        });
        studioStagePane.classList.remove('mode-live', 'mode-code', 'mode-split');
        studioStagePane.classList.add(`mode-${studioStageMode}`);
      });
    });

    // Studio Output Code Format (HTML vs React TSX)
    document.querySelectorAll('[data-code-format]').forEach(btn => {
      btn.addEventListener('click', () => {
        studioCodeFormat = btn.getAttribute('data-code-format') === 'tsx' ? 'tsx' : 'html';
        document.querySelectorAll('[data-code-format]').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-code-format') === studioCodeFormat);
        });
        syncAccessUI();
      });
    });

    // Studio Viewport Size Presets
    document.querySelectorAll('[data-vp-size]').forEach(btn => {
      btn.addEventListener('click', () => {
        studioViewportSize = btn.getAttribute('data-vp-size');
        document.querySelectorAll('[data-vp-size]').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-vp-size') === studioViewportSize);
        });
        if (studioViewportSize === 'full') {
          studioViewportFrame.style.width = '100%';
          studioViewportFrame.style.height = '100%';
        } else if (studioViewportSize === 'desktop') {
          studioViewportFrame.style.width = '1024px';
          studioViewportFrame.style.height = '640px';
        } else if (studioViewportSize === 'square') {
          studioViewportFrame.style.width = '620px';
          studioViewportFrame.style.height = '620px';
        } else if (studioViewportSize === 'mobile') {
          studioViewportFrame.style.width = '390px';
          studioViewportFrame.style.height = '680px';
        }
      });
    });

    // Studio Prev / Next Component Buttons
    document.getElementById('studioPrevBtn')?.addEventListener('click', () => {
      if (!studioCompId) return;
      const idx = components.findIndex(c => c.id === studioCompId);
      const prevIdx = (idx - 1 + components.length) % components.length;
      studioCompId = components[prevIdx].id;
      mountStudioComponent(components[prevIdx]);
    });

    document.getElementById('studioNextBtn')?.addEventListener('click', () => {
      if (!studioCompId) return;
      const idx = components.findIndex(c => c.id === studioCompId);
      const nextIdx = (idx + 1) % components.length;
      studioCompId = components[nextIdx].id;
      mountStudioComponent(components[nextIdx]);
    });

    // Studio Reset Current Component
    document.getElementById('studioResetBtn')?.addEventListener('click', () => {
      const comp = compMap.get(studioCompId);
      if (!comp) return;
      resetComponentToDefault(comp);
      mountStudioComponent(comp);
      updateGridCardVisuals(comp);
      renderNavigation();
      showToast(`RESET ${comp.name.toUpperCase()} TO DEFAULTS`);
    });

    // Studio Edit in Figma (gated behind All-Access license)
    document.getElementById('studioFigmaBtn')?.addEventListener('click', () => {
      const comp = compMap.get(studioCompId);
      if (!comp) return;
      openFigmaModal(comp);
    });

    // Studio Open AI MCP Remix Prompt Builder (gated behind All-Access license)
    document.getElementById('studioMcpPromptBtn')?.addEventListener('click', () => {
      const comp = compMap.get(studioCompId);
      if (!comp) return;
      if (!accessState.unlocked) {
        openCheckoutModal(() => openAiPromptModal(comp));
        return;
      }
      openAiPromptModal(comp);
    });

    // Studio Copy HTML (gated behind $4.99 All-Access)
    document.getElementById('studioCopyBtn')?.addEventListener('click', () => {
      const comp = compMap.get(studioCompId);
      if (!comp) return;
      copyComponentHtml(comp);
    });

    // Studio Download .HTML File (enforced by server /api/export-html + $4.99 gate)
    document.getElementById('studioDownloadBtn')?.addEventListener('click', () => {
      const comp = compMap.get(studioCompId);
      if (!comp) return;
      exportComponentHtml(comp);
    });

    // Close Studio
    document.getElementById('studioCloseBtn')?.addEventListener('click', closeStudio);
    studioBackdrop?.addEventListener('click', (e) => {
      if (e.target === studioBackdrop) closeStudio();
    });

    // MCP Server + Skill UI Navigation & Modal Bindings
    document.getElementById('btnNavMcp')?.addEventListener('click', () => {
      document.getElementById('mcpSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    document.getElementById('btnOpenMcpModal')?.addEventListener('click', () => {
      document.getElementById('mcpBackdrop')?.classList.add('open');
    });
    document.getElementById('btnCloseMcpModal')?.addEventListener('click', () => {
      document.getElementById('mcpBackdrop')?.classList.remove('open');
    });
    document.getElementById('mcpBackdrop')?.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'mcpBackdrop') {
        document.getElementById('mcpBackdrop')?.classList.remove('open');
      }
    });
    document.getElementById('btnJumpMcpSection')?.addEventListener('click', () => {
      document.getElementById('mcpBackdrop')?.classList.remove('open');
      document.getElementById('mcpSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // Pricing Navigation & Checkout Modal Bindings
    document.getElementById('btnNavPricing')?.addEventListener('click', () => {
      document.getElementById('pricingSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    document.getElementById('btnFreeBrowseScroll')?.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    document.getElementById('btnHeaderPricingCta')?.addEventListener('click', () => {
      if (accessState.unlocked) {
        document.getElementById('pricingSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        openCheckoutModal();
      }
    });
    document.getElementById('btnUnlockLibraryCard')?.addEventListener('click', () => {
      if (!accessState.unlocked) openCheckoutModal(null, 'buy');
    });
    document.getElementById('btnOpenRestoreFromPricing')?.addEventListener('click', () => {
      openCheckoutModal(null, 'restore');
    });
    document.getElementById('btnStudioUnlockOverlay')?.addEventListener('click', () => {
      openCheckoutModal();
    });
    document.getElementById('btnBannerUnlockLibrary')?.addEventListener('click', () => {
      openCheckoutModal();
    });
    document.getElementById('btnCloseCheckout')?.addEventListener('click', closeCheckoutModal);
    document.getElementById('checkoutBackdrop')?.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'checkoutBackdrop') closeCheckoutModal();
    });
    document.querySelectorAll('[data-co-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        setCheckoutModalTab(btn.getAttribute('data-co-tab') || 'buy');
      });
    });
    document.getElementById('btnFillTestCard')?.addEventListener('click', () => {
      const emailEl = document.getElementById('coEmail');
      const nameEl = document.getElementById('coName');
      const cardEl = document.getElementById('coCard');
      const expEl = document.getElementById('coExpiry');
      const cvcEl = document.getElementById('coCvc');
      if (emailEl && !emailEl.value) emailEl.value = 'designer@framevault.dev';
      if (nameEl) nameEl.value = 'Alex Morgan';
      if (cardEl) cardEl.value = '4242 4242 4242 4242';
      if (expEl) expEl.value = '12 / 28';
      if (cvcEl) cvcEl.value = '424';
    });
    document.getElementById('checkoutForm')?.addEventListener('submit', handleCheckoutSubmit);
    document.getElementById('restoreForm')?.addEventListener('submit', handleRestoreSubmit);
    document.getElementById('btnResendLicenseEmail')?.addEventListener('click', handleResendLicenseEmail);
    document.getElementById('btnRelockDemo')?.addEventListener('click', async () => {
      try {
        await fetch('/api/license/lock', { method: 'POST' });
      } catch (_) {}
      accessState = {
        ...accessState,
        unlocked: false,
        licenseKey: null,
        email: null,
        method: null
      };
      syncAccessUI();
      showToast('HTML downloads locked on this device');
    });

    // Topbar Quick Section Navigation Links
    document.querySelectorAll('.ok-top-link[data-quick-sec]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeSection = btn.getAttribute('data-quick-sec') || 'all';
        renderNavigation();
        renderGallery();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    // Topbar Search Focus Button & Open Featured Studio CTA
    document.getElementById('btnTopSearchFocus')?.addEventListener('click', () => {
      if (searchInput) {
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => searchInput.focus(), 180);
      }
    });
    document.getElementById('btnOpenFeaturedStudio')?.addEventListener('click', () => {
      if (components.length > 0) openStudio(components[0].id);
    });

    // 21st.dev Light / Dark Theme Toggle (default Crisp Light)
    document.getElementById('btnThemeToggle')?.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      showToast(isDark ? 'Switched to dark theme' : 'Switched to light theme');
    });

    // Slide-Over Component Index Directory Drawer
    const dirBackdrop = document.getElementById('directoryBackdrop');
    document.getElementById('btnToggleDirectory')?.addEventListener('click', () => {
      dirBackdrop?.classList.add('open');
    });
    document.getElementById('btnCloseDirectory')?.addEventListener('click', () => {
      dirBackdrop?.classList.remove('open');
    });
    dirBackdrop?.addEventListener('click', (e) => {
      if (e.target === dirBackdrop) dirBackdrop.classList.remove('open');
    });
  }

  // Flowing Periwinkle/Cobalt Silk Wave Graphic (matching 21st.dev hero canvas)
  function initHeroWaveCanvas() {
    const canvas = document.getElementById('okHeroWaveCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resizeHero() {
      w = window.innerWidth || 1200;
      h = 320;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener('resize', resizeHero);
    resizeHero();

    const ribbons = [
      { amp: 44, freq: 0.0026, speed: 0.42, phase: 0.0, yRatio: 0.42, color: 'rgba(11, 77, 255, 0.20)' },
      { amp: 56, freq: 0.0021, speed: 0.31, phase: 1.4, yRatio: 0.52, color: 'rgba(99, 102, 241, 0.16)' },
      { amp: 38, freq: 0.0032, speed: 0.50, phase: 2.8, yRatio: 0.46, color: 'rgba(56, 189, 248, 0.14)' }
    ];

    let heroVisible = true;
    let heroRaf = 0;

    function drawWave(now) {
      heroRaf = 0;
      if (!heroVisible || document.hidden || studioCompId) return;
      const t = (now || 0) * 0.001;
      ctx.clearRect(0, 0, w, h);

      for (let r = 0; r < ribbons.length; r++) {
        const rb = ribbons[r];
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, rb.color);
        grad.addColorStop(0.5, 'rgba(99, 128, 255, 0.12)');
        grad.addColorStop(1, 'rgba(11, 77, 255, 0.03)');

        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 28) {
          const y = h * rb.yRatio
            + Math.sin(x * rb.freq + t * rb.speed + rb.phase) * rb.amp
            + Math.cos(x * rb.freq * 1.7 - t * 0.28 + r) * (rb.amp * 0.45);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, 0);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
      }
      heroRaf = requestAnimationFrame(drawWave);
    }

    const startHero = () => {
      if (!heroRaf && heroVisible && !document.hidden && !studioCompId) {
        heroRaf = requestAnimationFrame(drawWave);
      }
    };

    const heroObserver = new IntersectionObserver((entries) => {
      heroVisible = Boolean(entries[0]?.isIntersecting);
      if (heroVisible) startHero();
    }, { threshold: 0.01 });
    heroObserver.observe(canvas);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) startHero();
    });
    window.addEventListener('ok-studio-closed', startHero);
    startHero();
  }

  // ========================================================================
  // $4.99 ALL-ACCESS PRICING, CHECKOUT & SERVER-GATED HTML EXPORT
  // ========================================================================
  async function reloadLibraryFromServer() {
    try {
      const res = await fetch('/api/library', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.sections) && Array.isArray(data.components)) {
        sections = data.sections;
        components = data.components;
        compMap = new Map(components.map(c => [c.id, c]));
        accessState.unlocked = Boolean(data.unlocked);
        renderNavigation();
        renderGallery();
      }
    } catch (_) {}
  }

  function syncAccessUI() {
    const unlocked = Boolean(accessState.unlocked);
    const priceLabel = accessState.price || '$4.99';
    document.querySelectorAll('[data-price-text]').forEach(el => {
      el.textContent = priceLabel;
    });

    const headerBtn = document.getElementById('btnHeaderPricingCta');
    if (headerBtn) {
      headerBtn.textContent = unlocked ? 'All Access Unlocked' : `Get Access · ${priceLabel}`;
      headerBtn.classList.toggle('ok-cta-blue', !unlocked);
      headerBtn.classList.toggle('ok-cta-unlocked', unlocked);
    }

    const bannerEl = document.getElementById('libraryUnlockBanner');
    if (bannerEl) {
      bannerEl.classList.toggle('hidden', unlocked);
    }

    const isTsxFormat = studioCodeFormat === 'tsx';
    const studioDlBtn = document.getElementById('studioDownloadBtn');
    setLockedButtonLabel(
      studioDlBtn,
      isTsxFormat ? 'Download .tsx' : 'Download .html',
      unlocked,
      isTsxFormat ? 'Download TypeScript + React (.tsx)' : 'Download standalone .html',
      `Locked — Pay ${priceLabel} to download ${isTsxFormat ? 'React .tsx' : 'standalone .html'}`
    );

    const studioCopyBtn = document.getElementById('studioCopyBtn');
    setLockedButtonLabel(
      studioCopyBtn,
      isTsxFormat ? 'Copy TSX' : 'Copy HTML',
      unlocked,
      isTsxFormat ? 'Copy customized React TypeScript (.tsx)' : 'Copy customized HTML',
      `Locked — Pay ${priceLabel} to copy ${isTsxFormat ? 'React TSX' : 'HTML'} source`
    );

    const studioFigmaBtn = document.getElementById('studioFigmaBtn');
    setLockedButtonLabel(
      studioFigmaBtn,
      'Figma',
      unlocked,
      'Edit in Figma (copy editable SVG layers or design tokens)',
      `Locked — Pay ${priceLabel} to edit in Figma`
    );

    const studioAiPromptBtn = document.getElementById('studioMcpPromptBtn');
    setLockedButtonLabel(
      studioAiPromptBtn,
      'AI Prompt',
      unlocked,
      'Open AI Remix Prompt builder (originkit-ui MCP)',
      `Locked — Pay ${priceLabel} to unlock AI Remix Prompts & MCP code access`
    );

    const studioCodeModeBtn = document.querySelector('[data-stage-mode="code"]');
    setLockedButtonLabel(
      studioCodeModeBtn,
      'Code',
      unlocked,
      'View standalone HTML source code',
      `Locked — Pay ${priceLabel} to inspect HTML source code`
    );

    setLockedButtonLabel(
      document.getElementById('btnCopyMcpConfigSection'),
      'Copy JSON',
      unlocked,
      'Copy MCP JSON config',
      `Locked — Pay ${priceLabel} to unlock MCP config`
    );
    setLockedButtonLabel(
      document.getElementById('btnCopyMcpConfigModal'),
      'Copy MCP JSON Config',
      unlocked,
      'Copy MCP JSON config',
      `Locked — Pay ${priceLabel} to unlock MCP config`
    );
    setLockedButtonLabel(
      document.getElementById('btnCopySkillMdSection'),
      'Copy SKILL.md',
      unlocked,
      'Copy SKILL.md',
      `Locked — Pay ${priceLabel} to unlock SKILL.md`
    );
    setLockedButtonLabel(
      document.getElementById('btnCopySkillMdModal'),
      'Copy SKILL.md',
      unlocked,
      'Copy SKILL.md',
      `Locked — Pay ${priceLabel} to unlock SKILL.md`
    );
    setLockedButtonLabel(
      document.getElementById('btnPreviewAgentPrompt'),
      'Preview',
      unlocked,
      'Preview and customize AI Remix Prompt',
      `Locked — Pay ${priceLabel} to unlock AI Remix Prompts`
    );
    setLockedButtonLabel(
      document.getElementById('btnCopyAgentPrompt'),
      'Copy Prompt',
      unlocked,
      'Copy AI Remix Prompt',
      `Locked — Pay ${priceLabel} to unlock AI Remix Prompts`
    );

    const studioOverlayBtn = document.getElementById('btnStudioUnlockOverlay');
    if (studioOverlayBtn) {
      studioOverlayBtn.textContent = `Unlock All Access — ${priceLabel}`;
    }

    const statusPill = document.getElementById('pricingStatusPill');
    if (statusPill) {
      statusPill.textContent = unlocked ? 'Unlocked' : `${components.length} Components`;
      statusPill.classList.toggle('unlocked', unlocked);
    }

    const unlockCardBtn = document.getElementById('btnUnlockLibraryCard');
    if (unlockCardBtn) {
      unlockCardBtn.textContent = unlocked ? 'All Access Active' : `Unlock All Access — ${priceLabel}`;
      unlockCardBtn.disabled = unlocked;
    }

    const licenseMeta = document.getElementById('pricingLicenseMeta');
    const licenseKeyText = document.getElementById('pricingLicenseKeyText');
    const restoreWrap = document.getElementById('pricingRestoreWrap');
    const relockBtn = document.getElementById('btnRelockDemo');
    if (licenseMeta && licenseKeyText) {
      licenseMeta.style.display = unlocked ? 'flex' : 'none';
      licenseKeyText.textContent = accessState.licenseKey ? `License: ${accessState.licenseKey}` : '';
    }
    if (restoreWrap) {
      restoreWrap.style.display = unlocked ? 'none' : 'flex';
    }
    if (relockBtn) {
      const isPaidGateway =
        accessState.method === 'stripe' ||
        accessState.method === 'stripe-webhook' ||
        accessState.method === 'razorpay' ||
        accessState.method === 'razorpay-webhook';
      relockBtn.textContent = isPaidGateway ? 'Lock on this device' : 'Lock access';
    }

    // Sync Checkout modal controls to server mode (Razorpay, Stripe, or local demo)
    const demoFields = document.getElementById('coDemoCardFields');
    const submitBtn = document.getElementById('btnCheckoutSubmit');
    const resendBtn = document.getElementById('btnResendLicenseEmail');
    const footNote = document.getElementById('checkoutFootNote');
    const hasLiveGateway = Boolean(accessState.razorpayConfigured || accessState.stripeConfigured);
    const showDemoFields = !hasLiveGateway && Boolean(accessState.demoCheckoutEnabled);
    if (demoFields) {
      demoFields.style.display = showDemoFields ? 'flex' : 'none';
    }
    if (submitBtn) {
      if (accessState.razorpayConfigured) {
        submitBtn.textContent = `Pay with Razorpay — ${priceLabel}`;
      } else if (accessState.stripeConfigured) {
        submitBtn.textContent = `Continue to Stripe Checkout — ${priceLabel}`;
      } else {
        submitBtn.textContent = `Pay ${priceLabel} & Unlock HTML Downloads`;
      }
    }
    if (footNote) {
      const gatewayLabel = accessState.razorpayConfigured
        ? 'Secured by Razorpay (UPI, Cards, NetBanking)'
        : accessState.stripeConfigured
          ? 'Secured by Stripe Checkout'
          : 'Server-verified access';
      footNote.innerHTML = `${gatewayLabel} · Downloads are enforced by <code>/api/export-html</code> (${escapeHtml(priceLabel)} one-time pass).`;
    }
    if (resendBtn) {
      resendBtn.style.display = accessState.emailConfigured ? 'block' : 'none';
    }

    document.querySelectorAll('.btn-download-card').forEach(btn => {
      setLockedButtonLabel(
        btn,
        'HTML',
        unlocked,
        'Download standalone .html',
        `Locked — Pay ${priceLabel} to download standalone .html`
      );
    });
    document.querySelectorAll('.btn-download-tsx').forEach(btn => {
      setLockedButtonLabel(
        btn,
        'TSX',
        unlocked,
        'Download React TypeScript .tsx',
        `Locked — Pay ${priceLabel} to download React TypeScript .tsx`
      );
    });
    document.querySelectorAll('.btn-open-figma').forEach(btn => {
      setLockedButtonLabel(
        btn,
        'Figma',
        unlocked,
        'Edit in Figma (copy editable SVG or design tokens)',
        `Locked — Pay ${priceLabel} to edit in Figma`
      );
    });

    syncSectionPromptPreview();
    if (typeof refreshMcpInfo === 'function' && mcpInfoCache && Boolean(mcpInfoCache.locked) === unlocked) {
      refreshMcpInfo();
    }

    if (studioCompId) {
      const comp = compMap.get(studioCompId);
      if (comp) updateStudioCodeView(comp, true);
    }
  }

  async function fetchAccessStatus() {
    try {
      const params = new URLSearchParams(window.location.search);
      const sid = params.get('session_id');
      const url = sid ? `/api/access-status?session_id=${encodeURIComponent(sid)}` : '/api/access-status';
      const res = await fetch(url);
      if (res.ok) {
        accessState = { ...accessState, ...(await res.json()) };
        syncAccessUI();
        if (sid && accessState.unlocked) {
          window.history.replaceState({}, document.title, window.location.pathname);
          showToast('HTML downloads unlocked across all 50 components!');
        }
      }
    } catch (_) {}
  }

  function setCheckoutModalTab(tab = 'buy') {
    const isRestore = tab === 'restore';
    document.querySelectorAll('[data-co-tab]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-co-tab') === (isRestore ? 'restore' : 'buy'));
    });
    const coForm = document.getElementById('checkoutForm');
    const reForm = document.getElementById('restoreForm');
    if (coForm) coForm.style.display = isRestore ? 'none' : 'flex';
    if (reForm) reForm.style.display = isRestore ? 'flex' : 'none';
    setTimeout(() => {
      document.getElementById(isRestore ? 'restoreLicenseKey' : 'coEmail')?.focus();
    }, 40);
  }

  function openCheckoutModal(onUnlockedAction = null, initialTab = 'buy') {
    pendingPaidAction = onUnlockedAction;
    for (const id of ['checkoutError', 'restoreError']) {
      const errEl = document.getElementById(id);
      if (errEl) {
        errEl.style.display = 'none';
        errEl.textContent = '';
      }
    }
    syncAccessUI();
    const backdrop = document.getElementById('checkoutBackdrop');
    if (backdrop) {
      backdrop.classList.add('open');
      setCheckoutModalTab(initialTab);
    }
  }

  function closeCheckoutModal() {
    document.getElementById('checkoutBackdrop')?.classList.remove('open');
    pendingPaidAction = null;
  }

  let razorpaySdkPromise = null;
  function loadRazorpayCheckoutScript() {
    if (window.Razorpay) return Promise.resolve(window.Razorpay);
    if (razorpaySdkPromise) return razorpaySdkPromise;
    razorpaySdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        if (window.Razorpay) resolve(window.Razorpay);
        else reject(new Error('Razorpay Checkout SDK unavailable'));
      };
      script.onerror = () => {
        razorpaySdkPromise = null;
        reject(new Error('Failed to load Razorpay Checkout SDK'));
      };
      document.head.appendChild(script);
    });
    return razorpaySdkPromise;
  }

  async function handleCheckoutSubmit(e) {
    e.preventDefault();
    const errEl = document.getElementById('checkoutError');
    const submitBtn = document.getElementById('btnCheckoutSubmit');
    const showErr = (msg) => {
      if (errEl) {
        errEl.textContent = msg;
        errEl.style.display = 'block';
      }
    };

    if (errEl) errEl.style.display = 'none';
    if (submitBtn) submitBtn.disabled = true;

    let keepButtonManaged = false;
    try {
      const email = (document.getElementById('coEmail')?.value || '').trim();
      const sessRes = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const sessData = await sessRes.json();
      if (!sessRes.ok) {
        showErr(sessData.error || 'Checkout is currently unavailable.');
        return;
      }

      if (sessData.mode === 'razorpay' && sessData.orderId && sessData.keyId) {
        let RazorpayCtor;
        try {
          RazorpayCtor = await loadRazorpayCheckoutScript();
        } catch (sdkErr) {
          showErr(sdkErr.message || 'Unable to load Razorpay Checkout. Check your internet connection.');
          return;
        }

        keepButtonManaged = true;
        const rzp = new RazorpayCtor({
          key: sessData.keyId,
          amount: sessData.amount,
          currency: sessData.currency || 'INR',
          name: sessData.name || 'FrameVault',
          description: sessData.description || 'FrameVault All-Access Component Library',
          order_id: sessData.orderId,
          prefill: { email: sessData.email || email },
          theme: { color: '#0b4dff' },
          modal: {
            ondismiss: () => {
              if (submitBtn) submitBtn.disabled = false;
            }
          },
          handler: async (response) => {
            try {
              const verifyRes = await fetch('/api/checkout/razorpay/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  email: sessData.email || email
                })
              });
              const verifyData = await verifyRes.json();
              if (!verifyRes.ok || !verifyData.unlocked) {
                showErr(verifyData.error || 'Razorpay payment verification failed.');
                return;
              }
              accessState = { ...accessState, ...verifyData, unlocked: true };
              const callback = pendingPaidAction;
              closeCheckoutModal();
              syncAccessUI();
              showToast(`Paid ${accessState.price || ''} · HTML downloads & source unlocked!`);
              if (typeof callback === 'function') callback();
            } catch (_) {
              showErr('Network error verifying Razorpay payment. Use Restore License if charged.');
            } finally {
              if (submitBtn) submitBtn.disabled = false;
            }
          }
        });
        rzp.on('payment.failed', (resp) => {
          showErr(resp?.error?.description || 'Razorpay payment failed. Please try again.');
          if (submitBtn) submitBtn.disabled = false;
        });
        rzp.open();
        return;
      }

      if (sessData.mode === 'stripe' && sessData.checkoutUrl) {
        window.location.href = sessData.checkoutUrl;
        return;
      }

      const payload = {
        email,
        cardholder: document.getElementById('coName')?.value || '',
        cardNumber: document.getElementById('coCard')?.value || '',
        expiry: document.getElementById('coExpiry')?.value || '',
        cvc: document.getElementById('coCvc')?.value || ''
      };

      const res = await fetch('/api/checkout/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.unlocked) {
        showErr(data.error || 'Payment could not be verified.');
        return;
      }

      accessState = { ...accessState, ...data, unlocked: true };
      const callback = pendingPaidAction;
      closeCheckoutModal();
      syncAccessUI();
      showToast(`Paid ${accessState.price || '$4.99'} · HTML downloads & source unlocked!`);
      if (typeof callback === 'function') callback();
    } catch (_) {
      showErr('Network error verifying payment. Please try again.');
    } finally {
      if (!keepButtonManaged && submitBtn) submitBtn.disabled = false;
    }
  }

  async function handleRestoreSubmit(e) {
    e.preventDefault();
    const errEl = document.getElementById('restoreError');
    const submitBtn = document.getElementById('btnRestoreSubmit');
    const showErr = (msg) => {
      if (errEl) {
        errEl.textContent = msg;
        errEl.style.display = 'block';
      }
    };

    if (errEl) errEl.style.display = 'none';
    if (submitBtn) submitBtn.disabled = true;

    try {
      const licenseKey = (document.getElementById('restoreLicenseKey')?.value || '').trim();
      const email = (document.getElementById('restoreEmail')?.value || '').trim();
      const res = await fetch('/api/license/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey, email })
      });
      const data = await res.json();
      if (!res.ok || !data.unlocked) {
        showErr(data.error || 'Could not restore license.');
        return;
      }

      accessState = { ...accessState, ...data, unlocked: true };
      const callback = pendingPaidAction;
      closeCheckoutModal();
      syncAccessUI();
      showToast(`License ${data.licenseKey} restored!`);
      if (typeof callback === 'function') callback();
    } catch (_) {
      showErr('Network error restoring license. Please try again.');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  async function handleResendLicenseEmail() {
    const errEl = document.getElementById('restoreError');
    const email = (document.getElementById('restoreEmail')?.value || '').trim();
    if (!email) {
      if (errEl) {
        errEl.textContent = 'Enter your purchase email above to resend your license key.';
        errEl.style.display = 'block';
      }
      return;
    }
    try {
      const res = await fetch('/api/license/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resend: true })
      });
      const data = await res.json();
      if (!res.ok) {
        if (errEl) {
          errEl.textContent = data.error || 'Unable to resend license key.';
          errEl.style.display = 'block';
        }
        return;
      }
      if (errEl) errEl.style.display = 'none';
      showToast(data.message || 'Check your inbox for your license key.');
    } catch (_) {
      showToast('Network error sending license email.');
    }
  }

  async function exportComponentHtml(comp, format = studioCodeFormat) {
    const fmt = format === 'tsx' ? 'tsx' : 'html';
    const liveComp = (comp && compMap.get(comp.id)) || comp;
    if (!accessState.unlocked || !liveComp || liveComp.locked) {
      openCheckoutModal(() => exportComponentHtml(liveComp, fmt));
      return;
    }

    const pascalName = String(liveComp.name || 'Component')
      .replace(/[^a-zA-Z0-9]+/g, ' ')
      .trim()
      .split(/\s+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join('') || 'FrameVaultComponent';
    const filename = fmt === 'tsx'
      ? `${pascalName}.tsx`
      : `${liveComp.section}-${liveComp.name.replace(/\s+/g, '-')}-custom.html`;

    try {
      const res = await fetch('/api/export-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: liveComp.id,
          format: fmt,
          filename,
          controlParameterSet: liveComp.controlParameterSet
        })
      });

      if (res.status === 402) {
        accessState.unlocked = false;
        syncAccessUI();
        openCheckoutModal(() => exportComponentHtml(liveComp, fmt));
        return;
      }
      if (!res.ok) {
        showToast('Download failed on server');
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`Downloaded ${filename}`);
    } catch (_) {
      showToast('Download error');
    }
  }

  async function copyComponentHtml(comp, format = studioCodeFormat) {
    const fmt = format === 'tsx' ? 'tsx' : 'html';
    const liveComp = (comp && compMap.get(comp.id)) || comp;
    if (!accessState.unlocked || !liveComp) {
      openCheckoutModal(() => copyComponentHtml(liveComp, fmt));
      return;
    }
    try {
      const result = await fetchLicensedSource(liveComp, fmt);
      if (result.locked) {
        accessState.unlocked = false;
        syncAccessUI();
        openCheckoutModal(() => copyComponentHtml(liveComp, fmt));
        return;
      }
      const label = fmt === 'tsx' ? 'React TypeScript (.tsx)' : 'HTML';
      await copyTextSafe(result.code || result.html, `Copied customized ${label} for ${liveComp.name}`);
    } catch (_) {
      showToast(`Unable to copy ${fmt === 'tsx' ? 'React TSX' : 'HTML'}`);
    }
  }

  // ========================================================================
  // MCP SERVER + AGENT SKILL DELIVERY UI
  // ========================================================================
  let mcpInfoCache = null;
  let activeMcpIde = 'antigravity';
  let activeAiPromptCompId = null;
  let activeFigmaCompId = null;
  let activeFigmaBundle = null;

  function parseCssColorToHexOpacity(rawColor) {
    const s = String(rawColor || '').trim();
    if (!s || s === 'transparent' || s === 'none') return null;
    const m = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i);
    if (!m) return null;
    const r = Math.max(0, Math.min(255, Math.round(Number(m[1]))));
    const g = Math.max(0, Math.min(255, Math.round(Number(m[2]))));
    const b = Math.max(0, Math.min(255, Math.round(Number(m[3]))));
    const a = m[4] !== undefined ? Math.max(0, Math.min(1, Number(m[4]))) : 1;
    if (a <= 0.01) return null;
    const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
    return { r, g, b, a, hex };
  }

  function sanitizeSvgId(raw, fallback) {
    const cleaned = String(raw || '').trim().replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');
    return cleaned || fallback;
  }

  function applyTextTransform(str, transform) {
    if (transform === 'uppercase') return str.toUpperCase();
    if (transform === 'lowercase') return str.toLowerCase();
    if (transform === 'capitalize') return str.replace(/\b\w/g, c => c.toUpperCase());
    return str;
  }

  function getElementZDepth(el, cs) {
    let z = 0;
    const zi = parseFloat(cs.zIndex);
    if (Number.isFinite(zi)) z += zi * 1000;
    const tf = cs.transform;
    if (tf && tf.startsWith('matrix3d(')) {
      const nums = tf.slice(9, -1).split(',').map(Number);
      if (nums.length === 16 && Number.isFinite(nums[14])) {
        z += nums[14];
      }
    }
    return z;
  }

  function renderCanvasToPngDataUrl(srcCanvas, stageBgRgb) {
    const w = srcCanvas.width;
    const h = srcCanvas.height;
    if (!w || !h) return null;

    const maxDim = 1600;
    const scale = Math.min(1, maxDim / Math.max(w, h));
    const outW = Math.max(1, Math.round(w * scale));
    const outH = Math.max(1, Math.round(h * scale));

    const off = document.createElement('canvas');
    off.width = outW;
    off.height = outH;
    const ctx = off.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(srcCanvas, 0, 0, outW, outH);

    // If stage background is pure/near-black and canvas corners are also dark black,
    // knock out black to true alpha with unpremultiplied color recovery so over Stage_Background
    // it is pixel-identical yet completely transparent when moved/recolored in Figma!
    const bgLum = (0.299 * stageBgRgb.r + 0.587 * stageBgRgb.g + 0.114 * stageBgRgb.b) / 255;
    if (bgLum < 0.05) {
      try {
        const imgData = ctx.getImageData(0, 0, outW, outH);
        const d = imgData.data;
        const cornerIdx = [0, (outW - 1) * 4, ((outH - 1) * outW) * 4, (outW * outH - 1) * 4];
        const darkCorners = cornerIdx.every(idx => d[idx] < 18 && d[idx + 1] < 18 && d[idx + 2] < 18);
        if (darkCorners) {
          for (let i = 0; i < d.length; i += 4) {
            const r = d[i], g = d[i + 1], b = d[i + 2];
            const maxC = r > g ? (r > b ? r : b) : (g > b ? g : b);
            if (maxC === 0) {
              d[i + 3] = 0;
            } else {
              const inv = 255 / maxC;
              d[i] = Math.min(255, Math.round(r * inv));
              d[i + 1] = Math.min(255, Math.round(g * inv));
              d[i + 2] = Math.min(255, Math.round(b * inv));
              d[i + 3] = maxC;
            }
          }
          ctx.putImageData(imgData, 0, 0);
        }
      } catch (_) {}
    }

    try {
      return off.toDataURL('image/png');
    } catch (_) {
      return null;
    }
  }

  function renderImgElementToDataUrl(imgEl, targetW, targetH) {
    const nw = imgEl.naturalWidth || imgEl.width;
    const nh = imgEl.naturalHeight || imgEl.height;
    if (!nw || !nh) return null;
    const cw = Math.max(1, Math.min(800, Math.round(targetW * 1.5)));
    const ch = Math.max(1, Math.min(800, Math.round(targetH * 1.5)));
    const off = document.createElement('canvas');
    off.width = cw;
    off.height = ch;
    const ctx = off.getContext('2d');
    if (!ctx) return null;

    // Cover crop matching CSS object-fit: cover
    const srcRatio = nw / nh;
    const dstRatio = cw / ch;
    let sx = 0, sy = 0, sw = nw, sh = nh;
    if (srcRatio > dstRatio) {
      sw = nh * dstRatio;
      sx = (nw - sw) / 2;
    } else {
      sh = nw / dstRatio;
      sy = (nh - sh) / 2;
    }
    try {
      ctx.drawImage(imgEl, sx, sy, sw, sh, 0, 0, cw, ch);
      return off.toDataURL('image/jpeg', 0.88);
    } catch (_) {
      return null;
    }
  }

  async function captureLiveComponentToFigmaSvg(comp, bundle, includeSwatches) {
    const w = bundle.width || 1440;
    const h = bundle.height || 900;

    // Resolve preview URL with ?capture=1 so WebGL preserveDrawingBuffer is enabled
    let previewUrl = `/api/preview/${encodeURIComponent(comp.id)}?capture=1`;
    if (customizedSet.has(comp.id) && comp.controlParameterSet) {
      try {
        const res = await fetch(`/api/preview/${encodeURIComponent(comp.id)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ controlParameterSet: comp.controlParameterSet })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.previewUrl) {
            previewUrl = data.previewUrl + (data.previewUrl.includes('?') ? '&capture=1' : '?capture=1');
          }
        }
      } catch (_) {}
    }

    const iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    iframe.style.position = 'fixed';
    iframe.style.left = '-10000px';
    iframe.style.top = '0';
    iframe.style.width = `${w}px`;
    iframe.style.height = `${h}px`;
    iframe.style.border = '0';
    iframe.style.opacity = '0.01';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);

    try {
      await new Promise((resolve) => {
        const timer = setTimeout(resolve, 3500);
        iframe.onload = () => {
          clearTimeout(timer);
          resolve();
        };
        iframe.src = previewUrl;
      });

      const doc = iframe.contentDocument;
      const win = iframe.contentWindow;
      if (!doc || !win || !doc.body) return null;

      // Wait for all <img> elements inside the preview to finish decoding
      const imgs = Array.from(doc.querySelectorAll('img'));
      if (imgs.length > 0) {
        await Promise.race([
          Promise.all(
            imgs.map(img =>
              img.complete
                ? Promise.resolve()
                : new Promise(r => {
                    img.addEventListener('load', r, { once: true });
                    img.addEventListener('error', r, { once: true });
                  })
            )
          ),
          new Promise(r => setTimeout(r, 2200))
        ]);
      }

      // Let WebGL / Canvas / DOM 3D settle for a few animation frames
      await new Promise(r =>
        win.requestAnimationFrame(() =>
          win.requestAnimationFrame(() =>
            win.requestAnimationFrame(() => setTimeout(r, 160))
          )
        )
      );

      const bodyCs = win.getComputedStyle(doc.body);
      const htmlCs = win.getComputedStyle(doc.documentElement);
      const bgParsed =
        parseCssColorToHexOpacity(bodyCs.backgroundColor) ||
        parseCssColorToHexOpacity(htmlCs.backgroundColor) ||
        { r: 0, g: 0, b: 0, a: 1, hex: bundle.palette?.background || '#000000' };

      const defs = [];
      const canvasLayers = [];
      const domItems = [];
      let patSeq = 0;

      // 1. Capture live <canvas> layers (WebGL 3D shaders & Canvas 2D)
      const canvases = Array.from(doc.querySelectorAll('canvas'));
      canvases.forEach((cv, idx) => {
        const cs = win.getComputedStyle(cv);
        if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) <= 0.01) return;
        const rect = cv.getBoundingClientRect();
        if (rect.width < 2 || rect.height < 2) return;
        const dataUrl = renderCanvasToPngDataUrl(cv, bgParsed);
        if (!dataUrl) return;
        const patId = `fv_canvas_${++patSeq}`;
        const rx = Math.round(parseFloat(cs.borderTopLeftRadius) || 0);
        const op = Number(cs.opacity);
        const opAttr = op < 0.99 ? ` opacity="${op.toFixed(2)}"` : '';
        defs.push(
          `    <pattern id="${patId}" patternUnits="objectBoundingBox" width="1" height="1">` +
          `<image href="${dataUrl}" xlink:href="${dataUrl}" width="${Math.round(rect.width)}" height="${Math.round(rect.height)}" preserveAspectRatio="none" />` +
          `</pattern>`
        );
        canvasLayers.push(
          `    <rect id="${sanitizeSvgId(cv.id || `Rendered_Visual_${idx + 1}`, `Rendered_Visual_${idx + 1}`)}" x="${Math.round(rect.left)}" y="${Math.round(rect.top)}" width="${Math.round(rect.width)}" height="${Math.round(rect.height)}"${rx > 0 ? ` rx="${rx}"` : ''} fill="url(#${patId})"${opAttr} />`
        );
      });

      // 2. Walk live DOM elements (cards, images, buttons, headers, SVGs, text)
      const skipIds = new Set(['ok-tint-layer', 'ok-vignette-layer']);
      const allEls = Array.from(doc.body.querySelectorAll('*'));
      allEls.forEach((el, domIdx) => {
        const tag = el.tagName.toLowerCase();
        if (
          tag === 'script' || tag === 'style' || tag === 'canvas' ||
          tag === 'defs' || tag === 'filter' || tag === 'feturbulence' ||
          tag === 'fedisplacementmap' || tag === 'fecolormatrix' ||
          skipIds.has(el.id)
        ) {
          return;
        }
        // Skip SVG child shapes here (handled by their parent <svg>)
        if (el.closest('svg') && tag !== 'svg') return;

        const cs = win.getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') return;
        const opacity = Number(cs.opacity);
        if (opacity <= 0.02) return;

        const rect = el.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) return;
        if (rect.right < -20 || rect.left > w + 20 || rect.bottom < -20 || rect.top > h + 20) return;

        const z = getElementZDepth(el, cs);

        // A. Inline <svg> overlays (guide lines, icons, apertures)
        if (tag === 'svg') {
          const shapes = [];
          el.querySelectorAll('path, line, circle, ellipse, rect, polyline, polygon').forEach((sh, sIdx) => {
            const scs = win.getComputedStyle(sh);
            if (scs.display === 'none' || scs.visibility === 'hidden') return;
            const shTag = sh.tagName.toLowerCase();
            const fillC = parseCssColorToHexOpacity(scs.fill);
            const strokeC = parseCssColorToHexOpacity(scs.stroke);
            const sw = parseFloat(scs.strokeWidth) || 0;
            if (!fillC && (!strokeC || sw <= 0)) return;
            const fillAttr = fillC ? ` fill="${fillC.hex}"${fillC.a < 0.99 ? ` fill-opacity="${fillC.a.toFixed(2)}"` : ''}` : ' fill="none"';
            const strokeAttr = strokeC && sw > 0
              ? ` stroke="${strokeC.hex}" stroke-width="${sw.toFixed(2)}"${strokeC.a < 0.99 ? ` stroke-opacity="${strokeC.a.toFixed(2)}"` : ''}`
              : '';
            const attrs = ['d', 'x', 'y', 'width', 'height', 'rx', 'cx', 'cy', 'r', 'x1', 'y1', 'x2', 'y2', 'points']
              .filter(a => sh.hasAttribute(a))
              .map(a => ` ${a}="${escapeHtml(sh.getAttribute(a))}"`)
              .join('');
            shapes.push(`      <${shTag} id="${sanitizeSvgId(sh.id || `${shTag}_${sIdx + 1}`, `Vector_${sIdx + 1}`)}"${attrs}${fillAttr}${strokeAttr} />`);
          });
          if (shapes.length > 0) {
            const vb = el.getAttribute('viewBox');
            let transformAttr = ` transform="translate(${Math.round(rect.left)} ${Math.round(rect.top)})"`;
            if (vb) {
              const parts = vb.trim().split(/[\s,]+/).map(Number);
              if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
                const sx = rect.width / parts[2];
                const sy = rect.height / parts[3];
                transformAttr = ` transform="translate(${Math.round(rect.left - parts[0] * sx)} ${Math.round(rect.top - parts[1] * sy)}) scale(${sx.toFixed(4)} ${sy.toFixed(4)})"`;
              }
            }
            const opAttr = opacity < 0.99 ? ` opacity="${opacity.toFixed(2)}"` : '';
            domItems.push({
              z,
              order: domIdx,
              svg: `    <g id="${sanitizeSvgId(el.id || `Vector_Overlay_${domIdx}`, 'Vector_Overlay')}"${transformAttr}${opAttr}>\n${shapes.join('\n')}\n    </g>`
            });
          }
          return;
        }

        // B. <img> elements (carousel photo cards, thumbnails, artwork)
        if (tag === 'img') {
          const dataUrl = renderImgElementToDataUrl(el, rect.width, rect.height);
          if (!dataUrl) return;
          const patId = `fv_img_${++patSeq}`;
          const rx = Math.round(parseFloat(cs.borderTopLeftRadius) || parseFloat(win.getComputedStyle(el.parentElement)?.borderTopLeftRadius) || 0);
          const opAttr = opacity < 0.99 ? ` opacity="${opacity.toFixed(2)}"` : '';
          defs.push(
            `    <pattern id="${patId}" patternUnits="objectBoundingBox" width="1" height="1">` +
            `<image href="${dataUrl}" xlink:href="${dataUrl}" width="${Math.round(rect.width)}" height="${Math.round(rect.height)}" preserveAspectRatio="xMidYMid slice" />` +
            `</pattern>`
          );
          domItems.push({
            z,
            order: domIdx,
            svg: `    <rect id="${sanitizeSvgId(el.alt || el.id || `Card_Image_${patSeq}`, `Card_Image_${patSeq}`)}" x="${Math.round(rect.left)}" y="${Math.round(rect.top)}" width="${Math.round(rect.width)}" height="${Math.round(rect.height)}"${rx > 0 ? ` rx="${rx}"` : ''} fill="url(#${patId})"${opAttr} />`
          });
          return;
        }

        // C. Styled containers / cards / buttons / badges
        const fillC = parseCssColorToHexOpacity(cs.backgroundColor);
        const bw = parseFloat(cs.borderTopWidth) || 0;
        const borderC = bw > 0 ? parseCssColorToHexOpacity(cs.borderTopColor) : null;
        if (fillC || borderC) {
          const rx = Math.round(parseFloat(cs.borderTopLeftRadius) || 0);
          const fillAttr = fillC ? ` fill="${fillC.hex}"${fillC.a < 0.99 ? ` fill-opacity="${fillC.a.toFixed(2)}"` : ''}` : ' fill="none"';
          const strokeAttr = borderC && bw > 0
            ? ` stroke="${borderC.hex}" stroke-width="${bw.toFixed(1)}"${borderC.a < 0.99 ? ` stroke-opacity="${borderC.a.toFixed(2)}"` : ''}`
            : '';
          const opAttr = opacity < 0.99 ? ` opacity="${opacity.toFixed(2)}"` : '';
          const layerId = sanitizeSvgId(el.id || (el.className && typeof el.className === 'string' ? el.className.split(/\s+/)[0] : tag), `${tag}_${domIdx}`);
          domItems.push({
            z,
            order: domIdx,
            svg: `    <rect id="${layerId}" x="${Math.round(rect.left)}" y="${Math.round(rect.top)}" width="${Math.round(rect.width)}" height="${Math.round(rect.height)}"${rx > 0 ? ` rx="${rx}"` : ''}${fillAttr}${strokeAttr}${opAttr} />`
          });
        }

        // D. Direct visible text nodes (exact sub-pixel Range coordinates!)
        for (const child of Array.from(el.childNodes)) {
          if (child.nodeType !== 3) continue;
          const rawText = child.textContent.replace(/\s+/g, ' ').trim();
          if (!rawText) continue;
          const range = doc.createRange();
          range.selectNodeContents(child);
          const tRect = range.getBoundingClientRect();
          if (tRect.width < 1 || tRect.height < 1) continue;
          const txtC = parseCssColorToHexOpacity(cs.color) || { hex: '#ffffff', a: 1 };
          const fontSize = Math.max(8, Math.round(parseFloat(cs.fontSize) || 14));
          const fontWeight = cs.fontWeight || '400';
          const fontFamily = (cs.fontFamily || 'Inter, sans-serif').split(',')[0].replace(/['"]/g, '').trim() || 'Inter';
          const letterSpacing = parseFloat(cs.letterSpacing);
          const lsAttr = Number.isFinite(letterSpacing) && Math.abs(letterSpacing) > 0.1 ? ` letter-spacing="${letterSpacing.toFixed(2)}"` : '';
          const displayText = applyTextTransform(rawText, cs.textTransform);
          const baselineY = Math.round(tRect.top + fontSize * 0.82);
          const opAttr = opacity * txtC.a < 0.99 ? ` fill-opacity="${(opacity * txtC.a).toFixed(2)}"` : '';
          domItems.push({
            z: z + 0.5,
            order: domIdx + 0.5,
            svg: `    <text id="${sanitizeSvgId(displayText.slice(0, 24), `Text_${domIdx}`)}" x="${Math.round(tRect.left)}" y="${baselineY}" fill="${txtC.hex}"${opAttr} font-family="${escapeHtml(fontFamily)}, sans-serif" font-size="${fontSize}" font-weight="${escapeHtml(fontWeight)}"${lsAttr}>${escapeHtml(displayText)}</text>`
          });
        }
      });

      domItems.sort((a, b) => (a.z !== b.z ? a.z - b.z : a.order - b.order));

      if (canvasLayers.length === 0 && domItems.length === 0) return null;

      let swatchXml = '';
      if (includeSwatches && bundle.palette && w >= 640) {
        const pal = bundle.palette;
        const swY = h - 78;
        const swatches = [
          { name: 'BG', hex: bgParsed.hex },
          { name: 'Primary', hex: pal.primary },
          { name: 'Secondary', hex: pal.secondary },
          { name: 'Accent', hex: pal.tertiary }
        ];
        swatchXml = `\n  <g id="Color_Swatches">\n` + swatches.map((sw, idx) => {
          const x = 36 + idx * 144;
          return `    <g id="Swatch_${sw.name}"><rect x="${x}" y="${swY}" width="132" height="44" rx="10" fill="${pal.surface}" stroke="${pal.border}" stroke-width="1" /><rect x="${x + 8}" y="${swY + 8}" width="28" height="28" rx="6" fill="${sw.hex}" /><text x="${x + 44}" y="${swY + 20}" fill="${pal.foreground}" font-family="Inter, sans-serif" font-size="11" font-weight="600">${sw.name}</text><text x="${x + 44}" y="${swY + 34}" fill="${pal.foregroundMuted}" font-family="monospace" font-size="10">${sw.hex.toUpperCase()}</text></g>`;
        }).join('\n') + `\n  </g>`;
      }

      const defsBlock = defs.length > 0 ? `\n  <defs>\n${defs.join('\n')}\n  </defs>` : '';
      const canvasBlock = canvasLayers.length > 0 ? `\n  <g id="Visual_Stage">\n${canvasLayers.join('\n')}\n  </g>` : '';
      const domBlock = domItems.length > 0 ? `\n  <g id="Component_Layers">\n${domItems.map(item => item.svg).join('\n')}\n  </g>` : '';

      // Start directly with <svg ...> (NO <?xml?> header) so Figma Ctrl+V always imports editable layers
      return `<svg id="${sanitizeSvgId(bundle.componentName || comp.name, 'FrameVault')}_Frame" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none">${defsBlock}
  <g id="Stage_Background">
    <rect id="Background_Fill" x="0" y="0" width="${w}" height="${h}" fill="${bgParsed.hex}" />
  </g>${canvasBlock}${domBlock}${swatchXml}
</svg>`;
    } catch (_) {
      return null;
    } finally {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }
  }

  async function refreshFigmaPreview() {
    const comp = compMap.get(activeFigmaCompId);
    const stage = document.getElementById('figmaPreviewStage');
    if (!comp || !stage) return;

    const preset = document.getElementById('figmaFramePreset')?.value || 'desktop';
    const includeSwatches = Boolean(document.getElementById('figmaIncludeSwatches')?.checked);
    stage.innerHTML = '<span style="color:var(--text-muted);font-size:12.5px;">Capturing live component layers for Figma...</span>';

    try {
      const res = await fetch('/api/figma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: comp.id,
          preset,
          includeSwatches,
          controlParameterSet: comp.controlParameterSet
        })
      });
      if (res.status === 402) {
        closeFigmaModal();
        accessState.unlocked = false;
        syncAccessUI();
        openCheckoutModal(() => openFigmaModal(comp));
        return;
      }
      if (!res.ok) {
        stage.innerHTML = '<span style="color:#ef4444;font-size:12.5px;">Unable to generate Figma preview.</span>';
        return;
      }
      const bundle = await res.json();
      const liveSvg = await captureLiveComponentToFigmaSvg(comp, bundle, includeSwatches);
      if (activeFigmaCompId !== comp.id) return;
      if (liveSvg) {
        bundle.svg = liveSvg;
      }
      activeFigmaBundle = bundle;
      const svgBlob = new Blob([bundle.svg], { type: 'image/svg+xml;charset=utf-8' });
      const blobUrl = URL.createObjectURL(svgBlob);
      const prevUrl = stage.dataset.blobUrl;
      if (prevUrl) URL.revokeObjectURL(prevUrl);
      stage.dataset.blobUrl = blobUrl;
      stage.innerHTML = `<img src="${blobUrl}" alt="${escapeHtml(bundle.componentName)} editable Figma preview">`;
    } catch (_) {
      stage.innerHTML = '<span style="color:#ef4444;font-size:12.5px;">Network error generating Figma layers.</span>';
    }
  }

  async function openFigmaModal(comp) {
    const liveComp = (comp && compMap.get(comp.id)) || comp;
    if (!liveComp) return;
    if (!accessState.unlocked) {
      openCheckoutModal(() => openFigmaModal(liveComp));
      return;
    }
    activeFigmaCompId = liveComp.id;
    activeFigmaBundle = null;
    await ensureComponentParams(liveComp);

    const badgeEl = document.getElementById('figmaCompBadge');
    const titleEl = document.getElementById('figmaModalTitle');
    if (badgeEl) badgeEl.textContent = `Editable Figma · ${liveComp.section.toUpperCase()} / ${liveComp.name.toUpperCase()}`;
    if (titleEl) titleEl.textContent = `Edit in Figma — ${liveComp.displayTitle}`;

    document.getElementById('figmaBackdrop')?.classList.add('open');
    await refreshFigmaPreview();
  }

  function closeFigmaModal() {
    document.getElementById('figmaBackdrop')?.classList.remove('open');
  }

  async function exportFigmaFile(format = 'svg') {
    const comp = compMap.get(activeFigmaCompId);
    if (!comp) return;
    if (!accessState.unlocked) {
      closeFigmaModal();
      openCheckoutModal(() => openFigmaModal(comp));
      return;
    }
    const preset = document.getElementById('figmaFramePreset')?.value || 'desktop';
    const includeSwatches = Boolean(document.getElementById('figmaIncludeSwatches')?.checked);
    try {
      const res = await fetch('/api/export-figma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: comp.id,
          format,
          preset,
          includeSwatches,
          controlParameterSet: comp.controlParameterSet,
          ...(format === 'svg' && activeFigmaBundle?.svg ? { clientSvg: activeFigmaBundle.svg } : {})
        })
      });
      if (res.status === 402) {
        closeFigmaModal();
        accessState.unlocked = false;
        syncAccessUI();
        openCheckoutModal(() => openFigmaModal(comp));
        return;
      }
      if (!res.ok) {
        showToast('Figma export failed on server');
        return;
      }
      const blob = await res.blob();
      const filename = format === 'tokens'
        ? (activeFigmaBundle?.filenameTokens || `${comp.name}.figma-tokens.json`)
        : (activeFigmaBundle?.filenameSvg || `${comp.name}-figma.svg`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`Downloaded ${filename}`);
    } catch (_) {
      showToast('Figma download error');
    }
  }

  function formatMcpComponentId(comp) {
    const secSlug = String(comp.section || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const nameSlug = String(comp.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return `${secSlug}/${nameSlug}`;
  }

  function collectStudioOverrides(comp) {
    if (!comp || !comp.controlParameterSet) return [];
    const cps = comp.controlParameterSet;
    const overrides = [];

    const checkGroup = (group, groupName, skipKeys = new Set()) => {
      if (!group || typeof group !== 'object') return;
      Object.entries(group).forEach(([key, param]) => {
        if (skipKeys.has(key)) return;
        if (!param || typeof param !== 'object' || !('defaultValue' in param)) return;
        if (param.value !== param.defaultValue) {
          const unit = param.unit ? param.unit : '';
          overrides.push(`${groupName}.${key}: ${param.value}${unit}`);
        }
      });
    };

    checkGroup(cps.speeds, 'speeds', new Set(['componentSpeeds']));
    (cps.speeds?.componentSpeeds || []).forEach(p => {
      if (p && p.value !== p.defaultValue) overrides.push(`speed(${p.label || p.varName}): ${p.value}`);
    });

    checkGroup(cps.effects, 'effects', new Set(['componentEffects']));
    (cps.effects?.componentEffects || []).forEach(p => {
      if (p && p.value !== p.defaultValue) overrides.push(`effect(${p.label || p.varName}): ${p.value}`);
    });

    checkGroup(cps.colours, 'colours', new Set(['hexColorParams', 'shaderColorParams']));
    (cps.colours?.hexColorParams || []).forEach(p => {
      if (p && p.value !== p.defaultValue) overrides.push(`color(${p.label || p.defaultValue}): ${p.value}`);
    });
    (cps.colours?.shaderColorParams || []).forEach(p => {
      if (p && p.value !== p.defaultValue) overrides.push(`shaderColor(${p.label || p.varName}): ${p.value}`);
    });

    checkGroup(cps.htmlProperties, 'html', new Set(['domElements', 'cssRuleParams', 'stringParams', 'imageSlots']));
    (cps.htmlProperties?.domElements || []).forEach(p => {
      if (p && p.value !== p.defaultValue) overrides.push(`dom(${p.label || p.selector}): ${JSON.stringify(p.value)}`);
    });
    (cps.htmlProperties?.stringParams || []).forEach(p => {
      if (p && p.value !== p.defaultValue) overrides.push(`text(${p.label || 'copy'}): ${JSON.stringify(p.value)}`);
    });

    return overrides.slice(0, 14);
  }

  function buildMcpPromptText(comp, options = {}) {
    const mcpId = formatMcpComponentId(comp);
    const framework = String(options.targetFramework || '').trim();
    const frameworkArg = framework
      ? `get_component("${mcpId}", { targetFramework: "${framework}" })`
      : `get_component("${mcpId}")`;
    const frameworkClause = framework
      ? `port it cleanly to ${framework}, `
      : `adapt it to my project's framework, `;

    const lines = [
      `Use the originkit-ui MCP server: read ui://guidelines/design-system, call ${frameworkArg} to fetch "${comp.displayTitle}", inspect my project's CSS variables / Tailwind config, and follow the returned Remix Prompt to ${frameworkClause}adapting its colors and copy cleanly without breaking layout or 60fps animations.`
    ];

    if (options.includeStudioEdits) {
      const overrides = collectStudioOverrides(comp);
      if (overrides.length > 0) {
        lines.push('');
        lines.push('Preserve these Studio parameter tweaks:');
        overrides.forEach(item => lines.push(`- ${item}`));
      }
    }

    return lines.join('\n');
  }

  function fallbackCopyText(text) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-9999px';
      ta.style.left = '-9999px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return Boolean(ok);
    } catch (_) {
      return false;
    }
  }

  async function copyTextSafe(text, toastMsg, buttonEl = null) {
    let copied = false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        copied = true;
      } catch (_) {
        copied = fallbackCopyText(text);
      }
    } else {
      copied = fallbackCopyText(text);
    }

    if (copied) {
      if (toastMsg) showToast(toastMsg);
      if (buttonEl) {
        const origLabel = buttonEl.dataset.origLabel || buttonEl.textContent;
        buttonEl.dataset.origLabel = origLabel;
        buttonEl.textContent = 'Copied!';
        clearTimeout(buttonEl.__okCopyTimer);
        buttonEl.__okCopyTimer = setTimeout(() => {
          buttonEl.textContent = origLabel;
        }, 1600);
      }
    } else {
      showToast('Clipboard blocked by browser — select the text and press Ctrl+C');
    }
    return copied;
  }

  async function copyMcpAgentPrompt(comp, options = {}, buttonEl = null) {
    return copyTextSafe(
      buildMcpPromptText(comp, options),
      `Copied AI MCP prompt for ${comp.name}`,
      buttonEl
    );
  }

  function syncAiPromptModalText() {
    const comp = compMap.get(activeAiPromptCompId);
    const textarea = document.getElementById('aiPromptTextarea');
    const fwSelect = document.getElementById('aiPromptFramework');
    const editsCheckbox = document.getElementById('aiPromptIncludeEdits');
    if (!comp || !textarea) return;
    textarea.value = buildMcpPromptText(comp, {
      targetFramework: fwSelect?.value || '',
      includeStudioEdits: Boolean(editsCheckbox?.checked)
    });
  }

  function openAiPromptModal(comp) {
    if (!comp) return;
    if (!accessState.unlocked) {
      openCheckoutModal(() => openAiPromptModal(comp));
      return;
    }
    activeAiPromptCompId = comp.id;

    const backdrop = document.getElementById('aiPromptBackdrop');
    const badgeEl = document.getElementById('aiPromptCompBadge');
    const titleEl = document.getElementById('aiPromptModalTitle');
    const editsWrap = document.getElementById('aiPromptIncludeEditsWrap');
    const editsCheckbox = document.getElementById('aiPromptIncludeEdits');
    const editsLabel = document.getElementById('aiPromptIncludeEditsLabel');

    const mcpId = formatMcpComponentId(comp);
    if (badgeEl) badgeEl.textContent = `originkit-ui · ${mcpId}`;
    if (titleEl) titleEl.textContent = `AI Prompt — ${comp.displayTitle}`;

    const overrides = collectStudioOverrides(comp);
    if (editsCheckbox && editsLabel && editsWrap) {
      if (overrides.length > 0) {
        editsCheckbox.disabled = false;
        editsCheckbox.checked = true;
        editsWrap.classList.remove('is-disabled');
        editsLabel.textContent = `Include ${overrides.length} current Studio customization${overrides.length === 1 ? '' : 's'}`;
      } else {
        editsCheckbox.checked = false;
        editsCheckbox.disabled = true;
        editsWrap.classList.add('is-disabled');
        editsLabel.textContent = 'No Studio customizations yet (using default component parameters)';
      }
    }

    syncAiPromptModalText();
    backdrop?.classList.add('open');

    const textarea = document.getElementById('aiPromptTextarea');
    if (textarea) {
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(0, textarea.value.length);
      }, 40);
    }
  }

  function closeAiPromptModal() {
    document.getElementById('aiPromptBackdrop')?.classList.remove('open');
  }

  function syncSectionPromptPreview() {
    const selectEl = document.getElementById('mcpPromptCompSelect');
    const previewEl = document.getElementById('mcpPromptPreview');
    if (!previewEl) return;
    if (!accessState.unlocked) {
      previewEl.textContent = `Locked — Unlock FrameVault All-Access (${accessState.price || '$4.99'}) to generate & copy AI Remix Prompts.`;
      return;
    }
    const comp = compMap.get(selectEl?.value) || components[0];
    if (!comp) return;
    previewEl.textContent = buildMcpPromptText(comp);
  }

  function renderMcpIdeConfig(ideKey) {
    activeMcpIde = ideKey;
    document.querySelectorAll('[data-mcp-ide]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-mcp-ide') === ideKey);
    });
    if (!mcpInfoCache || !mcpInfoCache.configs) return;
    const cfg = mcpInfoCache.configs[ideKey] || mcpInfoCache.configs.antigravity;
    if (!cfg) return;

    const secPre = document.getElementById('mcpSectionConfigPre');
    const modPre = document.getElementById('mcpModalConfigPre');
    const secHint = document.getElementById('mcpSectionFileHint');
    const modHint = document.getElementById('mcpModalFileHint');
    if (secPre) secPre.textContent = cfg.json;
    if (modPre) modPre.textContent = cfg.json;
    if (secHint) secHint.textContent = cfg.fileHint;
    if (modHint) modHint.textContent = cfg.fileHint;
  }

  async function refreshMcpInfo() {
    try {
      const res = await fetch('/api/mcp-info', { cache: 'no-store' });
      if (!res.ok) return;
      mcpInfoCache = await res.json();
      const statusText = mcpInfoCache.ready
        ? `MCP Server Ready · ${mcpInfoCache.indexedCount} components indexed`
        : 'MCP Server Not Built';
      const secPill = document.getElementById('mcpStatusPill');
      const modPill = document.getElementById('mcpModalStatusPill');
      if (secPill) secPill.textContent = statusText;
      if (modPill) modPill.textContent = statusText;
      renderMcpIdeConfig(activeMcpIde);
    } catch (_) {}
  }

  async function initMcpIntegration() {
    // Populate component selector for AI prompt builder
    const selectEl = document.getElementById('mcpPromptCompSelect');
    if (selectEl) {
      selectEl.innerHTML = components
        .map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.section.toUpperCase())} / ${escapeHtml(c.name)} — ${escapeHtml(c.displayTitle)}</option>`)
        .join('');
      selectEl.addEventListener('change', syncSectionPromptPreview);
      syncSectionPromptPreview();
    }

    document.querySelectorAll('[data-mcp-ide]').forEach(btn => {
      btn.addEventListener('click', () => {
        const ide = btn.getAttribute('data-mcp-ide') || 'antigravity';
        renderMcpIdeConfig(ide);
      });
    });

    const copyCurrentConfig = async (e) => {
      const btnEl = e?.currentTarget || null;
      if (!accessState.unlocked) {
        openCheckoutModal(async () => {
          await refreshMcpInfo();
          const cfg = mcpInfoCache?.configs?.[activeMcpIde] || mcpInfoCache?.configs?.antigravity;
          if (cfg?.json && !mcpInfoCache?.locked) {
            copyTextSafe(cfg.json, `Copied ${cfg.label} MCP JSON config`, btnEl);
          }
        });
        return;
      }
      if (mcpInfoCache?.locked) await refreshMcpInfo();
      const cfg = mcpInfoCache?.configs?.[activeMcpIde] || mcpInfoCache?.configs?.antigravity;
      if (cfg?.json && !mcpInfoCache?.locked) {
        copyTextSafe(cfg.json, `Copied ${cfg.label} MCP JSON config`, btnEl);
      } else {
        showToast('Start server.js (http://localhost:3000) to load MCP JSON config');
      }
    };
    const copySkillMd = async (e) => {
      const btnEl = e?.currentTarget || null;
      if (!accessState.unlocked) {
        openCheckoutModal(async () => {
          await refreshMcpInfo();
          if (mcpInfoCache?.skillMarkdown) {
            copyTextSafe(mcpInfoCache.skillMarkdown, 'Copied SKILL.md for .agent/skills/ & .claude/skills/', btnEl);
          }
        });
        return;
      }
      if (mcpInfoCache?.locked) await refreshMcpInfo();
      if (mcpInfoCache?.skillMarkdown) {
        copyTextSafe(mcpInfoCache.skillMarkdown, 'Copied SKILL.md for .agent/skills/ & .claude/skills/', btnEl);
      } else {
        showToast('Start server.js (http://localhost:3000) to load SKILL.md');
      }
    };

    document.getElementById('btnCopyMcpConfigSection')?.addEventListener('click', copyCurrentConfig);
    document.getElementById('btnCopyMcpConfigModal')?.addEventListener('click', copyCurrentConfig);
    document.getElementById('btnCopySkillMdSection')?.addEventListener('click', copySkillMd);
    document.getElementById('btnCopySkillMdModal')?.addEventListener('click', copySkillMd);
    document.getElementById('btnPreviewAgentPrompt')?.addEventListener('click', () => {
      const selId = document.getElementById('mcpPromptCompSelect')?.value;
      const comp = compMap.get(selId) || components[0];
      if (!comp) return;
      if (!accessState.unlocked) {
        openCheckoutModal(() => openAiPromptModal(comp));
        return;
      }
      openAiPromptModal(comp);
    });
    document.getElementById('btnCopyAgentPrompt')?.addEventListener('click', (e) => {
      const btnEl = e.currentTarget;
      const selId = document.getElementById('mcpPromptCompSelect')?.value;
      const comp = compMap.get(selId) || components[0];
      if (!comp) return;
      if (!accessState.unlocked) {
        openCheckoutModal(() => copyMcpAgentPrompt(comp, {}, btnEl));
        return;
      }
      copyMcpAgentPrompt(comp, {}, btnEl);
    });

    // AI Remix Prompt Modal bindings
    document.getElementById('btnCloseAiPromptModal')?.addEventListener('click', closeAiPromptModal);
    document.getElementById('aiPromptBackdrop')?.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'aiPromptBackdrop') closeAiPromptModal();
    });
    document.getElementById('aiPromptFramework')?.addEventListener('change', syncAiPromptModalText);
    document.getElementById('aiPromptIncludeEdits')?.addEventListener('change', syncAiPromptModalText);
    document.getElementById('btnCopyAiPromptModal')?.addEventListener('click', (e) => {
      if (!accessState.unlocked) {
        closeAiPromptModal();
        openCheckoutModal();
        return;
      }
      const textarea = document.getElementById('aiPromptTextarea');
      const comp = compMap.get(activeAiPromptCompId);
      const text = textarea?.value?.trim();
      if (!text) return;
      copyTextSafe(text, `Copied AI prompt${comp ? ` for ${comp.name}` : ''}`, e.currentTarget);
    });
    document.getElementById('btnSelectAiPromptModal')?.addEventListener('click', () => {
      const textarea = document.getElementById('aiPromptTextarea');
      if (!textarea) return;
      textarea.focus();
      textarea.select();
      showToast('Prompt selected — press Ctrl+C to copy');
    });
    document.getElementById('btnOpenMcpFromPrompt')?.addEventListener('click', () => {
      closeAiPromptModal();
      document.getElementById('mcpBackdrop')?.classList.add('open');
    });

    // Edit in Figma Modal bindings
    document.getElementById('btnCloseFigmaModal')?.addEventListener('click', closeFigmaModal);
    document.getElementById('figmaBackdrop')?.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'figmaBackdrop') closeFigmaModal();
    });
    document.getElementById('figmaFramePreset')?.addEventListener('change', refreshFigmaPreview);
    document.getElementById('figmaIncludeSwatches')?.addEventListener('change', refreshFigmaPreview);
    document.getElementById('btnCopyFigmaSvg')?.addEventListener('click', (e) => {
      if (!activeFigmaBundle?.svg) {
        showToast('Generating Figma SVG — try again in a moment');
        return;
      }
      copyTextSafe(
        activeFigmaBundle.svg,
        'Copied editable Figma SVG — press Ctrl+V on any Figma canvas!',
        e.currentTarget
      );
    });
    document.getElementById('btnDownloadFigmaSvg')?.addEventListener('click', () => exportFigmaFile('svg'));
    document.getElementById('btnDownloadFigmaTokens')?.addEventListener('click', () => exportFigmaFile('tokens'));

    await refreshMcpInfo();
  }

  // Initialize App
  renderNavigation();
  renderGallery();
  initGlobalListeners();
  syncAccessUI();
  initHeroWaveCanvas();
  fetchAccessStatus();
  initMcpIntegration();
})();
