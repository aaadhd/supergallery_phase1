import { useState, FormEvent, ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import { useAuthStore } from '../store';
import { pointsOnSignupComplete } from '../utils/pointsBackground';
import { passwordMatchesPhase1Policy } from '../utils/passwordPolicy';
import { registerEmailAccount, isApiConfigured } from '../services/apiClient';
import { persistMockSession } from '../services/sessionTokens';
import { useI18n } from '../i18n/I18nProvider';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';

const inputClass =
  'min-h-[44px] rounded-lg border-[#F0F0F0] px-3 py-3 text-[13px] text-[#18181B] placeholder:text-[#A1A1AA] sm:px-4 sm:text-sm focus-visible:ring-primary/25';

const emailValid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export default function Signup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const demo = searchParams.get('demo');
  const auth = useAuthStore();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeAge, setAgreeAge] = useState(false);
  const [agreeMarketingEmail, setAgreeMarketingEmail] = useState(false);
  const [agreeMarketingPush, setAgreeMarketingPush] = useState(false);

  const allAgreed =
    agreeTerms && agreePrivacy && agreeAge && agreeMarketingEmail && agreeMarketingPush;
  const someAgreed =
    agreeTerms || agreePrivacy || agreeAge || agreeMarketingEmail || agreeMarketingPush;

  const toggleMaster = () => {
    const next = !allAgreed;
    setAgreeTerms(next);
    setAgreePrivacy(next);
    setAgreeAge(next);
    setAgreeMarketingEmail(next);
    setAgreeMarketingPush(next);
  };

  const emailError = submitted && !emailValid(email) ? t('signup.errEmail') : '';
  const passwordError =
    submitted && !passwordMatchesPhase1Policy(password) ? t('signup.passwordPolicyError') : '';
  const nicknameTrim = nickname.trim();
  const nicknameError =
    submitted && (nicknameTrim.length < 2 || nicknameTrim.length > 20)
      ? t('signup.errNickname')
      : '';

  const requiredOk = agreeTerms && agreePrivacy && agreeAge;
  const fieldsOk =
    emailValid(email) &&
    passwordMatchesPhase1Policy(password) &&
    nicknameTrim.length >= 2 &&
    nicknameTrim.length <= 20;
  const canSubmit = requiredOk && fieldsOk;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!canSubmit) return;
    if (isApiConfigured()) {
      registerEmailAccount({
        email: email.trim(),
        password,
        nickname: nicknameTrim,
      }).catch(() => {});
    }
    auth.login();
    persistMockSession(email.trim());
    pointsOnSignupComplete();
    navigate('/onboarding');
  };

  if (demo === 'email_sent') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 py-10">
        <div className="w-full max-w-md text-center space-y-6">
          <h1 className="text-xl sm:text-2xl font-bold text-[#18181B]">{t('signupDemo.emailSentTitle')}</h1>
          <p className="text-sm text-[#52525B] leading-relaxed whitespace-pre-line">{t('signupDemo.emailSentBody')}</p>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              className="w-full min-h-[44px] rounded-lg border border-[#E4E4E7] text-sm font-semibold text-[#18181B] lg:hover:bg-[#FAFAFA]"
            >
              {t('signupDemo.resendEmail')}
            </Button>
            <Link
              to="/login"
              className="w-full min-h-[44px] flex items-center justify-center rounded-lg bg-primary text-white text-sm font-semibold lg:hover:bg-primary/90"
            >
              {t('signup.loginLink')}
            </Link>
          </div>
          <p className="text-xs text-[#A1A1AA]">{t('signupDemo.demoBanner')}</p>
        </div>
      </div>
    );
  }

  if (demo === 'email_expired') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 py-10">
        <div className="w-full max-w-md text-center space-y-6">
          <h1 className="text-xl sm:text-2xl font-bold text-[#18181B]">{t('signupDemo.emailExpiredTitle')}</h1>
          <p className="text-sm text-[#52525B] leading-relaxed">{t('signupDemo.emailExpiredBody')}</p>
          <Button
            type="button"
            className="w-full min-h-[44px] rounded-lg bg-primary text-white text-sm font-semibold lg:hover:bg-primary/90"
          >
            {t('signupDemo.resendEmail')}
          </Button>
          <Link to="/signup" className="block text-sm text-primary font-medium lg:hover:underline">
            {t('signupDemo.backToSignup')}
          </Link>
          <p className="text-xs text-[#A1A1AA]">{t('signupDemo.demoBanner')}</p>
        </div>
      </div>
    );
  }

  const checkboxRow = (
    id: string,
    checked: boolean,
    onChange: (v: boolean) => void,
    label: ReactNode
  ) => (
    <div className="flex items-start gap-3 py-1">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
        className="mt-0.5 border-[#F0F0F0]"
      />
      <Label htmlFor={id} className="cursor-pointer text-[13px] font-normal leading-snug text-[#18181B] sm:text-sm">
        {label}
      </Label>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 py-10">
      <div className="w-full max-w-md">
        {demo === 'region' ? (
          <div className="mb-8 rounded-xl border border-border bg-muted/60 p-4 text-left">
            <p className="text-xs font-semibold text-foreground mb-3">{t('signupDemo.regionBanner')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
              <div className="rounded-lg bg-card/80 border border-border p-3 space-y-1">
                <p className="font-semibold text-[#18181B]">{t('signupDemo.regionKr')}</p>
                <p>{t('signupDemo.regionKrOpts')}</p>
              </div>
              <div className="rounded-lg bg-card/80 border border-border p-3 space-y-1">
                <p className="font-semibold text-[#18181B]">{t('signupDemo.regionIntl')}</p>
                <p>{t('signupDemo.regionIntlOpts')}</p>
              </div>
            </div>
          </div>
        ) : null}

        <h1 className="text-xl sm:text-2xl font-bold text-[#18181B] text-center mb-8">{t('signup.title')}</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label
              htmlFor="signup-email"
              className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-[#18181B] sm:text-sm"
            >
              <Mail className="h-3.5 w-3.5 text-[#71717A]" strokeWidth={2} />
              {t('signup.emailLabel')}
            </Label>
            <Input
              id="signup-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('signup.emailPh')}
              className={inputClass}
            />
            {emailError ? <p className="mt-1.5 text-[13px] text-red-600">{emailError}</p> : null}
          </div>

          <div>
            <Label
              htmlFor="signup-password"
              className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-[#18181B] sm:text-sm"
            >
              <Lock className="h-3.5 w-3.5 text-[#71717A]" strokeWidth={2} />
              {t('signup.passwordLabel')}
            </Label>
            <Input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('signup.passwordPh')}
              className={inputClass}
            />
            <p className="mt-1.5 text-[12px] sm:text-[13px] text-[#A1A1AA]">
              {t('signup.passwordHint')}
            </p>
            {passwordError ? <p className="mt-1 text-[13px] text-red-600">{passwordError}</p> : null}
          </div>

          <div>
            <Label
              htmlFor="signup-nickname"
              className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-[#18181B] sm:text-sm"
            >
              <User className="h-3.5 w-3.5 text-[#71717A]" strokeWidth={2} />
              {t('signup.nicknameLabel')}
            </Label>
            <Input
              id="signup-nickname"
              type="text"
              autoComplete="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 20))}
              placeholder={t('signup.nicknamePh')}
              className={inputClass}
            />
            {nicknameError ? (
              <p className="mt-1.5 text-[13px] text-red-600">{nicknameError}</p>
            ) : null}
          </div>

          <div className="pt-2 border-t border-[#F0F0F0]">
            <p className="text-[13px] sm:text-sm font-semibold text-[#18181B] mb-3">
              {t('signup.agreeSection')}
            </p>
            <div className="space-y-2.5 rounded-lg border border-[#F0F0F0] p-4 bg-[#FAFAFA]/50">
              <div className="mb-1 flex items-start gap-3 border-b border-[#F0F0F0] pb-2">
                <Checkbox
                  id="signup-agree-all"
                  checked={allAgreed ? true : someAgreed ? 'indeterminate' : false}
                  onCheckedChange={() => toggleMaster()}
                  className="mt-0.5 border-[#F0F0F0]"
                />
                <Label
                  htmlFor="signup-agree-all"
                  className="cursor-pointer text-[13px] font-semibold text-[#18181B] sm:text-sm"
                >
                  {t('signup.agreeAll')}
                </Label>
              </div>

              {checkboxRow(
                'signup-terms',
                agreeTerms,
                setAgreeTerms,
                <>
                  <span className="text-red-600 font-medium">{t('signup.requiredTag')}</span>{' '}
                  {t('signup.agreeTerms')} (
                  <Link to="/terms" className="text-primary underline underline-offset-2">
                    {t('signup.view')}
                  </Link>
                  )
                </>
              )}
              {checkboxRow(
                'signup-privacy',
                agreePrivacy,
                setAgreePrivacy,
                <>
                  <span className="text-red-600 font-medium">{t('signup.requiredTag')}</span>{' '}
                  {t('signup.agreePrivacy')} (
                  <Link to="/privacy" className="text-primary underline underline-offset-2">
                    {t('signup.view')}
                  </Link>
                  )
                </>
              )}
              {checkboxRow(
                'signup-age',
                agreeAge,
                setAgreeAge,
                <>
                  <span className="text-red-600 font-medium">{t('signup.requiredTag')}</span>{' '}
                  {t('signup.agreeAge')}
                </>
              )}
              {checkboxRow(
                'signup-mkt-email',
                agreeMarketingEmail,
                setAgreeMarketingEmail,
                <>
                  <span className="text-[#71717A] font-medium">{t('signup.optionalTag')}</span>{' '}
                  {t('signup.agreeMktEmail')}
                </>
              )}
              {checkboxRow(
                'signup-mkt-push',
                agreeMarketingPush,
                setAgreeMarketingPush,
                <>
                  <span className="text-[#71717A] font-medium">{t('signup.optionalTag')}</span>{' '}
                  {t('signup.agreeMktPush')}
                </>
              )}
            </div>
            <p className="mt-3 text-[12px] sm:text-[13px] text-[#71717A] leading-relaxed">{t('signup.ageRestrictionLead')}</p>
          </div>

          <Button
            type="submit"
            disabled={!canSubmit}
            className="w-full min-h-[44px] rounded-lg bg-primary text-white text-[13px] sm:text-sm font-semibold lg:hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:lg:hover:bg-primary"
          >
            {t('signup.submit')}
          </Button>
        </form>

        <p className="text-center mt-10 text-[13px] sm:text-sm text-[#71717A]">
          {t('signup.hasAccount')}{' '}
          <Link to="/login" className="text-primary font-semibold lg:hover:underline">
            {t('signup.loginLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}
