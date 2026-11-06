import { afterAll, beforeAll, expect, test } from 'bun:test';
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(root, '.agents/skills/integrating-blogsite/scripts/vendor.mjs');
const temporary = mkdtempSync(join(tmpdir(), 'fieldnotes-lifecycle-'));
const source = join(temporary, 'upstream');
let first;
let second;

function run(cwd, command, args, env = {}) {
  return spawnSync(command, args, { cwd, encoding: 'utf8', timeout: 60000, env: { ...process.env, ...env } });
}
function success(result) {
  expect(result.stderr + result.stdout).not.toContain('Fieldnotes:');
  expect(result.status).toBe(0);
  return result.stdout;
}
const read = (path) => readFileSync(path, 'utf8');
const vendor = (app, command, ...args) => run(root, 'node', [script, command, '--app', app, ...args]);
function app(name) {
  const path = join(temporary, name);
  mkdirSync(path);
  return path;
}

beforeAll(() => {
  mkdirSync(source);
  for (const path of ['src', 'package.json', 'bun.lock', 'astro.config.ts', 'tsconfig.json', 'site.config.json', 'LICENSE', 'tests/site.test.mjs',
    'netlify.toml', 'vercel.json', '.github/workflows/pages.yml']) {
    mkdirSync(dirname(join(source, path)), { recursive: true });
    cpSync(join(root, path), join(source, path), { recursive: true });
  }
  mkdirSync(join(source, '.agents'));
  writeFileSync(join(source, '.agents/setup'), 'must not enter a consuming app');
  writeFileSync(join(source, 'src/obsolete.txt'), 'removed in the next release');
  success(run(source, 'git', ['init', '-q']));
  success(run(source, 'git', ['config', 'user.name', 'Fixture']));
  success(run(source, 'git', ['config', 'user.email', 'fixture@example.invalid']));
  success(run(source, 'git', ['add', '.']));
  success(run(source, 'git', ['-c', 'commit.gpgsign=false', 'commit', '-qm', 'First fixture release']));
  first = success(run(source, 'git', ['rev-parse', 'HEAD'])).trim();
  success(run(source, 'git', ['tag', 'v0.1.0']));
  success(run(source, 'git', ['tag', 'v0.1.0-rc.2+build.7']));
  const pkg = JSON.parse(read(join(source, 'package.json')));
  pkg.version = '0.1.1';
  writeFileSync(join(source, 'package.json'), JSON.stringify(pkg, null, 2));
  writeFileSync(join(source, 'src/styles.css'), `${read(join(source, 'src/styles.css'))}\n/* Updated fixture release */\n`);
  rmSync(join(source, 'src/obsolete.txt'));
  writeFileSync(join(source, 'src/release-note.txt'), 'new upstream file');
  success(run(source, 'git', ['add', '.']));
  success(run(source, 'git', ['-c', 'commit.gpgsign=false', 'commit', '-qm', 'Second fixture release']));
  second = success(run(source, 'git', ['rev-parse', 'HEAD'])).trim();
});
afterAll(() => rmSync(temporary, { recursive: true, force: true }));

