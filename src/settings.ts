import { readFileSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { z } from 'astro/zod';

const link = z.string().refine((value) => /^\/(?!\/)|^https?:\/\//.test(value), 'Use a site-relative path or HTTP(S) URL');
const schema = z.object({
  name: z.string().min(1), title: z.string().min(1), description: z.string().min(1),
  site: z.url().refine((value) => /^https?:\/\//.test(value)),
  base: z.string().regex(/^\/$|^\/[a-z0-9-]+(?:\/[a-z0-9-]+)*\/?$/),
  contentDir: z.string().min(1), outDir: z.string().min(1),
  homeUrl: link, appUrl: link, signupUrl: link, pricingUrl: link.optional(),
  ctaLabel: z.string().min(1), ctaDescription: z.string().min(1),
  author: z.string().min(1), accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  socialImage: link.optional(), logo: link.optional(),
  fontUi: z.string().default('Inter, system-ui, sans-serif'),
  fontDisplay: z.string().default('Newsreader, Georgia, serif'),
  fontStylesheet: z.url().optional(),
  pageSize: z.number().int().min(1).max(50).default(10),
  redirects: z.record(z.string(), z.string()).default({})
}).strict();

const filename = resolve(process.env.BLOG_CONFIG ?? 'site.config.json');
export const settings = schema.parse(JSON.parse(readFileSync(filename, 'utf8')));
export const contentDir = resolve(dirname(filename), settings.contentDir);
export const outDir = resolve(dirname(filename), settings.outDir);
if (contentDir === outDir || contentDir.startsWith(outDir + sep) || outDir.startsWith(contentDir + sep)) {
  throw new Error('Blog output and content directories must not overlap.');
}
export const base = settings.base.replace(/\/$/, '');
export const href = (path = '') => `${base}/${path.replace(/^\//, '')}`;
export const absolute = (path: string) => new URL(path, settings.site).href;
export function validateSlug(slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/.test(slug)
    || /^(category|page|_astro|_media)(\/|$)/.test(slug) || slug === '404') {
    throw new Error(`Use lowercase kebab-case article/category paths, excluding reserved routes: ${slug}`);
  }
  return slug;
}
