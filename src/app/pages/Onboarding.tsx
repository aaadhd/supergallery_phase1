import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera } from 'lucide-react';
import { profileStore } from '../store';
import { artists } from '../data';
import { pointsOnOnboardingStep1Complete } from '../utils/pointsBackground';
import {
  findMatchCandidates,
  applyConfirmedMatches,
  recordDeclinedMatches,
  type MatchCandidate,
  type PromotedInviteDetail,
} from '../utils/inviteMessaging';
import { isEmailRegistered, isPhoneRegistered, registerAccount } from '../utils/registeredAccounts';
import { toast } from 'sonner';
import { useI18n } from '../i18n/I18nProvider';
import { containsProfanity } from '../utils/profanityFilter';
import { Button } from '../components/ui/button';
import { InviteClaimCheck } from '../components/InviteClaimCheck';

const TOTAL_STEPS = 4;
const ACCENT = '#171717';

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
  /** SMS 초대로 들어온 경우 초대받은 전화번호(ExhibitionInviteLanding에서 전달) */
  const prefilledPhone = (() => {
    if (typeof window === 'undefined') return '';
    try { return localStorage.getItem('artier_pending_signup_phone') || ''; } catch { return ''; }
  })();
  const [phone, setPhone] = useState(prefilledPhone);
  const [phoneError, setPhoneError] = useState('');
  /**
   * 전화번호 입력 노출 여부.
   * Policy §2.1: 전화번호는 가입 후 Settings에서 추가하는 선택 항목이므로 일반 가입자에겐 묻지 않는다.
   * 단, SMS 비회원 초대 링크로 들어와 전화번호가 프리필된 경우(USR-EXH-03)에는 본인 확인을 위해 노출 유지.
   */
  const collectsPhone = !!prefilledPhone;
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
   * §3.5.1 본인 확인 단계 (조건부).
   * Step 2(profile) 완료 시 매칭 후보가 있으면 본인 확인 화면을 같은 step 자리에 노출한다.
   */
  const [matchCandidates, setMatchCandidates] = useState<MatchCandidate[] | null>(null);
  const [claimBusy, setClaimBusy] = useState(false);
  const [matchedCount, setMatchedCount] = useState(0);

  /**
   * SMS 비회원 초대로 들어온 사용자. 배너 문구와 매칭 성공 안내에 사용.
   * - 플래그 설정: `ExhibitionInviteLanding`의 "가입하기" 클릭 시
   */
  const isInviteFlow = (() => {
    if (typeof window === 'undefined') return false;
    try { return localStorage.getItem('artier_pending_sms_invite') === '1'; } catch { return false; }
  })();

  /**
   * 소셜 첫 가입자. 배너 문구 + 이메일 필수 여부에 사용.
   * - 플래그 설정: `Login`의 `completeFirstSocialSignup`
   */
  const isSocialSignup = (() => {
    if (typeof window === 'undefined') return false;
    try { return !!localStorage.getItem('artier_pending_social_signup'); } catch { return false; }
  })();

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

  const validatePhone = (): boolean => {
    // 일반 가입자는 전화번호 미수집 — 검증 스킵 (Policy §2.1).
    // SMS 초대로 프리필된 경우만 검증.
    if (!collectsPhone) {
      setPhoneError('');
      return true;
    }
    const trimmed = phone.trim();
    if (trimmed.length === 0) {
      setPhoneError(
        isInviteFlow
          ? t('onboarding.errPhoneRequiredInvite')
          : t('onboarding.errPhoneRequiredSocial'),
      );
      return false;
    }
    const digits = trimmed.replace(/[^0-9]/g, '');
    if (digits.length < 10) {
      setPhoneError(t('onboarding.errPhoneInvalid'));
      return false;
    }
    if (isPhoneRegistered(trimmed)) {
      setPhoneError(t('onboarding.errPhoneRegistered'));
      return false;
    }
    setPhoneError('');
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
    const nickOk = validateNickname();
    const phoneOk = validatePhone();
    if (!nickOk || !phoneOk) return;
    pointsOnOnboardingStep1Complete();

    // §3.5.1 본인 확인 단계 — 입력한 전화번호 기준 매칭 후보가 있으면 같은 step에서 본인 확인 화면을 띄운다
    const phoneTrim = phone.trim();
    if (phoneTrim) {
      const candidates = findMatchCandidates(phoneTrim);
      if (candidates.length > 0) {
        setMatchCandidates(candidates);
        return;
      }
    }
    setMatchCandidates([]);
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

  /** §3.5.1 본인 확인에서 "맞아요" 선택 — 후보 전체를 회원 슬롯으로 승격하고 발신자에게 알림. */
  const handleClaimYes = async () => {
    if (!matchCandidates || matchCandidates.length === 0) {
      goNext();
      return;
    }
    setClaimBusy(true);
    const me = artists[0];
    const promoted: PromotedInviteDetail[] = applyConfirmedMatches(matchCandidates, {
      id: me.id,
      name: nickname.trim() || me.name,
      avatar: profileImage || me.avatar,
    });
    try {
      const { pushDemoNotification } = await import('../utils/pushDemoNotification');
      for (const detail of promoted) {
        pushDemoNotification({
          type: 'system',
          message: t('invite.notifAutoMatched')
            .replace('{name}', detail.invitedName)
            .replace('{title}', detail.workTitle),
          workId: detail.workId,
        });
      }
    } catch { /* ignore */ }
    setMatchedCount(promoted.length);
    setClaimBusy(false);
    goNext();
  };

  /** §3.5.1 본인 확인에서 "아니에요" 선택 — 매칭 적용 안 함, 운영팀 신호 + 발신자 알림. */
  const handleClaimNo = async () => {
    if (!matchCandidates || matchCandidates.length === 0) {
      goNext();
      return;
    }
    setClaimBusy(true);
    const result = recordDeclinedMatches(matchCandidates);
    try {
      const { pushDemoNotification } = await import('../utils/pushDemoNotification');
      for (const inv of result.inviters) {
        pushDemoNotification({
          type: 'system',
          message: t('invite.notifClaimDeclined').replace('{title}', inv.workTitle),
          workId: inv.workId,
        });
      }
    } catch { /* ignore */ }
    setClaimBusy(false);
    goNext();
  };

  const finishOnboarding = () => {
    const name = nickname.trim();
    if (name && containsProfanity(name)) {
      toast.error(t('onboarding.errProfanityNickname'));
      return;
    }
    profileStore.updateProfile({
      name,
      nickname: name,
      ...(phone.trim() ? { phone: phone.trim() } : {}),
      ...(email.trim() ? { email: email.trim() } : {}),
      ...(profileImage ? { avatarUrl: profileImage } : {}),
    });
    registerAccount(email.trim(), phone.trim());
    localStorage.setItem('artier_onboarding_done', 'true');
    try {
      localStorage.removeItem('artier_pending_sms_invite');
      localStorage.removeItem('artier_pending_signup_nickname');
      localStorage.removeItem('artier_pending_social_signup');
      localStorage.removeItem('artier_pending_signup_email');
      localStorage.removeItem('artier_pending_signup_phone');
    } catch { /* ignore */ }
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
              key={currentStep}
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

              {/* Step 1: '전시 단위' 개념 안내 (게시판이 아니라 갤러리) */}
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

                  {/* 예시 1: 1점짜리 전시도 어엿한 전시 */}
                  <div className="rounded-xl border border-border bg-muted/30 p-3 mb-3">
                    <div className="aspect-[4/3] rounded-lg overflow-hidden mb-2 bg-gradient-to-br from-stone-100 via-amber-50 to-rose-100" />
                    <p className="text-sm font-semibold text-foreground">
                      {t('onboarding.conceptExampleSoloTitle')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('onboarding.conceptExampleSoloMeta')}
                    </p>
                  </div>

                  {/* 예시 2: 여러 점 전시 — 동일한 형식, 같은 무게로 다뤄짐 */}
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

                  {/* 보강 메시지 — 한 점도 전시라는 핵심 reframe */}
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

              {/* Step 2: 프로필 설정 또는 §3.5.1 본인 확인 (조건부) */}
              {currentStep === 2 && matchCandidates && matchCandidates.length > 0 && (
                <InviteClaimCheck
                  candidates={matchCandidates}
                  onYes={handleClaimYes}
                  onNo={handleClaimNo}
                  busy={claimBusy}
                />
              )}
              {currentStep === 2 && !(matchCandidates && matchCandidates.length > 0) && (
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

                  {/* 전화번호 — SMS 비회원 초대로 들어온 경우만 본인 확인용 노출 (Policy §2.1) */}
                  {collectsPhone && (
                    <>
                      <label className="block text-sm font-medium text-foreground mb-2 mt-5">
                        {t('onboarding.phoneLabel')}
                        <span className="ml-1 text-xs font-medium text-red-500">{t('common.required')}</span>
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => { setPhone(e.target.value); setPhoneError(''); }}
                        placeholder={t('onboarding.phonePlaceholder')}
                        className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:ring-[3px] focus:ring-primary/30 focus:border-primary"
                      />
                      {phoneError ? <p className="mt-1 text-sm text-destructive">{phoneError}</p> : null}
                      {prefilledPhone ? (
                        <p className="mt-1 text-xs text-foreground bg-primary/5 border border-primary/20 rounded-md px-2.5 py-2 leading-relaxed">
                          {t('onboarding.phoneInvitedHint')}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-muted-foreground">{t('onboarding.phoneHint')}</p>
                      )}
                    </>
                  )}

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
                    {matchedCount > 0 && (
                      <div className="mb-8 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-left">
                        <p className="text-sm font-semibold text-foreground mb-1">
                          {t('onboarding.doneInviteMatchedHeadline').replace('{n}', String(matchedCount))}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {t('onboarding.doneInviteMatchedBody')}
                        </p>
                      </div>
                    )}
                    {matchedCount === 0 && <div className="mb-8" />}
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
