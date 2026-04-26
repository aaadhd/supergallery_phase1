import { useEffect, useRef, useState, FormEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { accountSuspensionStore, authStore } from '../store';
import { useI18n } from '../i18n/I18nProvider';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { AuthSheet } from '../components/AuthSheet';
import { issueMagicLink, buildVerifyUrl, latestMagicLinkFor } from '../utils/magicLinkStore';
import { requestEmailMagicLink } from '../services/apiClient';

const inputClass =
  'min-h-[44px] rounded-lg border-border/40 px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground sm:px-4 sm:text-sm focus-visible:ring-primary/25';
const emailValid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const RESEND_COOLDOWN_SEC = 30;

export default function Login() {
  const { t, locale } = useI18n();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const rawRedirect = searchParams.get('redirect') || '/';
  const redirectTo = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/';
  const mode = searchParams.get('mode');
  const emailMode = mode === 'email';

  useEffect(() => {
    if (authStore.isLoggedIn()) navigate(redirectTo, { replace: true });
  }, [navigate, redirectTo]);

  const [sheetOpen, setSheetOpen] = useState(!emailMode);
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ email?: string; general?: string }>({});
  const [sending, setSending] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [resendSec, setResendSec] = useState(0);
  const resendTimer = useRef<number | null>(null);

  useEffect(() => {
    const d = searchParams.get('demo');
    if (d === 'suspended') {
      accountSuspensionStore.set({
        active: true,
        reason: t('loginDemo.suspendReason'),
        until: new Date(Date.now() + 7 * 86400000).toISOString(),
      });
    } else if (d === 'clear_suspension') {
      accountSuspensionStore.clear();
    }
  }, [searchParams, t]);

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

  const blockIfSuspended = (): boolean => {
    const s = accountSuspensionStore.get();
    if (!s.active) return false;
    const dateLocale = locale === 'en' ? 'en-US' : 'ko-KR';
    const untilLabel = s.until
      ? new Date(s.until).toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' })
      : null;
    const parts = [t('login.errSuspended')];
    if (s.reason) parts.push(t('login.errSuspendedReason').replace('{reason}', s.reason));
    if (untilLabel) parts.push(t('login.errSuspendedUntil').replace('{until}', untilLabel));
    parts.push(t('login.errSuspendedAppeal'));
    setErrors({ general: parts.join(' ') });
    return true;
  };

  const sendMagicLink = async () => {
    if (!emailValid(email)) {
      setErrors({ email: t('login.errEmailInvalid') });
      return;
    }
    if (blockIfSuspended()) return;
    setSending(true);
    try {
      issueMagicLink({ email: email.trim(), intent: 'login', redirectTo });
      await requestEmailMagicLink({ email: email.trim(), intent: 'login', redirectTo });
      setLinkSent(true);
      setResendSec(RESEND_COOLDOWN_SEC);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    void sendMagicLink();
  };

  const handleResend = async () => {
    if (resendSec > 0 || sending) return;
    await sendMagicLink();
    if (!errors.general) toast.success(t('login.resendSuccess'));
  };

  const openDemoVerifyLink = () => {
    const ref = latestMagicLinkFor(email.trim());
    if (!ref) return;
    navigate(buildVerifyUrl(ref.token));
  };

  const goEditEmail = () => {
    setLinkSent(false);
    setResendSec(0);
    setErrors({});
  };

  const onSheetOpenChange = (next: boolean) => {
    setSheetOpen(next);
    if (!next && !emailMode) {
      navigate(redirectTo, { replace: true });
    }
  };

  if (emailMode) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground min-h-[44px]"
            aria-label={t('common.back')}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t('common.back')}
          </button>

          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground text-lg font-bold">
              A
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight">Artier</span>
          </div>

          {linkSent ? (
            <div className="space-y-6">
              <div className="space-y-3 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('login.linkSentTitle')}</h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('login.linkSentBody').replace('{email}', email)}
                </p>
                <div className="rounded-lg border border-border/40 bg-background px-3 py-2.5 text-left space-y-1">
                  <p className="text-sm font-semibold text-foreground">{t('signup.linkSentHelpTitle')}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t('login.linkSentSpam')}</p>
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
                  {t('login.openMockLink')}
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
                    : t('login.resendLink')}
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
          ) : (
            <>
              <div className="text-center mb-8 space-y-2">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('login.emailHeading')}</h1>
                <p className="text-sm text-muted-foreground leading-relaxed">{t('login.emailDesc')}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">{t('login.email')}</Label>
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    aria-invalid={!!errors.email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors((p) => ({ ...p, email: undefined, general: undefined }));
                    }}
                    placeholder={t('login.emailPlaceholder')}
                    className={inputClass}
                    autoFocus
                  />
                  {errors.email ? <p className="text-sm text-destructive">{errors.email}</p> : null}
                </div>

                {errors.general ? <p className="text-center text-sm text-destructive">{errors.general}</p> : null}

                <Button
                  type="submit"
                  disabled={!emailValid(email) || sending}
                  className="h-11 min-h-11 w-full text-base font-medium disabled:opacity-50"
                >
                  {sending ? t('login.linkSending') : t('login.sendMagicLink')}
                </Button>
              </form>
            </>
          )}

          {import.meta.env.DEV && (
            <div className="mt-10 space-y-2 border-t border-dashed border-border pt-6 text-center text-xs text-muted-foreground">
              <p>개발용: 계정 정지 정책(로그인 차단) 시뮬레이션</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 min-h-0 text-xs"
                  onClick={() => {
                    accountSuspensionStore.set({
                      active: true,
                      reason: '콘텐츠·신고 정책 위반 (데모)',
                      until: new Date(Date.now() + 7 * 86400000).toISOString(),
                    });
                    toast.info('7일 정지 상태가 로컬에 설정되었습니다. 로그인을 시도해 보세요.');
                  }}
                >
                  7일 정지 넣기
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 min-h-0 text-xs"
                  onClick={() => {
                    accountSuspensionStore.clear();
                    toast.info('정지 상태가 해제되었습니다.');
                  }}
                >
                  정지 해제
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <AuthSheet open={sheetOpen} onOpenChange={onSheetOpenChange} redirectTo={redirectTo} />
    </div>
  );
}