test('install, customize, preview and upgrade a real engine without changing host content or dependencies', () => {
  const target = app('consumer app');
  const hostPackage = '{"name":"consumer","private":true,"workspaces":["packages/*"]}\n';
  writeFileSync(join(target, 'package.json'), hostPackage);
  writeFileSync(join(target, 'app.html'), '<h1>The existing app</h1>');
  const preview = JSON.parse(success(vendor(target, 'install', '--source', source, '--ref', 'v0.1.0-rc.2+build.7', '--dry-run')));
  expect(preview.to).toBe(first);
  expect(existsSync(join(target, 'vendor'))).toBe(false);
  success(vendor(target, 'install', '--source', source, '--ref', 'v0.1.0'));
  const engine = join(target, 'vendor/fieldnotes');
  expect(existsSync(join(target, '.agents/setup'))).toBe(false);
  expect(existsSync(join(engine, '.agents'))).toBe(false);
  for (const path of ['netlify.toml', 'vercel.json', '.github']) {
    expect(existsSync(join(engine, path))).toBe(false);
    expect(existsSync(join(target, path))).toBe(false);
  }
  expect(read(join(engine, 'LICENSE'))).toBe(read(join(root, 'LICENSE')));
  expect(existsSync(join(engine, 'tests/site.test.mjs'))).toBe(true);
  expect(existsSync(join(engine, 'tests/vendor.test.mjs'))).toBe(false);
  const configFile = join(target, 'blog.config.json');
  const config = { ...JSON.parse(read(configFile)), name: 'Consumer branding', base: '/learn', site: 'https://consumer.example' };
  writeFileSync(configFile, JSON.stringify(config, null, 2));
  const article = join(target, 'blogposts/getting-started/welcome.md');
  const content = '---\ntitle: "App-owned guide"\ndescription: "Keep this on upgrades"\npublished: "2026-05-19"\n---\n\n## App instructions\n\n![Our logo](./logo.svg)\n';
  writeFileSync(article, content);
  writeFileSync(join(dirname(article), 'logo.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"/>');
  for (const revision of [first, second]) {
    if (revision === second) {
      const before = read(join(target, 'fieldnotes.lock.json'));
      const plan = JSON.parse(success(vendor(target, 'update', '--ref', second, '--dry-run')));
      expect(plan.changed).toContain('src/styles.css');
      expect(plan.added).toContain('src/release-note.txt');
      expect(plan.removed).toEqual(['src/obsolete.txt']);
      expect(read(join(target, 'fieldnotes.lock.json'))).toBe(before);
      expect(existsSync(join(engine, 'src/obsolete.txt'))).toBe(true);
      success(vendor(target, 'update', '--ref', second));
      expect(existsSync(join(engine, 'src/obsolete.txt'))).toBe(false);
      expect(read(join(engine, 'src/release-note.txt'))).toBe('new upstream file');
    }
    success(run(engine, 'bun', ['install', '--frozen-lockfile']));
    success(run(engine, 'bun', ['run', 'build'], { BLOG_CONFIG: configFile }));
    const html = read(join(target, '.fieldnotes-dist/getting-started/welcome/index.html'));
    expect(html).toContain('Consumer branding');
    expect(html).toContain('App-owned guide');
    expect(html).toContain('https://consumer.example/learn/getting-started/welcome/');
    expect(html).toContain('/learn/_media/getting-started/logo.svg');
    expect(existsSync(join(target, '.fieldnotes-dist/_media/getting-started/logo.svg'))).toBe(true);
    expect(read(article)).toBe(content);
    expect(read(configFile)).toBe(JSON.stringify(config, null, 2));
    expect(read(join(target, 'package.json'))).toBe(hostPackage);
    expect(existsSync(join(target, 'bun.lock'))).toBe(false);
    expect(existsSync(join(target, 'node_modules'))).toBe(false);
    expect(read(join(target, 'app.html'))).toBe('<h1>The existing app</h1>');
    const status = JSON.parse(success(vendor(target, 'status')));
    expect(status.clean).toBe(true);
    expect(status.commit).toBe(revision);
  }
  const lock = read(join(target, 'fieldnotes.lock.json'));
  success(vendor(target, 'update', '--ref', second));
  expect(read(join(target, 'fieldnotes.lock.json'))).toBe(lock);
}, 60000);

test('existing configuration and articles are preserved; dirty upgrades and moving refs are rejected', () => {
  const target = app('existing');
  mkdirSync(join(target, 'blogposts'));
  writeFileSync(join(target, 'blogposts/own.md'), 'existing article');
  writeFileSync(join(target, 'blog.config.json'), '{"appOwned":true}\n');
  success(vendor(target, 'install', '--source', source, '--ref', first));
  expect(read(join(target, 'blog.config.json'))).toBe('{"appOwned":true}\n');
  expect(read(join(target, 'blogposts/own.md'))).toBe('existing article');
  expect(existsSync(join(target, 'blogposts/getting-started'))).toBe(false);
  const lock = read(join(target, 'fieldnotes.lock.json'));
  const engine = join(target, 'vendor/fieldnotes');
  writeFileSync(join(engine, 'src/styles.css'), 'local theme edits');
  rmSync(join(engine, 'src/obsolete.txt'));
  writeFileSync(join(engine, 'src/my-feature.ts'), '// local feature');
  const status = vendor(target, 'status');
  expect(status.status).toBe(1);
  expect(JSON.parse(status.stdout).conflicts).toEqual(['missing: src/obsolete.txt', 'modified: src/styles.css', 'untracked: src/my-feature.ts']);
  const rejected = vendor(target, 'update', '--ref', second);
  expect(rejected.status).toBe(1);
  expect(rejected.stderr).toContain('Refusing to overwrite');
  expect(read(join(engine, 'src/styles.css'))).toBe('local theme edits');
  expect(read(join(target, 'fieldnotes.lock.json'))).toBe(lock);
  expect(vendor(target, 'install', '--source', source, '--ref', second).status).toBe(1);
  const empty = app('rejected ref');
  for (const ref of ['main', 'v01.2.3', 'v1.2.3-alpha..1']) {
    const moving = vendor(empty, 'install', '--source', source, '--ref', ref);
    expect(moving.status).toBe(1);
    expect(moving.stderr).toContain('never a branch');
  }
  expect(existsSync(join(empty, 'vendor'))).toBe(false);
  const partial = app('articles without configuration');
  mkdirSync(join(partial, 'blogposts'));
  writeFileSync(join(partial, 'blogposts/own.md'), 'our existing article');
  success(vendor(partial, 'install', '--source', source, '--ref', first));
  expect(JSON.parse(read(join(partial, 'blog.config.json'))).outDir).toBe('./.fieldnotes-dist');
  expect(read(join(partial, 'blogposts/own.md'))).toBe('our existing article');
  expect(existsSync(join(partial, 'blogposts/getting-started'))).toBe(false);
});

test('failed upgrades roll back; unsafe destinations and lock paths cannot overwrite app files', () => {
  const target = app('failed upgrade');
  success(vendor(target, 'install', '--source', source, '--ref', first));
  const lock = read(join(target, 'fieldnotes.lock.json'));
  const absent = vendor(target, 'update', '--ref', 'f'.repeat(40));
  expect(absent.status).toBe(1);
  expect(read(join(target, 'fieldnotes.lock.json'))).toBe(lock);
  expect(JSON.parse(success(vendor(target, 'status'))).commit).toBe(first);
  // Engine replacement can succeed while publishing the lockfile fails.
  // Leave vendor writable but deny the parent-directory rename of the lockfile.
  // Root bypasses these POSIX write permissions.
  if (process.getuid?.() !== 0) {
    chmodSync(target, 0o555);
    try {
      expect(vendor(target, 'update', '--ref', second).status).toBe(1);
    } finally {
      chmodSync(target, 0o755);
    }
  }
  expect(read(join(target, 'fieldnotes.lock.json'))).toBe(lock);
  expect(JSON.parse(success(vendor(target, 'status'))).commit).toBe(first);
  const changedSource = vendor(target, 'update', '--source', root, '--ref', second);
  expect(changedSource.status).toBe(1);
  expect(changedSource.stderr).toContain('Changing the recorded upstream');
  const linked = app('linked');
  symlinkSync(target, join(linked, 'vendor'));
  const rejected = vendor(linked, 'install', '--source', source, '--ref', first);
  expect(rejected.status).toBe(1);
  expect(rejected.stderr).toContain('Refusing symbolic link');
  expect(read(join(target, 'fieldnotes.lock.json'))).toBe(lock);
  writeFileSync(join(target, 'important.txt'), 'keep this');
  const corrupted = JSON.parse(lock);
  corrupted.files['src/../../important.txt'] = 'a'.repeat(64);
  writeFileSync(join(target, 'fieldnotes.lock.json'), JSON.stringify(corrupted));
  const unsafe = vendor(target, 'update', '--ref', second);
  expect(unsafe.status).toBe(1);
  expect(unsafe.stderr).toContain('Invalid managed file');
  expect(read(join(target, 'important.txt'))).toBe('keep this');
});

test.skipIf(process.getuid?.() === 0)('an old cache cleanup failure warns without misreporting a successful upgrade as rolled back', () => {
  const target = app('cache cleanup');
  success(vendor(target, 'install', '--source', source, '--ref', first));
  const cache = join(target, 'vendor/fieldnotes/node_modules/locked');
  mkdirSync(cache, { recursive: true });
  writeFileSync(join(cache, 'keep'), 'old disposable cache');
  chmodSync(cache, 0o555);
  const upgraded = vendor(target, 'update', '--ref', second);
  // The old cache may have moved into a retained staging directory.
  success(run(target, 'chmod', ['-R', 'u+w', 'vendor']));
  expect(upgraded.status).toBe(0);
  expect(upgraded.stderr).toContain('cleanup warning');
  expect(JSON.parse(upgraded.stdout).to).toBe(second);
  expect(JSON.parse(success(vendor(target, 'status'))).commit).toBe(second);
});
