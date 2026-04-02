import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { artists } from '../data';
import {
  authStore,
  performAccountWithdrawal,
  useAuthStore,
} from '../store';
import { type Locale } from '../i18n/uiStrings';
import { useI18n } from '../i18n/I18nProvider';

const STORAGE_KEY = 'artier_notification_settings';

/** 콘텐츠 운영 정책 · 화면 모음 알림 설정 기준 */
export type NotificationSettingsState = {
  like: boolean;
  newFollower: boolean;
  groupExhibitionInvite: boolean;
  followingNewWork: boolean;
  weeklyTheme: boolean;
  marketing: boolean;
};

const defaultNotifications: NotificationSettingsState = {
  like: true,
  newFollower: true,
  groupExhibitionInvite: true,
  followingNewWork: false,
  weeklyTheme: false,
  marketing: false,
};

export function loadNotificationSettings(): NotificationSettingsState {
  if (typeof window === 'undefined') return defaultNotifications;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultNotifications;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if ('groupExhibitionInvite' in parsed && typeof parsed.groupExhibitionInvite === 'boolean') {
      return { ...defaultNotifications, ...parsed } as NotificationSettingsState;
    }
    return {
      ...defaultNotifications,
      like: typeof parsed.like === 'boolean' ? parsed.like : true,
      newFollower: typeof parsed.follow === 'boolean' ? parsed.follow : true,
      marketing: typeof parsed.marketing === 'boolean' ? parsed.marketing : false,
    };
  } catch {
    return defaultNotifications;
  }
}

