import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, ArrowLeft, ArrowRight, Users } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { analytics } from '../utils/analytics';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store';
import { LoginPromptModal } from '../components/LoginPromptModal';
import { useI18n } from '../i18n/I18nProvider';

// 이벤트 데이터 (Events.tsx와 공유 — 향후 별도 store로 분리 가능)
export const allEvents = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1758923530822-3e58cf11011e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcnQlMjBleGhpYml0aW9uJTIwYmFubmVyfGVufDF8fHx8MTc3Mjc3MzI4OXww&ixlib=rb-4.1.0&q=80&w=1080',
    title: '나의 첫 디지털 캔버스',
    subtitle: '매일 그리는 나의 소확행',
    description: '신규 가입 후 첫 작품을 업로드해주신 선착순 100분께 스타벅스 아메리카노 기프티콘을 드립니다. 잠자고 있던 나의 첫 캔버스를 지금 채워보세요!',
    period: '2026.05.01 - 2026.05.31',
    participants: '선착순 100명',
    status: 'active' as const,
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1597306957833-433de12c3af6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwYXJ0JTIwc2FsZSUyMHByb21vdGlvbnxlbnwxfHx8fDE3NzI3NzMyODl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    title: '동호회 작품전 참여하기',
    subtitle: '우리 동호회 작품을 세상에 알려보세요',
    description: '동호회나 수업 작품을 올려주신 강사님 중 추첨을 통해 태블릿과 스타일러스를 선물로 드립니다. 수강생 작품을 올리고 함께 성장하세요!',
    period: '2026.05.01 - 2026.06.30',
    participants: '추첨 10명',
    status: 'active' as const,
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1713779490284-a81ff6a8ffae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnQlMjBnYWxsZXJ5JTIwZXhoaWJpdGlvbnxlbnwxfHx8fDE3NzI3MTU0NTN8MA&ixlib=rb-4.1.0&q=80&w=1080',
    title: '수채화 작품전',
    subtitle: '감성 넘치는 수채화 작가들의 작품을 만나보세요',
    description: '다양한 수채화 작가들의 작품을 한자리에서 만나볼 수 있는 온라인 기획전입니다.',
    period: '2026.04.01 - 2026.04.30',
    participants: '참여 작가 30명',
    status: 'upcoming' as const,
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1702325597300-f3d68b5b9499?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcnQlMjBtdXNldW18ZW58MXx8fHwxNzcyNzIwMjk4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    title: '디지털 드로잉 워크샵',
    subtitle: '처음 시작하는 디지털 드로잉 기초 과정',
    description: '디지털 드로잉을 처음 시작하는 분들을 위한 온라인 워크샵입니다. 기초부터 차근차근 배워보세요.',
    period: '2026.04.15 - 2026.04.15',
    participants: '선착순 50명',
    status: 'upcoming' as const,
  },
  {
    id: 6,
    image: 'https://images.unsplash.com/photo-1764709125089-740593af301d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnQlMjBjb2xsZWN0aW9uJTIwZGlzcGxheXxlbnwxfHx8fDE3NzI3NzM1MDZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    title: '작가 네트워킹 데이',
    subtitle: '작가들과 함께하는 소통의 시간',
    description: '작가들이 모여 서로의 작품에 대해 이야기하고, 영감을 주고받는 네트워킹 행사입니다.',
    period: '2026.05.01 - 2026.05.01',
    participants: '참여 작가 20명',
    status: 'upcoming' as const,
  },
];

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const auth = useAuthStore();
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const event = allEvents.find(e => String(e.id) === id);

  useEffect(() => {
    if (id) analytics.eventDetailView(id);
  }, [id]);

  const isEnded = (event as any)?.status === 'ended';

  const handleParticipate = () => {
    if (!auth.isLoggedIn()) {
      setLoginPromptOpen(true);
      return;
    }
    navigate(`/upload?event=${event?.id}&eventTitle=${encodeURIComponent(event?.title || '')}`);
  };

  if (!event) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 sm:px-6 pb-20 md:pb-0">
        <p className="text-lg text-[#71717A] mb-6">이벤트를 찾을 수 없습니다.</p>
        <Link to="/events" className="text-[15px] text-[#6366F1] hover:underline">이벤트 목록으로 돌아가기</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      {/* Hero */}
      <div className="relative h-[250px] sm:h-[350px] lg:h-[400px] overflow-hidden">
        <ImageWithFallback src={event.image} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end px-4 sm:px-6 pb-6 sm:pb-10">
          <div className="mx-auto max-w-[1440px] w-full">
            <span className="inline-block px-4 py-1.5 text-xs font-bold tracking-wider text-white bg-[#6366F1] rounded-full mb-4">
              {event.status === 'active' ? 'EVENT' : 'COMING SOON'}
            </span>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">{event.title}</h1>
            <p className="text-sm sm:text-[15px] lg:text-base text-white/90">{event.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-6 sm:py-12">
        <Link to="/events" className="inline-flex items-center gap-2 text-xs sm:text-sm text-[#71717A] hover:text-[#18181B] mb-5 sm:mb-8">
          <ArrowLeft className="w-4 h-4" /> {t('eventDetail.backToList')}
        </Link>

        <div className="bg-white rounded-2xl border border-[#D1D5DB] p-4 sm:p-6 md:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="flex items-center gap-3 text-[15px] text-[#18181B]">
              <Calendar className="w-5 h-5 text-[#71717A]" />
              <div>
                <p className="text-xs text-[#A1A1AA]">기간</p>
                <p className="font-medium">{event.period}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[15px] text-[#18181B]">
              <Users className="w-5 h-5 text-[#71717A]" />
              <div>
                <p className="text-xs text-[#A1A1AA]">참여 대상</p>
                <p className="font-medium">{event.participants}</p>
              </div>
            </div>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-[#18181B] mb-3 sm:mb-4">이벤트 안내</h2>
          <p className="text-[13px] sm:text-sm lg:text-[15px] text-[#3F3F46] leading-relaxed mb-6 sm:mb-10">{event.description}</p>

          <p className="text-xs sm:text-sm text-[#71717A] mb-6 sm:mb-8">
            {t('eventDetail.notifHint')}{' '}
            <Link to="/settings#notifications" className="text-[#6366F1] font-medium hover:underline">
              {t('notifications.settingsLink')}
            </Link>
          </p>

          {isEnded ? (
            <div className="flex sm:inline-flex items-center justify-center gap-2 px-5 sm:px-8 py-3 sm:py-3.5 bg-gray-200 text-gray-500 rounded-lg text-[13px] sm:text-sm font-medium cursor-not-allowed w-full sm:w-auto">
              참여가 마감된 이벤트입니다
            </div>
          ) : (
            <button
              onClick={handleParticipate}
              className="inline-flex items-center gap-2 px-5 sm:px-8 py-3 sm:py-3.5 bg-[#18181B] text-white rounded-lg text-[13px] sm:text-sm font-medium hover:bg-[#000000] transition-colors w-full sm:w-auto justify-center"
            >
              참여하기
              <ArrowRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <LoginPromptModal open={loginPromptOpen} onClose={() => setLoginPromptOpen(false)} action="upload" />
    </div>
  );
}
