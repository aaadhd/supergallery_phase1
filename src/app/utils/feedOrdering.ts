import type { Work } from '../data';
import { featuredStore } from './featuredStore';
import { isWorkVisibleOnPublicFeed } from './feedVisibility';

export type FeedRankContext = {
  /** 현재 로그인 유저가 팔로우 중인 작가 ID 집합 (팔로우 버킷 배정용) */
  followingArtistIds?: Set<string>;
};

type FeedSource = 'pick' | 'featured' | 'personalized' | 'recent' | 'rest';

function isPickWork(w: Work): boolean {
  // 주간 Pick 버킷은 "현재 활성 Pick"만 사용한다.
  // pickBadge은 이력 배지(영구 표시) 용도라 버킷 진입 조건에서 제외.
  return w.pick === true;
}

function isRecentUpload(w: Work): boolean {
  if (!w.uploadedAt) return false;
  const t = new Date(w.uploadedAt).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < 14 * 86400000;
}

/** 버킷 내부 랜덤 셔플. 이미 본 작품은 뒤로. */
function shufflePool(items: Work[], seenIds: Set<string>): Work[] {
  const unseen = [...items].filter((w) => !seenIds.has(w.id)).sort(() => Math.random() - 0.5);
  const seen = [...items].filter((w) => seenIds.has(w.id)).sort(() => Math.random() - 0.5);
  return [...unseen, ...seen];
}

/**
 * 소스별 리스트를 패턴 기반으로 섞어 "화이트리스트만 연속 노출"을 줄인다.
 * 비어 있는 소스는 건너뛰고, 패턴을 한 바퀴 돌며 하나씩 뽑는다.
 */
function interleaveByPattern(
  pools: Record<FeedSource, Work[]>,
): Work[] {
  const pattern: FeedSource[] = [
    'pick',
    'rest',
    'personalized',
    'rest',
    'featured',
    'rest',
    'recent',
    'rest',
  ];
  const cursors: Record<FeedSource, number> = {
    pick: 0,
    featured: 0,
    personalized: 0,
    recent: 0,
    rest: 0,
  };
  const total =
    pools.pick.length +
    pools.featured.length +
    pools.personalized.length +
    pools.recent.length +
    pools.rest.length;

  const out: Work[] = [];
  let stallCount = 0;
  while (out.length < total && stallCount < pattern.length * 2) {
    let progressed = false;
    for (const source of pattern) {
      const idx = cursors[source];
      const next = pools[source][idx];
      if (!next) continue;
      out.push(next);
      cursors[source] = idx + 1;
      progressed = true;
      if (out.length >= total) break;
    }
    stallCount = progressed ? 0 : stallCount + 1;
    if (!progressed) break;
  }
  return out;
}

/**
 * 같은 작가 연속 노출 방지 (Policy §16.1 다양성 룰).
 * 인터리빙 결과를 순회하며 직전 작품과 artistId가 같으면 다음 다른 작가 작품과 교체.
 * 남은 작품이 모두 같은 작가인 경우 예외 허용.
 */
function diversifyFeed(works: Work[]): Work[] {
  if (works.length <= 1) return works;
  const result: Work[] = [];
  const pool = [...works];
  while (pool.length > 0) {
    const lastArtistId = result.at(-1)?.artistId;
    const nextIdx = pool.findIndex((w) => w.artistId !== lastArtistId);
    if (nextIdx === -1) {
      result.push(...pool.splice(0));
    } else {
      result.push(...pool.splice(nextIdx, 1));
    }
  }
  return result;
}

/**
 * 피드 노출 순서 (Policy §15.1·§16.1 — 일반 피드는 전시 단위 카드).
 *
 *   Proud's Pick  →  팔로잉  →  추천 전시  →  신규(14일)  →  일반
 *
 * 각 작품은 하나의 버킷에만 배정 (중복 제거). 버킷 내부는 랜덤 셔플.
 * 이미 본 작품은 각 버킷 내 뒤쪽으로. 인터리빙 후 같은 작가 연속 노출 방지.
 *
 * 기획전은 §15.1 노출 표면상 USR-CUR-01 페이지 전용 (일반 피드 부스트 없음).
 * 응모전 응모작(linkedEventId != null)은 피드에서 완전 제외 (Policy §15.5).
 */
export function orderWorksForBrowseFeed(
  works: Work[],
  seenIds: Set<string>,
  ctx: FeedRankContext = {},
): Work[] {
  const randomizedWorks = [...works].filter(isWorkVisibleOnPublicFeed).sort(() => Math.random() - 0.5);
  const featuredExhibitionIdSet = new Set(featuredStore.getAll());

  const used = new Set<string>();
  const artistCount = new Map<string, number>();
  const MAX_PER_ARTIST = 3; // 피드 내 작가당 최대 노출 수
  const assign = (pool: Work[], predicate: (w: Work) => boolean, limit?: number): Work[] => {
    const picked: Work[] = [];
    for (const w of pool) {
      if (typeof limit === 'number' && picked.length >= limit) break;
      if (used.has(w.id) || !predicate(w)) continue;
      if ((artistCount.get(w.artistId) ?? 0) >= MAX_PER_ARTIST) continue;
      used.add(w.id);
      artistCount.set(w.artistId, (artistCount.get(w.artistId) ?? 0) + 1);
      picked.push(w);
    }
    return picked;
  };

  const picks = assign(randomizedWorks, isPickWork);
  const featured = assign(randomizedWorks, (w) => featuredExhibitionIdSet.has(w.id));
  const personalized = assign(randomizedWorks, (w) => Boolean(ctx.followingArtistIds?.has(w.artistId)));
  const recent = assign(randomizedWorks, isRecentUpload);
  const rest = assign(randomizedWorks, () => true);

  const pools: Record<FeedSource, Work[]> = {
    pick: shufflePool(picks, seenIds),
    featured: shufflePool(featured, seenIds),
    personalized: shufflePool(personalized, seenIds),
    recent: shufflePool(recent, seenIds),
    rest: shufflePool(rest, seenIds),
  };

  return diversifyFeed(interleaveByPattern(pools));
}
