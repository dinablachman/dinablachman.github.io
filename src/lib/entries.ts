import { getCollection, type CollectionEntry } from 'astro:content';

export type ListEntry = {
  /** `blog:<id>` or `project:<id>`; used to mark the open row */
  key: string;
  href: string;
  title: string;
  date: Date;
  soon: boolean;
};

export type ListGroup = { head: string; items: ListEntry[] };

/** The two groups shown in the blog's list box: essays, then project write-ups. */
export async function listGroups(): Promise<ListGroup[]> {
  const posts = (await getCollection('blog')).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  const projects = (await getCollection('projects'))
    .filter((p) => p.data.detail)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  return [
    {
      head: 'Essays',
      items: posts.map((p) => ({
        key: `blog:${p.id}`,
        href: `/blog/${p.id}`,
        title: p.data.title,
        date: p.data.date,
        soon: p.data.coming_soon,
      })),
    },
    {
      head: 'Project write-ups',
      items: projects.map((p) => ({
        key: `project:${p.id}`,
        href: `/projects/${p.id}`,
        title: p.data.title.toLowerCase(),
        date: p.data.date,
        soon: false,
      })),
    },
  ];
}

/** Post opened by default on /blog: the newest published one; while everything is a draft, the longest. */
export function defaultPost(posts: CollectionEntry<'blog'>[]): CollectionEntry<'blog'> | undefined {
  const sorted = [...posts].sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  const published = sorted.find((p) => !p.data.coming_soon && p.body?.trim());
  if (published) return published;
  return [...sorted].sort((a, b) => (b.body?.length ?? 0) - (a.body?.length ?? 0))[0];
}

/** "4/18/25" */
export function fmtShort(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(2)}`;
}

/** "April 18, 2025" */
export function fmtLong(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
