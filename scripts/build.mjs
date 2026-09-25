import { mkdir, rm, cp, readFile, writeFile } from 'node:fs/promises';
// Explicit publication boundary: internal documentation and tooling never ship.
await rm('dist', { recursive: true, force: true });
await mkdir('dist');
for (const name of ['assets', 'styles']) await cp(name, `dist/${name}`, {recursive:true});
await mkdir('dist/scripts');
for (const name of ['main.js','scroll-motion.js']) await cp(`scripts/${name}`, `dist/scripts/${name}`);
let html = await readFile('index.html','utf8');
let privacy = await readFile('aviso-de-privacidad.html', 'utf8');
const origin = process.env.SITE_URL;
if (origin) {
  const url = new URL(origin);
  if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash) throw new Error('SITE_URL must be an HTTPS origin');
  const base = url.origin;
  privacy = privacy.replace('</head>', `<link rel="canonical" href="${base}/aviso-de-privacidad.html"></head>`);
  html = html.replace('https://retornologistico.com', base);
  html = html.replace('</head>', `<link rel="canonical" href="${base}/"><meta property="og:url" content="${base}/"><meta property="og:image" content="${base}/assets/img/hero-poster.webp"><meta name="twitter:card" content="summary_large_image"></head>`);
  await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);
  await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${base}/</loc></url><url><loc>${base}/aviso-de-privacidad.html</loc></url></urlset>`);
} else {
  privacy = privacy.replace('</head>', '<meta name="robots" content="noindex, nofollow"></head>');
  html = html.replace(/\s*"url": "https:\/\/retornologistico.com",/, '');
  html = html.replace('</head>', '<meta name="robots" content="noindex, nofollow"></head>');
  await writeFile('dist/robots.txt', 'User-agent: *\nDisallow: /\n');
  console.warn('Preview build: set SITE_URL to the confirmed production origin to enable indexing.');
}
await writeFile('dist/index.html',html);
await writeFile('dist/aviso-de-privacidad.html', privacy);
console.log('Built dist/ from an explicit allowlist.');
