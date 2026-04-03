import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, X, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { workStore, useWorkStore, useAuthStore, useProfileStore, authStore, profileStore } from '../store';
import { artists } from '../data';
import { imageUrls } from '../imageUrls';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { getFirstImage } from '../utils/imageHelper';
import { isWorkVisibleOnPublicFeed } from '../utils/feedVisibility';
import { getHiddenArtistIdsForReporter, getHiddenWorkIdsForReporter, migrateLegacyReportHiddenOnce } from '../utils/reportStorage';
import type { Work } from '../data';
import { rankWorksBySearchQuery } from '../utils/searchRank';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';
import { Button } from '../components/ui/button';

const MAX_RECENT = 10;

/** PRD §9: 비로그인 로컬 / 로그인 시 계정별 분리(실서비스는 서버 저장) */
function recentSearchStorageKey(): string {
  if (!authStore.isLoggedIn()) return 'artier_recent_searches_guest';
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

const SUGGEST_KEY_IDS = [
  'search.suggest1',
  'search.suggest2',
  'search.suggest3',
  'search.suggest4',
  'search.suggest5',
  'search.suggest6',
] as const satisfies readonly MessageKey[];

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

  const suggestedKeywords = useMemo(() => SUGGEST_KEY_IDS.map((k) => ({ key: k, label: t(k) })), [t]);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const store = useWorkStore();
  const works = store.getWorks();

  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecentSearches(loadRecent(storageKey));
  }, [storageKey]);

  const autocompleteSource = useMemo(() => {
    const set = new Set<string>();
    for (const w of works) {
      if (w.title?.trim()) set.add(w.title.trim());
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

  const clearAllRecent = () => {
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
      <div className="bg-white border-b border-[#E5E7EB]">
        <div className="mx-auto max-w-[800px] px-4 sm:px-6 py-6 sm:py-10">
          <div className="relative" ref={searchWrapRef}>
            <SearchIcon className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 text-gray-400 z-10" />
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
              className="w-full pl-12 sm:pl-14 pr-12 sm:pr-14 py-4 sm:py-5 text-[15px] sm:text-base border-2 border-[#E5E7EB] rounded-2xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-white"
            />
            {query && (
              <Button
                type="button"
                onClick={() => { setQuery(''); setSearchParams({}); setSuggestOpen(false); }}
                className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full lg:hover:bg-[#F4F4F5]"
              >
                <X className="h-5 w-5 text-gray-400" />
              </Button>
            )}
            {suggestOpen && autocompleteSuggestions.length > 0 && !searchTerm && (
              <ul
                className="absolute left-0 right-0 top-full mt-2 z-20 rounded-xl border border-[#E5E7EB] bg-white shadow-lg py-1 max-h-64 overflow-y-auto"
                role="listbox"
              >
                <li className="px-3 py-1.5 text-[11px] font-medium text-[#A1A1AA] uppercase tracking-wide">
                  {t('search.autocompleteHeading')}
                </li>
                {autocompleteSuggestions.map((s) => (
                  <li key={s} role="option">
                    <Button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => doSearch(s)}
                      className="w-full text-left px-4 py-2.5 text-sm text-[#3F3F46] lg:hover:bg-[#F4F4F5] transition-colors"
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
                  <h2 className="text-lg font-semibold text-[#18181B] flex items-center gap-2">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    {t('search.recent')}
                  </h2>
                  <Button onClick={clearAllRecent} className="text-sm text-gray-400 lg:hover:text-gray-600">
                    {t('search.clearRecent')}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <div
                      key={term}
                      className="flex items-center gap-2 px-4 py-2.5 border border-[#E5E7EB] rounded-full lg:hover:bg-[#FAFAFA] transition-colors group"
                    >
                      <Button
                        onClick={() => doSearch(term)}
                        className="text-sm text-gray-700"
                      >
                        {term}
                      </Button>
                      <Button
                        onClick={() => removeRecent(term)}
                        className="h-5 w-5 flex items-center justify-center rounded-full hover-action active:bg-gray-200 transition-all"
                      >
                        <X className="h-3 w-3 text-gray-400" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trending keywords */}
            <div>
              <h2 className="text-lg font-semibold text-[#18181B] flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                {t('search.suggestedKeywords')}
              </h2>
              <p className="text-xs text-[#A1A1AA] mb-3">{t('search.suggestedKeywordsNote')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {suggestedKeywords.map(({ key, label }, i) => (
                  <Button
                    key={key}
                    onClick={() => doSearch(label)}
                    className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 border-b border-[#F0F0F0] lg:hover:bg-[#FAFAFA] transition-colors text-left"
                  >
                    <span className="text-[13px] sm:text-[15px] font-bold text-primary w-5 sm:w-6 shrink-0">{i + 1}</span>
                    <span className="text-[13px] sm:text-sm text-[#3F3F46]">{label}</span>
                    <ArrowRight className="h-4 w-4 text-gray-300 ml-auto" />
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search results */}
        {searchTerm && (
          <div className="space-y-6 sm:space-y-10">
            <p className="text-[13px] sm:text-sm text-gray-500">
              {t('search.resultsLine')
                .replace('{q}', searchTerm)
                .replace('{n}', String(results.works.length + results.artists.length))}
            </p>

            {/* Artist results */}
            {results.artists.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-[#18181B] mb-4">
                  {t('search.artistsHeading').replace('{n}', String(results.artists.length))}
                </h2>
                <div className="space-y-3">
                  {results.artists.map((artist) => (
                    <Button
                      key={artist.id}
                      onClick={() => navigate(`/profile/${artist.id}`)}
                      className="flex items-center gap-3 sm:gap-4 w-full p-3 sm:p-4 border-b border-[#F0F0F0] lg:hover:bg-[#FAFAFA] transition-colors text-left"
                    >
                      <Avatar className="h-11 w-11 border-2 border-gray-100">
                        <AvatarImage src={artist.avatar} alt={artist.name} />
                        <AvatarFallback>{artist.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-semibold text-[#18181B]">{artist.name}</h3>
                        {artist.bio && (
                          <p className="text-[13px] text-gray-500 truncate">{artist.bio}</p>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 shrink-0">
                        {t('search.followersLabel')} {artist.followers?.toLocaleString() || 0}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Work results */}
            {results.works.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-[#18181B] mb-4">
                  {t('search.worksHeading').replace('{n}', String(results.works.length))}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1.625rem] sm:gap-[2.275rem] lg:gap-[2.6rem]">
                  {results.works.map((work) => (
                    <Button
                      key={work.id}
                      onClick={() => navigate(`/exhibitions/${work.id}`)}
                      className="group text-left"
                    >
                      <div className="aspect-square bg-white rounded-xl overflow-hidden border border-[#E5E7EB] mb-3">
                        <ImageWithFallback
                          src={imageUrls[getFirstImage(work.image)] || getFirstImage(work.image)}
                          alt={work.title}
                          className="w-full h-full object-contain hover-scale"
                        />
                      </div>
                      <h3 className="text-sm font-medium text-[#18181B] truncate lg:group-hover:text-primary transition-colors">
                        {work.title}
                      </h3>
                      <p className="text-xs text-gray-500">{work.artist.name}</p>
                      {work.groupName ? (
                        <p className="text-xs text-primary mt-1 truncate">{work.groupName}</p>
                      ) : null}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* No results */}
            {!hasResults && (
              <div className="text-center py-12 sm:py-20">
                <SearchIcon className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                <h3 className="text-sm sm:text-base font-semibold text-gray-700 mb-2">{t('search.noResults')}</h3>
                <p className="text-[13px] sm:text-sm text-gray-400">{t('search.noResultsHint')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
