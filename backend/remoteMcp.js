const { convertHtmlToReactTsx, convertHtmlToFramerTsx } = require('./reactConverter');

function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getMcpId(comp) {
  return `${slugify(comp.section)}/${slugify(comp.name)}`;
}

function searchCatalog(catalog, args = {}) {
  const query = String(args.query || '*').trim().toLowerCase();
  const catFilter = String(args.category || '').trim().toLowerCase();
  const engFilter = String(args.engine || '').trim().toLowerCase();
  const limit = Math.max(1, Math.min(Number(args.limit) || 15, 100));

  const filtered = catalog.components.filter(c => {
    if (catFilter) {
      const sec = String(c.section || '').toLowerCase();
      const carouselAlias = catFilter.includes('carousel') && sec.includes('carasol');
      const bgAlias = (catFilter.includes('shader') || catFilter.includes('background')) && sec.includes('background');
      if (!sec.includes(catFilter) && !carouselAlias && !bgAlias) return false;
    }
    if (engFilter && !String(c.engine || '').toLowerCase().includes(engFilter)) {
      return false;
    }
    return true;
  });

  if (!query || query === '*' || query === 'all') {
    return filtered.slice(0, limit).map(c => ({
      id: getMcpId(c),
      catalogId: c.id,
      name: c.name,
      title: c.displayTitle,
      category: c.section,
      engine: c.engine,
      background: c.defaultBgColor || '#000000',
      formats: ['html', 'tsx']
    }));
  }

  const tokens = query.split(/[^a-z0-9]+/).filter(Boolean);
  const scored = [];
  for (const c of filtered) {
    const hay = `${getMcpId(c)} ${c.id} ${c.name} ${c.displayTitle} ${c.section} ${c.engine}`.toLowerCase();
    let score = 0;
    if (getMcpId(c) === query || c.id.toLowerCase() === query || c.name.toLowerCase() === query) {
      score += 100;
    }
    for (const tok of tokens) {
      if (hay.includes(tok)) score += 10;
      if (tok === 'carousel' && hay.includes('carasol')) score += 10;
      if ((tok === 'sphere' || tok === 'globe' || tok === 'ball') && hay.includes('orb')) score += 8;
      if ((tok === 'shader' || tok === 'glsl' || tok === 'bg' || tok === 'backdrop' || tok === 'animated' || tok === 'fluid' || tok === 'gradient') && (hay.includes('background') || hay.includes('webgl'))) score += 8;
      if ((tok === '3d' || tok === 'three') && (hay.includes('webgl') || hay.includes('3d') || hay.includes('cube') || hay.includes('orb'))) score += 6;
    }
    if (score > 0) {
      scored.push({
        score,
        item: {
          id: getMcpId(c),
          catalogId: c.id,
          name: c.name,
          title: c.displayTitle,
          category: c.section,
          engine: c.engine,
          background: c.defaultBgColor || '#000000',
          formats: ['html', 'tsx']
        }
      });
    }
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => s.item);
}

function findComponent(catalog, rawId) {
  const q = String(rawId || '').trim().toLowerCase();
  if (!q) return null;
  for (const c of catalog.components) {
    if (
      c.id.toLowerCase() === q ||
      getMcpId(c) === q ||
      c.name.toLowerCase() === q ||
      slugify(c.name) === q
    ) {
      return c;
    }
  }
  return null;
}

