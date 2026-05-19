// src/app/components/upload/Step3Artists.tsx
import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';
import { Button } from '../ui/button';
import { ImageWithFallback } from '../ImageWithFallback';
import { artists as allArtists } from '../../data';
import type { ContentItem } from './types';
import type { MessageKey } from '../../i18n/messages';

interface Props {
  contents: ContentItem[];
  setContents: React.Dispatch<React.SetStateAction<ContentItem[]>>;
  step3NeedsReview: boolean;
  setStep3NeedsReview: (v: boolean) => void;
  onNext: () => void;
  onBack: () => void;
  onSaveDraft: () => void;
}

export function Step3Artists({
  contents, setContents,
  step3NeedsReview, setStep3NeedsReview,
  onNext, onBack, onSaveDraft,
}: Props) {
  const { t } = useI18n();
  const tn = (key: MessageKey, replacements: Record<string, string>) => {
    let s = t(key);
    for (const [k, v] of Object.entries(replacements)) s = s.replace(`{${k}}`, v);
    return s;
  };

  const validContents = contents.filter((c) => c.url);

  // row별 검색어 + 드롭다운 열린 row
  const [searchTexts, setSearchTexts] = useState<Record<string, string>>({});
  const [activeId, setActiveId] = useState<string | null>(null);

  const getSearch = (id: string) => searchTexts[id] ?? '';
  const setSearch = (id: string, v: string) => setSearchTexts((prev) => ({ ...prev, [id]: v }));
  const clearSearch = (id: string) => setSearchTexts((prev) => { const n = { ...prev }; delete n[id]; return n; });

  // ── Helpers ──
  const assignMember = (contentId: string, artist: typeof allArtists[number]) => {
    setContents((prev) =>
      prev.map((c) =>
        c.id !== contentId ? c : {
          ...c,
          artistType: 'member' as const,
          artist: { id: artist.id, name: artist.name, avatar: artist.avatar },
          nonMemberArtist: undefined,
        }
      )
    );
    setActiveId(null);
    clearSearch(contentId);
  };

  const assignNonMember = (contentId: string, name: string) => {
    if (!name.trim()) return;
    setContents((prev) =>
      prev.map((c) =>
        c.id !== contentId ? c : {
          ...c,
          artistType: 'non-member' as const,
          artist: undefined,
          nonMemberArtist: { displayName: name.trim() },
        }
      )
    );
    setActiveId(null);
    clearSearch(contentId);
  };

  const clearArtist = (contentId: string) => {
    setContents((prev) =>
      prev.map((c) =>
        c.id !== contentId ? c : { ...c, artistType: undefined, artist: undefined, nonMemberArtist: undefined }
      )
    );
  };

  // ── Validation ──
  const allAssigned = validContents.every(
    (c) => c.artistType === 'member' || c.artistType === 'non-member'
  );
  const uniqueCount = new Set(
    validContents
      .map((c) => c.artistType === 'member' ? c.artist?.id : c.nonMemberArtist?.displayName)
      .filter(Boolean)
  ).size;
  const canNext = allAssigned && uniqueCount >= 2;
  const showUniqueHint = allAssigned && uniqueCount < 2 && validContents.length > 0;

  // 활성 row의 검색 결과만 계산 (한 번에 하나의 dropdown만 열림)
  const activeMemberResults = useMemo(() => {
    if (!activeId) return [];
    const s = getSearch(activeId);
    if (!s.trim()) return [];
    return allArtists.filter((a) => a.name.toLowerCase().includes(s.toLowerCase())).slice(0, 8);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, searchTexts]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-300">
      {step3NeedsReview && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t('upload.step3ReassignNotice')}
        </div>
      )}

      <h1 className="text-2xl font-bold text-foreground mb-2">{t('upload.step3Title')}</h1>
      <p className="text-sm text-muted-foreground mb-6">{t('upload.step3Subtitle')}</p>

      {/* Image rows */}
      <div className="flex flex-col gap-3 mb-6">
        {validContents.map((c, idx) => {
          const hasArtist = c.artistType === 'member' || c.artistType === 'non-member';
          const artistLabel = c.artistType === 'member' ? c.artist?.name : c.nonMemberArtist?.displayName;
          const search = getSearch(c.id);
          const isActive = activeId === c.id;

          const memberResults = isActive ? activeMemberResults : [];

          return (
            <div key={c.id} className="rounded-2xl border border-border/60 overflow-hidden">
              <div className="flex items-center gap-3 px-3 py-3">
                {/* Thumbnail + number */}
                <div className="relative flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-muted">
                  <ImageWithFallback src={c.url!} alt="" className="w-full h-full object-cover" />
                  <span className="absolute bottom-0.5 right-1 text-[10px] font-bold text-white drop-shadow">
                    {idx + 1}
                  </span>
                </div>

                {/* Assignment area */}
                <div className="flex-1 min-w-0">
                  {hasArtist ? (
                    /* Assigned chip */
                    <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 min-h-[36px] ${
                      c.artistType === 'member'
                        ? 'bg-primary/10 border border-primary/30'
                        : 'bg-amber-50 border border-amber-300'
                    }`}>
                      {c.artistType === 'member' && c.artist?.avatar && (
                        <img src={c.artist.avatar} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                      )}
                      <span className={`text-sm font-semibold truncate max-w-[160px] ${
                        c.artistType === 'member' ? 'text-primary' : 'text-amber-700'
                      }`}>
                        {artistLabel}
                      </span>
                      <button
                        type="button"
                        onClick={() => clearArtist(c.id)}
                        className={`ml-0.5 hover:text-red-500 transition-colors min-h-[28px] min-w-[28px] flex items-center justify-center ${
                          c.artistType === 'member' ? 'text-primary/60' : 'text-amber-400'
                        }`}
                        aria-label={`${artistLabel} 작가 제거`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    /* Inline search input */
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <input
                        type="text"
                        value={search}
                        placeholder={t('upload.step3SearchPlaceholder')}
                        className="w-full pl-9 pr-4 py-2 border border-border/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                        onChange={(e) => setSearch(c.id, e.target.value)}
                        onFocus={() => { setActiveId(c.id); setStep3NeedsReview(false); }}
                        onBlur={() => setTimeout(() => setActiveId((prev) => prev === c.id ? null : prev), 150)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && search.trim() && memberResults.length === 0) {
                            assignNonMember(c.id, search);
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Search hint */}
              {!hasArtist && isActive && !search.trim() && (
                <div className="px-3 pb-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t('upload.step3SearchHint')}
                  </p>
                </div>
              )}

              {/* Dropdown (within card, below the row) */}
              {!hasArtist && isActive && search.trim() && (
                <div className="px-3 pb-3">
                  {memberResults.length > 0 ? (
                    <div className="border border-border rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                      {memberResults.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => assignMember(c.id, a)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted text-left min-h-[44px] transition-colors"
                        >
                          <img src={a.avatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                          <span className="text-sm font-medium">{a.name}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <Button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => assignNonMember(c.id, search)}
                      className="w-full min-h-[44px]"
                    >
                      '{search}' 추가하기
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Unique artists hint */}
      {showUniqueHint && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
          {tn('upload.groupValidityError', { n: '2' })}
        </p>
      )}

      {/* Bottom buttons */}
      <div className="flex flex-col gap-3 mt-8">
        <Button
          disabled={!canNext}
          onClick={() => { setStep3NeedsReview(false); onNext(); }}
          className={`w-full py-6 text-base font-bold rounded-2xl ${
            canNext ? 'bg-foreground text-background hover:bg-foreground/90' : ''
          }`}
        >
          {t('upload.wizardNext')} →
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack} className="flex-1 min-h-[44px]">
            {t('upload.wizardBack')}
          </Button>
          <Button variant="outline" onClick={onSaveDraft} className="flex-1 min-h-[44px]">
            {t('upload.saveDraft')}
          </Button>
        </div>
      </div>
    </div>
  );
}
