import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, UserPlus, Star, Bell, Check, Calendar, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { artists } from '../data';
import type { Locale } from '../i18n/uiStrings';
import type { MessageKey } from '../i18n/messages';
import { useI18n } from '../i18n/I18nProvider';
import { loadNotificationSettings, type NotificationSettingsState } from './Settings';
import { openConfirm } from '../components/ConfirmDialog';
import { authStore } from '../store';

const STORAGE_KEY = 'artier_notifications';
const MAX_NOTIFICATIONS = 200;
const NOTIF_RETENTION_MS = 90 * 86400000;

interface Notification {
  id: string;
  type: 'like' | 'follow' | 'pick' | 'system' | 'event' | 'invite';
  /** 동적 알림은 message 그대로, 시드·시스템은 messageKey + replacements 권장 (i18n 정합). */
  message?: string;
  messageKey?: MessageKey;
  messageReplacements?: Record<string, string>;
  fromUser?: { name: string; avatar: string; id: string };
  workId?: string;
  read: boolean;
  createdAt: string;
  /** 플로우 데모에서 넣은 알림 — 알림 설정과 무관하게 목록에 표시 */
  demo?: boolean;
}

function resolveNotificationMessage(
  n: Notification,
  t: (k: MessageKey) => string,
): string {
  if (n.messageKey) {
    let s = t(n.messageKey);
    if (n.messageReplacements) {
      for (const [k, v] of Object.entries(n.messageReplacements)) {
        s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
      }
    }
    return s;
  }
  return n.message ?? '';
}

function generateSeedNotifications(): Notification[] {
  const now = Date.now();
  return [
    {
      id: 'n1',
      type: 'like',
      messageKey: 'notifications.seedLikedWork',
      messageReplacements: { work: '빛의 여정' },
      fromUser: { name: artists[1].name, avatar: artists[1].avatar, id: artists[1].id },
      workId: 'local-img-0',
      read: false,
      createdAt: new Date(now - 1000 * 60 * 30).toISOString(),
    },
    {
      id: 'n2',
      type: 'follow',
      messageKey: 'notifications.seedFollowed',
      fromUser: { name: artists[2].name, avatar: artists[2].avatar, id: artists[2].id },
      read: false,
      createdAt: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      id: 'n3',
      type: 'like',
      messageKey: 'notifications.seedLikedWork',
      messageReplacements: { work: '고요한 아침' },
      fromUser: { name: artists[3].name, avatar: artists[3].avatar, id: artists[3].id },
      workId: 'local-img-1',
      read: true,
      createdAt: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
      id: 'n4',
      type: 'pick',
      messageKey: 'notifications.seedPickSelected',
      messageReplacements: { work: '산길의 봄' },
      read: true,
      createdAt: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
    },
    {
      id: 'n5',
      type: 'follow',
      messageKey: 'notifications.seedFollowed',
      fromUser: {
        name: artists[4]?.name || '이수연',
        avatar: artists[4]?.avatar || '',
        id: artists[4]?.id || '5',
      },
      read: true,
      createdAt: new Date(now - 1000 * 60 * 60 * 72).toISOString(),
    },
    {
      id: 'n6',
      type: 'system',
      messageKey: 'notifications.seedWelcome',
      read: true,
      createdAt: new Date(now - 1000 * 60 * 60 * 168).toISOString(),
    },
    {
      id: 'n7',
      type: 'event',
      messageKey: 'notifications.seedEventActive',
      messageReplacements: { event: '나의 첫 디지털 캔버스' },
      read: false,
      createdAt: new Date(now - 1000 * 60 * 45).toISOString(),
    },
  ];
}

function normalizeNotifications(list: Notification[]): Notification[] {
  const cutoff = Date.now() - NOTIF_RETENTION_MS;
  const filtered = list.filter((n) => {
    const ts = new Date(n.createdAt).getTime();
    return !Number.isNaN(ts) && ts >= cutoff;
  });
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return filtered.slice(0, MAX_NOTIFICATIONS);
}