function buildDesignSystemGuide(catalog) {
  const bySec = {};
  const byEng = {};
  for (const c of catalog.components) {
    bySec[c.section] = (bySec[c.section] || 0) + 1;
    byEng[c.engine] = (byEng[c.engine] || 0) + 1;
  }
  return [
    '# FrameVault UI Design System Guidelines',
    '',
    `- **Total Indexed Components:** ${catalog.components.length} (available in both standalone HTML and TypeScript React \`.tsx\`)`,
    `- **Categories:** ${Object.entries(bySec).map(([k, v]) => `${k} (${v})`).join(', ')}`,
    `- **Rendering Engines:** ${Object.entries(byEng).map(([k, v]) => `${k} (${v})`).join(', ')}`,
    '',
    '## Adaptation Rules',
    '1. Always scope global `html, body` styles to a container wrapper when embedding into a multi-section app.',
    '2. Preserve WebGL/GLSL uniforms, Canvas 2D DPR clamping (`Math.min(devicePixelRatio, 2)`), and CSS 3D `preserve-3d` physics.',
    '3. Map brand colors via CSS custom properties or normalized `vec3(r/255, g/255, b/255)` shader constants rather than CSS filters.',
    '4. Always clean up `requestAnimationFrame`, `ResizeObserver`, and pointer/wheel listeners on component unmount.',
    '5. Render ONLY the pure visual/animated component itself — do NOT invent or add extra headlines, captions, labels, or editorial text around it unless the user explicitly asks for text.'
  ].join('\n');
}

