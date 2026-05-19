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

  const [editingId, setEditingId] = useState<string | null>(null);
  const [mode, setMode] = useState<'member' | 'non-member'>('member');
  const [searchText, setSearchText] = useState('');
  const [nameText, setNameText] = useState('');

  // ── Helpers ──
  const assignMember = (contentId: string, artist: typeof allArtists[number]) => {
    setContents((prev) =>
      prev.map((c) =>
        c.id !== contentId
          ? c
          : {
              ...c,
              artistType: 'member' as const,
              artist: { id: artist.id, name: artist.name, avatar: artist.avatar },
              nonMemberArtist: undefined,
            }
      )
    );
    setEditingId(null);
    setSearchText('');
  };

  const assignNonMember = (contentId: string, name: string) => {
    if (!name.trim()) return;
    setContents((prev) =>
      prev.map((c) =>
        c.id !== contentId
          ? c
          : {
              ...c,
              artistType: 'non-member' as const,
              artist: undefined,
              nonMemberArtist: { displayName: name.trim() },
            }
      )
    );
    setEditingId(null);
    setNameText('');
  };

  const clearArtist = (contentId: string) => {
    setContents((prev) =>
      prev.map((c) =>
        c.id !== contentId
          ? c
          : { ...c, artistType: undefined, artist: undefined, nonMemberArtist: undefined }
      )
    );
  };

  const assignQuickPick = (
    contentId: string,
    existing: {
      type: 'member' | 'non-member';
      artist?: ContentItem['artist'];
      displayName?: string;
    }
  ) => {
    if (existing.type === 'member' && existing.artist) {
      setContents((prev) =>
        prev.map((c) =>
          c.id !== contentId
            ? c
            : {
                ...c,
                artistType: 'member' as const,
                artist: existing.artist,
                nonMemberArtist: undefined,
              }
        )
      );
    } else if (existing.type === 'non-member' && existing.displayName) {
      setContents((prev) =>
        prev.map((c) =>
          c.id !== contentId
            ? c
            : {
                ...c,
                artistType: 'non-member' as const,
                artist: undefined,
                nonMemberArtist: { displayName: existing.displayName! },
              }
        )
      );
    }
    setEditingId(null);
  };

  // ── Quick picks: artists already assigned to OTHER images ──
  const quickPicks = useMemo(() => {
    const seen = new Map<
      string,
      {
        type: 'member' | 'non-member';
        label: string;
        artist?: ContentItem['artist'];
        displayName?: string;
      }
    >();
    validContents.forEach((c) => {
      if (c.id === editingId) return; // exclude the row being edited
      if (c.artistType === 'member' && c.artist) {
        if (!seen.has(c.artist.id))
          seen.set(c.artist.id, { type: 'member', label: c.artist.name, artist: c.artist });
      } else if (c.artistType === 'non-member' && c.nonMemberArtist?.displayName) {
        const key = `nm_${c.nonMemberArtist.displayName}`;
        if (!seen.has(key))
          seen.set(key, {
            type: 'non-member',
            label: c.nonMemberArtist.displayName,
            displayName: c.nonMemberArtist.displayName,
          });
      }
    });
    return [...seen.values()];
  }, [validContents, editingId]);

  // ── Validation ──
  const allAssigned = validContents.every(
    (c) => c.artistType === 'member' || c.artistType === 'non-member'
  );
  const uniqueCount = new Set(
    validContents
      .map((c) =>
        c.artistType === 'member' ? c.artist?.id : c.nonMemberArtist?.displayName
      )
      .filter(Boolean)
  ).size;
  const canNext = allAssigned && uniqueCount >= 2;
  const showUniqueHint = allAssigned && uniqueCount < 2 && validContents.length > 0;

  const openEdit = (id: string) => {
    setEditingId(id);
    setMode('member');
    setSearchText('');
    setNameText('');
    setStep3NeedsReview(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setSearchText('');
    setNameText('');
  };

  // ── Member search filtered list ──
  const memberSearchResults = useMemo(() => {
    if (!searchText) return [];
    return allArtists
      .filter((a) => a.name.toLowerCase().includes(searchText.toLowerCase()))
      .slice(0, 8);
  }, [searchText]);

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
          const isEditing = editingId === c.id;
          const hasArtist = c.artistType === 'member' || c.artistType === 'non-member';
          const artistLabel =
            c.artistType === 'member'
              ? c.artist?.name
              : c.nonMemberArtist?.displayName;

          return (
            <div key={c.id} className="rounded-2xl border border-border/60 overflow-hidden">
              {/* Row header: thumbnail + assignment */}
              <div className="flex items-center gap-3 px-3 py-3">
                {/* Thumbnail + number */}
                <div className="relative flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-muted">
                  <ImageWithFallback
                    src={c.url!}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-0.5 right-1 text-[10px] font-bold text-white drop-shadow">
                    {idx + 1}
                  </span>
                </div>

                {/* Assignment area */}
                <div className="flex-1 min-w-0">
                  {hasArtist ? (
                    /* Assigned chip */
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/30 rounded-full px-3 py-1 min-h-[36px]">
                        {c.artistType === 'member' && c.artist?.avatar && (
                          <img
                            src={c.artist.avatar}
                            alt=""
                            className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                          />
                        )}
                        <span className="text-sm font-semibold text-primary truncate max-w-[160px]">
                          {artistLabel}
                        </span>
                        <button
                          type="button"
                          onClick={() => clearArtist(c.id)}
                          className="ml-0.5 text-primary/60 hover:text-red-500 transition-colors min-h-[28px] min-w-[28px] flex items-center justify-center"
                          aria-label={`${artistLabel} 작가 제거`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => openEdit(c.id)}
                          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 min-h-[36px] px-1 transition-colors"
                        >
                          변경
                        </button>
                      )}
                    </div>
                  ) : (
                    /* Unassigned placeholder button */
                    !isEditing && (
                      <button
                        type="button"
                        onClick={() => openEdit(c.id)}
                        className="w-full text-left min-h-[44px] border-2 border-dashed border-border/60 rounded-xl px-4 py-2.5 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-all"
                      >
                        작가를 선택하세요
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Editing form (inline, below the row) */}
              {isEditing && (
                <div className="border-t border-border/40 px-3 py-4 bg-primary/[0.02]">
                  {/* Quick picks */}
                  {quickPicks.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        다른 작품에 이미 추가된 작가
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {quickPicks.map((qp, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => assignQuickPick(c.id, qp)}
                            className="flex items-center gap-1.5 bg-muted border border-border rounded-full px-3 py-1.5 text-sm font-medium hover:border-primary hover:bg-primary/10 hover:text-primary transition-all min-h-[36px]"
                          >
                            {qp.type === 'member' && qp.artist?.avatar && (
                              <img
                                src={qp.artist.avatar}
                                alt=""
                                className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                              />
                            )}
                            {qp.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Member / Non-member toggle */}
                  <div className="flex gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setMode('member')}
                      className={`flex-1 min-h-[44px] rounded-xl text-sm font-bold border-2 transition-all ${
                        mode === 'member'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/40'
                      }`}
                    >
                      {t('upload.artistIsMember')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('non-member')}
                      className={`flex-1 min-h-[44px] rounded-xl text-sm font-bold border-2 transition-all ${
                        mode === 'non-member'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/40'
                      }`}
                    >
                      {t('upload.artistIsNonMember')}
                    </button>
                  </div>

                  {/* Input area */}
                  {mode === 'member' ? (
                    <div>
                      <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="text"
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          placeholder={t('upload.step3aAddMemberNickname')}
                          className="w-full pl-10 pr-4 py-3 border border-border/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                          autoFocus
                        />
                      </div>
                      {searchText && (
                        <div className="border border-border rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                          {memberSearchResults.length > 0 ? (
                            memberSearchResults.map((a) => (
                              <button
                                key={a.id}
                                type="button"
                                onClick={() => assignMember(c.id, a)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted text-left min-h-[44px] transition-colors"
                              >
                                <img
                                  src={a.avatar}
                                  alt=""
                                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                />
                                <span className="text-sm font-medium">{a.name}</span>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-sm text-muted-foreground">
                              {t('upload.memberSearchPh')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <input
                        type="text"
                        value={nameText}
                        onChange={(e) => setNameText(e.target.value)}
                        placeholder="이름 입력"
                        className="w-full px-4 py-3 border border-border/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px] mb-2"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && assignNonMember(c.id, nameText)}
                      />
                      <p className="text-xs text-muted-foreground mb-3">
                        {t('upload.nonMemberNameHint')}
                      </p>
                      <Button
                        onClick={() => assignNonMember(c.id, nameText)}
                        disabled={!nameText.trim()}
                        className="w-full min-h-[44px]"
                      >
                        추가하기
                      </Button>
                    </div>
                  )}

                  {/* Cancel */}
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="w-full text-sm text-muted-foreground mt-3 min-h-[44px] hover:text-foreground transition-colors"
                  >
                    취소
                  </button>
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
