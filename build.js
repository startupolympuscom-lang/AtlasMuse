import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
fs.mkdirSync(distDir, { recursive: true });

const items = [
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
  'our-story'
];

for (const item of items) {
  if (fs.existsSync(item)) {
    fs.cpSync(item, path.join(distDir, item), { recursive: true });
  }
}

console.log('Build completed: static files copied to dist/');
