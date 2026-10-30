import { getCollection, type CollectionEntry } from 'astro:content';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'astro/zod';
import { contentDir, settings, validateSlug } from './settings';

export type Post = CollectionEntry<'posts'>;
export interface Category { id: string; title: string; description: string; order: number; parent: string; }
const categorySchema = z.object({ title: z.string().min(1).optional(), description: z.string().optional(), order: z.number().optional() }).strict();
export async function catalog() {
  const posts = (await getCollection('posts', ({ data }) => !data.draft))
    .sort((a, b) => b.data.published.localeCompare(a.data.published) || a.id.localeCompare(b.id));
  // Astro logs Markdown rendering errors but still returns the entry; never publish it blank.
  for (const post of posts) {
    if (!post.rendered) throw new Error(`Article failed Markdown rendering: ${post.id}. See the rendering error above.`);
  }
  const categories = new Map<string, Category>();
  for (const post of posts) {
    const parts = post.id.split('/').slice(0, -1);
    parts.forEach((part, index) => {
      const id = parts.slice(0, index + 1).join('/');
      if (categories.has(id)) return;
      const file = join(contentDir, id, '_category.json');
      const data = categorySchema.parse(existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {});
      categories.set(id, { id, title: data.title ?? part.replace(/-/g, ' ').replace(/^./, (s) => s.toUpperCase()),
        description: data.description ?? '', order: data.order ?? 0, parent: parts.slice(0, index).join('/') });
    });
  }
  for (const [from, to] of Object.entries(settings.redirects)) {
    validateSlug(from); validateSlug(to);
    if (posts.some((post) => post.id === from) || !posts.some((post) => post.id === to)) {
      throw new Error(`Redirect must map an unused path to a published article: ${from} → ${to}`);
    }
  }
  return { posts, categories: [...categories.values()].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title)) };
}
export const categoryId = (post: Post) => post.id.split('/').slice(0, -1).join('/');
export const readingTime = (post: Post) => Math.max(1, Math.ceil((post.body ?? '').split(/\s+/).length / 200));
export const displayDate = (date: string) => new Intl.DateTimeFormat('en', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(date));
