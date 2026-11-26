// FrameVault Figma Plugin — Sandbox Controller (code.js)
// Inserts native Figma Components/Frames with live-captured 2x visuals + FrameVault MCP metadata.

const STORAGE_KEY_LICENSE = 'framevault_license_key';
const STORAGE_KEY_SERVER = 'framevault_server_url';

figma.showUI(__html__, {
  width: 440,
  height: 700,
  themeColors: true
});

async function sendInitialState() {
  const [licenseKey, serverUrl] = await Promise.all([
    figma.clientStorage.getAsync(STORAGE_KEY_LICENSE),
    figma.clientStorage.getAsync(STORAGE_KEY_SERVER)
  ]);

  const selection = figma.currentPage.selection;
  let selectedFrameVaultId = null;
  if (selection.length === 1) {
    try {
      selectedFrameVaultId = selection[0].getPluginData('framevault_id') || null;
    } catch (_) {
      selectedFrameVaultId = null;
    }
  }

  figma.ui.postMessage({
    type: 'init-state',
    licenseKey: licenseKey || '',
    serverUrl: serverUrl || 'https://framevault-qtim.onrender.com',
    editorType: figma.editorType,
    selectedFrameVaultId
  });
}

figma.on('selectionchange', () => {
  const selection = figma.currentPage.selection;
  let selectedFrameVaultId = null;
  if (selection.length === 1) {
    try {
      selectedFrameVaultId = selection[0].getPluginData('framevault_id') || null;
    } catch (_) {
      selectedFrameVaultId = null;
    }
  }
  figma.ui.postMessage({
    type: 'selection-change',
    selectedFrameVaultId
  });
});

function buildMcpDescription(meta) {
  const mcpUrl = meta.mcpUrl || 'https://framevault-qtim.onrender.com/api/mcp';
  return [
    `FrameVault Component: ${meta.title || meta.name} (${meta.section})`,
    `Component ID: ${meta.id}`,
    `Tech: ${meta.tech || 'WebGL / HTML / React TSX'}`,
    '',
    `[AI / MCP Handover]`,
    `When implementing this frame in code, call FrameVault MCP tool:`,
    `  get_component({ id: "${meta.id}", format: "tsx" })`,
    `Remote MCP: ${mcpUrl}`
  ].join('\n');
}

function applyMetadata(node, meta) {
  node.name = `FrameVault / ${meta.section} / ${meta.name} [${meta.id}]`;
  try {
    node.setPluginData('framevault_id', String(meta.id || ''));
    node.setPluginData('framevault_name', String(meta.name || ''));
    node.setPluginData('framevault_section', String(meta.section || ''));
    node.setPluginData('framevault_title', String(meta.title || ''));
    node.setPluginData('framevault_mcp_url', String(meta.mcpUrl || ''));
    node.setPluginData('framevault_component', JSON.stringify({
      id: meta.id,
      name: meta.name,
      section: meta.section,
      title: meta.title,
      tech: meta.tech,
      mcpUrl: meta.mcpUrl
    }));
  } catch (_) {}

  if ('description' in node) {
    try {
      node.description = buildMcpDescription(meta);
    } catch (_) {}
  }
}

figma.ui.onmessage = async (msg) => {
  if (!msg || typeof msg !== 'object') return;

  if (msg.type === 'ready') {
    await sendInitialState();
    return;
  }

  if (msg.type === 'save-auth') {
    await Promise.all([
      figma.clientStorage.setAsync(STORAGE_KEY_LICENSE, String(msg.licenseKey || '')),
      figma.clientStorage.setAsync(STORAGE_KEY_SERVER, String(msg.serverUrl || 'https://framevault-qtim.onrender.com'))
    ]);
    return;
  }

  if (msg.type === 'clear-auth') {
    await figma.clientStorage.deleteAsync(STORAGE_KEY_LICENSE);
    figma.notify('Signed out of FrameVault.');
    return;
  }

  if (msg.type === 'notify') {
    figma.notify(String(msg.message || ''), { error: Boolean(msg.error) });
    return;
  }

  if (msg.type === 'insert-component') {
    try {
      const meta = msg.meta || {};
      const width = Math.max(160, Math.min(4096, Number(msg.width) || 1200));
      const height = Math.max(120, Math.min(4096, Number(msg.height) || 800));
      const imageBytes = msg.imageBytes ? new Uint8Array(msg.imageBytes) : null;
      const updateSelected = Boolean(msg.updateSelected);

      let targetNode = null;
      if (updateSelected && figma.currentPage.selection.length === 1) {
        const sel = figma.currentPage.selection[0];
        if (sel.type === 'COMPONENT' || sel.type === 'FRAME' || sel.type === 'RECTANGLE') {
          targetNode = sel;
        }
      }

      if (!targetNode) {
        if (figma.editorType === 'figma' && msg.asComponent !== false) {
          targetNode = figma.createComponent();
        } else {
          targetNode = figma.createFrame();
        }
        targetNode.resize(width, height);
        targetNode.clipsContent = true;
        targetNode.cornerRadius = Number(msg.cornerRadius || 16);

        // Place neatly at current viewport center
        const center = figma.viewport.center;
        targetNode.x = Math.round(center.x - width / 2);
        targetNode.y = Math.round(center.y - height / 2);
        figma.currentPage.appendChild(targetNode);
      }

      if (imageBytes && imageBytes.length > 0) {
        const img = figma.createImage(imageBytes);
        targetNode.fills = [
          {
            type: 'IMAGE',
            scaleMode: 'FILL',
            imageHash: img.hash
          }
        ];
      } else {
        targetNode.fills = [
          {
            type: 'SOLID',
            color: { r: 0.04, g: 0.04, b: 0.06 }
          }
        ];
      }

      applyMetadata(targetNode, meta);

      figma.currentPage.selection = [targetNode];
      figma.viewport.scrollAndZoomIntoView([targetNode]);

      figma.notify(
        updateSelected
          ? `Updated FrameVault component: ${meta.name}`
          : `Inserted ${meta.name} (MCP-ready Figma Component)`
      );
      figma.ui.postMessage({ type: 'insert-done', ok: true, id: meta.id });
    } catch (err) {
      const errMsg = err && err.message ? err.message : String(err);
      figma.notify(`Insert failed: ${errMsg}`, { error: true });
      figma.ui.postMessage({ type: 'insert-done', ok: false, error: errMsg });
    }
  }
};
