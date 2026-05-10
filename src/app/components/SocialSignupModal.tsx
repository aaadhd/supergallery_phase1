import { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { isValidDate, meetsMinAge } from '../utils/ageCheck';

export type SocialProvider = 'kakao' | 'google' | 'apple';

export const MOCK_SOCIAL_PROFILE: Record<SocialProvider, { email: string; name: string; avatar: string; birthYear?: string; birthMonth?: string; birthDay?: string }> = {
  kakao: { email: 'demo@kakao.com', name: '카테', avatar: '🟡', birthYear: '1975', birthMonth: '3', birthDay: '15' },
  google: { email: 'demo@gmail.com', name: 'Carte', avatar: '🅖' },
  apple: { email: 'demo@privaterelay.appleid.com', name: 'Carte', avatar: '🍎' },
};

interface Props {
  open: boolean;
  provider: SocialProvider | null;
  onClose: () => void;
  onComplete: (nickname: string, email: string) => void;
}

/**
 * 소셜 첫 가입 시 약관 동의 화면 (SCR-AUTH-03).
 * 이메일 회원가입 화면(Step 3 약관)과 동일 정책.
 */
export function SocialSignupModal({ open, provider, onClose, onComplete }: Props) {
  const { t } = useI18n();
  const profile = useMemo(() => (provider ? MOCK_SOCIAL_PROFILE[provider] : null), [provider]);
  const [nickname, setNickname] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeAge, setAgreeAge] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);

  useEffect(() => {
    if (open && profile) {
      setNickname(profile.name);
      setBirthYear(profile.birthYear ?? '');
      setBirthMonth(profile.birthMonth ?? '');
      setBirthDay(profile.birthDay ?? '');
      setAgreeTerms(false);
      setAgreePrivacy(false);
      setAgreeAge(false);
      setAgreeMarketing(false);
    }
  }, [open, profile]);

  const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const dayOptions = useMemo(() => Array.from({ length: 31 }, (_, i) => i + 1), []);

  const birthFilled = birthYear !== '' && birthMonth !== '' && birthDay !== '';
  const birthValid = birthFilled && isValidDate(Number(birthYear), Number(birthMonth), Number(birthDay));
  const birthMeetsAge = birthValid && meetsMinAge(Number(birthYear), Number(birthMonth), Number(birthDay));

  if (!open || !provider || !profile) return null;

  const allRequired = agreeTerms && agreePrivacy && agreeAge;
  const someRequired = agreeTerms || agreePrivacy || agreeAge;

  const toggleAll = () => {
    const next = !allRequired;
    setAgreeTerms(next);
    setAgreePrivacy(next);
    setAgreeAge(next);
  };

  const canSubmit = allRequired && birthMeetsAge;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="social-signup-title"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 id="social-signup-title" className="text-base font-semibold text-foreground">
            {t('socialSignup.title').replace('{provider}', t(`socialSignup.provider_${provider}`))}
          </h2>
          <Button variant="ghost" size="icon" type="button" onClick={onClose} aria-label={t('socialSignup.close')}>
            <X className="h-4 w-4" />
          </Button>
        </header>

        <div className="space-y-5 px-5 py-5">
          <p className="text-sm text-muted-foreground">{t('socialSignup.guide').replace('{provider}', t(`socialSignup.provider_${provider}`))}</p>
          {/* 소셜 계정 정보 */}
          <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg" aria-hidden>
              {profile.avatar}
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {t(`socialSignup.provider_${provider}`)}
              </p>
              <p className="truncate text-sm font-medium text-foreground">{profile.email}</p>
            </div>
          </div>

          {/* 생년월일 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t('socialSignup.birthLabel')}
              <span className="ml-1 text-xs font-medium text-red-500">(필수)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  aria-label="출생 연도"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                  placeholder="1990"
                  maxLength={4}
                  className="min-h-[44px] w-full rounded-lg border border-border/40 pl-3 pr-8 py-2 text-sm text-foreground bg-white focus-visible:ring-[3px] focus-visible:ring-primary/25 focus-visible:outline-none placeholder:text-muted-foreground/50"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">년</span>
              </div>
              <select
                aria-label="출생 월"
                value={birthMonth}
                onChange={(e) => setBirthMonth(e.target.value)}
                className="min-h-[44px] rounded-lg border border-border/40 px-3 py-2 text-sm text-foreground bg-white focus-visible:ring-[3px] focus-visible:ring-primary/25 focus-visible:outline-none"
              >
                <option value="">월</option>
                {monthOptions.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <select
                aria-label="출생 일"
                value={birthDay}
                onChange={(e) => setBirthDay(e.target.value)}
                className="min-h-[44px] rounded-lg border border-border/40 px-3 py-2 text-sm text-foreground bg-white focus-visible:ring-[3px] focus-visible:ring-primary/25 focus-visible:outline-none"
              >
                <option value="">일</option>
                {dayOptions.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            {birthFilled && !birthMeetsAge && (
              <p className="text-sm text-destructive">만 14세 이상만 가입할 수 있어요.</p>
            )}
          </div>

          {/* 약관 동의 */}
          <div className="space-y-2.5 rounded-lg border border-border/40 p-4 bg-muted/30">
            <label className="mb-1 flex items-start gap-3 border-b border-border/40 pb-2 cursor-pointer">
              <Checkbox
                checked={allRequired ? true : someRequired ? 'indeterminate' : false}
                onCheckedChange={toggleAll}
                className="mt-0.5 border-border/40"
              />
              <span className="text-sm font-semibold text-foreground sm:text-sm">
                {t('socialSignup.agreeAll')}
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox checked={agreeTerms} onCheckedChange={(v) => setAgreeTerms(!!v)} className="mt-0.5" />
              <span className="text-sm text-foreground sm:text-sm">
                <span className="text-red-500">[필수]</span> {t('socialSignup.termsTerms')}{' '}
                (<Link to="/terms" target="_blank" rel="noopener" className="text-primary underline underline-offset-2" onClick={(e) => e.stopPropagation()}>
                  {t('signup.view')}
                </Link>)
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox checked={agreePrivacy} onCheckedChange={(v) => setAgreePrivacy(!!v)} className="mt-0.5" />
              <span className="text-sm text-foreground sm:text-sm">
                <span className="text-red-500">[필수]</span> {t('socialSignup.termsPrivacy')}{' '}
                (<Link to="/privacy" target="_blank" rel="noopener" className="text-primary underline underline-offset-2" onClick={(e) => e.stopPropagation()}>
                  {t('signup.view')}
                </Link>)
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox checked={agreeAge} onCheckedChange={(v) => setAgreeAge(!!v)} className="mt-0.5" />
              <span className="text-sm text-foreground sm:text-sm">
                <span className="text-red-500">[필수]</span> {t('socialSignup.termsAge')}
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox checked={agreeMarketing} onCheckedChange={(v) => setAgreeMarketing(!!v)} className="mt-0.5" />
              <span className="text-sm text-muted-foreground sm:text-sm">
                <span>[선택]</span> {t('socialSignup.termsMarketing')}
                <span className="block mt-0.5 text-xs text-muted-foreground/80">{t('socialSignup.termsMarketingHint')}</span>
              </span>
            </label>
          </div>

          <Button
            type="button"
            disabled={!canSubmit}
            onClick={() => onComplete(nickname.trim(), profile.email)}
            className="h-12 min-h-12 w-full text-base font-medium"
          >
            {t('socialSignup.submit')}
          </Button>
        </div>
      </div>
    </div>
  );
}
