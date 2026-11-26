const path = require('path');

const ATTR_MAP = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
  readonly: 'readOnly',
  maxlength: 'maxLength',
  colspan: 'colSpan',
  rowspan: 'rowSpan',
  'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-dasharray': 'strokeDasharray',
  'stroke-dashoffset': 'strokeDashoffset',
  'stroke-opacity': 'strokeOpacity',
  'stroke-miterlimit': 'strokeMiterlimit',
  'fill-opacity': 'fillOpacity',
  'fill-rule': 'fillRule',
  'clip-rule': 'clipRule',
  'clip-path': 'clipPath',
  'stop-color': 'stopColor',
  'stop-opacity': 'stopOpacity',
  'color-interpolation-filters': 'colorInterpolationFilters',
  'flood-color': 'floodColor',
  'flood-opacity': 'floodOpacity',
  'font-family': 'fontFamily',
  'font-size': 'fontSize',
  'font-weight': 'fontWeight',
  'text-anchor': 'textAnchor',
  'dominant-baseline': 'dominantBaseline',
  'pointer-events': 'pointerEvents',
  'vector-effect': 'vectorEffect',
  'xlink:href': 'xlinkHref',
  crossorigin: 'crossOrigin'
};

const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

function toPascalCase(input) {
  const cleaned = String(input || 'FrameVaultComponent')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim();
  const pascal = cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
  if (!pascal) return 'FrameVaultComponent';
  return /^[0-9]/.test(pascal) ? `Component${pascal}` : pascal;
}

function slugify(input) {
  return String(input || 'component')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'component';
}

function cssPropToCamel(prop) {
  const p = prop.trim();
  if (p.startsWith('--')) return p;
  return p.replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
}

function inlineStyleToJsxObject(styleStr) {
  const entries = [];
  for (const decl of String(styleStr || '').split(';')) {
    const idx = decl.indexOf(':');
    if (idx <= 0) continue;
    const rawKey = decl.slice(0, idx).trim();
    const rawVal = decl.slice(idx + 1).trim();
    if (!rawKey || !rawVal) continue;
    const camelKey = cssPropToCamel(rawKey);
    const keyOut = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(camelKey)
      ? camelKey
      : JSON.stringify(camelKey);
    entries.push(`${keyOut}: ${JSON.stringify(rawVal)}`);
  }
  return `{{ ${entries.join(', ')} }}`;
}

