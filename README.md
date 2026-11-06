# Fieldnotes: a reusable static blog

An independent Astro/TypeScript blog template for standalone sites or integration into webapps. Markdown and nested folders become public HTML pages. No login, database, browser Markdown parser, or app JavaScript is required. Use this directory as the root of its own GitHub repository; it contains its own package manifest, lockfile, example content, tests, and hosting configuration.

Upstream: [ugmurthy/fieldnotes-static-blog](https://github.com/ugmurthy/fieldnotes-static-blog) (public).

## License

Released under the [MIT License](LICENSE). You may use, modify, and vendor this engine in open-source or proprietary applications, including commercial products. Preserve the copyright and license notice with vendored copies. Third-party dependencies retain their own licenses.

## Standalone quick start

Requires Node 24 and Bun (CI uses Bun 1.3.10).

### Create your repository from the template

For **`https://ugmurthy.github.io/blog/`**, create the separate repository **`ugmurthy/blog`**. Do **not** replace or delete files in `ugmurthy/ugmurthy.github.io`; that repository continues serving the existing homepage. GitHub Pages mounts the new project site's output at `/blog/`.

1. The engine repository's owner must first enable **Settings → General → Template repository** in `ugmurthy/fieldnotes-static-blog`. This GitHub setting is not enabled by committing these files.
2. On the [engine repository](https://github.com/ugmurthy/fieldnotes-static-blog), choose **Use this template → Create a new repository**, owner **ugmurthy**, name **blog**, visibility **Public**. Copy the default branch only. Substitute your own account/repository when adapting this example.
3. Clone the new repository. No manual source-file copying is needed:

```sh copy Copy Template Clone
git clone https://github.com/ugmurthy/blog.git
cd blog
```

All paths below are relative to this **new repository's root**:

| Path | Ownership and purpose |
| --- | --- |
| `src/` | Blog engine source: layouts, routing, styles, and Markdown processing. No extra `blogsite/` directory is needed. |
| `astro.config.ts`, `package.json`, `bun.lock`, `tsconfig.json` | Engine build configuration and dependencies. Keep the manifest and lockfile together during upgrades. |
| `blogposts/` | **Your content**: nested category folders, `.md` articles, and colocated images/videos/downloads. |
| `site.config.json` | **Your configuration**: branding, author, origin, `/blog` base, and optional app links. |
| `public/` (optional) | Your additional static assets; use article-relative media in `blogposts/` when possible. |
| `.github/workflows/`, `netlify.toml`, `vercel.json` | Deployment configuration to review for your chosen host. |
| `fieldnotes-upstream.txt` | Reviewed engine revision, recorded below for future template upgrades. |
| `dist/` | Generated HTML/assets; ignored by Git. Publish its **contents**, not source files. |

### Record the starting engine revision

A GitHub template creates **independent Git history**, not a fork or an automatic update subscription. Record the starting engine commit before changing engine files. From the freshly cloned `blog` repository:

```sh copy Copy Upstream Baseline
git remote add fieldnotes https://github.com/ugmurthy/fieldnotes-static-blog.git
git fetch fieldnotes main
REF=$(git rev-parse fieldnotes/main)
git diff --exit-code "$REF" HEAD -- src astro.config.ts package.json bun.lock tsconfig.json tests/site.test.mjs LICENSE \
  && printf '%s\n' "$REF" > fieldnotes-upstream.txt
```

The comparison must be empty. If the engine changed after you created the template, stop: set `REF` to the exact full commit used to create it, repeat the comparison, and record that commit only when it matches. Do not record the newest upstream commit against older engine files. Commit `fieldnotes-upstream.txt` with your initial blog configuration; keep the `fieldnotes` remote for upgrades (`origin` remains your own repository).

### Configure, write, and check locally

Replace `site.config.json` with the [standalone configuration](#standalone-configuration) below and replace the starter articles with your own. Then run from the repository root:

```sh copy Copy Local Checks
bun install --frozen-lockfile
bun run check
bun test
bun run build
bun run dev
```

`bun run dev` stays running until you stop it. Alternatively, use `bun run preview` after building to inspect production output. Follow [GitHub Pages](#github-pages) below to enable publishing; template creation alone does not deploy anything. The same source also works on [Netlify](#netlify) or [Vercel](#vercel).

After checking the site, stop the local server, complete your chosen host's setup, then commit and push to **your `blog` repository**. Also stage any additional public assets you created:

```sh copy Copy Publish Blog Configuration
git add site.config.json fieldnotes-upstream.txt blogposts
git diff --cached
git commit -m "Configure standalone blog"
git push origin main
```

`bun run check` checks TypeScript and Astro templates. `bun test` builds a disposable second app and verifies nested routes, relative links and media, pagination, drafts, metadata, redirects, and invalid-content failures. The workflow in `.github/workflows/ci.yml` runs these checks and a standalone build. It does not deploy.

### Standalone configuration

The checked-in `site.config.json` demonstrates app integration. For the standalone `ugmurthy/blog` project site, replace it with this configuration and customize the branding:

```json copy Copy Standalone Configuration
{
  "name": "My blog",
  "title": "Articles & notes",
  "description": "Ideas, guides, and things worth sharing.",
  "site": "https://ugmurthy.github.io",
  "base": "/blog",
  "contentDir": "./blogposts",
  "outDir": "./dist",
  "author": "Your name",
  "accent": "#3050d0"
}
```

Keep Markdown and colocated media in `blogposts/`, with folders for categories. Each push rebuilds the static site when deployment is enabled; visitors do not fetch or parse Markdown from GitHub. Required article frontmatter and naming rules are described under [Writing articles](#writing-articles).

Omit `appUrl` to hide workspace links, and omit `signupUrl` to hide the article call to action. Omit `pricingUrl` to hide Pricing. `homeUrl` defaults to the blog index, including its base path. Existing webapp configurations continue to work unchanged; these are independently optional features, not a separate engine or theme.

### Future engine updates for a template-created blog

There is no automatic template sync. Use the recorded upstream commit to apply **only core engine changes**, including added/deleted files, while leaving `blogposts/`, `site.config.json`, and `public/` alone. Do **not** run `git pull fieldnotes main --allow-unrelated-histories`: that mixes the template's example content/configuration into your site. The webapp `vendor.mjs update` command further below is for a vendored engine, **not** this root-level template layout.

Start on your up-to-date `main` with a **clean worktree** and a committed `fieldnotes-upstream.txt`. Commands in this section run in the same shell, from your `blog` repository. Fetch upstream, choose a reviewed full 40-character commit, and inspect the change before applying it:

```sh copy Copy Review Engine Update
git switch main
git pull --ff-only origin main
git status --short
git fetch fieldnotes main --tags
OLD=$(cat fieldnotes-upstream.txt)
NEXT='<reviewed-full-40-character-commit-SHA>'
git diff "$OLD" "$NEXT" -- CHANGELOG.md README.md
git diff --stat "$OLD" "$NEXT" -- src astro.config.ts package.json bun.lock tsconfig.json tests/site.test.mjs LICENSE
git diff "$OLD" "$NEXT" -- src astro.config.ts package.json bun.lock tsconfig.json tests/site.test.mjs LICENSE
```

If `git status` shows pending work, commit or safely set it aside **before continuing**. Review required configuration/content migrations in the upstream notes; apply them deliberately to your files. No version tags are currently published, so use a full commit SHA. If the core engine diff is empty, there is no core update to apply.

For a nonempty core diff, create a new upgrade branch and apply a three-way patch:

```sh copy Copy Apply Engine Update
git switch -c update-fieldnotes
git diff --binary "$OLD" "$NEXT" -- src astro.config.ts package.json bun.lock tsconfig.json tests/site.test.mjs LICENSE \
  | git apply --3way --index
```

This works across independent template history because it uses the fetched Git blobs, not shared branch ancestry. It preserves nonconflicting local engine customizations; overlapping edits may produce conflicts. **Stop on any error or conflict**, inspect `git status`, resolve the affected files, and stage the resolutions. Do not advance the marker or publish until resolved. Do not overwrite whole engine directories from upstream: that can lose local changes or leave removed files behind.

Hosting files, other tooling/tests, and documentation are deliberately outside this core update. Separately review upstream changes to `.github/`, `netlify.toml`, `vercel.json`, `.agents/`, `tests/vendor.test.mjs`, and `.gitignore`, and incorporate relevant changes manually. In particular, review workflow permissions/commands and any new toolchain requirements before adopting them. Keep the MIT license notice.

After resolving the patch and any required migrations, validate with the toolchain required by the new revision:

```sh copy Copy Validate Engine Update
bun install --frozen-lockfile
bun run check
bun test
bun run build
bun run preview
```

Inspect `/blog/`, a nested article and its media, RSS, and a missing-route 404 using a preview/static server that honors the configured base and real HTTP 404s. Confirm your articles, branding, and optional app links remain correct. Only after all checks pass, stop the preview and record/commit the reviewed revision. Stage any deliberately migrated config/content or manually adopted hosting files too, before committing:

```sh copy Copy Record Engine Update
printf '%s\n' "$NEXT" > fieldnotes-upstream.txt
git add fieldnotes-upstream.txt
git diff --cached
git status --short
git commit -m "Upgrade Fieldnotes engine to $NEXT"
git push -u origin update-fieldnotes
```

Open a pull request to your `main`, review it and its CI checks, then merge when ready; the enabled host deploys the merged revision. Delete the merged upgrade branch before reusing its name. To roll back, revert the upgrade commit (including the marker and associated migrations), reinstall locked dependencies, rerun the checks, and publish through the same reviewed process. Never discard unrelated content changes to undo an engine update.

## Standalone hosting

These configurations assume this repository is the host's project root, with `outDir: "./dist"`. They publish static files, including `404.html`; do not add an SPA catch-all rewrite. No Netlify or Vercel server adapter is required. Hosting setup is opt-in: adding these files does not create hosting projects or enable deployment by itself.

`BLOG_SITE` and `BLOG_BASE` override `site` and `base` at build time and use the same validation. `BLOG_SITE` should be the production origin without a path; `BLOG_BASE` is `/` or a mount path such as `/my-blog`. They also apply when using `BLOG_CONFIG`. Unset or empty overrides leave the JSON values unchanged. These overrides do not rewrite explicitly configured external/app URLs such as `homeUrl`.

### GitHub Pages

1. Complete the [template setup](#create-your-repository-from-the-template) in **`ugmurthy/blog`**, with `site: "https://ugmurthy.github.io"` and `base: "/blog"`. These instructions do not change the existing `ugmurthy.github.io` repository or its Pages settings. For a root user site instead, the repository would be `ugmurthy.github.io` and the base `/`.
2. In the **new `blog` repository**, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**. Enable Actions if disabled, and ensure the **github-pages** environment's deployment rules permit `main`.
3. In that same repository, add the Actions **variable** (not a secret) **`DEPLOY_GITHUB_PAGES`** with value **`true`** under **Settings → Secrets and variables → Actions → Variables**.
4. Push to `main` (adjust the branch in `.github/workflows/pages.yml` if needed), or run the **GitHub Pages** workflow manually.
5. Wait for **Actions → GitHub Pages → deploy** to succeed, then visit **`https://ugmurthy.github.io/blog/`**. Later pushes to `main` rebuild and publish automatically; there is no manual HTML copying.

The opt-in workflow installs locked dependencies with Node 24 and Bun 1.3.10, checks and tests the engine, builds, uploads `dist/`, and deploys it to Pages. It reads the configured Pages origin and base path automatically, covering user sites, project subpaths, and configured custom domains. It does not create or enable a Pages site. Set the corresponding `site`/`base` in JSON as well when you want local builds to match production.

The existing verification workflow remains independent and runs on pull requests. The Pages workflow never deploys pull requests. GitHub Pages serves the generated `404.html` for missing routes; no branch of committed generated HTML or Jekyll build is needed. The artifact contains the contents of `dist/` directly: do not add a second `blog/` directory inside it, and do not add a CNAME for `ugmurthy.github.io`.

### Netlify

Import the standalone repository into Netlify with the repository root as its base directory. The included `netlify.toml` supplies build command `bun run build`, publish directory `dist`, Node 24, Bun 1.3.10, and frozen-lockfile dependency installation. Choose the production branch in Netlify.

Set `site` in JSON or the Netlify build environment variable `BLOG_SITE` to your production origin (for example, `https://my-blog.netlify.app` or your custom domain). Normally use `base: "/"`; clear any inherited `BLOG_BASE` intended for GitHub Pages. Netlify serves the root `404.html` as its custom not-found page without a catch-all redirect.

### Vercel

Import the standalone repository into Vercel with the repository root as its root directory. The included `vercel.json` selects Astro, frozen-lockfile installation, build command `bun run build`, output directory `dist`, and trailing-slash URLs. `package.json` selects Node 24; Vercel supplies Bun 1.x based on `bun.lock` (CI verifies Bun 1.3.10).

Set `site` in JSON or the Vercel build environment variable `BLOG_SITE` to your production origin (for example, `https://my-blog.vercel.app` or your custom domain). Normally use `base: "/"`. Vercel serves the root `404.html` for missing static routes; no function or SPA rewrite is needed.

On Netlify and Vercel, explicitly choose whether environment overrides apply to production, previews, or both. Keep the production canonical origin for previews unless you intentionally want preview-specific canonical/RSS/sitemap URLs. Confirm a nested article, its media, RSS, and a missing-route HTTP 404 after the first deployment; local builds do not verify provider settings.

### Preserve webapp integration

Standalone hosting files (`netlify.toml`, `vercel.json`, and `.github/workflows/pages.yml`) are excluded by the existing vendoring allowlist. They do not replace a consuming app's deployment or build settings. Continue using app-owned `blog.config.json`, content, and output paths through `BLOG_CONFIG`, as described below; the same engine still supports a `/blog` mount.

## Amp orbs

Once the executable `.agents/setup` and `.agents/resume` scripts are on the project's default branch, Amp can cache a prepared orb snapshot. Setup installs Node 24 and Bun 1.3.10 to a user-local toolchain directory, makes them available in repository login shells, and runs `bun install --frozen-lockfile`. Repeated setup runs reuse the installed toolchain and dependencies. Resume only checks readiness; it never installs packages. No secrets, databases, or authentication are needed.

Run `.agents/setup` to prepare or repair an orb manually. Then use the normal check, test, build, and dev commands above. Setup does not start a development server; run it as a supervised orb service when needed.

## Configuration and reuse

`BLOG_CONFIG=/absolute/path/to/config.json bun run build` supplies another app's configuration. Relative `contentDir` and `outDir` paths resolve from **that configuration file**, not from the engine directory.

The [standalone configuration](#standalone-configuration) shows the required fields; `site.config.json` additionally demonstrates optional app features. `site` is the canonical production origin; `base` is `/` for a root site or a mount point such as `/blog` for a standalone project site or an integrated webapp. Do not include the base in article filenames. `outDir` is a dedicated blog output directory: Astro clears it on build, so never point it at the app's entire output or at source files.

Branding fields: `name`, `title`, `description`, `accent` (six-digit hex), optional `logo`, `fontUi`, `fontDisplay`, and `fontStylesheet`. System fonts work without external requests. Optional `socialImage` should be a publicly served image URL. Optional `homeUrl`, `appUrl`, `signupUrl`, and `pricingUrl` must be site-relative paths or HTTP(S) URLs. `homeUrl` defaults to the blog index; `appUrl` enables workspace links, and `signupUrl` independently enables the article call to action. Optional `ctaLabel` defaults to "Get started"; optional `ctaDescription` adds explanatory text. Supplied labels/descriptions must be nonempty strings. Set `author` for the default byline. Listings use `pageSize` (1–50, default 10).

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

Prefer [creating a repository from the template](#create-your-repository-from-the-template); manual copying is not required. If you copy instead, copy **this directory's source** to a clean checkout (exclude `node_modules/`, `.astro/`, and `dist/`). Its `bun.lock` is intended for an independent engine install; do not include the engine in a consuming app's workspace membership (see dependency isolation above). Run the standalone checks above before publishing. `.github/workflows/ci.yml` becomes active only when this directory is the repository root.

Keep personal/app-specific branding and articles in your own repository; the example configuration/content here is intentionally generic. Record the engine commit used by each site. This version is `0.1.0`. Use the [template upgrade procedure](#future-engine-updates-for-a-template-created-blog) for a standalone root-level engine and the [vendored upgrade procedure](#upgrade-deliberately) for existing webapps; neither downloads an unpinned engine during deployment. No GitHub credentials or remote are needed to build a local copy; uploading/deploying it uses your host's authentication.

Repository creation, visibility, and publishing are owner decisions. This template does not create remotes or hosting projects; deployment begins only after the host is connected or the Pages workflow is enabled as described above.
