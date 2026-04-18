import type { Work } from '../data';
import { curationStore } from './curationStore';

export type FeedRankContext = {
  /** 현재 로그인 유저가 팔로우 중인 작가 ID 집합 (팔로우 신호 가중치용) */
  followingArtistIds?: Set<string>;
};

type FeedSource = 'pick' | 'theme' | 'featured' | 'personalized' | 'recent' | 'rest';

/**
 * 작품 점수.
 * 명세: 좋아요·저장·**팔로우** 신호 가중치.
 * 댓글은 Phase 2 Out of Scope이라 비활성.
 */
function scoreWork(w: Work, ctx: FeedRankContext): number {
  // 절대 수치(좋아요/저장)가 큰 데이터에서 상단이 고정되지 않도록 로그 스케일 사용
  const likes = Math.log1p(Math.max(0, w.likes ?? 0));
  const saves = Math.log1p(Math.max(0, w.saves ?? 0));
  const base = likes * 2.2 + saves * 3.2;
  const follow = ctx.followingArtistIds?.has(w.artistId) ? 3.5 : 0;
  return base + follow;
}

function sourceBoost(source: FeedSource): number {
  switch (source) {
    case 'pick':
      return 14;
    case 'theme':
      return 8;
    case 'featured':
      return 6;
    case 'personalized':
      return 7;
    case 'recent':
      return 3;
    case 'rest':
    default:
      return 0;
  }
}

function randomNoise(source: FeedSource): number {
  // 새로고침마다 피드가 확실히 바뀌도록 랜덤 노이즈를 키운다.
  // 우선순위 소스일수록 노이즈 폭을 조금 줄여 운영 의도를 유지.
  const span =
    source === 'pick' ? 10 :
      source === 'theme' ? 12 :
        source === 'featured' ? 13 :
          source === 'recent' ? 15 : 20;
  return (Math.random() - 0.5) * span;
}

function isPickWork(w: Work): boolean {
  // 주간 Pick 버킷은 "현재 활성 Pick"만 사용한다.
  // editorsPick은 이력 배지(영구 표시) 용도라 버킷 진입 조건에서 제외.
  return w.pick === true;
}

function isRecentUpload(w: Work): boolean {
  if (!w.uploadedAt) return false;
  const t = new Date(w.uploadedAt).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < 14 * 86400000;
}

/** 같은 소스 안에서 점수 정렬 + 본 작품 하향 */
function rankSourcePool(
  items: Work[],
  source: FeedSource,
  seenIds: Set<string>,
  ctx: FeedRankContext,
): Work[] {
  const rank = (arr: Work[]) => {
    const scored = [...arr].map((work) => ({
      work,
      score: scoreWork(work, ctx) + sourceBoost(source) + randomNoise(source),
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.map((x) => x.work);
  };

  const unseen = items.filter((work) => !seenIds.has(work.id));
  const seen = items.filter((work) => seenIds.has(work.id));
  return [...rank(unseen), ...rank(seen)];
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
    'theme',
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
    theme: 0,
    featured: 0,
    personalized: 0,
    recent: 0,
    rest: 0,
  };
  const total =
    pools.pick.length +
    pools.theme.length +
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
 * 피드 노출 순서 (명세: 콘텐츠 운영 정책 § 피드 노출 구조).
 *
 *   Artier's Pick  →  기획전  →  추천 작가  →  신규(14일)  →  일반
 *
 * 각 작품은 **하나의 버킷에만** 배정 (중복 제거). 버킷 내부는 가중 랜덤.
 * 이미 본 작품은 각 버킷 내 뒤쪽으로.
 */
export function orderWorksForBrowseFeed(
  works: Work[],
  seenIds: Set<string>,
  ctx: FeedRankContext = {},
): Work[] {
  // 버킷 할당 전 순서를 섞어, 새로고침마다 동일한 작품만 앞에 고정되는 현상을 줄인다.
  const randomizedWorks = [...works].sort(() => Math.random() - 0.5);
  const theme = curationStore.getTheme();
  const themeWorkIdSet = new Set(theme?.workIds ?? []);
  const featuredArtistIdSet = new Set(curationStore.getFeaturedArtistIds());

  const used = new Set<string>();
  const assign = (pool: Work[], predicate: (w: Work) => boolean, source: FeedSource, limit?: number): Array<{ work: Work; source: FeedSource }> => {
    const picked: Array<{ work: Work; source: FeedSource }> = [];
    for (const w of pool) {
      if (typeof limit === 'number' && picked.length >= limit) break;
      if (used.has(w.id)) continue;
      if (!predicate(w)) continue;
      used.add(w.id);
      picked.push({ work: w, source });
    }
    return picked;
  };

  const picks = assign(randomizedWorks, isPickWork, 'pick', 10).map((x) => x.work);
  const themed = assign(randomizedWorks, (w) => themeWorkIdSet.has(w.id), 'theme').map((x) => x.work);
  const featured = assign(randomizedWorks, (w) => featuredArtistIdSet.has(w.artistId), 'featured').map((x) => x.work);
  const personalized = assign(
    randomizedWorks,
    (w) => Boolean(ctx.followingArtistIds?.has(w.artistId)),
    'personalized',
  ).map((x) => x.work);
  const recent = assign(randomizedWorks, isRecentUpload, 'recent').map((x) => x.work);
  const rest = assign(randomizedWorks, () => true, 'rest').map((x) => x.work);

  const rankedPools: Record<FeedSource, Work[]> = {
    pick: rankSourcePool(picks, 'pick', seenIds, ctx),
    theme: rankSourcePool(themed, 'theme', seenIds, ctx),
    featured: rankSourcePool(featured, 'featured', seenIds, ctx),
    personalized: rankSourcePool(personalized, 'personalized', seenIds, ctx),
    recent: rankSourcePool(recent, 'recent', seenIds, ctx),
    rest: rankSourcePool(rest, 'rest', seenIds, ctx),
  };

  return interleaveByPattern(rankedPools);
}
