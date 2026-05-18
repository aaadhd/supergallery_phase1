import { useState, useMemo, useEffect } from 'react';
import { Calendar, Bell } from 'lucide-react';
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

export default function Events() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useI18n();

  const allManagedEvents = useManagedEvents();
  const today = todayLocalIso();

  function isDisplayVisible(e: ManagedEvent): boolean {
    const dispStart = e.displayStartAt ?? e.startAt;
    const dispEnd = e.displayEndAt ?? e.endAt;
    return today >= dispStart && today <= dispEnd;
  }

  const activeEvents = useMemo<ManagedEvent[]>(
    () => allManagedEvents.filter((e) => deriveEventStatus(e) === 'active' && isDisplayVisible(e)),
    [allManagedEvents, today],
  );
  const endedEvents = useMemo<ManagedEvent[]>(
    () => allManagedEvents.filter((e) => deriveEventStatus(e) === 'ended'),
    [allManagedEvents],
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
    if (!authStore.isLoggedIn()) { setLoginPromptOpen(true); return; }
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

        {/* 진행 중 */}
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

        {/* 지난 이벤트 */}
        {endedEvents.length > 0 && (
          <section className="mb-12 sm:mb-16">
            <h2 className="text-base sm:text-lg font-semibold text-muted-foreground mb-4">
              {t('events.endedSection')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {(showEnded ? endedEvents : endedEvents.slice(0, 3)).map((event) => (
                <div
                  key={event.id}
                  onClick={() => navigate(`/events/${event.id}`)}
                  className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-card opacity-70 lg:hover:opacity-100 transition-all duration-300 lg:hover:shadow-md"
                >
                  <div className="relative h-[140px] sm:h-[160px] overflow-hidden grayscale lg:group-hover:grayscale-0 transition-all duration-300">
                    <ImageWithFallback
                      src={event.bannerImageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
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
            {!showEnded && endedEvents.length > 3 && (
              <button
                type="button"
                onClick={() => setShowEnded(true)}
                className="mt-4 text-sm text-muted-foreground lg:hover:text-foreground transition-colors min-h-[44px]"
              >
                {t('events.endedSection')} 더 보기 →
              </button>
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

      <LoginPromptModal open={loginPromptOpen} onClose={() => setLoginPromptOpen(false)} action="like" />
    </div>
  );
}
