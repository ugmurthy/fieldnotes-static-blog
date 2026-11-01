# Fieldnotes: a reusable static app blog

An independent Astro/TypeScript blog template. Markdown and nested folders become public HTML pages. No login, database, browser Markdown parser, or app JavaScript is required. Use this directory as the root of its own GitHub repository; it contains its own package manifest, lockfile, example content, tests, and GitHub Actions workflow.

Upstream: [ugmurthy/fieldnotes-static-blog](https://github.com/ugmurthy/fieldnotes-static-blog) (public).

## License

Released under the [MIT License](LICENSE). You may use, modify, and vendor this engine in open-source or proprietary applications, including commercial products. Preserve the copyright and license notice with vendored copies. Third-party dependencies retain their own licenses.

## Standalone quick start

Requires Node 24 and Bun (CI uses Bun 1.3.10).

Clone the repository, then run these commands from its root:

```sh
bun install --frozen-lockfile
bun run dev
```

Edit `site.config.json`, replace the example under `blogposts/`, and run `bun run build`. Publish the contents of `dist/` using any static host. Run `bun run preview` to inspect production output. Configure the host to serve `404.html` with HTTP status 404, not fall back to a single-page app.

`bun run check` checks TypeScript and Astro templates. `bun test` builds a disposable second app and verifies nested routes, relative links and media, pagination, drafts, metadata, redirects, and invalid-content failures. The workflow in `.github/workflows/ci.yml` runs these checks and a standalone build. It does not deploy.

## Amp orbs

Once the executable `.agents/setup` and `.agents/resume` scripts are on the project's default branch, Amp can cache a prepared orb snapshot. Setup installs Node 24 and Bun 1.3.10 to a user-local toolchain directory, makes them available in repository login shells, and runs `bun install --frozen-lockfile`. Repeated setup runs reuse the installed toolchain and dependencies. Resume only checks readiness; it never installs packages. No secrets, databases, or authentication are needed.

Run `.agents/setup` to prepare or repair an orb manually. Then use the normal check, test, build, and dev commands above. Setup does not start a development server; run it as a supervised orb service when needed.

## Configuration and reuse

`BLOG_CONFIG=/absolute/path/to/config.json bun run build` supplies another app's configuration. Relative `contentDir` and `outDir` paths resolve from **that configuration file**, not from the engine directory.

Required fields are shown in `site.config.json`. `site` is the canonical production origin; `base` is `/` for a standalone site or a mount point such as `/blog`. Do not include the base in article filenames. `outDir` is a dedicated blog output directory: Astro clears it on build, so never point it at the app's entire output or at source files.

Branding fields: `name`, `title`, `description`, `accent` (six-digit hex), optional `logo`, `fontUi`, `fontDisplay`, and `fontStylesheet`. System fonts work without external requests. Optional `socialImage` should be a publicly served image URL. App links are `homeUrl`, `appUrl`, `signupUrl`, optional `pricingUrl`, `ctaLabel`, and `ctaDescription`. These must be site-relative paths or HTTP(S) URLs. Set `author` for the default byline. Listings use `pageSize` (1–50, default 10).

These are supported configuration-based styling controls, not an arbitrary CSS override API. The schema rejects unknown fields; host app styles do not automatically apply to the blog's independent HTML pages. Avoid editing vendored engine CSS if you want clean upgrades.

The app should link to the blog with ordinary anchors, never import the engine or a content manifest. More articles increase build time and deployment size, not app startup downloads. No article prefetching is enabled.

## Add Fieldnotes to an existing app

The agent-friendly workflow keeps a pinned engine in `vendor/fieldnotes`, with app-owned `blog.config.json` and `blogposts/` outside it. Install the reusable [integrating-blogsite skill](.agents/skills/integrating-blogsite/SKILL.md#install) by copying its **complete directory from a reviewed, full-commit-pinned Git checkout**. The linked recipe validates all four required files and refuses existing destinations, including symlinks; it does not execute downloaded code. Prefer the host root's `.agents/skills/integrating-blogsite`. A manual whole-directory global copy to `~/.config/agents/skills/integrating-blogsite` is optional.

Convenient alternative, from the host root:

```sh
amp skill add ugmurthy/fieldnotes-static-blog/.agents/skills/integrating-blogsite
```

**Verify both `scripts/vendor.mjs` and `reference/integration.md` are present under the installed skill.** Some Amp CLI versions copy only `SKILL.md` despite reporting success; GitHub-import resource handling is not assumed verified. Recover missing resources from a reviewed pinned checkout as described in `SKILL.md`. With `--global`, use script paths relative to the global skill directory instead.

### Vendor a reviewed revision

Once the skill/script is available, run these commands from the host app root. Replace `REF` with a reviewed **full 40-character commit SHA**. No release tags exist currently; use a full commit until releases are tagged. The script also accepts `vSemVer` tags when available, resolving them to immutable commits. `package.json` currently declares `0.1.0`; this is not a claim that `v0.1.0` has been published.

```sh
REF='<full-40-character-commit-SHA>'
node .agents/skills/integrating-blogsite/scripts/vendor.mjs install --app "$PWD" --ref "$REF" --dry-run
node .agents/skills/integrating-blogsite/scripts/vendor.mjs install --app "$PWD" --ref "$REF"
node .agents/skills/integrating-blogsite/scripts/vendor.mjs status --app "$PWD"
```

The dependency-free Node script's [complete interface](.agents/skills/integrating-blogsite/SKILL.md#install) supports `install`, `update`, and local `status`. `--app` defaults to the current directory. Install/update require explicit `--ref`; branches and short SHAs are not supported. Install's default source is `https://github.com/ugmurthy/fieldnotes-static-blog.git`. Use `--source` for another reviewed HTTPS Git URL or local Git repository; updates use the recorded source and cannot change it.

Only allowlisted engine files are installed, including the MIT `LICENSE`. App-root `fieldnotes.lock.json` records source, immutable commit, requested ref, engine version, and SHA256 managed-file hashes; review and commit it with the engine. Installation creates `blog.config.json` when absent, preserving existing articles. It seeds `blogposts/getting-started/welcome.md` only when creating config **and** `blogposts/` is absent. Config defaults are base `/blog` and dedicated app-root output `.fieldnotes-dist`; existing config is preserved.

The script does **not** install dependencies, edit host package scripts, routing, or gitignore, or provide a force option. It does not push or deploy. Keep the vendored license notice when redistributing the engine.

### Integrate with the host build and routes

Inspect the host before changing its build. Use Node 24 and Bun 1.3.10. Bootstrap engine dependencies separately; do not merge them into the app's manifest/lockfile. With Bun workspaces, `--cwd` alone does **not** guarantee isolation: inspect whether workspace globs include `vendor/fieldnotes`. The [integration reference](.agents/skills/integrating-blogsite/reference/integration.md#dependency-isolation-inspect-the-host-workspace) records tested Bun behavior and a detached-build alternative.

If the engine is outside host workspace membership, run from the host root:

```sh
APP_ROOT="$PWD"
bun install --cwd "$APP_ROOT/vendor/fieldnotes" --frozen-lockfile
BLOG_CONFIG="$APP_ROOT/blog.config.json" bun run --cwd "$APP_ROOT/vendor/fieldnotes" check
BLOG_CONFIG="$APP_ROOT/blog.config.json" bun run --cwd "$APP_ROOT/vendor/fieldnotes" test
BLOG_CONFIG="$APP_ROOT/blog.config.json" bun run --cwd "$APP_ROOT/vendor/fieldnotes" build
```

Vendored `bun test` runs the engine's allowlisted `tests/site.test.mjs`, not the CLI fixture tests; it does not validate host routing.

Use an **absolute `BLOG_CONFIG`**. Set production origin, branding/app links, content location, non-root base, and output in the host's config before publishing. Relative content/output paths resolve from that config. `base` sets URLs; it does not add a `blog/` directory inside output. Mount the output's contents at the configured base.

Choose build order to match the host:

- **Host copies `public/` during build:** use a blog-owned `public/blog/` subtree (or copy `.fieldnotes-dist` contents there) **before** the host build.
- **Host accepts final static output:** build the host **first**, then build/copy the blog into a blog-owned `<host-output>/blog/` subtree. Some adapters require a supported public-assets integration rather than a final folder copy.

**Astro clears `outDir`. An unsafe value can erase host data.** Never point it at the app root, content, all of `public/`, or the host's whole output directory. Reserve a blog-only subtree and check route/asset collisions. The [integration reference](.agents/skills/integrating-blogsite/reference/integration.md) covers build/copy recipes, supported styling, routing, validation, and generated-file ignore examples.

Serve blog static files and blog-specific **HTTP 404s before any SPA fallback**, preserving non-blog app routes. Validate the actual served app's blog index, nested articles, assets/links, missing-blog-route 404, and existing app routes. Engine checks alone do not prove host routing. Add focused build/route tests; screenshots/visual tests are needed only when changing visual integration.

Extend the host's existing CI/orb dependency bootstrap and build steps. Do not copy this repository's `.agents/setup`, `.agents/resume`, or `.github/workflows/` over the host's lifecycle/CI files. Review generated-file ignores manually; the installer does not change them. Builds use the checked-in engine, not an upstream download during deployment.

### Upgrade deliberately

```sh
node .agents/skills/integrating-blogsite/scripts/vendor.mjs status --app "$PWD"
NEXT_REF='<reviewed-full-40-character-commit-SHA>'
node .agents/skills/integrating-blogsite/scripts/vendor.mjs update --app "$PWD" --ref "$NEXT_REF" --dry-run
node .agents/skills/integrating-blogsite/scripts/vendor.mjs update --app "$PWD" --ref "$NEXT_REF"
```

`status` is local-only and never fetches. It exits 1 for modified/missing managed engine files or untracked extra engine files, ignoring generated `node_modules`, `.astro`, and `dist` directories. `update --dry-run` fetches/previews the target without changing host files. Review the [changelog](CHANGELOG.md), upstream changes, and any config/content migrations manually before updating.

Update stages engine replacement, refuses tracked-file drift and unexpected extra files, preserves config/articles, and clears disposable vendor dependency/build caches. Reinstall locked engine dependencies, apply reviewed manual migrations, and repeat host build/route checks. On drift, stop and review local work rather than deleting it. Roll back engine and `fieldnotes.lock.json` together to a known-good host Git revision, protect unrelated pending changes, and handle any associated migration coherently. Rollback also needs dependency bootstrap and a fresh verified build; no autopush or deployment is performed.

Engine updates do **not** update the installed skill/script. Review/protect local skill changes, fetch a new reviewed pinned checkout, then intentionally replace the **whole directory**, as described in the [skill-maintenance guidance](.agents/skills/integrating-blogsite/reference/integration.md#install-and-maintain-the-complete-skill). `amp skill add … --overwrite` is an optional convenience, not a guarantee of refreshed resources: verify script/reference against that checkout. Reload skills only after the replacement is complete; this does not itself upgrade the pinned engine.

## Writing articles

Create a lowercase kebab-case `.md` file under `blogposts/`. Every parent folder is a category. For example, `blogposts/tutorials/alignment/manual-anchors.md` becomes `/blog/tutorials/alignment/manual-anchors/` with `base: "/blog"`. Category listings live at `/blog/category/tutorials/` and `/blog/category/tutorials/alignment/`. `category`, `page`, `_astro`, `_media`, and `404` are reserved top-level article paths.

```markdown
---
title: "A useful tutorial"
description: "What the reader will learn."
published: "2026-10-30"
updated: "2026-11-02"
author: "Your team"
featured: true
draft: false
---

A short introduction.

## First step

Explain what to do and what to look for.

![Descriptive screenshot text](./first-step.webp)

Continue with [another guide](../another-guide.md).
```

Only `title`, `description`, and `published` are required. Quote dates. `updated` cannot precede `published`. Dates are metadata, not a publication scheduler: future dates do not hide an article. Add `draft: true` to exclude an article, its draft-only categories, and its discovery entries from production. Drafts are not a confidentiality boundary: source is in Git and colocated media is public output. Never store private files or secrets in content directories.

The filename supplies the URL; changing the title does not break links. Use `##` for section headings: the page supplies the article's `h1` and creates a table of contents from its `h2` headings. Markdown tables, lists, quotes, and fenced code are supported. Content is trusted, reviewed Git source; this is not an untrusted user-content renderer.

Put screenshots and downloads beside articles. Supported assets are PNG, JPEG, WebP, GIF, AVIF, SVG, MP4, WebM, and PDF; they are copied to `_media/` without image recompression. Optimize images before committing them, use meaningful alt text, and prefer Markdown images (lazy-loaded automatically). Use relative `.md` links to other articles; these links and referenced files are checked at build time and rewritten for the configured base. Links to drafts fail the build. External URLs, app URLs, and fragment targets are not network-checked.

An optional `_category.json` in any category folder controls labels, descriptions, and sibling ordering:

```json
{ "title": "Getting started", "description": "A good place to begin.", "order": 1 }
```

Without it, folder names become display labels. Empty categories are not published. Newest articles come first, with the path as a stable tie-breaker. On the first homepage page, the first `featured: true` article within that page receives the feature card. Pagination keeps page payloads bounded; category navigation lists categories, not every article.

## Moving an article

Keep published paths stable when possible. If moving an article, add an entry to `redirects` in the site configuration, with paths relative to the blog base and without `.md` or a trailing slash:

```json
{ "redirects": { "old-category/old-guide": "tutorials/new-guide" } }
```

The target must be a published article and the old path must be unused. Static output includes an HTML redirect with a canonical target and a visible link. This works without JavaScript; **it is not an HTTP 301**. Add a matching host-level 301 when permanent search-engine migration is important.

## Publishing this as its own repository

Copy **this directory's source** to a clean checkout (exclude `node_modules/`, `.astro/`, and `dist/`). Its `bun.lock` is intended for an independent engine install; do not include the engine in a consuming app's workspace membership (see dependency isolation above). Run the standalone checks above before publishing. `.github/workflows/ci.yml` becomes active only when this directory is the repository root.

Keep app-specific branding and articles in consuming applications; the example configuration/content here is intentionally generic. Record the engine commit or release used by each app. This version is `0.1.0`. Update vendored copies deliberately from a reviewed upstream release/commit rather than downloading an unpinned branch during deployment. No GitHub credentials or remote are needed to build or deploy a local copy.

Repository creation, visibility, and publishing are owner decisions; this template does not create a remote or deploy automatically.
