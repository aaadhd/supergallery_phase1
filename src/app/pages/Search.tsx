import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, X, Clock } from 'lucide-react';
import { useWorkStore, useAuthStore, useProfileStore, authStore, profileStore, followStore, useFollowStore } from '../store';
import { searchWorks, type SearchResults } from '../utils/searchRank';
import { isWorkVisibleOnPublicFeed } from '../utils/feedVisibility';
import { getHiddenWorkIdsForReporter, migrateLegacyReportHiddenOnce } from '../utils/reportStorage';
import { type Work } from '../data';
import { useI18n } from '../i18n/I18nProvider';
import { Button } from '../components/ui/button';
import { WorkCard } from '../components/WorkCard';
import { openConfirm } from '../components/ConfirmDialog';

const MAX_RECENT = 10;


// PRD/WBS: 로그인=서버 저장 / 비로그인=로컬스토리지. 데모 환경에서는 양쪽 모두 localStorage에 저장하되 키로 분리. 실서버 연동은 Phase 2.
const GUEST_RECENT_KEY = 'artier_recent_searches__guest';

function recentSearchStorageKey(): string {
  if (!authStore.isLoggedIn()) return GUEST_RECENT_KEY;
  const p = profileStore.getProfile();
  const slug = (p.nickname || p.name || 'member').replace(/[^\w\-.\uAC00-\uD7A3]/g, '_').slice(0, 64);
  return `artier_recent_searches__${slug}`;
}

