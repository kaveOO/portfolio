import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// One Markdown file per note in src/content/notes/. The file name is the URL: notes/<file-name>/.
const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tag: z.string(),
    // Shown under the title on the note page, and used as the page description.
    description: z.string().optional(),
    // Minutes; worked out from the word count when left out.
    readingTime: z.number().int().positive().optional(),
    // Drafts show up in `npm run dev` but are left out of the built site.
    draft: z.boolean().default(false),
  }),
});

// One Markdown file per project case study in src/content/projects/. URL: work/<file-name>/.
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    // Position among the case studies (1 = first); also sets the "01 / 03" counter and "Next project".
    order: z.number(),
    // One or two sentences under the title; also the page description.
    summary: z.string(),
    year: z.coerce.string(),
    context: z.string().optional(),
    role: z.string().optional(),
    tags: z.array(z.string()),
    // Paths are relative to public/, e.g. images/foo.webp. `avif` is an optional sharper version.
    cover: z.object({
      src: z.string(),
      avif: z.string().optional(),
      alt: z.string(),
      width: z.number(),
      height: z.number(),
    }).optional(),
    // YouTube video id, embedded as a "Demo" section.
    video: z.string().optional(),
    links: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
    // Big-number results row; leave empty rather than invent numbers.
    results: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { notes, projects };
