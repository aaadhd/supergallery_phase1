import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, X, Clock } from 'lucide-react';
import { useWorkStore, useAuthStore, useProfileStore, authStore, profileStore } from '../store';
import { artists } from '../data';
import { imageUrls } from '../imageUrls';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { getCoverImage, getThumbCover } from '../utils/imageHelper';
import { isWorkVisibleOnPublicFeed } from '../utils/feedVisibility';
import { getHiddenArtistIdsForReporter, getHiddenWorkIdsForReporter, migrateLegacyReportHiddenOnce } from '../utils/reportStorage';
import type { Work } from '../data';
import { rankWorksBySearchQuery } from '../utils/searchRank';
import { useI18n } from '../i18n/I18nProvider';

import { Button } from '../components/ui/button';
import { displayExhibitionTitle, displayProminentHeadline } from '../utils/workDisplay';
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
  const [suggestOpen, setSuggestOpen] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    // 로그인 시 게스트 히스토리 → 계정 히스토리로 1회 병합 후 로드
    // deps에 auth 객체 자체를 넣으면 useAuthStore의 새 참조로 무한 루프 유발 → storageKey만 의존
    if (authStore.isLoggedIn()) mergeGuestRecentInto(storageKey);
    setRecentSearches(loadRecent(storageKey));
  }, [storageKey]);

  const autocompleteSource = useMemo(() => {
    const set = new Set<string>();
    for (const w of works) {
      if (w.title?.trim()) set.add(w.title.trim());
      if (w.exhibitionName?.trim()) set.add(w.exhibitionName.trim());
      if (w.groupName?.trim()) set.add(w.groupName.trim());
    }
    for (const a of artists) {
      if (a.name) set.add(a.name);
    }
    return [...set];
  }, [works]);

  const autocompleteSuggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return [];
    return autocompleteSource
      .filter((s) => s.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, autocompleteSource]);

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
    setSuggestOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') doSearch(query);
  };

  const searchTerm = searchParams.get('q') || '';

  const results = useMemo(() => {
    if (!searchTerm) return { works: [] as Work[], artists: [] as typeof artists };
    const lower = searchTerm.toLowerCase();
    const hiddenWorks = getHiddenWorkIdsForReporter();
    const hiddenArtists = getHiddenArtistIdsForReporter();
    const pool = works.filter(
      (w: Work) =>
        !w.isHidden && !hiddenWorks.has(w.id) && isWorkVisibleOnPublicFeed(w),
    );
    const matchedWorks = rankWorksBySearchQuery(pool, searchTerm);
    const matchedArtists = artists
      .filter(
        (a) =>
          !hiddenArtists.has(a.id) &&
          (a.name.toLowerCase().includes(lower) || a.bio?.toLowerCase().includes(lower)),
      )
      .sort((a, b) => {
        const as = a.name.toLowerCase().startsWith(lower) ? 0 : 1;
        const bs = b.name.toLowerCase().startsWith(lower) ? 0 : 1;
        return as - bs || a.name.localeCompare(b.name);
      });
    return { works: matchedWorks, artists: matchedArtists };
  }, [searchTerm, works, auth.isLoggedIn(), profileSig]);

  const hasResults = results.works.length > 0 || results.artists.length > 0;
  

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!searchWrapRef.current?.contains(e.target as Node)) setSuggestOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      {/* Search bar */}
      <div className="bg-white border-b border-border">
        <div className="mx-auto max-w-[800px] px-4 sm:px-6 py-6 sm:py-10">
          <div className="relative" ref={searchWrapRef}>
            <SearchIcon className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground z-10" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSuggestOpen(true);
              }}
              onFocus={() => setSuggestOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={t('search.placeholder')}
              autoFocus
              role="combobox"
              aria-expanded={suggestOpen && autocompleteSuggestions.length > 0}
              aria-autocomplete="list"
              maxLength={100}
              className="w-full pl-12 sm:pl-14 pr-12 sm:pr-14 py-4 sm:py-5 text-base sm:text-base border-2 border-border rounded-2xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-white"
            />
            {query && (
              <Button
                type="button"
                onClick={() => { setQuery(''); setSearchParams({}); setSuggestOpen(false); }}
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-full lg:hover:bg-muted min-h-[44px] min-w-[44px]"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </Button>
            )}
            {suggestOpen && autocompleteSuggestions.length > 0 && !searchTerm && (
              <ul
                className="absolute left-0 right-0 top-full mt-2 z-20 rounded-xl border border-border bg-white shadow-lg py-1 max-h-64 overflow-y-auto"
                role="listbox"
              >
                <li className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t('search.autocompleteHeading')}
                </li>
                {autocompleteSuggestions.map((s) => (
                  <li key={s} role="option">
                    <Button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => doSearch(s)}
                      className="w-full text-left px-4 py-2.5 text-sm text-foreground lg:hover:bg-muted transition-colors"
                    >
                      {s}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[800px] px-4 sm:px-6 py-5 sm:py-8">
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
                      className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-full lg:hover:bg-muted/50 transition-colors group"
                    >
                      <button
                        type="button"
                        onClick={() => doSearch(term)}
                        className="text-sm text-foreground"
                      >
                        {term}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRecent(term)}
                        className="h-5 w-5 flex items-center justify-center rounded-full lg:hover:bg-muted active:bg-muted transition-all"
                      >
                        <X className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 추천 키워드 제거됨 — 태깅 기능 미구현으로 데이터 근거 없음 */}
          </div>
        )}

        {/* Search results */}
        {searchTerm && (
          <div className="space-y-6 sm:space-y-10">
            <p className="text-sm sm:text-sm text-muted-foreground">
              {t('search.resultsLine')
                .replace('{q}', searchTerm)
                .replace('{n}', String(results.works.length + results.artists.length))}
            </p>

            {/* Top Matches (Unified) — 시니어 사용자를 위한 결과 단일화 및 최적 매칭 우선 노출 */}
            {hasResults && (
              <div className="mb-0">
                <h2 className="text-sm font-bold text-primary mb-5 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {t('search.autocompleteHeading')}
                </h2>
                <div className="flex flex-col gap-3">
                  {/* Top Artist match */}
                  {results.artists[0] && (
                    <button
                      type="button"
                      onClick={() => navigate(`/profile/${results.artists[0].id}`)}
                      className="flex items-center gap-4 w-full p-4 rounded-2xl bg-primary/[0.03] border border-primary/10 lg:hover:bg-primary/[0.06] transition-colors text-left"
                    >
                      <Avatar className="h-12 w-12 border-2 border-primary/20">
                        <AvatarImage src={results.artists[0].avatar} alt={results.artists[0].name} />
                        <AvatarFallback>{results.artists[0].name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-foreground">{results.artists[0].name}</h3>
                          <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{t('browse.artistLabel')}</span>
                        </div>
                        {results.artists[0].bio && (
                          <p className="text-sm text-muted-foreground truncate italic">"{results.artists[0].bio}"</p>
                        )}
                      </div>
                    </button>
                  )}
                  {/* Top 2 Work matches */}
                  {results.works.slice(0, 2).map((work) => (
                    <button
                      type="button"
                      key={work.id}
                      onClick={() => navigate(`/exhibitions/${work.id}`)}
                      className="flex items-center gap-4 w-full p-3 rounded-2xl bg-zinc-50 border border-zinc-200 lg:hover:bg-zinc-100 transition-colors text-left"
                    >
                      <div className="w-14 h-14 bg-white rounded-lg overflow-hidden border border-zinc-200 shrink-0">
                        <ImageWithFallback
                          src={imageUrls[getThumbCover(work)] || getThumbCover(work)}
                          alt=""
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-foreground truncate">{displayProminentHeadline(work, t('work.untitled'))}</h3>
                          <span className="text-xs font-bold text-zinc-500 bg-zinc-200 px-1.5 py-0.5 rounded">작품</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{work.artist.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Artist results */}
            {results.artists.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  {t('search.artistsHeading').replace('{n}', String(results.artists.length))}
                </h2>
                <div className="space-y-3">
                  {results.artists.map((artist) => (
                    <button
                      type="button"
                      key={artist.id}
                      onClick={() => navigate(`/profile/${artist.id}`)}
                      className="flex items-center gap-3 sm:gap-4 w-full p-3 sm:p-4 border-b border-border/40 lg:hover:bg-muted/50 transition-colors text-left"
                    >
                      <Avatar className="h-11 w-11 border-2 border-border/40">
                        <AvatarImage src={artist.avatar} alt={artist.name} />
                        <AvatarFallback>{artist.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-semibold text-foreground">{artist.name}</h3>
                        {artist.bio && (
                          <p className="text-sm text-muted-foreground truncate">{artist.bio}</p>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0">
                        {t('search.followersLabel')} {artist.followers?.toLocaleString() || 0}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Work results */}
            {results.works.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  {t('search.worksHeading').replace('{n}', String(results.works.length))}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1.625rem] sm:gap-[2.275rem] lg:gap-[2.6rem]">
                  {results.works.map((work) => (
                    <button
                      type="button"
                      key={work.id}
                      onClick={() => navigate(`/exhibitions/${work.id}`)}
                      className="group text-left"
                    >
                      <div className="aspect-square bg-white rounded-xl overflow-hidden border border-border mb-3">
                        <ImageWithFallback
                          src={imageUrls[getThumbCover(work)] || getThumbCover(work)}
                          alt={displayProminentHeadline(work, t('work.untitled'))}
                          className="w-full h-full object-contain hover-scale"
                        />
                      </div>
                      <h3 className="text-sm font-medium text-foreground truncate lg:group-hover:text-primary transition-colors">
                        {displayProminentHeadline(work, t('work.untitled'))}
                      </h3>
                      <p className="text-xs text-muted-foreground">{work.artist.name}</p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {t('workDetail.exhibitionLine')} · {displayExhibitionTitle(work, t('work.exhibitionFallback'))}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No results */}
            {!hasResults && (
              <div className="text-center py-12 sm:py-20">
                <SearchIcon className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                <h3 className="text-sm sm:text-base font-semibold text-foreground mb-2">{t('search.noResults').replace('{query}', searchTerm)}</h3>
                <p className="text-sm sm:text-sm text-muted-foreground mb-6">{t('search.noResultsHint')}</p>

                {recentSearches.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs text-muted-foreground mb-2">{t('search.tryRecent')}</p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {recentSearches.slice(0, 5).map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => { setQuery(term); setSearchParams({ q: term }); }}
                          className="min-h-[36px] rounded-full border border-border px-3 text-sm text-foreground lg:hover:bg-muted/50"
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
                  onClick={() => navigate('/browse')}
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