function loadNotifications(): Notification[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Notification[];
      if (Array.isArray(parsed) && !parsed.some((n) => n.id === 'n7')) {
        const seed = generateSeedNotifications().find((n) => n.id === 'n7');
        if (seed) {
          const merged = normalizeNotifications([seed, ...parsed]);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          window.dispatchEvent(new Event('artier-notifications-changed'));
          return merged;
        }
      }
      return Array.isArray(parsed) ? normalizeNotifications(parsed) : normalizeNotifications(generateSeedNotifications());
    }
  } catch {}
  const seed = normalizeNotifications(generateSeedNotifications());
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  window.dispatchEvent(new Event('artier-notifications-changed'));
  return seed;
}

function formatRelativeTime(
  dateStr: string,
  t: (key: MessageKey) => string,
  locale: Locale,
): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('notifications.timeJustNow');
  if (mins < 60) return t('notifications.timeMinutes').replace('{n}', String(mins));
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('notifications.timeHours').replace('{n}', String(hours));
  const days = Math.floor(hours / 24);
  if (days < 7) return t('notifications.timeDays').replace('{n}', String(days));
  return new Date(dateStr).toLocaleDateString(locale === 'en' ? 'en-US' : 'ko-KR');
}

const typeIcons = {
  like: Heart,
  follow: UserPlus,
  pick: Star,
  system: Bell,
  event: Calendar,
  invite: UserPlus,
} as const;

const typeColors = {
  like: 'bg-red-50 text-red-400',
  follow: 'bg-blue-50 text-blue-400',
  pick: 'bg-amber-50 text-amber-400',
  system: 'bg-muted/50 text-muted-foreground',
  event: 'bg-emerald-50 text-emerald-500',
  invite: 'bg-violet-50 text-violet-500',
} as const;

function passesPrefs(n: Notification, p: NotificationSettingsState): boolean {
  if (n.demo) return true;
  switch (n.type) {
    case 'like':
      return p.like;
    case 'follow':
      return p.newFollower;
    case 'pick':
      return p.weeklyTheme;
    case 'event':
      return p.groupExhibitionInvite;
    case 'system':
      return p.marketing;
    case 'invite':
      // 작가가 직접 보낸 초대 링크의 결과 알림 — 본인 액션의 결과이므로 항상 노출 (Policy §3 v2.14).
      return true;
    default:
      // Unknown type — 향후 확장 시 사용자 동의 없이 노출되지 않도록 보수적으로 차단.
      return false;
  }
}

type CategoryTab = 'all' | Notification['type'];

