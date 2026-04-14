import type { Work } from '../data';

export function scoreWorkMatch(w: Work, lowerQuery: string): number {
  if (!lowerQuery) return 0;
  let s = 0;
  const t = w.title.toLowerCase();
  if (t.includes(lowerQuery)) s += 10;
  if (t.startsWith(lowerQuery)) s += 6;
  const an = w.artist.name.toLowerCase();
  if (an.includes(lowerQuery)) s += 8;
  if (an.startsWith(lowerQuery)) s += 4;
  const en = w.exhibitionName?.toLowerCase();
  if (en && en.includes(lowerQuery)) s += 8;
  if (en && en.startsWith(lowerQuery)) s += 4;
  const gn = w.groupName?.toLowerCase();
  if (gn && gn.includes(lowerQuery)) s += 7;
  if (w.description?.toLowerCase().includes(lowerQuery)) s += 3;
  if (w.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))) s += 4;
  return s;
}

export function rankWorksBySearchQuery(works: Work[], query: string): Work[] {
  const lower = query.trim().toLowerCase();
  if (!lower) return works;
  return [...works]
    .map((w) => ({ w, s: scoreWorkMatch(w, lower) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.w);
}
