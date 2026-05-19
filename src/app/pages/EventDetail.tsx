import { useParams, Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Calendar, ArrowLeft, ArrowRight, Users, X } from 'lucide-react';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { analytics } from '../utils/analytics';
import { useEffect, useState, useMemo } from 'react';
import { useAuthStore, workStore } from '../store';
import { LoginPromptModal } from '../components/LoginPromptModal';
import { useLoginPrompt } from '../hooks/useLoginPrompt';
import { useI18n } from '../i18n/I18nProvider';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { eventsStore, deriveEventStatus, useManagedEvents } from '../utils/eventsStore';
import { EventEntryModal } from '../components/EventEntryModal';
import { openConfirm } from '../components/ConfirmDialog';
import { displayExhibitionTitle } from '../utils/workDisplay';

export default function EventDetail() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const handleBack = () => location.key !== 'default' ? navigate(-1) : navigate('/events');
  const { t } = useI18n();
  const auth = useAuthStore();
  const loginPrompt = useLoginPrompt();
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showMyEntryModal, setShowMyEntryModal] = useState(false);

  // store 구독 (변경 시 재렌더)
  useManagedEvents();
  const event = id ? eventsStore.get(id) : null;

  useEffect(() => {
    if (id) analytics.eventDetailView(id);
  }, [id]);

  const eventStatus = event ? deriveEventStatus(event) : null;
  const isEnded = eventStatus === 'ended';
  const isScheduled = eventStatus === 'scheduled';

  const myEntry = useMemo(() => {
    if (!event || !auth.isLoggedIn()) return null;
    return workStore.getWorks().find((w) => String(w.linkedEventId) === event.id) ?? null;
  }, [event, auth]);

  const alreadySubmitted = !!myEntry;

  const handleCancelEntry = async () => {
    if (!myEntry) return;
    const ok = await openConfirm({
      title: t('events.cancelEntryConfirmTitle' as never),
      description: t('events.cancelEntryConfirmDesc' as never),
      confirmLabel: t('events.cancelEntry' as never),
      destructive: true,
    });
    if (!ok) return;
    workStore.removeWork(myEntry.id);
    setShowMyEntryModal(false);
    toast.success(t('events.cancelEntrySuccess' as never));
  };

  // ?entry=open 자동 오픈 (USR-EVT-04 진입 경로)
  useEffect(() => {
    if (searchParams.get('entry') !== 'open') return;
    if (!event || isEnded || isScheduled || alreadySubmitted) {
      // 응모 불가 상태면 쿼리 파라미터만 제거
      const next = new URLSearchParams(searchParams);
      next.delete('entry');
      setSearchParams(next, { replace: true });
      return;
    }
    if (!loginPrompt.tryProtectedAction('contest')) {
      const next = new URLSearchParams(searchParams);
      next.delete('entry');
      setSearchParams(next, { replace: true });
      return;
    }
    setShowEntryModal(true);
    const next = new URLSearchParams(searchParams);
    next.delete('entry');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id, isEnded, alreadySubmitted]);

  const handleParticipate = () => {
    if (!loginPrompt.tryProtectedAction('contest')) return;
    if (alreadySubmitted) {
      toast.error(t('events.alreadySubmitted'));
      return;
    }
    setShowEntryModal(true);
  };

  if (!event) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 sm:px-6 pb-20 md:pb-0">
        <p className="text-sm text-muted-foreground mb-6">{t('events.detailNotFound')}</p>
        <Link to="/events" className="text-base text-primary lg:hover:underline">
          {t('events.detailBackLink')}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      {/* Hero */}
      <div className="relative h-[250px] sm:h-[350px] lg:h-[400px] overflow-hidden">
        <ImageWithFallback src={event.bannerImageUrl} alt={event.title} className="w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-6 sm:pb-10">
          <div className="mx-auto max-w-[1440px] w-full">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/40 text-white text-xs sm:text-sm font-medium hover:bg-black/60 backdrop-blur-sm transition-colors min-h-[36px]"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('eventDetail.backToList')}
            </button>
          </div>
          <div className="mx-auto max-w-[1440px] w-full">
            <span className="inline-block px-4 py-1.5 text-xs font-bold tracking-wider text-white bg-primary rounded-full mb-4">
              {eventStatus === 'active' ? t('eventDetail.statusActive') : eventStatus === 'scheduled' ? t('eventDetail.statusScheduled') : t('eventDetail.statusEnded')}
            </span>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">{event.title}</h1>
            {event.subtitle && <p className="text-sm sm:text-base lg:text-base text-white/90">{event.subtitle}</p>}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-6 sm:py-12">

        <div className="bg-white rounded-2xl border border-input p-4 sm:p-6 md:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="flex items-center gap-3 text-base text-foreground">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t('events.detailPeriod')}</p>
                <p className="font-medium">{event.startAt} ~ {event.endAt}</p>
              </div>
            </div>
          </div>

          <p className="text-sm sm:text-sm lg:text-base text-foreground leading-relaxed mb-6 sm:mb-10">{event.description}</p>

          {event.type !== 'contest' ? null : isEnded ? null : isScheduled ? (
            <div className="flex sm:inline-flex items-center justify-center gap-2 px-5 sm:px-8 py-3 sm:py-3.5 bg-muted text-muted-foreground rounded-lg text-sm font-medium cursor-not-allowed w-full sm:w-auto">
              {t('events.detailScheduled')}
            </div>
          ) : alreadySubmitted ? (
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setShowMyEntryModal(true)}
                className="inline-flex items-center gap-2 px-5 sm:px-8 py-3 sm:py-3.5 bg-foreground text-white rounded-lg text-sm font-medium lg:hover:bg-foreground/90 transition-colors justify-center"
              >
                {t('events.viewMyEntry' as never)}
              </Button>
              <button
                type="button"
                onClick={handleCancelEntry}
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 border border-border text-foreground rounded-lg text-sm font-medium lg:hover:bg-muted/40 transition-colors justify-center"
              >
                {t('events.cancelEntry' as never)}
              </button>
            </div>
          ) : (
            <Button
              onClick={handleParticipate}
              className="inline-flex items-center gap-2 px-5 sm:px-8 py-3 sm:py-3.5 bg-foreground text-white rounded-lg text-sm font-medium lg:hover:bg-foreground/90 transition-colors w-full sm:w-auto justify-center"
            >
              {t('events.participate')}
              <ArrowRight className="h-5 w-5" />
            </Button>
          )}

          {/* 결과 발표 외부 링크 CTA — resultUrl 설정 + 종료 시 노출 */}
          {event && isEnded && event.resultUrl && (
            <div className="mt-3">
              <a
                href={event.resultUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 border border-border text-foreground rounded-lg text-sm font-medium lg:hover:bg-muted/40 transition-colors"
              >
                {t('events.viewResult')}
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>
      </div>

      <LoginPromptModal open={loginPrompt.open} onClose={loginPrompt.close} action={loginPrompt.action} />
      {event && (
        <EventEntryModal
          open={showEntryModal}
          onClose={() => setShowEntryModal(false)}
          eventId={event.id}
          eventTitle={event.title}
          eventStartAt={event.startAt}
          eventEndAt={event.endAt}
        />
      )}

      {/* 내 응모작 보기 모달 */}
      {showMyEntryModal && myEntry && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setShowMyEntryModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img
                src={Array.isArray(myEntry.image) ? myEntry.image[0] : myEntry.image}
                alt={myEntry.exhibitionName}
                className="w-full aspect-square object-cover"
              />
              <button
                type="button"
                onClick={() => setShowMyEntryModal(false)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center lg:hover:bg-black/70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <p className="font-semibold text-foreground mb-1">{myEntry.exhibitionName}</p>
              <p className="text-xs text-muted-foreground mb-4">{t('events.participate')} · {myEntry.uploadedAt}</p>
              <button
                type="button"
                onClick={handleCancelEntry}
                className="w-full py-2.5 rounded-lg border border-red-200 text-red-700 text-sm font-medium lg:hover:bg-red-50 transition-colors"
              >
                {t('events.cancelEntry' as never)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

