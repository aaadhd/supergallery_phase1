// src/app/components/upload/Step3Artists.tsx
import { useState } from 'react';
import { Search, X, Check } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';
import { Button } from '../ui/button';
import { ImageWithFallback } from '../ImageWithFallback';
import { artists as allArtists } from '../../data';
import type { ContentItem, RegisteredArtist } from './types';
import type { MessageKey } from '../../i18n/messages';

type SubStep = 'register' | 'assign';

interface Props {
  contents: ContentItem[];
  setContents: React.Dispatch<React.SetStateAction<ContentItem[]>>;
  registeredArtists: RegisteredArtist[];
  setRegisteredArtists: React.Dispatch<React.SetStateAction<RegisteredArtist[]>>;
  assigningArtistIdx: number;
  setAssigningArtistIdx: React.Dispatch<React.SetStateAction<number>>;
  step3NeedsReview: boolean;
  setStep3NeedsReview: (v: boolean) => void;
  onNext: () => void;
  onBack: () => void;
  onSaveDraft: () => void;
}

export function Step3Artists({
  contents, setContents,
  registeredArtists, setRegisteredArtists,
  assigningArtistIdx, setAssigningArtistIdx,
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

  const [subStep, setSubStep] = useState<SubStep>('register');
  const [addingType, setAddingType] = useState<'member' | 'non-member' | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [nonMemberName, setNonMemberName] = useState('');

  // Group validity check
  const currentUserId = allArtists[0]?.id ?? '';
  const hasSelfWork = validContents.some(
    (c) => c.artistType === 'self' || c.artist?.id === currentUserId
  );
  const requiredOthers = hasSelfWork ? 1 : 2;
  const otherArtists = registeredArtists.filter((a) => a.memberId !== currentUserId);
  const groupValid = otherArtists.length >= requiredOthers;

  // 3B: current artist's assigned images
  const currentArtist = registeredArtists[assigningArtistIdx] ?? null;
  const selectedForCurrent = new Set(
    validContents
      .filter((c) => {
        if (!currentArtist) return false;
        if (currentArtist.type === 'member') return c.artist?.id === currentArtist.memberId;
        return c.nonMemberArtist?.displayName === currentArtist.displayName;
      })
      .map((c) => c.id)
  );

  // 3B: unassigned images (not unknown, not assigned to anyone)
  const unassigned = validContents.filter(
    (c) => c.artistType !== 'unknown' && !c.artist && !c.nonMemberArtist?.displayName
  );

  const toggleImageForArtist = (contentId: string) => {
    if (!currentArtist) return;
    setContents((prev) =>
      prev.map((c) => {
        if (c.id !== contentId) return c;
        if (selectedForCurrent.has(contentId)) {
          return { ...c, artist: undefined, artistType: undefined, nonMemberArtist: undefined };
        }
        if (currentArtist.type === 'member') {
          return {
            ...c,
            artistType: 'member' as const,
            artist: { id: currentArtist.memberId!, name: currentArtist.memberName!, avatar: currentArtist.memberAvatar! },
            nonMemberArtist: undefined,
          };
        }
        return {
          ...c,
          artistType: 'non-member' as const,
          artist: undefined,
          nonMemberArtist: { displayName: currentArtist.displayName! },
        };
      })
    );
  };

  const addMember = (artist: (typeof allArtists)[number]) => {
    if (registeredArtists.some((a) => a.memberId === artist.id)) return;
    setRegisteredArtists((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        type: 'member',
        memberId: artist.id,
        memberName: artist.name,
        memberAvatar: artist.avatar,
      },
    ]);
    setAddingType(null);
    setMemberSearch('');
  };

  const addNonMember = () => {
    const name = nonMemberName.trim();
    if (!name) return;
    setRegisteredArtists((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        type: 'non-member',
        displayName: name,
      },
    ]);
    setAddingType(null);
    setNonMemberName('');
  };

  const removeArtist = (id: string) => {
    const artist = registeredArtists.find((a) => a.id === id);
    setRegisteredArtists((prev) => prev.filter((a) => a.id !== id));
    if (!artist) return;
    setContents((prev) =>
      prev.map((c) => {
        const isThis =
          artist.type === 'member'
            ? c.artist?.id === artist.memberId
            : c.nonMemberArtist?.displayName === artist.displayName;
        return isThis
          ? { ...c, artist: undefined, artistType: undefined, nonMemberArtist: undefined }
          : c;
      })
    );
  };

  // ── 3A: Register artists ──
  if (subStep === 'register') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 animate-in fade-in duration-300">
        {step3NeedsReview && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {t('upload.step3ReassignNotice')}
          </div>
        )}

        <h1 className="text-2xl font-bold text-foreground mb-2">{t('upload.step3Title')}</h1>
        <p className="text-sm text-muted-foreground mb-6">{t('upload.step3Subtitle')}</p>

        {/* Registered artists list */}
        {registeredArtists.length > 0 && (
          <div className="flex flex-col gap-3 mb-4">
            {registeredArtists.map((artist) => (
              <div
                key={artist.id}
                className="flex items-center gap-3 px-4 py-3 border border-emerald-200 bg-emerald-50/40 rounded-xl"
              >
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden">
                  {artist.type === 'member' && artist.memberAvatar ? (
                    <img src={artist.memberAvatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    (artist.memberName ?? artist.displayName ?? '?')[0]
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">
                    {artist.memberName ?? artist.displayName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {artist.type === 'member' ? t('upload.artistIsMember') : t('upload.artistIsNonMember')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeArtist(artist.id)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors"
                  aria-label={`${artist.memberName ?? artist.displayName} 제거`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add artist form */}
        {addingType === null ? (
          <button
            type="button"
            onClick={() => setAddingType('member')}
            className="w-full min-h-[44px] border-2 border-dashed border-border/60 rounded-xl text-sm font-bold text-primary hover:border-primary hover:bg-primary/5 transition-all py-3"
          >
            {t('upload.addArtist')}
          </button>
        ) : (
          <div className="border-2 border-primary/30 rounded-xl p-4 bg-primary/[0.02]">
            {/* Member / Non-member toggle */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setAddingType('member')}
                className={`flex-1 min-h-[44px] rounded-xl text-sm font-bold border-2 transition-all ${
                  addingType === 'member'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/40'
                }`}
              >
                {t('upload.artistIsMember')}
              </button>
              <button
                type="button"
                onClick={() => setAddingType('non-member')}
                className={`flex-1 min-h-[44px] rounded-xl text-sm font-bold border-2 transition-all ${
                  addingType === 'non-member'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/40'
                }`}
              >
                {t('upload.artistIsNonMember')}
              </button>
            </div>

            {addingType === 'member' ? (
              <div>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder={t('upload.step3aAddMemberNickname')}
                    className="w-full pl-10 pr-4 py-3 border border-border/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                    autoFocus
                  />
                </div>
                {memberSearch && (
                  <div className="border border-border rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    {allArtists
                      .filter((a) =>
                        a.name.toLowerCase().includes(memberSearch.toLowerCase()) &&
                        !registeredArtists.some((r) => r.memberId === a.id)
                      )
                      .slice(0, 8)
                      .map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => addMember(a)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted text-left min-h-[44px] transition-colors"
                        >
                          <img src={a.avatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                          <span className="text-sm font-medium">{a.name}</span>
                        </button>
                      ))}
                    {allArtists.filter((a) =>
                      a.name.toLowerCase().includes(memberSearch.toLowerCase()) &&
                      !registeredArtists.some((r) => r.memberId === a.id)
                    ).length === 0 && (
                      <div className="px-4 py-3 text-sm text-muted-foreground">{t('upload.memberSearchPh')}</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  value={nonMemberName}
                  onChange={(e) => setNonMemberName(e.target.value)}
                  placeholder="이름 입력"
                  className="w-full px-4 py-3 border border-border/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px] mb-2"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && addNonMember()}
                />
                <p className="text-xs text-muted-foreground mb-3">{t('upload.nonMemberNameHint')}</p>
                <Button
                  onClick={addNonMember}
                  disabled={!nonMemberName.trim()}
                  className="w-full min-h-[44px]"
                >
                  추가하기
                </Button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setAddingType(null);
                setMemberSearch('');
                setNonMemberName('');
              }}
              className="w-full text-sm text-muted-foreground mt-3 min-h-[44px] hover:text-foreground transition-colors"
            >
              취소
            </button>
          </div>
        )}

        {/* Group validity warning */}
        {registeredArtists.length > 0 && !groupValid && (
          <p className="text-xs text-amber-700 mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {tn('upload.groupValidityError', { n: String(requiredOthers) })}
          </p>
        )}

        {/* Bottom buttons */}
        <div className="flex flex-col gap-3 mt-8">
          <Button
            disabled={registeredArtists.length === 0 || !groupValid}
            onClick={() => {
              setSubStep('assign');
              setAssigningArtistIdx(0);
              setStep3NeedsReview(false);
            }}
            className={`w-full py-6 text-base font-bold rounded-2xl ${
              registeredArtists.length > 0 && groupValid ? 'bg-foreground text-background hover:bg-foreground/90' : ''
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

  // ── 3B: Assign images ──
  const isLastArtist = assigningArtistIdx === registeredArtists.length - 1;
  const allAssigned = unassigned.length === 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-in fade-in duration-300">
      {/* Artist progress indicator */}
      <div className="flex gap-1 mb-3">
        {registeredArtists.map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full transition-colors ${
              i <= assigningArtistIdx ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground mb-4 text-center">
        {tn('upload.step3Progress', {
          current: String(assigningArtistIdx + 1),
          total: String(registeredArtists.length),
        })}
      </p>

      {/* Current artist card */}
      {currentArtist && (
        <div className="flex items-center gap-3 px-4 py-3 bg-primary/10 border-2 border-primary rounded-xl mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold flex-shrink-0 overflow-hidden">
            {currentArtist.type === 'member' && currentArtist.memberAvatar ? (
              <img src={currentArtist.memberAvatar} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              (currentArtist.memberName ?? currentArtist.displayName ?? '?')[0]
            )}
          </div>
          <div>
            <p className="font-bold text-primary">
              {currentArtist.memberName ?? currentArtist.displayName}
            </p>
            <p className="text-xs text-muted-foreground">{t('upload.step3AssignTitle')}</p>
          </div>
        </div>
      )}

      {/* Image grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {validContents.map((c) => {
          const isSelected = selectedForCurrent.has(c.id);
          const isAssignedElsewhere =
            !isSelected &&
            (!!c.artist || !!c.nonMemberArtist?.displayName || c.artistType === 'unknown');
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => !isAssignedElsewhere && toggleImageForArtist(c.id)}
              disabled={isAssignedElsewhere}
              className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                isSelected
                  ? 'border-primary ring-2 ring-primary/20'
                  : isAssignedElsewhere
                  ? 'border-border/30 opacity-40 cursor-not-allowed'
                  : 'border-border/60 hover:border-primary/50 cursor-pointer'
              }`}
            >
              <ImageWithFallback src={c.url!} alt="" className="w-full h-full object-contain" />
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-md">
                  <Check className="h-3.5 w-3.5 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-primary font-semibold text-center mb-6">
        {tn('upload.selectedCount', { n: String(selectedForCurrent.size) })}
      </p>

      {/* Unassigned warning (last artist only) */}
      {isLastArtist && !allAssigned && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 mb-4">
          {t('upload.unassignedWarning')}
        </div>
      )}

      {/* Bottom buttons */}
      <div className="flex flex-col gap-3">
        {isLastArtist ? (
          <Button
            disabled={!allAssigned}
            onClick={onNext}
            className={`w-full py-6 text-base font-bold rounded-2xl ${
              allAssigned ? 'bg-foreground text-background hover:bg-foreground/90' : ''
            }`}
          >
            {t('upload.step3AssignComplete')} →
          </Button>
        ) : (
          <Button
            onClick={() => setAssigningArtistIdx((prev) => prev + 1)}
            className="w-full py-6 text-base font-bold rounded-2xl bg-foreground text-background hover:bg-foreground/90"
          >
            {t('upload.step3AssignNext')}
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => {
            setSubStep('register');
            setAssigningArtistIdx(0);
          }}
          className="w-full min-h-[44px]"
        >
          {t('upload.wizardBack')} (작가 목록으로)
        </Button>
      </div>
    </div>
  );
}