function convertHtmlBodyToJsx(bodyHtml) {
  let jsx = String(bodyHtml || '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<!--([\s\S]*?)-->/g, (_, comment) => `{/* ${comment.trim().replace(/\*\//g, '* /')} */}`)
    .trim();

  // Convert opening tags: map attributes, convert inline style="..." to style={{ ... }}, self-close void tags
  jsx = jsx.replace(/<([a-zA-Z][a-zA-Z0-9:-]*)(\s[^>]*?)?(\/?)>/g, (full, tagName, rawAttrs = '', selfClose = '') => {
    let attrs = rawAttrs || '';

    // Convert style="..." or style='...'
    attrs = attrs.replace(/\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi, (_, dVal, sVal) => {
      const val = dVal !== undefined ? dVal : sVal;
      return `style=${inlineStyleToJsxObject(val)}`;
    });

    // Convert mapped attributes (only attribute names outside quoted values)
    attrs = attrs.replace(/(\s)([a-zA-Z_:][a-zA-Z0-9_.:-]*)(\s*=)/g, (m, lead, name, eq) => {
      const lower = name.toLowerCase();
      if (ATTR_MAP[lower]) {
        return `${lead}${ATTR_MAP[lower]}${eq}`;
      }
      return m;
    });

    const isVoid = VOID_TAGS.has(tagName.toLowerCase());
    const closing = selfClose === '/' || isVoid ? ' />' : '>';
    return `<${tagName}${attrs}${closing}`;
  });

  // Escape raw &nbsp; -> {'\u00A0'} is not needed in JSX (JSX supports HTML entities like &nbsp;),
  // but ensure unescaped braces in text aren't broken (none in our tags unless outside JSX expressions).
  return jsx;
}

/**
 * Scopes raw CSS rules to `.${scopeClass}` without breaking @keyframes, @font-face, or @media.
 */
function scopeCss(rawCss, scopeClass) {
  const scope = `.${scopeClass}`;
  let css = String(rawCss || '');

  // Rewrite viewport-locked units so the React component fits cleanly inside any container
  css = css
    .replace(/\b100vw\b/g, '100%')
    .replace(/\b100vh\b/g, '100%')
    .replace(/\b100dvh\b/g, '100%')
    .replace(/\bposition\s*:\s*fixed\b/gi, 'position: absolute');

  function transformBlock(input) {
    let out = '';
    let i = 0;
    const len = input.length;

    while (i < len) {
      // Preserve comments
      if (input[i] === '/' && input[i + 1] === '*') {
        const end = input.indexOf('*/', i + 2);
        if (end === -1) {
          out += input.slice(i);
          break;
        }
        out += input.slice(i, end + 2);
        i = end + 2;
        continue;
      }

      // Copy whitespace
      if (/\s/.test(input[i])) {
        out += input[i++];
        continue;
      }

      // Find next { or ;
      let headerStart = i;
      while (i < len && input[i] !== '{' && input[i] !== ';') {
        if (input[i] === '/' && input[i + 1] === '*') {
          const end = input.indexOf('*/', i + 2);
          i = end === -1 ? len : end + 2;
        } else {
          i++;
        }
      }

      if (i >= len) {
        out += input.slice(headerStart);
        break;
      }

      if (input[i] === ';') {
        // Standalone at-rule like @import or @charset
        out += input.slice(headerStart, i + 1);
        i++;
        continue;
      }

      const header = input.slice(headerStart, i).trim();
      // Find matching closing brace
      let depth = 0;
      const bodyStart = i + 1;
      let j = i;
      while (j < len) {
        if (input[j] === '/' && input[j + 1] === '*') {
          const end = input.indexOf('*/', j + 2);
          j = end === -1 ? len : end + 2;
          continue;
        }
        if (input[j] === '{') depth++;
        else if (input[j] === '}') {
          depth--;
          if (depth === 0) break;
        }
        j++;
      }

      const body = input.slice(bodyStart, j);
      i = j + 1;

      if (header.startsWith('@')) {
        if (/^@(media|supports|container|layer)\b/i.test(header)) {
          out += `${header} {\n${transformBlock(body)}\n}`;
        } else {
          // @keyframes, @font-face, @property: leave inner selectors untouched
          out += `${header} {${body}}`;
        }
        continue;
      }

      // Scope each comma-separated selector
      const scopedSelectors = header
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .map(sel => {
          if (sel === '*' || sel === '*::before' || sel === '*::after') {
            return `${scope} ${sel}`;
          }
          if (/^(html|body|:root)$/i.test(sel)) {
            return scope;
          }
          // e.g. body.psychedelic-mode or body.dark .foo
          if (/^(html|body)\b/i.test(sel)) {
            return sel.replace(/^(html|body)/i, scope);
          }
          if (sel.includes(scope)) return sel;
          return `${scope} ${sel}`;
        });

      // Deduplicate selectors (e.g. `html, body` -> single `.fv-...`)
      const uniqueSelectors = [...new Set(scopedSelectors)];
      out += `${uniqueSelectors.join(', ')} {${body}}`;
    }
    return out;
  }

  const scoped = transformBlock(css).trim();
  const wrapperBase = `${scope} {\n  position: relative;\n  width: 100%;\n  height: 100%;\n  overflow: hidden;\n}`;
  return `${wrapperBase}\n\n${scoped}`;
}

function escapeTemplateLiteral(str) {
  return String(str || '')
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
}

function extractParts(html) {
  const src = String(html || '');
  const titleMatch = src.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : 'FrameVault Component';

  const fontLinks = [];
  for (const m of src.matchAll(/<link\b[^>]*rel\s*=\s*['"]stylesheet['"][^>]*>/gi)) {
    const hrefM = m[0].match(/href\s*=\s*['"]([^'"]+)['"]/i);
    if (hrefM && /^https?:\/\//i.test(hrefM[1])) {
      fontLinks.push(hrefM[1]);
    }
  }

  const styles = [];
  for (const m of src.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    styles.push(m[1].trim());
  }

  const bodyMatch = src.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : src;

  const scripts = [];
  for (const m of src.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (!/\bsrc\s*=/i.test(m[1])) {
      scripts.push(m[2].trim());
    }
  }

  const hasLocalImages = /['"`]images\//.test(src);

  return {
    title,
    fontLinks: [...new Set(fontLinks)],
    rawCss: styles.join('\n\n'),
    bodyHtml: bodyContent,
    rawScript: scripts.join('\n\n'),
    hasLocalImages
  };
}

/**
 * Lightweight tokenizer that skips strings, template literals, comments, and regexes
 * so GLSL shader strings are never modified while annotating untyped JS for strict TypeScript.
 */
function annotateRuntimeScriptForTs(code) {
  const src = String(code || '');
  const len = src.length;
  let out = '';
  let i = 0;

  // Helper to copy a balanced string/template/comment verbatim
  const copyQuoted = (quote) => {
    let s = src[i++];
    while (i < len) {
      const ch = src[i];
      s += ch;
      i++;
      if (ch === '\\' && i < len) {
        s += src[i++];
        continue;
      }
      if (ch === quote) break;
    }
    return s;
  };

  const copyTemplate = () => {
    let s = src[i++]; // opening `
    while (i < len) {
      const ch = src[i];
      if (ch === '\\' && i + 1 < len) {
        s += ch + src[i + 1];
        i += 2;
        continue;
      }
      if (ch === '`') {
        s += ch;
        i++;
        break;
      }
      if (ch === '$' && src[i + 1] === '{') {
        s += '${';
        i += 2;
        let depth = 1;
        while (i < len && depth > 0) {
          const c = src[i];
          if (c === "'" || c === '"') { s += copyQuoted(c); continue; }
          if (c === '`') { s += copyTemplate(); continue; }
          if (c === '{') depth++;
          else if (c === '}') depth--;
          s += c;
          i++;
        }
        continue;
      }
      s += ch;
      i++;
    }
    return s;
  };

  const annotateParamList = (rawParams, makeOptional = false) => {
    if (!rawParams.trim()) return rawParams;
    const parts = [];
    let cur = '';
    let depth = 0;
    for (let k = 0; k < rawParams.length; k++) {
      const ch = rawParams[k];
      if (ch === '(' || ch === '[' || ch === '{') depth++;
      else if (ch === ')' || ch === ']' || ch === '}') depth--;
      if (ch === ',' && depth === 0) {
        parts.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    parts.push(cur);

    const hasFollowingRequired = parts.map(p => !p.includes('='));
    return parts
      .map((part, idx) => {
        const trimmed = part.trim();
        if (!trimmed || trimmed.includes(':')) return part;
        const lead = part.match(/^\s*/)[0];
        const trail = part.match(/\s*$/)[0];
        if (trimmed.startsWith('...')) {
          return `${lead}${trimmed}: any[]${trail}`;
        }
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const lhs = trimmed.slice(0, eqIdx).trim();
          const rhs = trimmed.slice(eqIdx + 1).trim();
          return `${lead}${lhs}: any = ${rhs}${trail}`;
        }
        // Only mark optional if makeOptional and no later non-optional params
        const canBeOpt = makeOptional && !hasFollowingRequired.slice(idx + 1).some(Boolean);
        return `${lead}${trimmed}${canBeOpt ? '?' : ''}: any${trail}`;
      })
      .join(',');
  };

  while (i < len) {
    const ch = src[i];

    // Comments
    if (ch === '/' && src[i + 1] === '/') {
      const end = src.indexOf('\n', i + 2);
      if (end === -1) { out += src.slice(i); break; }
      out += src.slice(i, end);
      i = end;
      continue;
    }
    if (ch === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      if (end === -1) { out += src.slice(i); break; }
      out += src.slice(i, end + 2);
      i = end + 2;
      continue;
    }

    // Strings & Templates (GLSL shaders live inside backticks — never touch them!)
    if (ch === "'" || ch === '"') {
      out += copyQuoted(ch);
      continue;
    }
    if (ch === '`') {
      out += copyTemplate();
      continue;
    }

    // `function name(a, b)` or `function(a, b)`
    if (src.startsWith('function', i) && !/[a-zA-Z0-9_$]/.test(src[i - 1] || '') && !/[a-zA-Z0-9_$]/.test(src[i + 8] || '')) {
      const sub = src.slice(i);
      const m = sub.match(/^function(\s+[a-zA-Z_$][a-zA-Z0-9_$]*)?\s*\(([^)]*)\)/);
      if (m) {
        const fnName = m[1] || '';
        const params = m[2];
        // Allow optional trailing params for named JS helpers like makeBuffer(target, data, usage)
        const annotated = annotateParamList(params, Boolean(fnName.trim()));
        out += `function${fnName}(${annotated})`;
        i += m[0].length;
        continue;
      }
    }

    // Variable declarations: annotate empty arrays (`= []`), `let x;`, and `let x = null`
    // including comma-separated lists like `let w = 0, traces = [], signals = [];`
    if (
      (src.startsWith('const ', i) || src.startsWith('let ', i)) &&
      !/[a-zA-Z0-9_$]/.test(src[i - 1] || '')
    ) {
      const kw = src.startsWith('const ', i) ? 'const' : 'let';
      let j = i + kw.length;
      let depth = 0;
      let inStr = null;
      while (j < len) {
        const c = src[j];
        if (inStr) {
          if (c === '\\') { j += 2; continue; }
          if (c === inStr) inStr = null;
          j++;
          continue;
        }
        if (c === "'" || c === '"' || c === '`') { inStr = c; j++; continue; }
        if (c === '(' || c === '[' || c === '{') depth++;
        else if (c === ')' || c === ']' || c === '}') {
          if (depth === 0) break;
          depth--;
        } else if (depth === 0 && (c === ';' || c === '\n')) {
          break;
        }
        j++;
      }
      const rawDeclList = src.slice(i + kw.length, j);
      // Only rewrite if it contains at least one untyped `= []`, `= null`, or uninitialized `let` declarator
      // and is not a `for (let x of ...)` / `for (let x in ...)` header.
      if (!/^\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s+(of|in)\b/.test(rawDeclList)) {
        const parts = [];
        let cur = '';
        let pDepth = 0;
        let pStr = null;
        for (let k = 0; k < rawDeclList.length; k++) {
          const c = rawDeclList[k];
          if (pStr) {
            cur += c;
            if (c === '\\' && k + 1 < rawDeclList.length) { cur += rawDeclList[++k]; continue; }
            if (c === pStr) pStr = null;
            continue;
          }
          if (c === "'" || c === '"' || c === '`') { pStr = c; cur += c; continue; }
          if (c === '(' || c === '[' || c === '{') pDepth++;
          else if (c === ')' || c === ']' || c === '}') pDepth--;
          if (c === ',' && pDepth === 0) {
            parts.push(cur);
            cur = '';
          } else {
            cur += c;
          }
        }
        parts.push(cur);

        let changed = false;
        const rewritten = parts.map(part => {
          const lead = part.match(/^\s*/)[0];
          const trail = part.match(/\s*$/)[0];
          const trimmed = part.trim();
          if (!trimmed || trimmed.includes(':')) return part;

          const arrM = trimmed.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*\[\s*\]$/);
          if (arrM) {
            changed = true;
            const arrType = kw === 'let' ? 'any' : 'any[]';
            return `${lead}${arrM[1]}: ${arrType} = []${trail}`;
          }
          if (kw === 'let') {
            const nullM = trimmed.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*null$/);
            if (nullM) {
              changed = true;
              return `${lead}${nullM[1]}: any = null${trail}`;
            }
            const uninitM = trimmed.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)$/);
            if (uninitM) {
              changed = true;
              return `${lead}${uninitM[1]}: any${trail}`;
            }
          }
          return part;
        });

        if (changed) {
          out += `${kw}${rewritten.join(',')}`;
          i = j;
          continue;
        }
      }
    }

    // Parenthesized arrow function `(a, b) =>`
    if (ch === '(') {
      let depth = 1;
      let j = i + 1;
      while (j < len && depth > 0) {
        if (src[j] === '(') depth++;
        else if (src[j] === ')') depth--;
        j++;
      }
      if (depth === 0) {
        const after = src.slice(j);
        if (/^\s*=>/.test(after)) {
          const inner = src.slice(i + 1, j - 1);
          // Only annotate if it looks like a parameter list (not an expression)
          if (!/[;+\-*/<>?!]/.test(inner)) {
            out += `(${annotateParamList(inner, false)})`;
            i = j;
            continue;
          }
        }
      }
    }

    // Single-identifier arrow function `e =>`
    if (/[a-zA-Z_$]/.test(ch) && !/[a-zA-Z0-9_$.]/.test(src[i - 1] || '')) {
      const sub = src.slice(i);
      const singleArrow = sub.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*=>)/);
      if (singleArrow && !/^(return|typeof|void|await|new|else|case|in|of)$/.test(singleArrow[1])) {
        out += `(${singleArrow[1]}: any)${singleArrow[2]}`;
        i += singleArrow[0].length;
        continue;
      }
    }

    out += ch;
    i++;
  }

  return out;
}

