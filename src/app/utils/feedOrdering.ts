import type { Work } from '../data';
import { curationStore } from './curationStore';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export type FeedRankContext = {
  /** 현재 로그인 유저가 팔로우 중인 작가 ID 집합 (팔로우 신호 가중치용) */
  followingArtistIds?: Set<string>;
};

/**
 * 작품 점수.
 * 명세: 좋아요·저장·**팔로우** 신호 가중치.
 * 댓글은 Phase 2 Out of Scope이라 비활성.
 */
function scoreWork(w: Work, ctx: FeedRankContext): number {
  const base = (w.likes ?? 0) * 2 + (w.saves ?? 0) * 3;
  const follow = ctx.followingArtistIds?.has(w.artistId) ? 8 : 0;
  return base + follow;
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

/** 같은 버킷 안에서: 미시청 우선, 이어서 시청됨. 약한 가중 랜덤(좋아요·저장·팔로우 반영). */
function orderBucket(list: Work[], seenIds: Set<string>, ctx: FeedRankContext): Work[] {
  const unseen = list.filter((w) => !seenIds.has(w.id));
  const seen = list.filter((w) => seenIds.has(w.id));
  const rank = (arr: Work[]) => {
    const noised = shuffle(arr).map((w) => ({
      w,
      score: scoreWork(w, ctx) + (Math.random() - 0.5) * 8,
    }));
    noised.sort((a, b) => b.score - a.score);
    return noised.map((n) => n.w);
  };
  return [...rank(unseen), ...rank(seen)];
}

/**
 * 피드 노출 순서 (명세: 콘텐츠 운영 정책 § 피드 노출 구조).
 *
 *   Artier's Pick  →  이번 주 테마전  →  추천 작가  →  신규(14일)  →  일반
 *
 * 각 작품은 **하나의 버킷에만** 배정 (중복 제거). 버킷 내부는 가중 랜덤.
 * 이미 본 작품은 각 버킷 내 뒤쪽으로.
 */
export function orderWorksForBrowseFeed(
  works: Work[],
  seenIds: Set<string>,
  ctx: FeedRankContext = {},
): Work[] {
  const theme = curationStore.getTheme();
  const themeWorkIdSet = new Set(theme?.workIds ?? []);
  const featuredArtistIdSet = new Set(curationStore.getFeaturedArtistIds());

  const used = new Set<string>();
  const assign = (pool: Work[], predicate: (w: Work) => boolean): Work[] => {
    const picked: Work[] = [];
    for (const w of pool) {
      if (used.has(w.id)) continue;
      if (!predicate(w)) continue;
      used.add(w.id);
      picked.push(w);
    }
    return picked;
  };

  const picks = assign(works, isPickWork);
  const themed = assign(works, (w) => themeWorkIdSet.has(w.id));
  const featured = assign(works, (w) => featuredArtistIdSet.has(w.artistId));
  const recent = assign(works, isRecentUpload);
  const rest = assign(works, () => true);

  return [
    ...orderBucket(picks, seenIds, ctx),
    ...orderBucket(themed, seenIds, ctx),
    ...orderBucket(featured, seenIds, ctx),
    ...orderBucket(recent, seenIds, ctx),
    ...orderBucket(rest, seenIds, ctx),
  ];
}
