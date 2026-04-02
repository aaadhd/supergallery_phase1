import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera } from 'lucide-react';
import { profileStore } from '../store';
import { pointsOnOnboardingStep1Complete } from '../utils/pointsBackground';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';

const INTEREST_TAG_IDS = [
  'painting',
  'drawing',
  'digitalArt',
  'watercolor',
  'oil',
  'acrylic',
  'printmaking',
  'sculpture',
  'photo',
  'illustration',
  'calligraphy',
  'ceramics',
  'craft',
  'textile',
  'other',
] as const;

type InterestTagId = (typeof INTEREST_TAG_IDS)[number];

function tagLabelKey(id: InterestTagId): MessageKey {
  return `onboarding.tag.${id}` as MessageKey;
}

const TOTAL_STEPS = 5;
const ACCENT = '#6366F1';

export default function Onboarding() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);
  const [nickname, setNickname] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const goNext = useCallback(() => {
    setCurrentStep(s => Math.min(s + 1, TOTAL_STEPS - 1));
  }, []);

  const goBack = useCallback(() => {
    setCurrentStep(s => Math.max(s - 1, 0));
  }, []);

  const toggleInterest = (tagId: string) => {
    setSelectedInterests(prev =>
      prev.includes(tagId) ? prev.filter(x => x !== tagId) : [...prev, tagId],
    );
  };

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

  const handleNicknameNext = () => {
    if (!validateNickname()) return;
    pointsOnOnboardingStep1Complete();
    goNext();
  };

  const handleInterestsNext = () => {
    if (selectedInterests.length < 1) return;
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
    profileStore.updateProfile({
      name,
      nickname: name,
      interests: selectedInterests,
      ...(profileImage ? { avatarUrl: profileImage } : {}),
    });
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
            className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden"
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
          <p className="mt-2 text-center text-xs text-zinc-400">
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
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-sm">
              {currentStep === 0 && (
                <>
                  <div className="text-center">
                    <div
                      className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-md"
                      style={{ backgroundColor: ACCENT }}
                    >
                      A
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 mb-2">{welcomeTitle}</h1>
                    <p className="text-sm text-zinc-500 mb-8">{t('onboarding.welcomeLead')}</p>
                    <button
                      type="button"
                      onClick={goNext}
                      className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.99]"
                      style={{ backgroundColor: ACCENT }}
                    >
                      {t('onboarding.start')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.setItem('artier_onboarding_done', 'true');
                        navigate('/');
                      }}
                      className="mt-4 w-full text-center text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      {t('onboarding.later')}
                    </button>
                  </div>
                </>
              )}

              {currentStep === 1 && (
                <>
                  <h2 className="text-lg font-bold text-zinc-900 mb-1">{t('onboarding.nicknameTitle')}</h2>
                  <p className="text-sm text-zinc-500 mb-6">{t('onboarding.nicknameLead')}</p>
                  <label className="block text-sm font-medium text-zinc-800 mb-2">
                    {t('onboarding.nicknameLabel')}
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={e => {
                      const v = e.target.value;
                      if (v.length <= 20) {
                        setNickname(v);
                        setNicknameError('');
                      }
                    }}
                    placeholder={t('onboarding.nicknamePlaceholder')}
                    className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#6366F1]/30 focus:border-[#6366F1]"
                    maxLength={20}
                    autoFocus
                  />
                  <p className="mt-1 text-xs text-zinc-400">{nickname.trim().length}/20</p>
                  {nicknameError ? (
                    <p className="mt-2 text-sm text-red-500">{nicknameError}</p>
                  ) : null}
                  <div className="mt-8 flex gap-3">
                    <button
                      type="button"
                      onClick={goBack}
                      className="flex-1 rounded-xl border border-zinc-200 py-3.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                    >
                      {t('onboarding.back')}
                    </button>
                    <button
                      type="button"
                      onClick={handleNicknameNext}
                      className="flex-1 rounded-xl py-3.5 text-sm font-semibold text-white transition hover:opacity-90"
                      style={{ backgroundColor: ACCENT }}
                    >
                      {t('onboarding.next')}
                    </button>
                  </div>
                </>
              )}

              {currentStep === 2 && (
                <>
                  <h2 className="text-lg font-bold text-zinc-900 mb-1">{t('onboarding.interestsTitle')}</h2>
                  <p className="text-sm text-zinc-500 mb-6">{t('onboarding.interestsLead')}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[min(52vh,420px)] overflow-y-auto pr-1">
                    {INTEREST_TAG_IDS.map(id => {
                      const on = selectedInterests.includes(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => toggleInterest(id)}
                          className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                            on
                              ? 'border-[#6366F1] text-[#6366F1] bg-[#6366F1]/8'
                              : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 bg-white'
                          }`}
                        >
                          {t(tagLabelKey(id))}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-8 flex gap-3">
                    <button
                      type="button"
                      onClick={goBack}
                      className="flex-1 rounded-xl border border-zinc-200 py-3.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                    >
                      {t('onboarding.back')}
                    </button>
                    <button
                      type="button"
                      onClick={handleInterestsNext}
                      disabled={selectedInterests.length < 1}
                      className={`flex-1 rounded-xl py-3.5 text-sm font-semibold transition ${
                        selectedInterests.length >= 1
                          ? 'text-white hover:opacity-90'
                          : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                      }`}
                      style={selectedInterests.length >= 1 ? { backgroundColor: ACCENT } : undefined}
                    >
                      {t('onboarding.next')}
                    </button>
                  </div>
                </>
              )}

              {currentStep === 3 && (
                <>
                  <h2 className="text-lg font-bold text-zinc-900 mb-1">{t('onboarding.photoTitle')}</h2>
                  <p className="text-sm text-zinc-500 mb-8">{t('onboarding.photoLead')}</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                  <div className="flex flex-col items-center gap-6">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="group relative cursor-pointer rounded-full border-0 bg-transparent p-0"
                    >
                      <div
                        className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-zinc-200 bg-zinc-50 transition group-hover:border-[#6366F1]/50"
                      >
                        {profileImage ? (
                          <img src={profileImage} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Camera className="h-10 w-10 text-zinc-300" strokeWidth={1.25} />
                        )}
                      </div>
                    </button>
                    <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-center text-sm font-medium text-[#6366F1] hover:underline"
                      >
                        {t('onboarding.uploadPhoto')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setProfileImage(null)}
                        className="text-sm text-zinc-400 hover:text-zinc-600"
                      >
                        {t('onboarding.skip')}
                      </button>
                    </div>
                  </div>
                  <div className="mt-8 flex gap-3">
                    <button
                      type="button"
                      onClick={goBack}
                      className="flex-1 rounded-xl border border-zinc-200 py-3.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                    >
                      {t('onboarding.back')}
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      className="flex-1 rounded-xl py-3.5 text-sm font-semibold text-white transition hover:opacity-90"
                      style={{ backgroundColor: ACCENT }}
                    >
                      {t('onboarding.next')}
                    </button>
                  </div>
                </>
              )}

              {currentStep === 4 && (
                <>
                  <div className="text-center">
                    <div className="relative mx-auto mb-6 h-28 w-28">
                      <ConfettiBurst />
                    </div>
                    <h2 className="text-xl font-bold text-zinc-900 mb-2">{t('onboarding.doneTitle')}</h2>
                    <p className="text-base text-zinc-600 mb-8">
                      {t('onboarding.doneWelcome').replace('{name}', nickname.trim())}
                    </p>
                    <button
                      type="button"
                      onClick={finishOnboarding}
                      className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition hover:opacity-90"
                      style={{ backgroundColor: ACCENT }}
                    >
                      {t('onboarding.browseStart')}
                    </button>
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
    { c: '#6366F1', x: -28, y: -8, r: 6, delay: 0 },
    { c: '#818CF8', x: 32, y: 4, r: 5, delay: 0.05 },
    { c: '#A5B4FC', x: -12, y: 28, r: 4, delay: 0.1 },
    { c: '#6366F1', x: 40, y: -20, r: 4, delay: 0.08 },
    { c: '#4F46E5', x: 8, y: -36, r: 5, delay: 0.12 },
    { c: '#C7D2FE', x: -40, y: 16, r: 3, delay: 0.15 },
  ];
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div
        className="absolute flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white shadow-lg"
        style={{ backgroundColor: '#6366F1' }}
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
