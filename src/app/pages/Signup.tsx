import { useEffect, useMemo, useRef, useState, FormEvent } from 'react';
import { toast } from 'sonner';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { useAuthStore } from '../store';
import { pointsOnSignupComplete } from '../utils/pointsBackground';
import { persistMockSession } from '../services/sessionTokens';
import { isEmailRegistered } from '../utils/registeredAccounts';
import { requestEmailMagicLink } from '../services/apiClient';
import { issueMagicLink } from '../utils/magicLinkStore';
import { useI18n } from '../i18n/I18nProvider';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';

const inputClass =
  'min-h-[44px] rounded-lg border-border/40 px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground sm:px-4 sm:text-sm focus-visible:ring-primary/25';

const emailValid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const RESEND_COOLDOWN_SEC = 30;

export default function Signup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const demo = searchParams.get('demo');
  const stepParam = Math.max(1, Math.min(2, Number(searchParams.get('step')) || 1));
  const auth = useAuthStore();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);


  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeAge, setAgreeAge] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<'terms' | 'privacy' | null>(null);
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

  const emailError = touched('email') && !emailValid(email) ? t('signup.errEmail') : '';

  const emailOk = emailValid(email);
  const agreementsOk = agreeTerms && agreePrivacy && agreeAge;

  const sendMagicLink = async (): Promise<boolean> => {
    if (!emailOk) {
      markTouched('email');
      return false;
    }
    setSending(true);
    try {
      const intent = isEmailRegistered(email.trim()) ? 'login' : 'signup';
      issueMagicLink({ email: email.trim(), intent });
      try { localStorage.setItem('artier_pending_signup_email', email.trim()); } catch { /* ignore */ }
      await requestEmailMagicLink({ email: email.trim(), intent });
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

  const goEditEmail = () => {
    setLinkSent(false);
    setResendSec(0);
  };

  const handleFinalSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!agreementsOk) return;
    try {
      localStorage.setItem('artier_pending_signup_email', email.trim());
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
          <div className="rounded-lg border border-border/40 bg-background px-3 py-2.5 text-left space-y-1">
            <p className="text-sm font-semibold text-foreground">{t('signup.linkSentHelpTitle')}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{t('signup.linkSentSpam')}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{t('signup.linkSentSenderHint')}</p>
          </div>
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

  if (stepParam === 1) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground text-center">{t('signup.emailStepTitle')}</h1>
            <p className="mt-2 text-center text-sm text-muted-foreground leading-relaxed">{t('signup.emailStepDesc')}</p>
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

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('signup.title')}</h1>
        </div>

        <form onSubmit={handleFinalSubmit} className="space-y-4">
          {stepParam === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* 약관 동의 카드 */}
              <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
                {/* 전체 동의 헤더 — 행 전체 클릭 */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleMaster()}
                  onKeyDown={(e) => e.key === ' ' && toggleMaster()}
                  className="flex items-center gap-3 px-4 py-3.5 bg-muted/40 border-b border-border/40 cursor-pointer select-none"
                >
                  <Checkbox
                    checked={allAgreed ? true : someAgreed ? 'indeterminate' : false}
                    onCheckedChange={() => toggleMaster()}
                    className="border-border/50 pointer-events-none"
                  />
                  <span className="text-sm font-semibold text-foreground">{t('signup.agreeAll')}</span>
                </div>

                {/* 이용약관 */}
                <div className="flex items-center border-b border-border/30">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setAgreeTerms(!agreeTerms)}
                    onKeyDown={(e) => e.key === ' ' && setAgreeTerms(!agreeTerms)}
                    className="flex-1 flex items-center gap-3 px-4 py-3.5 cursor-pointer select-none min-w-0"
                  >
                    <Checkbox checked={agreeTerms} className="border-border/50 shrink-0 pointer-events-none" />
                    <span className="shrink-0 text-xs font-semibold text-destructive bg-destructive/8 px-1.5 py-0.5 rounded">필수</span>
                    <span className="text-sm text-foreground truncate">{t('signup.agreeTerms')}</span>
                  </div>
                  <button type="button" onClick={() => setViewingDoc('terms')} className="shrink-0 text-xs text-primary lg:hover:underline underline-offset-2 min-h-[44px] px-4 flex items-center">
                    {t('signup.view')}
                  </button>
                </div>

                {/* 개인정보 */}
                <div className="flex items-center border-b border-border/30">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setAgreePrivacy(!agreePrivacy)}
                    onKeyDown={(e) => e.key === ' ' && setAgreePrivacy(!agreePrivacy)}
                    className="flex-1 flex items-center gap-3 px-4 py-3.5 cursor-pointer select-none min-w-0"
                  >
                    <Checkbox checked={agreePrivacy} className="border-border/50 shrink-0 pointer-events-none" />
                    <span className="shrink-0 text-xs font-semibold text-destructive bg-destructive/8 px-1.5 py-0.5 rounded">필수</span>
                    <span className="text-sm text-foreground truncate">{t('signup.agreePrivacy')}</span>
                  </div>
                  <button type="button" onClick={() => setViewingDoc('privacy')} className="shrink-0 text-xs text-primary lg:hover:underline underline-offset-2 min-h-[44px] px-4 flex items-center">
                    {t('signup.view')}
                  </button>
                </div>

                {/* 만 14세 */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setAgreeAge(!agreeAge)}
                  onKeyDown={(e) => e.key === ' ' && setAgreeAge(!agreeAge)}
                  className="flex items-center gap-3 px-4 py-3.5 border-b border-border/30 cursor-pointer select-none"
                >
                  <Checkbox checked={agreeAge} className="border-border/50 shrink-0 pointer-events-none" />
                  <span className="shrink-0 text-xs font-semibold text-destructive bg-destructive/8 px-1.5 py-0.5 rounded">필수</span>
                  <span className="text-sm text-foreground">{t('signup.agreeAge')}</span>
                </div>

                {/* 마케팅 */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setAgreeMarketing(!agreeMarketing)}
                  onKeyDown={(e) => e.key === ' ' && setAgreeMarketing(!agreeMarketing)}
                  className="flex items-start gap-3 px-4 py-3.5 cursor-pointer select-none"
                >
                  <Checkbox checked={agreeMarketing} className="mt-0.5 border-border/50 shrink-0 pointer-events-none" />
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="shrink-0 text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">선택</span>
                      <span className="text-sm text-foreground">{t('signup.agreeMarketing')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{t('signup.agreeMarketingHint')}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => navigate('/signup?step=1')} className="w-1/3 min-h-[44px] rounded-lg text-sm">
                  {t('signup.previous')}
                </Button>
                <Button type="submit" disabled={!agreementsOk} className="flex-1 min-h-[44px] rounded-lg bg-primary text-white text-sm font-semibold lg:hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed">
                  {t('signup.submit')}
                </Button>
              </div>

              {/* 약관 보기 Dialog */}
              <Dialog open={!!viewingDoc} onOpenChange={(open) => { if (!open) setViewingDoc(null); }}>
                <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 gap-0">
                  <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
                    <DialogTitle className="text-base font-semibold">
                      {viewingDoc === 'terms' ? t('signup.agreeTerms') : t('signup.agreePrivacy')}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 overflow-hidden">
                    <iframe
                      src={viewingDoc === 'terms' ? '/terms' : '/privacy'}
                      className="w-full h-full border-0"
                      title={viewingDoc === 'terms' ? t('signup.agreeTerms') : t('signup.agreePrivacy')}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
