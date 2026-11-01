# Changelog

`package.json` is the source of truth for the engine version. A version entry here does not imply a published release or Git tag. No release tags exist currently; pin a reviewed full 40-character commit SHA until releases are tagged.

## 0.1.0 — Initial release (not yet published)

- Astro/TypeScript static blog engine with app-owned Markdown content, nested categories, pagination, relative links/media, metadata, drafts, and HTML redirects.
- Configurable branding, production origin, base path, app links, content directory, and dedicated build output.
- MIT licensing and an agent-friendly, pinned vendoring workflow with the `integrating-blogsite` skill, explicit revision review, integrity status, and staged engine updates.
- Complete-directory skill installation from a reviewed pinned checkout, resource-verification guidance for Amp imports, and vendored engine self-tests (`tests/site.test.mjs`).

Initial integration requires host-specific dependency bootstrap, build ordering, and static/404 routing. Review future configuration/content migrations manually; vendoring does not apply migrations or deploy.
