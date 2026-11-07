# Changelog

`package.json` is the source of truth for the engine version. A version entry here does not imply a published release or Git tag. No release tags exist currently; pin a reviewed full 40-character commit SHA until releases are tagged.

## Unreleased

- Dependency-free metadata search (titles, descriptions, and optional frontmatter keywords; no article bodies in the JSON index). Only the Search page loads search JavaScript, and the index is fetched on demand.
- Static topic directory and paginated cross-category topic pages, article topic links, and topic sitemap entries. Reading and topic/category browsing still work without JavaScript. Keywords are normalized/deduplicated and ambiguous topic slugs fail the build. New reserved top-level article paths: `search`, `topics`, and `topic`; move existing content using those paths before upgrading.
- Standalone deployment configuration for GitHub Pages (opt-in workflow), Netlify, and Vercel, without server adapters or SPA fallbacks.
- Template-based setup for a `/blog` project site, source/content ownership, and pinned three-way engine upgrades that preserve personal content and configuration.
- Optional workspace links and article signup calls to action. Existing app configurations retain their behavior; omit `appUrl` and `signupUrl` for a standalone blog. Omitted `homeUrl` links to the blog index, `ctaLabel` defaults to "Get started", and `ctaDescription` is optional.
- Validated `BLOG_SITE` and `BLOG_BASE` environment overrides for deployment URLs. GitHub Pages derives these from its configured site; other hosts can supply them explicitly. Host-specific deployment files remain excluded from vendored engines.

## 0.1.0 — Initial release (not yet published)

- Astro/TypeScript static blog engine with app-owned Markdown content, nested categories, pagination, relative links/media, metadata, drafts, and HTML redirects.
- Configurable branding, production origin, base path, app links, content directory, and dedicated build output.
- MIT licensing and an agent-friendly, pinned vendoring workflow with the `integrating-blogsite` skill, explicit revision review, integrity status, and staged engine updates.
- Complete-directory skill installation from a reviewed pinned checkout, resource-verification guidance for Amp imports, and vendored engine self-tests (`tests/site.test.mjs`).

Initial integration requires host-specific dependency bootstrap, build ordering, and static/404 routing. Review future configuration/content migrations manually; vendoring does not apply migrations or deploy.
