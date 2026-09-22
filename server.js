import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Determine static directory (prefer dist if built, otherwise root)
const distDir = path.join(__dirname, 'dist');
const staticDir = fs.existsSync(distDir) && fs.existsSync(path.join(distDir, 'index.html'))
  ? distDir
  : __dirname;

// Serve static assets
app.use(express.static(staticDir));

// Fallback for HTML5 client-side routes (e.g. /products/:id or other subpaths)
app.use((req, res) => {
  const indexPath = path.join(staticDir, 'index.html');
  res.sendFile(indexPath);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Atlas Muse Crafts server running at http://0.0.0.0:${PORT}`);
});
