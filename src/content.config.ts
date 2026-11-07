import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { contentDir, validateSlug } from './settings';
import { topicSlug } from './topics';

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}, 'Use a valid YYYY-MM-DD date, in quotes');
export const collections = {
  posts: defineCollection({
    loader: glob({ base: contentDir, pattern: '**/*.md', generateId: ({ entry }) => validateSlug(entry.slice(0, -3)) }),
    schema: z.object({
      title: z.string().min(1), description: z.string().min(1), published: date,
      updated: date.optional(), author: z.string().min(1).optional(),
      keywords: z.array(z.string().transform((value) => value.normalize('NFC').trim().toLowerCase().replace(/\s+/g, ' '))
        .refine((value) => !!topicSlug(value), 'Keywords must contain letters or numbers'))
        .default([]).transform((values) => [...new Set(values)]),
      featured: z.boolean().default(false), draft: z.boolean().default(false)
    }).refine((post) => !post.updated || post.updated >= post.published, 'Updated date cannot precede publication')
  })
};
