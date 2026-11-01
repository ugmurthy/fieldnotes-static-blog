#!/usr/bin/env node
import { createHash } from 'node:crypto';
import {
  closeSync, cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, openSync, readFileSync,
  readdirSync, realpathSync, renameSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const upstream = 'https://github.com/ugmurthy/fieldnotes-static-blog.git';
const enginePath = 'vendor/fieldnotes';
const lockPath = 'fieldnotes.lock.json';
const required = ['package.json', 'bun.lock', 'astro.config.ts', 'tsconfig.json', 'site.config.json', 'LICENSE'];
const allowed = (path) => required.includes(path) || ['README.md', 'CHANGELOG.md', 'tests/site.test.mjs'].includes(path) || path.startsWith('src/');
const generated = new Set(['node_modules', '.astro', 'dist']);
const numeric = '(?:0|[1-9]\\d*)';
const prerelease = `(?:${numeric}|\\d*[A-Za-z-][0-9A-Za-z-]*)`;
const releaseTag = new RegExp(`^v${numeric}\\.${numeric}\\.${numeric}(?:-${prerelease}(?:\\.${prerelease})*)?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$`);
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const json = (path) => JSON.parse(readFileSync(path, 'utf8'));
const print = (value) => console.log(JSON.stringify(value, null, 2));

function git(cwd, ...args) {
  return execFileSync('git', ['-C', cwd, ...args], {
    maxBuffer: 32 * 1024 * 1024, timeout: 60000, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  });
}

function sourceLocation(value) {
  if (value.startsWith('https://')) {
    const url = new URL(value);
    if (url.username || url.password) throw new Error('Use Git credentials, not credentials embedded in the source URL.');
    return url.href;
  }
  return realpathSync(value);
}

function noSymlinks(root, path) {
  let current = root;
  for (const part of path.split('/')) {
    current = join(current, part);
    let stat;
    try { stat = lstatSync(current); } catch (error) {
      if (error.code === 'ENOENT') break;
      throw error;
    }
    if (stat.isSymbolicLink()) throw new Error(`Refusing symbolic link: ${current}`);
  }
}

function readLock(app) {
  noSymlinks(app, lockPath);
  const lock = json(join(app, lockPath));
  if (lock.schemaVersion !== 1 || !/^[a-f0-9]{40}$/.test(lock.commit) ||
      typeof lock.source !== 'string' || !lock.files || Array.isArray(lock.files) ||
      required.some((path) => !Object.hasOwn(lock.files, path))) {
    throw new Error('Invalid fieldnotes.lock.json; restore it from Git.');
  }
  for (const [path, digest] of Object.entries(lock.files)) {
    if (!allowed(path) || isAbsolute(path) || path.split('/').some((part) => ['', '.', '..'].includes(part)) ||
        path.includes('\\') || !/^[a-f0-9]{64}$/.test(digest)) {
      throw new Error('Invalid managed file in fieldnotes.lock.json; restore it from Git.');
    }
  }
  return lock;
}

function conflicts(app, lock) {
  const root = join(app, enginePath);
  const found = new Set();
  const changes = [];
  function walk(directory, prefix = '') {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (!prefix && generated.has(entry.name) && entry.isDirectory()) continue;
      const path = `${prefix}${entry.name}`;
      if (entry.isDirectory()) walk(join(directory, entry.name), `${path}/`);
      else {
        found.add(path);
        if (!Object.hasOwn(lock.files, path)) changes.push(`untracked: ${path}`);
        else if (!entry.isFile() || hash(readFileSync(join(root, path))) !== lock.files[path]) changes.push(`modified: ${path}`);
      }
    }
  }
  if (existsSync(root)) walk(root);
  for (const path of Object.keys(lock.files)) if (!found.has(path)) changes.push(`missing: ${path}`);
  return changes.sort();
}

