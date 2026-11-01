# Host integration reference

Use the [skill workflow](../SKILL.md) to install/status/update through `scripts/vendor.mjs`. Examples below start at the existing app root, after vendoring. They are build recipes to adapt to the host, not changes performed by the installer.

## Install and maintain the complete skill

Use the self-contained [pinned-checkout installation recipe](../SKILL.md#install) before invoking the vendor script. It clones without checkout, detaches at a reviewed full commit SHA, validates `SKILL.md`, `scripts/vendor.mjs`, `reference/integration.md`, and the bundled `LICENSE`, refuses any existing destination (including a dangling symlink), and copies the entire skill directory. It does not execute downloaded code. Keep the skill pin distinct from the engine pin recorded in `fieldnotes.lock.json`.

Prefer the host root's `.agents/skills/integrating-blogsite`; an optional manual global copy belongs at `~/.config/agents/skills/integrating-blogsite`. Always transfer the complete directory. `amp skill add ugmurthy/fieldnotes-static-blog/.agents/skills/integrating-blogsite` is convenient but requires verification of **both bundled resources** afterward: some CLI versions copy only instructions. The local-source import was observed to lose assets with Amp CLI `v0.0.1793501194-g75ff6b`; that does not establish the behavior of the GitHub importer. Do not assume success output proves completeness.

Engine `update` does not update the installed skill/script. For a skill update, fetch/inspect a new reviewed pinned checkout and compare all installed files, protecting local changes in Git or a backup outside the destination. Intentionally move the old directory aside, then use the complete-directory recipe with an absent destination, and verify the new files before reloading skills. Do not merge into stale resources or follow a destination symlink. If using `amp skill add … --overwrite` instead, do the same review and compare script/reference against the pinned checkout; the flag does not guarantee resource replacement. A skill loaded without resources must follow the recovery instructions in `SKILL.md` before doing engine work.

## Configuration and ownership

The host owns `blog.config.json`, `blogposts/`, routing, and build orchestration. The script owns allowlisted files under `vendor/fieldnotes` and `fieldnotes.lock.json`. Do not put host-only files inside the engine. Retain the vendored MIT `LICENSE` when redistributing it; dependencies have their own licenses.

The installer creates `blog.config.json` when absent, including when articles already exist. It seeds `blogposts/getting-started/welcome.md` only when creating that config and `blogposts/` is absent. Existing config and articles remain untouched. Review the example origin, links, author, and branding before publishing; complete any missing fields manually using the supported schema in upstream `src/settings.ts`/`site.config.json` at the pinned revision.

`contentDir` and `outDir` resolve from the configuration file, **not** the engine working directory. With app-root `blog.config.json`, typical settings are:

```json
{
  "site": "https://example.com",
  "base": "/blog",
  "contentDir": "./blogposts",
  "outDir": "./.fieldnotes-dist"
}
```

This is a partial configuration, not a replacement for the required branding/app-link fields. Always pass an absolute configuration filename when invoking the engine:

```sh
APP_ROOT="$PWD"
BLOG_CONFIG="$APP_ROOT/blog.config.json" bun run --cwd "$APP_ROOT/vendor/fieldnotes" build
```

`base` controls URLs, not an extra output subdirectory: output contains `index.html`, article folders, `_astro`, `_media`, and `404.html` directly. Serve/copy **the contents** of that output at `/blog/`, not `/blog/blog/`. A nested base such as `/help/blog` requires the corresponding mount and routing rules; update config, app anchors, and host rules together. Do not prefix article filenames with the base.

**Astro clears `outDir` before building.** It must be a dedicated, disposable, blog-owned directory. Never use `.`, `public`, the host's entire `dist`, a content/config directory, or a shared asset folder. The engine rejects content/output overlap but cannot identify every host-owned directory; validate output ownership yourself. Do not rely on that check as a general data-loss guard. Ensure a proposed blog mount does not overwrite an existing app route or assets.

## Dependency isolation: inspect the host workspace

Use Node 24 and Bun 1.3.10, including dev dependencies needed for builds/checks. Do not add Astro or the engine's packages to the app manifest. Keep the engine's `package.json`/`bun.lock` unchanged.

For an engine **outside** the host's workspace membership:

```sh
APP_ROOT="$PWD"
bun install --cwd "$APP_ROOT/vendor/fieldnotes" --frozen-lockfile
BLOG_CONFIG="$APP_ROOT/blog.config.json" bun run --cwd "$APP_ROOT/vendor/fieldnotes" check
BLOG_CONFIG="$APP_ROOT/blog.config.json" bun run --cwd "$APP_ROOT/vendor/fieldnotes" test
BLOG_CONFIG="$APP_ROOT/blog.config.json" bun run --cwd "$APP_ROOT/vendor/fieldnotes" build
```

The allowlisted `tests/site.test.mjs` self-tests the engine with disposable content/configuration; the vendoring CLI's fixture tests are not bundled. These tests do not prove the host's routing or its real content integration.

Do not infer isolation just from `--cwd` or from the separate lockfile. A Bun 1.3.10 probe using this engine's manifest/lockfile under a host with `workspaces: ["apps/*"]` installed dependencies under `vendor/fieldnotes/node_modules` without creating a host dependency directory. Adding `"vendor/*"` to the workspace list caused the same command to resolve workspace dependencies and create host-root `node_modules`, even with `--frozen-lockfile`. This verifies those cases, not every possible workspace configuration.

Inspect host workspace globs, package-manager configuration, and lifecycle scripts. Keep `vendor/fieldnotes` outside workspace membership, adjusting the host only with approval, or use a detached build. Neither `--cwd` nor choosing a linker mode is a promised workspace-isolation switch. Check that host manifests/lockfiles remain unchanged after bootstrap.

### Detached build when workspace membership cannot be changed

Build a disposable copy outside the workspace with the committed engine manifest/lockfile, excluding generated state. The absolute configuration still points to host-owned content and output. The following POSIX example uses a new temporary directory outside the host; verify that your temporary-directory location is outside all enclosing workspaces:

```sh
APP_ROOT="$PWD"
ENGINE_BUILD="$(mktemp -d /tmp/fieldnotes-build.XXXXXX)"
trap 'rm -rf -- "$ENGINE_BUILD"' EXIT
tar -C "$APP_ROOT/vendor/fieldnotes" \
  --exclude='./node_modules' --exclude='./.astro' --exclude='./dist' \
  -cf - . | tar -C "$ENGINE_BUILD" -xf -
bun install --cwd "$ENGINE_BUILD" --frozen-lockfile
BLOG_CONFIG="$APP_ROOT/blog.config.json" bun run --cwd "$ENGINE_BUILD" check
BLOG_CONFIG="$APP_ROOT/blog.config.json" bun run --cwd "$ENGINE_BUILD" test
BLOG_CONFIG="$APP_ROOT/blog.config.json" bun run --cwd "$ENGINE_BUILD" build
```

The temporary copy is not a new source of truth and must not be committed. Only that newly allocated scratch directory is removed by the trap. Recreate it after an engine upgrade. If a persistent external build cache is preferred, key/invalidate it by engine commit and lockfile, not just package version.

## Choose the host's build order

### Host copies `public/` during its build

For example, a host that copies `public/blog/` into its final static artifact needs the blog **before** the host build. Set `outDir` to `"./public/blog"`, provided this entire subtree is blog-owned:

```sh
APP_ROOT="$PWD"
BLOG_CONFIG="$APP_ROOT/blog.config.json" bun run --cwd "$APP_ROOT/vendor/fieldnotes" build
# Run the host's existing build command now; it must copy public/blog/.
```

Do not build into `public/blog` after the host has already copied `public/` and expect the deployed artifact to change. Ensure later host steps do not rewrite the copied blog. Where direct output is inconvenient, retain `.fieldnotes-dist` and replace only the dedicated `public/blog` subtree with its contents before the host build; do not merge stale blog pages indefinitely.

### Host permits adding static files to its final output

For a static host output directory named `app-dist`, set `outDir` to `"./app-dist/blog"` and build the **host first**:

```sh
APP_ROOT="$PWD"
# Run the host's existing build command now; it creates app-dist/.
BLOG_CONFIG="$APP_ROOT/blog.config.json" bun run --cwd "$APP_ROOT/vendor/fieldnotes" build
```

The host's next build may clear `app-dist`, so regenerate the blog after it on every build. Never set the blog output to `app-dist` itself. If the framework uses a deployment manifest or server adapter that does not accept arbitrary final-output files, use its supported static/public integration instead; a folder copy alone is not sufficient.

Detached builds use the same ordering; substitute the temporary engine directory in the engine command. `.fieldnotes-dist` can also be built separately and have its contents copied to the blog-only final subtree after the host build. Explicitly remove stale files **only in that owned blog subtree** when replacing it.

## Routing contract

Configure the actual host/CDN/framework, not just Astro preview. For a `/blog` mount:

1. Canonicalize `/blog` to `/blog/` if required by the host.
2. Serve existing `/blog/**` static files and directory `index.html` pages, including nested articles, categories, pagination, `_astro`, `_media`, RSS, sitemap, and redirects.
3. For an unknown `/blog/**` path, serve the blog's `/blog/404.html` body with **HTTP status 404**, before any app SPA fallback. Returning a 404 page with status 200 is not sufficient. Do not rewrite unknown blog paths to the blog index or the app shell.
4. Leave non-blog routes under the host's existing routing and fallback rules. A global blog 404 rule must not consume application routes.

Use ordinary `<a href="/blog/">` links in the host. Keep app navigation links and branding in blog config. Do not import engine components or the article manifest into app code. Non-root bases must appear in generated links/assets, canonical URLs, RSS/sitemap, redirects, and host routing. For moved articles, review config `redirects` and add host-level HTTP redirects if needed: generated HTML redirects are not HTTP 301 responses.

## Supported styling

Customize `accent` (six-digit hex), optional `logo`, `fontUi`, `fontDisplay`, and `fontStylesheet` in config. Use supported title/description, CTA/app-link, and author fields for copy. System fonts avoid external requests; an external `fontStylesheet` must be permitted by the host's CSP and network policy. Keep logos/social images at publicly served URLs.

These settings feed the engine's existing CSS variables and layout. Host app CSS does not automatically theme these independent HTML documents. There is no supported arbitrary stylesheet injection/override setting; the schema rejects unknown fields. Do not edit vendored CSS to simulate an upgrade-safe override. If deeper customization is required, explicitly review an upstream feature or a separately maintained fork rather than hiding drift.

## CI and orb bootstrap

Extend the host's **existing** setup and CI, after review:

- Make Node 24 and Bun 1.3.10 available in setup/build shells.
- Install host dependencies using its normal package manager, and engine dependencies separately using the isolated recipe above. Run integrity `status` locally; ordinary builds use the checked-in engine and need no upstream Git fetch. Dependency bootstrap can still require a registry/cache.
- Run configured engine checks, the host's checks, and both builds in the chosen order. Keep config/content in the host checkout. Reinstall engine dependencies after an update clears disposable caches.
- Cache separate engine dependencies only with suitable toolchain/lockfile keys. Preserve the host's existing setup/resume semantics; readiness checks need not reinstall on every orb resume.
- Do not copy upstream lifecycle scripts or GitHub Actions workflows into the app, replace its CI, deploy automatically, or let a deploy download an unpinned branch. The vendor script does not change package scripts or gitignore; review generated-output/cache ignores manually.

For the default layout, consider these host-root `.gitignore` entries after review:

```gitignore
/vendor/fieldnotes/node_modules/
/vendor/fieldnotes/.astro/
/vendor/fieldnotes/dist/
/.fieldnotes-dist/
```

Keep `vendor/fieldnotes` source, its `LICENSE`, and `fieldnotes.lock.json` tracked; do not ignore the whole vendor tree. Add a different blog-only output subtree if you change `outDir`, without hiding host source/content.

## Acceptance and upgrade checks

Test the host's actual served production artifact (and relevant development routing) with the chosen non-root base. Check:

- Blog index, nested article, category/pagination and relative article links work.
- `_astro` CSS and `_media` assets load from the blog mount; canonical/discovery/redirect URLs include the base without duplication.
- An unknown nested blog route returns HTTP 404 and the blog not-found page, not app HTML/status 200.
- Existing app routes, sign-in/navigation targets, and its intended unknown-route behavior still work.
- Existing content/configuration survived install/update; drafts remain unpublished; deleted/moved articles do not linger in copied output.
- Local `status` is clean after bootstrap/build: generated vendor `node_modules`, `.astro`, and `dist` are ignored, but extra source files are not.

Add focused host route/build regression tests. Use screenshots/visual tests only when changing visible layout, branding, or other visual integration; a documentation-only change or unchanged engine upgrade does not require screenshot tests by default.

For each upgrade, run local `status`, review changelog/source and any manual migrations, then run explicit-ref `update --dry-run` before applying. The preview fetches upstream without changing host files. Update refuses managed-file drift and extra files and stages engine replacement; it does not migrate host config/content. Review and commit engine/lockfile plus any intentional manual migration coherently, without autopush/deploy. Roll back to a known-good host Git revision of engine/lockfile together, protect unrelated pending work, reinstall engine dependencies, rebuild in the correct order, and repeat served-route checks.
