import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, ArrowRight, X, Bell } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { LoginPromptModal } from '../components/LoginPromptModal';
import { useI18n } from '../i18n/I18nProvider';

export default function Events() {
  const navigate = useNavigate();
  const auth = useAuthStore();
  const { t } = useI18n();
  const promotionBanners = useMemo(
    () => [
      {
        id: 1,
        image:
          'https://images.unsplash.com/photo-1758923530822-3e58cf11011e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcnQlMjBleGhpYml0aW9uJTIwYmFubmVyfGVufDF8fHx8MTc3Mjc3MzI4OXww&ixlib=rb-4.1.0&q=80&w=1080',
        title: t('events.promo1Title'),
        subtitle: t('events.promo1Subtitle'),
        description: t('events.promo1Description'),
        period: t('events.promo1Period'),
        participants: t('events.promo1Participants'),
      },
      {
        id: 2,
        image:
          'https://images.unsplash.com/photo-1597306957833-433de12c3af6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwYXJ0JTIwc2FsZSUyMHByb21vdGlvbnxlbnwxfHx8fDE3NzI3NzMyODl8MA&ixlib=rb-4.1.0&q=80&w=1080',
        title: t('events.promo2Title'),
        subtitle: t('events.promo2Subtitle'),
        description: t('events.promo2Description'),
        period: t('events.promo2Period'),
        participants: t('events.promo2Participants'),
      },
    ],
    [t],
  );
  const upcomingEvents = useMemo(
    () => [
      {
        id: 4,
        image:
          'https://images.unsplash.com/photo-1713779490284-a81ff6a8ffae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnQlMjBnYWxsZXJ5JTIwZXhoaWJpdGlvbnxlbnwxfHx8fDE3NzI3MTU0NTN8MA&ixlib=rb-4.1.0&q=80&w=1080',
        title: t('events.up4Title'),
        description: t('events.up4Description'),
        date: t('events.up4Date'),
      },
      {
        id: 5,
        image:
          'https://images.unsplash.com/photo-1702325597300-f3d68b5b9499?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcnQlMjBtdXNldW18ZW58MXx8fHwxNzcyNzIwMjk4fDA&ixlib=rb-4.1.0&q=80&w=1080',
        title: t('events.up5Title'),
        description: t('events.up5Description'),
        date: t('events.up5Date'),
      },
      {
        id: 6,
        image:
          'https://images.unsplash.com/photo-1764709125089-740593af301d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnQlMjBjb2xsZWN0aW9uJTIwZGlzcGxheXxlbnwxfHx8fDE3NzI3NzM1MDZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
        title: t('events.up6Title'),
        description: t('events.up6Description'),
        date: t('events.up6Date'),
      },
    ],
    [t],
  );
  const [currentBanner, setCurrentBanner] = useState(0);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySubmitted, setNotifySubmitted] = useState(false);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);

  const nextBanner = () => {
    setCurrentBanner((prev) => (prev + 1) % promotionBanners.length);
  };

  const prevBanner = () => {
    setCurrentBanner((prev) => (prev - 1 + promotionBanners.length) % promotionBanners.length);
  };

  const currentEvent = promotionBanners[currentBanner];

  const handleNotifySubmit = () => {
    if (notifyEmail.trim()) {
      setNotifySubmitted(true);
      setTimeout(() => {
        setShowNotifyModal(false);
        setNotifySubmitted(false);
        setNotifyEmail('');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 히어로 배너 섹션 */}
      <div className="bg-white">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-4 sm:py-8">
          <h1 className="text-xl sm:text-2xl font-bold text-[#18181B] mb-2">{t('events.title')}</h1>
          <p className="text-sm text-[#71717A] mb-4 sm:mb-8">{t('events.subtitle')}</p>

          <div className="relative group">
            <div className="overflow-hidden rounded-2xl">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentBanner * 100}%)` }}
              >
                {promotionBanners.map((banner) => (
                  <div key={banner.id} className="w-full shrink-0 relative">
                    <div className="relative h-[180px] sm:h-[240px] lg:h-[300px] overflow-hidden">
                      <ImageWithFallback
                        src={banner.image}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />

                      <div className="absolute inset-0 flex flex-col justify-center px-5 sm:px-8 lg:px-10">
                        <div className="max-w-[600px]">
                          <span className="inline-block px-2 py-0.5 sm:px-2.5 sm:py-0.5 text-[10px] sm:text-[11px] font-bold tracking-wider text-white bg-[#6366F1] rounded-full mb-2 sm:mb-3">
                            {t('events.badge')}
                          </span>
                          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2 sm:mb-3 leading-tight">
                            {banner.title}
                          </h2>
                          <p className="text-[13px] sm:text-sm text-white/90 font-normal mb-3 sm:mb-4">
                            {banner.subtitle}
                          </p>
                          <div className="flex items-center gap-4 text-[13px] text-white/85">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{banner.period}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={prevBanner}
              className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-md transition-opacity"
            >
              <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#18181B]" />
            </button>
            <button
              onClick={nextBanner}
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-md transition-opacity"
            >
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#18181B]" />
            </button>

            <div className="absolute bottom-2.5 sm:bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 sm:gap-1.5">
              {promotionBanners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBanner(index)}
                  className={`h-[5px] sm:h-1.5 rounded-full transition-all ${currentBanner === index
                    ? 'w-4 sm:w-5 bg-white'
                    : 'w-[5px] sm:w-1.5 bg-white/50 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 현재 이벤트 상세 정보 */}
      <div className="bg-white">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-4 sm:py-6">
          <div className="max-w-[800px]">
            <h3 className="text-lg font-bold text-[#18181B] mb-4">
              {currentEvent.title}
            </h3>
            <p className="text-[15px] text-[#18181B] leading-relaxed mb-6">
              {currentEvent.description}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/events/${currentEvent.id}`)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#18181B] text-white rounded-lg text-sm font-medium hover:bg-[#000000] transition-colors"
              >
                {t('events.viewDetail')}
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  if (!auth.isLoggedIn()) { setLoginPromptOpen(true); return; }
                  navigate(`/upload?event=${currentEvent.id}&eventTitle=${encodeURIComponent(currentEvent.title)}`);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#18181B] border border-[#D1D5DB] rounded-lg text-sm font-medium hover:bg-[#FAFAFA] transition-colors"
              >
                {t('events.participate')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 예정된 이벤트 */}
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-8 sm:py-12 pb-20 md:pb-12">
        <h2 className="text-lg sm:text-xl font-bold text-[#18181B] mb-4 sm:mb-6">{t('events.upcomingSection')}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {upcomingEvents.map((event) => (
            <div
              key={event.id}
              onClick={() => navigate(`/events/${event.id}`)}
              className="group cursor-pointer overflow-hidden"
            >
              <div className="relative h-[180px] sm:h-[200px] overflow-hidden rounded-sm">
                <ImageWithFallback
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1.5 text-xs font-bold text-white bg-[#6366F1] rounded-full">
                    {t('events.comingSoonBadge')}
                  </span>
                </div>
              </div>

              <div className="pt-2.5 pb-4">
                <div className="flex items-center gap-2 text-sm text-[#71717A] mb-2">
                  <Calendar className="h-[18px] w-[18px]" />
                  <span>{event.date}</span>
                </div>
                <h3 className="text-base font-bold text-[#18181B] mb-2">
                  {event.title}
                </h3>
                <p className="text-[13px] sm:text-sm text-[#71717A] leading-relaxed">
                  {event.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA 섹션 */}
      <div className="bg-[#18181B] text-white">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-10 sm:py-12 text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-3">{t('events.ctaTitle')}</h2>
          <p className="text-[15px] text-white/80 mb-8">{t('events.ctaLead')}</p>
          <button
            onClick={() => setShowNotifyModal(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-[#18181B] rounded-lg text-sm font-bold hover:bg-[#F4F4F5] transition-colors"
          >
            <Bell className="h-5 w-5" />
            {t('events.ctaNotify')}
          </button>
        </div>
      </div>

      <LoginPromptModal open={loginPromptOpen} onClose={() => setLoginPromptOpen(false)} action="upload" />

      {/* 알림 모달 */}
      {showNotifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-md mx-4 relative">
            <button
              onClick={() => { setShowNotifyModal(false); setNotifySubmitted(false); setNotifyEmail(''); }}
              className="absolute top-4 right-4 p-2 hover:bg-[#F4F4F5] rounded-full"
            >
              <X className="h-5 w-5" />
            </button>

            {notifySubmitted ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-4">&#10003;</div>
                <h3 className="text-lg font-bold text-[#18181B] mb-2">{t('events.notifyDoneTitle')}</h3>
                <p className="text-sm text-[#71717A]">{t('events.notifyDoneLead')}</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-[#18181B] mb-2">{t('events.notifyModalTitle')}</h3>
                <p className="text-sm text-[#71717A] mb-6">{t('events.notifyModalLead')}</p>
                <input
                  type="email"
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  placeholder={t('events.notifyEmailPlaceholder')}
                  className="w-full px-4 py-3.5 text-sm border border-[#E5E7EB] rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                  onKeyDown={(e) => e.key === 'Enter' && handleNotifySubmit()}
                />
                <button
                  onClick={handleNotifySubmit}
                  className="w-full py-3.5 bg-[#18181B] text-white rounded-lg text-sm font-bold hover:bg-[#000000] transition-colors"
                >
                  {t('events.notifySubmit')}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