function fetchEngine(source, ref, temporary) {
  if (!/^[a-f0-9]{40}$/.test(ref ?? '') && !releaseTag.test(ref ?? '')) {
    throw new Error('--ref must be a full lowercase commit SHA or a vSemVer tag, never a branch.');
  }
  const checkout = join(temporary, 'source');
  git(temporary, 'clone', '--quiet', '--no-checkout', '--', source, checkout);
  const revision = ref.startsWith('v') ? `refs/tags/${ref}` : ref;
  const commit = git(checkout, 'rev-parse', '--verify', `${revision}^{commit}`).toString().trim();
  const files = {};
  const output = join(temporary, 'engine');
  mkdirSync(output);
  for (const record of git(checkout, 'ls-tree', '-rz', '--full-tree', commit).toString().split('\0').filter(Boolean)) {
    const tab = record.indexOf('\t');
    const [mode, type] = record.slice(0, tab).split(' ');
    const path = record.slice(tab + 1);
    if (!allowed(path)) continue;
    if (!['100644', '100755'].includes(mode) || type !== 'blob' || path.includes('\\') ||
        path.split('/').some((part) => ['', '.', '..'].includes(part))) {
      throw new Error(`Unsupported source file: ${path}`);
    }
    const bytes = git(checkout, 'show', `${commit}:${path}`);
    mkdirSync(dirname(join(output, path)), { recursive: true });
    writeFileSync(join(output, path), bytes, { mode: mode === '100755' ? 0o755 : 0o644 });
    files[path] = hash(bytes);
  }
  for (const path of required) if (!Object.hasOwn(files, path)) throw new Error(`Source is missing ${path}.`);
  if (!Object.keys(files).some((path) => path.startsWith('src/'))) throw new Error('Source is missing src/.');
  const version = json(join(output, 'package.json')).version;
  if (typeof version !== 'string') throw new Error('Source package version is missing.');
  return { directory: output, lock: { schemaVersion: 1, source, ref, commit, version, files } };
}

function apply(app, downloaded, install) {
  // Stage on the app filesystem so the engine replacement uses atomic renames.
  mkdirSync(join(app, 'vendor'), { recursive: true });
  const staging = mkdtempSync(join(app, 'vendor', '.fieldnotes-'));
  const engine = join(app, enginePath);
  const previous = join(staging, 'previous');
  const created = [];
  let replaced = false;
  let complete = false;
  try {
    cpSync(downloaded.directory, join(staging, 'engine'), { recursive: true });
    writeFileSync(join(staging, 'lock.json'), `${JSON.stringify(downloaded.lock, null, 2)}\n`);
    if (install && !existsSync(join(app, 'blog.config.json'))) {
      const config = { ...json(join(downloaded.directory, 'site.config.json')), base: '/blog', contentDir: './blogposts', outDir: './.fieldnotes-dist' };
      const descriptor = openSync(join(app, 'blog.config.json'), 'wx');
      // Register ownership before writing: a full disk can leave a partial file.
      created.push(join(app, 'blog.config.json'));
      try { writeFileSync(descriptor, `${JSON.stringify(config, null, 2)}\n`); } finally { closeSync(descriptor); }
      if (!existsSync(join(app, 'blogposts'))) {
        mkdirSync(join(app, 'blogposts/getting-started'), { recursive: true });
        created.push(join(app, 'blogposts'));
        writeFileSync(join(app, 'blogposts/getting-started/welcome.md'), '---\ntitle: "Welcome"\ndescription: "The first guide for your app."\npublished: "2026-01-01"\n---\n\n## Getting started\n\nReplace this example with your first article.\n');
      }
    }
    if (existsSync(engine)) renameSync(engine, previous);
    renameSync(join(staging, 'engine'), engine);
    replaced = true;
    renameSync(join(staging, 'lock.json'), join(app, lockPath));
    complete = true;
  } finally {
    if (!complete) {
      if (replaced) rmSync(engine, { recursive: true, force: true });
      if (existsSync(previous)) renameSync(previous, engine);
      for (const path of created.reverse()) rmSync(path, { recursive: true, force: true });
    }
    try { rmSync(staging, { recursive: true, force: true }); } catch (error) {
      if (!complete) throw error;
      console.error(`Fieldnotes cleanup warning: installed successfully; remove leftover cache at ${staging}: ${error.message}`);
    }
  }
}

