import { getCollection, type CollectionEntry } from 'astro:content';
import { url } from './paths';

export type Note = CollectionEntry<'notes'>;

/** Published notes, newest first. Drafts are included in dev only. */
export async function getNotes(): Promise<Note[]> {
  const notes = await getCollection('notes', ({ data }) => import.meta.env.DEV || !data.draft);
  return notes.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export const noteUrl = (note: Note) => url(`/notes/${note.id}/`);

// Fixed English month names ("Sep", not the locale-dependent "Sept").
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const monthYear = (d: Date) => `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
export const fullDate = (d: Date) => `${d.getUTCDate()} ${monthYear(d)}`;

export function readingMinutes(note: Note): number {
  if (note.data.readingTime) return note.data.readingTime;
  const words = (note.body ?? '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Up to `count` other notes: same tag first, then the most recent. */
export function relatedNotes(note: Note, all: Note[], count = 2): Note[] {
  const others = all.filter((n) => n.id !== note.id);
  const sameTag = others.filter((n) => n.data.tag === note.data.tag);
  return [...sameTag, ...others.filter((n) => n.data.tag !== note.data.tag)].slice(0, count);
}

/** Tags in use, most used first. */
export function topics(all: Note[]): string[] {
  const counts = new Map<string, number>();
  for (const n of all) counts.set(n.data.tag, (counts.get(n.data.tag) ?? 0) + 1);
  return [...counts.keys()].sort((a, b) => counts.get(b)! - counts.get(a)! || a.localeCompare(b));
}