function handleMcpJsonRpc(rpc, { catalog }) {
  if (!rpc || typeof rpc !== 'object' || rpc.jsonrpc !== '2.0' || !rpc.method) {
    return {
      status: 400,
      payload: {
        jsonrpc: '2.0',
        id: rpc?.id ?? null,
        error: { code: -32600, message: 'Invalid JSON-RPC 2.0 request' }
      }
    };
  }

  const id = rpc.id ?? null;
  const method = String(rpc.method);
  const params = rpc.params || {};

  // Notifications have no id and expect 202 Accepted with empty body
  if (method.startsWith('notifications/')) {
    return { status: 202, payload: null };
  }

  if (method === 'ping') {
    return { status: 200, payload: { jsonrpc: '2.0', id, result: {} } };
  }

  if (method === 'initialize') {
    const requestedVersion = String(params.protocolVersion || '').trim();
    const supportedVersions = new Set(['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05']);
    const negotiatedVersion = supportedVersions.has(requestedVersion) ? requestedVersion : '2025-03-26';
    return {
      status: 200,
      payload: {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: negotiatedVersion,
          capabilities: {
            tools: { listChanged: false },
            resources: { listChanged: false },
            prompts: { listChanged: false }
          },
          serverInfo: {
            name: 'framevault-ui-mcp',
            version: '1.0.0'
          }
        }
      }
    };
  }

  if (method === 'prompts/list') {
    return {
      status: 200,
      payload: {
        jsonrpc: '2.0',
        id,
        result: {
          prompts: []
        }
      }
    };
  }

  if (method === 'resources/templates/list') {
    return {
      status: 200,
      payload: {
        jsonrpc: '2.0',
        id,
        result: {
          resourceTemplates: []
        }
      }
    };
  }

  if (method === 'tools/list') {
    return {
      status: 200,
      payload: {
        jsonrpc: '2.0',
        id,
        result: {
          tools: [
            {
              name: 'search_components',
              description: 'Search the FrameVault 3D/WebGL/Canvas/DOM UI component library by natural-language query, category, or engine.',
              inputSchema: {
                type: 'object',
                properties: {
                  query: { type: 'string', description: 'Search query or "*" to list all components' },
                  category: { type: 'string', description: 'Optional category (orbs, assets, carasols, cubes)' },
                  engine: { type: 'string', description: 'Optional engine (WEBGL 3D, DOM 3D, CANVAS 2D)' },
                  limit: { type: 'number', description: 'Max results (default 15)' }
                },
                required: ['query']
              }
            },
            {
              name: 'get_component',
              description: 'Fetch raw standalone HTML or TypeScript React (.tsx) source code + Remix Prompt for a FrameVault component.',
              inputSchema: {
                type: 'object',
                properties: {
                  id: { type: 'string', description: 'Component id (e.g. "orbs/orb-1", "assets/asset-2")' },
                  format: { type: 'string', enum: ['html', 'tsx', 'framer'], description: 'Output format: "html" (default), "tsx" (TypeScript + React), or "framer" (Framer Code Component)' },
                  targetFramework: { type: 'string', description: 'Optional target framework for Remix guidance' }
                },
                required: ['id']
              }
            }
          ]
        }
      }
    };
  }

  if (method === 'tools/call') {
    const toolName = String(params.name || '');
    const args = params.arguments || {};

    if (toolName === 'search_components') {
      const results = searchCatalog(catalog, args);
      return {
        status: 200,
        payload: {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  totalIndexed: catalog.components.length,
                  matchCount: results.length,
                  results
                }, null, 2)
              }
            ]
          }
        }
      };
    }

    if (toolName === 'get_component') {
      const comp = findComponent(catalog, args.id);
      if (!comp) {
        return {
          status: 200,
          payload: {
            jsonrpc: '2.0',
            id,
            result: {
              isError: true,
              content: [
                {
                  type: 'text',
                  text: `Component "${args.id}" not found. Call search_components with query "*" to list available components.`
                }
              ]
            }
          }
        };
      }

      const rawFmt = String(args.format || 'html').toLowerCase();
      const format = rawFmt === 'framer' ? 'framer' : rawFmt === 'tsx' ? 'tsx' : 'html';
      const mcpId = getMcpId(comp);
      const fw = String(args.targetFramework || (format === 'framer' ? 'Framer Code Component' : format === 'tsx' ? 'React + TypeScript' : 'Standalone HTML'));
      let code = comp.htmlSource || '';
      let outFilename = comp.htmlPath || `${mcpId}.html`;
      if (format === 'tsx' || format === 'framer') {
        const reactOut = format === 'framer'
          ? convertHtmlToFramerTsx(code, { section: comp.section, name: comp.name, id: comp.id })
          : convertHtmlToReactTsx(code, { section: comp.section, name: comp.name, id: comp.id });
        code = reactOut.tsx;
        outFilename = reactOut.filename;
      }
      const fenceLang = format === 'html' ? 'html' : 'tsx';

      const text = [
        `# Component: ${comp.displayTitle} (\`${mcpId}\`)`,
        '',
        `## Remix Prompt (${fw})`,
        `- Render ONLY the pure visual/animated component itself — do NOT invent or add extra headlines, captions, labels, or editorial text around it unless the user explicitly asks for text.`,
        `- Inspect the target project's CSS tokens / Tailwind config before adapting colors.`,
        `- Scope layout styles to a container wrapper (never leak \`html, body { overflow: hidden }\`).`,
        `- Preserve all ${comp.engine} shaders, physics, and \`requestAnimationFrame\` cleanup hooks.`,
        '',
        `## Source Code (\`${outFilename}\`)`,
        `\`\`\`${fenceLang}`,
        code,
        '```'
      ].join('\n');

      return {
        status: 200,
        payload: {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text }]
          }
        }
      };
    }

    return {
      status: 200,
      payload: {
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Unknown tool: ${toolName}` }
      }
    };
  }

  if (method === 'resources/list') {
    return {
      status: 200,
      payload: {
        jsonrpc: '2.0',
        id,
        result: {
          resources: [
            {
              uri: 'ui://guidelines/design-system',
              name: 'design-system-guidelines',
              description: 'FrameVault surface palettes, engine conventions, and safe adaptation rules.',
              mimeType: 'text/markdown'
            }
          ]
        }
      }
    };
  }

  if (method === 'resources/read') {
    const uri = String(params.uri || '');
    if (uri !== 'ui://guidelines/design-system') {
      return {
        status: 200,
        payload: {
          jsonrpc: '2.0',
          id,
          error: { code: -32602, message: `Unknown resource URI: ${uri}` }
        }
      };
    }
    return {
      status: 200,
      payload: {
        jsonrpc: '2.0',
        id,
        result: {
          contents: [
            {
              uri,
              mimeType: 'text/markdown',
              text: buildDesignSystemGuide(catalog)
            }
          ]
        }
      }
    };
  }

  return {
    status: 200,
    payload: {
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method not found: ${method}` }
    }
  };
}

module.exports = { handleMcpJsonRpc };
