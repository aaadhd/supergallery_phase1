import { useState, useMemo, useEffect } from 'react';
import { Calendar, Bell, ChevronDown } from 'lucide-react';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoginPromptModal } from '../components/LoginPromptModal';
import { useI18n } from '../i18n/I18nProvider';
import { Button } from '../components/ui/button';
import { useManagedEvents, deriveEventStatus, type ManagedEvent } from '../utils/eventsStore';
import { toast } from 'sonner';
import { useEventSubscription, setEventSubscribed } from '../utils/eventSubscriptionStore';
import { authStore } from '../store';
import { todayLocalIso } from '../utils/localDate';

// Events 페이지: 응모전(contest) + 일반이벤트(general)만 표출.
// Pick은 pickStore + 배너에서 관리. 기획전은 curationStore + 배너에서 관리.

export default function Events() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useI18n();
  const allContests = useManagedEvents();

  const today = todayLocalIso();

  /** 게시 기간(displayStartAt/endAt) 기준으로 표시 여부 판단 */
  function isDisplayVisible(e: ManagedEvent): boolean {
    const dispStart = e.displayStartAt ?? e.startAt;
    const dispEnd = e.displayEndAt ?? e.endAt;
    return today >= dispStart && today <= dispEnd;
  }

  const activeEvents = useMemo<ManagedEvent[]>(
    () => allContests.filter((e) => deriveEventStatus(e) === 'active' && isDisplayVisible(e)),
    [allContests, today],
  );

  const upcomingItems = useMemo<ManagedEvent[]>(
    () => allContests.filter((e) => deriveEventStatus(e) === 'scheduled' && isDisplayVisible(e)),
    [allContests, today],
  );

  const endedItems = useMemo<ManagedEvent[]>(
    () => allContests.filter((e) => deriveEventStatus(e) === 'ended'),
    [allContests, today],
  );

  const [showEnded, setShowEnded] = useState(false);

  const [subscribed, setSubscription] = useEventSubscription();
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('unsubscribe') === '1') {
      setEventSubscribed(false);
      toast.success(t('events.unsubscribeToastDone'));
      const next = new URLSearchParams(searchParams);
      next.delete('unsubscribe');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, t]);

  const handleNotifyCta = () => {
    if (!authStore.isLoggedIn()) {
      setLoginPromptOpen(true);
      return;
    }
    if (subscribed) {
      setSubscription(false);
      toast.success(t('events.unsubscribeToastDone'));
    } else {
      setSubscription(true);
      toast.success(t('events.notifyToastSubscribed'));
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 pt-6 sm:pt-10">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-8">{t('events.title')}</h1>

        {/* 진행 중 이벤트 */}
        <section className="mb-12 sm:mb-16">
          <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4">{t('events.activeSection')}</h2>
          {activeEvents.length === 0 ? (
            <div className="rounded-2xl bg-muted/40 h-[140px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Calendar className="h-7 w-7" />
              <p className="text-sm font-medium">{t('events.noActiveEvents')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:gap-4">
              {activeEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => navigate(`/events/${event.id}`)}
                  className="group cursor-pointer relative overflow-hidden rounded-2xl"
                >
                  <div className="relative h-[200px] sm:h-[260px] lg:h-[320px] w-full overflow-hidden">
                    <ImageWithFallback
                      src={event.bannerImageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-700 lg:group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          {t('events.activeBadge')}
                        </span>
                      </div>
                      <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight mb-1.5">
                        {event.title}
                      </h3>
                      {event.subtitle && (
                        <p className="text-sm sm:text-base text-white/80 leading-relaxed mb-2 max-w-2xl">
                          {event.subtitle}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-white/70">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>{event.startAt} ~ {event.endAt}</span>
                        {event.participantsLabel && (
                          <span className="opacity-80">· {event.participantsLabel}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 예정된 이벤트 */}
        <section className="mb-12 sm:mb-16">
          <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4">{t('events.upcomingSection')}</h2>
          {upcomingItems.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-border bg-muted/30 py-16 flex flex-col items-center justify-center text-muted-foreground">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <Calendar className="h-7 w-7 opacity-60" />
              </div>
              <p className="text-base font-semibold text-foreground mb-1">{t('events.noUpcoming')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {upcomingItems.map((event) => (
                <div
                  key={`event-${event.id}`}
                  onClick={() => navigate(`/events/${event.id}`)}
                  className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 lg:hover:-translate-y-1 lg:hover:shadow-md"
                >
                  <div className="relative h-[160px] sm:h-[180px] overflow-hidden">
                    <ImageWithFallback
                      src={event.bannerImageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-500 lg:group-hover:scale-[1.03]"
                    />
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 text-xs font-bold text-white bg-foreground/80 backdrop-blur-sm rounded-full">
                        {t('events.comingSoonBadge')}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-base font-bold text-foreground mb-1.5 leading-snug">{event.title}</h3>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{event.startAt} ~ {event.endAt}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        {/* 지난 이벤트 */}
        {endedItems.length > 0 && (
          <section className="mb-12 sm:mb-16">
            <button
              type="button"
              onClick={() => setShowEnded((v) => !v)}
              className="flex items-center gap-2 text-base sm:text-lg font-semibold text-muted-foreground lg:hover:text-foreground transition-colors mb-4 min-h-[44px]"
            >
              {t('events.endedSection')}
              <span className="text-sm font-normal opacity-60">({endedItems.length})</span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showEnded ? 'rotate-180' : ''}`} />
            </button>
            {showEnded && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {endedItems.map((event) => (
                  <div
                    key={`ended-event-${event.id}`}
                    onClick={() => navigate(`/events/${event.id}`)}
                    className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-card opacity-70 lg:hover:opacity-100 transition-all duration-300 lg:hover:shadow-md"
                  >
                    <div className="relative h-[140px] sm:h-[160px] overflow-hidden grayscale lg:group-hover:grayscale-0 transition-all duration-300">
                      <ImageWithFallback
                        src={event.bannerImageUrl}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3">
                        <span className="px-2.5 py-1 text-xs font-bold text-white bg-black/60 backdrop-blur-sm rounded-full">
                          {t('events.endedBadge')}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-bold text-foreground mb-1 leading-snug">{event.title}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{event.startAt} ~ {event.endAt}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* 알림 구독 CTA */}
      <div className="bg-foreground text-white">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-10 sm:py-12 text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-3">{t('events.ctaTitle')}</h2>
          <p className="text-base text-white/80 mb-8">{t('events.ctaLead')}</p>
          <div className="flex flex-col items-center gap-4">
            <Button
              variant="secondary"
              onClick={handleNotifyCta}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-foreground bg-white lg:hover:bg-muted min-h-[44px]"
            >
              <Bell className="h-5 w-5" aria-hidden />
              {subscribed ? t('events.ctaUnsubscribe') : t('events.ctaNotify')}
            </Button>
          </div>
        </div>
      </div>

      <LoginPromptModal open={loginPromptOpen} onClose={() => setLoginPromptOpen(false)} action="upload" />
    </div>
  );
}
