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

// Serve static assets with index.html enabled
app.use(express.static(staticDir, { index: 'index.html' }));

// Route handler to support clean paths without trailing slashes
app.get('*', (req, res) => {
  const cleanPath = req.path.replace(/\/+$/, '');
  
  // 1. Check if a directory with index.html exists for this path
  if (cleanPath) {
    const directIndexPath = path.join(staticDir, cleanPath, 'index.html');
    if (fs.existsSync(directIndexPath)) {
      return res.sendFile(directIndexPath);
    }
  }

  // 2. Fallback to main index.html for client-side routing
  const rootIndex = path.join(staticDir, 'index.html');
  if (fs.existsSync(rootIndex)) {
    return res.sendFile(rootIndex);
  }

  res.status(404).send('Not found');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Atlas Muse Crafts server running at http://0.0.0.0:${PORT}`);
});
