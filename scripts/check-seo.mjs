import assert from 'node:assert/strict';

// Test generated HTML and actual response headers, including Next metadata inheritance.
// Run against a production build: node scripts/check-seo.mjs http://127.0.0.1:54225
const base = process.argv[2] || 'http://127.0.0.1:54225';
const canonicalBase = 'https://jlpt.meritledger.org';
const publicPaths = ['/', '/about', '/privacy', '/delete-account'];
const privatePaths = ['/login', '/onboarding', '/today', '/grammar', '/grammar/example',
  '/study/example', '/review', '/history', '/history/example', '/profile', '/plans',
  '/library', '/membership', '/membership/orders', '/membership/return',
  '/vocabulary-learning', '/vocabulary-learning/example/history',
  '/vocabulary-practice/example', '/android/link', '/redirect-recovery'];
function meta(html, key, name = 'name') {
  return [...html.matchAll(/<meta\b[^>]*>/g)].filter(([tag]) => tag.includes(`${name}="${key}"`))
    .map(([tag]) => tag.match(/content="([^"]*)"/)?.[1]);
}
const summaries = await Promise.all([...publicPaths, ...privatePaths].map(async path => {
  const response = await fetch(new URL(path, base), { redirect: 'manual' });
  assert.equal(response.status, 200, path);
  const html = await response.text();
  const robots = [...meta(html, 'robots'), ...meta(html, 'googlebot')].join(',');
  if (publicPaths.includes(path)) {
    assert.ok(!robots.includes('noindex'), `${path}: public noindex`);
    const links = [...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*>/g)];
    assert.equal(links.length, 1, `${path}: canonical count`);
    assert.equal(new URL(links[0][0].match(/href="([^"]*)"/)[1]).href, new URL(canonicalBase + path).href, `${path}: canonical`);
    const title = html.match(/<title>(.*?)<\/title>/)?.[1];
    assert.ok(title, `${path}: title`);
    assert.deepEqual(meta(html, 'og:title', 'property'), [title], `${path}: OG title`);
    assert.deepEqual(meta(html, 'twitter:title'), [title], `${path}: Twitter title`);
    assert.deepEqual(meta(html, 'og:url', 'property').map(url => new URL(url).href), [new URL(canonicalBase + path).href], `${path}: OG URL`);
    assert.deepEqual(meta(html, 'og:description', 'property'), meta(html, 'description'), `${path}: OG summary`);
    assert.deepEqual(meta(html, 'twitter:description'), meta(html, 'description'), `${path}: Twitter summary`);
    assert.ok(meta(html, 'og:image', 'property').length, `${path}: sharing image`);
    assert.ok(/<h1\b/.test(html), `${path}: rendered public content`);
    return { path, title, indexing: 'public' };
  }
  assert.ok(robots.includes('noindex'), `${path}: private robots metadata`);
  assert.ok(response.headers.get('x-robots-tag')?.includes('noindex'), `${path}: private robots header`);
  return { path, indexing: 'noindex' };
}));
const sitemap = await fetch(new URL('/sitemap.xml', base));
assert.equal(sitemap.status, 200);
const xml = await sitemap.text();
const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(([, url]) => url);
assert.deepEqual(urls.sort(), publicPaths.map(path => canonicalBase + path).sort());
const robots = await (await fetch(new URL('/robots.txt', base))).text();
assert.ok(robots.includes(`Sitemap: ${canonicalBase}/sitemap.xml`));
console.log(JSON.stringify({ passed: summaries.length, sitemapURLs: urls, pages: summaries }, null, 2));
