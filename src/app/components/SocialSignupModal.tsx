import { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';

export type SocialProvider = 'kakao' | 'google' | 'apple';

const MOCK_SOCIAL_PROFILE: Record<SocialProvider, { email: string; name: string; avatar: string }> = {
  kakao: { email: 'demo@kakao.com', name: '카테', avatar: '🟡' },
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
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeAge, setAgreeAge] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);

  useEffect(() => {
    if (open && profile) {
      setNickname(profile.name);
      setAgreeTerms(false);
      setAgreePrivacy(false);
      setAgreeAge(false);
      setAgreeMarketing(false);
    }
  }, [open, profile]);

  if (!open || !provider || !profile) return null;

  const allRequired = agreeTerms && agreePrivacy && agreeAge;
  const allChecked = allRequired && agreeMarketing;
  const someChecked = agreeTerms || agreePrivacy || agreeAge || agreeMarketing;

  const toggleAll = () => {
    const next = !allChecked;
    setAgreeTerms(next);
    setAgreePrivacy(next);
    setAgreeAge(next);
    setAgreeMarketing(next);
  };

  const canSubmit = allRequired && nickname.trim().length >= 2 && nickname.trim().length <= 20;

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

          {/* 닉네임 */}
          <div className="space-y-2">
            <Label htmlFor="social-nickname">
              {t('socialSignup.nicknameLabel')}
              <span className="ml-1 text-xs font-medium text-red-500">(필수)</span>
            </Label>
            <Input
              id="social-nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 20))}
              placeholder={t('socialSignup.nicknamePlaceholder')}
              className="h-11 min-h-11"
              maxLength={20}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">{t('socialSignup.nicknameHint')}</p>
          </div>

          {/* 약관 동의 */}
          <div className="space-y-2.5 rounded-lg border border-border/40 p-4 bg-muted/30">
            <label className="mb-1 flex items-start gap-3 border-b border-border/40 pb-2 cursor-pointer">
              <Checkbox
                checked={allChecked ? true : someChecked ? 'indeterminate' : false}
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
                <span className="text-red-500">[필수]</span> {t('socialSignup.termsTerms')}
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox checked={agreePrivacy} onCheckedChange={(v) => setAgreePrivacy(!!v)} className="mt-0.5" />
              <span className="text-sm text-foreground sm:text-sm">
                <span className="text-red-500">[필수]</span> {t('socialSignup.termsPrivacy')}
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