/**
 * Rewrites component runtime script so it binds to the scoped React container (`root`),
 * tracks & cleans up all event listeners + requestAnimationFrame loops on unmount,
 * and supports optional `imageBasePath` for local carousel images.
 */
function transformScriptForReact(rawScript, hasLocalImages) {
  let code = String(rawScript || '');
  if (!code.trim()) return '';

  // Replace relative 'images/...' paths when imageBasePath prop is provided
  if (hasLocalImages) {
    code = code.replace(
      /(["'])images\/([^"']+)\1/g,
      '`${imgBase}/$2`'
    );
  }

  // Scope globals cleanly to the React component instance via shadowed parameters
  // and annotate untyped JS parameters/arrays for strict TypeScript compatibility.
  return annotateRuntimeScriptForTs(code);
}

/**
 * Converts a standalone FrameVault HTML component into a strictly-typed,
 * leak-free TypeScript + React ('use client') component (.tsx).
 */
function convertHtmlToReactTsx(html, meta = {}) {
  const parts = extractParts(html);
  const rawName = meta.componentName || meta.name || parts.title;
  const componentName = toPascalCase(rawName);
  const scopeSlug = slugify(
    meta.id || (meta.section ? `${meta.section}-${meta.name || rawName}` : rawName)
  );
  const scopeClass = `fv-${scopeSlug}`;

  const scopedCss = scopeCss(parts.rawCss, scopeClass);
  const jsxBody = convertHtmlBodyToJsx(parts.bodyHtml);
  const indentedJsx = jsxBody
    ? jsxBody
        .split(/\r?\n/)
        .map(line => (line.trim() ? `        ${line}` : ''))
        .join('\n')
    : '        {/* Procedural component stage */}';

  const runtimeCode = transformScriptForReact(parts.rawScript, parts.hasLocalImages);
  const hasScript = Boolean(runtimeCode.trim());
  const hasFonts = parts.fontLinks.length > 0;

  const propsLines = [
    `export interface ${componentName}Props {`,
    `  /** Additional CSS class names for the root container */`,
    `  className?: string;`,
    `  /** Inline styles applied to the root container */`,
    `  style?: React.CSSProperties;`,
    `  /** Container width (default: '100%') */`,
    `  width?: number | string;`,
    `  /** Container height (default: '100%') */`,
    `  height?: number | string;`
  ];
  if (parts.hasLocalImages) {
    propsLines.push(
      `  /** Base URL/path for local images (default: 'images') */`,
      `  imageBasePath?: string;`
    );
  }
  propsLines.push(`}`);

  const fontConstBlock = hasFonts
    ? `\nconst FONT_STYLESHEETS: readonly string[] = ${JSON.stringify(parts.fontLinks, null, 2)};\n`
    : '';

  const fontEffectBlock = hasFonts
    ? `
    // Load required Google Fonts once per document
    for (const href of FONT_STYLESHEETS) {
      if (!document.querySelector(\`link[rel="stylesheet"][href="\${href}"]\`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
      }
    }`
    : '';

  const imgBaseLine = parts.hasLocalImages
    ? `\n    const imgBase = imageBasePath.replace(/\\/+$/, '');`
    : '';

  // Note: To keep the component strictly type-checked under `tsc --strict` with ZERO eval/new Function
  // AND preserve exact original WebGL/Canvas/DOM3D JS runtime fidelity, we isolate the runtime initializer
  // in a cleanly typed helper function with scoped `document`, `window`, `requestAnimationFrame`, and `cancelAnimationFrame`.
  const scriptSection = hasScript
    ? `
// Scoped DOM/Window runtime adapter so WebGL/Canvas/DOM3D logic runs strictly inside this
// component's container and cleans up all RAF loops & event listeners on React unmount.
interface ScopedRuntimeContext {
  root: HTMLDivElement;
  document: Document;
  window: Window;
  requestAnimationFrame: (cb: FrameRequestCallback) => number;
  cancelAnimationFrame: (id: number) => void;${parts.hasLocalImages ? '\n  imgBase: string;' : ''}
}

/* eslint-disable */
function init${componentName}Runtime(__fvRuntime: ScopedRuntimeContext): void {
  const { document, window, requestAnimationFrame, cancelAnimationFrame${parts.hasLocalImages ? ', imgBase' : ''} } = __fvRuntime as any;
${runtimeCode
  .split(/\r?\n/)
  .map(line => `  ${line}`)
  .join('\n')}
}
/* eslint-enable */
`
    : '';

  const effectBody = hasScript
    ? `  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
${fontEffectBlock}${imgBaseLine}
    let disposed = false;
    const rafIds = new Set<number>();
    const cleanups: Array<() => void> = [];
    const resizeCallbacks = new Set<() => void>();

    const scopedRaf = (cb: FrameRequestCallback): number => {
      if (disposed) return 0;
      const id = window.requestAnimationFrame((ts: number) => {
        rafIds.delete(id);
        if (!disposed) cb(ts);
      });
      rafIds.add(id);
      return id;
    };

    const scopedCaf = (id: number): void => {
      rafIds.delete(id);
      window.cancelAnimationFrame(id);
    };

    const scopedDoc = new Proxy(document, {
      get(target, prop) {
        if (prop === 'body' || prop === 'documentElement') return root;
        if (prop === 'getElementById') {
          return (id: string) =>
            root.querySelector(\`#\${CSS.escape(id)}\`) || target.getElementById(id);
        }
        if (prop === 'querySelector') {
          return (sel: string) => root.querySelector(sel);
        }
        if (prop === 'querySelectorAll') {
          return (sel: string) => root.querySelectorAll(sel);
        }
        if (prop === 'addEventListener') {
          return (type: string, listener: EventListenerOrEventListenerObject, opts?: boolean | AddEventListenerOptions) => {
            target.addEventListener(type, listener, opts);
            cleanups.push(() => target.removeEventListener(type, listener, opts));
          };
        }
        const val = Reflect.get(target, prop);
        return typeof val === 'function' ? val.bind(target) : val;
      }
    }) as Document;

    const scopedWin = new Proxy(window, {
      get(target, prop) {
        if (prop === 'innerWidth') return root.clientWidth || target.innerWidth;
        if (prop === 'innerHeight') return root.clientHeight || target.innerHeight;
        if (prop === 'requestAnimationFrame') return scopedRaf;
        if (prop === 'cancelAnimationFrame') return scopedCaf;
        if (prop === 'addEventListener') {
          return (type: string, listener: EventListenerOrEventListenerObject, opts?: boolean | AddEventListenerOptions) => {
            if (type === 'resize' && typeof listener === 'function') {
              resizeCallbacks.add(listener as () => void);
            }
            const host: EventTarget =
              type === 'pointerdown' || type === 'mousedown' || type === 'touchstart' || type === 'wheel'
                ? root
                : target;
            host.addEventListener(type, listener, opts);
            cleanups.push(() => host.removeEventListener(type, listener, opts));
          };
        }
        const val = Reflect.get(target, prop);
        return typeof val === 'function' ? val.bind(target) : val;
      }
    }) as Window;

    const ro = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => {
          if (disposed) return;
          resizeCallbacks.forEach(fn => {
            try { fn(); } catch { /* ignore */ }
          });
        })
      : null;
    ro?.observe(root);

    init${componentName}Runtime({
      root,
      document: scopedDoc,
      window: scopedWin,
      requestAnimationFrame: scopedRaf,
      cancelAnimationFrame: scopedCaf${parts.hasLocalImages ? ',\n      imgBase' : ''}
    });

    return () => {
      disposed = true;
      ro?.disconnect();
      resizeCallbacks.clear();
      rafIds.forEach(id => window.cancelAnimationFrame(id));
      rafIds.clear();
      cleanups.forEach(fn => {
        try { fn(); } catch { /* ignore */ }
      });
      cleanups.length = 0;
    };
  }, [${parts.hasLocalImages ? 'imageBasePath' : ''}]);`
    : hasFonts
      ? `  useEffect(() => {${fontEffectBlock}\n  }, []);`
      : '';

  const destructuredProps = parts.hasLocalImages
    ? `{ className, style, width = '100%', height = '100%', imageBasePath = 'images' }`
    : `{ className, style, width = '100%', height = '100%' }`;

  const tsx = `'use client';

/**
 * ${parts.title}
 * Converted from FrameVault HTML component to TypeScript + React (.tsx)
 */
import React, { useEffect, useRef } from 'react';

${propsLines.join('\n')}
${fontConstBlock}
const SCOPED_STYLES = \`
${escapeTemplateLiteral(scopedCss)}
\`;
${scriptSection}
export function ${componentName}(${destructuredProps}: ${componentName}Props) {
  const containerRef = useRef<HTMLDivElement>(null);

${effectBody}

  return (
    <div
      ref={containerRef}
      className={className ? \`${scopeClass} \${className}\` : '${scopeClass}'}
      style={{ width, height, ...style }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_STYLES }} />
${indentedJsx}
    </div>
  );
}

export default ${componentName};
`;

  return {
    componentName,
    filename: `${componentName}.tsx`,
    tsx
  };
}

function convertHtmlToFramerTsx(html, meta = {}) {
  const base = convertHtmlToReactTsx(html, meta);
  const name = base.componentName;
  const hasImages = base.tsx.includes('imageBasePath?: string;');

  // Remove Next.js 'use client' directive (Framer uses client-side React directly)
  let framerTsx = base.tsx.replace(/^'use client';\s*\n\s*/m, '');

  // Inject Framer import right after React import
  framerTsx = framerTsx.replace(
    `import React, { useEffect, useRef } from 'react';`,
    `import React, { useEffect, useRef } from 'react';\nimport { addPropertyControls, ControlType } from 'framer';`
  );

  // Add Framer usage header
  framerTsx = framerTsx.replace(
    ' * Converted from FrameVault HTML component to TypeScript + React (.tsx)',
    ' * FrameVault Framer Code Component (.tsx)\n * In Framer: Assets -> Code -> Create Code File -> Paste -> Save -> Drag onto Canvas'
  );

  // Add borderRadius prop to Props interface
  framerTsx = framerTsx.replace(
    '  height?: number | string;',
    '  height?: number | string;\n  /** Corner radius in pixels (controlled from Framer sidebar) */\n  borderRadius?: number;'
  );

  // Use `export default function` directly with Framer JSDoc layout annotations above it
  const framerAnnotations = [
    '/**',
    ' * @framerSupportedLayoutWidth any-prefer-fixed',
    ' * @framerSupportedLayoutHeight any-prefer-fixed',
    ' * @framerIntrinsicWidth 800',
    ' * @framerIntrinsicHeight 600',
    ' */',
    `export default function ${name}(`
  ].join('\n');
  framerTsx = framerTsx.replace(`export function ${name}(`, framerAnnotations);

  // Wire borderRadius into destructured props and root div style
  framerTsx = framerTsx.replace(
    `height = '100%'`,
    `height = '100%', borderRadius = 0`
  );
  framerTsx = framerTsx.replace(
    `style={{ width, height, ...style }}`,
    `style={{ position: 'relative', width, height, borderRadius, overflow: 'hidden', ...style }}`
  );

  // Replace trailing `export default Name;` with addPropertyControls (NO `.defaultProps` which causes TS2339 in strict TS!)
  const controlsBlock = [
    `addPropertyControls(${name}, {`,
    `  borderRadius: {`,
    `    type: ControlType.Number,`,
    `    title: 'Radius',`,
    `    min: 0,`,
    `    max: 64,`,
    `    step: 1,`,
    `    unit: 'px',`,
    `    defaultValue: 0,`,
    `  },${hasImages ? `\n  imageBasePath: {\n    type: ControlType.String,\n    title: 'Images URL',\n    defaultValue: 'images',\n  },` : ''}`,
    `});`
  ].join('\n');

  framerTsx = framerTsx.replace(`export default ${name};`, controlsBlock);

  return {
    componentName: name,
    filename: `${name}.framer.tsx`,
    tsx: framerTsx
  };
}

function getTsxFilenameForHtml(htmlFilePath, fallbackName) {
  const dirName = path.basename(path.dirname(htmlFilePath));
  const baseName = path.basename(htmlFilePath, path.extname(htmlFilePath));
  const name = baseName.toLowerCase() === 'index' ? dirName : baseName;
  return `${toPascalCase(name || fallbackName)}.tsx`;
}

module.exports = {
  convertHtmlToReactTsx,
  convertHtmlToFramerTsx,
  toPascalCase,
  slugify,
  getTsxFilenameForHtml
};
