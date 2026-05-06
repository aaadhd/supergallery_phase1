import { useState, useMemo } from 'react';
import { Calendar, X, Bell, Check } from 'lucide-react';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoginPromptModal } from '../components/LoginPromptModal';
import { useI18n } from '../i18n/I18nProvider';
import { Button } from '../components/ui/button';
import { useManagedEvents, deriveStatus, type ManagedEvent } from '../utils/eventStore';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import {
  addEventEmailSubscription,
  removeEventEmailSubscription,
} from '../utils/eventSubscriptionStore';

export default function Events() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useI18n();
  const events = useManagedEvents().filter((e) => e.type === 'contest');

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 30 });
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setCurrentBanner(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    onSelect();
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi]);

  /** 진행 중 이벤트 (메인 히어로 캐러셀용) */
  const promotionBanners = useMemo<ManagedEvent[]>(
    () => events.filter((e) => deriveStatus(e) === 'active'),
    [events],
  );

  /** 예정 이벤트 (하단 카드) */
  const upcomingEvents = useMemo<ManagedEvent[]>(
    () => events.filter((e) => deriveStatus(e) === 'scheduled'),
    [events],
  );

  const [showNotifyModal, setShowNotifyModal] = useState(false);
  /** 구독·해지 모달 모드 (동일 저장소 — 업계 관행: 신청 화면 인근에 해지 진입) */
  const [notifyMode, setNotifyMode] = useState<'subscribe' | 'unsubscribe'>('subscribe');
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyInlineError, setNotifyInlineError] = useState('');
  const [notifySubmitted, setNotifySubmitted] = useState(false);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('unsubscribe') === '1') {
      setNotifyMode('unsubscribe');
      setShowNotifyModal(true);
      const next = new URLSearchParams(searchParams);
      next.delete('unsubscribe');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const openSubscribeModal = () => {
    setNotifyMode('subscribe');
    setNotifyInlineError('');
    setNotifyEmail('');
    setNotifySubmitted(false);
    setShowNotifyModal(true);
  };

  const openUnsubscribeModal = () => {
    setNotifyMode('unsubscribe');
    setNotifyInlineError('');
    setNotifyEmail('');
    setNotifySubmitted(false);
    setShowNotifyModal(true);
  };

  const handleNotifySubmit = () => {
    setNotifyInlineError('');
    const result = addEventEmailSubscription(notifyEmail);
    if (!result.ok) {
      if (result.reason === 'empty') setNotifyInlineError(t('events.notifyErrEmpty'));
      else setNotifyInlineError(t('events.notifyErrInvalid'));
      return;
    }
    if (result.duplicate) {
      toast.info(t('events.notifyDuplicate'));
      return;
    }
    toast.success(t('events.notifyToastSubscribed'));
    setNotifySubmitted(true);
    setTimeout(() => {
      setShowNotifyModal(false);
      setNotifySubmitted(false);
      setNotifyEmail('');
    }, 2000);
  };

  const handleUnsubscribeSubmit = () => {
    setNotifyInlineError('');
    const trimmed = notifyEmail.trim();
    if (!trimmed) {
      setNotifyInlineError(t('events.notifyErrEmpty'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed.toLowerCase())) {
      setNotifyInlineError(t('events.notifyErrInvalid'));
      return;
    }
    const removed = removeEventEmailSubscription(trimmed);
    if (!removed) {
      toast.error(t('events.unsubscribeNotFound'));
      return;
    }
    toast.success(t('events.unsubscribeToastDone'));
    setNotifySubmitted(true);
    setTimeout(() => {
      setShowNotifyModal(false);
      setNotifySubmitted(false);
      setNotifyEmail('');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 페이지 헤더 */}
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 pt-4 sm:pt-8 pb-2">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">{t('events.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('events.subtitle')}</p>
      </div>

      {/* 진행 중 이벤트 — 프리미엄 캐러셀 */}
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
                          <span className="inline-block px-3 py-1 text-xs sm:text-xs font-bold tracking-wider text-white bg-primary rounded-full mb-3.5 shadow-sm">
                            {t('events.badge')}
                          </span>
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

      {/* 예정된 이벤트 */}
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-6 sm:py-10 pb-20 md:pb-12">
        <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4 sm:mb-6">{t('events.upcomingSection')}</h2>

        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">{t('events.noUpcoming')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {upcomingEvents.map((event) => (
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
                  <h3 className="text-base font-bold text-foreground mb-1.5 leading-snug">
                    {event.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{event.startAt} ~ {event.endAt}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {event.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA 섹션 */}
      <div className="bg-foreground text-white">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-10 sm:py-12 text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-3">{t('events.ctaTitle')}</h2>
          <p className="text-base text-white/80 mb-8">{t('events.ctaLead')}</p>
          <div className="flex flex-col items-center gap-4">
            <Button
              variant="secondary"
              onClick={openSubscribeModal}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-foreground bg-white lg:hover:bg-muted min-h-[44px]"
            >
              <Bell className="h-5 w-5" aria-hidden />
              {t('events.ctaNotify')}
            </Button>
          </div>
        </div>
      </div>

      <LoginPromptModal open={loginPromptOpen} onClose={() => setLoginPromptOpen(false)} action="upload" />

      {/* 알림 모달 */}
      {showNotifyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="notify-modal-title"
          onClick={() => {
            setShowNotifyModal(false);
            setNotifySubmitted(false);
            setNotifyEmail('');
            setNotifyInlineError('');
          }}
        >
          <div className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-md mx-auto relative" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowNotifyModal(false);
                setNotifySubmitted(false);
                setNotifyEmail('');
                setNotifyInlineError('');
              }}
              className="absolute top-4 right-4 rounded-full lg:hover:bg-muted min-h-[44px] min-w-[44px]"
              aria-label={t('loginPrompt.cancel')}
            >
              <X className="h-5 w-5" />
            </Button>

            {notifySubmitted ? (
              <div className="text-center py-6">
                <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Check className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {notifyMode === 'subscribe' ? t('events.notifyDoneTitle') : t('events.unsubscribeDoneTitle')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {notifyMode === 'subscribe' ? t('events.notifyDoneLead') : t('events.unsubscribeDoneLead')}
                </p>
              </div>
            ) : (
              <>
                <h3 id="notify-modal-title" className="text-lg font-bold text-foreground mb-2 pr-10">
                  {notifyMode === 'subscribe' ? t('events.notifyModalTitle') : t('events.unsubscribeModalTitle')}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {notifyMode === 'subscribe' ? t('events.notifyModalLead') : t('events.unsubscribeModalLead')}
                </p>
                <input
                  type="email"
                  autoComplete="email"
                  value={notifyEmail}
                  onChange={(e) => {
                    setNotifyEmail(e.target.value);
                    if (notifyInlineError) setNotifyInlineError('');
                  }}
                  placeholder={t('events.notifyEmailPlaceholder')}
                  aria-invalid={Boolean(notifyInlineError)}
                  aria-describedby={notifyInlineError ? 'notify-email-error' : undefined}
                  className={`w-full px-4 py-3.5 text-sm border rounded-lg mb-1 focus:outline-none focus:ring-[3px] focus:ring-primary ${
                    notifyInlineError ? 'border-destructive' : 'border-border'
                  }`}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter') return;
                    if (notifyMode === 'subscribe') handleNotifySubmit();
                    else handleUnsubscribeSubmit();
                  }}
                />
                {notifyInlineError ? (
                  <p id="notify-email-error" className="text-sm text-destructive mb-3" role="alert">
                    {notifyInlineError}
                  </p>
                ) : (
                  <div className="mb-3" />
                )}
                <Button
                  onClick={notifyMode === 'subscribe' ? handleNotifySubmit : handleUnsubscribeSubmit}
                  variant={notifyMode === 'unsubscribe' ? 'destructive' : 'default'}
                  className="w-full py-3.5 rounded-lg text-sm font-bold min-h-[44px]"
                >
                  {notifyMode === 'subscribe' ? t('events.notifySubmit') : t('events.unsubscribeSubmit')}
                </Button>
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  {notifyMode === 'subscribe' ? (
                    <button
                      type="button"
                      className="underline underline-offset-2 min-h-[44px] px-1 rounded-sm lg:hover:text-foreground"
                      onClick={() => {
                        setNotifyMode('unsubscribe');
                        setNotifyInlineError('');
                        setNotifyEmail('');
                      }}
                    >
                      {t('events.switchToUnsubscribe')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="underline underline-offset-2 min-h-[44px] px-1 rounded-sm lg:hover:text-foreground"
                      onClick={() => {
                        setNotifyMode('subscribe');
                        setNotifyInlineError('');
                        setNotifyEmail('');
                      }}
                    >
                      {t('events.switchToSubscribe')}
                    </button>
                  )}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
