import { existsSync } from 'node:fs';
import { join } from 'node:path';

/** returns the path only if the file exists under /public (build-time check) */
export function publicFile(p?: string): string | undefined {
  if (!p) return undefined;
  return existsSync(join(process.cwd(), 'public', p)) ? p : undefined;
}

/** rough read time from raw markdown */
export function readingTime(body: string | undefined): number {
  if (!body) return 1;
  const words = body
    .replace(/<[^>]+>/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
