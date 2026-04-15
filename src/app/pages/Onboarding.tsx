import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera } from 'lucide-react';
import { profileStore } from '../store';
import { artists } from '../data';
import { pointsOnOnboardingStep1Complete } from '../utils/pointsBackground';
import { matchSmsInviteOnSignup } from '../utils/inviteMessaging';
import { toast } from 'sonner';
import { useI18n } from '../i18n/I18nProvider';
import { Button } from '../components/ui/button';

const TOTAL_STEPS = 3;
const ACCENT = '#171717';

export default function Onboarding() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);
  const [nickname, setNickname] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [realName, setRealName] = useState('');
  const [realNameError, setRealNameError] = useState('');
  const [phone, setPhone] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (trimmed.length < 2) {
      setRealNameError(t('onboarding.errRealNameShort'));
      return false;
    }
    setRealNameError('');
    return true;
  };

  const handleNicknameNext = () => {
    const nickOk = validateNickname();
    const realOk = validateRealName();
    if (!nickOk || !realOk) return;
    pointsOnOnboardingStep1Complete();
    goNext();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setProfileImage(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const finishOnboarding = () => {
    const name = nickname.trim();
    const real = realName.trim();
    profileStore.updateProfile({
      name,
      nickname: name,
      realName: real,
      ...(phone.trim() ? { phone: phone.trim() } : {}),
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
    }
    localStorage.setItem('artier_onboarding_done', 'true');
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
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => {
                        localStorage.setItem('artier_onboarding_done', 'true');
                        navigate('/');
                      }}
                      className="mt-4 w-full text-center text-sm text-muted-foreground lg:hover:text-muted-foreground transition-colors"
                    >
                      {t('onboarding.later')}
                    </Button>
                  </div>
                </>
              )}

              {/* Step 1: 프로필 설정 (닉네임 + 이미지 + 소개) */}
              {currentStep === 1 && (
                <>
                  <h2 className="text-lg font-bold text-foreground mb-1">{t('onboarding.nicknameTitle')}</h2>
                  <p className="text-sm text-muted-foreground mb-6">{t('onboarding.nicknameLead')}</p>

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
                  <label className="block text-sm font-medium text-foreground mb-2">{t('onboarding.realNameLabel')}</label>
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
                  <label className="block text-sm font-medium text-foreground mb-2 mt-5">{t('onboarding.phoneLabel')}</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder={t('onboarding.phonePlaceholder')}
                    className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">{t('onboarding.phoneHint')}</p>

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
