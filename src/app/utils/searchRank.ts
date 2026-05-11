import type { Work } from '../data';

export type SearchResults = {
  /** 4개 필드 union, 중복 제거, uploadedAt 최신순 */
  all: Work[];
  byArtist: Work[];
  byGroup: Work[];
  byExhibition: Work[];
  byPiece: Work[];
};

export function searchWorks(pool: Work[], query: string): SearchResults {
  const lower = query.trim().toLowerCase();
  const empty: SearchResults = { all: [], byArtist: [], byGroup: [], byExhibition: [], byPiece: [] };
  if (!lower) return empty;

  const byArtist = pool.filter((w) => w.artist?.name?.toLowerCase().includes(lower));
  const byGroup = pool.filter((w) => w.groupName?.toLowerCase().includes(lower));
  const byExhibition = pool.filter((w) =>
    (w.exhibitionName?.toLowerCase().includes(lower)) ||
    (w.title?.toLowerCase().includes(lower))
  );
  const byPiece = pool.filter((w) =>
    w.imagePieceTitles?.some((t) => t?.toLowerCase().includes(lower))
  );

  const seen = new Set<string>();
  const all = [...byArtist, ...byGroup, ...byExhibition, ...byPiece]
    .filter((w) => { if (seen.has(w.id)) return false; seen.add(w.id); return true; })
    .sort((a, b) => (b.uploadedAt ?? '').localeCompare(a.uploadedAt ?? ''));

  return { all, byArtist, byGroup, byExhibition, byPiece };
}
