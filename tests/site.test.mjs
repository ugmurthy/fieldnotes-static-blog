import { afterAll, beforeAll, expect, test } from 'bun:test';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temporary = mkdtempSync(join(tmpdir(), 'static-blog-'));
const content = join(temporary, 'blogposts');
const output = join(temporary, 'output');
const configFile = join(temporary, 'site.json');
const config = { ...JSON.parse(readFileSync(join(root, 'site.config.json'), 'utf8')),
  name: 'Another app', site: 'https://another.example', base: '/learn',
  contentDir: content, outDir: output, pageSize: 2,
  redirects: { 'old-first': 'guides/nested/first' } };
function write(path, value) {
  mkdirSync(dirname(join(content, path)), { recursive: true });
  writeFileSync(join(content, path), value);
}
function article(title, date, body = '', extra = '') {
  return `---\ntitle: "${title}"\ndescription: "A useful guide for another app"\npublished: "${date}"\n${extra}\n---\n\n## A real heading\n\n${body}\n`;
}
function build() {
  writeFileSync(configFile, JSON.stringify(config));
  return spawnSync('bun', ['run', 'build'], { cwd: root, env: { ...process.env, BLOG_CONFIG: configFile }, encoding: 'utf8', timeout: 60000 });
}
const html = (path) => readFileSync(join(output, path), 'utf8');

beforeAll(() => {
  write('guides/nested/first.md', article('First & foremost', '2026-10-29', '[Second](../second.md#a-real-heading)\n\n![A sample drawing](./sample.svg)', 'featured: true'));
  write('guides/second.md', article('Second guide', '2026-10-30'));
  write('tips/third.md', article('Third guide', '2026-10-28'));
  write('private/unpublished.md', article('Secret draft', '2026-10-31', 'Never publish this text.', 'draft: true'));
  write('guides/_category.json', JSON.stringify({ title: 'Step by step', order: 1, description: 'Real nested guides.' }));
  write('guides/nested/sample.svg', '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M0 0L24 24"/></svg>');
  const result = build();
  if (result.status !== 0) throw new Error(result.stdout + result.stderr);
}, 60000);
afterAll(() => rmSync(temporary, { recursive: true, force: true }));

test('another app gets portable article URLs, nested categories, images, and a working contents anchor', () => {
  const body = html('guides/nested/first/index.html');
  expect(body).toContain('Another app');
  expect(body).toContain('https://another.example/learn/guides/nested/first/');
  expect(body).toContain('href="/learn/guides/second/#a-real-heading"');
  expect(body).toContain('href="#a-real-heading"');
  expect(body).toContain('id="a-real-heading"');
  expect(body).toContain('src="/learn/_media/guides/nested/sample.svg"');
  expect(body).toContain('loading="lazy"');
  expect(html('category/guides/index.html')).toContain('Real nested guides.');
  expect(html('category/guides/nested/index.html')).toContain('First &amp; foremost');
  expect(existsSync(join(output, '_media/guides/nested/sample.svg'))).toBe(true);
  expect(body).not.toMatch(/<script(?![^>]*type="application\/ld\+json")/);
});

test('pagination bounds listings, sorts by publication date, and excludes drafts everywhere', () => {
  const first = html('index.html');
  const second = html('page/2/index.html');
  expect(first).toContain('rel="next" href="/learn/page/2/"');
  expect(first).toContain('Featured guide');
  expect(first).not.toContain('<h2><a href="/learn/tips/third/"');
  expect(second).toContain('rel="prev" href="/learn/"');
  expect(second).toContain('Third guide');
  expect(second).not.toContain('First &amp; foremost');
  expect(existsSync(join(output, 'page/3/index.html'))).toBe(false);
  expect(existsSync(join(output, 'private/unpublished/index.html'))).toBe(false);
  expect(existsSync(join(output, 'category/private/index.html'))).toBe(false);
  for (const path of ['index.html', 'rss.xml', 'sitemap.xml']) {
    expect(html(path)).not.toContain('Secret draft');
    expect(html(path)).not.toContain('private/unpublished');
  }
});

test('discovery metadata, conversion links, moved articles, and not-found page are generated', () => {
  const body = html('guides/nested/first/index.html');
  expect(body).toContain('"@type":"BlogPosting"');
  expect(body).toContain('href="https://example.com/signup"');
  expect(html('rss.xml')).toContain('<title>First &amp; foremost</title>');
  expect(html('sitemap.xml')).toContain('https://another.example/learn/category/guides/nested/');
  expect(html('old-first/index.html')).toContain('/learn/guides/nested/first/');
  expect(html('404.html')).toContain('content="noindex"');
});

test('build rejects broken Markdown links and links to unpublished articles', () => {
  write('broken.md', article('Broken', '2026-10-30', '[Missing](./missing.md)'));
  let result = build();
  expect(result.status).not.toBe(0);
  expect(result.stdout + result.stderr).toContain('Broken or out-of-content link');
  write('broken.md', article('Broken', '2026-10-30', '[Draft](./private/unpublished.md)'));
  result = build();
  expect(result.status).not.toBe(0);
  expect(result.stdout + result.stderr).toContain('Link to unpublished draft');
  rmSync(join(content, 'broken.md'));
}, 60000);

test('build rejects invalid dates and reserved category paths', () => {
  write('bad-date.md', article('Invalid date', '2026-02-30'));
  let result = build();
  expect(result.status).not.toBe(0);
  expect(result.stdout + result.stderr).toContain('YYYY-MM-DD');
  rmSync(join(content, 'bad-date.md'));
  write('page/collision.md', article('Reserved', '2026-10-30'));
  result = build();
  expect(result.status).not.toBe(0);
  expect(result.stdout + result.stderr).toContain('reserved routes');
}, 60000);
