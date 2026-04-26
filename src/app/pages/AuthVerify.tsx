import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authStore } from '../store';
import { consumeMagicLink } from '../utils/magicLinkStore';
import { persistMockSession, loadMockSession } from '../services/sessionTokens';
import { useI18n } from '../i18n/I18nProvider';
import { Button } from '../components/ui/button';

type VerifyState = 'checking' | 'login-ok' | 'signup-ok' | 'invalid' | 'expired';

/**
 * 이메일 매직 링크 콜백 — `/auth/verify?token=...`.
 * 토큰 유효 시 intent에 따라 로그인 세션 발급 또는 가입 Step 2로 이어감.
 * `?demo=invalid` · `?demo=expired`는 QA 시연 경로.
 */
export default function AuthVerify() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<VerifyState>('checking');

  const token = searchParams.get('token') ?? '';
  const demo = searchParams.get('demo');

  useEffect(() => {
    if (demo === 'expired') {
      setState('expired');
      return;
    }
    if (demo === 'invalid') {
      setState('invalid');
      return;
    }
    if (!token) {
      setState('invalid');
      return;
    }
    const req = consumeMagicLink(token);
    if (!req) {
      setState('expired');
      return;
    }
    if (req.intent === 'login') {
      // 이미 로그인된 다른 계정 세션이면 silent 전환을 막고 명시 분기로 안내.
      const existing = loadMockSession();
      if (authStore.isLoggedIn() && existing && existing.email && existing.email !== req.email) {
        setState('invalid');
        return;
      }
      authStore.login();
      persistMockSession(req.email);
      setState('login-ok');
      const safe = req.redirectTo && req.redirectTo.startsWith('/') && !req.redirectTo.startsWith('//')
        ? req.redirectTo
        : '/';
      const timer = setTimeout(() => navigate(safe, { replace: true }), 800);
      return () => clearTimeout(timer);
    }
    try {
      localStorage.setItem('artier_pending_signup_email', req.email);
    } catch {
      /* ignore */
    }
    setState('signup-ok');
    const timer = setTimeout(() => navigate('/signup?step=2', { replace: true }), 800);
    return () => clearTimeout(timer);
  }, [demo, navigate, token]);

  if (state === 'expired') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md text-center space-y-6">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('verify.expiredTitle')}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{t('verify.expiredBody')}</p>
          <div className="flex flex-col gap-2">
            <Link
              to="/signup"
              className="flex w-full min-h-[44px] items-center justify-center rounded-lg bg-primary text-white text-sm font-semibold lg:hover:bg-primary/90"
            >
              {t('verify.retrySignup')}
            </Link>
            <Link
              to="/login?mode=email"
              className="flex w-full min-h-[44px] items-center justify-center rounded-lg border border-border text-sm font-semibold lg:hover:bg-muted/50"
            >
              {t('verify.retryLogin')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'invalid') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md text-center space-y-6">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('verify.invalidTitle')}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">{t('verify.invalidBody')}</p>
          <Button asChild className="w-full min-h-[44px] rounded-lg bg-primary text-white text-sm font-semibold lg:hover:bg-primary/90">
            <Link to="/login">{t('verify.goHome')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (state === 'login-ok') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md text-center space-y-3">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('verify.successLoginTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('verify.successLoginBody')}</p>
        </div>
      </div>
    );
  }

  if (state === 'signup-ok') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md text-center space-y-3">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('verify.successSignupTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('verify.successSignupBody')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
      <p className="text-sm text-muted-foreground">{t('verify.checkingTitle')}</p>
    </div>
  );
}
