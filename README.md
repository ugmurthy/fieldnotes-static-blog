# Fieldnotes: a reusable static app blog

An independent Astro/TypeScript blog template. Markdown and nested folders become public HTML pages. No login, database, browser Markdown parser, or app JavaScript is required. Use this directory as the root of its own GitHub repository; it contains its own package manifest, lockfile, example content, tests, and GitHub Actions workflow.

Upstream: [ugmurthy/fieldnotes-static-blog](https://github.com/ugmurthy/fieldnotes-static-blog) (private; GitHub access is required to clone).

## Standalone quick start

Requires Node 24 and Bun (CI uses Bun 1.3.10).

Clone the repository, then run these commands from its root:

```sh
bun install --frozen-lockfile
bun run dev
```

Edit `site.config.json`, replace the example under `blogposts/`, and run `bun run build`. Publish the contents of `dist/` using any static host. Run `bun run preview` to inspect production output. Configure the host to serve `404.html` with HTTP status 404, not fall back to a single-page app.

`bun run check` checks TypeScript and Astro templates. `bun test` builds a disposable second app and verifies nested routes, relative links and media, pagination, drafts, metadata, redirects, and invalid-content failures. The workflow in `.github/workflows/ci.yml` runs these checks and a standalone build. It does not deploy.

## Configuration and reuse

`BLOG_CONFIG=/absolute/path/to/config.json bun run build` supplies another app's configuration. Relative `contentDir` and `outDir` paths resolve from **that configuration file**, not from the engine directory.

Required fields are shown in `site.config.json`. `site` is the canonical production origin; `base` is `/` for a standalone site or a mount point such as `/blog`. Do not include the base in article filenames. `outDir` is a dedicated blog output directory: Astro clears it on build, so never point it at the app's entire output or at source files.

Branding fields: `name`, `title`, `description`, `accent` (six-digit hex), optional `logo`, `fontUi`, `fontDisplay`, and `fontStylesheet`. System fonts work without external requests. Optional `socialImage` should be a publicly served image URL. App links are `homeUrl`, `appUrl`, `signupUrl`, optional `pricingUrl`, `ctaLabel`, and `ctaDescription`. These must be site-relative paths or HTTP(S) URLs. Set `author` for the default byline. Listings use `pageSize` (1–50, default 10).

To embed in another application, keep a pinned copy of this engine, point it at that app's root `blogposts/`, build the app first, then the blog into `app-dist/blog/`, and serve `/blog/` before any app fallback. The app should link to the blog with ordinary anchors, never import the engine or a content manifest. More articles increase build time and deployment size, not app startup downloads. No article prefetching is enabled.

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

Copy **this directory's source** to a clean checkout (exclude `node_modules/`, `.astro/`, and `dist/`). Its `bun.lock` is independent of the parent app's workspace lock. Run the standalone checks above before publishing. `.github/workflows/ci.yml` becomes active only when this directory is the repository root.

Keep app-specific branding and articles in consuming applications; the example configuration/content here is intentionally generic. Record the engine commit or release used by each app. This version is `0.1.0`. Update vendored copies deliberately from a reviewed upstream release/commit rather than downloading an unpinned branch during deployment. No GitHub credentials or remote are needed to build or deploy a local copy.

Repository creation, visibility, license, and publishing are owner decisions; this template does not create a remote or deploy automatically.
