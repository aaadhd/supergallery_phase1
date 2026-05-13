import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { artists } from '../data';
import {
  authStore,
  performAccountWithdrawal,
  useAuthStore,
  workStore,
} from '../store';
import { curationStore } from '../utils/curationStore';
import { loadMockSession } from '../services/sessionTokens';
import { Button } from '../components/ui/button';
import { openConfirm } from '../components/ConfirmDialog';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/messages';
import { getFontScale, setFontScale, type FontScale } from '../utils/fontScale';
import { useTheme } from 'next-themes';

const STORAGE_KEY = 'artier_notification_settings';

const WITHDRAW_REASON_IDS = ['low_use', 'other_service', 'privacy', 'exp_difficult', 'other'] as const;
type WithdrawReasonId = (typeof WITHDRAW_REASON_IDS)[number];

const WITHDRAW_REASON_KEYS: Record<WithdrawReasonId, MessageKey> = {
  low_use: 'settings.withdrawReasonLowUse',
  other_service: 'settings.withdrawReasonOtherService',
  privacy: 'settings.withdrawReasonPrivacy',
  exp_difficult: 'settings.withdrawReasonExpDifficult',
  other: 'settings.withdrawReasonOther',
};

/** 콘텐츠 운영 정책 · 화면 모음 알림 설정 기준 (IA USR-STG-05 A-3) */
export type NotificationSettingsState = {
  /** 내 작품 반응 알림 — 좋아요·팔로우 묶음 (기본 ON) */
  reactionAlerts: boolean;
  /** 이벤트 알림 — 응모전 공지·이벤트 (기본 OFF) */
  eventAlerts: boolean;
};

const defaultNotifications: NotificationSettingsState = {
  reactionAlerts: true,
  eventAlerts: false,
};

