import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera } from 'lucide-react';
import { profileStore } from '../store';
import { artists } from '../data';
import { pointsOnOnboardingStep1Complete } from '../utils/pointsBackground';
import { matchSmsInviteOnSignup } from '../utils/inviteMessaging';
import { isEmailRegistered, isPhoneRegistered, registerAccount } from '../utils/registeredAccounts';
import { toast } from 'sonner';
import { useI18n } from '../i18n/I18nProvider';
import { containsProfanity } from '../utils/profanityFilter';
import { Button } from '../components/ui/button';

const TOTAL_STEPS = 3;
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
  /** SMS 초대로 들어온 경우 초대 시 표시명(ExhibitionInviteLanding에서 전달) */
  const prefilledRealName = (() => {
    if (typeof window === 'undefined') return '';
    try { return localStorage.getItem('artier_pending_signup_realname') || ''; } catch { return ''; }
  })();
  const [realName, setRealName] = useState(prefilledRealName);
  const [realNameError, setRealNameError] = useState('');
  /** SMS 초대로 들어온 경우 초대받은 전화번호(ExhibitionInviteLanding에서 전달) */
  const prefilledPhone = (() => {
    if (typeof window === 'undefined') return '';
    try { return localStorage.getItem('artier_pending_signup_phone') || ''; } catch { return ''; }
  })();
  const [phone, setPhone] = useState(prefilledPhone);
  const [phoneError, setPhoneError] = useState('');
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
    setNicknameError('');
    return true;
  };

  const validateRealName = (): boolean => {
    const trimmed = realName.trim();
    if (trimmed.length === 0) {
      setRealNameError(
        isInviteFlow
          ? t('onboarding.errRealNameRequiredInvite')
          : t('onboarding.errRealNameRequiredSocial'),
      );
      return false;
    }
    if (trimmed.length < 2) {
      setRealNameError(t('onboarding.errRealNameShort'));
      return false;
    }
    setRealNameError('');
    return true;
  };

  const validatePhone = (): boolean => {
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
    const realOk = validateRealName();
    const phoneOk = validatePhone();
    const emailOk = validateEmail();
    if (!nickOk || !realOk || !phoneOk || !emailOk) return;
    pointsOnOnboardingStep1Complete();
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

  const finishOnboarding = async () => {
    const name = nickname.trim();
    const real = realName.trim();
    if (name && containsProfanity(name)) {
      toast.error(t('onboarding.errProfanityNickname'));
      return;
    }
    if (real && containsProfanity(real)) {
      toast.error(t('onboarding.errProfanityRealName'));
      return;
    }
    profileStore.updateProfile({
      name,
      nickname: name,
      ...(real ? { realName: real } : {}),
      ...(phone.trim() ? { phone: phone.trim() } : {}),
      ...(email.trim() ? { email: email.trim() } : {}),
      ...(profileImage ? { avatarUrl: profileImage } : {}),
    });
    if (phone.trim() && real) {
      const me = artists[0];
      const result = matchSmsInviteOnSignup(phone.trim(), real, {
        id: me.id,
        name: name || me.name,
        avatar: profileImage || me.avatar,
      });
      if (result.matched > 0) {
        toast.success(`초대받은 작품 ${result.matched}개가 내 계정과 연결되었어요.`);
      }
      // 자동 매칭 성공한 각 건에 대해 "초대한 작가"에게 연결 알림.
      // 데모 환경에선 pushDemoNotification이 현재 세션(= 사용자 본인)에 쌓이므로
      // 단일 데모 사용자 관점에서 Loop 확인 가능. Policy §3.5.
      for (const detail of result.promotedDetails) {
        try {
          const { pushDemoNotification } = await import('../utils/pushDemoNotification');
          pushDemoNotification({
            type: 'system',
            message: t('invite.notifAutoMatched')
              .replace('{name}', detail.invitedName)
              .replace('{title}', detail.workTitle),
            workId: detail.workId,
          });
        } catch { /* ignore */ }
      }
      /**
       * 전화는 일치했으나 이름이 달라 매칭이 거부된 초대가 있으면,
       * 본인 확인 모달을 띄우기 위해 sessionStorage에 저장한다.
       * (가입 직후 홈 도착 시 `PendingInviteClaimGate`가 읽어 모달 오픈)
       */
      if (result.blockedList.length > 0) {
        try {
          sessionStorage.setItem(
            'artier_pending_invite_claims',
            JSON.stringify(result.blockedList),
          );
        } catch { /* ignore */ }
      }
    }
    registerAccount(email.trim(), phone.trim());
    localStorage.setItem('artier_onboarding_done', 'true');
    try {
      localStorage.removeItem('artier_pending_sms_invite');
      localStorage.removeItem('artier_pending_signup_nickname');
      localStorage.removeItem('artier_pending_social_signup');
      localStorage.removeItem('artier_pending_signup_email');
      localStorage.removeItem('artier_pending_signup_phone');
      localStorage.removeItem('artier_pending_signup_realname');
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

              {/* Step 1: 프로필 설정 (닉네임 + 이미지 + 소개) */}
              {currentStep === 1 && (
                <>
                  <h2 className="text-lg font-bold text-foreground mb-1">{t('onboarding.nicknameTitle')}</h2>
                  <p className="text-sm text-muted-foreground mb-4">{t('onboarding.nicknameLead')}</p>
                  {(isInviteFlow || isSocialSignup) && (
                    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                      {isSocialSignup ? t('onboarding.socialNotice') : t('onboarding.inviteNotice')}
                    </div>
                  )}

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

                  {/* 실명 */}
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('onboarding.realNameLabel')}
                    <span className="ml-1 text-xs font-medium text-red-500">{t('common.required')}</span>
                  </label>
                  <input
                    type="text"
                    value={realName}
                    onChange={e => { if (e.target.value.length <= 20) { setRealName(e.target.value); setRealNameError(''); } }}
                    placeholder={t('onboarding.realNamePlaceholder')}
                    className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    maxLength={20}
                    autoFocus
                  />
                  {realNameError ? <p className="mt-1 text-sm text-destructive">{realNameError}</p> : null}

                  {/* 닉네임 */}
                  <label className="block text-sm font-medium text-foreground mb-2 mt-5">{t('onboarding.nicknameLabel')}</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={e => { if (e.target.value.length <= 20) { setNickname(e.target.value); setNicknameError(''); } }}
                    placeholder={t('onboarding.nicknamePlaceholder')}
                    className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    maxLength={20}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">{nickname.trim().length}/20</p>
                  {nicknameError ? <p className="mt-1 text-sm text-destructive">{nicknameError}</p> : null}

                  {/* 전화번호 */}
                  <label className="block text-sm font-medium text-foreground mb-2 mt-5">
                    {t('onboarding.phoneLabel')}
                    <span className="ml-1 text-xs font-medium text-red-500">{t('common.required')}</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => { setPhone(e.target.value); setPhoneError(''); }}
                    placeholder={t('onboarding.phonePlaceholder')}
                    className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  {phoneError ? <p className="mt-1 text-sm text-destructive">{phoneError}</p> : null}
                  <p className="mt-1 text-xs text-muted-foreground">{t('onboarding.phoneHint')}</p>

                  {/* 이메일 */}
                  <label className="block text-sm font-medium text-foreground mb-2 mt-5">
                    {t('onboarding.emailLabel')}
                    <span className="ml-1 text-xs font-medium text-red-500">{t('common.required')}</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                    placeholder={t('onboarding.emailPlaceholder')}
                    className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  {emailError ? <p className="mt-1 text-sm text-destructive">{emailError}</p> : null}
                  <p className="mt-1 text-xs text-muted-foreground">{t('onboarding.emailHint')}</p>

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

              {/* Step 2: 첫 작품 업로드 유도 + 완료 */}
              {currentStep === 2 && (
                <>
                  <div className="text-center">
                    <div className="relative mx-auto mb-6 h-28 w-28">
                      <ConfettiBurst />
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-2">{t('onboarding.doneTitle')}</h2>
                    <p className="text-sm text-muted-foreground mb-8">
                      {t('onboarding.doneWelcome').replace('{name}', nickname.trim())}
                    </p>
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
