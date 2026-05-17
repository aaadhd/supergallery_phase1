import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, UserPlus, Star, Bell, Check, Calendar, X, Bookmark } from 'lucide-react';
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
  type: 'like' | 'follow' | 'groupInvite' | 'pick' | 'system' | 'event' | 'invite' | 'curation';
  /** 동적 알림은 message 그대로, 시드·시스템은 messageKey + replacements 권장 (i18n 정합). */
  message?: string;
  messageKey?: MessageKey;
  messageReplacements?: Record<string, string>;
  fromUser?: { name: string; avatar: string; id: string };
  workId?: string;
  /** 라우팅 타깃 — type 'curation' 클릭 시 /curations/:id로 이동(PRD USR-NTF-01 §1). */
  curationId?: string;
  /** 라우팅 타깃 — type 'event' 클릭 시 /events/:id 응모전 상세로 이동(PRD USR-NTF-01 §1). */
  eventId?: string;
  /** type 'event' 세부 구분 — 'selected': 응모전 선정(강제 발송), 'announcement': 응모전 공지(marketing 토글 제어). */
  subtype?: 'announcement' | 'selected';
  /** explicit 라우팅 override (예: 검수 반려 → /me?rejected=<workId> + USR-PRF-12 모달). */
  navigateTo?: string;
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
      subtype: 'announcement',
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
  groupInvite: UserPlus,
  pick: Star,
  system: Bell,
  event: Calendar,
  invite: UserPlus,
  curation: Bookmark,
} as const;

const typeColors = {
  like: 'bg-red-50 text-red-400',
  follow: 'bg-blue-50 text-blue-400',
  groupInvite: 'bg-violet-50 text-violet-500',
  pick: 'bg-[#B8862F]/10 text-[#B8862F]',
  system: 'bg-muted/50 text-muted-foreground',
  event: 'bg-emerald-50 text-emerald-500',
  invite: 'bg-gray-50 text-gray-400',
  curation: 'bg-orange-50 text-orange-500',
} as const;

function passesPrefs(n: Notification, p: NotificationSettingsState): boolean {
  if (n.demo) return true;
  switch (n.type) {
    case 'like':
    case 'follow':
      return p.reactionAlerts;
    case 'groupInvite':
    case 'pick':
    case 'curation':
      // 그룹전시 게시·기획전·Pick — 강제 수신 (A-3).
      return true;
    case 'event':
      // 선정 알림은 강제, 공지·이벤트 알림은 eventAlerts 토글 제어 (A-3).
      if (n.subtype === 'selected') return true;
      return p.eventAlerts;
    case 'system':
      // 검수 결과·신고 처리·작품 연결 — IA USR-NTF-01 강제 8종. 마케팅 토글과 무관하게 항상 노출.
      return true;
    case 'invite':
      // 작가가 직접 보낸 초대 링크의 결과 알림 — 본인 액션의 결과이므로 항상 노출 (Policy §3 v2.14).
      return true;
    default:
      // Unknown type — 향후 확장 시 사용자 동의 없이 노출되지 않도록 보수적으로 차단.
      return false;
  }
}

/** 칩 ↔ Notification.type 매핑은 N:1 — 큐레이션 칩 = pick + curation, 시스템 칩 = system + invite(작품 연결). */

export default function Notifications() {
  const navigate = useNavigate();
  const { t, locale } = useI18n();

  useEffect(() => {
    if (!authStore.isLoggedIn()) {
      navigate('/login?redirect=/notifications', { replace: true });
    }
  }, [navigate]);

  const [notifications, setNotifications] = useState<Notification[]>(loadNotifications);
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

  const filtered = useMemo(
    () => notifications.filter((n) => passesPrefs(n, prefs)),
    [notifications, prefs],
  );

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
    // explicit 라우팅 override 우선 — 검수 반려 알림 등 기본 type 분기로 표현 안 되는 흐름.
    if (notif.navigateTo) {
      navigate(notif.navigateTo);
      return;
    }
    // PRD USR-NTF-01 §1 라우팅 표 정합:
    //  - 기획전 선정 → USR-CUR-01
    //  - 응모전 선정·공지 → USR-EVT-02 응모전 상세 (eventId 있으면)
    //  - 작품 연결 → USR-PRF-01 프로필 (PRD: 친구가 토큰 가입해 본인 작품 찾기 한 결과)
    if (notif.type === 'curation' && notif.curationId) {
      navigate(`/curations/${notif.curationId}`);
      return;
    }
    if (notif.type === 'event') {
      if (notif.eventId) navigate(`/events/${notif.eventId}`);
      else navigate('/events');
      return;
    }
    if (notif.type === 'invite' && notif.fromUser) {
      navigate(`/profile/${notif.fromUser.id}`);
      return;
    }
    if (notif.type === 'groupInvite' && notif.workId) {
      // PRD §1 — 그룹 전시 게시 알림 클릭 시 해당 전시 상세로 이동.
      navigate(`/exhibitions/${notif.workId}`);
      return;
    }
    if (notif.workId) navigate(`/exhibitions/${notif.workId}`);
    else if (notif.fromUser) navigate(`/profile/${notif.fromUser.id}`);
  };


  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div className="bg-background border-b border-border">
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
              <Button variant="ghost" size="sm" onClick={markAllRead} disabled={unreadCount === 0} className="text-sm text-muted-foreground disabled:opacity-40">
                <Check className="h-4 w-4 mr-1" />
                {t('notifications.markAll')}
              </Button>
              <Button variant="ghost" size="sm" onClick={deleteAllRead} disabled={!notifications.some((n) => n.read)} className="text-sm text-destructive/70 disabled:opacity-40">
                {t('notifications.deleteRead')}
              </Button>
            </div>
          </div>


        </div>
      </div>

      <div className="mx-auto max-w-[700px] px-4 sm:px-6 py-4 sm:py-6">
        {filtered.length === 0 ? (
          <div className="text-center py-12 sm:py-20">
            <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-sm sm:text-base font-semibold text-muted-foreground mb-2">
              {t('notifications.empty')}
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
                    notif.read ? 'bg-card lg:hover:bg-muted/30' : 'bg-primary/[0.04] lg:hover:bg-primary/[0.07]'
                  }`}
                >
                  <button type="button" onClick={() => handleClick(notif)} className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0 text-left bg-transparent border-0 p-0 cursor-pointer">
                    {notif.fromUser && notif.fromUser.avatar ? (
                      <Avatar className="h-10 w-10 shrink-0 ring-1 ring-border/50">
                        <AvatarImage src={notif.fromUser.avatar} alt={notif.fromUser.name} />
                        <AvatarFallback>{notif.fromUser.name[0]}</AvatarFallback>
                      </Avatar>
                    ) : (
                      // 운영팀 발송 알림(curation·event)은 avatar='' — type 아이콘 fallback.
                      <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${colorClass}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm sm:text-sm leading-relaxed break-keep ${notif.read ? 'text-muted-foreground' : 'text-foreground'}`}>
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
