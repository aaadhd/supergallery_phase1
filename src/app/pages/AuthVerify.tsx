import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authStore } from '../store';
import { consumeMagicLink } from '../utils/magicLinkStore';
import { persistMockSession } from '../services/sessionTokens';
import { useI18n } from '../i18n/I18nProvider';
import { Button } from '../components/ui/button';

type VerifyState = 'checking' | 'login-ok' | 'signup-ok' | 'expired';

/**
 * 이메일 매직 링크 콜백 — `/auth/verify?token=...`.
 * 토큰 유효 시 intent에 따라 로그인 세션 발급 또는 가입 Step 2로 이어감.
 * 토큰 없음 → /signup 리다이렉트. 만료·소비됨 → expired 화면 표시.
 */
export default function AuthVerify() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<VerifyState>('checking');

  const token = searchParams.get('token') ?? '';

  useEffect(() => {
    if (!token) {
      navigate('/signup', { replace: true });
      return;
    }
    const req = consumeMagicLink(token);
    if (!req) {
      setState('expired');
      return;
    }
    if (req.intent === 'login') {
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
  }, [navigate, token]);

  if (state === 'expired') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md text-center space-y-4">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('signup.linkExpiredTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('signup.linkExpiredBody')}</p>
          <Button
            className="w-full min-h-[44px]"
            onClick={() => navigate('/signup', { replace: true })}
          >
            {t('signup.resendLink')}
          </Button>
          <Button
            variant="ghost"
            className="w-full min-h-[44px] text-muted-foreground"
            onClick={() => navigate('/signup', { replace: true })}
          >
            {t('signup.changeEmail')}
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