function loadRecent(key: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function saveRecent(key: string, list: string[]) {
  localStorage.setItem(key, JSON.stringify(list.slice(0, MAX_RECENT)));
}

/** 로그인 시 게스트 검색 이력을 계정 키로 병합 후 게스트 키 삭제. */
function mergeGuestRecentInto(accountKey: string) {
  if (accountKey === GUEST_RECENT_KEY) return;
  const guest = loadRecent(GUEST_RECENT_KEY);
  if (guest.length === 0) return;
  const existing = loadRecent(accountKey);
  const merged: string[] = [];
  const seen = new Set<string>();
  for (const term of [...guest, ...existing]) {
    if (!seen.has(term)) {
      seen.add(term);
      merged.push(term);
    }
  }
  saveRecent(accountKey, merged);
  try { localStorage.removeItem(GUEST_RECENT_KEY); } catch { /* ignore */ }
}


export default function Search() {
  const { t } = useI18n();
  const auth = useAuthStore();
  const follows = useFollowStore();
  const profile = useProfileStore();
  const profileSig = `${profile.getProfile().nickname}|${profile.getProfile().name}`;

  useEffect(() => {
    migrateLegacyReportHiddenOnce();
  }, [auth.isLoggedIn(), profileSig]);

  const storageKey = useMemo(
    () => recentSearchStorageKey(),
    [auth.isLoggedIn(), profileSig],
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const store = useWorkStore();
  const works = store.getWorks();

  const paramQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(paramQuery);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchTerm = searchParams.get('q') || '';
  type FilterTab = 'all' | 'artist' | 'group' | 'exhibition' | 'piece';
  const filterTab = ((searchParams.get('tab') as FilterTab) || 'all');
  const setFilterTab = (tab: FilterTab) => {
    const params: Record<string, string> = {};
    if (searchTerm) params.q = searchTerm;
    if (tab !== 'all') params.tab = tab;
    setSearchParams(params);
  };
  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    // 로그인 시 게스트 히스토리 → 계정 히스토리로 1회 병합 후 로드
    // deps에 auth 객체 자체를 넣으면 useAuthStore의 새 참조로 무한 루프 유발 → storageKey만 의존
    if (authStore.isLoggedIn()) mergeGuestRecentInto(storageKey);
    setRecentSearches(loadRecent(storageKey));
  }, [storageKey]);


  const addRecent = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...recentSearches.filter((s) => s !== trimmed)].slice(0, MAX_RECENT);
    setRecentSearches(updated);
    saveRecent(storageKey, updated);
  };

  const removeRecent = (term: string) => {
    const updated = recentSearches.filter((s) => s !== term);
    setRecentSearches(updated);
    saveRecent(storageKey, updated);
  };

  const clearAllRecent = async () => {
    if (!(await openConfirm({ title: t('search.confirmClearRecent'), destructive: true, confirmLabel: t('search.clearRecent') }))) return;
    setRecentSearches([]);
    saveRecent(storageKey, []);
  };

  const doSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    addRecent(trimmed);
    setSearchParams({ q: trimmed });
    setQuery(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') doSearch(query);
  };

  const results = useMemo((): SearchResults => {
    const empty: SearchResults = { all: [], byArtist: [], byGroup: [], byExhibition: [], byPiece: [] };
    if (!searchTerm) return empty;
    const hiddenWorks = getHiddenWorkIdsForReporter();
    const pool = works.filter((w: Work) => !hiddenWorks.has(w.id) && isWorkVisibleOnPublicFeed(w));
    return searchWorks(pool, searchTerm);
  }, [searchTerm, works, auth.isLoggedIn(), profileSig]);

  const hasResults = results.all.length > 0;

  const displayedWorks = useMemo(() => {
    switch (filterTab) {
      case 'artist': return results.byArtist;
      case 'group': return results.byGroup;
      case 'exhibition': return results.byExhibition;
      case 'piece': return results.byPiece;
      default: return results.all;
    }
  }, [filterTab, results]);
  

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Search bar */}
      <div className="bg-background border-b border-border">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-6 sm:py-10">
          <div className="relative max-w-3xl">
            <SearchIcon className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground z-10" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('search.placeholder')}
              autoFocus
              maxLength={100}
              className="w-full pl-12 sm:pl-14 pr-12 sm:pr-14 py-4 sm:py-5 text-base sm:text-base border-2 border-border rounded-2xl focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 transition-all bg-card"
            />
            {query && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setQuery(''); setSearchParams({}); }}
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-full lg:hover:bg-muted min-h-[44px] min-w-[44px]"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-5 sm:py-8">
        {/* No search term yet - show recent & trending */}
        {!searchTerm && (
          <div className="space-y-6 sm:space-y-10">
            {/* Recent searches */}
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    {t('search.recent')}
                  </h2>
                  <Button variant="ghost" onClick={clearAllRecent} className="text-sm text-muted-foreground lg:hover:text-foreground">
                    {t('search.clearRecent')}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <div
                      key={term}
                      className="flex items-center gap-1 pl-4 pr-1 min-h-[44px] border border-border rounded-full lg:hover:bg-muted/50 transition-colors group"
                    >
                      <button
                        type="button"
                        onClick={() => doSearch(term)}
                        className="min-h-[44px] flex items-center text-sm text-foreground"
                      >
                        {term}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRecent(term)}
                        aria-label={t('search.removeRecent').replace('{term}', term)}
                        className="h-11 w-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full lg:hover:bg-muted active:bg-muted transition-all shrink-0"
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* Search results */}
        {searchTerm && (
          <div className="space-y-5 sm:space-y-6">
            {/* 결과 건수 */}
            <p className="text-sm text-muted-foreground">
              {t('search.resultsLine').replace('{q}', searchTerm).replace('{n}', String(results.all.length))}
            </p>

            {/* 필터 탭 */}
            {hasResults && (
              <div className="flex gap-2 flex-wrap">
                {(
                  [
                    { tab: 'all' as FilterTab, label: t('search.filterAll'), count: results.all.length },
                    { tab: 'artist' as FilterTab, label: t('search.filterArtist'), count: results.byArtist.length },
                    { tab: 'group' as FilterTab, label: t('search.filterGroup'), count: results.byGroup.length },
                    { tab: 'exhibition' as FilterTab, label: t('search.filterExhibition'), count: results.byExhibition.length },
                    { tab: 'piece' as FilterTab, label: t('search.filterPiece'), count: results.byPiece.length },
                  ]
                ).map(({ tab, label, count }) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => count > 0 && setFilterTab(tab)}
                    className={`min-h-[44px] px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      filterTab === tab
                        ? 'bg-foreground text-white'
                        : count === 0
                        ? 'bg-muted/50 text-muted-foreground/40 cursor-default'
                        : 'bg-muted text-muted-foreground lg:hover:bg-muted/70'
                    }`}
                  >
                    {label} {count}
                  </button>
                ))}
              </div>
            )}

            {/* 결과 그리드 */}
            {displayedWorks.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-[1.625rem] sm:gap-[2.275rem]">
                {displayedWorks.map((work, idx) => (
                  <WorkCard
                    key={work.id}
                    work={work}
                    index={idx}
                    onSelect={() => navigate(`/exhibitions/${work.id}`)}
                    onArtistClick={(artistId) => navigate(`/profile/${artistId}`)}
                    isFollowing={(artistId) => follows.isFollowing(artistId)}
                    onToggleFollow={(artistId) => followStore.toggle(artistId)}
                  />
                ))}
              </div>
            )}

            {/* 해당 탭 결과 없음 (전체는 결과 있지만 탭 필터 결과 없음) */}
            {hasResults && displayedWorks.length === 0 && (
              <div className="text-center py-10">
                <p className="text-sm text-muted-foreground">{t('search.noResultsHint')}</p>
              </div>
            )}

            {/* 전체 결과 없음 */}
            {!hasResults && (
              <div className="text-center py-12 sm:py-20">
                <SearchIcon className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                <h3 className="text-sm sm:text-base font-semibold text-foreground mb-2">
                  {t('search.noResults').replace('{query}', searchTerm)}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">{t('search.noResultsHint')}</p>
                {recentSearches.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs text-muted-foreground mb-2">{t('search.tryRecent')}</p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {recentSearches.slice(0, 5).map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => doSearch(term)}
                          className="min-h-[44px] rounded-full border border-border px-4 text-sm text-foreground lg:hover:bg-muted/50"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="min-h-[44px]"
                >
                  {t('search.goBrowse')}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
