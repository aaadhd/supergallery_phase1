import { useState, useMemo, useEffect } from 'react';
import { Calendar, Bell } from 'lucide-react';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoginPromptModal } from '../components/LoginPromptModal';
import { useI18n } from '../i18n/I18nProvider';
import { Button } from '../components/ui/button';
import { useManagedEvents, deriveStatus, type ManagedEvent } from '../utils/eventStore';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useEventSubscription, setEventSubscribed } from '../utils/eventSubscriptionStore';
import { authStore } from '../store';
import { useCuration, type CuratedExhibition } from '../utils/curationStore';

type EventTab = 'contest' | 'curation' | 'general';

export default function Events() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useI18n();
  const allEvents = useManagedEvents();
  const contestEvents = useMemo(() => allEvents.filter((e) => e.type === 'contest'), [allEvents]);
  const generalEvents = useMemo(() => allEvents.filter((e) => e.type === 'general'), [allEvents]);
  const { curatedExhibitions: curations } = useCuration();

  const [activeTab, setActiveTab] = useState<EventTab>('contest');

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 30 });
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setCurrentBanner(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    onSelect();
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi]);

  const promotionBanners = useMemo<ManagedEvent[]>(
    () => contestEvents.filter((e) => deriveStatus(e) === 'active'),
    [contestEvents],
  );

  const upcomingContests = useMemo<ManagedEvent[]>(
    () => contestEvents.filter((e) => deriveStatus(e) === 'scheduled'),
    [contestEvents],
  );

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

  const tabs: { key: EventTab; label: string }[] = [
    { key: 'contest', label: t('events.tabContest') },
    { key: 'curation', label: t('events.tabCuration') },
    { key: 'general', label: t('events.tabGeneral') },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 pt-4 sm:pt-8 pb-2">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-4">{t('events.title')}</h1>

        {/* 탭 */}
        <div className="flex gap-1 border-b border-border mb-6">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors min-h-[44px] ${
                activeTab === key
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground lg:hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 응모전 탭 */}
      {activeTab === 'contest' && (
        <>
          <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-4 sm:py-6">
            {promotionBanners.length === 0 ? (
              <div className="rounded-2xl bg-muted/50 h-[200px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Calendar className="h-8 w-8" />
                <p className="text-sm font-medium">{t('events.noActiveEvents')}</p>
              </div>
            ) : (
              <div className="relative group">
                <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
                  <div className="flex">
                    {promotionBanners.map((event) => (
                      <div
                        key={event.id}
                        className="min-w-0 flex-[0_0_100%] relative group/item cursor-pointer"
                        onClick={() => navigate(`/events/${event.id}`)}
                      >
                        <div className="relative h-[240px] sm:h-[320px] lg:h-[420px]">
                          <ImageWithFallback
                            src={event.bannerImageUrl}
                            alt={event.title}
                            className="w-full h-full object-cover transition-transform duration-700 lg:group-hover/item:scale-[1.03]"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 lg:p-14">
                            <div className="max-w-[800px]">
                              <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3 leading-tight tracking-tight">
                                {event.title}
                              </h2>
                              {event.subtitle && (
                                <p className="text-sm sm:text-base text-white/90 mb-4 max-w-2xl leading-relaxed font-medium">
                                  {event.subtitle}
                                </p>
                              )}
                              <div className="flex items-center gap-4 flex-wrap text-white/80">
                                <div className="flex items-center gap-2 text-xs sm:text-sm font-medium bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                                  <Calendar className="h-4 w-4" />
                                  <span>{event.startAt} ~ {event.endAt}</span>
                                </div>
                                {event.participantsLabel && (
                                  <span className="text-xs sm:text-sm font-medium opacity-80">
                                    · {event.participantsLabel}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {promotionBanners.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); emblaApi?.scrollPrev(); }}
                      className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 sm:h-12 sm:w-12 hidden sm:flex items-center justify-center bg-white text-foreground rounded-full shadow-lg border border-black/5 transition-all hover:scale-110 active:scale-95 z-20"
                    >
                      <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); emblaApi?.scrollNext(); }}
                      className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 h-10 w-10 sm:h-12 sm:w-12 hidden sm:flex items-center justify-center bg-white text-foreground rounded-full shadow-lg border border-black/5 transition-all hover:scale-110 active:scale-95 z-20"
                    >
                      <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                    </Button>
                    <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
                      {promotionBanners.map((_, i) => (
                        <button
                          key={i}
                          onClick={(e) => { e.stopPropagation(); emblaApi?.scrollTo(i); }}
                          className={`h-1.5 rounded-full transition-all ${
                            currentBanner === i ? 'w-8 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-6 sm:py-10 pb-20 md:pb-12">
            <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4 sm:mb-6">{t('events.upcomingSection')}</h2>
            {upcomingContests.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-border bg-muted/30 py-20 flex flex-col items-center justify-center text-muted-foreground">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Calendar className="h-8 w-8 opacity-60" />
                </div>
                <p className="text-base font-semibold text-foreground mb-1">{t('events.noUpcoming')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {upcomingContests.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => navigate(`/events/${event.id}`)}
                    className="group cursor-pointer overflow-hidden rounded-xl border border-border transition-all duration-300 ease-out lg:hover:-translate-y-1 lg:hover:shadow-md"
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
          </div>

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
        </>
      )}

      {/* 기획전 탭 */}
      {activeTab === 'curation' && (
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 pb-20">
          {curations.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-border bg-muted/30 py-20 flex flex-col items-center justify-center text-muted-foreground">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Calendar className="h-8 w-8 opacity-60" />
              </div>
              <p className="text-base font-semibold text-foreground">{t('events.noCurations')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {curations.map((curation: CuratedExhibition) => (
                <div
                  key={curation.id}
                  onClick={() => navigate(`/curation/${curation.id}`)}
                  className="group cursor-pointer overflow-hidden rounded-xl border border-border transition-all duration-300 ease-out lg:hover:-translate-y-1 lg:hover:shadow-md"
                >
                  <div className="p-5">
                    <h3 className="text-base font-bold text-foreground mb-1.5 leading-snug">{curation.title}</h3>
                    {curation.subtitle && (
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{curation.subtitle}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 일반 이벤트 탭 */}
      {activeTab === 'general' && (
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 pb-20">
          {generalEvents.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-border bg-muted/30 py-20 flex flex-col items-center justify-center text-muted-foreground">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Calendar className="h-8 w-8 opacity-60" />
              </div>
              <p className="text-base font-semibold text-foreground">{t('events.noGeneralEvents')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {generalEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => navigate(`/events/${event.id}`)}
                  className="group cursor-pointer overflow-hidden rounded-xl border border-border transition-all duration-300 ease-out lg:hover:-translate-y-1 lg:hover:shadow-md"
                >
                  <div className="relative h-[160px] sm:h-[180px] overflow-hidden">
                    <ImageWithFallback
                      src={event.bannerImageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-500 lg:group-hover:scale-[1.03]"
                    />
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
        </div>
      )}

      <LoginPromptModal open={loginPromptOpen} onClose={() => setLoginPromptOpen(false)} action="upload" />
    </div>
  );
}
