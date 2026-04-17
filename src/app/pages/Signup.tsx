import { useMemo, useState, FormEvent, ReactNode } from 'react';
import { toast } from 'sonner';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, Calendar } from 'lucide-react';
import { useAuthStore } from '../store';
import { pointsOnSignupComplete } from '../utils/pointsBackground';
import { passwordMatchesPhase1Policy } from '../utils/passwordPolicy';
import { registerEmailAccount, isApiConfigured } from '../services/apiClient';
import { persistMockSession } from '../services/sessionTokens';
import { isEmailRegistered } from '../utils/registeredAccounts';
import { useI18n } from '../i18n/I18nProvider';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { PasswordInput } from '../components/ui/password-input';
import { birthYearOptions, isValidDate, meetsMinAge } from '../utils/ageCheck';
import { containsProfanity } from '../utils/profanityFilter';

const inputClass =
  'min-h-[44px] rounded-lg border-border/40 px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground sm:px-4 sm:text-sm focus-visible:ring-primary/25';

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

  const [birthYear, setBirthYear] = useState<string>('');
  const [birthMonth, setBirthMonth] = useState<string>('');
  const [birthDay, setBirthDay] = useState<string>('');

  const [step, setStep] = useState(1);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketingEmail, setAgreeMarketingEmail] = useState(false);
  const [agreeMarketingPush, setAgreeMarketingPush] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const allAgreed =
    agreeTerms && agreePrivacy && agreeMarketingEmail && agreeMarketingPush;
  const someAgreed =
    agreeTerms || agreePrivacy || agreeMarketingEmail || agreeMarketingPush;

  const toggleMaster = () => {
    const next = !allAgreed;
    setAgreeTerms(next);
    setAgreePrivacy(next);
    setAgreeMarketingEmail(next);
    setAgreeMarketingPush(next);
  };

  const touched = (field: string) => submitted || touchedFields.has(field);
  const markTouched = (field: string) => setTouchedFields((prev) => new Set(prev).add(field));
  const emailError = touched('email')
    ? !emailValid(email)
      ? t('signup.errEmail')
      : isEmailRegistered(email)
        ? t('signup.errEmailRegistered')
        : ''
    : '';
  const passwordError =
    touched('password') && !passwordMatchesPhase1Policy(password) ? t('signup.passwordPolicyError') : '';
  const nicknameTrim = nickname.trim();
  const nicknameLengthOk = nicknameTrim.length >= 2 && nicknameTrim.length <= 20;
  const nicknameClean = !containsProfanity(nicknameTrim);
  const nicknameError =
    touched('nickname') && !nicknameLengthOk
      ? t('signup.errNickname')
      : touched('nickname') && !nicknameClean
        ? t('signup.errProfanity')
        : '';

  // 생년월일 검증 (3개 모두 선택되어야 검증 시작)
  const birthFilled = birthYear !== '' && birthMonth !== '' && birthDay !== '';
  const birthValid =
    birthFilled && isValidDate(Number(birthYear), Number(birthMonth), Number(birthDay));
  const birthMeetsAge =
    birthValid && meetsMinAge(Number(birthYear), Number(birthMonth), Number(birthDay));
  const birthError = !touched('birth')
    ? ''
    : !birthFilled || !birthValid
      ? t('signup.errBirthInvalid')
      : !birthMeetsAge
        ? t('signup.errBirthUnderAge')
        : '';

  const yearOptions = useMemo(() => birthYearOptions(), []);
  const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const dayOptions = useMemo(() => Array.from({ length: 31 }, (_, i) => i + 1), []);

  const requiredOk = agreeTerms && agreePrivacy && birthMeetsAge;
  const step1Ok = emailValid(email) && !isEmailRegistered(email) && passwordMatchesPhase1Policy(password);
  const step2Ok = nicknameLengthOk && nicknameClean && birthMeetsAge;
  const canSubmit = requiredOk && step1Ok && step2Ok;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!canSubmit) return;
    const stashPendingProfile = () => {
      try {
        localStorage.setItem('artier_pending_signup_email', email.trim());
        localStorage.setItem('artier_pending_signup_nickname', nicknameTrim);
      } catch { /* ignore */ }
    };
    if (isApiConfigured()) {
      registerEmailAccount({
        email: email.trim(),
        password,
        nickname: nicknameTrim,
      })
        .then(() => {
          auth.login();
          persistMockSession(email.trim());
          pointsOnSignupComplete();
          stashPendingProfile();
          navigate('/onboarding');
        })
        .catch(() => {
          toast.error(t('signup.errRegisterFailed'));
        });
      return;
    }
    auth.login();
    persistMockSession(email.trim());
    pointsOnSignupComplete();
    stashPendingProfile();
    navigate('/onboarding');
  };

  if (demo === 'email_sent') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 py-10">
        <div className="w-full max-w-md text-center space-y-6">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('signupDemo.emailSentTitle')}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{t('signupDemo.emailSentBody')}</p>
          <div className="flex flex-col gap-2">
            <Button variant="ghost"
              type="button"
              onClick={() => toast.success(t('signupDemo.resendSuccess'))}
              className="w-full min-h-[44px] rounded-lg border border-border text-sm font-semibold text-foreground lg:hover:bg-muted/50"
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
          <p className="text-xs text-muted-foreground">{t('signupDemo.demoBanner')}</p>
        </div>
      </div>
    );
  }

  if (demo === 'email_expired') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 py-10">
        <div className="w-full max-w-md text-center space-y-6">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('signupDemo.emailExpiredTitle')}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">{t('signupDemo.emailExpiredBody')}</p>
          <Button
            type="button"
            onClick={() => toast.success(t('signupDemo.resendSuccess'))}
            className="w-full min-h-[44px] rounded-lg bg-primary text-white text-sm font-semibold lg:hover:bg-primary/90"
          >
            {t('signupDemo.resendEmail')}
          </Button>
          <Link to="/signup" className="block text-sm text-primary font-medium lg:hover:underline">
            {t('signupDemo.backToSignup')}
          </Link>
          <p className="text-xs text-muted-foreground">{t('signupDemo.demoBanner')}</p>
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
        className="mt-0.5 border-border/40"
      />
      <Label htmlFor={id} className="cursor-pointer text-sm font-normal leading-snug text-foreground sm:text-sm">
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
                <p className="font-semibold text-foreground">{t('signupDemo.regionKr')}</p>
                <p>{t('signupDemo.regionKrOpts')}</p>
              </div>
              <div className="rounded-lg bg-card/80 border border-border p-3 space-y-1">
                <p className="font-semibold text-foreground">{t('signupDemo.regionIntl')}</p>
                <p>{t('signupDemo.regionIntlOpts')}</p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground text-center">{t('signup.title')}</h1>
          <div
            className="mx-auto mt-4 flex max-w-[240px] items-center justify-center gap-2"
            role="progressbar"
            aria-valuenow={step}
            aria-valuemin={1}
            aria-valuemax={3}
            aria-label={`${t('signup.title')} · ${step}/3`}
          >
            <div className={`h-2 w-10 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-2 w-10 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-2 w-10 rounded-full transition-colors ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
            <span className="ml-2 text-sm font-medium text-muted-foreground tabular-nums">{step}/3</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <Label
                  htmlFor="signup-email"
                  className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-foreground sm:text-sm"
                >
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
                  {t('signup.emailLabel')}
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => markTouched('email')}
                  placeholder={t('signup.emailPh')}
                  className={inputClass}
                />
                {emailError ? <p className="mt-1.5 text-sm text-destructive">{emailError}</p> : null}
              </div>

              <div>
                <Label
                  htmlFor="signup-password"
                  className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-foreground sm:text-sm"
                >
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
                  {t('signup.passwordLabel')}
                </Label>
                <PasswordInput
                  id="signup-password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => markTouched('password')}
                  placeholder={t('signup.passwordPh')}
                  className={inputClass}
                />
                <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
                  {t('signup.passwordHint')}
                </p>
                {passwordError ? <p className="mt-1 text-sm text-destructive">{passwordError}</p> : null}
              </div>

              <Button
                type="button"
                onClick={() => {
                  markTouched('email');
                  markTouched('password');
                  if (step1Ok) setStep(2);
                }}
                disabled={!step1Ok}
                className="w-full min-h-[44px] mt-4 rounded-lg bg-primary text-white text-sm sm:text-sm font-semibold lg:hover:bg-primary/90 disabled:opacity-50"
              >
                {t('upload.nextStep')}
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <Label
                  htmlFor="signup-nickname"
                  className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-foreground sm:text-sm"
                >
                  <User className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
                  {t('signup.nicknameLabel')}
                </Label>
                <Input
                  id="signup-nickname"
                  type="text"
                  autoComplete="nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value.slice(0, 20))}
                  onBlur={() => markTouched('nickname')}
                  placeholder={t('signup.nicknamePh')}
                  className={inputClass}
                />
                {nicknameError ? (
                  <p className="mt-1.5 text-sm text-destructive">{nicknameError}</p>
                ) : null}
              </div>

              <div>
                <Label
                  className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-foreground sm:text-sm"
                >
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
                  {t('signup.birthLabel')}
                  <span className="text-destructive ml-0.5">*</span>
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    aria-label={t('signup.birthYear')}
                    value={birthYear}
                    onChange={(e) => { setBirthYear(e.target.value); markTouched('birth'); }}
                    onBlur={() => markTouched('birth')}
                    className="min-h-[44px] rounded-lg border border-border/40 px-3 py-2 text-sm sm:text-sm text-foreground bg-white focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:outline-none"
                  >
                    <option value="">{t('signup.birthYear')}</option>
                    {yearOptions.map((y) => (<option key={y} value={y}>{y}</option>))}
                  </select>
                  <select
                    aria-label={t('signup.birthMonth')}
                    value={birthMonth}
                    onChange={(e) => { setBirthMonth(e.target.value); markTouched('birth'); }}
                    onBlur={() => markTouched('birth')}
                    className="min-h-[44px] rounded-lg border border-border/40 px-3 py-2 text-sm sm:text-sm text-foreground bg-white focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:outline-none"
                  >
                    <option value="">{t('signup.birthMonth')}</option>
                    {monthOptions.map((m) => (<option key={m} value={m}>{m}</option>))}
                  </select>
                  <select
                    aria-label={t('signup.birthDay')}
                    value={birthDay}
                    onChange={(e) => { setBirthDay(e.target.value); markTouched('birth'); }}
                    onBlur={() => markTouched('birth')}
                    className="min-h-[44px] rounded-lg border border-border/40 px-3 py-2 text-sm sm:text-sm text-foreground bg-white focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:outline-none"
                  >
                    <option value="">{t('signup.birthDay')}</option>
                    {dayOptions.map((d) => (<option key={d} value={d}>{d}</option>))}
                  </select>
                </div>
                <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">{t('signup.birthHint')}</p>
                {birthError ? <p className="mt-1 text-sm text-destructive">{birthError}</p> : null}
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="w-1/3 min-h-[44px] rounded-lg text-foreground text-sm sm:text-sm"
                >
                  {t('signup.previous')}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    markTouched('nickname');
                    markTouched('birth');
                    if (step2Ok) setStep(3);
                  }}
                  disabled={!step2Ok}
                  className="flex-1 min-h-[44px] rounded-lg bg-primary text-white text-sm sm:text-sm font-semibold lg:hover:bg-primary/90 disabled:opacity-50"
                >
                  {t('upload.nextStep')}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="pt-2">
                <p className="text-sm sm:text-sm font-semibold text-foreground mb-3">
                  {t('signup.agreeSection')}
                </p>
                <div className="space-y-2.5 rounded-lg border border-border/40 p-4 bg-muted/50">
                  <div className="mb-1 flex items-start gap-3 border-b border-border/40 pb-2">
                    <Checkbox
                      id="signup-agree-all"
                      checked={allAgreed ? true : someAgreed ? 'indeterminate' : false}
                      onCheckedChange={() => toggleMaster()}
                      className="mt-0.5 border-border/40"
                    />
                    <Label
                      htmlFor="signup-agree-all"
                      className="cursor-pointer text-sm font-semibold text-foreground sm:text-sm"
                    >
                      {t('signup.agreeAll')}
                    </Label>
                  </div>

                  {checkboxRow(
                    'signup-terms',
                    agreeTerms,
                    setAgreeTerms,
                    <>
                      <span className="text-destructive font-medium">{t('signup.requiredTag')}</span>{' '}
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
                      <span className="text-destructive font-medium">{t('signup.requiredTag')}</span>{' '}
                      {t('signup.agreePrivacy')} (
                      <Link to="/privacy" className="text-primary underline underline-offset-2">
                        {t('signup.view')}
                      </Link>
                      )
                    </>
                  )}
                  {checkboxRow(
                    'signup-mkt-email',
                    agreeMarketingEmail,
                    setAgreeMarketingEmail,
                    <>
                      <span className="text-muted-foreground font-medium">{t('signup.optionalTag')}</span>{' '}
                      {t('signup.agreeMktEmail')}
                    </>
                  )}
                  {checkboxRow(
                    'signup-mkt-push',
                    agreeMarketingPush,
                    setAgreeMarketingPush,
                    <>
                      <span className="text-muted-foreground font-medium">{t('signup.optionalTag')}</span>{' '}
                      {t('signup.agreeMktPush')}
                    </>
                  )}
                </div>
                <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">{t('signup.ageRestrictionLead')}</p>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="w-1/3 min-h-[44px] rounded-lg text-foreground text-sm sm:text-sm"
                >
                  {t('signup.previous')}
                </Button>
                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="flex-1 min-h-[44px] rounded-lg bg-primary text-white text-sm sm:text-sm font-semibold lg:hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('signup.submit')}
                </Button>
              </div>
            </div>
          )}
        </form>
        <p className="text-center mt-10 text-sm sm:text-sm text-muted-foreground">
          {t('signup.hasAccount')}{' '}
          <Link to="/login" className="text-primary font-semibold lg:hover:underline">
            {t('signup.loginLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}