function ToggleRow({
  label,
  checked,
  onChange,
  disabled,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex justify-between items-center py-4 border-b border-[#F0F0F0] gap-3">
      <div className="min-w-0">
        <span className="text-[15px] text-[#18181B]">{label}</span>
        {hint && <p className="text-xs text-[#A1A1AA] mt-0.5">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed bg-[#E4E4E7]' : checked ? 'bg-[#6366F1]' : 'bg-[#D4D4D8]'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const auth = useAuthStore();
  const { t, locale, setLocale: setAppLocale } = useI18n();
  const [notifications, setNotifications] = useState<NotificationSettingsState>(loadNotificationSettings);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawPassword, setWithdrawPassword] = useState('');
  const [withdrawBusy, setWithdrawBusy] = useState(false);

  const demoEmail = 'artist@artier.kr';
  const currentArtistId = artists[0].id;

  useEffect(() => {
    setNotifications(loadNotificationSettings());
  }, []);

  useEffect(() => {
    if (!auth.isLoggedIn()) {
      navigate('/login?redirect=/settings', { replace: true });
    }
  }, [auth, navigate]);

  const persistNotifications = useCallback((next: NotificationSettingsState) => {
    setNotifications(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event('artier-notification-prefs'));
  }, []);

  const handleToggle = (key: keyof NotificationSettingsState, value: boolean) => {
    const next = { ...notifications, [key]: value };
    persistNotifications(next);
  };

  const handleLogout = () => {
    if (!window.confirm(t('settings.confirmLogout'))) return;
    authStore.logout();
    toast.success(t('settings.toastLogout'));
    navigate('/');
  };

  const handleLocale = (next: Locale) => {
    setAppLocale(next);
    toast.message(next === 'ko' ? t('settings.toastLocaleKo') : t('settings.toastLocaleEn'));
  };

  const confirmWithdraw = () => {
    if (!withdrawPassword.trim()) {
      toast.error(t('settings.toastWithdrawPw'));
      return;
    }
    setWithdrawBusy(true);
    window.setTimeout(() => {
      performAccountWithdrawal(currentArtistId);
      setWithdrawBusy(false);
      setWithdrawOpen(false);
      setWithdrawPassword('');
      toast.success(t('settings.toastWithdrawDone'));
      navigate('/');
    }, 400);
  };

  if (!auth.isLoggedIn()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white pb-16">
      <Toaster position="top-center" richColors />
      <div className="mx-auto max-w-lg px-5 sm:px-6 py-10 sm:py-12">
        <h1 className="text-2xl font-semibold text-[#18181B] tracking-tight mb-10">{t('settings.title')}</h1>

        <section className="mb-10">
          <h2 className="text-[13px] font-medium uppercase tracking-wide text-[#71717A] mb-1">
            {t('settings.sectionAccount')}
          </h2>
          <div className="rounded-lg border border-[#F0F0F0] overflow-hidden bg-white px-4 py-4">
            <p className="text-xs text-[#71717A] mb-1">{t('settings.emailLabel')}</p>
            <p className="text-[15px] text-[#18181B]">{demoEmail}</p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-[13px] font-medium uppercase tracking-wide text-[#71717A] mb-1">
            {t('settings.sectionProfile')}
          </h2>
          <div className="rounded-lg border border-[#F0F0F0] overflow-hidden bg-white">
            <Link
              to="/profile"
              className="flex justify-between items-center py-4 px-4 border-b border-[#F0F0F0] last:border-b-0 hover:bg-[#FAFAFA] transition-colors"
            >
              <span className="text-[15px] text-[#18181B]">{t('settings.goProfileEdit')}</span>
              <ChevronRight className="w-5 h-5 text-[#A1A1AA]" aria-hidden />
            </Link>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-[13px] font-medium uppercase tracking-wide text-[#71717A] mb-1">
            {t('settings.sectionSocial')}
          </h2>
          <div className="rounded-lg border border-[#F0F0F0] px-4 py-3 bg-[#FAFAFA] text-sm text-[#71717A]">
            {t('settings.socialDemoNote')}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-[13px] font-medium uppercase tracking-wide text-[#71717A] mb-1">
            {t('settings.sectionLang')}
          </h2>
          <div className="rounded-lg border border-[#F0F0F0] overflow-hidden bg-white flex">
            <button
              type="button"
              onClick={() => handleLocale('ko')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                locale === 'ko' ? 'bg-[#6366F1] text-white' : 'text-[#18181B] hover:bg-[#FAFAFA]'
              }`}
            >
              {t('settings.langKo')}
            </button>
            <button
              type="button"
              onClick={() => handleLocale('en')}
              className={`flex-1 py-3 text-sm font-medium transition-colors border-l border-[#F0F0F0] ${
                locale === 'en' ? 'bg-[#6366F1] text-white' : 'text-[#18181B] hover:bg-[#FAFAFA]'
              }`}
            >
              {t('nav.langEn')}
            </button>
          </div>
          <p className="text-xs text-[#A1A1AA] mt-2">{t('settings.localeNote')}</p>
        </section>

        <div className="h-px bg-[#F0F0F0] my-10" aria-hidden />

        <section className="mb-10" id="notifications">
          <h2 className="text-[13px] font-medium uppercase tracking-wide text-[#71717A] mb-3">
            {t('settings.sectionNotif')}
          </h2>
          <p className="text-xs text-[#A1A1AA] mb-3">{t('settings.notifIntro')}</p>

          <div className="rounded-lg border border-[#F0F0F0] px-4 bg-white mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#A1A1AA] pt-4 pb-1">
              {t('settings.notifOptionalGroup')}
            </p>
            <ToggleRow
              label={t('settings.notifLike')}
              checked={notifications.like}
              onChange={(v) => handleToggle('like', v)}
            />
            <ToggleRow
              label={t('settings.notifNewFollower')}
              checked={notifications.newFollower}
              onChange={(v) => handleToggle('newFollower', v)}
            />
            <ToggleRow
              label={t('settings.notifGroupInvite')}
              checked={notifications.groupExhibitionInvite}
              onChange={(v) => handleToggle('groupExhibitionInvite', v)}
            />
            <ToggleRow
              label={t('settings.notifFollowingWork')}
              checked={notifications.followingNewWork}
              onChange={(v) => handleToggle('followingNewWork', v)}
            />
            <ToggleRow
              label={t('settings.notifWeeklyTheme')}
              checked={notifications.weeklyTheme}
              onChange={(v) => handleToggle('weeklyTheme', v)}
              hint={t('settings.notifWeeklyThemeHint')}
            />
            <ToggleRow
              label={t('settings.notifMarketing')}
              checked={notifications.marketing}
              onChange={(v) => handleToggle('marketing', v)}
            />
          </div>

          <div className="rounded-lg border border-[#F0F0F0] px-4 bg-white">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#A1A1AA] pt-4 pb-1">
              {t('settings.notifRequiredGroup')}
            </p>
            <ToggleRow
              label={t('settings.notifSystem')}
              checked
              onChange={() => {}}
              disabled
              hint={t('settings.notifSystemHint')}
            />
          </div>
        </section>

        <div className="h-px bg-[#F0F0F0] my-10" aria-hidden />

        <section>
          <h2 className="text-[13px] font-medium uppercase tracking-wide text-[#71717A] mb-3">
            {t('settings.sectionAccountActions')}
          </h2>
          <div className="rounded-lg border border-[#F0F0F0] overflow-hidden bg-white">
            <Link
              to="/reset-password"
              className="flex justify-between items-center py-4 px-4 border-b border-[#F0F0F0] hover:bg-[#FAFAFA] transition-colors"
            >
              <span className="text-[15px] text-[#18181B]">{t('settings.changePassword')}</span>
              <ChevronRight className="w-5 h-5 text-[#A1A1AA]" aria-hidden />
            </Link>
            <div className="flex justify-between items-center py-4 px-4 border-b border-[#F0F0F0]">
              <span className="text-[15px] text-[#18181B]">{t('settings.logoutRow')}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-[15px] font-medium text-[#6366F1] hover:opacity-90"
              >
                {t('nav.logout')}
              </button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setWithdrawOpen(true)}
              className="text-xs text-[#A1A1AA] hover:text-[#71717A] underline underline-offset-2"
            >
              {t('settings.withdraw')}
            </button>
          </div>
        </section>
      </div>

      {withdrawOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-labelledby="withdraw-title"
        >
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl p-6 space-y-4">
            <h2 id="withdraw-title" className="text-lg font-semibold text-[#18181B]">
              {t('settings.withdrawTitle')}
            </h2>
            <p className="text-sm text-[#52525B] leading-relaxed">{t('settings.withdrawBody')}</p>
            <div>
              <label htmlFor="withdraw-pw" className="text-xs text-[#71717A] block mb-1.5">
                {t('settings.withdrawPwLabel')}
              </label>
              <input
                id="withdraw-pw"
                type="password"
                autoComplete="current-password"
                value={withdrawPassword}
                onChange={(e) => setWithdrawPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-[#E4E4E7] text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                placeholder={t('settings.withdrawPwPh')}
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setWithdrawOpen(false);
                  setWithdrawPassword('');
                }}
                className="px-4 py-2.5 text-sm font-medium rounded-lg border border-[#E4E4E7] hover:bg-[#FAFAFA]"
              >
                {t('loginPrompt.cancel')}
              </button>
              <button
                type="button"
                disabled={withdrawBusy}
                onClick={confirmWithdraw}
                className="px-4 py-2.5 text-sm font-medium rounded-lg bg-[#DC2626] text-white hover:opacity-90 disabled:opacity-50"
              >
                {withdrawBusy ? t('settings.withdrawBusy') : t('settings.withdrawSubmit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
