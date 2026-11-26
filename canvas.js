// ==========================================================================
// FRAMEVAULT // INTERACTIVE WEBSITE DESIGN CANVAS
// Compose full website layouts using live components from the store directory
// ==========================================================================

(() => {
  const STORAGE_KEY = 'framevault_canvas_state_v1';
  const VIEWPORT_WIDTHS = {
    desktop: 1280,
    tablet: 768,
    mobile: 390
  };
  const DIR_PAGE_SIZE = 48;

  // DOM References
  const shellEl = document.getElementById('canvasShell');
  const stageViewportEl = document.getElementById('canvasStageViewport');
  const artboardOuterEl = document.getElementById('canvasArtboardOuter');
  const artboardEl = document.getElementById('canvasArtboard');
  const layersHostEl = document.getElementById('canvasLayersHost');
  const emptyHintEl = document.getElementById('canvasEmptyHint');
  const guideVEl = document.getElementById('canvasGuideV');
  const guideHEl = document.getElementById('canvasGuideH');
  const dimsLabelEl = document.getElementById('canvasArtboardDimsLabel');

  const dirSearchEl = document.getElementById('canvasDirSearch');
  const dirCatsEl = document.getElementById('canvasDirCats');
  const dirListEl = document.getElementById('canvasDirList');
  const dirTotalBadgeEl = document.getElementById('canvasDirTotalBadge');

  const layersListEl = document.getElementById('canvasLayersList');
  const layerCountBadgeEl = document.getElementById('canvasLayerCountBadge');
  const navCanvasCountBadgeEl = document.getElementById('navCanvasCountBadge');
  const webglBudgetEl = document.getElementById('canvasWebglBudget');

  const inspectorTitleEl = document.getElementById('canvasInspectorTitle');
  const inspectorBadgeEl = document.getElementById('canvasInspectorBadge');
  const inspectorBodyEl = document.getElementById('canvasInspectorBody');

  const undoBtn = document.getElementById('btnCanvasUndo');
  const redoBtn = document.getElementById('btnCanvasRedo');
  const snapBtn = document.getElementById('btnCanvasSnap');
  const fullscreenBtn = document.getElementById('btnCanvasFullscreen');
  const templateSelectEl = document.getElementById('canvasTemplateSelect');

  if (!shellEl || !artboardEl || !layersHostEl) return;

  // Catalog access helpers
  function getCatalogComponents() {
    if (window.FrameVaultApp && typeof window.FrameVaultApp.getComponents === 'function') {
      return window.FrameVaultApp.getComponents() || [];
    }
    return window.ORIGINKIT_COMPONENTS || [];
  }

  function getCatalogSections() {
    if (window.FrameVaultApp && typeof window.FrameVaultApp.getSections === 'function') {
      return window.FrameVaultApp.getSections() || [];
    }
    return window.ORIGINKIT_SECTIONS || [];
  }

  function getComponentById(id) {
    if (window.FrameVaultApp && typeof window.FrameVaultApp.getComponentById === 'function') {
      return window.FrameVaultApp.getComponentById(id);
    }
    return getCatalogComponents().find(c => c.id === id) || null;
  }

  function toast(msg) {
    if (window.FrameVaultApp && typeof window.FrameVaultApp.showToast === 'function') {
      window.FrameVaultApp.showToast(msg);
    }
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function uid(prefix = 'layer') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }

  // ========================================================================
  // CANVAS STATE & HISTORY
  // ========================================================================
  const state = {
    mode: 'edit', // 'edit' | 'interact'
    viewport: 'desktop', // 'desktop' | 'tablet' | 'mobile'
    zoomMode: 'fit', // 'fit' | '0.75' | '1'
    computedScale: 0.72,
    snap: true,
    snapSize: 16,
    showGrid: true,
    isFullscreen: false,
    pageBg: '#09090b',
    pageHeight: 1200,
    selectedId: null,
    dirCategory: 'all',
    dirSearch: '',
    dirLimit: DIR_PAGE_SIZE,
    layers: []
  };

  let undoStack = [];
  let redoStack = [];
  const MAX_HISTORY = 40;

  function snapshotState() {
    return JSON.stringify({
      pageBg: state.pageBg,
      pageHeight: state.pageHeight,
      viewport: state.viewport,
      layers: state.layers
    });
  }

  function pushHistory() {
    undoStack.push(snapshotState());
    if (undoStack.length > MAX_HISTORY) undoStack.shift();
    redoStack = [];
    syncHistoryButtons();
  }

  function syncHistoryButtons() {
    if (undoBtn) undoBtn.disabled = undoStack.length === 0;
    if (redoBtn) redoBtn.disabled = redoStack.length === 0;
  }

  function restoreSnapshot(jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      state.pageBg = parsed.pageBg || '#09090b';
      state.pageHeight = clamp(Number(parsed.pageHeight) || 1200, 600, 4800);
      if (parsed.viewport && VIEWPORT_WIDTHS[parsed.viewport]) {
        state.viewport = parsed.viewport;
      }
      state.layers = Array.isArray(parsed.layers) ? parsed.layers : [];
      if (state.selectedId && !state.layers.some(l => l.id === state.selectedId)) {
        state.selectedId = null;
      }
      saveToStorage();
      renderAll();
    } catch (_) {}
  }

  function undo() {
    if (undoStack.length === 0) return;
    redoStack.push(snapshotState());
    const prev = undoStack.pop();
    restoreSnapshot(prev);
    syncHistoryButtons();
    toast('Undid last canvas change');
  }

  function redo() {
    if (redoStack.length === 0) return;
    undoStack.push(snapshotState());
    const next = redoStack.pop();
    restoreSnapshot(next);
    syncHistoryButtons();
    toast('Redid canvas change');
  }

  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, snapshotState());
    } catch (_) {}
  }

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.layers)) return false;
      state.pageBg = parsed.pageBg || '#09090b';
      state.pageHeight = clamp(Number(parsed.pageHeight) || 1200, 600, 4800);
      if (parsed.viewport && VIEWPORT_WIDTHS[parsed.viewport]) {
        state.viewport = parsed.viewport;
      }
      state.layers = parsed.layers;
      return true;
    } catch (_) {
      return false;
    }
  }

  // ========================================================================
  // LAYER FACTORIES
  // ========================================================================
  function getNextZIndex() {
    if (state.layers.length === 0) return 10;
    return Math.max(...state.layers.map(l => Number(l.zIndex) || 1)) + 1;
  }

  function getArtboardWidth() {
    return VIEWPORT_WIDTHS[state.viewport] || 1280;
  }

  function createComponentLayer(comp, opts = {}) {
    const bw = getArtboardWidth();
    const isBg = opts.asBackground || comp.section === 'backgrounds';
    let w = 520;
    let h = 420;
    let x = Math.round((bw - w) / 2);
    let y = 120;
    let zIndex = getNextZIndex();
    let borderRadius = 16;

    if (isBg) {
      w = bw;
      h = opts.height || Math.min(state.pageHeight, 760);
      x = 0;
      y = opts.y ?? 0;
      zIndex = opts.zIndex ?? 1;
      borderRadius = 0;
    } else if (comp.section === 'carasols') {
      w = Math.min(bw - 80, 960);
      h = 460;
      x = Math.round((bw - w) / 2);
      y = opts.y ?? 580;
    } else if (comp.section === 'orbs' || comp.section === 'cubes') {
      w = 420;
      h = 420;
      x = Math.round((bw - w) / 2);
      y = opts.y ?? 140;
    }

    return {
      id: uid('comp'),
      kind: 'component',
      compId: comp.id,
      name: comp.displayTitle || comp.name,
      section: comp.section,
      engine: comp.engine || 'WEBGL 3D',
      x: opts.x !== undefined ? Math.round(opts.x) : x,
      y: opts.y !== undefined ? Math.round(opts.y) : y,
      w: opts.w !== undefined ? Math.round(opts.w) : w,
      h: opts.h !== undefined ? Math.round(opts.h) : h,
      zIndex: opts.zIndex !== undefined ? opts.zIndex : zIndex,
      visible: true,
      locked: false,
      paused: false,
      opacity: opts.opacity !== undefined ? opts.opacity : 100,
      borderRadius: opts.borderRadius !== undefined ? opts.borderRadius : borderRadius,
      blendMode: opts.blendMode || 'normal',
      hueRotate: 0,
      brightness: 100,
      saturate: 100,
      blur: 0,
      interactive: !isBg
    };
  }

  function createBlockLayer(blockType, opts = {}) {
    const bw = getArtboardWidth();
    const zIndex = opts.zIndex !== undefined ? opts.zIndex : Math.max(getNextZIndex(), 20);

    if (blockType === 'navbar') {
      return {
        id: uid('block'),
        kind: 'block',
        blockType: 'navbar',
        name: 'Navigation Bar',
        x: opts.x ?? 48,
        y: opts.y ?? 24,
        w: opts.w ?? Math.max(320, bw - 96),
        h: opts.h ?? 64,
        zIndex,
        visible: true,
        locked: false,
        opacity: 100,
        borderRadius: opts.borderRadius ?? 999,
        backdropBlur: opts.backdropBlur ?? 14,
        bgColor: opts.bgColor || 'rgba(15, 15, 18, 0.62)',
        borderColor: opts.borderColor || 'rgba(255, 255, 255, 0.14)',
        textColor: opts.textColor || '#ffffff',
        brandText: opts.brandText || 'Aether Studio',
        navLinks: opts.navLinks || 'Product, Showcase, Pricing, Docs',
        ctaText: opts.ctaText || 'Get Started',
        ctaBg: opts.ctaBg || '#0b4dff',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'left',
        padding: 20
      };
    }

    if (blockType === 'heading') {
      return {
        id: uid('block'),
        kind: 'block',
        blockType: 'heading',
        name: 'Hero Headline',
        x: opts.x ?? Math.round((bw - 680) / 2),
        y: opts.y ?? 140,
        w: opts.w ?? Math.min(680, bw - 48),
        h: opts.h ?? 150,
        zIndex,
        visible: true,
        locked: false,
        opacity: 100,
        borderRadius: 0,
        backdropBlur: 0,
        bgColor: 'transparent',
        borderColor: 'transparent',
        textColor: opts.textColor || '#ffffff',
        text: opts.text || 'Build spatial websites in minutes.',
        fontSize: opts.fontSize ?? 56,
        fontWeight: opts.fontWeight || '700',
        textAlign: opts.textAlign || 'center',
        padding: 8
      };
    }

    if (blockType === 'text') {
      return {
        id: uid('block'),
        kind: 'block',
        blockType: 'text',
        name: 'Body Copy',
        x: opts.x ?? Math.round((bw - 560) / 2),
        y: opts.y ?? 300,
        w: opts.w ?? Math.min(560, bw - 48),
        h: opts.h ?? 80,
        zIndex,
        visible: true,
        locked: false,
        opacity: 100,
        borderRadius: 0,
        backdropBlur: 0,
        bgColor: 'transparent',
        borderColor: 'transparent',
        textColor: opts.textColor || 'rgba(255, 255, 255, 0.78)',
        text: opts.text || 'Combine interactive WebGL shaders, 3D orbs, and motion carousels into a cohesive landing page without writing boilerplate.',
        fontSize: opts.fontSize ?? 18,
        fontWeight: opts.fontWeight || '400',
        textAlign: opts.textAlign || 'center',
        padding: 8
      };
    }

    if (blockType === 'button') {
      return {
        id: uid('block'),
        kind: 'block',
        blockType: 'button',
        name: 'CTA Button',
        x: opts.x ?? Math.round((bw - 196) / 2),
        y: opts.y ?? 400,
        w: opts.w ?? 196,
        h: opts.h ?? 48,
        zIndex,
        visible: true,
        locked: false,
        opacity: 100,
        borderRadius: opts.borderRadius ?? 999,
        backdropBlur: 0,
        bgColor: opts.bgColor || '#0b4dff',
        borderColor: opts.borderColor || 'rgba(255, 255, 255, 0.16)',
        textColor: opts.textColor || '#ffffff',
        text: opts.text || 'Start Building',
        fontSize: opts.fontSize ?? 15,
        fontWeight: '600',
        textAlign: 'center',
        padding: 12
      };
    }

    // Default: Glass Card
    return {
      id: uid('block'),
      kind: 'block',
      blockType: 'card',
      name: 'Glass Feature Card',
      x: opts.x ?? 80,
      y: opts.y ?? 760,
      w: opts.w ?? 340,
      h: opts.h ?? 180,
      zIndex,
      visible: true,
      locked: false,
      opacity: 100,
      borderRadius: opts.borderRadius ?? 20,
      backdropBlur: opts.backdropBlur ?? 18,
      bgColor: opts.bgColor || 'rgba(24, 24, 27, 0.68)',
      borderColor: opts.borderColor || 'rgba(255, 255, 255, 0.14)',
      textColor: opts.textColor || '#ffffff',
      title: opts.title || 'Realtime 3D Shaders',
      text: opts.text || 'Drop-in WebGL & Canvas components tuned for 60fps across desktop and mobile.',
      fontSize: opts.fontSize ?? 14,
      fontWeight: '500',
      textAlign: 'left',
      padding: 24
    };
  }

  // ========================================================================
  // STARTER TEMPLATES
  // ========================================================================
  function pickFirstComponent(sectionId, fallbackIdx = 0) {
    const all = getCatalogComponents();
    const matches = all.filter(c => c.section === sectionId);
    if (matches.length > fallbackIdx) return matches[fallbackIdx];
    if (matches.length > 0) return matches[0];
    return all[0] || null;
  }

  function loadTemplate(templateKey, recordHistory = true) {
    if (recordHistory) pushHistory();

    state.viewport = 'desktop';
    state.selectedId = null;

    if (templateKey === 'blank') {
      state.pageBg = '#09090b';
      state.pageHeight = 1200;
      state.layers = [];
      saveToStorage();
      renderAll();
      toast('Loaded Blank Canvas');
      return;
    }

    const bgComp = pickFirstComponent('backgrounds', 0);
    const orbComp = pickFirstComponent('orbs', 0);
    const carouselComp = pickFirstComponent('carasols', 0);
    const cubeComp = pickFirstComponent('cubes', 0);
    const assetComp = pickFirstComponent('assets', 0);

    if (templateKey === 'saas-hero') {
      state.pageBg = '#07070a';
      state.pageHeight = 1360;
      const layers = [];
      if (bgComp) {
        layers.push(createComponentLayer(bgComp, {
          asBackground: true, x: 0, y: 0, w: 1280, h: 720, zIndex: 1, opacity: 90
        }));
      }
      layers.push(createBlockLayer('navbar', {
        x: 48, y: 24, w: 1184, h: 60, zIndex: 30,
        brandText: 'FrameVault Studio',
        navLinks: 'Components, Shaders, Canvas, Pricing',
        ctaText: 'Launch App'
      }));
      layers.push(createBlockLayer('heading', {
        x: 64, y: 168, w: 620, h: 156, zIndex: 25,
        text: 'Design living interfaces in minutes.',
        fontSize: 56, textAlign: 'left'
      }));
      layers.push(createBlockLayer('text', {
        x: 64, y: 332, w: 540, h: 88, zIndex: 25,
        text: 'Assemble interactive WebGL orbs, fluid backgrounds, and 3D carousels straight from the store directory.',
        fontSize: 18, textAlign: 'left'
      }));
      layers.push(createBlockLayer('button', {
        x: 64, y: 444, w: 192, h: 48, zIndex: 26,
        text: 'Get Started', bgColor: '#0b4dff'
      }));
      layers.push(createBlockLayer('button', {
        x: 272, y: 444, w: 176, h: 48, zIndex: 26,
        text: 'Explore Store', bgColor: 'rgba(255, 255, 255, 0.10)',
        borderColor: 'rgba(255, 255, 255, 0.22)'
      }));
      if (orbComp) {
        layers.push(createComponentLayer(orbComp, {
          x: 736, y: 128, w: 464, h: 464, zIndex: 15,
          borderRadius: 28, blendMode: 'screen'
        }));
      }
      if (carouselComp) {
        layers.push(createComponentLayer(carouselComp, {
          x: 64, y: 768, w: 1152, h: 496, zIndex: 12,
          borderRadius: 24
        }));
      }
      state.layers = layers;
      saveToStorage();
      renderAll();
      toast('Loaded AI SaaS Hero template');
      return;
    }

    if (templateKey === 'product-3d') {
      state.pageBg = '#09090b';
      state.pageHeight = 1280;
      const layers = [];
      if (bgComp) {
        layers.push(createComponentLayer(bgComp, {
          asBackground: true, x: 0, y: 0, w: 1280, h: 640, zIndex: 1, opacity: 70
        }));
      }
      layers.push(createBlockLayer('navbar', {
        x: 48, y: 24, w: 1184, h: 60, zIndex: 30,
        brandText: 'KINETIC // 3D',
        navLinks: 'Hardware, Specs, Gallery, Pre-Order',
        ctaText: 'Pre-Order'
      }));
      layers.push(createBlockLayer('heading', {
        x: 240, y: 112, w: 800, h: 96, zIndex: 25,
        text: 'Spatial computing, engineered.',
        fontSize: 52, textAlign: 'center'
      }));
      if (cubeComp || assetComp) {
        layers.push(createComponentLayer(cubeComp || assetComp, {
          x: 340, y: 224, w: 600, h: 420, zIndex: 16, borderRadius: 24
        }));
      }
      layers.push(createBlockLayer('card', {
        x: 64, y: 704, w: 368, h: 184, zIndex: 20,
        title: 'WebGL 2.0 Pipeline',
        text: 'Hardware-accelerated shaders with zero external runtime dependencies.'
      }));
      layers.push(createBlockLayer('card', {
        x: 456, y: 704, w: 368, h: 184, zIndex: 20,
        title: 'Parametric Controls',
        text: 'Customize speeds, glow, colors, and DOM properties directly in Studio.'
      }));
      layers.push(createBlockLayer('card', {
        x: 848, y: 704, w: 368, h: 184, zIndex: 20,
        title: 'Instant Export',
        text: 'Ship standalone HTML, React TSX, Framer components, or Figma frames.'
      }));
      state.layers = layers;
      saveToStorage();
      renderAll();
      toast('Loaded 3D Product Showcase template');
      return;
    }

    if (templateKey === 'portfolio') {
      state.pageBg = '#0b0b0f';
      state.pageHeight = 1280;
      const layers = [];
      layers.push(createBlockLayer('navbar', {
        x: 64, y: 28, w: 1152, h: 58, zIndex: 30,
        brandText: 'ALEX MORGAN',
        navLinks: 'Selected Work, Experiments, About',
        ctaText: 'Contact'
      }));
      layers.push(createBlockLayer('heading', {
        x: 64, y: 140, w: 760, h: 160, zIndex: 25,
        text: 'Creative developer crafting interactive web.',
        fontSize: 54, textAlign: 'left'
      }));
      if (assetComp) {
        layers.push(createComponentLayer(assetComp, {
          x: 848, y: 120, w: 368, h: 368, zIndex: 15, borderRadius: 24
        }));
      }
      if (carouselComp) {
        layers.push(createComponentLayer(carouselComp, {
          x: 64, y: 544, w: 1152, h: 520, zIndex: 12, borderRadius: 24
        }));
      }
      layers.push(createBlockLayer('button', {
        x: 64, y: 344, w: 208, h: 48, zIndex: 26,
        text: 'View Case Studies', bgColor: '#ffffff', textColor: '#09090b'
      }));
      state.layers = layers;
      saveToStorage();
      renderAll();
      toast('Loaded Minimal Portfolio template');
    }
  }

  // ========================================================================
  // DIRECTORY RENDERING (LEFT PANE)
  // ========================================================================
  function getFilteredDirectory() {
    const all = getCatalogComponents();
    const q = state.dirSearch.trim().toLowerCase();
    return all.filter(c => {
      if (state.dirCategory !== 'all' && c.section !== state.dirCategory) return false;
      if (!q) return true;
      return (
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.displayTitle && c.displayTitle.toLowerCase().includes(q)) ||
        (c.section && c.section.toLowerCase().includes(q)) ||
        (c.engine && c.engine.toLowerCase().includes(q))
      );
    });
  }

  function renderDirectoryCategories() {
    if (!dirCatsEl) return;
    const sections = getCatalogSections();
    const total = getCatalogComponents().length;
    if (dirTotalBadgeEl) dirTotalBadgeEl.textContent = String(total);

    const pills = [
      { id: 'all', label: 'All', count: total },
      ...sections.map(s => ({
        id: s.id,
        label: s.name.charAt(0).toUpperCase() + s.name.slice(1).toLowerCase(),
        count: s.count
      }))
    ];

    dirCatsEl.innerHTML = pills.map(p => `
      <button type="button" class="ok-canvas-cat-pill ${state.dirCategory === p.id ? 'active' : ''}" data-dir-cat="${escapeHtml(p.id)}">
        ${escapeHtml(p.label)} <span>${p.count}</span>
      </button>
    `).join('');

    dirCatsEl.querySelectorAll('[data-dir-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.dirCategory = btn.getAttribute('data-dir-cat') || 'all';
        state.dirLimit = DIR_PAGE_SIZE;
        renderDirectoryCategories();
        renderDirectoryList();
      });
    });
  }

  function renderDirectoryList() {
    if (!dirListEl) return;
    const filtered = getFilteredDirectory();
    if (filtered.length === 0) {
      dirListEl.innerHTML = `<div class="ok-canvas-dir-empty">No components match "${escapeHtml(state.dirSearch)}".</div>`;
      return;
    }

    const slice = filtered.slice(0, state.dirLimit);
    let html = slice.map(c => {
      const engineShort = (c.engine || 'WEBGL').split(' ')[0];
      const bgSwatch = c.defaultBgColor || '#111114';
      const isBgSec = c.section === 'backgrounds';
      return `
        <div class="ok-canvas-dir-item" draggable="true" data-dir-comp-id="${escapeHtml(c.id)}">
          <div class="ok-canvas-dir-swatch" style="background:${escapeHtml(bgSwatch)};" title="${escapeHtml(c.engine)}">
            <span>${escapeHtml(c.section.slice(0, 3).toUpperCase())}</span>
          </div>
          <div class="ok-canvas-dir-meta">
            <div class="ok-canvas-dir-name" title="${escapeHtml(c.displayTitle)}">${escapeHtml(c.displayTitle)}</div>
            <div class="ok-canvas-dir-sub">
              <span>${escapeHtml(c.section)}</span>
              <span>&middot;</span>
              <span>${escapeHtml(engineShort)}</span>
            </div>
          </div>
          <div class="ok-canvas-dir-btns">
            ${isBgSec ? `<button type="button" class="ok-canvas-dir-add-bg" data-add-bg="${escapeHtml(c.id)}" title="Set as full-bleed background">BG</button>` : ''}
            <button type="button" class="ok-canvas-dir-add" data-add-comp="${escapeHtml(c.id)}" title="Add component to canvas">+ Add</button>
          </div>
        </div>
      `;
    }).join('');

    if (filtered.length > slice.length) {
      html += `
        <button type="button" class="ok-canvas-load-more" id="btnCanvasDirMore">
          Show more (${filtered.length - slice.length} remaining)
        </button>
      `;
    }

    dirListEl.innerHTML = html;

    dirListEl.querySelectorAll('[data-add-comp]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        addStoreComponent(btn.getAttribute('data-add-comp'), {});
      });
    });

    dirListEl.querySelectorAll('[data-add-bg]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        addStoreComponent(btn.getAttribute('data-add-bg'), { asBackground: true });
      });
    });

    dirListEl.querySelectorAll('.ok-canvas-dir-item').forEach(item => {
      item.addEventListener('dragstart', (e) => {
        const compId = item.getAttribute('data-dir-comp-id');
        e.dataTransfer.setData('text/framevault-comp-id', compId);
        e.dataTransfer.effectAllowed = 'copy';
        artboardEl.classList.add('is-drag-target');
      });
      item.addEventListener('dragend', () => {
        artboardEl.classList.remove('is-drag-target');
      });
    });

    const moreBtn = document.getElementById('btnCanvasDirMore');
    if (moreBtn) {
      moreBtn.addEventListener('click', () => {
        state.dirLimit += DIR_PAGE_SIZE;
        renderDirectoryList();
      });
    }
  }

  // ========================================================================
  // LAYERS PANEL RENDERING (LEFT PANE)
  // ========================================================================
  function renderLayersPanel() {
    const count = state.layers.length;
    if (layerCountBadgeEl) layerCountBadgeEl.textContent = String(count);
    if (navCanvasCountBadgeEl) {
      navCanvasCountBadgeEl.textContent = String(count);
      navCanvasCountBadgeEl.style.display = count > 0 ? 'inline-flex' : 'none';
    }

    const activeWebgl = state.layers.filter(
      l => l.kind === 'component' && l.visible && !l.paused && String(l.engine || '').includes('WEBGL')
    ).length;
    if (webglBudgetEl) {
      webglBudgetEl.textContent = `${activeWebgl} / 6 WebGL active`;
      webglBudgetEl.classList.toggle('is-warn', activeWebgl > 6);
    }

    if (!layersListEl) return;
    if (count === 0) {
      layersListEl.innerHTML = `<div class="ok-canvas-dir-empty">No layers on canvas yet. Add components from the Directory tab.</div>`;
      return;
    }

    const sorted = [...state.layers].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
    layersListEl.innerHTML = sorted.map(l => {
      const isSelected = l.id === state.selectedId;
      const tag = l.kind === 'component' ? (l.section || 'comp') : (l.blockType || 'block');
      return `
        <div class="ok-canvas-layer-row ${isSelected ? 'active' : ''} ${!l.visible ? 'is-hidden' : ''}" data-layer-row="${escapeHtml(l.id)}">
          <div class="ok-canvas-layer-info">
            <span class="ok-canvas-layer-tag">${escapeHtml(tag)}</span>
            <span class="ok-canvas-layer-name" title="${escapeHtml(l.name)}">${escapeHtml(l.name)}</span>
          </div>
          <div class="ok-canvas-layer-acts">
            <button type="button" class="ok-canvas-lbtn" data-l-act="up" data-l-id="${escapeHtml(l.id)}" title="Bring Forward">&uarr;</button>
            <button type="button" class="ok-canvas-lbtn" data-l-act="down" data-l-id="${escapeHtml(l.id)}" title="Send Backward">&darr;</button>
            <button type="button" class="ok-canvas-lbtn ${!l.visible ? 'is-on' : ''}" data-l-act="vis" data-l-id="${escapeHtml(l.id)}" title="${l.visible ? 'Hide layer' : 'Show layer'}">${l.visible ? 'Vis' : 'Off'}</button>
            <button type="button" class="ok-canvas-lbtn ${l.locked ? 'is-on' : ''}" data-l-act="lock" data-l-id="${escapeHtml(l.id)}" title="${l.locked ? 'Unlock layer' : 'Lock layer'}">${l.locked ? 'Lck' : 'Unl'}</button>
            <button type="button" class="ok-canvas-lbtn ok-canvas-danger-text" data-l-act="del" data-l-id="${escapeHtml(l.id)}" title="Delete layer">&times;</button>
          </div>
        </div>
      `;
    }).join('');

    layersListEl.querySelectorAll('[data-layer-row]').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('[data-l-act]')) return;
        selectLayer(row.getAttribute('data-layer-row'));
      });
    });

    layersListEl.querySelectorAll('[data-l-act]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-l-id');
        const act = btn.getAttribute('data-l-act');
        if (act === 'up') shiftLayerZ(id, 1);
        else if (act === 'down') shiftLayerZ(id, -1);
        else if (act === 'vis') toggleLayerProp(id, 'visible');
        else if (act === 'lock') toggleLayerProp(id, 'locked');
        else if (act === 'del') deleteLayer(id);
      });
    });
  }

  // ========================================================================
  // ARTBOARD SCALING & RENDERING (CENTER PANE)
  // ========================================================================
  function updateArtboardScale() {
    const bw = getArtboardWidth();
    const bh = state.pageHeight;

    artboardEl.style.width = `${bw}px`;
    artboardEl.style.height = `${bh}px`;
    artboardEl.style.backgroundColor = state.pageBg;
    artboardEl.classList.toggle('show-grid', state.showGrid && state.mode === 'edit');
    artboardEl.classList.toggle('mode-interact', state.mode === 'interact');

    let scale = 1;
    if (state.zoomMode === 'fit') {
      const availW = Math.max(320, stageViewportEl.clientWidth - 48);
      scale = Math.min(1, availW / bw);
    } else {
      scale = parseFloat(state.zoomMode) || 1;
    }
    state.computedScale = scale;

    artboardEl.style.transform = `scale(${scale})`;
    artboardEl.style.transformOrigin = 'top left';
    artboardOuterEl.style.width = `${Math.round(bw * scale)}px`;
    artboardOuterEl.style.height = `${Math.round(bh * scale) + 40}px`;

    if (dimsLabelEl) {
      dimsLabelEl.textContent = `${bw} × ${bh} px · ${Math.round(scale * 100)}%`;
    }
  }

  function renderBlockInnerHtml(l) {
    if (l.blockType === 'navbar') {
      const links = String(l.navLinks || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      return `
        <div class="ok-cb-navbar" style="
          background:${escapeHtml(l.bgColor)};
          border:1px solid ${escapeHtml(l.borderColor)};
          color:${escapeHtml(l.textColor)};
          border-radius:${l.borderRadius}px;
          backdrop-filter:blur(${l.backdropBlur || 0}px);
          -webkit-backdrop-filter:blur(${l.backdropBlur || 0}px);
          padding:0 ${l.padding || 20}px;
        ">
          <div class="ok-cb-nav-brand">${escapeHtml(l.brandText || 'Brand')}</div>
          <div class="ok-cb-nav-links">
            ${links.map(lk => `<span>${escapeHtml(lk)}</span>`).join('')}
          </div>
          ${l.ctaText ? `<span class="ok-cb-nav-cta" style="background:${escapeHtml(l.ctaBg || '#0b4dff')};">${escapeHtml(l.ctaText)}</span>` : ''}
        </div>
      `;
    }

    if (l.blockType === 'heading') {
      return `
        <div class="ok-cb-heading" style="
          color:${escapeHtml(l.textColor)};
          font-size:${l.fontSize || 48}px;
          font-weight:${escapeHtml(l.fontWeight || '700')};
          text-align:${escapeHtml(l.textAlign || 'center')};
          background:${escapeHtml(l.bgColor || 'transparent')};
          border-radius:${l.borderRadius || 0}px;
          padding:${l.padding || 8}px;
        ">${escapeHtml(l.text || 'Heading')}</div>
      `;
    }

    if (l.blockType === 'text') {
      return `
        <div class="ok-cb-text" style="
          color:${escapeHtml(l.textColor)};
          font-size:${l.fontSize || 16}px;
          font-weight:${escapeHtml(l.fontWeight || '400')};
          text-align:${escapeHtml(l.textAlign || 'center')};
          background:${escapeHtml(l.bgColor || 'transparent')};
          border-radius:${l.borderRadius || 0}px;
          padding:${l.padding || 8}px;
        ">${escapeHtml(l.text || '')}</div>
      `;
    }

    if (l.blockType === 'button') {
      return `
        <div class="ok-cb-button" style="
          background:${escapeHtml(l.bgColor || '#0b4dff')};
          color:${escapeHtml(l.textColor || '#ffffff')};
          border:1px solid ${escapeHtml(l.borderColor || 'transparent')};
          border-radius:${l.borderRadius ?? 999}px;
          font-size:${l.fontSize || 15}px;
          font-weight:${escapeHtml(l.fontWeight || '600')};
        ">${escapeHtml(l.text || 'Button')}</div>
      `;
    }

    // Glass Card
    return `
      <div class="ok-cb-card" style="
        background:${escapeHtml(l.bgColor)};
        border:1px solid ${escapeHtml(l.borderColor)};
        color:${escapeHtml(l.textColor)};
        border-radius:${l.borderRadius ?? 20}px;
        backdrop-filter:blur(${l.backdropBlur || 0}px);
        -webkit-backdrop-filter:blur(${l.backdropBlur || 0}px);
        padding:${l.padding || 24}px;
        text-align:${escapeHtml(l.textAlign || 'left')};
      ">
        <div class="ok-cb-card-title">${escapeHtml(l.title || 'Card Title')}</div>
        <div class="ok-cb-card-body" style="font-size:${l.fontSize || 14}px;">${escapeHtml(l.text || '')}</div>
      </div>
    `;
  }

  function buildFilterCss(l) {
    const parts = [];
    if (l.hueRotate) parts.push(`hue-rotate(${l.hueRotate}deg)`);
    if (l.brightness !== undefined && l.brightness !== 100) parts.push(`brightness(${l.brightness}%)`);
    if (l.saturate !== undefined && l.saturate !== 100) parts.push(`saturate(${l.saturate}%)`);
    if (l.blur) parts.push(`blur(${l.blur}px)`);
    return parts.join(' ');
  }

  function syncArtboardNodes() {
    if (emptyHintEl) {
      emptyHintEl.style.display = state.layers.length === 0 ? 'flex' : 'none';
    }

    const existingNodes = new Map();
    layersHostEl.querySelectorAll('.ok-canvas-node').forEach(el => {
      existingNodes.set(el.getAttribute('data-node-id'), el);
    });

    const activeIds = new Set(state.layers.map(l => l.id));
    for (const [id, el] of existingNodes.entries()) {
      if (!activeIds.has(id)) {
        el.remove();
        existingNodes.delete(id);
      }
    }

    for (const l of state.layers) {
      let nodeEl = existingNodes.get(l.id);
      const isNew = !nodeEl;

      if (isNew) {
        nodeEl = document.createElement('div');
        nodeEl.className = 'ok-canvas-node';
        nodeEl.setAttribute('data-node-id', l.id);

        if (l.kind === 'component') {
          nodeEl.innerHTML = `
            <div class="ok-canvas-node-inner ok-canvas-comp-inner">
              <iframe class="ok-canvas-comp-iframe" sandbox="allow-scripts allow-same-origin" loading="lazy"></iframe>
              <div class="ok-canvas-paused-badge">Paused</div>
            </div>
            <div class="ok-canvas-drag-shield"></div>
            <div class="ok-canvas-sel-chrome">
              <div class="ok-canvas-node-toolbar">
                <span class="ok-canvas-nt-label"></span>
                <button type="button" data-nt="dup" title="Duplicate (Ctrl+D)">Dup</button>
                <button type="button" data-nt="up" title="Bring Forward">&uarr;</button>
                <button type="button" data-nt="down" title="Send Backward">&darr;</button>
                <button type="button" data-nt="bg" title="Fill as Full Background">BG</button>
                <button type="button" data-nt="studio" title="Customize in Parametric Studio">Studio</button>
                <button type="button" data-nt="del" class="ok-canvas-danger-text" title="Delete">&times;</button>
              </div>
              <div class="ok-canvas-dim-tag"></div>
              <span class="ok-rh rh-nw" data-rh="nw"></span>
              <span class="ok-rh rh-n" data-rh="n"></span>
              <span class="ok-rh rh-ne" data-rh="ne"></span>
              <span class="ok-rh rh-e" data-rh="e"></span>
              <span class="ok-rh rh-se" data-rh="se"></span>
              <span class="ok-rh rh-s" data-rh="s"></span>
              <span class="ok-rh rh-sw" data-rh="sw"></span>
              <span class="ok-rh rh-w" data-rh="w"></span>
            </div>
          `;
        } else {
          nodeEl.innerHTML = `
            <div class="ok-canvas-node-inner ok-canvas-block-inner"></div>
            <div class="ok-canvas-drag-shield"></div>
            <div class="ok-canvas-sel-chrome">
              <div class="ok-canvas-node-toolbar">
                <span class="ok-canvas-nt-label"></span>
                <button type="button" data-nt="dup" title="Duplicate (Ctrl+D)">Dup</button>
                <button type="button" data-nt="up" title="Bring Forward">&uarr;</button>
                <button type="button" data-nt="down" title="Send Backward">&darr;</button>
                <button type="button" data-nt="del" class="ok-canvas-danger-text" title="Delete">&times;</button>
              </div>
              <div class="ok-canvas-dim-tag"></div>
              <span class="ok-rh rh-nw" data-rh="nw"></span>
              <span class="ok-rh rh-n" data-rh="n"></span>
              <span class="ok-rh rh-ne" data-rh="ne"></span>
              <span class="ok-rh rh-e" data-rh="e"></span>
              <span class="ok-rh rh-se" data-rh="se"></span>
              <span class="ok-rh rh-s" data-rh="s"></span>
              <span class="ok-rh rh-sw" data-rh="sw"></span>
              <span class="ok-rh rh-w" data-rh="w"></span>
            </div>
          `;
        }

        bindNodeInteractions(nodeEl, l.id);
        layersHostEl.appendChild(nodeEl);
      }

      // Apply geometry & visual state
      nodeEl.style.left = `${l.x}px`;
      nodeEl.style.top = `${l.y}px`;
      nodeEl.style.width = `${l.w}px`;
      nodeEl.style.height = `${l.h}px`;
      nodeEl.style.zIndex = String(l.zIndex || 1);
      nodeEl.style.display = l.visible ? 'block' : 'none';
      nodeEl.style.opacity = String((l.opacity ?? 100) / 100);
      nodeEl.style.mixBlendMode = l.blendMode || 'normal';

      const isSelected = l.id === state.selectedId && state.mode === 'edit';
      nodeEl.classList.toggle('is-selected', isSelected);
      nodeEl.classList.toggle('is-locked', Boolean(l.locked));
      nodeEl.classList.toggle('is-paused', Boolean(l.paused));

      const innerEl = nodeEl.querySelector('.ok-canvas-node-inner');
      if (innerEl) {
        innerEl.style.borderRadius = `${l.borderRadius || 0}px`;
        innerEl.style.filter = l.kind === 'component' ? buildFilterCss(l) : '';
      }

      const labelEl = nodeEl.querySelector('.ok-canvas-nt-label');
      if (labelEl) labelEl.textContent = l.name;

      const dimTagEl = nodeEl.querySelector('.ok-canvas-dim-tag');
      if (dimTagEl) dimTagEl.textContent = `${Math.round(l.w)} × ${Math.round(l.h)}`;

      if (l.kind === 'component') {
        const ifr = nodeEl.querySelector('.ok-canvas-comp-iframe');
        if (ifr) {
          const previewUrl = `/api/preview/${encodeURIComponent(l.compId)}`;
          if (l.paused || !l.visible) {
            if (ifr.getAttribute('src')) ifr.removeAttribute('src');
          } else if (ifr.getAttribute('src') !== previewUrl) {
            ifr.src = previewUrl;
          }
          ifr.style.pointerEvents = state.mode === 'interact' && l.interactive !== false ? 'auto' : 'none';
        }
      } else {
        const blockInner = nodeEl.querySelector('.ok-canvas-block-inner');
        if (blockInner) {
          blockInner.innerHTML = renderBlockInnerHtml(l);
        }
      }
    }
  }

  // ========================================================================
  // DIRECT MANIPULATION: DRAG MOVE & 8-HANDLE RESIZE
  // ========================================================================
  function showAlignmentGuides(showV, showH) {
    if (guideVEl) guideVEl.style.opacity = showV ? '1' : '0';
    if (guideHEl) guideHEl.style.opacity = showH ? '1' : '0';
  }

  function bindNodeInteractions(nodeEl, layerId) {
    const shieldEl = nodeEl.querySelector('.ok-canvas-drag-shield');

    // Quick floating toolbar buttons
    nodeEl.querySelectorAll('[data-nt]').forEach(btn => {
      btn.addEventListener('pointerdown', e => e.stopPropagation());
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const act = btn.getAttribute('data-nt');
        if (act === 'dup') duplicateLayer(layerId);
        else if (act === 'up') shiftLayerZ(layerId, 1);
        else if (act === 'down') shiftLayerZ(layerId, -1);
        else if (act === 'bg') applyLayoutPreset(layerId, 'full-bg');
        else if (act === 'del') deleteLayer(layerId);
        else if (act === 'studio') {
          const layer = state.layers.find(x => x.id === layerId);
          if (layer && layer.compId && window.FrameVaultApp?.openStudio) {
            window.FrameVaultApp.openStudio(layer.compId);
          }
        }
      });
    });

    // Move drag
    if (shieldEl) {
      shieldEl.addEventListener('pointerdown', (e) => {
        if (state.mode !== 'edit' || e.button !== 0) return;
        e.stopPropagation();
        selectLayer(layerId);
        const layer = state.layers.find(x => x.id === layerId);
        if (!layer || layer.locked) return;

        const startX = e.clientX;
        const startY = e.clientY;
        const origX = layer.x;
        const origY = layer.y;
        const bw = getArtboardWidth();
        const bh = state.pageHeight;
        let moved = false;

        artboardEl.classList.add('is-dragging');

        const onMove = (ev) => {
          const dx = (ev.clientX - startX) / state.computedScale;
          const dy = (ev.clientY - startY) / state.computedScale;
          if (!moved && Math.abs(dx) < 2 && Math.abs(dy) < 2) return;
          if (!moved) {
            pushHistory();
            moved = true;
          }

          let nx = origX + dx;
          let ny = origY + dy;

          if (state.snap && !ev.altKey) {
            nx = Math.round(nx / state.snapSize) * state.snapSize;
            ny = Math.round(ny / state.snapSize) * state.snapSize;
          }

          // Center alignment snap within 10px
          const centerX = bw / 2 - layer.w / 2;
          const centerY = bh / 2 - layer.h / 2;
          let snapV = false;
          let snapH = false;
          if (Math.abs(nx - centerX) <= 10) {
            nx = Math.round(centerX);
            snapV = true;
          }
          if (Math.abs(ny - centerY) <= 10) {
            ny = Math.round(centerY);
            snapH = true;
          }
          showAlignmentGuides(snapV, snapH);

          layer.x = Math.round(nx);
          layer.y = Math.round(ny);
          nodeEl.style.left = `${layer.x}px`;
          nodeEl.style.top = `${layer.y}px`;
          updateInspectorGeometryFields(layer);
        };

        const onUp = () => {
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
          artboardEl.classList.remove('is-dragging');
          showAlignmentGuides(false, false);
          if (moved) saveToStorage();
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
      });
    }

    // 8 Resize Handles
    nodeEl.querySelectorAll('[data-rh]').forEach(handle => {
      handle.addEventListener('pointerdown', (e) => {
        if (state.mode !== 'edit' || e.button !== 0) return;
        e.stopPropagation();
        const layer = state.layers.find(x => x.id === layerId);
        if (!layer || layer.locked) return;

        const dir = handle.getAttribute('data-rh');
        const startX = e.clientX;
        const startY = e.clientY;
        const orig = { x: layer.x, y: layer.y, w: layer.w, h: layer.h };
        let resized = false;

        artboardEl.classList.add('is-dragging');

        const onMove = (ev) => {
          const dx = (ev.clientX - startX) / state.computedScale;
          const dy = (ev.clientY - startY) / state.computedScale;
          if (!resized && Math.abs(dx) < 2 && Math.abs(dy) < 2) return;
          if (!resized) {
            pushHistory();
            resized = true;
          }

          let { x, y, w, h } = orig;
          const minW = 64;
          const minH = 36;

          if (dir.includes('e')) w = Math.max(minW, orig.w + dx);
          if (dir.includes('s')) h = Math.max(minH, orig.h + dy);
          if (dir.includes('w')) {
            const newW = Math.max(minW, orig.w - dx);
            x = orig.x + (orig.w - newW);
            w = newW;
          }
          if (dir.includes('n')) {
            const newH = Math.max(minH, orig.h - dy);
            y = orig.y + (orig.h - newH);
            h = newH;
          }

          if (state.snap && !ev.altKey) {
            x = Math.round(x / state.snapSize) * state.snapSize;
            y = Math.round(y / state.snapSize) * state.snapSize;
            w = Math.max(minW, Math.round(w / state.snapSize) * state.snapSize);
            h = Math.max(minH, Math.round(h / state.snapSize) * state.snapSize);
          }

          layer.x = Math.round(x);
          layer.y = Math.round(y);
          layer.w = Math.round(w);
          layer.h = Math.round(h);

          nodeEl.style.left = `${layer.x}px`;
          nodeEl.style.top = `${layer.y}px`;
          nodeEl.style.width = `${layer.w}px`;
          nodeEl.style.height = `${layer.h}px`;

          const dimTag = nodeEl.querySelector('.ok-canvas-dim-tag');
          if (dimTag) dimTag.textContent = `${layer.w} × ${layer.h}`;
          updateInspectorGeometryFields(layer);
        };

        const onUp = () => {
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
          artboardEl.classList.remove('is-dragging');
          if (resized) saveToStorage();
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
      });
    });
  }

  function updateInspectorGeometryFields(layer) {
    if (state.selectedId !== layer.id) return;
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    setVal('inspX', layer.x);
    setVal('inspY', layer.y);
    setVal('inspW', layer.w);
    setVal('inspH', layer.h);
  }

  // ========================================================================
  // PROPERTIES INSPECTOR (RIGHT PANE)
  // ========================================================================
  function renderInspector() {
    if (!inspectorBodyEl) return;
    const layer = state.layers.find(l => l.id === state.selectedId);

    if (!layer) {
      if (inspectorTitleEl) inspectorTitleEl.textContent = 'Page Settings';
      if (inspectorBadgeEl) inspectorBadgeEl.textContent = 'Artboard';
      inspectorBodyEl.innerHTML = `
        <div class="ok-insp-group">
          <div class="ok-insp-group-title">Page Surface</div>
          <div class="ok-insp-row">
            <label for="inspPageBg">Background</label>
            <div class="ok-insp-color-wrap">
              <input type="color" id="inspPageBg" value="${escapeHtml(state.pageBg.startsWith('#') ? state.pageBg : '#09090b')}">
              <input type="text" id="inspPageBgText" class="ok-canvas-input" value="${escapeHtml(state.pageBg)}">
            </div>
          </div>
          <div class="ok-insp-swatches">
            <button type="button" class="ok-insp-swatch" data-pg-bg="#09090b" style="background:#09090b;" title="Obsidian"></button>
            <button type="button" class="ok-insp-swatch" data-pg-bg="#000000" style="background:#000000;" title="Pure Black"></button>
            <button type="button" class="ok-insp-swatch" data-pg-bg="#0f172a" style="background:#0f172a;" title="Deep Slate"></button>
            <button type="button" class="ok-insp-swatch" data-pg-bg="#18181b" style="background:#18181b;" title="Carbon"></button>
            <button type="button" class="ok-insp-swatch" data-pg-bg="#fafafa" style="background:#fafafa;" title="Soft White"></button>
            <button type="button" class="ok-insp-swatch" data-pg-bg="#ffffff" style="background:#ffffff;" title="Pure White"></button>
          </div>
        </div>

        <div class="ok-insp-group">
          <div class="ok-insp-group-title">Artboard Dimensions</div>
          <div class="ok-insp-row">
            <label for="inspPageHeight">Page Height (px)</label>
            <input type="number" id="inspPageHeight" class="ok-canvas-input" min="600" max="4800" step="80" value="${state.pageHeight}">
          </div>
          <div class="ok-insp-row ok-insp-check-row">
            <label><input type="checkbox" id="inspShowGrid" ${state.showGrid ? 'checked' : ''}> Show alignment dot grid</label>
          </div>
          <div class="ok-insp-row ok-insp-check-row">
            <label><input type="checkbox" id="inspSnapGrid" ${state.snap ? 'checked' : ''}> Snap to 16px grid</label>
          </div>
        </div>

        <div class="ok-insp-group">
          <div class="ok-insp-group-title">Shortcuts</div>
          <div class="ok-insp-tips">
            <div><kbd>Drag</kbd> Move layer (hold <kbd>Alt</kbd> to bypass snap)</div>
            <div><kbd>Arrows</kbd> Nudge 1px (<kbd>Shift</kbd> 16px)</div>
            <div><kbd>Ctrl+D</kbd> Duplicate selected layer</div>
            <div><kbd>Ctrl+Z</kbd> Undo &middot; <kbd>Del</kbd> Remove</div>
          </div>
        </div>
      `;

      const bgPicker = document.getElementById('inspPageBg');
      const bgText = document.getElementById('inspPageBgText');
      if (bgPicker) {
        bgPicker.addEventListener('input', (e) => {
          state.pageBg = e.target.value;
          if (bgText) bgText.value = state.pageBg;
          updateArtboardScale();
          saveToStorage();
        });
      }
      if (bgText) {
        bgText.addEventListener('change', (e) => {
          state.pageBg = e.target.value.trim() || '#09090b';
          updateArtboardScale();
          saveToStorage();
        });
      }
      inspectorBodyEl.querySelectorAll('[data-pg-bg]').forEach(btn => {
        btn.addEventListener('click', () => {
          pushHistory();
          state.pageBg = btn.getAttribute('data-pg-bg');
          renderInspector();
          updateArtboardScale();
          saveToStorage();
        });
      });
      document.getElementById('inspPageHeight')?.addEventListener('change', (e) => {
        pushHistory();
        state.pageHeight = clamp(parseInt(e.target.value, 10) || 1200, 600, 4800);
        updateArtboardScale();
        saveToStorage();
      });
      document.getElementById('inspShowGrid')?.addEventListener('change', (e) => {
        state.showGrid = e.target.checked;
        updateArtboardScale();
      });
      document.getElementById('inspSnapGrid')?.addEventListener('change', (e) => {
        state.snap = e.target.checked;
        syncToolbarState();
      });
      return;
    }

    // Layer is selected
    if (inspectorTitleEl) inspectorTitleEl.textContent = layer.name;
    if (inspectorBadgeEl) {
      inspectorBadgeEl.textContent = layer.kind === 'component'
        ? (layer.engine || 'Store Component')
        : `UI ${layer.blockType}`;
    }

    const geometryHtml = `
      <div class="ok-insp-group">
        <div class="ok-insp-group-title">Quick Layout</div>
        <div class="ok-insp-preset-grid">
          <button type="button" class="ok-canvas-mini-btn" data-preset="full-bg">Full BG</button>
          <button type="button" class="ok-canvas-mini-btn" data-preset="hero">Hero Fill</button>
          <button type="button" class="ok-canvas-mini-btn" data-preset="center">Center</button>
          <button type="button" class="ok-canvas-mini-btn" data-preset="left">Left 50%</button>
          <button type="button" class="ok-canvas-mini-btn" data-preset="right">Right 50%</button>
          <button type="button" class="ok-canvas-mini-btn" data-preset="wide">Full Width</button>
        </div>
      </div>

      <div class="ok-insp-group">
        <div class="ok-insp-group-title">Position &amp; Size</div>
        <div class="ok-insp-xywh">
          <label><span>X</span><input type="number" id="inspX" class="ok-canvas-input" value="${layer.x}"></label>
          <label><span>Y</span><input type="number" id="inspY" class="ok-canvas-input" value="${layer.y}"></label>
          <label><span>W</span><input type="number" id="inspW" class="ok-canvas-input" min="40" value="${layer.w}"></label>
          <label><span>H</span><input type="number" id="inspH" class="ok-canvas-input" min="28" value="${layer.h}"></label>
        </div>
        <div class="ok-insp-xywh" style="margin-top:8px;">
          <label><span>Z-Index</span><input type="number" id="inspZ" class="ok-canvas-input" value="${layer.zIndex}"></label>
          <label><span>Radius</span><input type="number" id="inspRadius" class="ok-canvas-input" min="0" max="999" value="${layer.borderRadius || 0}"></label>
        </div>
      </div>
    `;

    if (layer.kind === 'component') {
      inspectorBodyEl.innerHTML = `
        <div class="ok-insp-group">
          <div class="ok-insp-comp-actions">
            <button type="button" class="ok-cta-blue" id="btnInspOpenStudio" style="flex:1;height:32px;font-size:12px;">Open in Studio</button>
            <button type="button" class="ok-btn-secondary" id="btnInspTogglePause" style="height:32px;font-size:12px;">${layer.paused ? 'Resume' : 'Pause'}</button>
          </div>
        </div>
        ${geometryHtml}
        <div class="ok-insp-group">
          <div class="ok-insp-group-title">Appearance &amp; Blending</div>
          <div class="ok-insp-row">
            <label>Opacity <span class="ok-insp-val" id="valInspOpacity">${layer.opacity}%</span></label>
            <input type="range" id="inspOpacity" min="0" max="100" value="${layer.opacity}">
          </div>
          <div class="ok-insp-row">
            <label for="inspBlend">Blend Mode</label>
            <select id="inspBlend" class="ok-canvas-input">
              ${['normal', 'screen', 'lighten', 'multiply', 'overlay', 'plus-lighter'].map(m =>
                `<option value="${m}" ${layer.blendMode === m ? 'selected' : ''}>${m}</option>`
              ).join('')}
            </select>
          </div>
          <div class="ok-insp-row">
            <label>Hue Rotate <span class="ok-insp-val" id="valInspHue">${layer.hueRotate || 0}&deg;</span></label>
            <input type="range" id="inspHue" min="-180" max="180" value="${layer.hueRotate || 0}">
          </div>
          <div class="ok-insp-row">
            <label>Brightness <span class="ok-insp-val" id="valInspBright">${layer.brightness ?? 100}%</span></label>
            <input type="range" id="inspBright" min="20" max="200" value="${layer.brightness ?? 100}">
          </div>
          <div class="ok-insp-row">
            <label>Saturate <span class="ok-insp-val" id="valInspSat">${layer.saturate ?? 100}%</span></label>
            <input type="range" id="inspSat" min="0" max="250" value="${layer.saturate ?? 100}">
          </div>
          <div class="ok-insp-row">
            <label>Blur <span class="ok-insp-val" id="valInspBlur">${layer.blur || 0}px</span></label>
            <input type="range" id="inspBlur" min="0" max="24" value="${layer.blur || 0}">
          </div>
          <div class="ok-insp-row ok-insp-check-row">
            <label><input type="checkbox" id="inspInteractive" ${layer.interactive !== false ? 'checked' : ''}> Interactive in Preview / Interact mode</label>
          </div>
        </div>
        <div class="ok-insp-group">
          <div class="ok-insp-comp-actions">
            <button type="button" class="ok-btn-secondary" id="btnInspDup" style="flex:1;height:30px;font-size:12px;">Duplicate</button>
            <button type="button" class="ok-btn-secondary ok-canvas-danger-text" id="btnInspDel" style="flex:1;height:30px;font-size:12px;">Delete</button>
          </div>
        </div>
      `;

      document.getElementById('btnInspOpenStudio')?.addEventListener('click', () => {
        window.FrameVaultApp?.openStudio?.(layer.compId);
      });
      document.getElementById('btnInspTogglePause')?.addEventListener('click', () => {
        pushHistory();
        layer.paused = !layer.paused;
        saveToStorage();
        renderAll();
      });
      bindRange('inspOpacity', 'valInspOpacity', '%', v => { layer.opacity = v; });
      bindRange('inspHue', 'valInspHue', '°', v => { layer.hueRotate = v; });
      bindRange('inspBright', 'valInspBright', '%', v => { layer.brightness = v; });
      bindRange('inspSat', 'valInspSat', '%', v => { layer.saturate = v; });
      bindRange('inspBlur', 'valInspBlur', 'px', v => { layer.blur = v; });
      document.getElementById('inspBlend')?.addEventListener('change', (e) => {
        pushHistory();
        layer.blendMode = e.target.value;
        syncArtboardNodes();
        saveToStorage();
      });
      document.getElementById('inspInteractive')?.addEventListener('change', (e) => {
        layer.interactive = e.target.checked;
        syncArtboardNodes();
        saveToStorage();
      });
    } else {
      // UI Block Inspector
      let contentFields = '';
      if (layer.blockType === 'navbar') {
        contentFields = `
          <div class="ok-insp-row"><label>Brand Name</label><input type="text" id="inspBrand" class="ok-canvas-input" value="${escapeHtml(layer.brandText || '')}"></div>
          <div class="ok-insp-row"><label>Nav Links (comma separated)</label><input type="text" id="inspLinks" class="ok-canvas-input" value="${escapeHtml(layer.navLinks || '')}"></div>
          <div class="ok-insp-row"><label>CTA Label</label><input type="text" id="inspCtaText" class="ok-canvas-input" value="${escapeHtml(layer.ctaText || '')}"></div>
          <div class="ok-insp-row"><label>CTA Accent</label><input type="color" id="inspCtaBg" value="${escapeHtml(layer.ctaBg || '#0b4dff')}"></div>
        `;
      } else if (layer.blockType === 'card') {
        contentFields = `
          <div class="ok-insp-row"><label>Card Title</label><input type="text" id="inspTitle" class="ok-canvas-input" value="${escapeHtml(layer.title || '')}"></div>
          <div class="ok-insp-row"><label>Card Body</label><textarea id="inspText" class="ok-canvas-textarea" rows="3">${escapeHtml(layer.text || '')}</textarea></div>
        `;
      } else {
        contentFields = `
          <div class="ok-insp-row"><label>Text Content</label><textarea id="inspText" class="ok-canvas-textarea" rows="3">${escapeHtml(layer.text || '')}</textarea></div>
        `;
      }

      inspectorBodyEl.innerHTML = `
        <div class="ok-insp-group">
          <div class="ok-insp-group-title">Content</div>
          ${contentFields}
        </div>
        <div class="ok-insp-group">
          <div class="ok-insp-group-title">Typography &amp; Colors</div>
          <div class="ok-insp-xywh">
            <label><span>Font px</span><input type="number" id="inspFontSize" class="ok-canvas-input" min="10" max="120" value="${layer.fontSize || 16}"></label>
            <label><span>Align</span>
              <select id="inspAlign" class="ok-canvas-input">
                <option value="left" ${layer.textAlign === 'left' ? 'selected' : ''}>Left</option>
                <option value="center" ${layer.textAlign === 'center' ? 'selected' : ''}>Center</option>
                <option value="right" ${layer.textAlign === 'right' ? 'selected' : ''}>Right</option>
              </select>
            </label>
          </div>
          <div class="ok-insp-row" style="margin-top:8px;">
            <label>Text Color</label>
            <input type="text" id="inspTextColor" class="ok-canvas-input" value="${escapeHtml(layer.textColor || '#ffffff')}">
          </div>
          <div class="ok-insp-row">
            <label>Background (hex or rgba)</label>
            <input type="text" id="inspBgColor" class="ok-canvas-input" value="${escapeHtml(layer.bgColor || 'transparent')}">
          </div>
          <div class="ok-insp-row">
            <label>Border Color</label>
            <input type="text" id="inspBorderColor" class="ok-canvas-input" value="${escapeHtml(layer.borderColor || 'transparent')}">
          </div>
          <div class="ok-insp-row">
            <label>Backdrop Blur <span class="ok-insp-val" id="valInspBdBlur">${layer.backdropBlur || 0}px</span></label>
            <input type="range" id="inspBdBlur" min="0" max="32" value="${layer.backdropBlur || 0}">
          </div>
        </div>
        ${geometryHtml}
        <div class="ok-insp-group">
          <div class="ok-insp-comp-actions">
            <button type="button" class="ok-btn-secondary" id="btnInspDup" style="flex:1;height:30px;font-size:12px;">Duplicate</button>
            <button type="button" class="ok-btn-secondary ok-canvas-danger-text" id="btnInspDel" style="flex:1;height:30px;font-size:12px;">Delete</button>
          </div>
        </div>
      `;

      const bindText = (id, prop) => {
        document.getElementById(id)?.addEventListener('input', (e) => {
          layer[prop] = e.target.value;
          syncArtboardNodes();
          saveToStorage();
        });
      };
      bindText('inspBrand', 'brandText');
      bindText('inspLinks', 'navLinks');
      bindText('inspCtaText', 'ctaText');
      bindText('inspCtaBg', 'ctaBg');
      bindText('inspTitle', 'title');
      bindText('inspText', 'text');
      bindText('inspTextColor', 'textColor');
      bindText('inspBgColor', 'bgColor');
      bindText('inspBorderColor', 'borderColor');
      document.getElementById('inspFontSize')?.addEventListener('input', (e) => {
        layer.fontSize = clamp(parseInt(e.target.value, 10) || 16, 10, 120);
        syncArtboardNodes();
        saveToStorage();
      });
      document.getElementById('inspAlign')?.addEventListener('change', (e) => {
        layer.textAlign = e.target.value;
        syncArtboardNodes();
        saveToStorage();
      });
      bindRange('inspBdBlur', 'valInspBdBlur', 'px', v => { layer.backdropBlur = v; });
    }

    // Common geometry & action bindings
    const bindNum = (id, prop, min = -2000, max = 6000) => {
      document.getElementById(id)?.addEventListener('change', (e) => {
        pushHistory();
        layer[prop] = clamp(parseInt(e.target.value, 10) || 0, min, max);
        syncArtboardNodes();
        renderLayersPanel();
        saveToStorage();
      });
    };
    bindNum('inspX', 'x');
    bindNum('inspY', 'y');
    bindNum('inspW', 'w', 40, 2400);
    bindNum('inspH', 'h', 28, 4800);
    bindNum('inspZ', 'zIndex', 0, 999);
    bindNum('inspRadius', 'borderRadius', 0, 999);

    inspectorBodyEl.querySelectorAll('[data-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        applyLayoutPreset(layer.id, btn.getAttribute('data-preset'));
      });
    });

    document.getElementById('btnInspDup')?.addEventListener('click', () => duplicateLayer(layer.id));
    document.getElementById('btnInspDel')?.addEventListener('click', () => deleteLayer(layer.id));
  }

  function bindRange(inputId, valId, suffix, applyFn) {
    const input = document.getElementById(inputId);
    const valEl = document.getElementById(valId);
    if (!input) return;
    input.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      applyFn(v);
      if (valEl) valEl.textContent = `${v}${suffix}`;
      syncArtboardNodes();
      saveToStorage();
    });
  }

  // ========================================================================
  // LAYER MUTATION OPERATIONS
  // ========================================================================
  function selectLayer(id) {
    state.selectedId = id;
    syncArtboardNodes();
    renderLayersPanel();
    renderInspector();
  }

  function addStoreComponent(compId, opts = {}) {
    const comp = getComponentById(compId);
    if (!comp) return;
    pushHistory();
    const layer = createComponentLayer(comp, opts);
    state.layers.push(layer);
    state.selectedId = layer.id;
    if (state.mode === 'interact') state.mode = 'edit';
    saveToStorage();
    renderAll();
    toast(`Added ${comp.name} to Website Canvas`);
    if (opts.scrollToCanvas) {
      document.getElementById('canvasSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function addUiBlock(blockType) {
    pushHistory();
    const layer = createBlockLayer(blockType);
    state.layers.push(layer);
    state.selectedId = layer.id;
    if (state.mode === 'interact') state.mode = 'edit';
    saveToStorage();
    renderAll();
    toast(`Added ${layer.name} block`);
  }

  function duplicateLayer(id) {
    const src = state.layers.find(l => l.id === id);
    if (!src) return;
    pushHistory();
    const clone = JSON.parse(JSON.stringify(src));
    clone.id = uid(src.kind === 'component' ? 'comp' : 'block');
    clone.x = Math.round(src.x + 24);
    clone.y = Math.round(src.y + 24);
    clone.zIndex = getNextZIndex();
    state.layers.push(clone);
    state.selectedId = clone.id;
    saveToStorage();
    renderAll();
    toast(`Duplicated ${src.name}`);
  }

  function deleteLayer(id) {
    const idx = state.layers.findIndex(l => l.id === id);
    if (idx === -1) return;
    pushHistory();
    const [removed] = state.layers.splice(idx, 1);
    if (state.selectedId === id) state.selectedId = null;
    saveToStorage();
    renderAll();
    toast(`Removed ${removed.name}`);
  }

  function shiftLayerZ(id, delta) {
    const layer = state.layers.find(l => l.id === id);
    if (!layer) return;
    pushHistory();
    layer.zIndex = Math.max(0, (Number(layer.zIndex) || 1) + delta);
    saveToStorage();
    renderAll();
  }

  function toggleLayerProp(id, prop) {
    const layer = state.layers.find(l => l.id === id);
    if (!layer) return;
    pushHistory();
    layer[prop] = !layer[prop];
    saveToStorage();
    renderAll();
  }

  function applyLayoutPreset(id, preset) {
    const layer = state.layers.find(l => l.id === id);
    if (!layer) return;
    pushHistory();
    const bw = getArtboardWidth();
    if (preset === 'full-bg') {
      layer.x = 0;
      layer.y = 0;
      layer.w = bw;
      layer.h = state.pageHeight;
      layer.zIndex = 1;
      layer.borderRadius = 0;
      if (layer.kind === 'component') layer.interactive = false;
    } else if (preset === 'hero') {
      layer.x = 0;
      layer.y = 0;
      layer.w = bw;
      layer.h = Math.min(state.pageHeight, 720);
      layer.borderRadius = 0;
    } else if (preset === 'center') {
      layer.x = Math.round((bw - layer.w) / 2);
    } else if (preset === 'left') {
      layer.x = 48;
      layer.w = Math.round(bw / 2 - 64);
    } else if (preset === 'right') {
      layer.w = Math.round(bw / 2 - 64);
      layer.x = bw - layer.w - 48;
    } else if (preset === 'wide') {
      layer.x = 48;
      layer.w = bw - 96;
    }
    saveToStorage();
    renderAll();
  }

  // ========================================================================
  // EXPORT: LIVE PREVIEW TAB, AI BUILD PROMPT, STANDALONE HTML, JSON
  // ========================================================================
  function buildComposedHtmlDocument(originBase = '') {
    const bw = getArtboardWidth();
    const sorted = [...state.layers]
      .filter(l => l.visible)
      .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    const nodesHtml = sorted.map(l => {
      const style = [
        'position:absolute',
        `left:${l.x}px`,
        `top:${l.y}px`,
        `width:${l.w}px`,
        `height:${l.h}px`,
        `z-index:${l.zIndex || 1}`,
        `opacity:${((l.opacity ?? 100) / 100).toFixed(2)}`,
        `border-radius:${l.borderRadius || 0}px`,
        'overflow:hidden'
      ];
      if (l.blendMode && l.blendMode !== 'normal') style.push(`mix-blend-mode:${l.blendMode}`);
      if (l.kind === 'component') {
        const filter = buildFilterCss(l);
        if (filter) style.push(`filter:${filter}`);
        const src = `${originBase}/api/preview/${encodeURIComponent(l.compId)}`;
        const pe = l.interactive === false ? 'none' : 'auto';
        return `    <!-- FrameVault Component: ${escapeHtml(l.compId)} (${escapeHtml(l.name)}) -->
    <div style="${style.join(';')}">
      <iframe src="${escapeHtml(src)}" style="width:100%;height:100%;border:0;display:block;pointer-events:${pe};" sandbox="allow-scripts allow-same-origin" loading="lazy"></iframe>
    </div>`;
      }
      return `    <div style="${style.join(';')}">${renderBlockInnerHtml(l)}</div>`;
    }).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FrameVault Canvas Website Design</title>
  <link href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      min-height: 100vh;
      background: ${escapeHtml(state.pageBg)};
      font-family: 'General Sans', Inter, -apple-system, BlinkMacSystemFont, sans-serif;
      color: #ffffff;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
    }
    .fv-stage-wrap { width: 100%; display: flex; justify-content: center; }
    .fv-page {
      position: relative;
      width: ${bw}px;
      min-height: ${state.pageHeight}px;
      background: ${escapeHtml(state.pageBg)};
      overflow: hidden;
    }
    .ok-cb-navbar { width:100%; height:100%; display:flex; align-items:center; justify-content:space-between; gap:16px; }
    .ok-cb-nav-brand { font-weight:700; font-size:15px; letter-spacing:-0.02em; white-space:nowrap; }
    .ok-cb-nav-links { display:flex; align-items:center; gap:24px; font-size:13.5px; opacity:0.84; }
    .ok-cb-nav-cta { padding:8px 16px; border-radius:999px; font-size:13px; font-weight:600; color:#fff; white-space:nowrap; }
    .ok-cb-heading { width:100%; height:100%; line-height:1.06; letter-spacing:-0.035em; }
    .ok-cb-text { width:100%; height:100%; line-height:1.55; }
    .ok-cb-button { width:100%; height:100%; display:flex; align-items:center; justify-content:center; cursor:pointer; }
    .ok-cb-card { width:100%; height:100%; display:flex; flex-direction:column; justify-content:center; gap:10px; }
    .ok-cb-card-title { font-size:18px; font-weight:650; letter-spacing:-0.02em; }
    .ok-cb-card-body { line-height:1.5; opacity:0.78; }
  </style>
</head>
<body>
  <div class="fv-stage-wrap">
    <main class="fv-page">
${nodesHtml}
    </main>
  </div>
</body>
</html>`;
  }

  function buildCanvasServerPayload(includeCustomParams = false) {
    return {
      pageBg: state.pageBg,
      pageWidth: getArtboardWidth(),
      pageHeight: state.pageHeight,
      layers: state.layers.map(l => {
        if (includeCustomParams && l.kind === 'component') {
          const comp = getComponentById(l.compId);
          if (comp && comp.controlParameterSet && window.FrameVaultApp?.isCustomized?.(comp.id)) {
            return { ...l, controlParameterSet: comp.controlParameterSet };
          }
        }
        return l;
      })
    };
  }

  async function openLivePreviewTab() {
    if (state.layers.length === 0) {
      toast('Add at least one component to preview');
      return;
    }
    const win = window.open('about:blank', '_blank');
    try {
      const res = await fetch('/api/preview-canvas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildCanvasServerPayload(false))
      });
      if (!res.ok) throw new Error('Preview request failed');
      const data = await res.json();
      if (data.previewUrl) {
        if (win) {
          win.location.href = data.previewUrl;
        } else {
          window.open(data.previewUrl, '_blank', 'noopener,noreferrer');
        }
        return;
      }
      throw new Error('Missing previewUrl');
    } catch (_) {
      if (win) win.close();
      toast('Could not open live preview — try again');
    }
  }

  async function exportHtmlFile() {
    if (state.layers.length === 0) {
      toast('Add at least one component before exporting');
      return;
    }
    toast('Compiling standalone HTML with embedded components...');
    try {
      const res = await fetch('/api/export-canvas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildCanvasServerPayload(true))
      });
      if (res.status === 402) {
        if (window.FrameVaultApp?.openCheckoutModal) {
          window.FrameVaultApp.openCheckoutModal(() => exportHtmlFile());
        } else {
          toast('All-Access Pass required to export standalone Canvas HTML');
        }
        return;
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast(errData.error || 'Failed to export Canvas HTML');
        return;
      }
      const html = await res.text();
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'framevault-website-canvas.html';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      toast('Downloaded self-contained framevault-website-canvas.html');
    } catch (_) {
      toast('Export failed — check your connection and try again');
    }
  }

  function copyAiBuildPrompt() {
    if (state.layers.length === 0) {
      toast('Add components to the canvas first');
      return;
    }
    const compLayers = state.layers.filter(l => l.kind === 'component' && l.visible);
    const blockLayers = state.layers.filter(l => l.kind === 'block' && l.visible);
    const lines = [
      `Build a responsive website matching my FrameVault Canvas design (${getArtboardWidth()}x${state.pageHeight}px, background ${state.pageBg}).`,
      '',
      'Use the framevault-ui MCP server (`get_component`) to fetch and integrate these exact store components:',
      ...compLayers.map((l, i) =>
        `${i + 1}. Component ID: "${l.compId}" (${l.name}, section: ${l.section}, engine: ${l.engine}) — position (${l.x}, ${l.y}), size ${l.w}x${l.h}px, z-index ${l.zIndex}, border-radius ${l.borderRadius}px, blend-mode ${l.blendMode}`
      ),
      '',
      'UI Copy & Structural Blocks:'
    ];
    blockLayers.forEach((b, i) => {
      if (b.blockType === 'navbar') {
        lines.push(`${i + 1}. Navbar: Brand "${b.brandText}", Links [${b.navLinks}], CTA "${b.ctaText}" at (${b.x}, ${b.y}) ${b.w}x${b.h}px`);
      } else if (b.blockType === 'card') {
        lines.push(`${i + 1}. Glass Card: "${b.title}" — "${b.text}" at (${b.x}, ${b.y}) ${b.w}x${b.h}px`);
      } else {
        lines.push(`${i + 1}. ${b.blockType.toUpperCase()}: "${b.text}" at (${b.x}, ${b.y}) ${b.w}x${b.h}px`);
      }
    });
    const prompt = lines.join('\n');
    navigator.clipboard?.writeText(prompt)
      .then(() => toast('Copied Canvas AI Build Prompt to clipboard'))
      .catch(() => toast('Unable to copy to clipboard'));
  }

  function saveProjectJson() {
    const blob = new Blob([snapshotState()], { type: 'application/json;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'framevault-canvas-project.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    toast('Saved canvas project JSON');
  }

  // ========================================================================
  // TOOLBAR & GLOBAL EVENTS
  // ========================================================================
  function syncToolbarState() {
    document.querySelectorAll('[data-canvas-mode]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-canvas-mode') === state.mode);
    });
    document.querySelectorAll('[data-canvas-vp]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-canvas-vp') === state.viewport);
    });
    document.querySelectorAll('[data-canvas-zoom]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-canvas-zoom') === state.zoomMode);
    });
    if (snapBtn) {
      snapBtn.classList.toggle('active', state.snap);
      snapBtn.setAttribute('aria-pressed', String(state.snap));
    }
    if (fullscreenBtn) {
      fullscreenBtn.textContent = state.isFullscreen ? 'Exit Full' : 'Expand';
    }
    shellEl.classList.toggle('is-fullscreen', state.isFullscreen);
  }

  function renderAll() {
    syncToolbarState();
    updateArtboardScale();
    syncArtboardNodes();
    renderLayersPanel();
    renderInspector();
    syncHistoryButtons();
  }

  function initEvents() {
    // Left Sidebar Tabs (Directory | Layers)
    document.querySelectorAll('[data-left-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-left-tab');
        document.querySelectorAll('[data-left-tab]').forEach(t => t.classList.toggle('active', t === tab));
        document.getElementById('canvasDirPanel')?.classList.toggle('active', target === 'directory');
        document.getElementById('canvasLayersPanel')?.classList.toggle('active', target === 'layers');
      });
    });

    // Directory search
    dirSearchEl?.addEventListener('input', (e) => {
      state.dirSearch = e.target.value || '';
      state.dirLimit = DIR_PAGE_SIZE;
      renderDirectoryList();
    });

    // Mode tabs (Edit | Interact)
    document.querySelectorAll('[data-canvas-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.mode = btn.getAttribute('data-canvas-mode') || 'edit';
        renderAll();
      });
    });

    // Viewport tabs (Desktop | Tablet | Mobile)
    document.querySelectorAll('[data-canvas-vp]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.viewport = btn.getAttribute('data-canvas-vp') || 'desktop';
        renderAll();
        saveToStorage();
      });
    });

    // Zoom tabs
    document.querySelectorAll('[data-canvas-zoom]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.zoomMode = btn.getAttribute('data-canvas-zoom') || 'fit';
        syncToolbarState();
        updateArtboardScale();
      });
    });

    // Add UI Block buttons
    document.querySelectorAll('[data-add-block]').forEach(btn => {
      btn.addEventListener('click', () => addUiBlock(btn.getAttribute('data-add-block')));
    });

    // Template selector & empty-state starter buttons
    templateSelectEl?.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val) loadTemplate(val, true);
      e.target.value = '';
    });
    document.getElementById('btnCanvasLoadStarterHero')?.addEventListener('click', () => loadTemplate('saas-hero', true));
    document.getElementById('btnCanvasLoadStarter3d')?.addEventListener('click', () => loadTemplate('product-3d', true));

    // Snap / Undo / Redo / Fullscreen
    snapBtn?.addEventListener('click', () => {
      state.snap = !state.snap;
      syncToolbarState();
      renderInspector();
    });
    undoBtn?.addEventListener('click', undo);
    redoBtn?.addEventListener('click', redo);
    fullscreenBtn?.addEventListener('click', () => {
      state.isFullscreen = !state.isFullscreen;
      document.body.style.overflow = state.isFullscreen ? 'hidden' : '';
      syncToolbarState();
      requestAnimationFrame(updateArtboardScale);
    });

    // Extend artboard height
    document.getElementById('btnCanvasExtendHeight')?.addEventListener('click', () => {
      pushHistory();
      state.pageHeight = clamp(state.pageHeight + 400, 600, 4800);
      updateArtboardScale();
      renderInspector();
      saveToStorage();
    });

    // Export / Preview / Save / Load / Clear
    document.getElementById('btnCanvasPreviewTab')?.addEventListener('click', openLivePreviewTab);
    document.getElementById('btnCanvasCopyPrompt')?.addEventListener('click', copyAiBuildPrompt);
    document.getElementById('btnCanvasExportHtml')?.addEventListener('click', exportHtmlFile);
    document.getElementById('btnCanvasSaveJson')?.addEventListener('click', saveProjectJson);
    document.getElementById('btnCanvasLoadJson')?.addEventListener('click', () => {
      document.getElementById('canvasLoadJsonInput')?.click();
    });
    document.getElementById('canvasLoadJsonInput')?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        pushHistory();
        restoreSnapshot(String(reader.result || ''));
        toast('Loaded canvas project JSON');
      };
      reader.readAsText(file);
      e.target.value = '';
    });
    document.getElementById('btnCanvasClearAll')?.addEventListener('click', () => {
      if (state.layers.length === 0) return;
      pushHistory();
      state.layers = [];
      state.selectedId = null;
      saveToStorage();
      renderAll();
      toast('Cleared all canvas layers');
    });

    // Click empty artboard deselects
    artboardEl.addEventListener('pointerdown', (e) => {
      if (e.target === artboardEl || e.target === layersHostEl) {
        selectLayer(null);
      }
    });

    // Drag & Drop from Store Directory directly onto Artboard
    artboardEl.addEventListener('dragover', (e) => {
      if (e.dataTransfer.types.includes('text/framevault-comp-id')) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }
    });
    artboardEl.addEventListener('drop', (e) => {
      const compId = e.dataTransfer.getData('text/framevault-comp-id');
      artboardEl.classList.remove('is-drag-target');
      if (!compId) return;
      e.preventDefault();
      const comp = getComponentById(compId);
      if (!comp) return;
      const rect = artboardEl.getBoundingClientRect();
      const dropX = (e.clientX - rect.left) / state.computedScale;
      const dropY = (e.clientY - rect.top) / state.computedScale;
      const isBg = comp.section === 'backgrounds';
      const w = isBg ? getArtboardWidth() : 460;
      const h = isBg ? Math.min(state.pageHeight, 720) : 380;
      addStoreComponent(compId, {
        asBackground: isBg,
        x: isBg ? 0 : Math.max(0, Math.round(dropX - w / 2)),
        y: isBg ? 0 : Math.max(0, Math.round(dropY - h / 2)),
        w,
        h
      });
    });

    // Keyboard shortcuts when canvas layer is selected
    window.addEventListener('keydown', (e) => {
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (document.getElementById('studioBackdrop')?.classList.contains('open')) return;

      if (e.key === 'Escape' && state.isFullscreen) {
        state.isFullscreen = false;
        document.body.style.overflow = '';
        syncToolbarState();
        requestAnimationFrame(updateArtboardScale);
        return;
      }

      if (!state.selectedId) return;
      const layer = state.layers.find(l => l.id === state.selectedId);
      if (!layer) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateLayer(layer.id);
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteLayer(layer.id);
        return;
      }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && !layer.locked) {
        e.preventDefault();
        const step = e.shiftKey ? 16 : 1;
        if (e.key === 'ArrowLeft') layer.x -= step;
        if (e.key === 'ArrowRight') layer.x += step;
        if (e.key === 'ArrowUp') layer.y -= step;
        if (e.key === 'ArrowDown') layer.y += step;
        syncArtboardNodes();
        updateInspectorGeometryFields(layer);
        saveToStorage();
      }
    });

    // ResizeObserver for smooth Fit scaling
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => {
        if (state.zoomMode === 'fit') updateArtboardScale();
      });
      ro.observe(stageViewportEl);
    } else {
      window.addEventListener('resize', () => {
        if (state.zoomMode === 'fit') updateArtboardScale();
      });
    }
  }

  // Expose public API so gallery cards can send components directly to Canvas
  window.FrameVaultCanvas = {
    addComponent: (compId, opts) => addStoreComponent(compId, opts),
    loadTemplate: (key) => loadTemplate(key, true)
  };

  // Boot Canvas
  renderDirectoryCategories();
  renderDirectoryList();
  initEvents();

  if (!loadFromStorage()) {
    loadTemplate('saas-hero', false);
  } else {
    renderAll();
  }
})();