function main() {
  const [command, ...args] = process.argv.slice(2);
  if (!['install', 'update', 'status'].includes(command)) {
    throw new Error('Usage: node vendor.mjs install|update|status [--app PATH] [--ref FULL_SHA_OR_TAG] [--source HTTPS_URL_OR_PATH] [--dry-run]');
  }
  const options = {};
  for (let index = 0; index < args.length; index++) {
    const name = args[index];
    if (!['--app', '--ref', '--source', '--dry-run'].includes(name) || Object.hasOwn(options, name)) throw new Error(`Invalid option: ${name}`);
    options[name] = name === '--dry-run' ? true : args[++index];
    if (options[name] === undefined || String(options[name]).startsWith('--')) throw new Error(`Missing value for ${name}`);
  }
  if (command === 'status' && Object.keys(options).some((name) => name !== '--app')) throw new Error('status only accepts --app.');
  const app = realpathSync(resolve(options['--app'] ?? '.'));
  if (!lstatSync(app).isDirectory()) throw new Error('--app must be an existing directory.');
  for (const path of [enginePath, lockPath, 'blog.config.json', 'blogposts']) noSymlinks(app, path);
  let previous;
  if (command === 'install') {
    if (existsSync(join(app, enginePath)) || existsSync(join(app, lockPath))) throw new Error('Fieldnotes already exists; use status or update.');
  } else {
    previous = readLock(app);
    const changes = conflicts(app, previous);
    if (command === 'status') {
      print({ version: previous.version, commit: previous.commit, source: previous.source, clean: changes.length === 0, conflicts: changes });
      if (changes.length) process.exitCode = 1;
      return;
    }
    if (changes.length) throw new Error(`Refusing to overwrite local engine changes:\n${changes.join('\n')}`);
  }
  const source = sourceLocation(options['--source'] ?? previous?.source ?? upstream);
  if (previous && source !== previous.source) throw new Error('Changing the recorded upstream source is not supported.');
  const temporary = mkdtempSync(join(tmpdir(), 'fieldnotes-vendor-'));
  try {
    const downloaded = fetchEngine(source, options['--ref'], temporary);
    const files = downloaded.lock.files;
    const oldFiles = previous?.files ?? {};
    const summary = {
      action: command, dryRun: Boolean(options['--dry-run']), version: downloaded.lock.version,
      from: previous?.commit ?? null, to: downloaded.lock.commit,
      added: Object.keys(files).filter((path) => !Object.hasOwn(oldFiles, path)),
      changed: Object.keys(files).filter((path) => Object.hasOwn(oldFiles, path) && oldFiles[path] !== files[path]),
      removed: Object.keys(oldFiles).filter((path) => !Object.hasOwn(files, path)),
    };
    if (!options['--dry-run'] && previous?.commit !== downloaded.lock.commit) {
      // A fetch can take time; recheck before replacing anyone's local work.
      for (const path of [enginePath, lockPath, 'blog.config.json', 'blogposts']) noSymlinks(app, path);
      if (previous) {
        if (JSON.stringify(readLock(app)) !== JSON.stringify(previous) || conflicts(app, previous).length) {
          throw new Error('Installation changed while fetching; run status before trying again.');
        }
      } else if (existsSync(join(app, enginePath)) || existsSync(join(app, lockPath))) {
        throw new Error('Installation appeared while fetching; run status before trying again.');
      }
      apply(app, downloaded, command === 'install');
    }
    print(summary);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}

try { main(); } catch (error) {
  console.error(`Fieldnotes: ${error.message}`);
  process.exitCode = 1;
}