export default function Notifications() {
  const navigate = useNavigate();
  const { t, locale } = useI18n();

  useEffect(() => {
    if (!authStore.isLoggedIn()) {
      navigate('/login?redirect=/notifications', { replace: true });
    }
  }, [navigate]);

  const [notifications, setNotifications] = useState<Notification[]>(loadNotifications);
  const [readFilter, setReadFilter] = useState<'all' | 'unread'>('all');
  const [categoryTab, setCategoryTab] = useState<CategoryTab>('all');
  const [prefs, setPrefs] = useState<NotificationSettingsState>(() => loadNotificationSettings());

  useEffect(() => {
    const next = normalizeNotifications(notifications);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event('artier-notifications-changed'));
    if (next.length !== notifications.length) setNotifications(next);
  }, [notifications]);

  useEffect(() => {
    const syncPrefs = () => setPrefs(loadNotificationSettings());
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'artier_notification_settings') syncPrefs();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('artier-notification-prefs', syncPrefs);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('artier-notification-prefs', syncPrefs);
    };
  }, []);

  const filtered = useMemo(() => {
    let list = notifications;
    if (readFilter === 'unread') list = list.filter((n) => !n.read);
    if (categoryTab !== 'all') list = list.filter((n) => n.type === categoryTab);
    return list.filter((n) => passesPrefs(n, prefs));
  }, [notifications, readFilter, categoryTab, prefs]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = async () => {
    if (!(await openConfirm({ title: t('notifications.confirmMarkAll') }))) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const deleteAllRead = async () => {
    if (!(await openConfirm({ title: t('notifications.confirmDeleteRead'), destructive: true }))) return;
    setNotifications((prev) => prev.filter((n) => !n.read));
  };

  const handleClick = (notif: Notification) => {
    markAsRead(notif.id);
    if (notif.type === 'event') {
      navigate('/events');
      return;
    }
    if (notif.workId) navigate(`/exhibitions/${notif.workId}`);
    else if (notif.fromUser) navigate(`/profile/${notif.fromUser.id}`);
  };

  const categoryChips: { id: CategoryTab; label: string }[] = [
    { id: 'all', label: t('notifications.categoryAll') },
    { id: 'like', label: t('notifications.categoryLike') },
    { id: 'follow', label: t('notifications.categoryFollow') },
    { id: 'pick', label: t('notifications.categoryPick') },
    { id: 'event', label: t('notifications.categoryEvent') },
    { id: 'invite', label: t('notifications.categoryInvite') },
    { id: 'system', label: t('notifications.categorySystem') },
  ];

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      <div className="bg-white border-b border-border">
        <div className="mx-auto max-w-[700px] px-4 sm:px-6 py-5 sm:py-8">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('notifications.title')}</h1>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/settings#notifications"
                className="text-xs sm:text-sm text-primary lg:hover:underline font-medium"
              >
                {t('notifications.settingsLink')}
              </Link>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllRead} className="text-sm text-muted-foreground">
                  <Check className="h-4 w-4 mr-1" />
                  {t('notifications.markAll')}
                </Button>
              )}
              {notifications.some((n) => n.read) && (
                <Button variant="ghost" size="sm" onClick={deleteAllRead} className="text-sm text-destructive/70">
                  {t('notifications.deleteRead')}
                </Button>
              )}
            </div>
          </div>

          <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-5 flex-wrap">
            <Button
              type="button"
              onClick={() => setReadFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                readFilter === 'all' ? 'bg-foreground text-white' : 'bg-muted text-muted-foreground lg:hover:bg-muted'
              }`}
            >
              {t('notifications.filterAll')}
            </Button>
            <Button
              type="button"
              onClick={() => setReadFilter('unread')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                readFilter === 'unread' ? 'bg-foreground text-white' : 'bg-muted text-muted-foreground lg:hover:bg-muted'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                {t('notifications.filterUnread')}
                {unreadCount > 0 && (
                  <span
                    aria-label={t('nav.notificationsWithCount').replace('{n}', String(unreadCount))}
                    className="inline-flex min-w-[20px] h-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </span>
            </Button>
          </div>

          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
            {categoryChips.map((c) => (
              <Button
                key={c.id}
                type="button"
                variant="ghost"
                onClick={() => setCategoryTab(c.id)}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium border transition-colors min-h-[44px] ${
                  categoryTab === c.id
                    ? 'border-foreground/80 bg-foreground/5 text-foreground'
                    : 'border-border text-muted-foreground lg:hover:border-foreground/30 lg:hover:text-foreground'
                }`}
              >
                {c.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[700px] px-4 sm:px-6 py-4 sm:py-6">
        {filtered.length === 0 ? (
          <div className="text-center py-12 sm:py-20">
            <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-sm sm:text-base font-semibold text-muted-foreground mb-2">
              {readFilter === 'unread' ? t('notifications.emptyUnread') : t('notifications.empty')}
            </h3>
            <p className="text-sm text-muted-foreground">{t('notifications.emptyHint')}</p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {filtered.map((notif) => {
              const Icon = typeIcons[notif.type];
              const colorClass = typeColors[notif.type];
              return (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 sm:gap-4 w-full px-4 py-4 sm:px-5 sm:py-5 text-left transition-colors ${
                    notif.read ? 'bg-white lg:hover:bg-muted/30' : 'bg-primary/[0.04] lg:hover:bg-primary/[0.07]'
                  }`}
                >
                  <button type="button" onClick={() => handleClick(notif)} className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0 text-left bg-transparent border-0 p-0 cursor-pointer">
                    {notif.fromUser ? (
                      <Avatar className="h-10 w-10 shrink-0 ring-1 ring-border/50">
                        <AvatarImage src={notif.fromUser.avatar} alt={notif.fromUser.name} />
                        <AvatarFallback>{notif.fromUser.name[0]}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${colorClass}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm sm:text-sm leading-relaxed ${notif.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {notif.fromUser && <span className="font-semibold">{notif.fromUser.name}</span>}
                        {resolveNotificationMessage(notif, t)}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-muted-foreground/70">
                          {formatRelativeTime(notif.createdAt, t, locale)}
                        </span>
                        {!notif.read && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteNotification(notif.id)}
                    className="shrink-0 p-2.5 -mr-1.5 rounded-full text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label={t('notifications.delete')}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
