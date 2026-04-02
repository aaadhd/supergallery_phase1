import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { accountSuspensionStore, authStore } from '../store';
import { useI18n } from '../i18n/I18nProvider';

export default function Login() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirectTo = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);

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
    const untilLabel = s.until
      ? new Date(s.until).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
      : null;
    setErrors({
      general: `계정이 정지되었습니다. ${s.reason ? `사유: ${s.reason}. ` : ''}${
        untilLabel ? `해제 예정: ${untilLabel}. ` : ''
      }이의는 문의하기를 통해 접수할 수 있습니다.`,
    });
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (blockIfSuspended()) return;
    setLoading(true);
    setTimeout(() => {
      authStore.login();
      navigate(redirectTo, { replace: true });
    }, 400);
  };

  const handleSocialLogin = () => {
    if (blockIfSuspended()) return;
    setLoading(true);
    setTimeout(() => {
      authStore.login();
      navigate(redirectTo, { replace: true });
    }, 400);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-10">
          <div className="h-10 w-10 rounded-xl bg-[#6366F1] flex items-center justify-center text-white font-bold text-lg">A</div>
          <span className="text-xl font-bold text-[#18181B] tracking-tight">Artier</span>
        </Link>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined, general: undefined })); }}
              placeholder={t('login.emailPlaceholder')}
              className={`w-full px-4 py-3.5 rounded-lg border text-base transition-colors focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent ${errors.email ? 'border-red-400' : 'border-[#E4E4E7]'}`}
            />
            {errors.email && <p className="mt-1.5 text-sm text-red-500">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined, general: undefined })); }}
                placeholder={t('login.passwordPlaceholder')}
                className={`w-full px-4 py-3.5 pr-12 rounded-lg border text-base transition-colors focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent ${errors.password ? 'border-red-400' : 'border-[#E4E4E7]'}`}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <p className="mt-1.5 text-sm text-red-500">{errors.password}</p>}
          </div>

          {errors.general && <p className="text-sm text-red-500 text-center">{errors.general}</p>}

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#18181B] text-white text-base font-medium rounded-lg hover:bg-black transition-colors disabled:opacity-60 min-h-[48px]"
          >
            {loading ? t('login.loading') : t('login.submit')}
          </button>

          {/* Password Reset */}
          <div className="text-center">
            <Link to="/reset-password" className="text-sm text-gray-500 hover:text-[#6366F1] transition-colors">
              {t('login.forgot')}
            </Link>
          </div>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-[#E4E4E7]" />
          <span className="text-sm text-gray-400">{t('login.or')}</span>
          <div className="flex-1 h-px bg-[#E4E4E7]" />
        </div>

        {/* Social Login */}
        <div className="space-y-3">
          <button onClick={handleSocialLogin} className="w-full flex items-center justify-center gap-3 py-3.5 rounded-lg text-base font-medium transition-colors min-h-[48px] bg-[#FEE500] text-[#3C1E1E] hover:bg-[#FDD800]">
            <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M12 3C6.5 3 2 6.6 2 11c0 2.8 1.9 5.3 4.7 6.7-.2.7-.7 2.6-.8 3 0 0 0 .1.1.1s.1 0 .2 0c.2 0 2.6-1.7 3.6-2.4.7.1 1.4.2 2.2.2 5.5 0 10-3.6 10-8S17.5 3 12 3z" fill="currentColor"/></svg>
            {t('login.kakao')}
          </button>
          <button onClick={handleSocialLogin} className="w-full flex items-center justify-center gap-3 py-3.5 rounded-lg border border-[#E4E4E7] text-base font-medium text-[#18181B] hover:bg-[#FAFAFA] transition-colors min-h-[48px]">
            <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            {t('login.google')}
          </button>
          <button onClick={handleSocialLogin} className="w-full flex items-center justify-center gap-3 py-3.5 rounded-lg bg-black text-white text-base font-medium hover:bg-gray-900 transition-colors min-h-[48px]">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="white"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-2.11 4.45-3.74 4.25z"/></svg>
            {t('login.apple')}
          </button>
        </div>

        {/* Sign Up Link */}
        <p className="mt-8 text-center text-sm text-gray-500">
          {t('login.signupPrompt')}{' '}
          <Link to="/signup" className="text-[#6366F1] font-medium hover:underline">{t('login.signup')}</Link>
        </p>

        {import.meta.env.DEV && (
          <div className="mt-10 pt-6 border-t border-dashed border-[#E4E4E7] text-center text-xs text-[#A1A1AA] space-y-2">
            <p>개발용: 계정 정지 정책(로그인 차단) 시뮬레이션</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                className="px-2 py-1 rounded border border-[#E4E4E7] hover:bg-[#FAFAFA]"
                onClick={() => {
                  accountSuspensionStore.set({
                    active: true,
                    reason: '콘텐츠·신고 정책 위반 (데모)',
                    until: new Date(Date.now() + 7 * 86400000).toISOString(),
                  });
                  alert('7일 정지 상태가 로컬에 설정되었습니다. 로그인을 시도해 보세요.');
                }}
              >
                7일 정지 넣기
              </button>
              <button
                type="button"
                className="px-2 py-1 rounded border border-[#E4E4E7] hover:bg-[#FAFAFA]"
                onClick={() => {
                  accountSuspensionStore.clear();
                  alert('정지 상태가 해제되었습니다.');
                }}
              >
                정지 해제
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
