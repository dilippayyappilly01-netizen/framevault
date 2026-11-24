const fs = require('fs');
const path = require('path');
const { convertHtmlToReactTsx, getTsxFilenameForHtml } = require('../backend/reactConverter');

const rootDir = path.resolve(__dirname, '..');
const designsDir = path.join(rootDir, 'designs');

function walkHtmlFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'images') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkHtmlFiles(full, out);
    } else if (entry.name.toLowerCase().endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}

const htmlFiles = walkHtmlFiles(designsDir);
const generated = [];

for (const htmlFile of htmlFiles) {
  const relFromDesigns = path.relative(designsDir, htmlFile).replace(/\\/g, '/');
  const parts = relFromDesigns.split('/');
  const section = parts[0] || 'general';
  const dirName = path.basename(path.dirname(htmlFile));
  const rawHtml = fs.readFileSync(htmlFile, 'utf8');

  const result = convertHtmlToReactTsx(rawHtml, {
    section,
    name: dirName,
    id: `${section}-${dirName}`
  });

  const tsxFilename = getTsxFilenameForHtml(htmlFile, dirName);
  const tsxPath = path.join(path.dirname(htmlFile), tsxFilename);
  fs.writeFileSync(tsxPath, result.tsx, 'utf8');
  generated.push({
    html: path.relative(rootDir, htmlFile).replace(/\\/g, '/'),
    tsx: path.relative(rootDir, tsxPath).replace(/\\/g, '/'),
    componentName: result.componentName
  });
}

console.log(`Generated ${generated.length} TypeScript + React (.tsx) files alongside original .html files.`);
console.log('Sample:', generated.slice(0, 5));
