import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera } from 'lucide-react';
import { profileStore, workStore } from '../store';
import { artists } from '../data';
import type { Work } from '../data';
import { pointsOnOnboardingStep1Complete } from '../utils/pointsBackground';
import {
  getInviteToken,
  connectMemberToSlot,
  type InviteToken,
} from '../utils/inviteTokenStore';
import { isEmailRegistered, registerAccount } from '../utils/registeredAccounts';
import { toast } from 'sonner';
import { useI18n } from '../i18n/I18nProvider';
import { containsProfanity } from '../utils/profanityFilter';
import { Button } from '../components/ui/button';
import { openConfirm } from '../components/ConfirmDialog';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { imageUrls } from '../imageUrls';
import { getAllImages } from '../utils/imageHelper';

const TOTAL_STEPS = 4;
const ACCENT = '#171717';

type ClaimableSlot = {
  pieceIndex: number;
  imageSrc: string;
  displayName: string;
  pieceTitle: string;
};

function buildClaimableSlots(work: Work, t: (k: string) => string): ClaimableSlot[] {
  const images = getAllImages(work.image);
  const slots = Array.isArray(work.imageArtists) ? work.imageArtists : [];
  const titles = Array.isArray(work.imagePieceTitles) ? work.imagePieceTitles : [];
  const out: ClaimableSlot[] = [];
  slots.forEach((slot, idx) => {
    if (!slot || slot.type !== 'non-member') return;
    const imgKey = images[idx] || images[0] || '';
    const imageSrc = imageUrls[imgKey] || imgKey;
    const displayName = (slot.displayName || '').trim() || t('claim.findMyWorksTitle');
    const pieceTitle = (titles[idx] || '').trim() || t('invite.fallbackPieceIndex').replace('{n}', String(idx + 1));
    out.push({ pieceIndex: idx, imageSrc, displayName, pieceTitle });
  });
  return out;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);
  /** 소셜 가입 직후 prefill된 닉네임 (Login에서 `artier_pending_signup_nickname`로 전달) */
  const prefilledNickname = (() => {
    if (typeof window === 'undefined') return '';
    try { return localStorage.getItem('artier_pending_signup_nickname') || ''; } catch { return ''; }
  })();
  const [nickname, setNickname] = useState(prefilledNickname);
  const [nicknameError, setNicknameError] = useState('');
  /** 이메일 가입(Signup) 또는 소셜 가입(Login) 직후 provider에서 받은 이메일 */
  const prefilledEmail = (() => {
    if (typeof window === 'undefined') return '';
    try { return localStorage.getItem('artier_pending_signup_email') || ''; } catch { return ''; }
  })();
  const [email, setEmail] = useState(prefilledEmail);
  const [emailError, setEmailError] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * 초대 토큰 핸드오프 (Policy §3 v2.14).
   * `ExhibitionInviteLanding` → 가입 CTA 클릭 시 sessionStorage `artier_pending_invite_token`에 저장.
   * Step 2 닉네임 입력 후 "다음" → 토큰으로 전시 조회 → non-member 슬롯 카드 노출.
   */
  const [pendingToken, setPendingToken] = useState<InviteToken | null>(null);
  const [claimWork, setClaimWork] = useState<Work | null>(null);
  const [claimableSlots, setClaimableSlots] = useState<ClaimableSlot[]>([]);
  const [showClaimScreen, setShowClaimScreen] = useState(false);
  const [claimBusy, setClaimBusy] = useState(false);
  const [claimedTitle, setClaimedTitle] = useState<string | null>(null);

  // workStore 변경 구독: 다른 가입자가 동시에 슬롯을 가져갔을 때 카드 새로고침
  useEffect(() => {
    if (!claimWork) return;
    const unsubscribe = workStore.subscribe(() => {
      const fresh = workStore.getWork(claimWork.id);
      if (!fresh) {
        setClaimableSlots([]);
        return;
      }
      setClaimWork(fresh);
      setClaimableSlots(buildClaimableSlots(fresh, t));
    });
    return unsubscribe;
  }, [claimWork, t]);

  /**
   * 소셜 첫 가입자. 배너 문구 + 이메일 필수 여부에 사용.
   */
  const isSocialSignup = useMemo(() => {
    if (typeof window === 'undefined') return false;
    try { return !!localStorage.getItem('artier_pending_social_signup'); } catch { return false; }
  }, []);

  /** 초대 토큰으로 들어온 가입자 (배너 문구용) */
  const isInviteFlow = useMemo(() => {
    if (typeof window === 'undefined') return false;
    try { return !!sessionStorage.getItem('artier_pending_invite_token'); } catch { return false; }
  }, []);

  const goNext = useCallback(() => {
    setCurrentStep(s => Math.min(s + 1, TOTAL_STEPS - 1));
  }, []);

  const goBack = useCallback(() => {
    setCurrentStep(s => Math.max(s - 1, 0));
  }, []);

  const validateNickname = (): boolean => {
    const trimmed = nickname.trim();
    if (trimmed.length < 2) {
      setNicknameError(t('onboarding.errNicknameShort'));
      return false;
    }
    if (trimmed.length > 20) {
      setNicknameError(t('onboarding.errNicknameLong'));
      return false;
    }
    if (containsProfanity(trimmed)) {
      setNicknameError(t('onboarding.errProfanityNickname'));
      return false;
    }
    setNicknameError('');
    return true;
  };

  const validateEmail = (): boolean => {
    const trimmed = email.trim();
    if (trimmed.length === 0) {
      setEmailError(t('onboarding.errEmailRequired'));
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError(t('onboarding.errEmailInvalid'));
      return false;
    }
    if (isEmailRegistered(trimmed) && trimmed.toLowerCase() !== prefilledEmail.trim().toLowerCase()) {
      setEmailError(t('onboarding.errEmailRegistered'));
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleNicknameNext = () => {
    if (!validateNickname()) return;
    pointsOnOnboardingStep1Complete();

    // 초대 토큰 핸드오프 평가
    let tokenStr: string | null = null;
    try { tokenStr = sessionStorage.getItem('artier_pending_invite_token'); } catch { /* ignore */ }
    if (tokenStr) {
      const tok = getInviteToken(tokenStr);
      if (tok && tok.status === 'active') {
        const work = workStore.getWork(tok.workId);
        if (work) {
          const slots = buildClaimableSlots(work, t);
          if (slots.length > 0) {
            setPendingToken(tok);
            setClaimWork(work);
            setClaimableSlots(slots);
            setShowClaimScreen(true);
            return;
          }
        }
      }
    }
    goNext();
  };

  const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      toast.error(t('onboarding.errImageTooLarge'));
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setProfileImage(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  /** 본인 작품 카드 클릭 — 확인 다이얼로그 후 즉시 'member'로 승격 (Policy §3 v2.14). */
  const handleClaimSlot = async (slot: ClaimableSlot) => {
    if (!claimWork || claimBusy) return;
    const ok = await openConfirm({
      title: t('claim.confirmTitle').replace('{slotDisplayName}', slot.displayName),
      description: t('claim.confirmBody'),
      confirmLabel: t('claim.confirmYes'),
    });
    if (!ok) return;

    setClaimBusy(true);
    const me = artists[0];
    const result = connectMemberToSlot(claimWork.id, slot.pieceIndex, {
      id: me.id,
      name: nickname.trim() || me.name,
      avatar: profileImage || me.avatar,
    });

    if (!result.ok) {
      // race: 다른 가입자가 먼저 가져갔거나 이미 회원 슬롯이 됨 → 카드 새로고침
      const fresh = workStore.getWork(claimWork.id);
      if (fresh) {
        setClaimWork(fresh);
        setClaimableSlots(buildClaimableSlots(fresh, t));
      } else {
        setClaimableSlots([]);
      }
      toast.error(t('claim.alreadyTaken'));
      setClaimBusy(false);
      return;
    }

    try {
      const { pushDemoNotification } = await import('../utils/pushDemoNotification');
      pushDemoNotification({
        type: 'invite',
        message: t('invite.notifAutoMatched')
          .replace('{name}', slot.displayName)
          .replace('{title}', claimWork.exhibitionName?.trim() || claimWork.title || t('work.exhibitionFallback')),
        workId: claimWork.id,
      });
    } catch { /* ignore */ }

    setClaimedTitle(claimWork.exhibitionName?.trim() || claimWork.title || t('work.exhibitionFallback'));
    setShowClaimScreen(false);
    setClaimBusy(false);
    try { sessionStorage.removeItem('artier_pending_invite_token'); } catch { /* ignore */ }
    goNext();
  };

  /** "여기 없어요" — 가입은 계속 진행, 토큰 정리. */
  const handleClaimSkip = () => {
    setShowClaimScreen(false);
    try { sessionStorage.removeItem('artier_pending_invite_token'); } catch { /* ignore */ }
    goNext();
  };

  const finishOnboarding = () => {
    const name = nickname.trim();
    if (name && containsProfanity(name)) {
      toast.error(t('onboarding.errProfanityNickname'));
      return;
    }
    // 이메일은 소셜·이메일 가입에서 prefill된 경우만 검증 (Policy §2.1)
    if (email.trim() && !validateEmail()) return;
    profileStore.updateProfile({
      name,
      nickname: name,
      ...(email.trim() ? { email: email.trim() } : {}),
      ...(profileImage ? { avatarUrl: profileImage } : {}),
    });
    registerAccount(email.trim(), '');
    localStorage.setItem('artier_onboarding_done', 'true');
    try {
      localStorage.removeItem('artier_pending_signup_nickname');
      localStorage.removeItem('artier_pending_social_signup');
      localStorage.removeItem('artier_pending_signup_email');
    } catch { /* ignore */ }
    try { sessionStorage.removeItem('artier_pending_invite_token'); } catch { /* ignore */ }
    navigate('/');
  };

  const progress = ((currentStep + 1) / TOTAL_STEPS) * 100;
  const welcomeTitle = t('onboarding.welcomeTitle').replace('{brand}', t('brand.name'));

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div
        className="shrink-0 px-4 pt-4 sm:px-6"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))' }}
      >
        <div className="mx-auto max-w-lg">
          <div
            className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden"
            role="progressbar"
            aria-valuenow={currentStep + 1}
            aria-valuemin={1}
            aria-valuemax={TOTAL_STEPS}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: ACCENT }}
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', stiffness: 140, damping: 22 }}
            />
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {currentStep + 1} / {TOTAL_STEPS}
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 pb-24">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${currentStep}-${showClaimScreen ? 'claim' : 'main'}`}
              className="w-full"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
            <div className="rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-sm">
              {currentStep === 0 && (
                <>
                  <div className="text-center">
                    <img
                      src="/logo.png"
                      alt="Artier Logo"
                      className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl shadow-md object-contain"
                    />
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">{welcomeTitle}</h1>
                    <p className="text-sm text-muted-foreground mb-8">{t('onboarding.welcomeLead')}</p>
                    <Button
                      type="button"
                      onClick={goNext}
                      className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition lg:hover:opacity-90 active:scale-[0.99]"
                      style={{ backgroundColor: ACCENT }}
                    >
                      {t('onboarding.start')}
                    </Button>
                  </div>
                </>
              )}

              {/* Step 1: '전시 단위' 개념 안내 */}
              {currentStep === 1 && (
                <>
                  <div className="text-center mb-6">
                    <h2 className="text-lg sm:text-xl font-bold text-foreground mb-2">
                      {t('onboarding.conceptTitle')}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {t('onboarding.conceptLead')}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/30 p-3 mb-3">
                    <div className="aspect-[4/3] rounded-lg overflow-hidden mb-2 bg-gradient-to-br from-stone-100 via-amber-50 to-rose-100" />
                    <p className="text-sm font-semibold text-foreground">
                      {t('onboarding.conceptExampleSoloTitle')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('onboarding.conceptExampleSoloMeta')}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/30 p-3 mb-6">
                    <div className="grid grid-cols-3 gap-1 aspect-[4/3] rounded-lg overflow-hidden mb-2">
                      <div className="bg-gradient-to-br from-amber-100 to-amber-200" />
                      <div className="bg-gradient-to-br from-rose-100 to-rose-200" />
                      <div className="bg-gradient-to-br from-emerald-100 to-emerald-200" />
                      <div className="bg-gradient-to-br from-sky-100 to-sky-200" />
                      <div className="bg-gradient-to-br from-violet-100 to-violet-200" />
                      <div className="bg-gradient-to-br from-stone-100 to-stone-300" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {t('onboarding.conceptExampleMultiTitle')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('onboarding.conceptExampleMultiMeta')}
                    </p>
                  </div>

                  <p className="text-center text-sm text-foreground/80 mb-6 leading-relaxed whitespace-pre-line">
                    {t('onboarding.conceptReinforce')}
                  </p>

                  <div className="flex gap-3">
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={goBack}
                      className="flex-1 rounded-xl border border-border py-3.5 text-sm font-semibold text-foreground lg:hover:bg-muted/50"
                    >
                      {t('onboarding.back')}
                    </Button>
                    <Button
                      type="button"
                      onClick={goNext}
                      className="flex-1 rounded-xl py-3.5 text-sm font-semibold text-white transition lg:hover:opacity-90"
                      style={{ backgroundColor: ACCENT }}
                    >
                      {t('onboarding.next')}
                    </Button>
                  </div>
                </>
              )}

              {/* Step 2A: 본인 작품 찾기 (토큰 기반, 조건부) */}
              {currentStep === 2 && showClaimScreen && pendingToken && (
                <>
                  <h2 className="text-lg font-bold text-foreground mb-2">{t('claim.findMyWorksTitle')}</h2>
                  <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 leading-relaxed">
                    {t('claim.findMyWorksWarning')}
                  </div>

                  {claimableSlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">
                      {t('claim.alreadyTaken')}
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {claimableSlots.map((slot) => (
                        <button
                          key={slot.pieceIndex}
                          type="button"
                          disabled={claimBusy}
                          onClick={() => handleClaimSlot(slot)}
                          className="group text-left rounded-xl overflow-hidden border border-border lg:hover:border-primary/50 transition disabled:opacity-50"
                        >
                          <div className="aspect-square bg-muted/30">
                            <ImageWithFallback
                              src={slot.imageSrc}
                              alt={slot.pieceTitle}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="px-3 py-2">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {slot.displayName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {slot.pieceTitle}
                            </p>
                            <p className="mt-1 text-xs text-primary font-medium">
                              {t('claim.thisIsMine')}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    type="button"
                    onClick={handleClaimSkip}
                    disabled={claimBusy}
                    className="w-full rounded-xl border border-border py-3.5 text-sm font-semibold text-foreground lg:hover:bg-muted/50"
                  >
                    {t('claim.notHere')}
                  </Button>
                </>
              )}

              {/* Step 2B: 프로필 설정 */}
              {currentStep === 2 && !showClaimScreen && (
                <>
                  <h2 className="text-lg font-bold text-foreground mb-1">{t('onboarding.nicknameTitle')}</h2>
                  <p className="text-sm text-muted-foreground mb-4">{t('onboarding.nicknameLead')}</p>
                  {(() => {
                    const noticeText = isSocialSignup
                      ? t('onboarding.socialNotice')
                      : isInviteFlow
                        ? t('onboarding.inviteNotice')
                        : prefilledNickname
                          ? t('onboarding.emailSignupNotice')
                          : null;
                    return noticeText ? (
                      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                        {noticeText}
                      </div>
                    ) : null;
                  })()}

                  {/* 프로필 이미지 */}
                  <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
                  <div className="flex items-center gap-4 mb-6">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="group shrink-0">
                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-muted/30 transition lg:group-hover:border-primary/50">
                        {profileImage ? (
                          <img src={profileImage} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Camera className="h-6 w-6 text-muted-foreground/40" strokeWidth={1.25} />
                        )}
                      </div>
                    </button>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm text-primary lg:hover:underline">
                      {t('onboarding.uploadPhoto')}
                    </button>
                  </div>

                  {/* 닉네임 */}
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('onboarding.nicknameLabel')}
                    <span className="ml-1 text-xs font-medium text-red-500">{t('common.required')}</span>
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={e => { if (e.target.value.length <= 20) { setNickname(e.target.value); setNicknameError(''); } }}
                    placeholder={t('onboarding.nicknamePlaceholder')}
                    className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:ring-[3px] focus:ring-primary/30 focus:border-primary"
                    maxLength={20}
                    autoFocus
                  />
                  <p className="mt-1 text-xs text-muted-foreground">{nickname.trim().length}/20</p>
                  {nicknameError ? <p className="mt-1 text-sm text-destructive">{nicknameError}</p> : null}

                  <div className="mt-8 flex gap-3">
                    <Button variant="ghost" type="button" onClick={goBack} className="flex-1 rounded-xl border border-border py-3.5 text-sm font-semibold text-foreground lg:hover:bg-muted/50">
                      {t('onboarding.back')}
                    </Button>
                    <Button type="button" onClick={handleNicknameNext} className="flex-1 rounded-xl py-3.5 text-sm font-semibold text-white transition lg:hover:opacity-90" style={{ backgroundColor: ACCENT }}>
                      {t('onboarding.next')}
                    </Button>
                  </div>
                </>
              )}

              {/* Step 3: 첫 작품 업로드 유도 + 완료 */}
              {currentStep === 3 && (
                <>
                  <div className="text-center">
                    <div className="relative mx-auto mb-6 h-28 w-28">
                      <ConfettiBurst />
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-2">{t('onboarding.doneTitle')}</h2>
                    <p className="text-sm text-muted-foreground mb-4 whitespace-pre-line leading-relaxed">
                      {t('onboarding.doneWelcome').replace('{name}', nickname.trim())}
                    </p>
                    {claimedTitle && (
                      <div className="mb-8 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-left">
                        <p className="text-sm font-semibold text-foreground mb-1">
                          {t('claim.doneTitle')}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {t('claim.doneBody').replace('{title}', claimedTitle)}
                        </p>
                      </div>
                    )}
                    {!claimedTitle && <div className="mb-8" />}
                    <Button
                      type="button"
                      onClick={() => { finishOnboarding(); navigate('/upload'); }}
                      className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition lg:hover:opacity-90"
                      style={{ backgroundColor: ACCENT }}
                    >
                      {t('onboarding.uploadFirst')}
                    </Button>
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={finishOnboarding}
                      className="mt-3 w-full text-sm text-muted-foreground lg:hover:text-foreground"
                    >
                      {t('onboarding.browseStart')}
                    </Button>
                  </div>
                </>
              )}
            </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ConfettiBurst() {
  const pieces = [
    { c: '#171717', x: -28, y: -8, r: 6, delay: 0 },
    { c: '#525252', x: 32, y: 4, r: 5, delay: 0.05 },
    { c: '#A3A3A3', x: -12, y: 28, r: 4, delay: 0.1 },
    { c: '#262626', x: 40, y: -20, r: 4, delay: 0.08 },
    { c: '#404040', x: 8, y: -36, r: 5, delay: 0.12 },
    { c: '#D4D4D4', x: -40, y: 16, r: 3, delay: 0.15 },
  ];
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div
        className="absolute flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground shadow-lg"
      >
        ✓
      </div>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece absolute rounded-sm"
          style={{
            width: p.r * 2,
            height: p.r * 2,
            backgroundColor: p.c,
            left: '50%',
            top: '50%',
            marginLeft: -p.r,
            marginTop: -p.r,
            animationDelay: `${p.delay}s`,
            ['--tx' as string]: `${p.x}px`,
            ['--ty' as string]: `${p.y}px`,
          }}
        />
      ))}
    </div>
  );
}
