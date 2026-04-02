import type { Work } from '../data';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function scoreWork(w: Work): number {
  return (w.likes ?? 0) * 2 + (w.saves ?? 0) * 3 + (w.comments ?? 0);
}

function isPickWork(w: Work): boolean {
  return !!(w.pick || w.editorsPick);
}

function isRecentUpload(w: Work): boolean {
  if (!w.uploadedAt) return false;
  const t = new Date(w.uploadedAt).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < 14 * 86400000;
}

/** 같은 버킷 안에서: 미시청 우선, 이어서 시청됨. 약한 가중 랜덤(좋아요·저장 반영). */
function orderBucket(list: Work[], seenIds: Set<string>): Work[] {
  const unseen = list.filter((w) => !seenIds.has(w.id));
  const seen = list.filter((w) => seenIds.has(w.id));
  const rank = (arr: Work[]) =>
    shuffle(arr).sort((a, b) => scoreWork(b) - scoreWork(a) + (Math.random() - 0.5) * 8);
  return [...rank(unseen), ...rank(seen)];
}

/**
 * PRD 피드 노출 순서 근사: Pick → 신규(14일 이내 업로드) → 일반(가중 랜덤) — 이미 연 작품은 버킷 내 뒤쪽.
 */
export function orderWorksForBrowseFeed(works: Work[], seenIds: Set<string>): Work[] {
  const picks = works.filter(isPickWork);
  const nonPick = works.filter((w) => !isPickWork(w));
  const recent = nonPick.filter(isRecentUpload);
  const rest = nonPick.filter((w) => !isRecentUpload(w));
  return [...orderBucket(picks, seenIds), ...orderBucket(recent, seenIds), ...orderBucket(rest, seenIds)];
}
