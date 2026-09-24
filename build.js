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
  'robots.txt',
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

// Ensure root and dist products folders have index.html fallback
fs.mkdirSync(path.join(rootDir, 'products'), { recursive: true });
fs.writeFileSync(path.join(rootDir, 'products', 'index.html'), htmlTemplate, 'utf8');

fs.mkdirSync(path.join(distDir, 'products'), { recursive: true });
fs.writeFileSync(path.join(distDir, 'products', 'index.html'), htmlTemplate, 'utf8');

// Extract all products (concepts + catalog items)
const allProducts = [
  {
    id: 'moroccan-corner',
    name: 'The Moroccan Corner',
    category: 'A ritual, beautifully gathered',
    price: 890,
    image: '/assets/tea.webp',
    description: 'Make room for an unhurried moment. A considered collection of tea objects, warm textures and carved wood, bringing the intimacy of Moroccan hospitality into your home.',
    available: true
  },
  {
    id: 'tazarine-table',
    name: 'The Tazarine Table',
    category: 'Sculptural wood, everyday warmth',
    price: 1250,
    image: '/assets/table.webp',
    description: 'A low, grounding silhouette with a quiet carved rhythm. Tazarine brings the warmth of walnut to a contemporary room, leaving space for the objects and rituals that make it yours.',
    available: true
  }
];

try {
  const catalogContent = fs.readFileSync(path.join(rootDir, 'catalog.js'), 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(catalogContent, sandbox);
  if (Array.isArray(sandbox.window.ATLAS_CATALOG)) {
    for (const p of sandbox.window.ATLAS_CATALOG) {
      if (p.id) {
        allProducts.push({
          id: p.id,
          name: p.name,
          category: p.category || 'Handcrafted Moroccan Artifacts',
          price: typeof p.price === 'number' ? p.price : (p.variantData?.[0]?.price || 0),
          image: p.image || (p.images?.[0]?.src) || '/assets/hero.webp',
          description: p.description || '',
          sku: p.variantData?.[0]?.sku || p.id,
          available: p.variantData ? p.variantData.some(v => v.available) : true
        });
      }
    }
  }
} catch (e) {
  console.warn('Could not extract catalog items:', e.message);
}

function cleanText(text, max = 155) {
  if (!text) return 'Handcrafted Moroccan artifact from Atlas Muse Crafts.';
  const plain = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 60 ? cut.slice(0, lastSpace) : cut) + '...';
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Generate static HTML for each product
for (const p of allProducts) {
  const pageTitle = `${p.name} — Handcrafted Moroccan Artifact | Atlas Muse Crafts`;
  const snippet = cleanText(p.description || p.category);
  const canonicalUrl = `https://atlasmusecrafts.com/products/${p.id}/`;
  const fullImageUrl = p.image.startsWith('http')
    ? p.image
    : `https://atlasmusecrafts.com${p.image.startsWith('/') ? '' : '/'}${p.image}`;

  const productJsonLd = {
    "@context": "https://schema.org/",
    "@graph": [
      {
        "@type": "Product",
        "name": p.name,
        "image": [fullImageUrl],
        "description": snippet,
        "sku": p.sku || p.id,
        "brand": {
          "@type": "Brand",
          "name": "Atlas Muse Crafts"
        },
        "category": p.category,
        "offers": {
          "@type": "Offer",
          "url": canonicalUrl,
          "priceCurrency": "USD",
          "price": p.price,
          "priceValidUntil": "2027-12-31",
          "itemCondition": "https://schema.org/NewCondition",
          "availability": p.available ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
          "seller": {
            "@type": "Organization",
            "name": "Atlas Muse Crafts"
          }
        }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://atlasmusecrafts.com/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "The Collection",
            "item": "https://atlasmusecrafts.com/collection/"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": p.name,
            "item": canonicalUrl
          }
        ]
      }
    ]
  };

  const productHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#682C38">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(snippet)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="${canonicalUrl}">

  <!-- Open Graph / Facebook -->
  <meta property="og:site_name" content="Atlas Muse Crafts">
  <meta property="og:type" content="product">
  <meta property="og:title" content="${escapeHtml(p.name)} | Atlas Muse Crafts">
  <meta property="og:description" content="${escapeHtml(snippet)}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="${escapeHtml(fullImageUrl)}">
  <meta property="og:image:alt" content="${escapeHtml(p.name)} handcrafted Moroccan artifact">
  <meta property="og:locale" content="en_US">
  <meta property="product:price:amount" content="${p.price}">
  <meta property="product:price:currency" content="USD">

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(p.name)} | Atlas Muse Crafts">
  <meta name="twitter:description" content="${escapeHtml(snippet)}">
  <meta name="twitter:image" content="${escapeHtml(fullImageUrl)}">

  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" href="/styles.css">

  <!-- Rich Product & Breadcrumb Structured Data -->
  <script type="application/ld+json" id="structured-data">
  ${JSON.stringify(productJsonLd, null, 2)}
  </script>

  <script src="/catalog.js" defer></script>
  <script src="/app.js" defer></script>
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
  <div id="app"></div>
  <noscript>Please enable JavaScript to explore the Atlas Muse Crafts collection and shopping bag.</noscript>
</body>
</html>`;

  // Write to both dist/products/ and products/
  const distTargetDir = path.join(distDir, 'products', p.id);
  fs.mkdirSync(distTargetDir, { recursive: true });
  fs.writeFileSync(path.join(distTargetDir, 'index.html'), productHtml, 'utf8');

  const rootTargetDir = path.join(rootDir, 'products', p.id);
  fs.mkdirSync(rootTargetDir, { recursive: true });
  fs.writeFileSync(path.join(rootTargetDir, 'index.html'), productHtml, 'utf8');
}

// Generate sitemap.xml
const nowIso = new Date().toISOString().split('T')[0];
let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>https://atlasmusecrafts.com/</loc>
    <lastmod>${nowIso}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>https://atlasmusecrafts.com/assets/hero.webp</image:loc>
      <image:title>Atlas Muse Crafts — Moroccan Living Room</image:title>
    </image:image>
  </url>
  <url>
    <loc>https://atlasmusecrafts.com/collection/</loc>
    <lastmod>${nowIso}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
    <image:image>
      <image:loc>https://atlasmusecrafts.com/assets/hero.webp</image:loc>
      <image:title>Atlas Muse Crafts Full Collection</image:title>
    </image:image>
  </url>
  <url>
    <loc>https://atlasmusecrafts.com/our-story/</loc>
    <lastmod>${nowIso}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://atlasmusecrafts.com/policy/</loc>
    <lastmod>${nowIso}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;

for (const p of allProducts) {
  const loc = `https://atlasmusecrafts.com/products/${p.id}/`;
  const fullImageUrl = p.image.startsWith('http')
    ? p.image
    : `https://atlasmusecrafts.com${p.image.startsWith('/') ? '' : '/'}${p.image}`;

  sitemapXml += `
  <url>
    <loc>${escapeHtml(loc)}</loc>
    <lastmod>${nowIso}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <image:image>
      <image:loc>${escapeHtml(fullImageUrl)}</image:loc>
      <image:title>${escapeHtml(p.name)}</image:title>
    </image:image>
  </url>`;
}

sitemapXml += `
</urlset>
`;

fs.writeFileSync(path.join(rootDir, 'sitemap.xml'), sitemapXml, 'utf8');
fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapXml, 'utf8');

console.log(`Build succeeded: Generated ${allProducts.length} product static entry points with rich SEO & sitemap.xml in dist/ and root.`);
