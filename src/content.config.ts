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

export const collections = { notes };
