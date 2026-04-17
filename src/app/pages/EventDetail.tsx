import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, ArrowLeft, ArrowRight, Users } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { analytics } from '../utils/analytics';
import { useEffect, useState, useMemo } from 'react';
import { useAuthStore, workStore } from '../store';
import { LoginPromptModal } from '../components/LoginPromptModal';
import { useI18n } from '../i18n/I18nProvider';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { eventStore, deriveStatus, useManagedEvents } from '../utils/eventStore';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const auth = useAuthStore();
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);

  // store 구독 (변경 시 재렌더)
  useManagedEvents();
  const event = id ? eventStore.get(id) : null;

  useEffect(() => {
    if (id) analytics.eventDetailView(id);
  }, [id]);

  const eventStatus = event ? deriveStatus(event) : null;
  const isEnded = eventStatus === 'ended';

  // 중복 참여 방지: 이미 이 이벤트에 작품을 제출했는지 확인
  const alreadySubmitted = useMemo(() => {
    if (!event || !auth.isLoggedIn()) return false;
    return workStore.getWorks().some((w) => String(w.linkedEventId) === event.id);
  }, [event, auth]);

  const handleParticipate = () => {
    if (!auth.isLoggedIn()) {
      setLoginPromptOpen(true);
      return;
    }
    if (alreadySubmitted) {
      toast.error(t('events.alreadySubmitted'));
      return;
    }
    navigate(`/upload?event=${event?.id}&eventTitle=${encodeURIComponent(event?.title || '')}`);
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
        <div className="absolute inset-0 flex flex-col justify-end px-4 sm:px-6 pb-6 sm:pb-10">
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
        <Link to="/events" className="inline-flex items-center gap-2 text-xs sm:text-sm text-muted-foreground lg:hover:text-foreground mb-5 sm:mb-8">
          <ArrowLeft className="w-4 h-4" /> {t('eventDetail.backToList')}
        </Link>

        <div className="bg-white rounded-2xl border border-input p-4 sm:p-6 md:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="flex items-center gap-3 text-base text-foreground">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t('events.detailPeriod')}</p>
                <p className="font-medium">{event.startAt} ~ {event.endAt}</p>
              </div>
            </div>
            {event.participantsLabel && (
              <div className="flex items-center gap-3 text-base text-foreground">
                <Users className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('events.detailTarget')}</p>
                  <p className="font-medium">{event.participantsLabel}</p>
                </div>
              </div>
            )}
          </div>

          <h2 className="text-base sm:text-lg font-bold text-foreground mb-3 sm:mb-4">{t('events.detailGuide')}</h2>
          <p className="text-sm sm:text-sm lg:text-base text-foreground leading-relaxed mb-6 sm:mb-10">{event.description}</p>

          <p className="text-xs sm:text-sm text-muted-foreground mb-6 sm:mb-8">
            {t('eventDetail.notifHint')}{' '}
            <Link to="/settings#notifications" className="text-primary font-medium lg:hover:underline">
              {t('notifications.settingsLink')}
            </Link>
          </p>

          {isEnded ? (
            <div className="flex sm:inline-flex items-center justify-center gap-2 px-5 sm:px-8 py-3 sm:py-3.5 bg-muted text-muted-foreground rounded-lg text-sm sm:text-sm font-medium cursor-not-allowed w-full sm:w-auto">
              {t('events.detailEnded')}
            </div>
          ) : (
            <Button
              onClick={handleParticipate}
              className="inline-flex items-center gap-2 px-5 sm:px-8 py-3 sm:py-3.5 bg-foreground text-white rounded-lg text-sm sm:text-sm font-medium lg:hover:bg-foreground/90 transition-colors w-full sm:w-auto justify-center"
            >
              {t('events.participate')}
              <ArrowRight className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      <LoginPromptModal open={loginPromptOpen} onClose={() => setLoginPromptOpen(false)} action="upload" />
    </div>
  );
}
