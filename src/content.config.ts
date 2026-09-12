import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const stringList = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((v) => {
    if (!v) return [] as string[];
    if (Array.isArray(v)) return v;
    return v
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  });

const optionalUrl = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => (v && v.trim() ? v.trim() : undefined));

/** Blog posts: drop a markdown file in src/content/blog/ */
const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    categories: stringList,
    coming_soon: z.boolean().default(false),
    preview: z.string().optional().default(''),
  }),
});

/** Projects: each one also renders as a write-up at /projects/[slug] */
const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional().default(''),
    date: z.coerce.date(),
    detail: z.boolean().default(true),
    live_url: optionalUrl,
    repo_url: optionalUrl,
    stack: stringList,
    status: z.string().optional(),
    role: z.string().optional(),
    tags: stringList,
    thumb: optionalUrl,
    poster: optionalUrl,
    gif: optionalUrl,
    /** short description used in the /now pane, list rows, etc. */
    blurb: z.string().optional(),
  }),
});

export const collections = { blog, projects };
