import { useState, FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '../i18n/I18nProvider';
import { passwordMatchesPhase1Policy } from '../utils/passwordPolicy';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const inputClass =
  'min-h-[44px] rounded-lg border-[#F0F0F0] px-3 py-3 text-[13px] text-[#18181B] placeholder:text-[#A1A1AA] sm:px-4 sm:text-sm focus-visible:ring-primary/25';

const emailValid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export default function PasswordReset() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const demo = searchParams.get('demo');

  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sent, setSent] = useState(false);

  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [pwSubmitted, setPwSubmitted] = useState(false);
  const [pwDone, setPwDone] = useState(false);

  const emailError =
    submitted && !emailValid(email) ? t('passwordReset.errEmail') : '';

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!emailValid(email)) return;
    setSent(true);
  };

  const pwError =
    pwSubmitted && (!passwordMatchesPhase1Policy(pw1) || pw1 !== pw2)
      ? t('passwordResetDemo.pwMismatchOrPolicy')
      : '';

  const handleNewPw = (e: FormEvent) => {
    e.preventDefault();
    setPwSubmitted(true);
    if (!passwordMatchesPhase1Policy(pw1) || pw1 !== pw2) return;
    setPwDone(true);
    toast.success(t('passwordResetDemo.pwSuccessToast'));
  };

  if (demo === 'link_expired') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 py-10">
        <div className="w-full max-w-md text-center space-y-6">
          <h1 className="text-xl sm:text-2xl font-bold text-[#18181B]">{t('passwordResetDemo.expiredTitle')}</h1>
          <p className="text-sm text-[#52525B] leading-relaxed">{t('passwordResetDemo.expiredBody')}</p>
          <Link
            to="/reset-password"
            className="flex w-full min-h-[44px] items-center justify-center rounded-lg bg-primary text-white text-sm font-semibold lg:hover:bg-primary/90"
          >
            {t('passwordResetDemo.resendCta')}
          </Link>
          <p className="text-xs text-[#A1A1AA]">{t('signupDemo.demoBanner')}</p>
        </div>
      </div>
    );
  }

  if (demo === 'new_password') {
    if (pwDone) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 py-10">
          <div className="w-full max-w-md text-center space-y-6">
            <h1 className="text-xl sm:text-2xl font-bold text-[#18181B]">{t('passwordResetDemo.doneTitle')}</h1>
            <p className="text-sm text-[#52525B]">{t('passwordResetDemo.doneBody')}</p>
            <Link
              to="/login"
              className="flex w-full min-h-[44px] items-center justify-center rounded-lg bg-[#18181B] text-white text-sm font-semibold lg:hover:opacity-90"
            >
              {t('passwordReset.backLogin')}
            </Link>
            <p className="text-xs text-[#A1A1AA]">{t('signupDemo.demoBanner')}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 py-10">
        <div className="w-full max-w-md">
          <h1 className="text-xl sm:text-2xl font-bold text-[#18181B] text-center mb-2">{t('passwordResetDemo.newPwTitle')}</h1>
          <p className="text-xs text-center text-[#71717A] mb-8">{t('passwordResetDemo.newPwHint')}</p>

          <form onSubmit={handleNewPw} className="space-y-4">
            <div>
              <Label htmlFor="npw1" className="mb-1.5 block text-sm font-semibold text-[#18181B]">
                {t('passwordResetDemo.newPwLabel')}
              </Label>
              <Input
                id="npw1"
                type="password"
                autoComplete="new-password"
                value={pw1}
                onChange={(e) => setPw1(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <Label htmlFor="npw2" className="mb-1.5 block text-sm font-semibold text-[#18181B]">
                {t('passwordResetDemo.newPwConfirm')}
              </Label>
              <Input
                id="npw2"
                type="password"
                autoComplete="new-password"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                className={inputClass}
              />
            </div>
            {pwError ? <p className="text-sm text-red-600">{pwError}</p> : null}
            <Button
              type="submit"
              className="w-full min-h-[44px] rounded-lg bg-primary text-white text-sm font-semibold lg:hover:bg-primary/90"
            >
              {t('passwordResetDemo.newPwSubmit')}
            </Button>
          </form>
          <p className="text-xs text-center mt-6 text-[#A1A1AA]">{t('signupDemo.demoBanner')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 py-10">
      <div className="w-full max-w-md">
        <h1 className="text-xl sm:text-2xl font-bold text-[#18181B] text-center mb-8">
          {t('passwordReset.title')}
        </h1>

        {sent ? (
          <div className="space-y-6">
            <p className="text-[13px] sm:text-sm text-[#18181B] leading-relaxed text-center px-1">
              {t('passwordReset.sent')}
            </p>
            <Link
              to="/login"
              className="flex w-full min-h-[44px] items-center justify-center rounded-lg border border-[#F0F0F0] text-[13px] sm:text-sm font-semibold text-[#18181B] lg:hover:bg-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-colors"
            >
              {t('passwordReset.backLogin')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label
                htmlFor="reset-email"
                className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-[#18181B] sm:text-sm"
              >
                <Mail className="h-3.5 w-3.5 text-[#71717A]" strokeWidth={2} />
                {t('passwordReset.email')}
              </Label>
              <Input
                id="reset-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('signup.emailPh')}
                className={inputClass}
              />
              {emailError ? (
                <p className="mt-1.5 text-[13px] text-red-600">{emailError}</p>
              ) : null}
            </div>

            <Button
              type="submit"
              className="w-full min-h-[44px] rounded-lg bg-primary text-white text-[13px] sm:text-sm font-semibold lg:hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
            >
              {t('passwordReset.submit')}
            </Button>

            <p className="text-center pt-4">
              <Link
                to="/login"
                className="text-[13px] sm:text-sm text-primary font-semibold lg:hover:underline"
              >
                {t('passwordReset.backLogin')}
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
