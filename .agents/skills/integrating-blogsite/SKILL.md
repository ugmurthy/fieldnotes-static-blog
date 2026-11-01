---
name: integrating-blogsite
description: Vendors, integrates, and upgrades the Fieldnotes static blog in an existing application. Use when adding app-owned Markdown articles, configuring blog builds and routing, or updating a pinned Fieldnotes engine.
license: MIT
compatibility: Requires Git, Node 24, and Bun 1.3.10 for engine dependencies and builds. The bundled vendoring script uses Node built-ins only.
---

# Integrating Fieldnotes

Keep the engine in `vendor/fieldnotes`, and keep configuration and articles owned by the host app. Use the bundled `scripts/vendor.mjs`; do not implement a second downloader or copy the upstream repository wholesale.

## Inspect before changing anything

1. Read the host's guidance, build commands, package-manager/workspace configuration, routing, deployment output, and existing CI/orb setup. Preserve existing app routes and pending work.
2. Identify the existing app root, content/configuration, intended public base (default `/blog`), and a **blog-only** output directory. Astro clears `outDir`: never use the app root, content, all of `public`, or the host's whole output directory. Keep the engine's default `.fieldnotes-dist` at the app root until output ownership is agreed.
3. Inspect upstream tags/releases and choose a suitable reviewed revision; use a full 40-character commit SHA when no suitable release tag exists. Resolve any selected tag to its immutable commit. `package.json` is the engine version source of truth, not evidence of a published release. Review the changelog and migrations manually.

## Install

This public repository ships the skill at `.agents/skills/integrating-blogsite`. Prefer copying its **complete directory from a reviewed pinned Git checkout** into the host's root `.agents/skills/`, so instructions, script, and reference are reviewed together. Run from the **host project root**, replacing the placeholder with the reviewed skill commit (which is separate from the engine ref):

```sh
(
  set -eu
  SKILL_REF='<reviewed-full-40-character-commit-SHA>'
  case "$SKILL_REF" in *[!0-9a-f]*|'') echo 'Use a full lowercase commit SHA' >&2; exit 1;; esac
  test "${#SKILL_REF}" -eq 40
  skill_root="$PWD/.agents/skills"
  dest="$skill_root/integrating-blogsite"
  if [ -e "$dest" ] || [ -L "$dest" ]; then
    echo 'Skill destination already exists; protect and review it before replacement' >&2
    exit 1
  fi
  tmp="$(mktemp -d)"
  trap 'rm -rf -- "$tmp"' EXIT
  git clone --quiet --no-checkout https://github.com/ugmurthy/fieldnotes-static-blog.git "$tmp/upstream"
  git -C "$tmp/upstream" checkout --quiet --detach "$SKILL_REF"
  source="$tmp/upstream/.agents/skills/integrating-blogsite"
  test -f "$source/SKILL.md"
  test -f "$source/scripts/vendor.mjs"
  test -f "$source/reference/integration.md"
  test -f "$source/LICENSE"
  mkdir -p "$skill_root"
  cp -R "$source" "$dest"
)
```

This copies reviewed files, without executing downloaded code. Retain the skill's bundled `LICENSE` when redistributing it. For an optional manual global installation, change `skill_root` to `"$HOME/.config/agents/skills"`; copy the same complete directory and resolve script paths relative to that location. Project-local installation is recommended.

Convenient alternative: `amp skill add ugmurthy/fieldnotes-static-blog/.agents/skills/integrating-blogsite` (optionally `--global`). **Verify both `scripts/vendor.mjs` and `reference/integration.md` afterward.** Some Amp CLI versions copy only `SKILL.md` even when reporting success; do not assume the GitHub importer transfers assets either.

**If this skill is loaded without its bundled resources:** stop before invoking the vendor script. Fetch the reviewed pinned checkout using the clone/checkout steps above; do not rely on the unavailable reference for bootstrap. Compare its `SKILL.md` with the installed copy and protect local edits. After verifying provenance/compatibility and all four source files, copy the missing `scripts/`, `reference/`, and `LICENSE` from that checkout, preserving the directory layout and refusing to overwrite existing local files without review. For a mixed or stale installation, use the whole-directory replacement procedure below instead. Verify both resources before continuing; never substitute a new downloader or execute a network response.

Once the skill and bundled script are available, run from the host project root (replace the placeholder with the reviewed SHA):

```sh
REF='<full-40-character-commit-SHA>'
node .agents/skills/integrating-blogsite/scripts/vendor.mjs install --app "$PWD" --ref "$REF" --dry-run
node .agents/skills/integrating-blogsite/scripts/vendor.mjs install --app "$PWD" --ref "$REF"
node .agents/skills/integrating-blogsite/scripts/vendor.mjs status --app "$PWD"
```

The dependency-free Node script has this interface:

```text
node <skill-directory>/scripts/vendor.mjs install|update|status
  [--app <existing-app-root>]
  [--ref <full-40-character-commit-SHA-or-vSemVer-tag>]
  [--source <HTTPS-Git-URL-or-local-Git-repository>]
  [--dry-run]
```

