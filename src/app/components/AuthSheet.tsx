import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authStore } from '../store';
import { persistMockSession } from '../services/sessionTokens';
import { useI18n } from '../i18n/I18nProvider';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { cn } from './ui/utils';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from './ui/drawer';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { SocialSignupModal, type SocialProvider } from './SocialSignupModal';
import { fetchGeoDemo } from '../utils/geoIpDemo';

type Region = 'KR' | 'INTL';

function loadRegion(): Region {
  if (typeof localStorage === 'undefined') return 'INTL';
  const stored = localStorage.getItem('artier_signup_region');
  return stored === 'KR' ? 'KR' : stored === 'INTL' ? 'INTL' : 'INTL';
}

function saveRegion(r: Region) {
  try { localStorage.setItem('artier_signup_region', r); } catch { /* ignore */ }
}

/**
 * 로그인·가입 시트 (USR-AUT-02).
 * - 모바일: 하단 바텀시트. 데스크톱: 중앙 모달.
 * - 지역 추정(Policy §2.1.1) 후 `artier_signup_region` 저장. 카카오 선택 시 KR 강제.
 * - "이메일로 가입하기" → /signup. "로그인 하기" → /login?mode=email.
 */
export function AuthSheet({
  open,
  onOpenChange,
  redirectTo = '/',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectTo?: string;
}) {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : false,
  );
  const [region, setRegion] = useState<Region>(loadRegion);
  const [pendingSocial, setPendingSocial] = useState<SocialProvider | null>(null);
  const [loading, setLoading] = useState(false);

  // 뷰포트 감지
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(min-width: 768px)');
    const onChange = () => setIsDesktop(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  // 시트 열릴 때 지역 추정 (Policy §2.1.1)
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetchGeoDemo();
        if (cancelled) return;
        const next: Region = r.countryCode === 'KR' ? 'KR' : 'INTL';
        setRegion(next);
        saveRegion(next);
      } catch {
        // 폴백: 기존 저장값 또는 INTL
        const next = loadRegion();
        setRegion(next);
        saveRegion(next);
      }
    })();
    return () => { cancelled = true; };
  }, [open]);

  const toggleRegion = () => {
    const next: Region = region === 'KR' ? 'INTL' : 'KR';
    setRegion(next);
    saveRegion(next);
  };

  const completeReturningSocialLogin = (provider: SocialProvider) => {
    authStore.login();
    persistMockSession(`oauth-${provider}-demo`);
    onOpenChange(false);
    navigate(redirectTo, { replace: true });
  };

  const completeFirstSocialSignup = (provider: SocialProvider, nickname: string, email: string) => {
    authStore.login();
    persistMockSession(`oauth-${provider}-demo`);
    localStorage.setItem(`artier_social_signed_up__${provider}`, '1');
    localStorage.setItem('artier_pending_signup_nickname', nickname);
    localStorage.setItem('artier_pending_social_signup', provider);
    if (email) localStorage.setItem('artier_pending_signup_email', email);
    onOpenChange(false);
    navigate('/onboarding', { replace: true });
  };

  const handleSocialLogin = (provider: SocialProvider) => {
    // 카카오는 KR 강제 (Policy §2.1.1)
    if (provider === 'kakao') {
      setRegion('KR');
      saveRegion('KR');
    }
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

  const goSignup = () => {
    onOpenChange(false);
    navigate('/signup?step=1');
  };

  const goLogin = () => {
    onOpenChange(false);
    navigate('/login?mode=email');
  };

  const socialOrder: SocialProvider[] = locale === 'ko' ? ['kakao', 'google', 'apple'] : ['google', 'apple', 'kakao'];

  const KakaoIcon = (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 3C6.5 3 2 6.6 2 11c0 2.8 1.9 5.3 4.7 6.7-.2.7-.7 2.6-.8 3 0 0 0 .1.1.1s.1 0 .2 0c.2 0 2.6-1.7 3.6-2.4.7.1 1.4.2 2.2.2 5.5 0 10-3.6 10-8S17.5 3 12 3z" fill="currentColor" />
    </svg>
  );
  const GoogleIcon = (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
  const AppleIcon = (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="white" aria-hidden>
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-2.11 4.45-3.74 4.25z" />
    </svg>
  );

  const renderProviderButton = (provider: SocialProvider) => {
    if (provider === 'kakao') return (
      <Button
        key="kakao"
        type="button"
        onClick={() => handleSocialLogin(provider)}
        disabled={loading}
        className={cn('h-12 min-h-12 w-full gap-3 text-base font-medium', 'border-0 bg-[#FEE500] text-[#3C1E1E] lg:hover:bg-[#FDD800]')}
      >
        {KakaoIcon}
        {t('login.continueKakao')}
      </Button>
    );
    if (provider === 'google') return (
      <Button
        key="google"
        type="button"
        variant="outline"
        onClick={() => handleSocialLogin(provider)}
        disabled={loading}
        className="h-12 min-h-12 w-full gap-3 text-base font-medium"
      >
        {GoogleIcon}
        {t('login.continueGoogle')}
      </Button>
    );
    return (
      <Button
        key="apple"
        type="button"
        onClick={() => handleSocialLogin(provider)}
        disabled={loading}
        className="h-12 min-h-12 w-full gap-3 bg-foreground text-base font-medium text-white lg:hover:bg-foreground/90"
      >
        {AppleIcon}
        {t('login.continueApple')}
      </Button>
    );
  };

  const body = (
    <div className="flex flex-col gap-5 px-4 pt-6 pb-8 sm:px-6">
      {/* 브랜드 영역 */}
      <div className="flex flex-col items-center gap-2 pt-2">
        <p className="text-sm font-semibold tracking-wide text-primary">{t('login.tagline')}</p>
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground text-lg font-bold">
            A
          </div>
          <span className="text-2xl font-bold text-foreground tracking-tight">Artier</span>
        </div>
      </div>

      {/* 소셜 버튼 */}
      <div className="mt-2 flex flex-col gap-3">
        {socialOrder.map(renderProviderButton)}
      </div>

      {/* 또는 */}
      <div className="flex items-center gap-4">
        <Separator className="flex-1" />
        <span className="shrink-0 text-sm text-muted-foreground">{t('login.or')}</span>
        <Separator className="flex-1" />
      </div>

      {/* 이메일 가입 CTA */}
      <Button
        type="button"
        variant="outline"
        onClick={goSignup}
        className="h-12 min-h-12 w-full text-base font-semibold"
      >
        {t('login.signupEmail')}
      </Button>

      {/* 하단: 로그인 링크 + 지역 스위치 + 연령 고지 */}
      <div className="flex flex-col items-center gap-3 pt-2">
        <p className="text-sm text-muted-foreground">
          {t('login.haveAccount')}{' '}
          <button
            type="button"
            onClick={goLogin}
            className="font-semibold text-primary underline-offset-2 lg:hover:underline"
          >
            {t('login.signIn')}
          </button>
        </p>
        <button
          type="button"
          onClick={toggleRegion}
          className="text-xs text-muted-foreground underline-offset-2 lg:hover:underline"
        >
          {region === 'KR' ? t('login.regionSwitchToIntl') : t('login.regionSwitchToKr')}
        </button>
        <p className="text-center text-xs text-muted-foreground leading-relaxed px-2">
          {t('login.ageNotice')}
        </p>
      </div>

      <SocialSignupModal
        open={pendingSocial !== null}
        provider={pendingSocial}
        onClose={() => setPendingSocial(null)}
        onComplete={handleSocialSignupComplete}
      />
    </div>
  );

  // 데스크톱: 중앙 Dialog / 모바일: 하단 Drawer (Vaul 기반, 자연 높이·드래그 다운 지원)
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md p-0 gap-0">
          <DialogTitle className="sr-only">{t('login.signIn')}</DialogTitle>
          <DialogDescription className="sr-only">{t('login.tagline')}</DialogDescription>
          {body}
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh]">
        <DrawerTitle className="sr-only">{t('login.signIn')}</DrawerTitle>
        <DrawerDescription className="sr-only">{t('login.tagline')}</DrawerDescription>
        <div className="overflow-y-auto">
          {body}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default AuthSheet;
