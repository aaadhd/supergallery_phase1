import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail } from 'lucide-react';
import { SocialSignupModal, type SocialProvider } from '../components/SocialSignupModal';
import { toast } from 'sonner';
import { accountSuspensionStore, authStore } from '../store';
import { persistMockSession } from '../services/sessionTokens';
import { useI18n } from '../i18n/I18nProvider';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { cn } from '../components/ui/utils';

export default function Login() {
  const { t, locale } = useI18n();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const rawRedirect = searchParams.get('redirect') || '/';
  const redirectTo = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/';

  // 이미 로그인된 상태면 홈으로
  useEffect(() => {
    if (authStore.isLoggedIn()) navigate(redirectTo, { replace: true });
  }, [navigate, redirectTo]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);
  const [emailExpanded, setEmailExpanded] = useState(false);
  const [pendingSocial, setPendingSocial] = useState<SocialProvider | null>(null);

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

  const validate = () => {
    const next: typeof errors = {};
    if (!email.trim()) next.email = t('login.errEmailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = t('login.errEmailInvalid');
    if (!password) next.password = t('login.errPasswordRequired');
    else if (password.length < 8) next.password = t('login.errPasswordShort');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (blockIfSuspended()) return;
    setLoading(true);
    setTimeout(() => {
      authStore.login();
      persistMockSession(email.trim() || 'email-login');
      navigate(redirectTo, { replace: true });
    }, 400);
  };

  /**
   * 소셜 재로그인(기존 가입자) — 바로 redirectTo로 이동.
   */
  const completeReturningSocialLogin = (provider: SocialProvider) => {
    authStore.login();
    persistMockSession(`oauth-${provider}-demo`);
    navigate(redirectTo, { replace: true });
  };

  /**
   * 소셜 첫 가입 — 약관 동의 + 닉네임 + provider 이메일까지 받은 뒤 호출.
   * 실명·전화는 Onboarding에서 추가로 받아야 하므로 /onboarding으로 유도.
   * (닉네임·이메일은 localStorage에 임시 저장 → Onboarding에서 prefill 후 정리)
   */
  const completeFirstSocialSignup = (provider: SocialProvider, nickname: string, email: string) => {
    authStore.login();
    persistMockSession(`oauth-${provider}-demo`);
    localStorage.setItem(`artier_social_signed_up__${provider}`, '1');
    localStorage.setItem('artier_pending_signup_nickname', nickname);
    localStorage.setItem('artier_pending_social_signup', provider);
    if (email) localStorage.setItem('artier_pending_signup_email', email);
    navigate('/onboarding', { replace: true });
  };

  const handleSocialLogin = (provider: SocialProvider) => {
    if (blockIfSuspended()) return;
    // 첫 가입이면 약관 동의 화면(SCR-AUTH-03), 재방문이면 즉시 로그인
    const alreadySignedUp = localStorage.getItem(`artier_social_signed_up__${provider}`) === '1';
    if (alreadySignedUp) {
      setLoading(true);
      setTimeout(() => completeReturningSocialLogin(provider), 400);
    } else {
      setPendingSocial(provider);
    }
  };

  const handleSocialSignupComplete = (nickname: string, email: string) => {
    const provider = pendingSocial;
    if (!provider) return;
    setPendingSocial(null);
    setLoading(true);
    setTimeout(() => completeFirstSocialSignup(provider, nickname, email), 400);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground text-lg font-bold">
            A
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">Artier</span>
        </Link>

        {/* 1차: 빠른 가입 — 소셜 로그인 (GeoIP/locale 기반 순서 분기) */}
        <div className="space-y-3">
          {(locale === 'ko' ? ['kakao', 'google', 'apple'] : ['google', 'apple', 'kakao']).map((provider) => {
            if (provider === 'kakao') return (
              <Button key="kakao" type="button" variant="secondary" className={cn('h-12 min-h-12 w-full gap-3 text-base font-medium', 'border-0 bg-[#FEE500] text-[#3C1E1E] lg:hover:bg-[#FDD800]')} onClick={() => handleSocialLogin(provider as SocialProvider)}>
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden><path d="M12 3C6.5 3 2 6.6 2 11c0 2.8 1.9 5.3 4.7 6.7-.2.7-.7 2.6-.8 3 0 0 0 .1.1.1s.1 0 .2 0c.2 0 2.6-1.7 3.6-2.4.7.1 1.4.2 2.2.2 5.5 0 10-3.6 10-8S17.5 3 12 3z" fill="currentColor" /></svg>
                {t('login.kakao')}
              </Button>
            );
            if (provider === 'google') return (
              <Button key="google" type="button" variant="outline" className="h-12 min-h-12 w-full gap-3 text-base font-medium" onClick={() => handleSocialLogin(provider as SocialProvider)}>
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                {t('login.google')}
              </Button>
            );
            return (
              <Button key="apple" type="button" className="h-12 min-h-12 w-full gap-3 bg-foreground text-base font-medium text-white lg:hover:bg-foreground/90" onClick={() => handleSocialLogin(provider as SocialProvider)}>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="white" aria-hidden><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-2.11 4.45-3.74 4.25z" /></svg>
                {t('login.apple')}
              </Button>
            );
          })}
        </div>

        <div className="my-6 flex items-center gap-4">
          <Separator className="flex-1" />
          <span className="shrink-0 text-sm text-muted-foreground">{t('login.or')}</span>
          <Separator className="flex-1" />
        </div>

        {/* 2차: 이메일 로그인 — 같은 플로우 안의 대안. 기본 접힘, 클릭 시 펼침 */}
        {!emailExpanded ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setEmailExpanded(true)}
            className="h-12 min-h-12 w-full gap-2 text-base font-medium border border-border lg:hover:bg-muted/50"
          >
            <Mail className="h-5 w-5" aria-hidden />
            {t('login.useEmail')}
          </Button>
        ) : (
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
                className="h-11 min-h-11 text-base md:text-sm"
                autoFocus
              />
              {errors.email ? <p className="text-sm text-destructive">{errors.email}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">{t('login.password')}</Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  aria-invalid={!!errors.password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((p) => ({ ...p, password: undefined, general: undefined }));
                  }}
                  placeholder={t('login.passwordPlaceholder')}
                  className="h-11 min-h-11 pr-12 text-base md:text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-10 w-10 min-h-[44px] min-w-[44px] -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
              {errors.password ? <p className="text-sm text-destructive">{errors.password}</p> : null}
            </div>

            {errors.general ? <p className="text-center text-sm text-destructive">{errors.general}</p> : null}

            <Button type="submit" disabled={loading} className="h-11 min-h-11 w-full text-base font-medium">
              {loading ? t('login.loading') : t('login.submit')}
            </Button>

            <div className="text-center">
              <Button variant="link" className="h-auto min-h-0 p-0 text-sm text-muted-foreground" asChild>
                <Link to="/reset-password">{t('login.forgot')}</Link>
              </Button>
            </div>
          </form>
        )}

        <p className="mt-6 text-center text-xs sm:text-sm text-muted-foreground leading-relaxed px-1">
          {t('login.ageNotice')}
        </p>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t('login.signupPrompt')}{' '}
          <Link to="/signup" className="font-medium text-primary lg:hover:underline">
            {t('login.signup')}
          </Link>
        </p>

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

      <SocialSignupModal
        open={pendingSocial !== null}
        provider={pendingSocial}
        onClose={() => setPendingSocial(null)}
        onComplete={handleSocialSignupComplete}
      />
    </div>
  );
}
