import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';

const inputClass =
  'w-full px-3 sm:px-4 py-3 min-h-[44px] border border-[#F0F0F0] rounded-lg text-[13px] sm:text-sm text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#6366F1]/25 focus:border-[#6366F1] transition-all';

const emailValid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export default function PasswordReset() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sent, setSent] = useState(false);

  const emailError =
    submitted && !emailValid(email) ? t('passwordReset.errEmail') : '';

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!emailValid(email)) return;
    setSent(true);
  };

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
              className="flex w-full min-h-[44px] items-center justify-center rounded-lg border border-[#F0F0F0] text-[13px] sm:text-sm font-semibold text-[#18181B] hover:bg-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#6366F1]/25 focus:border-[#6366F1] transition-colors"
            >
              {t('passwordReset.backLogin')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="reset-email"
                className="flex items-center gap-1.5 text-[13px] sm:text-sm font-semibold text-[#18181B] mb-1.5"
              >
                <Mail className="h-3.5 w-3.5 text-[#71717A]" strokeWidth={2} />
                {t('passwordReset.email')}
              </label>
              <input
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

            <button
              type="submit"
              className="w-full min-h-[44px] rounded-lg bg-[#6366F1] text-white text-[13px] sm:text-sm font-semibold hover:bg-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:ring-offset-2 transition-colors"
            >
              {t('passwordReset.submit')}
            </button>

            <p className="text-center pt-4">
              <Link
                to="/login"
                className="text-[13px] sm:text-sm text-[#6366F1] font-semibold hover:underline"
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
