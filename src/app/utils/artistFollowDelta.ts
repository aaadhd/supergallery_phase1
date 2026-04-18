/** 로컬 데모: 팔로우/언팔로우 시 작가 팔로워 수에 반영되는 델타 (PRD 피드백 반영) */
const KEY = 'artier_artist_follower_delta';

function load(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as Record<string, number>;
    return p && typeof p === 'object' ? p : {};
  } catch {
    return {};
  }
}

function save(d: Record<string, number>) {
  localStorage.setItem(KEY, JSON.stringify(d));
}

export function adjustArtistFollowerDelta(artistId: string, delta: 1 | -1) {
  const d = load();
  d[artistId] = (d[artistId] ?? 0) + delta;
  save(d);
}

export function getArtistFollowerDelta(artistId: string): number {
  return load()[artistId] ?? 0;
}

export function getDisplayFollowerCount(artist: { id: string; followers?: number }): number {
  const base = artist.followers ?? 0;
  return Math.max(0, base + getArtistFollowerDelta(artist.id));
}

export function clearFollowerDeltas() {
  localStorage.removeItem(KEY);
}

export function removeArtistFollowerDelta(artistId: string) {
  const d = load();
  delete d[artistId];
  save(d);
}
