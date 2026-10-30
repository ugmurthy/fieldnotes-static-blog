import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import { mkdir, copyFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { settings, contentDir, outDir, href, validateSlug } from './src/settings';
import remarkLinks from './src/remark-links';

export default defineConfig({
  site: settings.site,
  base: settings.base,
  outDir,
  trailingSlash: 'always',
  output: 'static',
  markdown: { processor: unified({ remarkPlugins: [remarkLinks] }) },
  redirects: Object.fromEntries(Object.entries(settings.redirects).map(([from, to]) => [
    `/${validateSlug(from)}`, href(`${validateSlug(to)}/`)
  ])),
  integrations: [{
    name: 'article-media',
    hooks: {
      'astro:build:done': async () => {
        async function copyMedia(directory: string) {
          for (const entry of await readdir(directory, { withFileTypes: true })) {
            const source = join(directory, entry.name);
            if (entry.isDirectory()) await copyMedia(source);
            else if (entry.isFile() && /\.(png|jpe?g|webp|gif|avif|svg|mp4|webm|pdf)$/i.test(entry.name)) {
              const destination = join(outDir, '_media', relative(contentDir, source));
              await mkdir(join(destination, '..'), { recursive: true });
              await copyFile(source, destination);
            }
          }
        }
        await copyMedia(contentDir);
      }
    }
  }]
});
