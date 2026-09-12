import { existsSync } from 'node:fs';
import { join } from 'node:path';

/** returns the path only if the file exists under /public (build-time check) */
export function publicFile(p?: string): string | undefined {
  if (!p) return undefined;
  return existsSync(join(process.cwd(), 'public', p)) ? p : undefined;
}

/** 2025.09.17 */
export function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

/** "sep 2026" */
export function fmtMonth(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toLowerCase();
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

/** first paragraph of markdown body, before <!--more--> if present */
export function excerpt(body: string | undefined, max = 180): string {
  if (!body) return '';
  const cut = body.split('<!--more-->')[0];
  const para = cut
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .find((p) => p && !p.startsWith('#') && !p.startsWith('<') && !p.startsWith('*note'));
  if (!para) return '';
  const plain = para
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ');
  return plain.length > max ? plain.slice(0, max).replace(/\s+\S*$/, '') + '…' : plain;
}
