import { useEffect, useMemo, useRef, useState, FormEvent, ReactNode } from 'react';
import { toast } from 'sonner';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, User, Calendar } from 'lucide-react';
import { useAuthStore } from '../store';
import { pointsOnSignupComplete } from '../utils/pointsBackground';
import { persistMockSession } from '../services/sessionTokens';
import { isEmailRegistered } from '../utils/registeredAccounts';
import { requestEmailMagicLink } from '../services/apiClient';
import { issueMagicLink, buildVerifyUrl, latestMagicLinkFor } from '../utils/magicLinkStore';
import { useI18n } from '../i18n/I18nProvider';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { isValidDate, meetsMinAge } from '../utils/ageCheck';
import { containsProfanity } from '../utils/profanityFilter';

const inputClass =
  'min-h-[44px] rounded-lg border-border/40 px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground sm:px-4 sm:text-sm focus-visible:ring-primary/25';

const emailValid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const RESEND_COOLDOWN_SEC = 30;

export default function Signup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const demo = searchParams.get('demo');
  const stepParam = Math.max(1, Math.min(3, Number(searchParams.get('step')) || 1));
  const auth = useAuthStore();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const [birthYear, setBirthYear] = useState<string>('');
  const [birthMonth, setBirthMonth] = useState<string>('');
  const [birthDay, setBirthDay] = useState<string>('');

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeAge, setAgreeAge] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const [linkSent, setLinkSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [resendSec, setResendSec] = useState(0);
  const resendTimer = useRef<number | null>(null);

  // step>=2인데 이메일이 없으면 1단계로 복귀
  useEffect(() => {
    if (stepParam === 1) return;
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('artier_pending_signup_email') : null;
    if (saved && emailValid(saved)) {
      setEmail(saved);
    } else {
      navigate('/signup?step=1', { replace: true });
    }
  }, [stepParam, navigate]);

  // 재전송 쿨다운 카운터
  useEffect(() => {
    if (resendSec <= 0) {
      if (resendTimer.current != null) {
        window.clearTimeout(resendTimer.current);
        resendTimer.current = null;
      }
      return;
    }
    resendTimer.current = window.setTimeout(() => setResendSec((s) => s - 1), 1000);
    return () => {
      if (resendTimer.current != null) window.clearTimeout(resendTimer.current);
    };
  }, [resendSec]);

  const allAgreed = agreeTerms && agreePrivacy && agreeAge;
  const someAgreed = agreeTerms || agreePrivacy || agreeAge;

  const toggleMaster = () => {
    const next = !allAgreed;
    setAgreeTerms(next);
    setAgreePrivacy(next);
    setAgreeAge(next);
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

  const nicknameTrim = nickname.trim();
  const nicknameLengthOk = nicknameTrim.length >= 2 && nicknameTrim.length <= 20;
  const nicknameClean = !containsProfanity(nicknameTrim);
  const nicknameError = touched('nickname') && !nicknameLengthOk
    ? t('signup.errNickname')
    : touched('nickname') && !nicknameClean
      ? t('signup.errProfanity')
      : '';

  const birthFilled = birthYear !== '' && birthMonth !== '' && birthDay !== '';
  const birthValid = birthFilled && isValidDate(Number(birthYear), Number(birthMonth), Number(birthDay));
  const birthMeetsAge = birthValid && meetsMinAge(Number(birthYear), Number(birthMonth), Number(birthDay));
  const birthError = !touched('birth')
    ? ''
    : !birthFilled || !birthValid
      ? t('signup.errBirthInvalid')
      : !birthMeetsAge
        ? t('signup.errBirthUnderAge')
        : '';

  const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const dayOptions = useMemo(() => Array.from({ length: 31 }, (_, i) => i + 1), []);

  const emailOk = emailValid(email) && !isEmailRegistered(email);
  const profileOk = nicknameLengthOk && nicknameClean && birthMeetsAge;
  const agreementsOk = agreeTerms && agreePrivacy && agreeAge;

  const sendMagicLink = async (): Promise<boolean> => {
    if (!emailOk) {
      markTouched('email');
      return false;
    }
    setSending(true);
    try {
      issueMagicLink({ email: email.trim(), intent: 'signup' });
      try { localStorage.setItem('artier_pending_signup_email', email.trim()); } catch { /* ignore */ }
      await requestEmailMagicLink({ email: email.trim(), intent: 'signup' });
      setLinkSent(true);
      setResendSec(RESEND_COOLDOWN_SEC);
      return true;
    } catch {
      toast.error(t('login.errEmailInvalid'));
      return false;
    } finally {
      setSending(false);
    }
  };

  const handleResend = async () => {
    if (resendSec > 0) return;
    const ok = await sendMagicLink();
    if (ok) toast.success(t('signup.resendSuccess'));
  };

  const openDemoVerifyLink = () => {
    const ref = latestMagicLinkFor(email.trim());
    if (!ref) return;
    navigate(buildVerifyUrl(ref.token));
  };

  const goEditEmail = () => {
    setLinkSent(false);
    setResendSec(0);
  };

  const handleFinalSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!profileOk || !agreementsOk) return;
    try {
      localStorage.setItem('artier_pending_signup_email', email.trim());
      localStorage.setItem('artier_pending_signup_nickname', nicknameTrim);
    } catch { /* ignore */ }
    auth.login();
    persistMockSession(email.trim());
    pointsOnSignupComplete();
    navigate('/onboarding');
  };

  const sentBanner = (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('signup.linkSentTitle')}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {t('signup.linkSentBody').replace('{email}', email || 'you@example.com')}
          </p>
          <p className="text-sm text-foreground/80 bg-muted/40 rounded-lg px-3 py-2.5 leading-relaxed">
            {t('signup.linkSentAutoFlow')}
          </p>
          <div className="rounded-lg border border-border/40 bg-background px-3 py-2.5 text-left space-y-1">
            <p className="text-sm font-semibold text-foreground">{t('signup.linkSentHelpTitle')}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{t('signup.linkSentSpam')}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{t('signup.linkSentSenderHint')}</p>
          </div>
        </div>

        <div className="space-y-2">
          <Button
            type="button"
            onClick={openDemoVerifyLink}
            disabled={!latestMagicLinkFor(email.trim())}
            className="w-full min-h-[44px] rounded-lg bg-primary text-white text-sm font-semibold lg:hover:bg-primary/90 disabled:opacity-50"
          >
            {t('signup.openMockLink')}
          </Button>
          <p className="text-center text-xs text-muted-foreground">{t('signup.openMockLinkHint')}</p>
        </div>

        <div className="flex flex-col gap-2 border-t border-border/40 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleResend}
            disabled={resendSec > 0 || sending}
            className="w-full min-h-[44px] rounded-lg text-sm font-medium"
          >
            {resendSec > 0
              ? t('signup.resendCooldown').replace('{sec}', String(resendSec))
              : t('signup.resendLink')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={goEditEmail}
            className="w-full min-h-[44px] text-sm text-muted-foreground"
          >
            {t('signup.changeEmail')}
          </Button>
        </div>
      </div>
    </div>
  );

  if (demo === 'email_expired') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 py-10">
        <div className="w-full max-w-md text-center space-y-6">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('signup.linkExpiredTitle')}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">{t('signup.linkExpiredBody')}</p>
          <Link
            to="/signup"
            className="flex w-full min-h-[44px] items-center justify-center rounded-lg bg-primary text-white text-sm font-semibold lg:hover:bg-primary/90"
          >
            {t('signup.resendLink')}
          </Link>
        </div>
      </div>
    );
  }

  if (demo === 'email_sent') {
    return sentBanner;
  }

  if (stepParam === 1 && linkSent) {
    return sentBanner;
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

  const progressBar = (
    <div
      className="mx-auto mt-4 flex max-w-[240px] items-center justify-center gap-2"
      role="progressbar"
      aria-valuenow={stepParam}
      aria-valuemin={1}
      aria-valuemax={3}
      aria-label={`${t('signup.title')} · ${stepParam}/3`}
    >
      <div className={`h-2 w-10 rounded-full transition-colors ${stepParam >= 1 ? 'bg-primary' : 'bg-muted'}`} />
      <div className={`h-2 w-10 rounded-full transition-colors ${stepParam >= 2 ? 'bg-primary' : 'bg-muted'}`} />
      <div className={`h-2 w-10 rounded-full transition-colors ${stepParam >= 3 ? 'bg-primary' : 'bg-muted'}`} />
      <span className="ml-2 text-sm font-medium text-muted-foreground tabular-nums">{stepParam}/3</span>
    </div>
  );

  if (stepParam === 1) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground text-center">{t('signup.emailStepTitle')}</h1>
            <p className="mt-2 text-center text-sm text-muted-foreground leading-relaxed">{t('signup.emailStepDesc')}</p>
            {progressBar}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              markTouched('email');
              if (emailOk) void sendMagicLink();
            }}
            className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300"
          >
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
                autoFocus
              />
              {emailError ? <p className="mt-1.5 text-sm text-destructive">{emailError}</p> : null}
            </div>

            <Button
              type="submit"
              disabled={!emailOk || sending}
              className="w-full min-h-[44px] mt-2 rounded-lg bg-primary text-white text-sm sm:text-sm font-semibold lg:hover:bg-primary/90 disabled:opacity-50"
            >
              {sending ? t('signup.linkSending') : t('signup.linkSendCta')}
            </Button>
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

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground text-center">{t('signup.title')}</h1>
          {progressBar}
        </div>

        <form onSubmit={handleFinalSubmit} className="space-y-4">
          {stepParam === 2 && (
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
                  autoFocus
                />
                {nicknameError ? (
                  <p className="mt-1.5 text-sm text-destructive">{nicknameError}</p>
                ) : null}
              </div>

              <div>
                <Label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-foreground sm:text-sm">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
                  {t('signup.birthLabel')}
                  <span className="text-destructive ml-0.5">*</span>
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="bday-year"
                      aria-label={t('signup.birthYear')}
                      value={birthYear}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                        setBirthYear(v);
                        if (v.length >= 4) markTouched('birth');
                      }}
                      onBlur={() => markTouched('birth')}
                      placeholder={t('signup.birthYearPlaceholder')}
                      maxLength={4}
                      className="min-h-[44px] w-full rounded-lg border border-border/40 pl-3 pr-8 py-2 text-sm sm:text-sm text-foreground bg-white focus-visible:ring-[3px] focus-visible:ring-primary/25 focus-visible:outline-none placeholder:text-muted-foreground/50"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{t('signup.birthYear')}</span>
                  </div>
                  <select
                    aria-label={t('signup.birthMonth')}
                    value={birthMonth}
                    onChange={(e) => { setBirthMonth(e.target.value); markTouched('birth'); }}
                    onBlur={() => markTouched('birth')}
                    className="min-h-[44px] rounded-lg border border-border/40 px-3 py-2 text-sm sm:text-sm text-foreground bg-white focus-visible:ring-[3px] focus-visible:ring-primary/25 focus-visible:outline-none"
                  >
                    <option value="">{t('signup.birthMonth')}</option>
                    {monthOptions.map((m) => (<option key={m} value={m}>{m}</option>))}
                  </select>
                  <select
                    aria-label={t('signup.birthDay')}
                    value={birthDay}
                    onChange={(e) => { setBirthDay(e.target.value); markTouched('birth'); }}
                    onBlur={() => markTouched('birth')}
                    className="min-h-[44px] rounded-lg border border-border/40 px-3 py-2 text-sm sm:text-sm text-foreground bg-white focus-visible:ring-[3px] focus-visible:ring-primary/25 focus-visible:outline-none"
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
                  onClick={() => {
                    markTouched('nickname');
                    markTouched('birth');
                    if (profileOk) navigate('/signup?step=3');
                  }}
                  disabled={!profileOk}
                  className="w-full min-h-[44px] rounded-lg bg-primary text-white text-sm sm:text-sm font-semibold lg:hover:bg-primary/90 disabled:opacity-50"
                >
                  {t('upload.nextStep')}
                </Button>
              </div>
            </div>
          )}

          {stepParam === 3 && (
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
                    'signup-age',
                    agreeAge,
                    setAgreeAge,
                    <>
                      <span className="text-destructive font-medium">{t('signup.requiredTag')}</span>{' '}
                      {t('signup.agreeAge')}
                    </>
                  )}
                  {checkboxRow(
                    'signup-marketing',
                    agreeMarketing,
                    setAgreeMarketing,
                    <>
                      <span className="text-muted-foreground font-medium">{t('signup.optionalTag')}</span>{' '}
                      {t('signup.agreeMarketing')}
                      <span className="block mt-0.5 text-xs text-muted-foreground">{t('signup.agreeMarketingHint')}</span>
                    </>
                  )}
                </div>
                <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">{t('signup.ageRestrictionLead')}</p>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/signup?step=2')}
                  className="w-1/3 min-h-[44px] rounded-lg text-foreground text-sm sm:text-sm"
                >
                  {t('signup.previous')}
                </Button>
                <Button
                  type="submit"
                  disabled={!profileOk || !agreementsOk}
                  className="flex-1 min-h-[44px] rounded-lg bg-primary text-white text-sm sm:text-sm font-semibold lg:hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('signup.submit')}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