- `--app` defaults to the current directory; it must already exist. `install` and `update` require explicit `--ref`; never use a branch, short SHA, or implicit latest.
- Install defaults to `https://github.com/ugmurthy/fieldnotes-static-blog.git`; use `--source` for an explicitly reviewed HTTPS source or local Git repository. Update uses the stored source; changing it is disallowed.
- Installation copies only allowlisted engine files to fixed `vendor/fieldnotes`, retaining `LICENSE`. App-root `fieldnotes.lock.json` records source, immutable resolved commit, requested ref, version, and SHA256 hashes of managed files. Commit the engine and lockfile together after review.
- Installation creates `blog.config.json` when absent, even if `blogposts/` already exists; existing articles remain untouched. It seeds `blogposts/getting-started/welcome.md` only when creating config **and** `blogposts/` is absent. Config defaults are `base: "/blog"` and app-root `.fieldnotes-dist` output. Existing config is preserved; complete any missing pieces manually.
- The script never installs dependencies or changes host package scripts, routing, or gitignore. There is no force option, automatic migration, push, or deployment.

## Integrate and verify

Read [reference/integration.md](reference/integration.md) for concrete build-order, routing, dependency-isolation, and validation examples.

1. Customize the app-owned `blog.config.json`: production origin, non-root base, app links, content directory, and safe output. Use supported branding fields (`accent`, `logo`, `fontUi`, `fontDisplay`, `fontStylesheet`); there is no arbitrary CSS override hook. Do not patch managed engine CSS.
2. Bootstrap **separate engine dependencies** with Node 24 and Bun 1.3.10. Inspect workspace matching first: `bun install --cwd` alone does not guarantee isolation. Do not merge engine dependencies into the host manifest/lockfile. Use the reference's detached-build approach if the host includes the vendor directory in its workspace.
3. Use an **absolute `BLOG_CONFIG`** for every engine check/build. For a host that copies `public/`, build blog-only `public/blog` **before** the host build. For a host accepting final static files, build host first, then blog-only `<host-output>/blog`. Alternatively build `.fieldnotes-dist` and copy its contents into the blog mount at the appropriate phase.
4. Add approved build steps and dependency bootstrap to the host's existing CI/orb setup. Do not copy upstream `.agents/setup`, `.agents/resume`, or `.github/workflows/` into the host. Decide generated-file ignores explicitly with the host owner.
5. Serve blog files and blog-specific HTTP 404s **before** any SPA fallback; do not send `/blog/missing/` to the app shell. Link from the app with ordinary anchors; do not import engine code or article manifests into the app bundle.
6. Run the vendored engine's `bun test` self-tests (`tests/site.test.mjs`), then build the actual host and check its served blog index, a nested article, media, categories/pagination, discovery URLs, unknown blog path (HTTP 404), and existing app routes. Engine self-tests/checks or filesystem output alone do not prove host routing. Add route/build regression tests as appropriate; screenshots/visual checks are needed only when visual integration is being changed. Do not deploy automatically.

## Upgrade and recover

```sh
node .agents/skills/integrating-blogsite/scripts/vendor.mjs status --app "$PWD"
NEXT_REF='<reviewed-full-40-character-commit-SHA>'
node .agents/skills/integrating-blogsite/scripts/vendor.mjs update --app "$PWD" --ref "$NEXT_REF" --dry-run
node .agents/skills/integrating-blogsite/scripts/vendor.mjs update --app "$PWD" --ref "$NEXT_REF"
```

- `status` accepts only `--app` and is local-only, with no network; it exits 1 for modified/missing managed engine files or untracked extra engine files. Generated `node_modules`, `.astro`, and `dist` directories are ignored.
- `update --dry-run` fetches and previews the target, but does not change host files. Review upstream changes, licensing, and required config/content migrations before applying them manually.
- Update stages engine replacement, refuses managed-file drift and unexpected extra files, and preserves app configuration/articles. It clears disposable vendor dependency/build caches, so reinstall locked engine dependencies afterward. Do not store app assets or unique work in those caches.
- If old-cache cleanup fails **after the new engine and lockfile are installed**, the operation succeeds with a stderr cleanup warning and retained staging path. Verify local `status`, inspect the reported leftover cache, and remove only that disposable path when safe; do not retry/roll back a successful update just for this warning.
- On drift, report it and stop. Save/review local changes; do not delete them or bypass integrity checks. On upgrade failure, restore `vendor/fieldnotes` **and** `fieldnotes.lock.json` together from a known-good host Git revision after protecting pending work. Revert any associated manual migration coherently, reinstall dependencies, and rebuild/verify host routes. Never reset unrelated app work, autopush, or deploy as part of rollback.

### Upgrade the installed skill separately

Engine `update` does not update this skill or its bundled script. Fetch a reviewed new pinned skill checkout and validate all four files as above. Inspect/compare the **whole installed directory**, protect local changes in Git or a backup outside the destination, then intentionally move the old directory aside and copy the complete new directory into the now-absent destination. Do not merge new files into stale resources or silently follow a destination symlink. Verify the resulting script/reference, review the diff, and reload skills only after the replacement is complete. This does not itself upgrade the pinned engine.

`amp skill add ugmurthy/fieldnotes-static-blog/.agents/skills/integrating-blogsite --overwrite` is an optional convenience after the same local-change review (`--global` for a global install), **not** a guarantee that resources were updated. Verify both resources against the reviewed checkout and use whole-directory replacement if incomplete or stale.
