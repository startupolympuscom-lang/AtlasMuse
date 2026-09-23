import fs from 'fs';
import path from 'path';
import vm from 'vm';

const rootDir = path.resolve('.');
const distDir = path.resolve('dist');

// Recreate dist directory cleanly
fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

// Copy base files and directories first
const baseItems = [
  'index.html',
  'styles.css',
  'app.js',
  'catalog.js',
  'favicon.svg',
  'hosting.json',
  'assets',
  'cart',
  'checkout',
  'collection',
  'our-story',
  'policy',
  'policies'
];

for (const item of baseItems) {
  const src = path.join(rootDir, item);
  const dest = path.join(distDir, item);
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true });
  }
}

// Read index.html template
const templatePath = path.join(rootDir, 'index.html');
const htmlTemplate = fs.readFileSync(templatePath, 'utf8');

// Ensure root products folder has an index.html fallback
fs.mkdirSync(path.join(rootDir, 'products'), { recursive: true });
fs.writeFileSync(path.join(rootDir, 'products', 'index.html'), htmlTemplate, 'utf8');

// Ensure dist products folder has an index.html fallback
fs.mkdirSync(path.join(distDir, 'products'), { recursive: true });
fs.writeFileSync(path.join(distDir, 'products', 'index.html'), htmlTemplate, 'utf8');

// Extract product IDs
const productIds = ['moroccan-corner', 'tazarine-table'];
try {
  const catalogContent = fs.readFileSync(path.join(rootDir, 'catalog.js'), 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(catalogContent, sandbox);
  if (Array.isArray(sandbox.window.ATLAS_CATALOG)) {
    for (const p of sandbox.window.ATLAS_CATALOG) {
      if (p.id) productIds.push(p.id);
    }
  }
} catch (e) {
  console.warn('Could not extract catalog items:', e.message);
}

// Write static index.html for each product in dist
for (const id of productIds) {
  const targetDir = path.join(distDir, 'products', id);
  fs.mkdirSync(targetDir, { recursive: true });
  const title = `${id.replace(/-/g, ' ')} — Atlas Muse Crafts`;
  const content = htmlTemplate.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
  fs.writeFileSync(path.join(targetDir, 'index.html'), content, 'utf8');
}

console.log(`Build succeeded: Generated ${productIds.length} product static entry points in dist/products/`);