export function loadNotificationSettings(): NotificationSettingsState {
  if (typeof window === 'undefined') return defaultNotifications;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultNotifications;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    // 신규 포맷
    if ('reactionAlerts' in parsed) {
      return {
        reactionAlerts: typeof parsed.reactionAlerts === 'boolean' ? parsed.reactionAlerts : true,
        eventAlerts: typeof parsed.eventAlerts === 'boolean' ? parsed.eventAlerts : false,
      };
    }
    // 구 포맷 마이그레이션 (like·newFollower·marketing 키)
    return {
      reactionAlerts: parsed.like !== false && parsed.newFollower !== false,
      eventAlerts: parsed.marketing === true,
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
    <div className="flex justify-between items-center py-3 gap-3">
      <div className="min-w-0">
        <span className="text-sm text-foreground">{label}</span>
        {hint && <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{hint}</p>}
      </div>
      <Button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          disabled ? 'opacity-40 cursor-not-allowed bg-muted' : checked ? 'bg-primary' : 'bg-muted'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </Button>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const auth = useAuthStore();
  const { t } = useI18n();
  const [notifications, setNotifications] = useState<NotificationSettingsState>(loadNotificationSettings);
  const [fontScale, setFontScaleState] = useState<FontScale>(() => getFontScale());
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawConsent, setWithdrawConsent] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState<WithdrawReasonId | ''>('');
  const [withdrawBusy, setWithdrawBusy] = useState(false);
  const [withdrawWarnings, setWithdrawWarnings] = useState<string[]>([]);

  const sessionSub = loadMockSession()?.sub;
  const isEmailShape = Boolean(sessionSub?.includes('@'));
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

  const handleFontScale = (next: FontScale) => {
    setFontScaleState(next);
    setFontScale(next);
  };

  const handleLogout = async () => {
    if (!(await openConfirm({ title: t('settings.confirmLogout'), confirmLabel: t('nav.logout') }))) return;
    authStore.logout();
    toast.success(t('settings.toastLogout'));
    navigate('/');
  };

  const confirmWithdraw = () => {
    if (!withdrawReason) {
      toast.error(t('settings.withdrawReasonPickErr'));
      return;
    }
    if (!withdrawConsent) {
      toast.error(t('settings.withdrawConsentErr'));
      return;
    }
    setWithdrawBusy(true);
    window.setTimeout(() => {
      performAccountWithdrawal(currentArtistId, withdrawReason);
      setWithdrawBusy(false);
      setWithdrawOpen(false);
      setWithdrawConsent(false);
      setWithdrawReason('');
      toast.success(t('settings.toastWithdrawDone'));
      navigate('/');
    }, 400);
  };

  if (!auth.isLoggedIn()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Toaster position="top-center" richColors toastOptions={{ duration: 5000 }} />
      <div className="mx-auto max-w-3xl px-5 sm:px-6 py-10 sm:py-12">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight mb-10">{t('settings.title')}</h1>

        {isEmailShape && sessionSub ? (
          <section className="mb-10">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-1">
              {t('settings.sectionAccount')}
            </h2>
            <div className="rounded-lg border border-border/40 overflow-hidden bg-card px-4 py-4">
              <p className="text-xs text-muted-foreground mb-1">
                {t('settings.emailLabel')}
              </p>
              <p className="text-base text-foreground break-all">
                {sessionSub}
              </p>
            </div>
          </section>
        ) : null}


        <section className="mb-10" id="font-scale">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-3">
            {t('settings.sectionFontScale')}
          </h2>
          <div className="rounded-lg border border-border/40 bg-card p-2 grid grid-cols-3 gap-2" role="radiogroup" aria-label={t('settings.sectionFontScale')}>
            {(['small', 'medium', 'large'] as const).map((opt) => {
              const active = fontScale === opt;
              const labelKey = `settings.fontScale_${opt}` as MessageKey;
              const sizeClass = opt === 'small' ? 'text-sm' : opt === 'medium' ? 'text-base' : 'text-lg';
              return (
                <button
                  key={opt}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => handleFontScale(opt)}
                  className={`min-h-[48px] rounded-md border px-3 py-2 ${sizeClass} transition-colors ${
                    active
                      ? 'border-primary bg-primary/10 text-foreground font-medium'
                      : 'border-border/60 text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  {t(labelKey)}
                </button>
              );
            })}
          </div>
        </section>


        {/* Policy §19.4 다크 모드 — Settings(USR-STG-01) "밝게/어둡게" 2옵션 토글. 시스템 자동 감지 미사용. */}
        <ThemeToggleSection />


        <section className="mb-10" id="notifications">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-3">
            {t('settings.sectionNotif')}
          </h2>

          <div className="rounded-xl border border-border/50 bg-card divide-y divide-border/40 overflow-hidden">
            <div className="px-4">
              <ToggleRow
                label={t('settings.notifReactionAlerts')}
                checked={notifications.reactionAlerts}
                onChange={(v) => handleToggle('reactionAlerts', v)}
                hint={t('settings.notifReactionAlertsHint')}
              />
              <ToggleRow
                label={t('settings.notifMarketing')}
                checked={notifications.eventAlerts}
                onChange={(v) => handleToggle('eventAlerts', v)}
                hint={t('settings.notifEventAlertsHint')}
              />
            </div>
            <p className="px-4 py-3 text-xs text-muted-foreground">
              {t('settings.notifSystemAlwaysOn')}
            </p>
          </div>


        </section>

        <div className="h-px bg-border my-10" aria-hidden />

        <section>
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-3">
            {t('settings.sectionAccountActions')}
          </h2>
          <div className="rounded-xl border border-border/50 overflow-hidden bg-card">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-between px-4 py-3.5 text-sm font-medium text-primary lg:hover:bg-muted/40 transition-colors"
            >
              <span>{t('settings.logoutRow')}</span>
              <span className="text-xs text-muted-foreground">→</span>
            </button>
          </div>

          {/* 서비스 정보 — 모바일 전용 (md 이상은 하단 Footer가 담당) */}
        <div className="md:hidden mt-10 pt-6 border-t border-border/40">
          <ServiceInfoSection />
        </div>

        <div className="mt-8 pt-6 border-t border-destructive/20">
            <p className="text-xs text-muted-foreground mb-3 text-center">{t('settings.withdrawWarning')}</p>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                const myWorks = workStore.getWorks().filter(w => w.artistId === currentArtistId);
                const curations = curationStore.getCuratedExhibitions();
                const warnings: string[] = [];
                const hasPick = myWorks.some(w => w.pick === true || w.pickBadge === true);
                const hasCuration = myWorks.some(w => curations.some(c => c.pieces.some(p => p.workId === w.id)));
                const hasContest = myWorks.some(w => w.linkedEventId != null);
                if (hasPick) warnings.push(t('settings.withdrawWarnPick'));
                if (hasCuration) warnings.push(t('settings.withdrawWarnCuration'));
                if (hasContest) warnings.push(t('settings.withdrawWarnContest'));
                setWithdrawWarnings(warnings);
                setWithdrawOpen(true);
              }}
              className="w-full text-sm text-destructive border-destructive/30 hover:bg-destructive/5 min-h-[44px]"
            >
              {t('settings.withdraw')}
            </Button>
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
          <div className="bg-card rounded-xl max-w-md w-full shadow-xl p-6 space-y-4">
            <h2 id="withdraw-title" className="text-lg font-semibold text-foreground">
              {t('settings.withdrawTitle')}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{t('settings.withdrawBody')}</p>
            {withdrawWarnings.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 space-y-1.5">
                <p className="text-xs font-semibold text-amber-800">{t('settings.withdrawCheckTitle')}</p>
                {withdrawWarnings.map((msg, i) => (
                  <p key={i} className="text-xs text-amber-700 leading-snug">· {msg}</p>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">{t('settings.withdrawReasonSection')}</p>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {WITHDRAW_REASON_IDS.map((id) => (
                  <label
                    key={id}
                    className={`flex min-h-[44px] items-center gap-3 p-3 rounded-lg border cursor-pointer text-sm transition-colors ${
                      withdrawReason === id ? 'border-primary bg-muted/50' : 'border-border lg:hover:bg-muted/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="withdraw-reason"
                      value={id}
                      checked={withdrawReason === id}
                      onChange={() => setWithdrawReason(id)}
                      className="h-5 w-5 shrink-0 text-primary accent-primary"
                    />
                    <span className="text-foreground">{t(WITHDRAW_REASON_KEYS[id])}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-border/40 bg-muted/40 p-3">
              <Checkbox
                id="withdraw-consent"
                checked={withdrawConsent}
                onCheckedChange={(v) => setWithdrawConsent(v === true)}
                className="mt-0.5"
              />
              <Label
                htmlFor="withdraw-consent"
                className="cursor-pointer text-sm font-normal leading-snug text-foreground"
              >
                {t('settings.withdrawConsentLabel')}
              </Label>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                onClick={() => {
                  setWithdrawOpen(false);
                  setWithdrawConsent(false);
                  setWithdrawReason('');
                  setWithdrawWarnings([]);
                }}
                className="min-h-[44px] px-4 py-2.5 text-sm font-medium rounded-lg border border-border lg:hover:bg-muted/50"
              >
                {t('loginPrompt.cancel')}
              </Button>
              <Button variant="destructive"
                type="button"
                disabled={withdrawBusy}
                onClick={confirmWithdraw}
                className="min-h-[44px] px-4 py-2.5 text-sm font-medium rounded-lg bg-destructive text-white lg:hover:opacity-90 disabled:opacity-50"
              >
                {withdrawBusy ? t('settings.withdrawBusy') : t('settings.withdrawSubmit')}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function ServiceInfoSection() {
  const { t } = useI18n();
  const [bizOpen, setBizOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!bizOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setBizOpen(false); };
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setBizOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('mousedown', onClick); };
  }, [bizOpen]);

  const links = [
    { to: '/terms', label: t('footer.terms') },
    { to: '/privacy', label: t('footer.privacy') },
    { to: '/contact', label: t('footer.contact') },
  ];

  return (
    <div ref={ref}>
      <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-3">
        {t('settings.sectionServiceInfo')}
      </h2>
      <div className="rounded-xl border border-border/50 overflow-hidden bg-card divide-y divide-border/40">
        {links.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center justify-between px-4 py-3.5 text-sm text-foreground lg:hover:bg-muted/40 transition-colors"
          >
            <span>{label}</span>
            <span className="text-xs text-muted-foreground">→</span>
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setBizOpen(v => !v)}
          aria-expanded={bizOpen}
          className="w-full flex items-center justify-between px-4 py-3.5 text-sm text-foreground lg:hover:bg-muted/40 transition-colors"
        >
          <span>{t('footer.businessInfo')}</span>
          {bizOpen
            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
        {bizOpen && (
          <div className="px-4 py-4 text-xs text-muted-foreground space-y-1 leading-relaxed bg-muted/30">
            <p>{t('footer.labelCompany')}: {t('footer.bizCompanyValue')}</p>
            <p>{t('footer.labelRepresentative')}: {t('footer.bizRepValue')}</p>
            <p>{t('footer.labelBizReg')}: {t('footer.bizRegValue')}</p>
            <p>{t('footer.labelMailOrder')}: {t('footer.mailOrderValue')}</p>
            <p>{t('footer.labelAddress')}: {t('footer.addressValue')}</p>
            <p>{t('footer.labelEmail')}: {t('footer.contactEmailValue')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Policy §19.4 다크 모드 — Settings(USR-STG-01) "밝게/어둡게" 2옵션 토글.
 * 시스템 자동 감지(prefers-color-scheme) 미사용 — 시니어 사용자가 의도치 않게 다크에 노출되어
 * 작품 색감이 손상되는 것을 막기 위함. 기본값 'light'(App ThemeProvider).
 * 사용자 선택은 localStorage 'artier_theme'에 영속(next-themes 기본 동작).
 *
 * mounted 가드는 SSR/하이드레이션 mismatch 방지용 표준 패턴.
 */
function ThemeToggleSection() {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const current: 'light' | 'dark' = theme === 'dark' ? 'dark' : 'light';

  return (
    <section className="mb-10" id="theme">
      <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-3">
        {t('settings.sectionTheme')}
      </h2>
      <div
        className="rounded-lg border border-border/40 bg-card p-2 grid grid-cols-2 gap-2"
        role="radiogroup"
        aria-label={t('settings.sectionTheme')}
      >
        {(['light', 'dark'] as const).map((opt) => {
          const active = current === opt;
          const labelKey = `settings.theme_${opt}` as MessageKey;
          return (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setTheme(opt)}
              className={`min-h-[48px] rounded-md border px-3 py-2 text-base transition-colors ${
                active
                  ? 'border-primary bg-primary/10 text-foreground font-medium'
                  : 'border-border/60 text-muted-foreground hover:bg-muted/50'
              }`}
            >
              {t(labelKey)}
            </button>
          );
        })}
      </div>
    </section>
  );
}
